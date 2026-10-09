from __future__ import annotations

import base64
import io
import json
import math
import os
import re
from dataclasses import replace

import httpx
from PIL import Image, ImageOps

from webdiag_worker.ai import (
    KnownSafeProviderError,
    ProviderOutcomeUnknownError,
    ProviderRequest,
    ProviderResult,
)
from webdiag_worker.artifact_storage import ArtifactStorage, artifact_storage_from_env
from webdiag_worker.image_output import MAX_IMAGE_BYTES, normalize_generated_image
from webdiag_worker.image_requests import (
    image_artifact_output,
    persist_generated_image,
    prepare_image_input,
    validate_image_request,
)

MODEL = "@cf/black-forest-labs/flux-2-klein-4b"
_REJECTED = frozenset({400, 401, 402, 403, 404, 413, 422, 429})
_MAX_RESPONSE_BYTES = 8 * 1024 * 1024


def image_dimensions(aspect: str, quality: str) -> tuple[int, int]:
    ratio = (
        4 / 3
        if aspect == "auto"
        else float(aspect.split(":")[0]) / float(aspect.split(":")[1])
    )
    side = {"auto": 1024, "low": 512, "medium": 1024, "high": 1536}[quality]
    width, height = side * math.sqrt(ratio), side / math.sqrt(ratio)
    scale = min(1, 1920 / max(width, height))
    return tuple(
        max(256, min(1920, round(value * scale / 16) * 16)) for value in (width, height)
    )


def _media_type(data: bytes) -> str:
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"RIFF") and data[8:12] == b"WEBP":
        return "image/webp"
    raise ValueError("unsupported image format")


