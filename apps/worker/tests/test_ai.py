import json
from unittest.mock import patch

import pytest

from webdiag_worker.ai import (
    ProviderRequest,
    ProviderResult,
    run_one_ai_job,
)


class FakeProvider:
    def __init__(self) -> None:
        self.requests: list[ProviderRequest] = []

    def execute(self, request: ProviderRequest) -> ProviderResult:
        self.requests.append(request)
        return ProviderResult(
            output={"text": "grounded"},
            provider_request_id="req_test",
            input_units=12,
            output_units=4,
        )


def test_worker_claims_marks_submitted_and_completes_typed_result(monkeypatch) -> None:
    monkeypatch.setenv("WEBDIAG_AI_INTERNAL_TOKEN", "a" * 32)
    monkeypatch.setenv("WEBDIAG_AI_API_INTERNAL_URL", "http://api:8000")
    calls: list[tuple[str, str, dict[str, object] | None]] = []

    def request_json(method: str, path: str, payload=None):
        calls.append((method, path, payload))
        if path.endswith("/claim"):
            return {
                "contract_version": "webdiag.ai.worker.v1",
                "claim": {
                    "run_id": "11111111-1111-4111-8111-111111111111",
                    "attempt_number": 1,
                    "lease_token": "lease-token-value-with-at-least-32-chars",
                    "lease_expires_at": 1_900_000_000,
                    "tool_id": "test_text_tool",
                    "contract_version": "v1",
                    "model_policy": "test-only",
                    "input": {"content": "source"},
                },
            }
        return {
            "contract_version": "webdiag.ai.worker.v1",
            "state": "succeeded" if path.endswith("/complete") else "running",
        }

    provider = FakeProvider()
    with patch("webdiag_worker.ai._request_json", side_effect=request_json):
        assert run_one_ai_job(provider, lease_renew_interval_seconds=30) is True

    assert provider.requests == [
        ProviderRequest(
            run_id="11111111-1111-4111-8111-111111111111",
            tool_id="test_text_tool",
            contract_version="v1",
            model_policy="test-only",
            input={"content": "source"},
        )
    ]
    assert [path.rsplit("/", 1)[-1] for _method, path, _payload in calls] == [
        "claim",
        "mark-submitted",
        "complete",
    ]
    assert calls[-1][2] == {
        "lease_token": "lease-token-value-with-at-least-32-chars",
        "output": {"text": "grounded"},
        "provider_request_id": "req_test",
        "input_units": 12,
        "output_units": 4,
    }


def test_worker_returns_false_when_no_claim(monkeypatch) -> None:
    monkeypatch.setenv("WEBDIAG_AI_INTERNAL_TOKEN", "a" * 32)
    monkeypatch.setenv("WEBDIAG_AI_API_INTERNAL_URL", "http://api:8000")
    response = {"contract_version": "webdiag.ai.worker.v1", "claim": None}

    with patch("webdiag_worker.ai._request_json", return_value=response):
        assert run_one_ai_job(FakeProvider()) is False


def test_unclassified_provider_exception_is_recorded_as_unknown(monkeypatch) -> None:
    monkeypatch.setenv("WEBDIAG_AI_INTERNAL_TOKEN", "a" * 32)
    monkeypatch.setenv("WEBDIAG_AI_API_INTERNAL_URL", "http://api:8000")
    calls: list[tuple[str, dict[str, object] | None]] = []

    def request_json(_method: str, path: str, payload=None):
        calls.append((path, payload))
        if path.endswith("/claim"):
            return {
                "contract_version": "webdiag.ai.worker.v1",
                "claim": {
                    "run_id": "11111111-1111-4111-8111-111111111111",
                    "attempt_number": 1,
                    "lease_token": "lease-token-value-with-at-least-32-chars",
                    "lease_expires_at": 1_900_000_000,
                    "tool_id": "test_text_tool",
                    "contract_version": "v1",
                    "model_policy": "test-only",
                    "input": {"content": "source"},
                },
            }
        return {"contract_version": "webdiag.ai.worker.v1", "state": "provider_unknown"}

    class ExplodingProvider:
        def execute(self, _request: ProviderRequest) -> ProviderResult:
            raise RuntimeError("provider response was lost")

    with patch("webdiag_worker.ai._request_json", side_effect=request_json):
        assert run_one_ai_job(ExplodingProvider()) is True

    assert calls[-1][0].endswith("/fail")
    assert calls[-1][1]["outcome"] == "provider_unknown"
    assert calls[-1][1]["error_code"] == "ai_provider_outcome_unknown"


@pytest.mark.parametrize(
    "url",
    (
        "https://user:password@example.com",
        "https://example.com/private",
        "https://example.com?token=secret",
        "file:///data/accounts.sqlite3",
    ),
)
def test_worker_rejects_non_origin_internal_url(monkeypatch, url: str) -> None:
    monkeypatch.setenv("WEBDIAG_AI_INTERNAL_TOKEN", "a" * 32)
    monkeypatch.setenv("WEBDIAG_AI_API_INTERNAL_URL", url)

    with pytest.raises(RuntimeError, match="clean HTTP origin"):
        run_one_ai_job(FakeProvider())


def test_worker_rejects_invalid_contract_without_calling_provider(monkeypatch) -> None:
    monkeypatch.setenv("WEBDIAG_AI_INTERNAL_TOKEN", "a" * 32)
    monkeypatch.setenv("WEBDIAG_AI_API_INTERNAL_URL", "http://api:8000")
    provider = FakeProvider()

    with (
        patch(
            "webdiag_worker.ai._request_json",
            return_value={"contract_version": "unknown", "claim": None},
        ),
        pytest.raises(RuntimeError, match="invalid contract"),
    ):
        run_one_ai_job(provider)

    assert provider.requests == []


def test_http_bridge_bounds_response_and_sends_bearer(monkeypatch) -> None:
    monkeypatch.setenv("WEBDIAG_AI_INTERNAL_TOKEN", "a" * 32)
    monkeypatch.setenv("WEBDIAG_AI_API_INTERNAL_URL", "http://api:8000")

    class Response:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def read(self, limit: int) -> bytes:
            assert limit == 1_000_001
            return json.dumps(
                {"contract_version": "webdiag.ai.worker.v1", "claim": None}
            ).encode()

    with patch("webdiag_worker.ai.urlopen", return_value=Response()) as mocked:
        assert run_one_ai_job(FakeProvider()) is False
    request = mocked.call_args.args[0]
    assert request.full_url == "http://api:8000/v1/internal/ai/runs/claim"
    assert request.headers["Authorization"] == f"Bearer {'a' * 32}"
