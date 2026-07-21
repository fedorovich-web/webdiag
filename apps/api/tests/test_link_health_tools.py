import asyncio
from collections.abc import Callable

import httpx

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeHttpFetcher
from webdiag_api.main import app
from webdiag_api.tools.link_health import get_link_health_fetcher

SAFE_IP = "93.184.216.34"

HTML = b"""<!doctype html>
<html>
<head><meta property="og:image" content="/social.jpg"></head>
<body>
<a href="/about">About us</a>
<a href="https://external.test/post" target="_blank">External</a>
<a href="mailto:hello@example.com">Email</a>
<a href="#pricing">Pricing</a>
<a href="/sponsored" rel="nofollow sponsored">Partner</a>
<img src="/hero.jpg" srcset="/hero.webp 1x, /missing.webp 2x" alt="Hero">
<picture>
  <source srcset="/card.avif" type="image/avif">
  <img src="/card.png" alt="Card">
</picture>
<img src="/broken.png" alt="Broken">
</body>
</html>"""


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
        config=SafeFetchConfig(max_body_bytes=700_000),
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
    path = request.url.path
    host = request.headers.get("host")

    if path == "/":
        return streaming_response(
            200,
            request=request,
            headers={"content-type": "text/html"},
            content=HTML,
        )
    if path in {"/about", "/sponsored"}:
        return streaming_response(
            200,
            request=request,
            headers={"content-type": "text/html"},
        )
    if path == "/post" and host == "external.test":
        return streaming_response(
            404,
            request=request,
            headers={"content-type": "text/html"},
        )
    if path == "/card.png":
        return streaming_response(
            302,
            request=request,
            headers={"location": "/card-final.png"},
        )
    if path == "/broken.png":
        return streaming_response(
            200,
            request=request,
            headers={"content-type": "text/html"},
        )
    if path == "/missing.webp":
        return streaming_response(
            404,
            request=request,
            headers={"content-type": "image/webp"},
        )
    if path in {"/hero.jpg", "/social.jpg"}:
        return streaming_response(
            200,
            request=request,
            headers={"content-type": "image/jpeg"},
        )
    if path == "/hero.webp":
        return streaming_response(
            200,
            request=request,
            headers={"content-type": "image/webp"},
        )
    if path == "/card.avif":
        return streaming_response(
            200,
            request=request,
            headers={"content-type": "image/avif"},
        )
    if path == "/card-final.png":
        return streaming_response(
            200,
            request=request,
            headers={"content-type": "image/png"},
        )

    raise AssertionError(f"Unexpected request: {request.url} {host}")


def test_link_analyzer_counts_links_and_rel_signals() -> None:
    app.dependency_overrides[get_link_health_fetcher] = lambda: build_fetcher(handler)
    try:
        response = asyncio.run(
            post("/v1/tools/link-analyzer", {"url": "https://example.com/"})
        )
    finally:
        clear_overrides()

    payload = response.json()
    assert response.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.link_analyzer.v1"
    assert payload["total_links"] == 5
    assert payload["internal_count"] == 2
    assert payload["external_count"] == 1
    assert payload["same_page_count"] == 1
    assert payload["mailto_tel_count"] == 1
    assert payload["nofollow_count"] == 1
    assert payload["sponsored_count"] == 1
    assert payload["target_blank_missing_noopener_count"] == 1


def test_broken_link_checker_checks_http_links_only() -> None:
    app.dependency_overrides[get_link_health_fetcher] = lambda: build_fetcher(handler)
    try:
        response = asyncio.run(
            post("/v1/tools/broken-links", {"url": "https://example.com/"})
        )
    finally:
        clear_overrides()

    payload = response.json()
    assert response.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.broken_link_checker.v1"
    assert payload["checked_link_count"] == 3
    assert payload["skipped_non_http_count"] == 2
    assert payload["broken_link_count"] == 1


def test_broken_image_checker_flags_404_and_non_image_response() -> None:
    app.dependency_overrides[get_link_health_fetcher] = lambda: build_fetcher(handler)
    try:
        response = asyncio.run(
            post("/v1/tools/broken-images", {"url": "https://example.com/"})
        )
    finally:
        clear_overrides()

    payload = response.json()
    assert response.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.broken_image_checker.v1"
    assert payload["checked_image_count"] == 7
    assert payload["broken_image_count"] == 2
    assert payload["redirecting_image_count"] == 1


def test_link_health_tools_reject_private_targets() -> None:
    app.dependency_overrides[get_link_health_fetcher] = lambda: build_fetcher(handler)
    try:
        response = asyncio.run(
            post("/v1/tools/broken-links", {"url": "http://127.0.0.1/"})
        )
    finally:
        clear_overrides()

    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "tool_url_rejected"
