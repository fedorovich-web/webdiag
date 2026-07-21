from __future__ import annotations

import asyncio

import httpx

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeHttpFetcher
from webdiag_api.main import app
from webdiag_api.tools.client_delivery import get_client_delivery_fetcher

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


def override_fetcher(handler: httpx.MockTransport) -> None:
    app.dependency_overrides[get_client_delivery_fetcher] = lambda: build_fetcher(handler)


def clear_overrides() -> None:
    app.dependency_overrides.clear()


def test_csp_analyzer_reports_header_meta_and_risky_sources() -> None:
    html = b"""
    <html><head>
      <meta http-equiv="Content-Security-Policy"
        content="default-src 'self'; object-src 'none'; base-uri 'self'">
    </head></html>
    """

    def handler(request: httpx.Request) -> httpx.Response:
        return streaming_response(
            200,
            request=request,
            headers={
                "content-type": "text/html; charset=utf-8",
                "content-security-policy": (
                    "default-src 'self'; script-src 'self' 'unsafe-inline' *; "
                    "object-src 'none'; base-uri 'self'"
                ),
                "content-security-policy-report-only": "default-src 'none'",
            },
            content=html,
        )

    override_fetcher(httpx.MockTransport(handler))
    try:
        response = asyncio.run(post("/v1/tools/csp", {"url": "https://example.com/"}))
    finally:
        clear_overrides()

    payload = response.json()
    assert response.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.csp_analyzer.v1"
    assert payload["enforced_policy_count"] == 2
    assert payload["report_only_policy_count"] == 1
    assert payload["meta_policy_count"] == 1
    assert payload["high_risk_finding_count"] >= 2
    assert {finding["id"].split("-")[0] for finding in payload["findings"]} >= {
        "unsafe",
        "wildcard",
    }
    assert payload["status"] == "fail"


def test_csp_analyzer_passes_restrictive_header_policy() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return streaming_response(
            200,
            request=request,
            headers={
                "content-type": "text/html",
                "content-security-policy": (
                    "default-src 'self'; script-src 'self'; object-src 'none'; "
                    "base-uri 'none'; frame-ancestors 'none'"
                ),
            },
            content=b"<html></html>",
        )

    override_fetcher(httpx.MockTransport(handler))
    try:
        response = asyncio.run(post("/v1/tools/csp", {"url": "https://example.com/"}))
    finally:
        clear_overrides()

    payload = response.json()
    assert response.status_code == 200
    assert payload["finding_count"] == 0
    assert payload["status"] == "pass"


def test_csp_analyzer_fails_when_policy_is_missing() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return streaming_response(
            200,
            request=request,
            headers={"content-type": "text/html"},
            content=b"<html></html>",
        )

    override_fetcher(httpx.MockTransport(handler))
    try:
        response = asyncio.run(post("/v1/tools/csp", {"url": "https://example.com/"}))
    finally:
        clear_overrides()

    payload = response.json()
    assert response.status_code == 200
    assert payload["enforced_policy_count"] == 0
    assert payload["findings"][0]["id"] == "missing-enforced-policy"
    assert payload["status"] == "fail"


def test_third_party_script_analyzer_reports_bounded_static_inventory() -> None:
    html = b"""
    <html><head>
      <script src="/app.js" defer></script>
      <script src="https://www.googletagmanager.com/gtm.js" async></script>
      <script src="https://cdn.jsdelivr.net/npm/pkg/app.js"
        integrity="sha384-x" crossorigin></script>
      <script src="https://cdn.jsdelivr.net/npm/pkg/app.js"></script>
      <script type="module" src="/module.js"></script>
      <script nomodule src="/legacy.js"></script>
      <script>window.inline = true;</script>
    </head></html>
    """

    def handler(request: httpx.Request) -> httpx.Response:
        return streaming_response(
            200,
            request=request,
            headers={"content-type": "text/html; charset=utf-8"},
            content=html,
        )

    override_fetcher(httpx.MockTransport(handler))
    try:
        response = asyncio.run(
            post("/v1/tools/third-party-scripts", {"url": "https://example.com/page"})
        )
    finally:
        clear_overrides()

    payload = response.json()
    assert response.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.third_party_script_analyzer.v1"
    assert payload["classification_basis"] == "hostname"
    assert payload["script_count"] == 7
    assert payload["inline_script_count"] == 1
    assert payload["external_script_count"] == 6
    assert payload["same_host_script_count"] == 3
    assert payload["cross_host_script_count"] == 3
    assert payload["async_count"] == 1
    assert payload["defer_count"] == 1
    assert payload["module_count"] == 1
    assert payload["nomodule_count"] == 1
    assert payload["integrity_count"] == 1
    assert payload["crossorigin_count"] == 1
    assert payload["duplicate_src_count"] == 1
    assert payload["parser_blocking_candidate_count"] == 4
    assert {group["classification"] for group in payload["host_groups"]} >= {
        "tag-manager-pattern",
        "cdn-pattern",
    }
    assert payload["status"] == "warning"



