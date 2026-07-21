import asyncio
from collections.abc import Callable

import httpx

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeHttpFetcher
from webdiag_api.main import app
from webdiag_api.tools.canonical import get_canonical_fetcher

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
        return await client.post("/v1/tools/canonical", json=json)


def with_fetcher(fetcher: SafeHttpFetcher) -> None:
    app.dependency_overrides[get_canonical_fetcher] = lambda: fetcher


def clear_overrides() -> None:
    app.dependency_overrides.clear()


def test_canonical_tool_reports_matching_absolute_canonical() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return streaming_response(
            200,
            request=request,
            headers={"content-type": "text/html; charset=utf-8"},
            content=(
                b'<html><head><link rel="canonical" '+
                b'href="https://example.com/catalog/page" /></head><body></body></html>'
            ),
        )

    with_fetcher(build_fetcher(handler))
    try:
        response = asyncio.run(request({"url": "https://example.com/catalog/page"}))
    finally:
        clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_version"] == "webdiag.tool.canonical.v1"
    assert payload["requested_url"] == "https://example.com/catalog/page"
    assert payload["final_url"] == "https://example.com/catalog/page"
    assert payload["canonical_url"] == "https://example.com/catalog/page"
    assert payload["resolved_canonical_url"] == "https://example.com/catalog/page"
    assert payload["canonical_present"] is True
    assert payload["canonical_is_absolute"] is True
    assert payload["canonical_matches_final_url"] is True
    assert payload["canonical_host_matches_final_url"] is True
    assert payload["has_noindex"] is False


def test_canonical_tool_resolves_relative_canonical_and_detects_mismatch() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return streaming_response(
            200,
            request=request,
            content=b"""
<html><head><link rel="canonical" href="/preferred" /></head><body></body></html>
""",
        )

    with_fetcher(build_fetcher(handler))
    try:
        response = asyncio.run(request({"url": "https://example.com/current"}))
    finally:
        clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert payload["canonical_url"] == "/preferred"
    assert payload["resolved_canonical_url"] == "https://example.com/preferred"
    assert payload["canonical_is_absolute"] is False
    assert payload["canonical_matches_final_url"] is False
    assert "relative" in payload["recommendation"].lower()


def test_canonical_tool_reports_missing_canonical_and_noindex() -> None:
    with_fetcher(
        build_fetcher(
            lambda request: streaming_response(
                200,
                request=request,
                content=b'<html><head><meta name="robots" content="noindex, follow"></head></html>',
            )
        )
    )
    try:
        response = asyncio.run(request({"url": "https://example.com/page"}))
    finally:
        clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert payload["canonical_present"] is False
    assert payload["canonical_matches_final_url"] is None
    assert payload["has_noindex"] is True
    assert "noindex" in payload["recommendation"].lower()


def test_canonical_tool_rejects_disallowed_urls() -> None:
    with_fetcher(build_fetcher(lambda request: streaming_response(200, request=request)))
    try:
        response = asyncio.run(request({"url": "http://127.0.0.1/"}))
    finally:
        clear_overrides()

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "tool_url_rejected",
        "message": "Private or reserved addresses are not allowed.",
    }
