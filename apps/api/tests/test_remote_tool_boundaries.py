import httpx
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from webdiag_api.audit.fetcher import SafeHttpFetcher
from webdiag_api.tools import (
    accessibility_static,
    asset_delivery,
    client_delivery,
    image_audit,
    performance,
    protocol_security,
    security_headers,
    technical_seo,
)


def build_client(module, dependency, *, body: str = "", headers=None):
    app = FastAPI()
    app.include_router(module.router)
    paths: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        paths.append(request.url.path)
        return httpx.Response(
            200,
            headers=headers,
            stream=httpx.ByteStream(body.encode()),
            request=request,
        )

    fetcher = SafeHttpFetcher(
        resolver=lambda _host, _port: ["93.184.216.34"],
        peer_address_provider=lambda _response: ["93.184.216.34"],
        transport=httpx.MockTransport(handler),
    )
    app.dependency_overrides[dependency] = lambda: fetcher
    return TestClient(app, raise_server_exceptions=False), paths


@pytest.mark.parametrize("reference", ["http://[broken", "https://example.com/" + "x" * 2048])
def test_page_weight_reports_skipped_invalid_resource_references(reference: str) -> None:
    client, paths = build_client(
        performance,
        performance.get_page_weight_fetcher,
        body=f'<img src="{reference}"><script src="/app.js"></script>',
        headers={"content-length": "100"},
    )
    with client:
        response = client.post("/v1/tools/page-weight", json={"url": "https://example.com/"})
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["discovered_resource_count"] == 2
    assert payload["checked_resource_count"] == 1
    assert "1 invalid or unsupported resource reference" in payload["recommendation"]
    assert paths == ["/", "/app.js"]


@pytest.mark.parametrize("reference", ["http://[broken", "http://cdn.example.com/" + "x" * 2048])
def test_mixed_content_reports_incomplete_scan_for_invalid_resource_references(reference: str):
    client, paths = build_client(
        protocol_security,
        protocol_security.get_compression_fetcher,
        body=f'<img src="{reference}">',
    )
    with client:
        response = client.post("/v1/tools/mixed-content", json={"url": "https://example.com/"})
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["status"] == "warning"
    assert "1 invalid or unsupported resource reference" in payload["recommendation"]
    assert paths == ["/"]


@pytest.mark.parametrize(
    ("header", "value"),
    [
        ("strict-transport-security", "max-age=31536000; " + "x" * 2048),
        ("content-security-policy", "default-src 'self'; frame-ancestors " + "x" * 2048),
        ("x-content-type-options", "x" * 2049),
        ("x-frame-options", "x" * 2049),
        ("referrer-policy", "x" * 2049),
        ("permissions-policy", "x" * 2049),
    ],
)
def test_security_header_excerpts_are_bounded_without_changing_evaluation(header: str, value: str):
    client, _paths = build_client(
        security_headers,
        security_headers.get_security_headers_fetcher,
        headers={header: value},
    )
    with client:
        response = client.post("/v1/tools/security-headers", json={"url": "https://example.com/"})
    assert response.status_code == 200, response.text
    matching = [check for check in response.json()["checks"] if check["value"]]
    assert matching
    assert all(len(check["value"]) <= 2048 for check in matching)
    assert any(check["value"].endswith("[truncated]") for check in matching)
    if header == "x-content-type-options":
        assert matching[0]["status"] == "warning"


@pytest.mark.parametrize(
    "headers",
    [
        {"cache-control": "public, max-age=3600, " + "x" * 2048},
        {"etag": "x" * 2049},
        {"etag": "x" * 1500, "last-modified": "y" * 1500},
        {"expires": "x" * 2049},
        {"vary": "x" * 2049},
    ],
)
def test_cache_policy_header_excerpts_are_bounded(headers):
    client, _paths = build_client(
        performance, performance.get_cache_policy_fetcher, headers=headers
    )
    with client:
        response = client.post("/v1/tools/cache-policy", json={"url": "https://example.com/"})
    assert response.status_code == 200, response.text
    assert all(
        check["value"] is None or len(check["value"]) <= 2048 for check in response.json()["checks"]
    )


