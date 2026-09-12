import json
from unittest.mock import patch

import pytest
import webdiag_worker.ai as ai_module

from webdiag_worker.ai import (
    KnownSafeProviderError,
    ProviderArtifact,
    ProviderRequest,
    ProviderResult,
    cleanup_ai_artifacts,
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
            provider_cost_nano_usd=12_000,
        )


def test_internal_ai_opener_disables_ambient_proxies() -> None:
    assert ai_module._NO_PROXY_HANDLER.proxies == {}


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
                    "safety_identifier": "opaque-safety-identifier-value-1234567890",
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
            safety_identifier="opaque-safety-identifier-value-1234567890",
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
        "provider_cost_nano_usd": 12_000,
        "artifact": None,
    }


def test_worker_sends_private_artifact_descriptor_only_to_internal_completion(
    monkeypatch,
) -> None:
    monkeypatch.setenv("WEBDIAG_AI_INTERNAL_TOKEN", "a" * 32)
    monkeypatch.setenv("WEBDIAG_AI_API_INTERNAL_URL", "http://api:8000")
    calls: list[tuple[str, dict[str, object] | None]] = []

    class ImageProvider:
        def execute(self, _request: ProviderRequest) -> ProviderResult:
            artifact = ProviderArtifact(
                artifact_id="22222222-2222-4222-8222-222222222222",
                object_key="ai-uploads/ab/" + "c" * 62,
                media_type="image/png",
                byte_size=100,
                sha256="d" * 64,
            )
            return ProviderResult(
                output={
                    "artifact_id": artifact.artifact_id,
                    "media_type": artifact.media_type,
                    "byte_size": artifact.byte_size,
                    "sha256": artifact.sha256,
                },
                artifact=artifact,
            )

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
                    "tool_id": "ai_image_studio",
                    "contract_version": "v1",
                    "model_policy": "openai/gpt-image-2",
                    "safety_identifier": "opaque-safety-identifier-value-1234567890",
                    "artifact_reservation": {
                        "artifact_id": "22222222-2222-4222-8222-222222222222",
                        "object_key": "ai-uploads/ab/" + "c" * 62,
                    },
                    "input": {"prompt": "A bounded image prompt."},
                },
            }
        return {
            "contract_version": "webdiag.ai.worker.v1",
            "state": "succeeded" if path.endswith("/complete") else "running",
        }

    with patch("webdiag_worker.ai._request_json", side_effect=request_json):
        assert run_one_ai_job(ImageProvider(), lease_renew_interval_seconds=30)

    assert calls[-1][1]["artifact"] == {
        "artifact_id": "22222222-2222-4222-8222-222222222222",
        "object_key": "ai-uploads/ab/" + "c" * 62,
        "media_type": "image/png",
        "byte_size": 100,
        "sha256": "d" * 64,
    }
    assert "object_key" not in calls[-1][1]["output"]


def test_worker_reconciles_ambiguous_completion_without_repeating_provider(
    monkeypatch,
) -> None:
    monkeypatch.setenv("WEBDIAG_AI_INTERNAL_TOKEN", "a" * 32)
    monkeypatch.setenv("WEBDIAG_AI_API_INTERNAL_URL", "http://api:8000")
    paths: list[str] = []
    provider = FakeProvider()

    def request_json(_method: str, path: str, payload=None):
        paths.append(path)
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
        if path.endswith("/complete"):
            raise RuntimeError("completion response was lost")
        if path.endswith("/fail"):
            assert payload["outcome"] == "provider_unknown"
            assert payload["error_code"] == "ai_completion_outcome_unknown"
            return {"contract_version": "webdiag.ai.worker.v1", "state": "provider_unknown"}
        return {"contract_version": "webdiag.ai.worker.v1", "state": "running"}

    with patch("webdiag_worker.ai._request_json", side_effect=request_json):
        assert run_one_ai_job(provider, lease_renew_interval_seconds=30)

    assert len(provider.requests) == 1
    assert paths[-2].endswith("/complete")
    assert paths[-1].endswith("/fail")


