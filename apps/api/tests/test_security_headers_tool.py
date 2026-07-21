import asyncio
from collections.abc import Callable

import httpx

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeHttpFetcher
from webdiag_api.main import app
from webdiag_api.tools.security_headers import get_security_headers_fetcher

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
        return await client.post("/v1/tools/security-headers", json=json)


def with_fetcher(fetcher: SafeHttpFetcher) -> None:
    app.dependency_overrides[get_security_headers_fetcher] = lambda: fetcher


def clear_overrides() -> None:
    app.dependency_overrides.clear()


def test_security_headers_tool_reports_present_headers() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return streaming_response(
            200,
            request=request,
            headers={
                "strict-transport-security": "max-age=31536000; includeSubDomains",
                "content-security-policy": "default-src 'self'; frame-ancestors 'none'",
                "x-content-type-options": "nosniff",
                "referrer-policy": "strict-origin-when-cross-origin",
                "permissions-policy": "camera=(), microphone=(), geolocation=()",
            },
            content=b"not-read",
        )

    with_fetcher(build_fetcher(handler))
    try:
        response = asyncio.run(request({"url": "https://example.com/"}))
    finally:
        clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_version"] == "webdiag.tool.security_headers.v1"
    assert payload["requested_url"] == "https://example.com/"
    assert payload["final_url"] == "https://example.com/"
    assert payload["is_https"] is True
    assert payload["score"] == 100
    assert payload["risk_level"] == "low"
    assert payload["present_count"] == 6
    assert payload["missing_count"] == 0
    assert {check["id"] for check in payload["checks"]} == {
        "hsts",
        "csp",
        "x-content-type-options",
        "clickjacking",
        "referrer-policy",
        "permissions-policy",
    }


def test_security_headers_tool_reports_missing_headers_and_http_final_url() -> None:
    with_fetcher(build_fetcher(lambda request: streaming_response(200, request=request)))
    try:
        response = asyncio.run(request({"url": "http://example.com/"}))
    finally:
        clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert payload["is_https"] is False
    assert payload["score"] == 0
    assert payload["risk_level"] == "high"
    assert payload["missing_count"] == 6
    assert payload["checks"][0]["id"] == "hsts"
    assert payload["checks"][0]["status"] == "fail"
    assert "not HTTPS" in payload["recommendation"]


def test_security_headers_tool_does_not_stream_final_body() -> None:
    class FailingBody(httpx.SyncByteStream):
        def __iter__(self):
            raise AssertionError("final body must not be read for header inspection")

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            headers={"content-security-policy": "default-src 'self'"},
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


def test_security_headers_tool_rejects_disallowed_urls() -> None:
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
