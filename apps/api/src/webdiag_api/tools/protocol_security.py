from __future__ import annotations

import ipaddress
import socket
import ssl
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Annotated, Literal
from urllib.parse import urlsplit

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, field_validator

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeFetchError, SafeHttpFetcher
from webdiag_api.security.url_policy import UrlPolicyError, validate_resolved_addresses

router = APIRouter(tags=["tools"])

_MAX_HOSTNAME_LENGTH = 253
_DEFAULT_TLS_PORT = 443

ProtocolSecurityStatus = Literal["pass", "warning", "fail"]


class HostPortRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    hostname: str = Field(min_length=1, max_length=_MAX_HOSTNAME_LENGTH)
    port: int = Field(default=_DEFAULT_TLS_PORT, ge=1, le=65_535)

    @field_validator("hostname")
    @classmethod
    def normalize_hostname(cls, value: str) -> str:
        return _normalize_hostname(value)


class CompressionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2_048)


class CertificateNameResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    common_name: str | None = Field(default=None, max_length=300)
    subject_alt_names: tuple[str, ...]


class SslCertificateResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.ssl_certificate_checker.v1"] = (
        "webdiag.tool.ssl_certificate_checker.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    hostname: str = Field(min_length=1, max_length=_MAX_HOSTNAME_LENGTH)
    port: int = Field(ge=1, le=65_535)
    peer_ip: str | None = Field(default=None, max_length=80)
    issuer_common_name: str | None = Field(default=None, max_length=300)
    subject: CertificateNameResponse
    not_before: datetime | None = None
    not_after: datetime | None = None
    days_until_expiry: int | None = None
    expired: bool
    hostname_matches: bool
    san_count: int = Field(ge=0)
    status: ProtocolSecurityStatus
    recommendation: str = Field(min_length=1, max_length=800)


class TlsConfigurationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.tls_configuration_checker.v1"] = (
        "webdiag.tool.tls_configuration_checker.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    hostname: str = Field(min_length=1, max_length=_MAX_HOSTNAME_LENGTH)
    port: int = Field(ge=1, le=65_535)
    peer_ip: str | None = Field(default=None, max_length=80)
    tls_version: str | None = Field(default=None, max_length=80)
    cipher_suite: str | None = Field(default=None, max_length=160)
    key_exchange_bits: int | None = Field(default=None, ge=0)
    negotiated_protocol: str | None = Field(default=None, max_length=80)
    protocol_status: ProtocolSecurityStatus
    certificate_hostname_matches: bool
    certificate_days_until_expiry: int | None = None
    status: ProtocolSecurityStatus
    recommendation: str = Field(min_length=1, max_length=900)


class HttpCompressionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.http_compression_checker.v1"] = (
        "webdiag.tool.http_compression_checker.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    content_type: str | None = Field(default=None, max_length=300)
    content_encoding: str | None = Field(default=None, max_length=120)
    vary: str | None = Field(default=None, max_length=300)
    content_length: int | None = Field(default=None, ge=0)
    compressed: bool
    compressible_candidate: bool
    vary_accept_encoding: bool
    redirect_count: int = Field(ge=0)
    status: ProtocolSecurityStatus
    recommendation: str = Field(min_length=1, max_length=900)


class CorsRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2_048)
    origin: str = Field(default="https://example.com", min_length=1, max_length=300)

    @field_validator("origin")
    @classmethod
    def normalize_origin(cls, value: str) -> str:
        return _normalize_origin(value)


class HeaderItemResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    value: str = Field(max_length=1_000)


class HttpHeadersAnalyzerResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.http_headers_analyzer.v1"] = (
        "webdiag.tool.http_headers_analyzer.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    header_count: int = Field(ge=0)
    redirect_count: int = Field(ge=0)
    server_header_present: bool
    powered_by_header_present: bool
    cache_control: str | None = Field(default=None, max_length=500)
    content_type: str | None = Field(default=None, max_length=300)
    content_length: int | None = Field(default=None, ge=0)
    content_encoding: str | None = Field(default=None, max_length=120)
    vary: str | None = Field(default=None, max_length=300)
    headers: tuple[HeaderItemResponse, ...]
    status: ProtocolSecurityStatus
    recommendation: str = Field(min_length=1, max_length=900)


class HttpProtocolResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.http_protocol_checker.v1"] = (
        "webdiag.tool.http_protocol_checker.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    scheme: Literal["http", "https"]
    tls_version: str | None = Field(default=None, max_length=80)
    negotiated_protocol: str | None = Field(default=None, max_length=80)
    http2_supported: bool
    http3_advertised: bool
    alt_svc: str | None = Field(default=None, max_length=500)
    redirect_count: int = Field(ge=0)
    status: ProtocolSecurityStatus
    recommendation: str = Field(min_length=1, max_length=900)


class CorsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.cors_checker.v1"] = (
        "webdiag.tool.cors_checker.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    tested_origin: str = Field(min_length=1, max_length=300)
    status_code: int = Field(ge=100, le=599)
    allow_origin: str | None = Field(default=None, max_length=500)
    allow_methods: str | None = Field(default=None, max_length=500)
    allow_headers: str | None = Field(default=None, max_length=500)
    expose_headers: str | None = Field(default=None, max_length=500)
    allow_credentials: bool
    vary_origin: bool
    allows_tested_origin: bool
    wildcard_with_credentials: bool
    redirect_count: int = Field(ge=0)
    status: ProtocolSecurityStatus
    recommendation: str = Field(min_length=1, max_length=900)


@dataclass(frozen=True, slots=True)
class TlsInspectionResult:
    hostname: str
    port: int
    peer_ip: str | None
    issuer_common_name: str | None
    subject_common_name: str | None
    subject_alt_names: tuple[str, ...]
    not_before: datetime | None
    not_after: datetime | None
    hostname_matches: bool
    tls_version: str | None
    cipher_suite: str | None
    key_exchange_bits: int | None
    negotiated_protocol: str | None


class TlsInspectionError(RuntimeError):
    pass


class TlsInspector:
    def __init__(self, *, timeout_seconds: float = 6.0) -> None:
        self.timeout_seconds = timeout_seconds

    def inspect(self, hostname: str, port: int) -> TlsInspectionResult:
        addresses = _resolve_public_addresses(hostname, port)
        last_error: OSError | ssl.SSLError | None = None
        context = ssl.create_default_context()
        context.set_alpn_protocols(["h2", "http/1.1"])

        for address in addresses:
            try:
                with (
                    socket.create_connection(
                        (address, port),
                        timeout=self.timeout_seconds,
                    ) as raw_socket,
                    context.wrap_socket(raw_socket, server_hostname=hostname) as tls_socket,
                ):
                    cert = tls_socket.getpeercert()
                    cipher = tls_socket.cipher()
                    return TlsInspectionResult(
                        hostname=hostname,
                        port=port,
                        peer_ip=address,
                        issuer_common_name=_certificate_common_name(cert.get("issuer")),
                        subject_common_name=_certificate_common_name(cert.get("subject")),
                        subject_alt_names=_certificate_sans(cert),
                        not_before=_certificate_datetime(cert.get("notBefore")),
                        not_after=_certificate_datetime(cert.get("notAfter")),
                        hostname_matches=True,
                        tls_version=tls_socket.version(),
                        cipher_suite=cipher[0] if cipher else None,
                        key_exchange_bits=cipher[2] if cipher and len(cipher) >= 3 else None,
                        negotiated_protocol=tls_socket.selected_alpn_protocol(),
                    )
            except (OSError, ssl.SSLError) as exc:
                last_error = exc

        raise TlsInspectionError(
            "TLS handshake failed for the validated public host."
        ) from last_error


def get_tls_inspector() -> TlsInspector:
    return TlsInspector()


def get_compression_fetcher() -> SafeHttpFetcher:
    return SafeHttpFetcher(config=SafeFetchConfig(max_body_bytes=1_024))


TlsInspectorDependency = Annotated[TlsInspector, Depends(get_tls_inspector)]
CompressionFetcherDependency = Annotated[SafeHttpFetcher, Depends(get_compression_fetcher)]


