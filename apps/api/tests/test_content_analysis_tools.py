import asyncio
from collections.abc import Callable

import httpx
import pytest

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


@pytest.mark.parametrize("endpoint", ["keyword-density", "readability"])
def test_content_metrics_use_body_words_without_splitting_inline_markup(endpoint: str) -> None:
    html = (
        '<head><title>Ignore title words</title><meta charset="utf-8"></head>'
        '<body><main><p>Web<strong>Diag</strong> checks sites.</p>'
        '<p>Next<br>clear step.</p></main></body>'
    )
    app.dependency_overrides[get_content_analysis_fetcher] = lambda: build_fetcher(
        lambda request: streaming_response(
            200, request=request, headers={"content-type": "text/html"}, content=html.encode()
        )
    )
    try:
        response = asyncio.run(post(f"/v1/tools/{endpoint}", {"url": "https://example.com/"}))
    finally:
        clear_overrides()
    assert response.status_code == 200
    payload = response.json()
    if endpoint == "keyword-density":
        assert payload["total_words"] == 6
        assert {item["term"] for item in payload["top_words"]} == {
            "webdiag", "checks", "sites", "next", "clear", "step"
        }
    else:
        assert payload["word_count"] == 6
        assert payload["paragraph_count"] == 2


def test_keyword_phrases_keep_stopwords_between_adjacent_words() -> None:
    app.dependency_overrides[get_content_analysis_fetcher] = lambda: build_fetcher(
        lambda request: streaming_response(
            200, request=request, content=b"<p>Audit for teams. Audit for teams.</p>"
        )
    )
    try:
        response = asyncio.run(post("/v1/tools/keyword-density", {"url": "https://example.com/"}))
    finally:
        clear_overrides()
    assert response.status_code == 200
    payload = response.json()
    bigrams = {item["term"]: item["count"] for item in payload["top_bigrams"]}
    assert bigrams["audit for"] == 2
    assert bigrams["for teams"] == 2
    assert "audit teams" not in bigrams
    assert "teams audit" not in bigrams
    assert any(item["term"] == "audit for teams" for item in payload["top_trigrams"])


@pytest.mark.parametrize(
    ("html", "expected"),
    [
        (b"<p>First guide</p><p>Second guide</p>", {"first guide", "second guide"}),
        (b"<body>SEO audit<hr>Content planning</body>", {"seo audit", "content planning"}),
    ],
)
def test_keyword_phrases_do_not_cross_html_blocks_without_punctuation(html, expected) -> None:
    app.dependency_overrides[get_content_analysis_fetcher] = lambda: build_fetcher(
        lambda request: streaming_response(
            200, request=request, content=html
        )
    )
    try:
        response = asyncio.run(post("/v1/tools/keyword-density", {"url": "https://example.com/"}))
    finally:
        clear_overrides()
    assert response.status_code == 200
    assert {item["term"] for item in response.json()["top_bigrams"]} == expected


def test_heading_text_keeps_breaks_and_ignores_template_headings() -> None:
    app.dependency_overrides[get_content_analysis_fetcher] = lambda: build_fetcher(
        lambda request: streaming_response(
            200, request=request,
            content=b"<template><h1>Hidden</h1></template><h1>Web<strong>Diag</strong><br>Tools</h1>"
        )
    )
    try:
        response = asyncio.run(post("/v1/tools/heading-structure", {"url": "https://example.com/"}))
    finally:
        clear_overrides()
    assert response.status_code == 200
    payload = response.json()
    assert payload["h1_count"] == 1
    assert payload["outline"][0]["text"] == "WebDiag Tools"
