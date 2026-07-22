from __future__ import annotations

import asyncio
import gzip

import httpx

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeHttpFetcher
from webdiag_api.main import app
from webdiag_api.tools.asset_delivery import get_asset_delivery_fetcher

SAFE_IP = "93.184.216.34"


async def post(path: str, payload: dict[str, object]) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.post(path, json=payload)


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


def build_fetcher(handler: httpx.MockTransport, *, max_body_bytes: int = 1_000_000):
    return SafeHttpFetcher(
        config=SafeFetchConfig(max_body_bytes=max_body_bytes),
        resolver=lambda _host, _port: [SAFE_IP],
        peer_address_provider=lambda _response: [SAFE_IP],
        transport=handler,
    )


def override_fetcher(handler: httpx.MockTransport, *, max_body_bytes: int = 1_000_000) -> None:
    app.dependency_overrides[get_asset_delivery_fetcher] = lambda: build_fetcher(
        handler,
        max_body_bytes=max_body_bytes,
    )


def clear_overrides() -> None:
    app.dependency_overrides.clear()


def test_javascript_bundle_surface_inspects_bounded_delivery_headers() -> None:
    html = b"""
    <html><head>
      <script src="/app.js#first"></script>
      <script src="/app.js#second"></script>
      <script src="/vendor.js" defer></script>
      <script type="module" src="https://cdn.example.net/module.js"></script>
      <script src="javascript:alert(1)"></script>
    </head></html>
    """

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/":
            return streaming_response(
                200,
                request=request,
                headers={"content-type": "text/html"},
                content=html,
            )
        if request.url.path == "/app.js":
            return streaming_response(
                200,
                request=request,
                headers={
                    "content-type": "application/javascript",
                    "content-length": "700000",
                    "content-encoding": "gzip",
                    "cache-control": "public, max-age=31536000, immutable",
                },
            )
        if request.url.path == "/vendor.js":
            return streaming_response(
                200,
                request=request,
                headers={
                    "content-type": "text/javascript",
                    "content-length": "400000",
                    "cache-control": "public, max-age=60",
                },
            )
        return streaming_response(
            200,
            request=request,
            headers={
                "content-type": "application/javascript",
                "content-length": "100000",
                "content-encoding": "br",
                "cache-control": "public, max-age=604800",
            },
        )

    override_fetcher(httpx.MockTransport(handler))
    try:
        response = asyncio.run(
            post(
                "/v1/tools/javascript-bundle-surface",
                {"url": "https://example.com/"},
            )
        )
    finally:
        clear_overrides()

    payload = response.json()
    assert response.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.javascript_bundle_surface.v1"
    assert payload["scan_mode"] == "static_html_bounded_headers"
    assert payload["discovered_script_count"] == 5
    assert payload["unique_script_count"] == 3
    assert payload["checked_script_count"] == 3
    assert payload["same_host_script_count"] == 2
    assert payload["cross_host_script_count"] == 1
    assert payload["module_script_count"] == 1
    assert payload["classic_script_count"] == 3
    assert payload["parser_blocking_candidate_count"] == 2
    assert payload["duplicate_src_count"] == 1
    assert payload["known_declared_bytes"] == 1_200_000
    assert payload["compressed_response_count"] == 2
    assert payload["long_cache_count"] == 2
    assert {finding["id"] for finding in payload["findings"]} >= {
        "invalid-script-urls",
        "duplicate-script-sources",
        "large-declared-javascript-surface",
    }
    assert payload["status"] == "warning"


def test_javascript_bundle_surface_resolves_relative_assets_against_document_base() -> None:
    html = b"""
    <html><head>
      <base href="https://cdn.example.net/assets/">
      <script src="app.js" defer></script>
    </head></html>
    """
    requests: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(str(request.url))
        if request.url.path == "/":
            return streaming_response(
                200,
                request=request,
                headers={"content-type": "text/html"},
                content=html,
            )
        return streaming_response(
            200,
            request=request,
            headers={
                "content-type": "application/javascript",
                "content-length": "1200",
            },
        )

    override_fetcher(httpx.MockTransport(handler))
    try:
        response = asyncio.run(
            post(
                "/v1/tools/javascript-bundle-surface",
                {"url": "https://example.com/"},
            )
        )
    finally:
        clear_overrides()

    payload = response.json()
    assert response.status_code == 200
    assert requests == [
        "https://93.184.216.34/",
        "https://93.184.216.34/assets/app.js",
    ]
    assert payload["unique_script_count"] == 1
    assert payload["cross_host_script_count"] == 1
    assert payload["assets"][0]["resolved_url"] == "https://cdn.example.net/assets/app.js"
    assert {finding["id"] for finding in payload["findings"]} >= {
        "javascript-without-content-encoding",
        "javascript-without-long-cache",
    }
    assert payload["status"] == "warning"