@router.post("/v1/tools/ssl-certificate", response_model=SslCertificateResponse)
def inspect_ssl_certificate(
    payload: HostPortRequest,
    inspector: TlsInspectorDependency,
) -> SslCertificateResponse:
    result = _inspect_or_raise(inspector, payload.hostname, payload.port)
    days_until_expiry = _days_until_expiry(result.not_after)
    expired = days_until_expiry is not None and days_until_expiry < 0
    status_value = _certificate_status(
        expired=expired,
        hostname_matches=result.hostname_matches,
        days_until_expiry=days_until_expiry,
    )
    return SslCertificateResponse(
        hostname=result.hostname,
        port=result.port,
        peer_ip=result.peer_ip,
        issuer_common_name=result.issuer_common_name,
        subject=CertificateNameResponse(
            common_name=result.subject_common_name,
            subject_alt_names=result.subject_alt_names,
        ),
        not_before=result.not_before,
        not_after=result.not_after,
        days_until_expiry=days_until_expiry,
        expired=expired,
        hostname_matches=result.hostname_matches,
        san_count=len(result.subject_alt_names),
        status=status_value,
        recommendation=_certificate_recommendation(
            status_value,
            days_until_expiry=days_until_expiry,
            hostname_matches=result.hostname_matches,
        ),
    )


@router.post("/v1/tools/tls-configuration", response_model=TlsConfigurationResponse)
def inspect_tls_configuration(
    payload: HostPortRequest,
    inspector: TlsInspectorDependency,
) -> TlsConfigurationResponse:
    result = _inspect_or_raise(inspector, payload.hostname, payload.port)
    days_until_expiry = _days_until_expiry(result.not_after)
    protocol_status = _tls_protocol_status(result.tls_version)
    certificate_status = _certificate_status(
        expired=days_until_expiry is not None and days_until_expiry < 0,
        hostname_matches=result.hostname_matches,
        days_until_expiry=days_until_expiry,
    )
    overall_status = _combine_status(protocol_status, certificate_status)
    return TlsConfigurationResponse(
        hostname=result.hostname,
        port=result.port,
        peer_ip=result.peer_ip,
        tls_version=result.tls_version,
        cipher_suite=result.cipher_suite,
        key_exchange_bits=result.key_exchange_bits,
        negotiated_protocol=result.negotiated_protocol,
        protocol_status=protocol_status,
        certificate_hostname_matches=result.hostname_matches,
        certificate_days_until_expiry=days_until_expiry,
        status=overall_status,
        recommendation=_tls_recommendation(
            overall_status,
            tls_version=result.tls_version,
            negotiated_protocol=result.negotiated_protocol,
        ),
    )


@router.post("/v1/tools/http-compression", response_model=HttpCompressionResponse)
def inspect_http_compression(
    payload: CompressionRequest,
    fetcher: CompressionFetcherDependency,
) -> HttpCompressionResponse:
    try:
        fetched = fetcher.fetch(payload.url, read_body=False)
    except UrlPolicyError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "tool_url_rejected", "message": str(exc)},
        ) from exc
    except SafeFetchError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "tool_fetch_failed", "message": str(exc)},
        ) from exc

    content_type = fetched.headers.get("content-type")
    content_encoding = fetched.headers.get("content-encoding")
    vary = fetched.headers.get("vary")
    content_length = _parse_content_length(fetched.headers.get("content-length"))
    compressed = _is_compressed(content_encoding)
    compressible_candidate = _is_compressible_content_type(content_type)
    vary_accept_encoding = "accept-encoding" in (vary or "").lower()
    status_value = _compression_status(
        compressed=compressed,
        compressible_candidate=compressible_candidate,
        status_code=fetched.status_code,
    )

    return HttpCompressionResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        content_type=content_type,
        content_encoding=content_encoding,
        vary=vary,
        content_length=content_length,
        compressed=compressed,
        compressible_candidate=compressible_candidate,
        vary_accept_encoding=vary_accept_encoding,
        redirect_count=len(fetched.redirect_chain),
        status=status_value,
        recommendation=_compression_recommendation(
            status_value,
            content_encoding=content_encoding,
            compressible_candidate=compressible_candidate,
            vary_accept_encoding=vary_accept_encoding,
        ),
    )


