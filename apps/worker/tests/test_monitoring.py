import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from unittest.mock import patch

import pytest

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


@pytest.mark.parametrize(
    "token",
    (
        "x" * 16 + "\n" + "y" * 16,
        "x" * 31 + "é",
        " " + "x" * 32,
    ),
)
def test_worker_rejects_non_header_token_characters(monkeypatch, token: str) -> None:
    monkeypatch.setenv("WEBDIAG_MONITORING_INTERNAL_TOKEN", token)
    monkeypatch.setenv("WEBDIAG_MONITORING_API_INTERNAL_URL", "http://api:8000")
    with (
        patch(
            "webdiag_worker.monitoring.urlopen",
            side_effect=AssertionError("HTTP request must not be attempted"),
        ),
        pytest.raises(RuntimeError, match="visible ASCII"),
    ):
        run_due_monitors()


def test_worker_rejects_redirect_without_forwarding_bearer_token(monkeypatch) -> None:
    redirected_authorization: list[str | None] = []

    class RedirectTarget(BaseHTTPRequestHandler):
        def do_GET(self) -> None:  # noqa: N802 - stdlib callback name
            redirected_authorization.append(self.headers.get("Authorization"))
            payload = json.dumps(
                {
                    "contract_version": "webdiag.monitoring.run_due.v1",
                    "processed": 3,
                }
            ).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

        def log_message(self, _format: str, *_args: object) -> None:
            return

    target_server = ThreadingHTTPServer(("127.0.0.1", 0), RedirectTarget)

    class RedirectSource(BaseHTTPRequestHandler):
        def do_POST(self) -> None:  # noqa: N802 - stdlib callback name
            target_port = target_server.server_address[1]
            self.send_response(302)
            self.send_header("Location", f"http://127.0.0.1:{target_port}/capture")
            self.end_headers()

        def log_message(self, _format: str, *_args: object) -> None:
            return

    source_server = ThreadingHTTPServer(("127.0.0.1", 0), RedirectSource)
    threads = [
        threading.Thread(target=server.serve_forever, daemon=True)
        for server in (source_server, target_server)
    ]
    for thread in threads:
        thread.start()
    try:
        source_port = source_server.server_address[1]
        monkeypatch.setenv("WEBDIAG_MONITORING_INTERNAL_TOKEN", "x" * 32)
        monkeypatch.setenv(
            "WEBDIAG_MONITORING_API_INTERNAL_URL", f"http://127.0.0.1:{source_port}"
        )
        with pytest.raises(RuntimeError, match="Monitoring API request failed"):
            run_due_monitors()
    finally:
        source_server.shutdown()
        target_server.shutdown()
        source_server.server_close()
        target_server.server_close()
        for thread in threads:
            thread.join(timeout=2)

    assert redirected_authorization == []
