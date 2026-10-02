from unittest.mock import patch

import pytest

import webdiag_worker.crawler as crawler_module
from webdiag_worker.crawler import run_one_crawl


class Response:
    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self, limit: int) -> bytes:
        assert limit == 1_000_001
        return b'{"contract_version":"webdiag.crawl.worker.v1","processed":true}'


def test_crawler_bridge_disables_ambient_proxies_and_uses_dedicated_bearer(monkeypatch) -> None:
    assert crawler_module._NO_PROXY_HANDLER.proxies == {}
    monkeypatch.setenv("WEBDIAG_CRAWLER_INTERNAL_TOKEN", "c" * 32)
    monkeypatch.setenv("WEBDIAG_CRAWLER_API_INTERNAL_URL", "http://api:8000")
    with patch("webdiag_worker.crawler.urlopen", return_value=Response()) as mocked:
        assert run_one_crawl() is True
    request = mocked.call_args.args[0]
    assert request.full_url == "http://api:8000/v1/internal/crawl/run-one"
    assert request.headers["Authorization"] == f"Bearer {'c' * 32}"
    assert mocked.call_args.kwargs["timeout"] == 270


def test_crawler_bridge_rejects_credentialed_origin_and_invalid_token(monkeypatch) -> None:
    monkeypatch.setenv("WEBDIAG_CRAWLER_INTERNAL_TOKEN", "c" * 32)
    monkeypatch.setenv(
        "WEBDIAG_CRAWLER_API_INTERNAL_URL",
        "https://user:secret@example.com/private?token=1",
    )
    with pytest.raises(RuntimeError, match="clean HTTP origin"):
        run_one_crawl()
    monkeypatch.setenv("WEBDIAG_CRAWLER_API_INTERNAL_URL", "http://api:8000")
    monkeypatch.setenv("WEBDIAG_CRAWLER_INTERNAL_TOKEN", "short")
    with pytest.raises(RuntimeError, match="at least 32"):
        run_one_crawl()