@router.post("/v1/tools/http-headers", response_model=HttpHeadersAnalyzerResponse)
def inspect_http_headers(
    payload: CompressionRequest,
    fetcher: CompressionFetcherDependency,
) -> HttpHeadersAnalyzerResponse:
    fetched = _fetch_or_raise(fetcher, payload.url)
    headers = tuple(
        HeaderItemResponse(name=name, value=value)
        for name, value in sorted(fetched.headers.items())[:120]
    )
    status_value = _headers_status(fetched.status_code, fetched.headers)
    return HttpHeadersAnalyzerResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        header_count=len(fetched.headers),
        redirect_count=len(fetched.redirect_chain),
        server_header_present="server" in fetched.headers,
        powered_by_header_present="x-powered-by" in fetched.headers,
        cache_control=fetched.headers.get("cache-control"),
        content_type=fetched.headers.get("content-type"),
        content_length=_parse_content_length(fetched.headers.get("content-length")),
        content_encoding=fetched.headers.get("content-encoding"),
        vary=fetched.headers.get("vary"),
        headers=headers,
        status=status_value,
        recommendation=_headers_recommendation(status_value, fetched.headers),
    )


@router.post("/v1/tools/http-protocol", response_model=HttpProtocolResponse)
def inspect_http_protocol(
    payload: CompressionRequest,
    fetcher: CompressionFetcherDependency,
    inspector: TlsInspectorDependency,
) -> HttpProtocolResponse:
    fetched = _fetch_or_raise(fetcher, payload.url)
    parsed = urlsplit(fetched.final_url)
    scheme = parsed.scheme if parsed.scheme in {"http", "https"} else "http"
    tls_result: TlsInspectionResult | None = None

    if scheme == "https" and parsed.hostname:
        port = parsed.port or 443
        try:
            tls_result = inspector.inspect(parsed.hostname, port)
        except (UrlPolicyError, TlsInspectionError):
            tls_result = None

    alt_svc = fetched.headers.get("alt-svc")
    negotiated_protocol = tls_result.negotiated_protocol if tls_result else None
    http2_supported = negotiated_protocol == "h2"
    http3_advertised = _alt_svc_advertises_http3(alt_svc)
    status_value = _http_protocol_status(
        scheme=scheme,
        http2_supported=http2_supported,
        http3_advertised=http3_advertised,
    )
    return HttpProtocolResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        scheme=scheme,
        tls_version=tls_result.tls_version if tls_result else None,
        negotiated_protocol=negotiated_protocol,
        http2_supported=http2_supported,
        http3_advertised=http3_advertised,
        alt_svc=alt_svc,
        redirect_count=len(fetched.redirect_chain),
        status=status_value,
        recommendation=_http_protocol_recommendation(
            status_value,
            scheme=scheme,
            http2_supported=http2_supported,
            http3_advertised=http3_advertised,
        ),
    )


@router.post("/v1/tools/cors", response_model=CorsResponse)
def inspect_cors(
    payload: CorsRequest,
    fetcher: CompressionFetcherDependency,
) -> CorsResponse:
    fetched = _fetch_or_raise(
        fetcher,
        payload.url,
        extra_headers={"origin": payload.origin},
    )
    allow_origin = fetched.headers.get("access-control-allow-origin")
    allow_credentials = _truthy_header(
        fetched.headers.get("access-control-allow-credentials")
    )
    allows_tested_origin = _cors_allows_origin(allow_origin, payload.origin)
    wildcard_with_credentials = allow_origin == "*" and allow_credentials
    vary_origin = "origin" in (fetched.headers.get("vary") or "").lower()
    status_value = _cors_status(
        allow_origin=allow_origin,
        allows_tested_origin=allows_tested_origin,
        wildcard_with_credentials=wildcard_with_credentials,
        status_code=fetched.status_code,
    )
    return CorsResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        tested_origin=payload.origin,
        status_code=fetched.status_code,
        allow_origin=allow_origin,
        allow_methods=fetched.headers.get("access-control-allow-methods"),
        allow_headers=fetched.headers.get("access-control-allow-headers"),
        expose_headers=fetched.headers.get("access-control-expose-headers"),
        allow_credentials=allow_credentials,
        vary_origin=vary_origin,
        allows_tested_origin=allows_tested_origin,
        wildcard_with_credentials=wildcard_with_credentials,
        redirect_count=len(fetched.redirect_chain),
        status=status_value,
        recommendation=_cors_recommendation(
            status_value,
            allow_origin=allow_origin,
            vary_origin=vary_origin,
            wildcard_with_credentials=wildcard_with_credentials,
        ),
    )


