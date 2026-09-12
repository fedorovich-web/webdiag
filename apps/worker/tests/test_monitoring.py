import json
from unittest.mock import patch

from webdiag_worker.monitoring import run_due_monitors


class Response:
    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self, limit: int) -> bytes:
        return json.dumps({
            "contract_version": "webdiag.monitoring.run_due.v1",
            "processed": 3,
        }).encode()


def test_worker_monitoring_bridge_uses_bearer_and_validates_contract(monkeypatch) -> None:
    monkeypatch.setenv("WEBDIAG_MONITORING_INTERNAL_TOKEN", "x" * 32)
    monkeypatch.setenv("WEBDIAG_MONITORING_API_INTERNAL_URL", "http://api:8000")
    with patch("webdiag_worker.monitoring.urlopen", return_value=Response()) as mocked:
        assert run_due_monitors() == 3
    request = mocked.call_args.args[0]
    assert request.full_url == "http://api:8000/v1/internal/monitoring/run-due"
    assert request.headers["Authorization"] == f"Bearer {'x' * 32}"


def test_worker_rejects_credentialed_internal_url(monkeypatch) -> None:
    monkeypatch.setenv("WEBDIAG_MONITORING_INTERNAL_TOKEN", "x" * 32)
    monkeypatch.setenv(
        "WEBDIAG_MONITORING_API_INTERNAL_URL",
        "https://user:password@example.com/private?token=1",
    )
    try:
        run_due_monitors()
    except RuntimeError as error:
        assert "clean HTTP origin" in str(error)
    else:
        raise AssertionError("Credentialed monitoring URL must be rejected")
