from __future__ import annotations

import base64
import binascii
import json
import math
import os
import time
from collections.abc import Callable
from decimal import Decimal
from email.utils import parsedate_to_datetime

import httpx

from webdiag_worker.ai import (
    KnownSafeProviderError,
    ProviderOutcomeUnknownError,
    ProviderRequest,
    ProviderResult,
)
from webdiag_worker.artifact_storage import ArtifactStorage, artifact_storage_from_env
from webdiag_worker.image_output import MAX_IMAGE_BYTES, normalize_generated_image
from webdiag_worker.image_requests import (
    IMAGE_SIZES as _IMAGE_SIZES,
    image_artifact_output,
    persist_generated_image,
    prepare_image_input,
    validate_image_request,
)


from webdiag_worker.text_requests import (
    TEXT_TOOL_POLICIES as _TOOL_POLICIES,
    text_messages as _messages,
    parse_text_output as _parsed_output,
    schema_output as _schema_output,
)

_MODEL = "openai/gpt-6-luna"
_PROVIDER = "vercel"
_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1"
_REASONING_EFFORT = "medium"
_GATEWAY_CHAT_URL = "https://ai-gateway.vercel.sh/v1/chat/completions"
_CHAT_RESPONSE_MAX_BYTES = 2 * 1024 * 1024
_RESPONSE_CHUNK_BYTES = 64 * 1024

_KNOWN_REJECTED_STATUS_CODES = frozenset({400, 401, 402, 403, 404, 413, 422, 429})
_MAX_ATTEMPTS = 3
_IMAGE_MODEL = "openai/gpt-image-2"
_IMAGE_TOOLS = frozenset({"ai_image_studio", "ai_image_edit_studio"})
_IMAGE_RESPONSE_MAX_BYTES = 8 * 1024 * 1024
# GPT Image 2 permits multiples of 16, ratios up to 3:1 and >=655,360 pixels.


