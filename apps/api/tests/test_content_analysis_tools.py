import asyncio
from collections.abc import Callable

import httpx

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeHttpFetcher
from webdiag_api.main import app
from webdiag_api.tools.content_analysis import get_content_analysis_fetcher

SAFE_IP = "93.184.216.34"

HTML = b"""<!doctype html>
<html lang="en">
<head><title>Readable WebDiag content sample</title></head>
<body>
<h1>Primary SEO topic</h1>
<h3>Skipped subsection</h3>
<h2>Buying guide</h2>
<p>WebDiag checks content quality for technical SEO teams. The page explains audit
workflows, image optimization, metadata, structured data, links, monitoring, and
performance. Clear content helps users understand priorities and helps teams avoid
keyword stuffing.</p>
<p>Long sentences should be controlled because dense text reduces scanning speed and
makes recommendations harder to act on for product, SEO, and engineering teams.</p>
<p>SEO audit tools should show evidence, grouped recommendations, and practical next
steps instead of one-field checks.</p>
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
        config=SafeFetchConfig(max_body_bytes=1_000_000),
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


def html_handler(request: httpx.Request) -> httpx.Response:
    return streaming_response(
        200,
        request=request,
        headers={"content-type": "text/html; charset=utf-8"},
        content=HTML,
    )


def test_heading_structure_checker_reports_outline_and_h1_subcheck() -> None:
    app.dependency_overrides[get_content_analysis_fetcher] = lambda: build_fetcher(
        html_handler
    )
    try:
        response = asyncio.run(
            post("/v1/tools/heading-structure", {"url": "https://example.com/"})
        )
    finally:
        clear_overrides()

    payload = response.json()
    assert response.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.heading_structure.v1"
    assert payload["h1_count"] == 1
    assert payload["skipped_level_count"] == 1
    assert payload["total_headings"] == 3
    assert "h1-summary" in {check["id"] for check in payload["checks"]}


def test_keyword_frequency_analyzer_reports_words_phrases_and_density() -> None:
    app.dependency_overrides[get_content_analysis_fetcher] = lambda: build_fetcher(
        html_handler
    )
    try:
        response = asyncio.run(
            post("/v1/tools/keyword-density", {"url": "https://example.com/"})
        )
    finally:
        clear_overrides()

    payload = response.json()
    assert response.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.keyword_frequency.v1"
    assert payload["total_words"] > 40
    assert payload["unique_terms"] > 10
    assert any(item["term"] == "webdiag" for item in payload["top_words"])
    assert isinstance(payload["top_bigrams"], list)


def test_readability_analyzer_reports_multilingual_heuristics() -> None:
    app.dependency_overrides[get_content_analysis_fetcher] = lambda: build_fetcher(
        html_handler
    )
    try:
        response = asyncio.run(
            post("/v1/tools/readability", {"url": "https://example.com/"})
        )
    finally:
        clear_overrides()

    payload = response.json()
    assert response.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.readability.v1"
    assert payload["formula_scope"] == "multilingual_heuristic"
    assert payload["word_count"] > 40
    assert payload["sentence_count"] >= 3
    assert 0 <= payload["readability_score"] <= 100


def test_content_analysis_tools_reject_private_targets() -> None:
    app.dependency_overrides[get_content_analysis_fetcher] = lambda: build_fetcher(
        html_handler
    )
    try:
        response = asyncio.run(
            post("/v1/tools/readability", {"url": "http://127.0.0.1/"})
        )
    finally:
        clear_overrides()

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "tool_url_rejected",
        "message": "Private or reserved addresses are not allowed.",
    }