def _fetch_or_raise(
    fetcher: SafeHttpFetcher,
    url: str,
    *,
    extra_headers: dict[str, str] | None = None,
):
    try:
        return fetcher.fetch(url, read_body=False, extra_headers=extra_headers)
    except UrlPolicyError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "tool_url_rejected", "message": str(exc)},
        ) from exc
    except SafeFetchError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "tool_fetch_failed", "message": str(exc)},
        ) from exc


def _normalize_origin(value: str) -> str:
    raw = value.strip().rstrip("/")
    parsed = urlsplit(raw)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("Origin must be an http/https origin.")
    if parsed.username or parsed.password or parsed.path not in {"", "/"}:
        raise ValueError("Origin must not include credentials, path, query, or fragment.")
    if parsed.query or parsed.fragment:
        raise ValueError("Origin must not include credentials, path, query, or fragment.")
    return f"{parsed.scheme}://{parsed.netloc.lower()}"


def _inspect_or_raise(inspector: TlsInspector, hostname: str, port: int) -> TlsInspectionResult:
    try:
        return inspector.inspect(hostname, port)
    except UrlPolicyError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "tool_host_rejected", "message": str(exc)},
        ) from exc
    except TlsInspectionError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "tool_tls_failed", "message": str(exc)},
        ) from exc


def _normalize_hostname(value: str) -> str:
    hostname = value.strip().rstrip(".").lower()
    if not hostname or len(hostname) > _MAX_HOSTNAME_LENGTH:
        raise ValueError("Hostname is empty or too long.")
    if "://" in hostname or "/" in hostname or "@" in hostname:
        raise ValueError("Enter a hostname without protocol, path, or credentials.")
    try:
        address = ipaddress.ip_address(hostname)
    except ValueError:
        address = None
    if address is not None:
        raise ValueError("Enter a DNS hostname, not an IP literal.")
    labels = hostname.split(".")
    if len(labels) < 2:
        raise ValueError("Hostname must include a public suffix.")
    allowed = set("abcdefghijklmnopqrstuvwxyz0123456789-")
    for label in labels:
        if not label or len(label) > 63:
            raise ValueError("Hostname contains an invalid label length.")
        if label.startswith("-") or label.endswith("-"):
            raise ValueError("Hostname label cannot start or end with a hyphen.")
        if any(char not in allowed for char in label):
            raise ValueError("Hostname contains invalid characters.")
    return hostname


def _resolve_public_addresses(hostname: str, port: int) -> tuple[str, ...]:
    try:
        values = socket.getaddrinfo(hostname, port, type=socket.SOCK_STREAM)
    except OSError as exc:
        raise UrlPolicyError("Hostname could not be resolved.") from exc
    addresses = sorted({item[4][0] for item in values})
    validate_resolved_addresses(addresses)
    return tuple(addresses)


def _certificate_common_name(value: object) -> str | None:
    if not isinstance(value, tuple):
        return None
    for group in value:
        if not isinstance(group, tuple):
            continue
        for item in group:
            if isinstance(item, tuple) and len(item) == 2 and item[0] == "commonName":
                return str(item[1])
    return None


