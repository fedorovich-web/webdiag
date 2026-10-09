from __future__ import annotations

import json
import re

import httpx

from webdiag_worker.ai import (
    KnownSafeProviderError,
    ProviderOutcomeUnknownError,
    ProviderRequest,
    ProviderResult,
)
from webdiag_worker.artifact_storage import ArtifactStorage, artifact_storage_from_env
from webdiag_worker.cloudflare_client import cloudflare_client_from_env
from webdiag_worker.image_requests import prepare_image_input
from webdiag_worker.text_requests import (
    TEXT_TOOL_POLICIES,
    parse_text_output,
    schema_output,
    text_messages,
)

MODEL = "@cf/qwen/qwen3.8-27b"
_MAX_RESPONSE_BYTES = 2 * 1024 * 1024
_REJECTED = frozenset({400, 401, 402, 403, 404, 413, 422, 429})


class CloudflareTextProvider:
    def __init__(
        self,
        client: httpx.Client,
        *,
        account_id: str,
        artifact_storage: ArtifactStorage | None = None,
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
    ) -> CloudflareTextProvider:
        account, client = cloudflare_client_from_env()
        return cls(client, account_id=account, artifact_storage=artifact_storage)

    def __enter__(self) -> CloudflareTextProvider:
        return self

    def __exit__(self, *_args: object) -> None:
        self._client.close()

    def prepare(self, request: ProviderRequest) -> ProviderRequest:
        self._validate(request)
        if request.tool_id != "ai_alt_text_studio":
            return request
        try:
            if self._storage is None:
                self._storage = artifact_storage_from_env()
            return prepare_image_input(request, self._storage)
        except KnownSafeProviderError:
            raise
        except Exception as error:
            raise KnownSafeProviderError(
                "AI input image could not be prepared"
            ) from error

    @staticmethod
    def _validate(request: ProviderRequest) -> None:
        if (
            request.tool_id not in TEXT_TOOL_POLICIES
            or request.contract_version != "v1"
            or request.model_policy != MODEL
            or not isinstance(request.safety_identifier, str)
            or not 32 <= len(request.safety_identifier) <= 64
            or any(not 0x21 <= ord(char) <= 0x7E for char in request.safety_identifier)
        ):
            raise KnownSafeProviderError("AI provider request was rejected locally")

    def execute(self, request: ProviderRequest) -> ProviderResult:
        self._validate(request)
        policy = TEXT_TOOL_POLICIES[request.tool_id]
        payload = {
            "model": MODEL,
            "messages": text_messages(request, policy),
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": request.tool_id,
                    "strict": True,
                    "schema": policy.output_model.model_json_schema(),
                },
            },
            "max_completion_tokens": policy.max_output_tokens,
            "reasoning_effort": "low",
            "stream": False,
            "store": False,
            "user": request.safety_identifier,
        }
        try:
            # Never retry an ambiguous response; quota exhaustion also fails explicitly.
            with self._client.stream(
                "POST",
                f"https://api.cloudflare.com/client/v4/accounts/{self._account_id}/ai/v1/chat/completions",
                json=payload,
                follow_redirects=False,
            ) as response:
                if response.status_code in _REJECTED:
                    raise KnownSafeProviderError("AI provider rejected the request")
                if response.status_code != 200:
                    raise ProviderOutcomeUnknownError("AI provider outcome is unknown")
                content = bytearray()
                for chunk in response.iter_bytes(chunk_size=64 * 1024):
                    if len(content) + len(chunk) > _MAX_RESPONSE_BYTES:
                        raise ProviderOutcomeUnknownError(
                            "AI provider response is too large"
                        )
                    content.extend(chunk)
            body = json.loads(content)
            if not isinstance(body, dict) or body.get("model") != MODEL:
                raise ValueError("invalid provider model")
            parsed = parse_text_output(body, policy.output_model)
            request_id = body.get("id")
            if not isinstance(request_id, str) or not 1 <= len(request_id) <= 200:
                raise ValueError("invalid provider request ID")
            usage = body.get("usage")
            if not isinstance(usage, dict):
                raise ValueError("provider usage is unavailable")
            counts = (usage.get("prompt_tokens"), usage.get("completion_tokens"))
            if any(
                isinstance(v, bool)
                or not isinstance(v, int)
                or not 0 <= v <= 1_000_000_000
                for v in counts
            ):
                raise ValueError("invalid provider usage")
            output = parsed.model_dump(mode="json")
            if request.tool_id == "ai_schema_studio":
                output = schema_output(request.input, output)
            # Neurons are a usage unit, not a receipt for a dollar charge.
            return ProviderResult(
                output=output,
                provider_request_id=request_id,
                input_units=counts[0],
                output_units=counts[1],
                provider_cost_nano_usd=None,
            )
        except (KnownSafeProviderError, ProviderOutcomeUnknownError):
            raise
        except Exception as error:
            raise ProviderOutcomeUnknownError(
                "AI provider response is invalid or unknown"
            ) from error
