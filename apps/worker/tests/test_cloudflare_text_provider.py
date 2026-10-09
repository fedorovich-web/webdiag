from dataclasses import replace
import json

import httpx
import pytest

from webdiag_worker.ai import (
    KnownSafeProviderError,
    ProviderOutcomeUnknownError,
    ProviderRequest,
)

MODEL = "@cf/qwen/qwen3.8-27b"
ACCOUNT = "a" * 32
OUTPUT = {
    "items": [
        {
            "question": f"Question {i}?",
            "answer": "Entry is free.",
            "evidence": "Entry is free.",
        }
        for i in range(3)
    ]
}


def request(**changes):
    return replace(
        ProviderRequest(
            run_id="run",
            tool_id="ai_faq_studio",
            contract_version="v1",
            model_policy=MODEL,
            input={
                "locale": "en",
                "source_content": "Entry is free.",
                "audience": None,
                "question_count": 3,
            },
            safety_identifier="a" * 64,
        ),
        **changes,
    )


def response(**changes):
    return dict(
        {
            "id": "cf-request-1",
            "model": MODEL,
            "choices": [
                {"finish_reason": "stop", "message": {"content": json.dumps(OUTPUT)}}
            ],
            "usage": {
                "prompt_tokens": 160,
                "completion_tokens": 482,
                "total_tokens": 642,
                "neurons": 146.7,
            },
        },
        **changes,
    )


def provider(handler):
    from webdiag_worker.cloudflare_text_provider import CloudflareTextProvider

    return CloudflareTextProvider(
        httpx.Client(transport=httpx.MockTransport(handler)), account_id=ACCOUNT
    )


def test_sends_observed_cloudflare_protocol_and_preserves_unknown_dollar_cost():
    seen = []

    def handler(req):
        seen.append(req)
        payload = json.loads(req.content)
        assert (
            str(req.url)
            == f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT}/ai/v1/chat/completions"
        )
        assert payload["model"] == MODEL
        assert payload["max_completion_tokens"] == 3000
        assert payload["reasoning_effort"] == "low"
        assert payload["store"] is False and payload["stream"] is False
        assert payload["user"] == "a" * 64
        assert payload["response_format"]["json_schema"]["strict"] is True
        assert "providerOptions" not in payload
        return httpx.Response(200, json=response())

    with provider(handler) as p:
        result = p.execute(p.prepare(request()))
    assert len(seen) == 1
    assert result.output == OUTPUT
    assert (result.input_units, result.output_units) == (160, 482)
    assert result.provider_cost_nano_usd is None


@pytest.mark.parametrize(
    "changes",
    [
        {"model_policy": "openai/gpt-6-luna"},
        {"contract_version": "v2"},
        {"tool_id": "unknown"},
        {"safety_identifier": None},
    ],
)
def test_rejects_local_policy_mismatch_without_http(changes):
    def handler(req):
        pytest.fail("Local rejection must not contact the provider")

    with provider(handler) as p, pytest.raises(KnownSafeProviderError):
        p.execute(request(**changes))


@pytest.mark.parametrize(
    "status,exception",
    [
        (400, KnownSafeProviderError),
        (403, KnownSafeProviderError),
        (429, KnownSafeProviderError),
        (302, ProviderOutcomeUnknownError),
        (500, ProviderOutcomeUnknownError),
    ],
)
def test_never_retries_or_follows_redirects(status, exception):
    seen = []

    def handler(req):
        seen.append(req)
        return httpx.Response(status, headers={"Location": "https://example.org/"})

    with provider(handler) as p, pytest.raises(exception):
        p.execute(request())
    assert len(seen) == 1


@pytest.mark.parametrize(
    "body",
    [
        response(model="unexpected"),
        response(usage={"prompt_tokens": True, "completion_tokens": 2}),
        response(
            choices=[
                {"finish_reason": "length", "message": {"content": json.dumps(OUTPUT)}}
            ]
        ),
        response(choices=[{"finish_reason": "stop", "message": {"content": "{}"}}]),
    ],
)
def test_invalid_success_is_unknown_and_never_reported_as_completed(body):
    with (
        provider(lambda req: httpx.Response(200, json=body)) as p,
        pytest.raises(ProviderOutcomeUnknownError),
    ):
        p.execute(request())


def test_response_is_bounded():
    with (
        provider(
            lambda req: httpx.Response(200, content=b"x" * (2 * 1024 * 1024 + 1))
        ) as p,
        pytest.raises(ProviderOutcomeUnknownError),
    ):
        p.execute(request())


def test_transport_error_is_unknown_without_retry():
    seen = []

    def handler(req):
        seen.append(req)
        raise httpx.ReadTimeout("ambiguous", request=req)

    with provider(handler) as p, pytest.raises(ProviderOutcomeUnknownError):
        p.execute(request())
    assert len(seen) == 1
