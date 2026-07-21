from __future__ import annotations

import asyncio
from datetime import UTC, datetime, timedelta

import httpx

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeHttpFetcher
from webdiag_api.main import app
from webdiag_api.tools.protocol_security import (
    TlsInspectionResult,
    get_compression_fetcher,
    get_tls_inspector,
)

SAFE_IP = "93.184.216.34"


async def post(path: str, payload: dict[str, object]) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.post(path, json=payload)


class FakeTlsInspector:
    def inspect(self, hostname: str, port: int) -> TlsInspectionResult:
        return TlsInspectionResult(
            hostname=hostname,
            port=port,
            peer_ip=SAFE_IP,
            issuer_common_name="Example CA",
            subject_common_name="example.com",
            subject_alt_names=("example.com", "www.example.com"),
            not_before=datetime.now(UTC) - timedelta(days=30),
            not_after=datetime.now(UTC) + timedelta(days=90),
            hostname_matches=True,
            tls_version="TLSv1.3",
            cipher_suite="TLS_AES_256_GCM_SHA384",
            key_exchange_bits=256,
            negotiated_protocol="h2",
        )


class ExpiringTlsInspector:
    def inspect(self, hostname: str, port: int) -> TlsInspectionResult:
        return TlsInspectionResult(
            hostname=hostname,
            port=port,
            peer_ip=SAFE_IP,
            issuer_common_name="Example CA",
            subject_common_name="other.example.com",
            subject_alt_names=("other.example.com",),
            not_before=datetime.now(UTC) - timedelta(days=30),
            not_after=datetime.now(UTC) + timedelta(days=5),
            hostname_matches=False,
            tls_version="TLSv1.1",
            cipher_suite="ECDHE-RSA-AES128-SHA",
            key_exchange_bits=128,
            negotiated_protocol="http/1.1",
        )


def clear_overrides() -> None:
    app.dependency_overrides.clear()


def test_ssl_certificate_checker_returns_certificate_health() -> None:
    app.dependency_overrides[get_tls_inspector] = lambda: FakeTlsInspector()
    try:
        response = asyncio.run(
            post("/v1/tools/ssl-certificate", {"hostname": "example.com"})
        )
    finally:
        clear_overrides()
    payload = response.json()
    assert response.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.ssl_certificate_checker.v1"
    assert payload["hostname"] == "example.com"
    assert payload["hostname_matches"] is True
    assert payload["days_until_expiry"] >= 80
    assert payload["status"] == "pass"


def test_ssl_certificate_checker_flags_hostname_mismatch() -> None:
    app.dependency_overrides[get_tls_inspector] = lambda: ExpiringTlsInspector()
    try:
        response = asyncio.run(
            post("/v1/tools/ssl-certificate", {"hostname": "example.com"})
        )
    finally:
        clear_overrides()
    payload = response.json()
    assert response.status_code == 200
    assert payload["hostname_matches"] is False
    assert payload["status"] == "fail"


def test_tls_configuration_checker_returns_protocol_signals() -> None:
    app.dependency_overrides[get_tls_inspector] = lambda: FakeTlsInspector()
    try:
        response = asyncio.run(
            post("/v1/tools/tls-configuration", {"hostname": "example.com"})
        )
    finally:
        clear_overrides()
    payload = response.json()
    assert response.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.tls_configuration_checker.v1"
    assert payload["tls_version"] == "TLSv1.3"
    assert payload["cipher_suite"] == "TLS_AES_256_GCM_SHA384"
    assert payload["negotiated_protocol"] == "h2"
    assert payload["status"] == "pass"


def test_tls_configuration_checker_flags_obsolete_protocol() -> None:
    app.dependency_overrides[get_tls_inspector] = lambda: ExpiringTlsInspector()
    try:
        response = asyncio.run(
            post("/v1/tools/tls-configuration", {"hostname": "example.com"})
        )
    finally:
        clear_overrides()
    payload = response.json()
    assert response.status_code == 200
    assert payload["protocol_status"] == "fail"
    assert payload["status"] == "fail"


def test_tls_tools_reject_url_and_ip_hostname_inputs() -> None:
    response = asyncio.run(
        post("/v1/tools/ssl-certificate", {"hostname": "https://example.com/"})
    )
    assert response.status_code == 422
    response = asyncio.run(post("/v1/tools/tls-configuration", {"hostname": "127.0.0.1"}))
    assert response.status_code == 422


def streaming_response(
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
        config=SafeFetchConfig(max_body_bytes=1_024),
        resolver=lambda _host, _port: [SAFE_IP],
        peer_address_provider=lambda _response: [SAFE_IP],
        transport=handler,
    )


def test_http_compression_checker_flags_compressed_text_response() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return streaming_response(
            200,
            request=request,
            headers={
                "content-type": "text/html; charset=utf-8",
                "content-encoding": "gzip",
                "vary": "Accept-Encoding",
                "content-length": "512",
            },
        )

    app.dependency_overrides[get_compression_fetcher] = lambda: build_fetcher(
        httpx.MockTransport(handler)
    )
    try:
        response = asyncio.run(
            post("/v1/tools/http-compression", {"url": "https://example.com/"})
        )
    finally:
        clear_overrides()
    payload = response.json()
    assert response.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.http_compression_checker.v1"
    assert payload["compressed"] is True
    assert payload["vary_accept_encoding"] is True
    assert payload["status"] == "pass"


def test_http_compression_checker_warns_for_uncompressed_html() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return streaming_response(
            200,
            request=request,
            headers={"content-type": "text/html; charset=utf-8"},
        )

    app.dependency_overrides[get_compression_fetcher] = lambda: build_fetcher(
        httpx.MockTransport(handler)
    )
    try:
        response = asyncio.run(
            post("/v1/tools/http-compression", {"url": "https://example.com/"})
        )
    finally:
        clear_overrides()
    payload = response.json()
    assert response.status_code == 200
    assert payload["compressed"] is False
    assert payload["compressible_candidate"] is True
    assert payload["status"] == "warning"
