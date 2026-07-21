import asyncio
from collections.abc import Callable

import httpx

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeHttpFetcher
from webdiag_api.main import app
from webdiag_api.tools.http_status import get_http_status_fetcher

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
        config=SafeFetchConfig(max_body_bytes=1_024),
        resolver=lambda _hostname, _port: [SAFE_IP],
        peer_address_provider=lambda _response: [SAFE_IP],
        transport=httpx.MockTransport(handler),
    )


async def request(json: dict[str, object]) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.post("/v1/tools/http-status", json=json)


def with_fetcher(fetcher: SafeHttpFetcher) -> None:
    app.dependency_overrides[get_http_status_fetcher] = lambda: fetcher


def clear_overrides() -> None:
    app.dependency_overrides.clear()


def test_http_status_tool_returns_status_headers_and_redirect_chain() -> None:
    seen_paths: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen_paths.append(request.url.path or "/")
        if request.url.path == "/old":
            return streaming_response(
                301,
                request=request,
                headers={"location": "/new"},
            )
        return streaming_response(
            200,
            request=request,
            headers={
                "content-type": "text/html; charset=utf-8",
                "content-length": "5242880",
                "cache-control": "public, max-age=60",
            },
            content=b"x" * 2_048,
        )

    with_fetcher(build_fetcher(handler))
    try:
        response = asyncio.run(request({"url": "https://example.com/old"}))
    finally:
        clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_version"] == "webdiag.tool.http_status.v1"
    assert payload["requested_url"] == "https://example.com/old"
    assert payload["final_url"] == "https://example.com/new"
    assert payload["status_code"] == 200
    assert payload["ok"] is True
    assert payload["redirect_count"] == 1
    assert payload["redirect_chain"] == [
        {
            "source_url": "https://example.com/old",
            "target_url": "https://example.com/new",
            "status_code": 301,
        }
    ]
    assert payload["headers"] == {
        "content_type": "text/html; charset=utf-8",
        "content_length": "5242880",
        "cache_control": "public, max-age=60",
        "server": None,
    }
    assert seen_paths == ["/old", "/new"]


def test_http_status_tool_does_not_stream_final_body() -> None:
    class FailingBody(httpx.SyncByteStream):
        def __iter__(self):
            raise AssertionError("final body must not be read for status inspection")

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            headers={"content-type": "text/html", "content-length": "10000000"},
            stream=FailingBody(),
            request=request,
        )

    with_fetcher(build_fetcher(handler))
    try:
        response = asyncio.run(request({"url": "https://example.com/"}))
    finally:
        clear_overrides()

    assert response.status_code == 200
    assert response.json()["status_code"] == 200


def test_http_status_tool_rejects_disallowed_urls() -> None:
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


def test_http_status_tool_normalizes_fetch_failures() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.TimeoutException("timeout", request=request)

    with_fetcher(build_fetcher(handler))
    try:
        response = asyncio.run(request({"url": "https://example.com/"}))
    finally:
        clear_overrides()

    assert response.status_code == 502
    assert response.json()["detail"] == {
        "code": "tool_fetch_failed",
        "message": "HTTP fetch timed out.",
    }
