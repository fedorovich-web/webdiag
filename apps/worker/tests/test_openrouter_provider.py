import json

import httpx
import pytest

from webdiag_worker.ai import (
    KnownSafeProviderError,
    ProviderOutcomeUnknownError,
    ProviderRequest,
)
from webdiag_worker.openrouter_provider import OpenRouterProvider


def _response(
    output: dict[str, object],
    *,
    model: str = "openai/gpt-5.6-luna",
) -> dict[str, object]:
    return {
        "id": "gen_123",
        "object": "chat.completion",
        "created": 1_786_000_000,
        "model": model,
        "choices": [
            {
                "finish_reason": "stop",
                "index": 0,
                "message": {
                    "content": json.dumps(output),
                    "refusal": None,
                    "role": "assistant",
                },
            }
        ],
        "usage": {
            "prompt_tokens": 12,
            "completion_tokens": 4,
            "total_tokens": 16,
            "cost": 0.000012,
        },
    }


def _provider(handler) -> OpenRouterProvider:
    client = httpx.Client(
        transport=httpx.MockTransport(handler),
        timeout=httpx.Timeout(connect=2, read=5, write=2, pool=2),
        headers={"Authorization": "Bearer test-openrouter-key"},
    )
    return OpenRouterProvider(client)


def _request(
    tool_id: str = "ai_meta_serp_studio",
    *,
    model: str = "openai/gpt-5.6-luna",
    input_value: dict[str, object] | None = None,
) -> ProviderRequest:
    return ProviderRequest(
        run_id="11111111-1111-4111-8111-111111111111",
        tool_id=tool_id,
        contract_version="v1",
        model_policy=model,
        input=input_value
        or {
            "locale": "en",
            "page_url": "https://example.com/page",
            "content": "WebDiag reports deterministic technical findings for this page.",
        },
        safety_identifier="opaque-safety-identifier-value-1234567890",
    )


def test_provider_sends_private_strict_openrouter_request_and_maps_usage() -> None:
    requests: list[httpx.Request] = []
    output = {
        "variants": [
            {
                "title": f"Technical page check {index}",
                "description": f"Review deterministic page findings in variant {index}.",
                "rationale": "Uses supplied page facts only.",
            }
            for index in range(1, 4)
        ]
    }

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(
            200,
            json=_response(output),
        )

    result = _provider(handler).execute(_request())

    assert result.output == output
    assert result.provider_request_id == "gen_123"
    assert (result.input_units, result.output_units) == (12, 4)
    assert len(requests) == 1
    sent = json.loads(requests[0].content)
    assert requests[0].url == "https://openrouter.ai/api/v1/chat/completions"
    assert requests[0].headers["authorization"] == "Bearer test-openrouter-key"
    assert sent["model"] == "openai/gpt-5.6-luna"
    assert sent["stream"] is False
    assert sent["user"] == "opaque-safety-identifier-value-1234567890"
    assert sent["max_tokens"] == 2_000
    assert sent["provider"] == {
        "allow_fallbacks": False,
        "data_collection": "deny",
        "require_parameters": True,
        "zdr": True,
    }
    output_format = sent["response_format"]
    assert output_format["type"] == "json_schema"
    assert output_format["json_schema"]["strict"] is True
    assert output_format["json_schema"]["schema"]["additionalProperties"] is False
    assert json.loads(sent["messages"][1]["content"]) == _request().input
    assert "example.com" not in sent["messages"][0]["content"]
    assert "test-openrouter-key" not in requests[0].content.decode()
    assert "http-referer" not in requests[0].headers


