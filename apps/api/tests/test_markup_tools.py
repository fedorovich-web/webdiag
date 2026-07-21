import asyncio
from collections.abc import Callable

import httpx

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeHttpFetcher
from webdiag_api.main import app
from webdiag_api.tools.markup import get_markup_fetcher

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
    app.dependency_overrides[get_markup_fetcher] = lambda: fetcher


def clear_overrides() -> None:
    app.dependency_overrides.clear()


HTML = b"""
<!doctype html>
<html lang="ru">
<head>
<title>Example schema page</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Organization","name":"WebDiag"}
</script>
<script type="application/ld+json">{"@context":"https://schema.org", "@type": </script>
</head>
<body><main id="content"><h1>Example</h1></main><footer id="content"></footer></body>
</html>
"""


def test_structured_data_validator_reports_valid_and_invalid_json_ld() -> None:
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
        response = asyncio.run(
            post("/v1/tools/structured-data", {"url": "https://example.com/schema"})
        )
    finally:
        clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_version"] == "webdiag.tool.structured_data.v1"
    assert payload["json_ld_count"] == 2
    assert payload["valid_json_ld_count"] == 1
    assert payload["invalid_json_ld_count"] == 1
    assert payload["detected_types"] == [{"type": "Organization", "count": 1}]
    assert payload["blocks"][0]["types"] == ["Organization"]
    assert payload["blocks"][1]["valid"] is False
    assert "Fix invalid JSON-LD" in payload["recommendation"]


def test_html_markup_validator_reports_structural_checks() -> None:
    with_fetcher(
        build_fetcher(lambda request: streaming_response(200, request=request, content=HTML))
    )
    try:
        response = asyncio.run(
            post("/v1/tools/html-validator", {"url": "https://example.com/schema"})
        )
    finally:
        clear_overrides()

    assert response.status_code == 200
    payload = response.json()
    assert payload["contract_version"] == "webdiag.tool.html_markup.v1"
    assert payload["doctype_present"] is True
    assert payload["html_lang"] == "ru"
    assert payload["viewport_present"] is True
    assert payload["duplicate_id_count"] == 1
    checks = {check["id"]: check for check in payload["checks"]}
    assert checks["doctype"]["status"] == "pass"
    assert checks["duplicate-ids"]["status"] == "fail"
    assert "deterministic WebDiag markup inspection" not in payload["recommendation"]


def test_markup_tools_reject_disallowed_urls() -> None:
    with_fetcher(
        build_fetcher(lambda request: streaming_response(200, request=request, content=HTML))
    )
    try:
        response = asyncio.run(
            post("/v1/tools/structured-data", {"url": "http://127.0.0.1/"})
        )
    finally:
        clear_overrides()

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "tool_url_rejected",
        "message": "Private or reserved addresses are not allowed.",
    }
