import asyncio
from collections.abc import Callable

import httpx

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeHttpFetcher
from webdiag_api.main import app
from webdiag_api.tools.sitemap_xml import get_sitemap_xml_fetcher

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
        config=SafeFetchConfig(max_body_bytes=1_000_000),
        resolver=lambda _hostname, _port: [SAFE_IP],
        peer_address_provider=lambda _response: [SAFE_IP],
        transport=httpx.MockTransport(handler),
    )


async def request(json: dict[str, object]) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.post("/v1/tools/sitemap", json=json)


def with_fetcher(fetcher: SafeHttpFetcher) -> None:
    app.dependency_overrides[get_sitemap_xml_fetcher] = lambda: fetcher


def clear_overrides() -> None:
    app.dependency_overrides.clear()


def test_sitemap_tool_discovers_default_sitemap_and_matches_target_url() -> None:
    seen_paths: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen_paths.append(request.url.path)
        return streaming_response(
            200,
            request=request,
            headers={"content-type": "application/xml"},
            content=b"""
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc></url>
  <url><loc>https://example.com/catalog/page</loc></url>
</urlset>
""",
        )

    with_fetcher(build_fetcher(handler))
    try:
        response = asyncio.run(request({"url": "https://example.com/catalog/page"}))
    finally:
        clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_version"] == "webdiag.tool.sitemap_xml.v1"
    assert payload["requested_url"] == "https://example.com/catalog/page"
    assert payload["sitemap_url"] == "https://example.com/sitemap.xml"
    assert payload["target_url"] == "https://example.com/catalog/page"
    assert payload["status_code"] == 200
    assert payload["available"] is True
    assert payload["valid_xml"] is True
    assert payload["kind"] == "urlset"
    assert payload["url_count"] == 2
    assert payload["sitemap_count"] == 0
    assert payload["contains_target"] is True
    assert payload["sample_urls"] == [
        {"url": "https://example.com/"},
        {"url": "https://example.com/catalog/page"},
    ]
    assert seen_paths == ["/sitemap.xml"]


def test_sitemap_tool_accepts_direct_sitemap_index_url() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/sitemap_index.xml"
        return streaming_response(
            200,
            request=request,
            content=b"""
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://example.com/post-sitemap.xml</loc></sitemap>
  <sitemap><loc>https://example.com/page-sitemap.xml</loc></sitemap>
</sitemapindex>
""",
        )

    with_fetcher(build_fetcher(handler))
    try:
        response = asyncio.run(request({"url": "https://example.com/sitemap_index.xml"}))
    finally:
        clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert payload["sitemap_url"] == "https://example.com/sitemap_index.xml"
    assert payload["target_url"] is None
    assert payload["kind"] == "sitemapindex"
    assert payload["url_count"] == 0
    assert payload["sitemap_count"] == 2
    assert payload["contains_target"] is None
    assert payload["sample_sitemaps"] == [
        {"url": "https://example.com/post-sitemap.xml"},
        {"url": "https://example.com/page-sitemap.xml"},
    ]


def test_sitemap_tool_reports_invalid_xml_without_throwing() -> None:
    with_fetcher(
        build_fetcher(
            lambda request: streaming_response(
                200,
                request=request,
                content=b"<urlset><url>",
            )
        )
    )
    try:
        response = asyncio.run(request({"url": "https://example.com/"}))
    finally:
        clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert payload["available"] is True
    assert payload["valid_xml"] is False
    assert payload["parse_error"] is not None
    assert "not valid XML" in payload["recommendation"]


def test_sitemap_tool_rejects_disallowed_urls() -> None:
    with_fetcher(build_fetcher(lambda request: streaming_response(200, request=request)))
    try:
        response = asyncio.run(request({"url": "http://127.0.0.1/sitemap.xml"}))
    finally:
        clear_overrides()

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "tool_url_rejected",
        "message": "Private or reserved addresses are not allowed.",
    }
