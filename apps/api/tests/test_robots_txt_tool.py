import asyncio
from collections.abc import Callable

import httpx

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeHttpFetcher
from webdiag_api.main import app
from webdiag_api.tools.robots_txt import get_robots_txt_fetcher

SAFE_IP = "93.184.216.34"


def streaming_response(
    status_code: int,
    *,
    request: httpx.Request,
    headers: dict[str, str] | None = None,
    content: bytes = b"",
) -> httpx.Response:
    return httpx.Response(
        status_code,
        headers=headers,
        stream=httpx.ByteStream(content),
        request=request,
    )


def build_fetcher(handler: Callable[[httpx.Request], httpx.Response]) -> SafeHttpFetcher:
    return SafeHttpFetcher(
        config=SafeFetchConfig(max_body_bytes=512_000),
        resolver=lambda _hostname, _port: [SAFE_IP],
        peer_address_provider=lambda _response: [SAFE_IP],
        transport=httpx.MockTransport(handler),
    )


async def request(json: dict[str, object]) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.post("/v1/tools/robots-txt", json=json)


def with_fetcher(fetcher: SafeHttpFetcher) -> None:
    app.dependency_overrides[get_robots_txt_fetcher] = lambda: fetcher


def clear_overrides() -> None:
    app.dependency_overrides.clear()


def test_robots_txt_tool_allows_target_and_reports_sitemaps() -> None:
    seen_paths: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen_paths.append(request.url.path)
        return streaming_response(
            200,
            request=request,
            headers={"content-type": "text/plain"},
            content=b"""
User-agent: *
Disallow: /admin
Allow: /catalog/
Sitemap: https://example.com/sitemap.xml
""",
        )

    with_fetcher(build_fetcher(handler))
    try:
        response = asyncio.run(
            request({"url": "https://example.com/catalog/page", "user_agent": "WebDiagBot"})
        )
    finally:
        clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_version"] == "webdiag.tool.robots_txt.v1"
    assert payload["target_url"] == "https://example.com/catalog/page"
    assert payload["target_path"] == "/catalog/page"
    assert payload["robots_url"] == "https://example.com/robots.txt"
    assert payload["available"] is True
    assert payload["allows_target"] is True
    assert payload["matched_allow_rule"] == "/catalog/"
    assert payload["matched_disallow_rule"] is None
    assert payload["disallow_count"] == 1
    assert payload["sitemap_urls"] == [{"url": "https://example.com/sitemap.xml"}]
    assert seen_paths == ["/robots.txt"]


def test_robots_txt_tool_reports_blocked_target() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return streaming_response(
            200,
            request=request,
            content=b"User-agent: *\nDisallow: /private\n",
        )

    with_fetcher(build_fetcher(handler))
    try:
        response = asyncio.run(request({"url": "https://example.com/private/page"}))
    finally:
        clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert payload["allows_target"] is False
    assert payload["matched_disallow_rule"] == "/private"
    assert "blocked" in payload["recommendation"]


def test_robots_txt_tool_treats_missing_robots_as_available_false() -> None:
    with_fetcher(build_fetcher(lambda request: streaming_response(404, request=request)))
    try:
        response = asyncio.run(request({"url": "https://example.com/"}))
    finally:
        clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert payload["status_code"] == 404
    assert payload["available"] is False
    assert payload["allows_target"] is None
    assert payload["disallow_rules"] == []


def test_robots_txt_tool_rejects_disallowed_targets() -> None:
    with_fetcher(build_fetcher(lambda request: streaming_response(200, request=request)))
    try:
        response = asyncio.run(request({"url": "http://127.0.0.1/private"}))
    finally:
        clear_overrides()

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "tool_url_rejected",
        "message": "Private or reserved addresses are not allowed.",
    }