def _certificate_sans(cert: dict[str, object]) -> tuple[str, ...]:
    values = cert.get("subjectAltName")
    if not isinstance(values, tuple):
        return ()
    names: list[str] = []
    for item in values:
        if isinstance(item, tuple) and len(item) == 2 and item[0] == "DNS":
            names.append(str(item[1]))
    return tuple(names[:100])


def _certificate_datetime(value: object) -> datetime | None:
    if not isinstance(value, str):
        return None
    try:
        parsed = datetime.strptime(value, "%b %d %H:%M:%S %Y %Z")
    except ValueError:
        return None
    return parsed.replace(tzinfo=UTC)


def _days_until_expiry(not_after: datetime | None) -> int | None:
    if not_after is None:
        return None
    delta = not_after - datetime.now(UTC)
    return delta.days


def _certificate_status(
    *,
    expired: bool,
    hostname_matches: bool,
    days_until_expiry: int | None,
) -> ProtocolSecurityStatus:
    if expired or not hostname_matches:
        return "fail"
    if days_until_expiry is None or days_until_expiry <= 14:
        return "warning"
    return "pass"


def _tls_protocol_status(tls_version: str | None) -> ProtocolSecurityStatus:
    if tls_version in {"TLSv1.3", "TLSv1.2"}:
        return "pass"
    if tls_version is None:
        return "warning"
    return "fail"


def _combine_status(*values: ProtocolSecurityStatus) -> ProtocolSecurityStatus:
    if "fail" in values:
        return "fail"
    if "warning" in values:
        return "warning"
    return "pass"


def _certificate_recommendation(
    status_value: ProtocolSecurityStatus,
    *,
    days_until_expiry: int | None,
    hostname_matches: bool,
) -> str:
    if not hostname_matches:
        return "Replace the certificate or SNI configuration so the certificate matches the host."
    if days_until_expiry is not None and days_until_expiry < 0:
        return "Renew the expired certificate before relying on HTTPS for users or crawlers."
    if days_until_expiry is not None and days_until_expiry <= 14:
        return "Renew the certificate soon and confirm automated renewal monitoring is active."
    if status_value == "pass":
        return (
            "Certificate validity and hostname matching look healthy for this "
            "single TLS handshake."
        )
    return "Review certificate validity, hostname coverage, issuer, and renewal automation."


def _tls_recommendation(
    status_value: ProtocolSecurityStatus,
    *,
    tls_version: str | None,
    negotiated_protocol: str | None,
) -> str:
    if status_value == "fail":
        return (
            "Disable obsolete TLS protocols and fix certificate errors before "
            "traffic is trusted."
        )
    if tls_version not in {"TLSv1.3", "TLSv1.2"}:
        return "Confirm the server negotiates TLS 1.2 or TLS 1.3 with modern clients."
    if negotiated_protocol != "h2":
        return (
            "TLS negotiated successfully; enable HTTP/2 where supported to "
            "reduce request overhead."
        )
    return "TLS handshake negotiated a modern protocol in this bounded single-handshake check."


def _parse_content_length(value: str | None) -> int | None:
    if value is None:
        return None
    try:
        parsed = int(value.strip())
    except ValueError:
        return None
    return parsed if parsed >= 0 else None


def _is_compressed(value: str | None) -> bool:
    if value is None:
        return False
    tokens = {part.strip().lower() for part in value.split(",")}
    return bool(tokens & {"br", "gzip", "deflate", "zstd"})


def _is_compressible_content_type(value: str | None) -> bool:
    if value is None:
        return False
    lowered = value.lower().split(";", 1)[0].strip()
    if lowered.startswith("text/"):
        return True
    return lowered in {
        "application/javascript",
        "application/json",
        "application/ld+json",
        "application/xml",
        "image/svg+xml",
    }


def _headers_status(status_code: int, headers: dict[str, str]) -> ProtocolSecurityStatus:
    if status_code >= 400:
        return "fail"
    if "server" in headers or "x-powered-by" in headers:
        return "warning"
    return "pass"


