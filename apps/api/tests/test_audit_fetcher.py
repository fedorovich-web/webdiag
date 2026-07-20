import httpx
import pytest

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeFetchError, SafeHttpFetcher
from webdiag_api.security.url_policy import UrlPolicyError


def public_resolver(hostname: str, port: int) -> list[str]:
    assert hostname
    assert port in {80, 443}
    return ["93.184.216.34"]


def test_safe_fetcher_follows_redirects_and_returns_final_html() -> None:
    seen_user_agents: list[str | None] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen_user_agents.append(request.headers.get("user-agent"))
        if str(request.url) == "https://example.com/old":
            return httpx.Response(301, headers={"location": "/new"}, request=request)
        return httpx.Response(
            200,
            headers={"content-type": "text/html; charset=utf-8"},
            content=b"<html><head><title>Example</title></head></html>",
            request=request,
        )

    fetcher = SafeHttpFetcher(
        resolver=public_resolver,
        transport=httpx.MockTransport(handler),
    )

    result = fetcher.fetch("https://example.com/old")

    assert result.status_code == 200
    assert result.final_url == "https://example.com/new"
    assert result.content_type == "text/html; charset=utf-8"
    assert result.redirect_chain[0].status_code == 301
    assert result.redirect_chain[0].target_url == "https://example.com/new"
    assert seen_user_agents == ["WebDiagBot/0.5 (+https://webdiag.local/audit)"] * 2


def test_safe_fetcher_blocks_unsafe_redirect_target_before_request() -> None:
    requested_urls: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requested_urls.append(str(request.url))
        return httpx.Response(302, headers={"location": "http://127.0.0.1/admin"}, request=request)

    fetcher = SafeHttpFetcher(
        resolver=public_resolver,
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(UrlPolicyError):
        fetcher.fetch("https://example.com")

    assert requested_urls == ["https://example.com"]


def test_safe_fetcher_enforces_redirect_limit() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(302, headers={"location": "/next"}, request=request)

    fetcher = SafeHttpFetcher(
        config=SafeFetchConfig(max_redirects=1),
        resolver=public_resolver,
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(SafeFetchError, match="Redirect limit exceeded"):
        fetcher.fetch("https://example.com/start")


def test_safe_fetcher_truncates_large_body() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            headers={"content-type": "text/html"},
            content=b"a" * 2048,
            request=request,
        )

    fetcher = SafeHttpFetcher(
        config=SafeFetchConfig(max_body_bytes=1024),
        resolver=public_resolver,
        transport=httpx.MockTransport(handler),
    )

    result = fetcher.fetch("https://example.com")

    assert result.truncated is True
    assert len(result.body_text) == 1024


def test_safe_fetcher_converts_httpx_timeout_to_fetch_error() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.TimeoutException("boom", request=request)

    fetcher = SafeHttpFetcher(
        resolver=public_resolver,
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(SafeFetchError, match="timed out"):
        fetcher.fetch("https://example.com")