class VercelAIGatewayProvider:
    def __init__(
        self,
        client: httpx.Client,
        *,
        artifact_storage: ArtifactStorage | None = None,
        require_zdr: bool = True,
        sleep: Callable[[float], None] = time.sleep,
        now: Callable[[], float] = time.time,
    ) -> None:
        self._client = client
        self._artifact_storage = artifact_storage
        self._require_zdr = require_zdr
        self._sleep = sleep
        self._now = now

    @classmethod
    def from_env(
        cls,
        *,
        artifact_storage: ArtifactStorage | None = None,
    ) -> VercelAIGatewayProvider:
        expected_configuration = {
            "AI_PROVIDER": _PROVIDER,
            "AI_GATEWAY_BASE_URL": _GATEWAY_BASE_URL,
            "AI_MODEL": _MODEL,
            "AI_REASONING_EFFORT": _REASONING_EFFORT,
        }
        for name, expected in expected_configuration.items():
            if os.getenv(name, expected).strip() != expected:
                raise RuntimeError(f"{name} must be {expected}")
        raw_require_zdr = os.getenv("WEBDIAG_AI_REQUIRE_ZDR", "true").strip().lower()
        if raw_require_zdr not in {"true", "false"}:
            raise RuntimeError("WEBDIAG_AI_REQUIRE_ZDR must be true or false")
        api_key = (
            os.getenv("AI_GATEWAY_API_KEY")
            or os.getenv("OPENAI_API_KEY")
            or os.getenv("LLM_API_KEY")
            or os.getenv("AI_API_KEY")
            or ""
        )
        if not 16 <= len(api_key) <= 512 or any(
            character.isspace() or not character.isascii() for character in api_key
        ):
            raise RuntimeError(
                "AI_GATEWAY_API_KEY must contain 16 to 512 visible ASCII characters"
            )
        timeout = httpx.Timeout(
            connect=5,
            read=120,
            write=10,
            pool=5,
        )
        return cls(
            httpx.Client(
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                timeout=timeout,
                trust_env=False,
            ),
            artifact_storage=artifact_storage,
            require_zdr=raw_require_zdr == "true",
        )

    def __enter__(self) -> VercelAIGatewayProvider:
        return self

    def __exit__(self, *_args: object) -> None:
        self._client.close()

    def execute(self, request: ProviderRequest) -> ProviderResult:
        if request.tool_id in _IMAGE_TOOLS:
            return self._execute_image(request)
        policy = _TOOL_POLICIES.get(request.tool_id)
        if (
            policy is None
            or request.contract_version != "v1"
            or request.model_policy != _MODEL
            or request.safety_identifier is None
        ):
            raise KnownSafeProviderError("AI provider request was rejected locally")
        try:
            status_code, response_content = self._post_bounded(
                _GATEWAY_CHAT_URL,
                payload={
                    "model": _MODEL,
                    "messages": _messages(request, policy),
                    "response_format": {
                        "type": "json_schema",
                        "json_schema": {
                            "name": request.tool_id,
                            "strict": True,
                            "schema": policy.output_model.model_json_schema(),
                        },
                    },
                    "max_tokens": policy.max_output_tokens,
                    "reasoning": {"effort": _REASONING_EFFORT},
                    "stream": False,
                    "user": request.safety_identifier,
                    **(
                        {"providerOptions": {"gateway": {"zeroDataRetention": True}}}
                        if self._require_zdr
                        else {}
                    ),
                },
                max_response_bytes=_CHAT_RESPONSE_MAX_BYTES,
            )
        except (httpx.TimeoutException, httpx.TransportError) as error:
            raise ProviderOutcomeUnknownError(
                "AI provider outcome is unknown"
            ) from error
        if status_code in _KNOWN_REJECTED_STATUS_CODES:
            raise KnownSafeProviderError("AI provider rejected the request")
        if status_code != 200 or response_content is None:
            raise ProviderOutcomeUnknownError("AI provider outcome is unknown")
        try:
            body = json.loads(response_content, parse_float=Decimal)
            if not isinstance(body, dict) or body.get("model") != _MODEL:
                raise ValueError("invalid provider response model")
            parsed = _parsed_output(body, policy.output_model)
            provider_request_id = _provider_request_id(body)
            input_units, output_units, provider_cost_nano_usd = _provider_usage(body)
        except KnownSafeProviderError:
            raise
        except (
            ValueError,
            TypeError,
            KeyError,
            IndexError,
            json.JSONDecodeError,
        ) as error:
            raise ProviderOutcomeUnknownError(
                "AI provider response is invalid"
            ) from error
        output = parsed.model_dump(mode="json")
        if request.tool_id == "ai_schema_studio":
            output = _schema_output(request.input, output)
        return ProviderResult(
            output=output,
            provider_request_id=provider_request_id,
            input_units=input_units,
            output_units=output_units,
            provider_cost_nano_usd=provider_cost_nano_usd,
        )

    def _execute_image(self, request: ProviderRequest) -> ProviderResult:
        payload = _image_payload(request)
        reservation = request.artifact_reservation
        assert reservation is not None  # Validated before any provider request.
        storage = self._image_storage()
        endpoint = (
            "edits" if request.tool_id == "ai_image_edit_studio" else "generations"
        )
        try:
            # A timeout or 5xx may occur after a paid generation was accepted. Never retry.
            with self._client.stream(
                "POST",
                f"{_GATEWAY_BASE_URL}/images/{endpoint}",
                json=payload,
                follow_redirects=False,
            ) as response:
                if response.status_code in _KNOWN_REJECTED_STATUS_CODES:
                    raise KnownSafeProviderError(
                        "AI provider rejected the image request"
                    )
                if response.status_code != 200:
                    raise ProviderOutcomeUnknownError(
                        "AI image provider outcome is unknown"
                    )
                content = bytearray()
                for chunk in response.iter_bytes(chunk_size=_RESPONSE_CHUNK_BYTES):
                    if len(content) + len(chunk) > _IMAGE_RESPONSE_MAX_BYTES:
                        raise ProviderOutcomeUnknownError(
                            "AI image provider response is too large"
                        )
                    content.extend(chunk)
            body = json.loads(content, parse_float=Decimal)
            if (
                not isinstance(body, dict)
                or body.get("model", _IMAGE_MODEL) != _IMAGE_MODEL
            ):
                raise ValueError("invalid image response model")
            images = body.get("data")
            if (
                not isinstance(images, list)
                or len(images) != 1
                or not isinstance(images[0], dict)
            ):
                raise ValueError("invalid image response data")
            encoded = images[0].get("b64_json")
            if (
                not isinstance(encoded, str)
                or not encoded
                or len(encoded) > 4 * ((MAX_IMAGE_BYTES + 2) // 3)
                or "url" in images[0]
            ):
                raise ValueError("invalid inline image response")
            generated = normalize_generated_image(
                base64.b64decode(encoded, validate=True),
                declared_media_type="image/png",
            )
            input_units, output_units, cost = _image_provider_usage(body)
            provider_request_id = _provider_request_id(body) if "id" in body else None
            artifact = persist_generated_image(reservation, storage, generated)
            return ProviderResult(
                output=image_artifact_output(artifact),
                provider_request_id=provider_request_id,
                input_units=input_units,
                output_units=output_units,
                provider_cost_nano_usd=cost,
                artifact=artifact,
            )
        except KnownSafeProviderError:
            raise
        except ProviderOutcomeUnknownError:
            raise
        except Exception as error:
            raise ProviderOutcomeUnknownError(
                "AI image provider outcome is unknown"
            ) from error

    def _image_storage(self) -> ArtifactStorage:
        try:
            if self._artifact_storage is None:
                self._artifact_storage = artifact_storage_from_env()
            if not callable(getattr(self._artifact_storage, "put_reserved", None)):
                raise ValueError("reserved artifact writes are unavailable")
            return self._artifact_storage
        except Exception as error:
            raise KnownSafeProviderError(
                "AI image artifact storage is unavailable"
            ) from error

    def _post_bounded(
        self,
        url: str,
        *,
        payload: dict[str, object],
        max_response_bytes: int,
    ) -> tuple[int, bytes | None]:
        for attempt in range(_MAX_ATTEMPTS):
            with self._client.stream(
                "POST",
                url,
                json=payload,
                follow_redirects=False,
            ) as response:
                if response.status_code != 200:
                    # Only a known rejected rate-limit request may be resubmitted.
                    if response.status_code == 429 and attempt + 1 < _MAX_ATTEMPTS:
                        self._sleep(
                            _retry_delay(
                                response.headers.get("Retry-After"),
                                attempt,
                                now=self._now(),
                            )
                        )
                        continue
                    return response.status_code, None
                content = bytearray()
                for chunk in response.iter_bytes(chunk_size=_RESPONSE_CHUNK_BYTES):
                    if len(content) + len(chunk) > max_response_bytes:
                        raise ProviderOutcomeUnknownError(
                            "AI provider response is too large"
                        )
                    content.extend(chunk)
                return response.status_code, bytes(content)
        raise RuntimeError("unreachable AI provider retry state")

    def prepare(self, request: ProviderRequest) -> ProviderRequest:
        if request.tool_id in _IMAGE_TOOLS:
            validate_image_request(request, expected_model=_IMAGE_MODEL)
            self._image_storage()
        if request.tool_id not in {"ai_alt_text_studio", "ai_image_edit_studio"}:
            return request
        return prepare_image_input(request, self._artifact_storage)


def _image_payload(request: ProviderRequest) -> dict[str, object]:
    validate_image_request(request, expected_model=_IMAGE_MODEL)
    value = request.input
    payload: dict[str, object] = {
        "model": _IMAGE_MODEL,
        "prompt": value["prompt"],
        "n": 1,
        "size": _IMAGE_SIZES[value.get("aspect_ratio", "auto")],
        "quality": value.get("quality", "medium"),
        "background": value.get("background", "auto"),
        "output_format": "png",
        "user": request.safety_identifier,
    }
    if request.tool_id == "ai_image_edit_studio":
        data_url = value.get("_image_data_url")
        if (
            not isinstance(data_url, str)
            or len(data_url) > 6_000_000
            or not data_url.startswith(
                (
                    "data:image/png;base64,",
                    "data:image/jpeg;base64,",
                    "data:image/webp;base64,",
                )
            )
        ):
            raise KnownSafeProviderError("AI image input is not prepared")
        try:
            source = base64.b64decode(data_url.split(",", 1)[1], validate=True)
            if not 1 <= len(source) <= MAX_IMAGE_BYTES:
                raise ValueError("invalid prepared image size")
        except (ValueError, binascii.Error) as error:
            raise KnownSafeProviderError("AI image input is not prepared") from error
        payload["images"] = [{"image_url": data_url}]
    return payload


def _retry_delay(retry_after: str | None, attempt: int, *, now: float) -> float:
    if retry_after is not None:
        try:
            seconds = float(retry_after)
        except ValueError:
            try:
                retry_at = parsedate_to_datetime(retry_after)
                seconds = retry_at.timestamp() - now
            except (TypeError, ValueError, OverflowError):
                seconds = -1
        if math.isfinite(seconds) and seconds >= 0:
            return min(seconds, 30.0)
    return 0.25 * (2**attempt)


def _provider_request_id(body: object) -> str:
    if not isinstance(body, dict):
        raise ValueError("invalid provider response")
    value = body.get("id")
    if not isinstance(value, str) or not 1 <= len(value) <= 200:
        raise ValueError("invalid provider generation ID")
    return value


def _cost_to_nano_usd(cost: Decimal) -> int:
    _sign, digits, exponent = cost.as_tuple()
    first_nonzero = next((index for index, digit in enumerate(digits) if digit), None)
    if first_nonzero is None:
        return 0
    significant = digits[first_nonzero:]
    integer_digits = len(significant) + exponent + 9
    if integer_digits <= 0:
        return 1
    if integer_digits >= len(significant):
        return int("".join(str(digit) for digit in significant)) * (
            10 ** (integer_digits - len(significant))
        )
    whole = int("".join(str(digit) for digit in significant[:integer_digits]))
    if any(significant[integer_digits:]):
        whole += 1
    return whole


def _provider_usage(body: object) -> tuple[int, int, int]:
    if not isinstance(body, dict):
        raise ValueError("invalid provider response")
    usage = body.get("usage")
    if not isinstance(usage, dict):
        raise ValueError("invalid provider usage")
    values = (usage.get("prompt_tokens"), usage.get("completion_tokens"))
    if any(
        isinstance(value, bool)
        or not isinstance(value, int)
        or not 0 <= value <= 1_000_000_000
        for value in values
    ):
        raise ValueError("invalid provider usage")
    raw_cost = usage.get("cost")
    if isinstance(raw_cost, bool) or not isinstance(raw_cost, (int, Decimal)):
        raise ValueError("invalid provider cost")
    cost = Decimal(raw_cost)
    if not cost.is_finite() or cost < 0 or cost > Decimal("1000"):
        raise ValueError("invalid provider cost")
    nano_usd = _cost_to_nano_usd(cost)
    return values[0], values[1], nano_usd


def _image_provider_usage(body: dict[str, object]) -> tuple[int, int, int | None]:
    # Images API reports input/output tokens; Gateway cost is optional metadata.
    usage = body.get("usage")
    if not isinstance(usage, dict):
        raise ValueError("image usage is unavailable")
    values = (usage.get("input_tokens"), usage.get("output_tokens"))
    if any(
        isinstance(value, bool)
        or not isinstance(value, int)
        or not 0 <= value <= 1_000_000_000
        for value in values
    ):
        raise ValueError("invalid image provider usage")
    if "cost" not in usage:
        return values[0], values[1], None
    return _provider_usage(
        {
            "usage": {
                "prompt_tokens": values[0],
                "completion_tokens": values[1],
                "cost": usage["cost"],
            }
        }
    )