def _headers_recommendation(
    status_value: ProtocolSecurityStatus,
    headers: dict[str, str],
) -> str:
    if status_value == "fail":
        return "Fix the HTTP response status before interpreting header policy."
    if "x-powered-by" in headers:
        return "Remove or reduce X-Powered-By disclosure unless it is operationally required."
    if "server" in headers:
        return "Review Server header disclosure and keep detailed stack data out of responses."
    return "HTTP response headers are exposed in a controlled shape for this single request."


def _alt_svc_advertises_http3(value: str | None) -> bool:
    if value is None:
        return False
    tokens = {part.strip().lower().split("=", 1)[0] for part in value.split(",")}
    return bool(tokens & {"h3", "h3-29", "h3-32"})


def _http_protocol_status(
    *,
    scheme: str,
    http2_supported: bool,
    http3_advertised: bool,
) -> ProtocolSecurityStatus:
    if scheme != "https":
        return "warning"
    if http2_supported or http3_advertised:
        return "pass"
    return "warning"


def _http_protocol_recommendation(
    status_value: ProtocolSecurityStatus,
    *,
    scheme: str,
    http2_supported: bool,
    http3_advertised: bool,
) -> str:
    if scheme != "https":
        return "Use HTTPS to evaluate ALPN-based HTTP/2 and Alt-Svc HTTP/3 signals."
    if http2_supported and http3_advertised:
        return "HTTP/2 was negotiated and HTTP/3 is advertised through Alt-Svc."
    if http2_supported:
        return "HTTP/2 was negotiated. HTTP/3 is not advertised in the checked response."
    if http3_advertised:
        return "HTTP/3 is advertised, but HTTP/2 was not negotiated by this TLS client."
    if status_value == "warning":
        return "Enable HTTP/2 ALPN and optionally advertise HTTP/3 via Alt-Svc where supported."
    return "Protocol signals look controlled for this bounded check."


def _truthy_header(value: str | None) -> bool:
    return value is not None and value.strip().lower() == "true"


def _cors_allows_origin(allow_origin: str | None, origin: str) -> bool:
    if allow_origin is None:
        return False
    normalized = allow_origin.strip().lower()
    return normalized == "*" or normalized == origin.lower()


def _cors_status(
    *,
    allow_origin: str | None,
    allows_tested_origin: bool,
    wildcard_with_credentials: bool,
    status_code: int,
) -> ProtocolSecurityStatus:
    if status_code >= 400 or wildcard_with_credentials:
        return "fail"
    if allow_origin is None or not allows_tested_origin:
        return "warning"
    return "pass"


def _cors_recommendation(
    status_value: ProtocolSecurityStatus,
    *,
    allow_origin: str | None,
    vary_origin: bool,
    wildcard_with_credentials: bool,
) -> str:
    if wildcard_with_credentials:
        return "Do not combine Access-Control-Allow-Origin: * with credentials."
    if allow_origin is None:
        return "No CORS allow-origin header was returned for the tested Origin request."
    if not vary_origin and allow_origin != "*":
        return "Add Vary: Origin when CORS responses vary by request Origin."
    if status_value == "pass":
        return "CORS headers allow the tested origin in this single safe request."
    return "Review CORS origin matching, credentials policy, and cache variation."


def _compression_status(
    *,
    compressed: bool,
    compressible_candidate: bool,
    status_code: int,
) -> ProtocolSecurityStatus:
    if status_code >= 400:
        return "fail"
    if compressed:
        return "pass"
    if compressible_candidate:
        return "warning"
    return "pass"


def _compression_recommendation(
    status_value: ProtocolSecurityStatus,
    *,
    content_encoding: str | None,
    compressible_candidate: bool,
    vary_accept_encoding: bool,
) -> str:
    if status_value == "fail":
        return "Fix the HTTP response status before evaluating compression policy."
    if content_encoding:
        if not vary_accept_encoding:
            return "Compression is active; add Vary: Accept-Encoding for shared cache correctness."
        return "Compression is active for this safe request. Prefer Brotli for HTTPS text assets."
    if compressible_candidate:
        return (
            "Enable Brotli or gzip for compressible text responses and "
            "configure cache-safe Vary."
        )
    return "This response does not look like a high-value text compression candidate."