@pytest.mark.parametrize(
    ("tool_id", "model", "input_value", "provider_output", "expected_output"),
    (
        (
            "ai_audit_action_plan",
            "openai/gpt-5.6-luna",
            {
                "locale": "en",
                "target_origin": "https://example.com",
                "score": 70,
                "checks": [],
                "issues": [
                    {
                        "issue_id": "issue-1",
                        "category": "seo",
                        "severity": "warning",
                        "priority": "high",
                        "title": "Missing title",
                        "description": "No title was found.",
                        "affected_urls": ["https://example.com/page"],
                        "recommendation": {
                            "summary": "Add a title.",
                            "steps": ["Write a descriptive title."],
                            "expected_impact": None,
                        },
                    }
                ],
            },
            {
                "summary": "Fix the saved issue.",
                "actions": [
                    {
                        "issue_ids": ["issue-1"],
                        "title": "Add title",
                        "rationale": "The saved audit found no title.",
                        "steps": ["Write a descriptive title."],
                        "verification": "Run the deterministic title check.",
                        "affected_urls": ["https://example.com/page"],
                    }
                ],
            },
            None,
        ),
        (
            "ai_faq_studio",
            "openai/gpt-5.6-luna",
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
            "openai/gpt-5.6-luna",
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
def test_provider_uses_tool_specific_contracts(
    tool_id: str,
    model: str,
    input_value: dict[str, object],
    provider_output: dict[str, object],
    expected_output: dict[str, object] | None,
) -> None:
    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_response(provider_output, model=model))

    result = _provider(handler).execute(
        _request(tool_id, model=model, input_value=input_value)
    )

    assert result.output == (expected_output or provider_output)


@pytest.mark.parametrize("status_code", (400, 401, 402, 403, 404, 413, 422))
def test_rejected_provider_request_is_known_safe(status_code: int) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            status_code,
            request=request,
            json={
                "error": {
                    "message": "provider detail must not escape",
                    "type": "invalid_request_error",
                    "code": "invalid_request",
                }
            },
        )

    with pytest.raises(KnownSafeProviderError) as error:
        _provider(handler).execute(_request())
    assert "provider detail" not in str(error.value)


@pytest.mark.parametrize("status_code", (408, 409, 429, 500, 503))
def test_ambiguous_provider_status_is_unknown_and_never_retried(status_code: int) -> None:
    calls = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return httpx.Response(
            status_code,
            request=request,
            json={"error": {"message": "ambiguous", "type": "server_error"}},
        )

    with pytest.raises(ProviderOutcomeUnknownError):
        _provider(handler).execute(_request())
    assert calls == 1


def test_timeout_is_unknown_and_not_retried() -> None:
    calls = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        raise httpx.ReadTimeout("provider timeout", request=request)

    with pytest.raises(ProviderOutcomeUnknownError) as error:
        _provider(handler).execute(_request())
    assert calls == 1
    assert "provider timeout" not in str(error.value)


def test_typed_refusal_is_known_safe() -> None:
    body = _response({"variants": []})
    body["choices"][0]["message"] = {
        "content": None,
        "refusal": "Cannot comply.",
        "role": "assistant",
    }

    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=body)

    with pytest.raises(KnownSafeProviderError):
        _provider(handler).execute(_request())


def test_truncated_success_response_is_unknown() -> None:
    body = _response({"variants": []})
    body["choices"][0]["finish_reason"] = "length"

    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=body)

    with pytest.raises(ProviderOutcomeUnknownError):
        _provider(handler).execute(_request())


def test_unknown_tool_model_or_missing_safety_id_is_rejected_before_http() -> None:
    calls = 0

    def handler(_request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return httpx.Response(500)

    provider = _provider(handler)
    invalid_requests = (
        _request("ai_unknown"),
        _request(model="openai/gpt-5.6-terra"),
        ProviderRequest(
            run_id="11111111-1111-4111-8111-111111111111",
            tool_id="ai_meta_serp_studio",
            contract_version="v1",
            model_policy="openai/gpt-5.6-luna",
            input={"locale": "en"},
            safety_identifier=None,
        ),
    )
    for request in invalid_requests:
        with pytest.raises(KnownSafeProviderError):
            provider.execute(request)
    assert calls == 0
