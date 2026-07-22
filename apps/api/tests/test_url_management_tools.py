from __future__ import annotations

import asyncio

import httpx

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeHttpFetcher
from webdiag_api.main import app
from webdiag_api.tools.url_management import _find_cycles, get_redirect_map_fetcher

SAFE_IP = "93.184.216.34"


async def post(path: str, payload: dict[str, object]) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.post(path, json=payload)


def response(
    status_code: int,
    *,
    request: httpx.Request,
    headers: dict[str, str] | None = None,
) -> httpx.Response:
    return httpx.Response(
        status_code,
        headers=headers,
        stream=httpx.ByteStream(b""),
        request=request,
    )


def build_fetcher(handler: httpx.MockTransport) -> SafeHttpFetcher:
    return SafeHttpFetcher(
        config=SafeFetchConfig(max_redirects=8, max_body_bytes=1_024),
        resolver=lambda _host, _port: [SAFE_IP],
        peer_address_provider=lambda _response: [SAFE_IP],
        transport=handler,
    )


def override_fetcher(handler: httpx.MockTransport) -> None:
    app.dependency_overrides[get_redirect_map_fetcher] = lambda: build_fetcher(handler)


def clear_overrides() -> None:
    app.dependency_overrides.clear()


def test_redirect_map_matches_first_hop_and_optional_status() -> None:
    requests: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request.url.path)
        if request.url.path == "/old":
            return response(
                301,
                request=request,
                headers={"location": "https://example.com/new"},
            )
        return response(200, request=request)

    override_fetcher(httpx.MockTransport(handler))
    try:
        result = asyncio.run(
            post(
                "/v1/tools/redirect-map",
                {
                    "entries": [
                        {
                            "source_url": "https://EXAMPLE.com:443/old#ignored",
                            "target_url": "https://example.com/new",
                            "expected_status_code": 301,
                        }
                    ]
                },
            )
        )
    finally:
        clear_overrides()

    payload = result.json()
    assert result.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.redirect_map_validator.v1"
    assert payload["scan_mode"] == "explicit_map_bounded_safe_fetch"
    assert payload["checked_count"] == 1
    assert payload["matched_count"] == 1
    assert payload["mismatch_count"] == 0
    assert payload["status"] == "pass"
    assert payload["entries"][0]["normalized_source_url"] == "https://example.com/old"
    assert payload["entries"][0]["target_matches"] is True
    assert payload["entries"][0]["status_matches"] is True
    assert requests == ["/old", "/new"]


def test_redirect_map_reports_target_and_status_mismatch() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/old":
            return response(
                302,
                request=request,
                headers={"location": "https://example.com/actual"},
            )
        return response(200, request=request)

    override_fetcher(httpx.MockTransport(handler))
    try:
        result = asyncio.run(
            post(
                "/v1/tools/redirect-map",
                {
                    "entries": [
                        {
                            "source_url": "https://example.com/old",
                            "target_url": "https://example.com/expected",
                            "expected_status_code": 301,
                        }
                    ]
                },
            )
        )
    finally:
        clear_overrides()

    payload = result.json()
    assert result.status_code == 200
    assert payload["mismatch_count"] == 1
    assert payload["status"] == "fail"
    assert payload["entries"][0]["issues"] == [
        "first-target-mismatch",
        "status-code-mismatch",
    ]
    assert {finding["id"] for finding in payload["findings"]} >= {
        "observed-map-mismatches"
    }


def test_redirect_map_detects_duplicate_conflicting_chain_and_cycle_rules() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return response(200, request=request)

    override_fetcher(httpx.MockTransport(handler))
    try:
        result = asyncio.run(
            post(
                "/v1/tools/redirect-map",
                {
                    "entries": [
                        {
                            "source_url": "https://example.com/a",
                            "target_url": "https://example.com/b",
                        },
                        {
                            "source_url": "https://example.com/a",
                            "target_url": "https://example.com/c",
                        },
                        {
                            "source_url": "https://example.com/b",
                            "target_url": "https://example.com/a",
                        },
                    ]
                },
            )
        )
    finally:
        clear_overrides()

    payload = result.json()
    assert result.status_code == 200
    assert payload["duplicate_source_count"] == 1
    assert payload["conflicting_source_count"] == 1
    assert payload["chain_source_count"] == 2
    assert payload["cycle_count"] == 1
    assert payload["status"] == "fail"
    assert {finding["id"] for finding in payload["findings"]} >= {
        "conflicting-source-targets",
        "redirect-map-cycles",
        "map-chains",
        "duplicate-source-rows",
    }


def test_redirect_map_rejects_private_source_without_network_request() -> None:
    requests: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(str(request.url))
        return response(200, request=request)

    override_fetcher(httpx.MockTransport(handler))
    try:
        result = asyncio.run(
            post(
                "/v1/tools/redirect-map",
                {
                    "entries": [
                        {
                            "source_url": "http://127.0.0.1/private",
                            "target_url": "https://example.com/new",
                        }
                    ]
                },
            )
        )
    finally:
        clear_overrides()

    payload = result.json()
    assert result.status_code == 200
    assert payload["checked_count"] == 0
    assert payload["failed_count"] == 1
    assert payload["entries"][0]["fetch_state"] == "not_checked"
    assert payload["entries"][0]["issues"] == ["invalid-source-url"]
    assert requests == []


def test_redirect_map_records_target_fragment_and_invalid_status_as_findings() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/old":
            return response(
                302,
                request=request,
                headers={"location": "https://example.com/new"},
            )
        return response(200, request=request)

    override_fetcher(httpx.MockTransport(handler))
    try:
        result = asyncio.run(
            post(
                "/v1/tools/redirect-map",
                {
                    "entries": [
                        {
                            "source_url": "https://example.com/old",
                            "target_url": "https://example.com/new#section",
                            "expected_status_code": 304,
                        }
                    ]
                },
            )
        )
    finally:
        clear_overrides()

    payload = result.json()
    assert result.status_code == 200
    assert payload["status"] == "fail"
    assert payload["entries"][0]["target_matches"] is True
    assert payload["entries"][0]["status_matches"] is False
    assert payload["entries"][0]["issues"] == [
        "unsupported-redirect-status",
        "target-fragment-not-sent",
        "status-code-mismatch",
    ]


def test_redirect_map_limits_explicit_input_rows() -> None:
    entries = [
        {
            "source_url": f"https://example.com/old-{index}",
            "target_url": f"https://example.com/new-{index}",
        }
        for index in range(26)
    ]
    result = asyncio.run(post("/v1/tools/redirect-map", {"entries": entries}))
    assert result.status_code == 422


def test_redirect_map_cycle_detection_is_bounded_for_dense_graph() -> None:
    nodes = [f"https://example.com/{index}" for index in range(25)]
    graph = {node: set(nodes) - {node} for node in nodes}
    assert _find_cycles(graph) == (tuple(sorted(nodes)),)