def test_inline_classic_scripts_remain_parser_blocking_with_ignored_loading_attributes() -> None:
    html = b"""
    <html><head>
      <script async>window.first = true;</script>
      <script defer>window.second = true;</script>
      <script type="module">window.module = true;</script>
    </head></html>
    """

    def handler(request: httpx.Request) -> httpx.Response:
        return streaming_response(
            200,
            request=request,
            headers={"content-type": "text/html"},
            content=html,
        )

    override_fetcher(httpx.MockTransport(handler))
    try:
        response = asyncio.run(
            post("/v1/tools/third-party-scripts", {"url": "https://example.com/"})
        )
    finally:
        clear_overrides()

    payload = response.json()
    assert response.status_code == 200
    assert payload["inline_script_count"] == 3
    assert payload["parser_blocking_candidate_count"] == 2


def test_third_party_script_analyzer_caps_sample_but_keeps_counts() -> None:
    html = "<html>" + "".join(
        f'<script src="/asset-{index}.js" defer></script>' for index in range(105)
    ) + "</html>"

    def handler(request: httpx.Request) -> httpx.Response:
        return streaming_response(
            200,
            request=request,
            headers={"content-type": "text/html"},
            content=html.encode(),
        )

    override_fetcher(httpx.MockTransport(handler))
    try:
        response = asyncio.run(
            post("/v1/tools/third-party-scripts", {"url": "https://example.com/"})
        )
    finally:
        clear_overrides()

    payload = response.json()
    assert response.status_code == 200
    assert payload["script_count"] == 105
    assert payload["external_script_count"] == 105
    assert payload["defer_count"] == 105
    assert len(payload["scripts"]) == 100
    assert payload["truncated"] is True


def test_resource_hints_analyzer_reports_duplicates_and_likely_misuse() -> None:
    html = b"""
    <html><head>
      <link rel="preconnect" href="https://cdn.example.net">
      <link rel="preconnect" href="https://a.example.net">
      <link rel="preconnect" href="https://b.example.net">
      <link rel="preconnect" href="https://c.example.net">
      <link rel="preconnect" href="https://d.example.net">
      <link rel="preconnect" href="https://e.example.net">
      <link rel="preconnect" href="https://f.example.net">
      <link rel="preload" href="/hero.webp">
      <link rel="preload" href="/hero.webp">
      <link rel="modulepreload" href="https://cdn.example.net/app.js">
      <link rel="dns-prefetch" href="//static.example.net">
      <link rel="prefetch" href="/next-page">
      <link rel="preinit" href="/future.js" as="script">
    </head></html>
    """

    def handler(request: httpx.Request) -> httpx.Response:
        return streaming_response(
            200,
            request=request,
            headers={"content-type": "text/html"},
            content=html,
        )

    override_fetcher(httpx.MockTransport(handler))
    try:
        response = asyncio.run(
            post("/v1/tools/resource-hints", {"url": "https://example.com/"})
        )
    finally:
        clear_overrides()

    payload = response.json()
    assert response.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.resource_hints_analyzer.v1"
    assert payload["hint_count"] == 13
    assert payload["preconnect_count"] == 7
    assert payload["preload_count"] == 2
    assert payload["modulepreload_count"] == 1
    assert payload["dns_prefetch_count"] == 1
    assert payload["prefetch_count"] == 1
    assert payload["preinit_count"] == 1
    assert payload["duplicate_hint_count"] == 1
    assert {finding["id"] for finding in payload["findings"]} >= {
        "duplicate-hints",
        "many-preconnects",
        "preload-missing-as",
        "cross-host-without-crossorigin",
    }
    assert payload["status"] == "warning"


def test_static_html_analyzers_reject_non_html_response_semantically() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return streaming_response(
            200,
            request=request,
            headers={"content-type": "application/json"},
            content=b'{"script":"https://cdn.example.net/app.js"}',
        )

    override_fetcher(httpx.MockTransport(handler))
    try:
        scripts = asyncio.run(
            post("/v1/tools/third-party-scripts", {"url": "https://example.com/data"})
        )
        hints = asyncio.run(
            post("/v1/tools/resource-hints", {"url": "https://example.com/data"})
        )
    finally:
        clear_overrides()

    assert scripts.status_code == 200
    assert scripts.json()["script_count"] == 0
    assert scripts.json()["status"] == "fail"
    assert hints.status_code == 200
    assert hints.json()["hint_count"] == 0
    assert hints.json()["status"] == "fail"


def test_client_delivery_tools_reject_private_target() -> None:
    response = asyncio.run(post("/v1/tools/csp", {"url": "http://127.0.0.1/"}))
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "tool_url_rejected"


def test_client_delivery_tools_normalize_body_limit_failure() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return streaming_response(
            200,
            request=request,
            headers={"content-type": "text/html", "content-length": "2000000"},
        )

    override_fetcher(httpx.MockTransport(handler))
    try:
        response = asyncio.run(
            post("/v1/tools/resource-hints", {"url": "https://example.com/"})
        )
    finally:
        clear_overrides()

    assert response.status_code == 502
    assert response.json()["detail"]["code"] == "tool_fetch_failed"
