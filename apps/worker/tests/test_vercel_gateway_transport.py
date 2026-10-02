from __future__ import annotations

import json
import hashlib
from datetime import UTC, datetime
from decimal import Decimal
from email.utils import format_datetime

import httpx
import pytest

from webdiag_worker.ai import (
    KnownSafeProviderError,
    ProviderOutcomeUnknownError,
    ProviderRequest,
)
from webdiag_worker.vercel_gateway_provider import (
    VercelAIGatewayProvider as ProviderUnderTest,
)
import webdiag_worker.vercel_gateway_provider as provider_module


MODEL = "openai/gpt-5.6-sol"
GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions"


def _input() -> dict[str, object]:
    return {
        "locale": "en",
        "target_origin": "https://example.com",
        "score": 74,
        "checks": [
            {
                "check_id": "metadata.title",
                "name": "Title tag",
                "category": "seo",
                "status": "warning",
            }
        ],
        "issues": [
            {
                "issue_id": "metadata.title.missing",
                "check_id": "metadata.title",
                "category": "seo",
                "severity": "warning",
                "priority": "high",
                "title": "Title tag is missing",
                "description": "The deterministic scanner found no title tag.",
                "affected_urls": ["https://example.com/"],
                "recommendation": {
                    "summary": "Add a descriptive title tag.",
                    "steps": ["Add one title element to the document head."],
                    "expected_impact": "The title check can pass on the next audit.",
                },
            }
        ],
    }


def _output() -> dict[str, object]:
    return {
        "summary": "Fix the missing title first.",
        "actions": [
            {
                "issue_ids": ["metadata.title.missing"],
                "title": "Add the page title",
                "rationale": "The deterministic audit reports a missing title.",
                "steps": ["Add one descriptive title element."],
                "verification": "Run the deterministic title check again.",
                "affected_urls": ["https://example.com/"],
            }
        ],
    }


def _response() -> dict[str, object]:
    return {
        "id": "gen_gateway_123",
        "model": MODEL,
        "choices": [
            {
                "finish_reason": "stop",
                "message": {
                    "content": json.dumps(_output()),
                    "refusal": None,
                    "role": "assistant",
                },
            }
        ],
        "usage": {
            "prompt_tokens": 120,
            "completion_tokens": 42,
            "total_tokens": 162,
            "cost": 0.00123,
        },
    }


def _request(*, model_policy: str = MODEL) -> ProviderRequest:
    return ProviderRequest(
        run_id="11111111-1111-4111-8111-111111111111",
        tool_id="ai_audit_action_plan",
        contract_version="v1",
        model_policy=model_policy,
        input=_input(),
        safety_identifier="opaque-safety-identifier-value-1234567890",
    )


def _provider(
    handler,
    *,
    sleep=lambda _seconds: None,
    now=lambda: 0.0,
    artifact_storage=None,
) -> ProviderUnderTest:
    client = httpx.Client(
        transport=httpx.MockTransport(handler),
        headers={"Authorization": "Bearer test-gateway-key"},
    )
    return ProviderUnderTest(
        client,
        sleep=sleep,
        now=now,
        artifact_storage=artifact_storage,
    )


def _gateway_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AI_PROVIDER", "vercel")
    monkeypatch.setenv("AI_GATEWAY_API_KEY", "test-gateway-key-with-safe-length")
    monkeypatch.setenv("AI_GATEWAY_BASE_URL", "https://ai-gateway.vercel.sh/v1")
    monkeypatch.setenv("AI_MODEL", MODEL)
    monkeypatch.setenv("AI_REASONING_EFFORT", "medium")


