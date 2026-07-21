import asyncio
from collections.abc import Callable

import httpx

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeHttpFetcher
from webdiag_api.main import app
from webdiag_api.tools.page_metadata import get_page_metadata_fetcher

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


async def post(path: str, json: dict[str, object]) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.post(path, json=json)


def with_fetcher(fetcher: SafeHttpFetcher) -> None:
    app.dependency_overrides[get_page_metadata_fetcher] = lambda: fetcher


def clear_overrides() -> None:
    app.dependency_overrides.clear()


HTML = b"""
<html>
<head>
<title>Example product page for WebDiag metadata testing</title>
<meta name="description"
      content="A concise page description for WebDiag metadata diagnostics.">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://example.com/products/widget">
<meta property="og:title" content="OG Product Title">
<meta property="og:description" content="OG product description for rich previews.">
<meta property="og:image" content="/assets/preview.png">
<meta property="og:url" content="https://example.com/products/widget">
<meta property="og:type" content="product">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Twitter Product Title">
<meta name="twitter:description" content="Twitter product description.">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product"}</script>
</head>
<body><h1>Product heading</h1></body>
</html>
"""


def test_meta_tags_tool_returns_aggregate_metadata_checks() -> None:
    with_fetcher(
        build_fetcher(
            lambda request: streaming_response(
                200,
                request=request,
                headers={"content-type": "text/html; charset=utf-8"},
                content=HTML,
            )
        )
    )
    try:
        response = asyncio.run(post("/v1/tools/meta-tags", {"url": "https://example.com/products/widget"}))
    finally:
        clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_version"] == "webdiag.tool.meta_tags.v1"
    assert payload["title"] == "Example product page for WebDiag metadata testing"
    assert payload["meta_description"].startswith("A concise page description")
    assert payload["resolved_canonical_url"] == "https://example.com/products/widget"
    assert payload["h1_count"] == 1
    assert payload["open_graph_count"] == 5
    assert payload["twitter_card_count"] == 3
    assert payload["json_ld_count"] == 1
    assert {check["id"] for check in payload["checks"]} >= {
        "title",
        "meta-description",
        "canonical",
        "h1-summary",
        "social-metadata",
        "json-ld-summary",
    }


def test_serp_preview_tool_builds_preview_and_snippet_checks() -> None:
    with_fetcher(
        build_fetcher(lambda request: streaming_response(200, request=request, content=HTML))
    )
    try:
        response = asyncio.run(
            post("/v1/tools/serp-preview", {"url": "https://example.com/products/widget"})
        )
    finally:
        clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_version"] == "webdiag.tool.serp_preview.v1"
    assert payload["display_url"] == "example.com/products/widget"
    assert payload["preview_title"] == "Example product page for WebDiag metadata testing"
    assert payload["description_source"] == "meta_description"
    assert payload["checks"][0]["id"] == "title"


def test_social_preview_tool_combines_open_graph_and_twitter_cards() -> None:
    with_fetcher(
        build_fetcher(lambda request: streaming_response(200, request=request, content=HTML))
    )
    try:
        response = asyncio.run(
            post("/v1/tools/social-preview", {"url": "https://example.com/products/widget"})
        )
    finally:
        clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_version"] == "webdiag.tool.social_preview.v1"
    assert payload["open_graph"]["title"] == "OG Product Title"
    assert payload["open_graph"]["image"] == "https://example.com/assets/preview.png"
    assert payload["open_graph"]["complete"] is True
    assert payload["twitter"]["title"] == "Twitter Product Title"
    assert payload["twitter"]["card_type"] == "summary_large_image"
    assert payload["twitter"]["complete"] is True


def test_metadata_tools_reject_disallowed_urls() -> None:
    with_fetcher(
        build_fetcher(lambda request: streaming_response(200, request=request, content=HTML))
    )
    try:
        response = asyncio.run(post("/v1/tools/meta-tags", {"url": "http://127.0.0.1/"}))
    finally:
        clear_overrides()

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "tool_url_rejected",
        "message": "Private or reserved addresses are not allowed.",
    }
