import asyncio
from collections.abc import Callable

import httpx

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeHttpFetcher
from webdiag_api.main import app
from webdiag_api.tools.performance import (
    get_cache_policy_fetcher,
    get_page_weight_fetcher,
    get_pagespeed_client,
)

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
        config=SafeFetchConfig(max_body_bytes=500_000),
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


class MockPageSpeedClient:
    def __init__(
        self, payload: dict[str, object] | None = None, error: Exception | None = None
    ) -> None:
        self.payload = payload
        self.error = error
        self.calls: list[tuple[str, str]] = []

    def run(self, *, url: str, strategy: str) -> dict[str, object]:
        self.calls.append((url, strategy))
        if self.error:
            raise self.error
        assert self.payload is not None
        return self.payload


def pagespeed_payload() -> dict[str, object]:
    return {
        "loadingExperience": {
            "overall_category": "FAST",
            "metrics": {"INTERACTION_TO_NEXT_PAINT": {"percentile": 180}},
        },
        "lighthouseResult": {
            "lighthouseVersion": "13.0.0",
            "fetchTime": "2026-07-21T12:00:00Z",
            "categories": {"performance": {"score": 0.91}},
            "audits": {
                "first-contentful-paint": {
                    "title": "First Contentful Paint",
                    "numericValue": 1200,
                    "displayValue": "1.2 s",
                },
                "largest-contentful-paint": {
                    "title": "Largest Contentful Paint",
                    "numericValue": 2200,
                    "displayValue": "2.2 s",
                },
                "speed-index": {
                    "title": "Speed Index",
                    "numericValue": 3000,
                    "displayValue": "3.0 s",
                },
                "total-blocking-time": {
                    "title": "Total Blocking Time",
                    "numericValue": 80,
                    "displayValue": "80 ms",
                },
                "cumulative-layout-shift": {
                    "title": "Cumulative Layout Shift",
                    "numericValue": 0.04,
                    "displayValue": "0.04",
                },
                "uses-optimized-images": {
                    "title": "Optimize images",
                    "score": 0.5,
                    "displayValue": "Potential savings of 450 ms",
                    "details": {"overallSavingsMs": 450},
                },
            },
        },
    }


def test_core_web_vitals_parses_mocked_pagespeed_mobile_and_desktop() -> None:
    client = MockPageSpeedClient(pagespeed_payload())
    app.dependency_overrides[get_pagespeed_client] = lambda: client
    try:
        response = asyncio.run(
            post("/v1/tools/core-web-vitals", {"url": "https://example.com/", "strategy": "both"})
        )
    finally:
        clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_version"] == "webdiag.tool.core_web_vitals.v1"
    assert payload["normalized_url"] == "https://example.com/"
    assert [result["strategy"] for result in payload["results"]] == ["mobile", "desktop"]
    assert payload["results"][0]["available"] is True
    assert payload["results"][0]["performance_score"] == 91
    assert payload["results"][0]["field_data_available"] is True
    assert payload["results"][0]["metrics"][-1]["id"] == "interaction_to_next_paint"
    assert payload["results"][0]["opportunities"][0]["id"] == "uses-optimized-images"
    assert client.calls == [("https://example.com/", "mobile"), ("https://example.com/", "desktop")]


def test_core_web_vitals_returns_config_message_without_api_key() -> None:
    class MissingKeyClient:
        def run(self, *, url: str, strategy: str) -> dict[str, object]:
            from webdiag_api.tools.performance import MissingPageSpeedApiKeyError

            raise MissingPageSpeedApiKeyError("Google PageSpeed API key is not configured.")

    app.dependency_overrides[get_pagespeed_client] = lambda: MissingKeyClient()
    try:
        response = asyncio.run(post("/v1/tools/core-web-vitals", {"url": "https://example.com/"}))
    finally:
        clear_overrides()

    assert response.status_code == 200
    result = response.json()["results"][0]
    assert result["available"] is False
    assert result["fetch_error"] == "Google PageSpeed API key is not configured."