@pytest.mark.parametrize(
    "reference",
    ["http://[broken", "https://example.com/" + "x" * 2048],
    ids=["malformed", "oversized"],
)
@pytest.mark.parametrize(
    ("module", "dependency", "path", "markup"),
    [
        (
            technical_seo,
            technical_seo.get_technical_seo_fetcher,
            "indexability",
            '<link rel="canonical" href="{ref}">',
        ),
        (
            technical_seo,
            technical_seo.get_technical_seo_fetcher,
            "hreflang",
            '<link rel="alternate" hreflang="en" href="{ref}">',
        ),
        (
            asset_delivery,
            asset_delivery.get_asset_delivery_fetcher,
            "javascript-bundle-surface",
            '<script src="{ref}"></script>',
        ),
        (
            asset_delivery,
            asset_delivery.get_asset_delivery_fetcher,
            "css-delivery",
            '<link rel="stylesheet" href="{ref}">',
        ),
        (
            asset_delivery,
            asset_delivery.get_asset_delivery_fetcher,
            "font-loading",
            '<link rel="stylesheet" href="{ref}">',
        ),
        (
            client_delivery,
            client_delivery.get_client_delivery_fetcher,
            "third-party-scripts",
            '<script type="module" src="{ref}"></script>',
        ),
        (
            client_delivery,
            client_delivery.get_client_delivery_fetcher,
            "resource-hints",
            '<link rel="preconnect" href="{ref}">',
        ),
    ],
    ids=["canonical", "hreflang", "js", "css", "font", "scripts", "hints"],
)
def test_remote_references_are_reported_as_invalid_in_other_tools(
    reference, module, dependency, path, markup
):
    client, paths = build_client(
        module,
        dependency,
        body=markup.format(ref=reference),
        headers={"content-type": "text/html"},
    )
    with client:
        response = client.post(f"/v1/tools/{path}", json={"url": "https://example.com/"})
    assert response.status_code == 200, response.text
    payload = response.json()
    if path == "indexability":
        assert payload["resolved_canonical_url"] is None
        canonical = next(signal for signal in payload["signals"] if signal["id"] == "canonical")
        assert canonical["status"] == "warning"
        assert "invalid or unsupported" in canonical["message"]
    elif path == "hreflang":
        assert payload["total_alternates"] == 1
        assert payload["invalid_alternate_count"] == 1
        assert payload["alternates"] == []
        assert "invalid or unsupported" in payload["recommendation"]
    else:
        assert payload["status"] == "warning"
        if module is asset_delivery:
            assert payload["findings"]
        elif path == "third-party-scripts":
            assert payload["scripts"][0]["issues"]
            assert payload["scripts"][0]["resolved_url"] is None
            assert "URL issue" in payload["recommendation"]
        else:
            assert payload["hints"][0]["issues"]
            assert payload["hints"][0]["resolved_url"] is None
    assert all(len(path) < 2048 for path in paths)


@pytest.mark.parametrize(
    ("module", "dependency", "path", "headers", "body"),
    [
        (
            protocol_security,
            protocol_security.get_compression_fetcher,
            "http-headers",
            {"x-test": "x" * 1001},
            "",
        ),
        (
            protocol_security,
            protocol_security.get_compression_fetcher,
            "http-compression",
            {"vary": "x" * 301},
            "",
        ),
        (
            protocol_security,
            protocol_security.get_compression_fetcher,
            "cors",
            {"access-control-allow-headers": "x" * 501},
            "",
        ),
        (
            protocol_security,
            protocol_security.get_compression_fetcher,
            "server-timing",
            {"server-timing": 'metric;desc="' + "x" * 2001 + '"'},
            "",
        ),
        (
            protocol_security,
            protocol_security.get_compression_fetcher,
            "cookie-policy",
            {"set-cookie": "key=value; SameSite=" + "x" * 41},
            "",
        ),
        (
            asset_delivery,
            asset_delivery.get_asset_delivery_fetcher,
            "javascript-bundle-surface",
            {"content-type": "text/html", "cache-control": "x" * 501},
            '<script src="/app.js"></script>',
        ),
        (
            asset_delivery,
            asset_delivery.get_asset_delivery_fetcher,
            "css-delivery",
            {"content-type": "text/html", "cache-control": "x" * 501},
            '<link rel="stylesheet" href="/app.css">',
        ),
        (
            asset_delivery,
            asset_delivery.get_asset_delivery_fetcher,
            "font-loading",
            {"content-type": "text/html", "cache-control": "x" * 501},
            "<style>@font-face {font-family:Test;src:url(/test.woff2);font-display:swap}</style>",
        ),
        (
            technical_seo,
            technical_seo.get_technical_seo_fetcher,
            "technology-detector",
            {"content-type": "text/html", "server": "x" * 241},
            "",
        ),
        (
            performance,
            performance.get_page_weight_fetcher,
            "page-weight",
            {"content-type": "text/html;" + "x" * 241, "content-length": "100"},
            '<img src="/test.jpg">',
        ),
        (
            client_delivery,
            client_delivery.get_client_delivery_fetcher,
            "third-party-scripts",
            {"content-type": "text/html;" + "x" * 301},
            "",
        ),
    ],
    ids=[
        "http-headers",
        "compression",
        "cors",
        "server-timing",
        "cookie",
        "js",
        "css",
        "font",
        "technology",
        "page-weight",
        "scripts",
    ],
)
def test_oversized_remote_headers_return_bounded_excerpts(module, dependency, path, headers, body):
    client, _paths = build_client(module, dependency, headers=headers, body=body)
    with client:
        response = client.post(f"/v1/tools/{path}", json={"url": "https://example.com/"})
    assert response.status_code == 200, response.text
    assert "[truncated]" in response.text