def test_from_env_accepts_only_the_central_gateway_configuration(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _gateway_environment(monkeypatch)
    captured: dict[str, object] = {}

    class CapturedClient:
        def __init__(self, **kwargs: object) -> None:
            captured.update(kwargs)

        def close(self) -> None:
            return None

    monkeypatch.setattr(provider_module.httpx, "Client", CapturedClient)

    with ProviderUnderTest.from_env():
        pass

    assert captured["trust_env"] is False
    assert captured["headers"] == {
        "Authorization": "Bearer test-gateway-key-with-safe-length",
        "Content-Type": "application/json",
    }


def test_from_env_rejects_implausibly_short_gateway_key(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _gateway_environment(monkeypatch)
    monkeypatch.setenv("AI_GATEWAY_API_KEY", "short")

    with pytest.raises(RuntimeError, match="AI_GATEWAY_API_KEY"):
        ProviderUnderTest.from_env()


@pytest.mark.parametrize(
    ("name", "value"),
    (
        ("AI_PROVIDER", "openrouter"),
        ("AI_GATEWAY_BASE_URL", "https://attacker.example/v1"),
        ("AI_MODEL", "google/gemini-3-flash"),
        ("AI_REASONING_EFFORT", "low"),
    ),
)
def test_from_env_rejects_provider_policy_overrides(
    monkeypatch: pytest.MonkeyPatch,
    name: str,
    value: str,
) -> None:
    _gateway_environment(monkeypatch)
    monkeypatch.setenv(name, value)

    with pytest.raises(RuntimeError, match=name):
        ProviderUnderTest.from_env()


def test_gateway_sends_one_strict_request_for_the_complete_audit() -> None:
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(200, json=_response())

    result = _provider(handler).execute(_request())

    assert result.output == _output()
    assert result.provider_request_id == "gen_gateway_123"
    assert (result.input_units, result.output_units) == (120, 42)
    assert result.provider_cost_nano_usd == 1_230_000
    assert len(requests) == 1
    assert str(requests[0].url) == GATEWAY_URL
    assert requests[0].headers["authorization"] == "Bearer test-gateway-key"
    sent = json.loads(requests[0].content)
    assert sent["model"] == MODEL
    assert sent["reasoning"] == {"effort": "medium"}
    assert sent["providerOptions"] == {"gateway": {"zeroDataRetention": True}}
    assert "models" not in sent["providerOptions"]["gateway"]
    assert sent["stream"] is False
    assert sent["user"] == "opaque-safety-identifier-value-1234567890"
    assert sent["response_format"]["type"] == "json_schema"
    assert sent["response_format"]["json_schema"]["strict"] is True
    assert sent["response_format"]["json_schema"]["schema"]["additionalProperties"] is False
    assert json.loads(sent["messages"][1]["content"]) == _input()
    assert "test-gateway-key" not in requests[0].content.decode()


def test_gateway_requires_reported_bounded_cost() -> None:
    body = _response()
    del body["usage"]["cost"]

    with pytest.raises(ProviderOutcomeUnknownError, match="response is invalid"):
        _provider(lambda _request: httpx.Response(200, json=body)).execute(_request())


@pytest.mark.parametrize(
    ("cost", "expected_nano_usd"),
    ((0, 0), (0.0000000001, 1), (0.000000012, 12)),
)
def test_gateway_converts_cost_conservatively(
    cost: float | int,
    expected_nano_usd: int,
) -> None:
    body = _response()
    body["usage"]["cost"] = cost

    result = _provider(lambda _request: httpx.Response(200, json=body)).execute(
        _request()
    )

    assert result.provider_cost_nano_usd == expected_nano_usd


@pytest.mark.parametrize(
    ("cost", "expected_nano_usd"),
    (
        ("1.00000000000000000000000000001", 1_000_000_001),
        ("1e-999999999", 1),
    ),
)
def test_gateway_cost_conversion_is_exact_beyond_decimal_context(
    cost: str,
    expected_nano_usd: int,
) -> None:
    _input_units, _output_units, actual = provider_module._provider_usage(
        {
            "usage": {
                "prompt_tokens": 1,
                "completion_tokens": 1,
                "cost": Decimal(cost),
            }
        }
    )

    assert actual == expected_nano_usd


@pytest.mark.parametrize("cost", (True, "0.01", -0.01, 1000.000000001))
def test_gateway_rejects_invalid_reported_cost(cost: object) -> None:
    body = _response()
    body["usage"]["cost"] = cost

    with pytest.raises(ProviderOutcomeUnknownError, match="response is invalid"):
        _provider(lambda _request: httpx.Response(200, json=body)).execute(_request())


def test_gateway_retries_429_and_honors_retry_after() -> None:
    attempts = 0
    delays: list[float] = []

    def handler(_request: httpx.Request) -> httpx.Response:
        nonlocal attempts
        attempts += 1
        if attempts == 1:
            return httpx.Response(429, headers={"Retry-After": "2"})
        return httpx.Response(200, json=_response())

    result = _provider(handler, sleep=delays.append).execute(_request())

    assert result.output == _output()
    assert attempts == 2
    assert delays == [2.0]


def test_gateway_honors_retry_after_http_date() -> None:
    attempts = 0
    delays: list[float] = []
    now = datetime(2026, 9, 12, 10, 0, tzinfo=UTC)

    def handler(_request: httpx.Request) -> httpx.Response:
        nonlocal attempts
        attempts += 1
        if attempts == 1:
            return httpx.Response(
                503,
                headers={"Retry-After": format_datetime(now.replace(second=7), usegmt=True)},
            )
        return httpx.Response(200, json=_response())

    result = _provider(
        handler,
        sleep=delays.append,
        now=now.timestamp,
    ).execute(_request())

    assert result.output == _output()
    assert attempts == 2
    assert delays == [7.0]


def test_gateway_caps_retry_after_to_keep_total_wait_bounded() -> None:
    attempts = 0
    delays: list[float] = []

    def handler(_request: httpx.Request) -> httpx.Response:
        nonlocal attempts
        attempts += 1
        return httpx.Response(429, headers={"Retry-After": "120"})

    with pytest.raises(KnownSafeProviderError, match="rejected"):
        _provider(handler, sleep=delays.append).execute(_request())
    assert attempts == 3
    assert delays == [30.0, 30.0]


@pytest.mark.parametrize("status_code", (400, 401, 402, 403, 404, 413, 422))
def test_gateway_does_not_retry_client_or_authentication_errors(status_code: int) -> None:
    attempts = 0

    def handler(_request: httpx.Request) -> httpx.Response:
        nonlocal attempts
        attempts += 1
        return httpx.Response(status_code)

    with pytest.raises(KnownSafeProviderError, match="rejected"):
        _provider(handler).execute(_request())
    assert attempts == 1


@pytest.mark.parametrize("status_code", (408, 409))
def test_gateway_does_not_retry_non_transient_ambiguous_errors(
    status_code: int,
) -> None:
    attempts = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal attempts
        attempts += 1
        return httpx.Response(
            status_code,
            request=request,
            json={"error": {"message": "provider secret detail"}},
        )

    with pytest.raises(ProviderOutcomeUnknownError) as caught:
        _provider(handler).execute(_request())
    assert attempts == 1
    assert "provider secret detail" not in str(caught.value)


def test_gateway_retries_transient_server_errors_only_within_the_fixed_bound() -> None:
    attempts = 0
    delays: list[float] = []

    def handler(_request: httpx.Request) -> httpx.Response:
        nonlocal attempts
        attempts += 1
        return httpx.Response(503)

    with pytest.raises(ProviderOutcomeUnknownError, match="outcome is unknown"):
        _provider(handler, sleep=delays.append).execute(_request())
    assert attempts == 3
    assert delays == [0.25, 0.5]


def test_gateway_retries_transient_network_errors() -> None:
    attempts = 0
    delays: list[float] = []

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal attempts
        attempts += 1
        if attempts < 3:
            raise httpx.ConnectError("synthetic transient", request=request)
        return httpx.Response(200, json=_response())

    result = _provider(handler, sleep=delays.append).execute(_request())

    assert result.output == _output()
    assert attempts == 3
    assert delays == [0.25, 0.5]


def test_gateway_rejects_worker_supplied_model_override_before_http() -> None:
    def handler(_request: httpx.Request) -> httpx.Response:
        raise AssertionError("provider HTTP must not run")

    with pytest.raises(KnownSafeProviderError, match="rejected locally"):
        _provider(handler).execute(_request(model_policy="google/gemini-3-flash"))


def test_gateway_rejects_response_from_a_different_model() -> None:
    body = _response()
    body["model"] = "openai/gpt-5.6-luna"

    with pytest.raises(ProviderOutcomeUnknownError, match="response is invalid"):
        _provider(lambda _request: httpx.Response(200, json=body)).execute(_request())


def test_gateway_rejects_truncated_structured_output() -> None:
    body = _response()
    body["choices"][0]["finish_reason"] = "length"

    with pytest.raises(ProviderOutcomeUnknownError, match="response is invalid"):
        _provider(lambda _request: httpx.Response(200, json=body)).execute(_request())


def test_gateway_rejects_unknown_tool_and_missing_safety_identifier_before_http() -> None:
    attempts = 0

    def handler(_request: httpx.Request) -> httpx.Response:
        nonlocal attempts
        attempts += 1
        return httpx.Response(200, json=_response())

    provider = _provider(handler)
    invalid_requests = (
        ProviderRequest(
            run_id="11111111-1111-4111-8111-111111111111",
            tool_id="ai_unknown",
            contract_version="v1",
            model_policy=MODEL,
            input={},
            safety_identifier="opaque-safety-identifier-value-1234567890",
        ),
        ProviderRequest(
            run_id="11111111-1111-4111-8111-111111111111",
            tool_id="ai_audit_action_plan",
            contract_version="v1",
            model_policy=MODEL,
            input=_input(),
            safety_identifier=None,
        ),
    )

    for request in invalid_requests:
        with pytest.raises(KnownSafeProviderError, match="rejected locally"):
            provider.execute(request)
    assert attempts == 0


def test_gateway_prepares_owned_image_for_alt_text_without_exposing_storage_key() -> None:
    image = b"synthetic-image-bytes"
    reads: list[tuple[str, int]] = []
    requests: list[httpx.Request] = []

    class Storage:
        def read(self, *, object_key: str, max_bytes: int) -> bytes:
            reads.append((object_key, max_bytes))
            return image

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(
            200,
            json={
                "id": "gen_alt_123",
                "model": MODEL,
                "choices": [
                    {
                        "finish_reason": "stop",
                        "message": {
                            "content": json.dumps(
                                {
                                    "alt_text": "WebDiag audit issue list",
                                    "decorative": False,
                                    "rationale": "The description uses only the supplied image.",
                                }
                            ),
                            "refusal": None,
                        },
                    }
                ],
                "usage": {
                    "prompt_tokens": 12,
                    "completion_tokens": 4,
                    "cost": 0.000012,
                },
            },
        )

    request = ProviderRequest(
        run_id="11111111-1111-4111-8111-111111111111",
        tool_id="ai_alt_text_studio",
        contract_version="v1",
        model_policy=MODEL,
        input={
            "locale": "en",
            "page_context": "Audit report",
            "surrounding_text": None,
            "purpose": "informative",
            "image": {
                "object_key": "ai-uploads/aa/" + "b" * 62,
                "media_type": "image/png",
                "byte_size": len(image),
                "width": 3,
                "height": 2,
                "sha256": hashlib.sha256(image).hexdigest(),
            },
        },
        safety_identifier="opaque-safety-identifier-value-1234567890",
    )
    provider = _provider(handler, artifact_storage=Storage())

    result = provider.execute(provider.prepare(request))

    assert result.output["alt_text"] == "WebDiag audit issue list"
    assert reads == [("ai-uploads/aa/" + "b" * 62, len(image))]
    sent = json.loads(requests[0].content)
    assert sent["messages"][1]["content"][1]["image_url"]["detail"] == "low"
    assert "object_key" not in requests[0].content.decode()


@pytest.mark.parametrize("failure", ("missing", "size", "digest"))
def test_gateway_rejects_invalid_owned_image_before_provider_request(
    failure: str,
) -> None:
    expected = b"image"
    actual: bytes | BaseException = expected
    descriptor_digest = hashlib.sha256(expected).hexdigest()
    if failure == "missing":
        actual = FileNotFoundError("private path")
    elif failure == "size":
        actual = b"different-size"
    else:
        descriptor_digest = "0" * 64
    attempts = 0

    class Storage:
        def read(self, *, object_key: str, max_bytes: int) -> bytes:
            assert object_key == "ai-uploads/aa/" + "b" * 62
            assert max_bytes == len(expected)
            if isinstance(actual, BaseException):
                raise actual
            return actual

    def handler(_request: httpx.Request) -> httpx.Response:
        nonlocal attempts
        attempts += 1
        return httpx.Response(200, json=_response())

    request = ProviderRequest(
        run_id="11111111-1111-4111-8111-111111111111",
        tool_id="ai_alt_text_studio",
        contract_version="v1",
        model_policy=MODEL,
        input={
            "locale": "en",
            "page_context": None,
            "surrounding_text": None,
            "purpose": "unknown",
            "image": {
                "object_key": "ai-uploads/aa/" + "b" * 62,
                "media_type": "image/png",
                "byte_size": len(expected),
                "width": 3,
                "height": 2,
                "sha256": descriptor_digest,
            },
        },
        safety_identifier="opaque-safety-identifier-value-1234567890",
    )

    with pytest.raises(KnownSafeProviderError):
        _provider(handler, artifact_storage=Storage()).prepare(request)
    assert attempts == 0


def test_gateway_rejects_oversized_success_before_json_parsing(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(provider_module, "_CHAT_RESPONSE_MAX_BYTES", 32)

    with pytest.raises(ProviderOutcomeUnknownError, match="too large"):
        _provider(
            lambda _request: httpx.Response(
                200,
                content=b'{"padding":"' + b"x" * 64 + b'"}',
            )
        ).execute(_request())


def test_gateway_typed_refusal_is_known_safe() -> None:
    body = _response()
    body["choices"][0]["message"] = {
        "content": None,
        "refusal": "Cannot comply.",
        "role": "assistant",
    }

    with pytest.raises(KnownSafeProviderError, match="refused"):
        _provider(lambda _request: httpx.Response(200, json=body)).execute(_request())


@pytest.mark.parametrize(
    ("tool_id", "input_value", "provider_output", "expected_output"),
    (
        (
            "ai_faq_studio",
            {
                "locale": "ru",
                "source_content": "WebDiag проверяет технические сигналы страницы.",
                "audience": None,
                "question_count": 3,
            },
            {
                "items": [
                    {
                        "question": f"Вопрос {index}?",
                        "answer": "Ответ из исходного текста.",
                        "evidence": "WebDiag проверяет технические сигналы страницы.",
                    }
                    for index in range(1, 4)
                ]
            },
            None,
        ),
        (
            "ai_schema_studio",
            {
                "locale": "en",
                "schema_type": "Organization",
                "page_url": "https://example.com/about",
                "facts": ["WebDiag", "Contact phone: +7 999 111-22-33"],
            },
            {
                "properties": [
                    {"name": "name", "value": "WebDiag", "source_fact_indexes": [0]},
                    {
                        "name": "telephone",
                        "value": "+7 999 111-22-33",
                        "source_fact_indexes": [1],
                    },
                ],
                "warnings": [],
            },
            {
                "json_ld": {
                    "@context": "https://schema.org",
                    "@type": "Organization",
                    "url": "https://example.com/about",
                    "name": "WebDiag",
                    "telephone": "+7 999 111-22-33",
                },
                "property_sources": {"/name": [0], "/telephone": [1]},
                "warnings": [],
            },
        ),
    ),
)
def test_gateway_preserves_tool_specific_output_contracts(
    tool_id: str,
    input_value: dict[str, object],
    provider_output: dict[str, object],
    expected_output: dict[str, object] | None,
) -> None:
    body = _response()
    body["choices"][0]["message"]["content"] = json.dumps(provider_output)
    request = ProviderRequest(
        run_id="11111111-1111-4111-8111-111111111111",
        tool_id=tool_id,
        contract_version="v1",
        model_policy=MODEL,
        input=input_value,
        safety_identifier="opaque-safety-identifier-value-1234567890",
    )

    result = _provider(lambda _request: httpx.Response(200, json=body)).execute(request)

    assert result.output == (expected_output or provider_output)