def test_javascript_bundle_surface_records_rejected_asset_without_fetching_private_host() -> None:
    html = b'<script src="http://127.0.0.1/private.js"></script>'
    requests: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request.url.path)
        return streaming_response(
            200,
            request=request,
            headers={"content-type": "text/html"},
            content=html,
        )

    override_fetcher(httpx.MockTransport(handler))
    try:
        response = asyncio.run(
            post(
                "/v1/tools/javascript-bundle-surface",
                {"url": "https://example.com/"},
            )
        )
    finally:
        clear_overrides()

    payload = response.json()
    assert response.status_code == 200
    assert requests == ["/"]
    assert payload["failed_asset_count"] == 1
    assert payload["assets"][0]["fetch_state"] == "rejected"
    assert payload["status"] == "warning"


def test_css_delivery_analyzer_parses_inline_and_external_css() -> None:
    html = b"""
    <html><head>
      <link rel="stylesheet" href="/main.css">
      <link rel="stylesheet" href="/main.css">
      <link rel="stylesheet" href="https://cdn.example.net/print.css" media="print">
      <style>
        .hero { color: red }
        @font-face { font-family: Inline; src: url(/inline.woff2) }
      </style>
    </head></html>
    """
    main_css = (
        b"/* @import url('/ignored.css'); @font-face { font-family: Ignored; } */ "
        b"@import url('/base.css'); "
        b"@font-face { font-family: Main; src: url('/main.woff2') }"
    )
    compressed_main = gzip.compress(main_css)

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/":
            return streaming_response(
                200,
                request=request,
                headers={"content-type": "text/html"},
                content=html,
            )
        if request.url.path == "/main.css":
            return streaming_response(
                200,
                request=request,
                headers={
                    "content-type": "text/css",
                    "content-length": str(len(compressed_main)),
                    "content-encoding": "gzip",
                    "cache-control": "public, max-age=31536000, immutable",
                },
                content=compressed_main,
            )
        return streaming_response(
            200,
            request=request,
            headers={"content-type": "text/plain", "content-length": "20"},
            content=b"body { color: black }",
        )

    override_fetcher(httpx.MockTransport(handler))
    try:
        response = asyncio.run(
            post("/v1/tools/css-delivery", {"url": "https://example.com/"})
        )
    finally:
        clear_overrides()

    payload = response.json()
    assert response.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.css_delivery_analyzer.v1"
    assert payload["stylesheet_link_count"] == 3
    assert payload["unique_stylesheet_count"] == 2
    assert payload["checked_stylesheet_count"] == 2
    assert payload["inline_style_block_count"] == 1
    assert payload["inline_style_bytes"] > 0
    assert payload["same_host_stylesheet_count"] == 1
    assert payload["cross_host_stylesheet_count"] == 1
    assert payload["default_media_candidate_count"] == 1
    assert payload["conditional_media_count"] == 1
    assert payload["duplicate_href_count"] == 1
    assert payload["compressed_response_count"] == 1
    assert payload["import_rule_count"] == 1
    assert payload["font_face_rule_count"] == 2
    assert {finding["id"] for finding in payload["findings"]} >= {
        "duplicate-stylesheets",
        "css-import-rules",
        "stylesheet-mime-mismatch",
    }
    assert payload["status"] == "warning"


def test_css_delivery_analyzer_records_oversized_stylesheet_as_bounded_failure() -> None:
    html = b'<link rel="stylesheet" href="/huge.css">'

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/":
            return streaming_response(
                200,
                request=request,
                headers={"content-type": "text/html"},
                content=html,
            )
        return streaming_response(
            200,
            request=request,
            headers={"content-type": "text/css", "content-length": "2000000"},
        )

    override_fetcher(httpx.MockTransport(handler))
    try:
        response = asyncio.run(
            post("/v1/tools/css-delivery", {"url": "https://example.com/"})
        )
    finally:
        clear_overrides()

    payload = response.json()
    assert response.status_code == 200
    assert payload["failed_stylesheet_count"] == 1
    assert payload["stylesheets"][0]["fetch_state"] == "failed"
    assert {finding["id"] for finding in payload["findings"]} >= {
        "stylesheet-fetch-failures"
    }


