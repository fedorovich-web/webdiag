import asyncio
from collections.abc import Callable

import httpx

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeHttpFetcher
from webdiag_api.main import app
from webdiag_api.tools.technical_seo import get_technical_seo_fetcher

SAFE_IP = "93.184.216.34"

HTML = b"""<!doctype html>
<html lang="en">
<head>
<title>International WebDiag page</title>
<meta name="robots" content="index,follow">
<meta name="generator" content="WordPress 6.6">
<link rel="canonical" href="https://example.com/en/">
<link rel="alternate" hreflang="en" href="https://example.com/en/">
<link rel="alternate" hreflang="de" href="https://example.com/de/">
<link rel="alternate" hreflang="x-default" href="https://example.com/">
<script src="/_next/static/chunks/app.js"></script>
<script src="https://www.googletagmanager.com/gtm.js"></script>
</head>
<body><div id="gatsby-focus-wrapper"><a href="/about">About</a></div></body>
</html>"""


ROBOTS = b"""User-agent: *
Allow: /
Sitemap: https://example.com/sitemap.xml
"""


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
        resolver=lambda _host, _port: [SAFE_IP],
        peer_address_provider=lambda _response: [SAFE_IP],
        transport=httpx.MockTransport(handler),
    )


async def post(path: str, json: dict[str, object]) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.post(path, json=json)


def clear_overrides() -> None:
    app.dependency_overrides.clear()


def handler(request: httpx.Request) -> httpx.Response:
    if request.url.path == "/robots.txt":
        return streaming_response(
            200,
            request=request,
            headers={"content-type": "text/plain"},
            content=ROBOTS,
        )
    return streaming_response(
        200,
        request=request,
        headers={
            "content-type": "text/html; charset=utf-8",
            "server": "cloudflare",
            "x-powered-by": "Next.js",
            "cf-cache-status": "HIT",
        },
        content=HTML,
    )


def test_indexability_checker_reports_static_indexing_signals() -> None:
    app.dependency_overrides[get_technical_seo_fetcher] = lambda: build_fetcher(handler)
    try:
        response = asyncio.run(
            post("/v1/tools/indexability", {"url": "https://example.com/en/"})
        )
    finally:
        clear_overrides()

    payload = response.json()
    assert response.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.indexability.v1"
    assert payload["robots_txt_allowed"] is True
    assert payload["meta_robots_noindex"] is False
    assert payload["canonical_matches_final_url"] is True
    assert payload["indexable_candidate"] is True


def test_hreflang_checker_reports_alternates_and_x_default() -> None:
    app.dependency_overrides[get_technical_seo_fetcher] = lambda: build_fetcher(handler)
    try:
        response = asyncio.run(
            post("/v1/tools/hreflang", {"url": "https://example.com/en/"})
        )
    finally:
        clear_overrides()

    payload = response.json()
    assert response.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.hreflang.v1"
    assert payload["html_lang"] == "en"
    assert payload["total_alternates"] == 3
    assert payload["has_x_default"] is True
    assert payload["has_self_reference"] is True
    assert payload["invalid_alternate_count"] == 0


def test_technology_detector_reports_headers_assets_and_generator() -> None:
    app.dependency_overrides[get_technical_seo_fetcher] = lambda: build_fetcher(handler)
    try:
        response = asyncio.run(
            post("/v1/tools/technology-detector", {"url": "https://example.com/en/"})
        )
    finally:
        clear_overrides()

    payload = response.json()
    assert response.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.technology_detector.v1"
    names = {item["name"] for item in payload["technologies"]}
    assert "WordPress" in names
    assert "Next.js" in names
    assert "Cloudflare" in names
    assert payload["detected_count"] >= 3


def test_technical_seo_tools_reject_private_targets() -> None:
    app.dependency_overrides[get_technical_seo_fetcher] = lambda: build_fetcher(handler)
    try:
        response = asyncio.run(
            post("/v1/tools/indexability", {"url": "http://127.0.0.1/"})
        )
    finally:
        clear_overrides()

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "tool_url_rejected",
        "message": "Private or reserved addresses are not allowed.",
    }