class CloudflareImageProvider:
    def __init__(
        self,
        client: httpx.Client,
        *,
        account_id: str,
        artifact_storage: ArtifactStorage,
    ):
        if not re.fullmatch(r"[a-fA-F0-9]{32}", account_id):
            raise ValueError(
                "CLOUDFLARE_ACCOUNT_ID must contain 32 hexadecimal characters"
            )
        self._client = client
        self._account_id = account_id
        self._storage = artifact_storage

    @classmethod
    def from_env(
        cls, *, artifact_storage: ArtifactStorage | None = None
    ) -> CloudflareImageProvider:
        account = os.getenv("CLOUDFLARE_ACCOUNT_ID", "").strip()
        token = os.getenv("CLOUDFLARE_API_TOKEN", "").strip()
        if not re.fullmatch(r"[a-fA-F0-9]{32}", account):
            raise RuntimeError(
                "CLOUDFLARE_ACCOUNT_ID must contain 32 hexadecimal characters"
            )
        if not 16 <= len(token) <= 512 or any(
            not 0x21 <= ord(char) <= 0x7E for char in token
        ):
            raise RuntimeError(
                "CLOUDFLARE_API_TOKEN must contain 16 to 512 visible ASCII characters"
            )
        storage = artifact_storage or artifact_storage_from_env()
        return cls(
            httpx.Client(
                headers={"Authorization": f"Bearer {token}"},
                timeout=httpx.Timeout(connect=5, read=120, write=10, pool=5),
                trust_env=False,
            ),
            account_id=account,
            artifact_storage=storage,
        )

    def __enter__(self) -> CloudflareImageProvider:
        return self

    def __exit__(self, *_args: object) -> None:
        self._client.close()

    def prepare(self, request: ProviderRequest) -> ProviderRequest:
        validate_image_request(request, expected_model=MODEL)
        if not callable(getattr(self._storage, "put_reserved", None)):
            raise KnownSafeProviderError("AI image artifact storage is unavailable")
        if request.tool_id != "ai_image_edit_studio":
            return request
        prepared = prepare_image_input(request, self._storage)
        try:
            data_url = prepared.input["_image_data_url"]
            data = base64.b64decode(data_url.split(",", 1)[1], validate=True)
            normalized = normalize_generated_image(
                data, declared_media_type=_media_type(data)
            )
            with Image.open(io.BytesIO(normalized.data)) as source:
                resized = ImageOps.contain(source, (511, 511), Image.Resampling.LANCZOS)
                try:
                    with io.BytesIO() as output:
                        resized.save(output, format="PNG")
                        encoded = base64.b64encode(output.getvalue()).decode("ascii")
                finally:
                    resized.close()
            return replace(
                prepared,
                input=dict(
                    prepared.input, _image_data_url=f"data:image/png;base64,{encoded}"
                ),
            )
        except Exception as error:
            raise KnownSafeProviderError(
                "AI input image could not be prepared"
            ) from error

    def execute(self, request: ProviderRequest) -> ProviderResult:
        validate_image_request(request, expected_model=MODEL)
        if not callable(getattr(self._storage, "put_reserved", None)):
            raise KnownSafeProviderError("AI image artifact storage is unavailable")
        width, height = image_dimensions(
            request.input.get("aspect_ratio", "auto"),
            request.input.get("quality", "medium"),
        )
        files = {
            "prompt": (None, request.input["prompt"]),
            "width": (None, str(width)),
            "height": (None, str(height)),
        }
        if request.tool_id == "ai_image_edit_studio":
            try:
                data_url = request.input["_image_data_url"]
                if (
                    not isinstance(data_url, str)
                    or not data_url.startswith("data:image/png;base64,")
                    or len(data_url) > 6_000_000
                ):
                    raise ValueError("invalid prepared image")
                data = base64.b64decode(data_url.split(",", 1)[1], validate=True)
                normalized = normalize_generated_image(
                    data, declared_media_type="image/png"
                )
                with Image.open(io.BytesIO(normalized.data)) as source:
                    if max(source.size) > 511:
                        raise ValueError("input image exceeds the provider limit")
                files["input_image_0"] = ("input.png", normalized.data, "image/png")
            except Exception as error:
                raise KnownSafeProviderError("AI input image is invalid") from error
        try:
            # Never retry: a timeout or 5xx can follow an accepted generation.
            with self._client.stream(
                "POST",
                f"https://api.cloudflare.com/client/v4/accounts/{self._account_id}/ai/run/{MODEL}",
                files=files,
                follow_redirects=False,
            ) as response:
                if response.status_code in _REJECTED:
                    raise KnownSafeProviderError(
                        "AI image provider rejected the request"
                    )
                if response.status_code != 200:
                    raise ProviderOutcomeUnknownError(
                        "AI image provider outcome is unknown"
                    )
                content = bytearray()
                for chunk in response.iter_bytes(chunk_size=64 * 1024):
                    if len(content) + len(chunk) > _MAX_RESPONSE_BYTES:
                        raise ProviderOutcomeUnknownError(
                            "AI image response exceeds the size limit"
                        )
                    content.extend(chunk)
                provider_id = response.headers.get("cf-ray")
            body = json.loads(content)
            if not isinstance(body, dict) or body.get("success") is not True:
                raise ValueError("invalid provider response")
            result = body.get("result")
            if not isinstance(result, dict) or "url" in result:
                raise ValueError("invalid inline image result")
            encoded = result.get("image")
            if (
                not isinstance(encoded, str)
                or not encoded
                or len(encoded) > 4 * ((MAX_IMAGE_BYTES + 2) // 3)
            ):
                raise ValueError("invalid inline image size")
            data = base64.b64decode(encoded, validate=True)
            normalized = normalize_generated_image(
                data, declared_media_type=_media_type(data)
            )
            artifact = persist_generated_image(
                request.artifact_reservation, self._storage, normalized
            )
            return ProviderResult(
                output=image_artifact_output(artifact),
                artifact=artifact,
                provider_request_id=provider_id,
                provider_cost_nano_usd=None,
            )
        except (KnownSafeProviderError, ProviderOutcomeUnknownError):
            raise
        except Exception as error:
            raise ProviderOutcomeUnknownError(
                "AI image provider outcome is unknown"
            ) from error