def test_worker_rejects_image_claim_without_valid_reservation(monkeypatch) -> None:
    monkeypatch.setenv("WEBDIAG_AI_INTERNAL_TOKEN", "a" * 32)
    monkeypatch.setenv("WEBDIAG_AI_API_INTERNAL_URL", "http://api:8000")

    def request_json(_method: str, path: str, payload=None):
        assert path.endswith("/claim")
        return {
            "contract_version": "webdiag.ai.worker.v1",
            "claim": {
                "run_id": "11111111-1111-4111-8111-111111111111",
                "attempt_number": 1,
                "lease_token": "lease-token-value-with-at-least-32-chars",
                "lease_expires_at": 1_900_000_000,
                "tool_id": "ai_image_studio",
                "contract_version": "v1",
                "model_policy": "openai/gpt-image-2",
                "artifact_reservation": {
                    "artifact_id": "not-a-uuid",
                    "object_key": "../outside",
                },
                "input": {"prompt": "A bounded image prompt."},
            },
        }

    provider = FakeProvider()
    with (
        patch("webdiag_worker.ai._request_json", side_effect=request_json),
        pytest.raises(RuntimeError, match="invalid work"),
    ):
        run_one_ai_job(provider)
    assert provider.requests == []


def test_worker_prepares_private_input_before_marking_provider_submitted(monkeypatch) -> None:
    monkeypatch.setenv("WEBDIAG_AI_INTERNAL_TOKEN", "a" * 32)
    monkeypatch.setenv("WEBDIAG_AI_API_INTERNAL_URL", "http://api:8000")
    events: list[str] = []

    class PreparingProvider(FakeProvider):
        def prepare(self, request: ProviderRequest) -> ProviderRequest:
            events.append("prepare")
            return request

        def execute(self, request: ProviderRequest) -> ProviderResult:
            events.append("execute")
            return super().execute(request)

    def request_json(_method: str, path: str, payload=None):
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
        events.append("mark" if path.endswith("/mark-submitted") else "complete")
        return {
            "contract_version": "webdiag.ai.worker.v1",
            "state": "succeeded" if path.endswith("/complete") else "running",
        }

    with patch("webdiag_worker.ai._request_json", side_effect=request_json):
        assert run_one_ai_job(PreparingProvider(), lease_renew_interval_seconds=30)

    assert events == ["prepare", "mark", "execute", "complete"]


def test_known_safe_prepare_failure_releases_without_marking_submitted(monkeypatch) -> None:
    monkeypatch.setenv("WEBDIAG_AI_INTERNAL_TOKEN", "a" * 32)
    monkeypatch.setenv("WEBDIAG_AI_API_INTERNAL_URL", "http://api:8000")
    paths: list[str] = []

    class UnavailableInputProvider(FakeProvider):
        def prepare(self, _request: ProviderRequest) -> ProviderRequest:
            raise KnownSafeProviderError("private detail")

    def request_json(_method: str, path: str, payload=None):
        paths.append(path)
        if path.endswith("/claim"):
            return {
                "contract_version": "webdiag.ai.worker.v1",
                "claim": {
                    "run_id": "11111111-1111-4111-8111-111111111111",
                    "attempt_number": 1,
                    "lease_token": "lease-token-value-with-at-least-32-chars",
                    "lease_expires_at": 1_900_000_000,
                    "tool_id": "ai_alt_text_studio",
                    "contract_version": "v1",
                    "model_policy": "openai/gpt-5.6-sol",
                    "input": {"image": {}},
                },
            }
        assert payload["outcome"] == "known_safe"
        assert payload["error_code"] == "ai_input_unavailable"
        return {"contract_version": "webdiag.ai.worker.v1", "state": "failed"}

    with patch("webdiag_worker.ai._request_json", side_effect=request_json):
        assert run_one_ai_job(UnavailableInputProvider())

    assert len(paths) == 2
    assert paths[1].endswith("/fail")


def test_worker_returns_false_when_no_claim(monkeypatch) -> None:
    monkeypatch.setenv("WEBDIAG_AI_INTERNAL_TOKEN", "a" * 32)
    monkeypatch.setenv("WEBDIAG_AI_API_INTERNAL_URL", "http://api:8000")
    response = {"contract_version": "webdiag.ai.worker.v1", "claim": None}

    with patch("webdiag_worker.ai._request_json", return_value=response):
        assert run_one_ai_job(FakeProvider()) is False


def test_worker_requests_bounded_artifact_cleanup_and_validates_contract() -> None:
    response = {
        "contract_version": "webdiag.ai.artifact_cleanup.v1",
        "deleted": 3,
        "failed": 1,
    }
    with patch("webdiag_worker.ai._request_json", return_value=response) as request_json:
        assert cleanup_ai_artifacts(limit=25) == (3, 1)

    request_json.assert_called_once_with(
        "POST",
        "/v1/internal/ai/artifacts/cleanup?limit=25",
    )

    with (
        patch(
            "webdiag_worker.ai._request_json",
            return_value={**response, "deleted": True},
        ),
        pytest.raises(RuntimeError, match="invalid cleanup contract"),
    ):
        cleanup_ai_artifacts(limit=1)


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