@pytest.mark.parametrize(
    ("module", "dependency", "path"),
    [
        (performance, performance.get_page_weight_fetcher, "page-weight"),
        (security_headers, security_headers.get_security_headers_fetcher, "security-headers"),
        (technical_seo, technical_seo.get_technical_seo_fetcher, "indexability"),
    ],
    ids=["page-weight", "security-headers", "indexability"],
)
def test_oversized_redirect_location_is_rejected_before_following(module, dependency, path):
    client, paths = build_client(module, dependency)
    fetcher = SafeHttpFetcher(
        resolver=lambda _host, _port: ["93.184.216.34"],
        peer_address_provider=lambda _response: ["93.184.216.34"],
        transport=httpx.MockTransport(
            lambda request: (
                paths.append(request.url.path)
                or httpx.Response(
                    302,
                    headers={"location": "https://example.com/" + "x" * 2048},
                    request=request,
                )
            )
        ),
    )
    client.app.dependency_overrides[dependency] = lambda: fetcher
    with client:
        response = client.post(f"/v1/tools/{path}", json={"url": "https://example.com/"})
    assert response.status_code == 400, response.text
    assert response.json()["detail"]["code"] == "tool_url_rejected"
    assert paths == ["/"]


@pytest.mark.parametrize("path", ["javascript-bundle-surface", "css-delivery", "font-loading"])
def test_asset_tools_report_invalid_document_base_url(path: str):
    client, _paths = build_client(
        asset_delivery,
        asset_delivery.get_asset_delivery_fetcher,
        body='<base href="http://[broken">',
        headers={"content-type": "text/html"},
    )
    with client:
        response = client.post(f"/v1/tools/{path}", json={"url": "https://example.com/"})
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["status"] == "warning"
    assert any(finding["id"] == "invalid-document-base" for finding in payload["findings"])


def test_font_loading_reports_unsupported_font_source_instead_of_passing():
    client, paths = build_client(
        asset_delivery,
        asset_delivery.get_asset_delivery_fetcher,
        body='<style>@font-face {font-family:Test;src:url("http://[broken");font-display:swap}</style>',
        headers={"content-type": "text/html"},
    )
    with client:
        response = client.post("/v1/tools/font-loading", json={"url": "https://example.com/"})
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["status"] == "warning"
    assert any(finding["id"] == "invalid-font-sources" for finding in payload["findings"])
    assert paths == ["/"]


@pytest.mark.parametrize(
    "path", ["favicon", "landmark-structure", "form-accessibility", "interactive-accessible-names"]
)
def test_other_tool_header_excerpts_are_bounded(path: str):
    module = image_audit if path == "favicon" else accessibility_static
    dependency = (
        module.get_image_audit_fetcher
        if path == "favicon"
        else module.get_accessibility_static_fetcher
    )
    client, _paths = build_client(
        module,
        dependency,
        body='<link rel="icon" href="/favicon.ico">',
        headers={"content-type": "text/html;" + "x" * 2050},
    )
    with client:
        response = client.post(f"/v1/tools/{path}", json={"url": "https://example.com/"})
    assert response.status_code == 200, response.text
    assert "[truncated]" in response.text


@pytest.mark.parametrize(
    "hostname",
    [".".join(["a" * 63] * 4), ".".join(["\u00fc" * 57] * 4), "a" * 64 + ".example"],
    ids=["dns-overflow", "idna-overflow", "label-overflow"],
)
@pytest.mark.parametrize(
    "path", ["third-party-scripts", "resource-hints", "javascript-bundle-surface", "css-delivery"]
)
def test_resource_hostname_bounds_do_not_overflow_response_fields(hostname: str, path: str):
    module = (
        client_delivery if path in {"third-party-scripts", "resource-hints"} else asset_delivery
    )
    dependency = (
        module.get_client_delivery_fetcher
        if module is client_delivery
        else module.get_asset_delivery_fetcher
    )
    markup = (
        f'<script type="module" src="https://{hostname}/app.js"></script>'
        f'<link rel="preconnect stylesheet" href="https://{hostname}/app.css">'
    )
    client, paths = build_client(
        module, dependency, body=markup, headers={"content-type": "text/html"}
    )
    with client:
        response = client.post(f"/v1/tools/{path}", json={"url": "https://example.com/"})
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["status"] == "warning"
    if path == "third-party-scripts":
        assert payload["scripts"][0]["resolved_url"] is None
    elif path == "resource-hints":
        assert payload["hints"][0]["resolved_url"] is None
    else:
        assert any("invalid" in finding["id"] for finding in payload["findings"])
    assert paths == ["/"]


def test_private_mixed_content_reference_is_still_reported_without_fetching_it():
    client, paths = build_client(
        protocol_security,
        protocol_security.get_compression_fetcher,
        body='<script src="http://127.0.0.1/app.js"></script>',
    )
    with client:
        response = client.post("/v1/tools/mixed-content", json={"url": "https://example.com/"})
    assert response.status_code == 200, response.text
    assert response.json()["active_mixed_content_count"] == 1
    assert response.json()["status"] == "fail"
    assert paths == ["/"]
