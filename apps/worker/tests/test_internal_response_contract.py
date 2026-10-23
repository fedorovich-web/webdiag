from unittest.mock import patch

import pytest

from webdiag_worker import ai, crawler, monitoring
from webdiag_worker.json_contract import decode_json_object


class Response:
    def __init__(self, payload: bytes):
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self, _limit: int) -> bytes:
        return self.payload


def test_internal_json_preserves_valid_unicode_pairs():
    assert decode_json_object(
        b'{"text":"\\ud83d\\ude00"}', error_message="invalid JSON"
    ) == {"text": "😀"}


@pytest.mark.parametrize("module", [ai, crawler, monitoring])
@pytest.mark.parametrize("payload", [
    b"[]", b"null", b"{", b'{"processed":true,"processed":false}',
    b'{"value":NaN}', b'{"value":1e309}',
    b'{"text":"\\ud800"}', b'{"\\udfff":0}', b'{"nested":[["\\ud800"]]}',
])
def test_internal_bridge_rejects_ambiguous_json(module, payload, monkeypatch):
    for kind in ("AI", "CRAWLER", "MONITORING"):
        monkeypatch.setenv(f"WEBDIAG_{kind}_INTERNAL_TOKEN", "x" * 32)
    with patch.object(module, "urlopen", return_value=Response(payload)):
        with pytest.raises(RuntimeError):
            if module is ai:
                ai._request_json("POST", "/v1/internal/ai/claim")
            elif module is crawler:
                crawler.run_one_crawl()
            else:
                monitoring.run_due_monitors()


def test_monitoring_processed_count_is_not_a_boolean(monkeypatch):
    monkeypatch.setenv("WEBDIAG_MONITORING_INTERNAL_TOKEN", "x" * 32)
    payload = b'{"contract_version":"webdiag.monitoring.run_due.v1","processed":true}'
    with patch.object(monitoring, "urlopen", return_value=Response(payload)):
        with pytest.raises(RuntimeError, match="processed count"):
            monitoring.run_due_monitors()


@pytest.mark.parametrize("module,name,value", [
    (ai, "WEBDIAG_AI_WORKER_TIMEOUT_SECONDS", "0"),
    (ai, "WEBDIAG_AI_WORKER_TIMEOUT_SECONDS", "601"),
    (crawler, "WEBDIAG_CRAWLER_WORKER_TIMEOUT_SECONDS", "-1"),
    (crawler, "WEBDIAG_CRAWLER_WORKER_TIMEOUT_SECONDS", "331"),
    (monitoring, "WEBDIAG_MONITORING_WORKER_TIMEOUT_SECONDS", "0"),
    (monitoring, "WEBDIAG_MONITORING_WORKER_TIMEOUT_SECONDS", "121"),
])
def test_internal_bridge_rejects_invalid_timeout_before_network(module, name, value, monkeypatch):
    for kind in ("AI", "CRAWLER", "MONITORING"):
        monkeypatch.setenv(f"WEBDIAG_{kind}_INTERNAL_TOKEN", "x" * 32)
    monkeypatch.setenv(name, value)
    with patch.object(module, "urlopen") as request:
        with pytest.raises(RuntimeError, match=name):
            if module is ai:
                ai._request_json("POST", "/v1/internal/ai/claim")
            elif module is crawler:
                crawler.run_one_crawl()
            else:
                monitoring.run_due_monitors()
    request.assert_not_called()