def test_core_web_vitals_rejects_private_targets_before_provider_call() -> None:
    client = MockPageSpeedClient(pagespeed_payload())
    app.dependency_overrides[get_pagespeed_client] = lambda: client
    try:
        response = asyncio.run(post("/v1/tools/core-web-vitals", {"url": "http://127.0.0.1/"}))
    finally:
        clear_overrides()

    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "tool_url_rejected"
    assert client.calls == []


def test_cache_policy_scores_static_assets_and_validators() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return streaming_response(
            200,
            request=request,
            headers={
                "content-type": "application/javascript",
                "cache-control": "public, max-age=31536000, immutable",
                "etag": '"abc"',
                "content-encoding": "br",
                "vary": "Accept-Encoding",
            },
        )

    app.dependency_overrides[get_cache_policy_fetcher] = lambda: build_fetcher(handler)
    try:
        response = asyncio.run(
            post("/v1/tools/cache-policy", {"url": "https://example.com/app.js"})
        )
    finally:
        clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_version"] == "webdiag.tool.cache_policy.v1"
    assert payload["is_static_asset"] is True
    assert payload["score"] == 100
    assert all(check["status"] == "pass" for check in payload["checks"])


def test_cache_policy_flags_missing_headers() -> None:
    app.dependency_overrides[get_cache_policy_fetcher] = lambda: build_fetcher(
        lambda request: streaming_response(
            200, request=request, headers={"content-type": "text/html"}
        )
    )
    try:
        response = asyncio.run(post("/v1/tools/cache-policy", {"url": "https://example.com/"}))
    finally:
        clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert payload["score"] < 100
    assert payload["checks"][0]["id"] == "cache-control"
    assert payload["checks"][0]["status"] == "fail"


def test_page_weight_collects_static_resources_and_image_format_signals() -> None:
    html = b"""
    <!doctype html><html><head>
      <link rel="stylesheet" href="/app.css">
      <script src="/app.js"></script>
    </head><body>
      <img src="/hero.jpg" srcset="/hero.webp 1x, /hero.avif 2x">
      <picture><source srcset="/card.avif" type="image/avif"><img src="/card.png"></picture>
    </body></html>
    """

    def handler(request: httpx.Request) -> httpx.Response:
        path = request.url.path
        if path == "/":
            return streaming_response(
                200, request=request, headers={"content-type": "text/html"}, content=html
            )
        headers = {
            "/app.css": {"content-type": "text/css", "content-length": "12000"},
            "/app.js": {"content-type": "application/javascript", "content-length": "64000"},
            "/hero.jpg": {"content-type": "image/jpeg", "content-length": "600000"},
            "/hero.webp": {"content-type": "image/webp", "content-length": "220000"},
            "/hero.avif": {"content-type": "image/avif", "content-length": "160000"},
            "/card.avif": {"content-type": "image/avif", "content-length": "42000"},
            "/card.png": {"content-type": "image/png", "content-length": "180000"},
        }[path]
        return streaming_response(200, request=request, headers=headers)

    app.dependency_overrides[get_page_weight_fetcher] = lambda: build_fetcher(handler)
    try:
        response = asyncio.run(post("/v1/tools/page-weight", {"url": "https://example.com/"}))
    finally:
        clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_version"] == "webdiag.tool.page_weight.v1"
    assert payload["discovered_resource_count"] == 7
    assert payload["checked_resource_count"] == 7
    assert payload["image_count"] == 5
    assert payload["legacy_image_count"] == 2
    assert payload["modern_image_count"] == 3
    assert payload["total_known_bytes"] == 1_278_000
    assert "AVIF/WebP" in payload["recommendation"]


def test_page_weight_rejects_disallowed_urls() -> None:
    app.dependency_overrides[get_page_weight_fetcher] = lambda: build_fetcher(
        lambda request: streaming_response(
            200, request=request, headers={"content-type": "text/html"}, content=b"ok"
        )
    )
    try:
        response = asyncio.run(post("/v1/tools/page-weight", {"url": "http://127.0.0.1/"}))
    finally:
        clear_overrides()

    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "tool_url_rejected"