def test_font_loading_analyzer_correlates_faces_sources_and_preloads() -> None:
    html = b"""
    <html><head>
      <link rel="stylesheet" href="/fonts.css">
      <link rel="preload" as="font" href="/main.woff2" type="font/woff2" crossorigin>
      <link rel="preload" as="font" href="https://cdn.example.net/orphan.woff2">
      <style>
        @font-face {
          font-family: Inline;
          src: local('Inline'), url('/inline.woff') format('woff');
          font-display: block;
        }
      </style>
    </head></html>
    """
    fonts_css = b"""
    @font-face {
      font-family: Main;
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: url('/main.woff2') format('woff2'), url('/main.woff') format('woff');
    }
    @font-face {
      font-family: MissingDisplay;
      src: url('https://cdn.example.net/remote.woff2') format('woff2');
    }
    """

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/":
            return streaming_response(
                200,
                request=request,
                headers={"content-type": "text/html"},
                content=html,
            )
        if request.url.path == "/fonts.css":
            return streaming_response(
                200,
                request=request,
                headers={"content-type": "text/css"},
                content=fonts_css,
            )
        font_headers = {
            "content-type": "font/woff2" if request.url.path.endswith(".woff2") else "font/woff",
            "content-length": "250000",
            "cache-control": "public, max-age=31536000, immutable",
        }
        return streaming_response(200, request=request, headers=font_headers)

    override_fetcher(httpx.MockTransport(handler))
    try:
        response = asyncio.run(
            post("/v1/tools/font-loading", {"url": "https://example.com/"})
        )
    finally:
        clear_overrides()

    payload = response.json()
    assert response.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.font_loading_analyzer.v1"
    assert payload["stylesheet_count"] == 1
    assert payload["checked_stylesheet_count"] == 1
    assert payload["font_face_count"] == 3
    assert payload["family_count"] == 3
    assert payload["font_source_count"] == 4
    assert payload["unique_font_source_count"] == 4
    assert payload["checked_font_source_count"] == 4
    assert payload["local_source_count"] == 1
    assert payload["preload_count"] == 2
    assert payload["matched_preload_count"] == 1
    assert payload["missing_font_display_count"] == 1
    assert payload["blocking_font_display_count"] == 1
    assert payload["swap_or_optional_count"] == 1
    assert payload["cross_host_font_count"] == 1
    assert payload["woff2_source_count"] == 2
    assert payload["known_declared_bytes"] == 1_000_000
    assert {finding["id"] for finding in payload["findings"]} >= {
        "missing-font-display",
        "blocking-font-display",
        "unmatched-font-preloads",
        "font-preload-crossorigin",
        "large-declared-font-surface",
    }
    assert payload["status"] == "warning"


def test_font_loading_analyzer_keeps_public_target_policy_for_nested_assets() -> None:
    html = b"""
    <style>
      @font-face { font-family: Private; src: url('http://127.0.0.1/font.woff2'); }
    </style>
    """
    requests: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request.url.path)
        return streaming_response(
            200,
            request=request,
            headers={"content-type": "text/html"},
            content=html,
        )

    override_fetcher(httpx.MockTransport(handler))
    try:
        response = asyncio.run(
            post("/v1/tools/font-loading", {"url": "https://example.com/"})
        )
    finally:
        clear_overrides()

    payload = response.json()
    assert response.status_code == 200
    assert requests == ["/"]
    assert payload["failed_font_count"] == 1
    assert payload["assets"][0]["fetch_state"] == "rejected"


def test_asset_delivery_analyzers_fail_semantically_for_non_html_document() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return streaming_response(
            200,
            request=request,
            headers={"content-type": "application/json"},
            content=b"{}",
        )

    override_fetcher(httpx.MockTransport(handler))
    try:
        responses = [
            asyncio.run(
                post(
                    "/v1/tools/javascript-bundle-surface",
                    {"url": "https://example.com/data"},
                )
            ),
            asyncio.run(
                post("/v1/tools/css-delivery", {"url": "https://example.com/data"})
            ),
            asyncio.run(
                post("/v1/tools/font-loading", {"url": "https://example.com/data"})
            ),
        ]
    finally:
        clear_overrides()

    for response in responses:
        assert response.status_code == 200
        assert response.json()["status"] == "fail"
        assert response.json()["findings"][0]["id"] == "non-html-document"


def test_asset_delivery_analyzers_reject_private_page_target() -> None:
    response = asyncio.run(
        post("/v1/tools/css-delivery", {"url": "http://127.0.0.1/"})
    )
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "tool_url_rejected"


def test_asset_delivery_analyzers_normalize_page_body_limit_failure() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return streaming_response(
            200,
            request=request,
            headers={"content-type": "text/html", "content-length": "2000000"},
        )

    override_fetcher(httpx.MockTransport(handler))
    try:
        response = asyncio.run(
            post("/v1/tools/font-loading", {"url": "https://example.com/"})
        )
    finally:
        clear_overrides()

    assert response.status_code == 502
    assert response.json()["detail"]["code"] == "tool_fetch_failed"
