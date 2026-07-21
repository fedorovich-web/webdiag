import asyncio
from collections.abc import Callable

import httpx

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeHttpFetcher
from webdiag_api.main import app
from webdiag_api.tools.image_audit import get_image_audit_fetcher

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
        config=SafeFetchConfig(max_body_bytes=600_000),
        resolver=lambda _hostname, _port: [SAFE_IP],
        peer_address_provider=lambda _response: [SAFE_IP],
        transport=httpx.MockTransport(handler),
    )


async def post(path: str, json: dict[str, object]) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.post(path, json=json)


def clear_overrides() -> None:
    app.dependency_overrides.clear()


HTML = b"""
<!doctype html><html><head>
  <meta property="og:image" content="/share.jpg">
  <meta name="twitter:image" content="/share.webp">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple.png" sizes="180x180">
  <link rel="manifest" href="/site.webmanifest">
</head><body>
  <img src="/hero.jpg" srcset="/hero.webp 1x, /hero.avif 2x"
       alt="Hero" width="1200" height="630" fetchpriority="high">
  <a href="/sale"><img src="/button.png" alt=""></a>
  <picture><source srcset="/card.avif" type="image/avif">
    <img src="/card.png" alt="Card" loading="lazy">
  </picture>
  <img src="/decor.svg" alt="">
</body></html>
"""


def image_handler(request: httpx.Request) -> httpx.Response:
    path = request.url.path
    if path == "/":
        return streaming_response(
            200, request=request, headers={"content-type": "text/html"}, content=HTML
        )
    headers = {
        "/hero.jpg": {"content-type": "image/jpeg", "content-length": "720000"},
        "/hero.webp": {"content-type": "image/webp", "content-length": "280000"},
        "/hero.avif": {"content-type": "image/avif", "content-length": "180000"},
        "/button.png": {"content-type": "image/png", "content-length": "45000"},
        "/card.avif": {"content-type": "image/avif", "content-length": "32000"},
        "/card.png": {"content-type": "image/png", "content-length": "210000"},
        "/decor.svg": {"content-type": "image/svg+xml", "content-length": "1400"},
        "/share.jpg": {"content-type": "image/jpeg", "content-length": "420000"},
        "/share.webp": {"content-type": "image/webp", "content-length": "160000"},
        "/favicon.svg": {"content-type": "image/svg+xml", "content-length": "900"},
        "/apple.png": {"content-type": "image/png", "content-length": "12000"},
        "/favicon.ico": {"content-type": "image/x-icon", "content-length": "15000"},
    }[path]
    return streaming_response(200, request=request, headers=headers)


def test_image_performance_detects_formats_weight_and_modern_recommendations() -> None:
    app.dependency_overrides[get_image_audit_fetcher] = lambda: build_fetcher(image_handler)
    try:
        response = asyncio.run(post("/v1/tools/image-performance", {"url": "https://example.com/"}))
    finally:
        clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_version"] == "webdiag.tool.image_performance.v1"
    assert payload["checked_image_count"] == 9
    assert payload["modern_raster_count"] == 4
    assert payload["legacy_raster_count"] == 4
    assert payload["svg_count"] == 1
    assert payload["oversized_count"] >= 2
    assert payload["missing_dimensions_count"] >= 2
    assert "AVIF" in payload["recommendation"]
    assert any(row["format"] == "avif" for row in payload["format_summaries"])


def test_image_seo_checks_alt_dimensions_responsive_social_and_lazy_signals() -> None:
    app.dependency_overrides[get_image_audit_fetcher] = lambda: build_fetcher(image_handler)
    try:
        response = asyncio.run(post("/v1/tools/image-seo", {"url": "https://example.com/"}))
    finally:
        clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_version"] == "webdiag.tool.image_seo.v1"
    assert payload["total_images"] == 4
    assert payload["empty_alt_count"] == 2
    assert payload["linked_images_without_alt_count"] == 1
    assert payload["og_image_url"] == "https://example.com/share.jpg"
    assert payload["twitter_image_url"] == "https://example.com/share.webp"
    assert any(
        check["id"] == "alt-text" and check["status"] == "fail" for check in payload["checks"]
    )
    assert payload["sample_images"][0]["alt_status"] == "present"


def test_favicon_checker_inspects_declared_icons_manifest_and_fallback() -> None:
    app.dependency_overrides[get_image_audit_fetcher] = lambda: build_fetcher(image_handler)
    try:
        response = asyncio.run(post("/v1/tools/favicon", {"url": "https://example.com/"}))
    finally:
        clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_version"] == "webdiag.tool.favicon.v1"
    assert payload["has_favicon"] is True
    assert payload["has_svg_icon"] is True
    assert payload["has_apple_touch_icon"] is True
    assert payload["has_manifest"] is True
    assert payload["manifest_url"] == "https://example.com/site.webmanifest"
    assert payload["fallback_ico_checked"] is True
    assert {icon["format"] for icon in payload["icons"]} >= {"svg", "png", "ico"}


def test_image_tools_reject_private_targets() -> None:
    app.dependency_overrides[get_image_audit_fetcher] = lambda: build_fetcher(image_handler)
    try:
        response = asyncio.run(post("/v1/tools/image-performance", {"url": "http://127.0.0.1/"}))
    finally:
        clear_overrides()

    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "tool_url_rejected"
