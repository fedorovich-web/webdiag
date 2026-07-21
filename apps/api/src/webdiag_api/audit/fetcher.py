from __future__ import annotations

import ipaddress
import socket
import zlib
from collections.abc import Callable, Mapping
from dataclasses import dataclass
from urllib.parse import urljoin, urlsplit, urlunsplit

import httpx

from webdiag_api.security.url_policy import (
    UrlPolicyError,
    validate_resolved_addresses,
    validate_url,
)

DEFAULT_USER_AGENT = "WebDiagBot/0.5 (+https://webdiag.local/audit)"
REDIRECT_STATUS_CODES = frozenset({301, 302, 303, 307, 308})
STREAM_CHUNK_BYTES = 64 * 1024
SUPPORTED_CONTENT_ENCODINGS = frozenset({"", "identity", "gzip", "x-gzip", "deflate"})


class SafeFetchError(RuntimeError):
    """Raised when a safe audit fetch cannot be completed."""


class ResponseBodyTooLargeError(SafeFetchError):
    """Raised before an HTTP response body can exceed the configured hard limit."""


@dataclass(frozen=True, slots=True)
class SafeFetchConfig:
    timeout_seconds: float = 8.0
    max_redirects: int = 5
    max_body_bytes: int = 1_000_000
    user_agent: str = DEFAULT_USER_AGENT

    def __post_init__(self) -> None:
        if self.timeout_seconds <= 0:
            raise ValueError("timeout_seconds must be greater than zero.")
        if self.max_redirects < 0:
            raise ValueError("max_redirects cannot be negative.")
        if self.max_body_bytes < 1_024:
            raise ValueError("max_body_bytes must be at least 1024 bytes.")
        if not self.user_agent.strip():
            raise ValueError("user_agent cannot be blank.")


@dataclass(frozen=True, slots=True)
class RedirectHop:
    source_url: str
    target_url: str
    status_code: int


@dataclass(frozen=True, slots=True)
class SafeFetchResult:
    requested_url: str
    final_url: str
    status_code: int
    headers: dict[str, str]
    body_text: str
    content_type: str | None
    redirect_chain: tuple[RedirectHop, ...]
    truncated: bool = False


@dataclass(frozen=True, slots=True)
class _ValidatedFetchTarget:
    logical_url: str
    hostname: str
    port: int
    resolved_addresses: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class _FetchedResponse:
    status_code: int
    headers: dict[str, str]
    body: bytes
    text_encoding: str


Resolver = Callable[[str, int], list[str]]
PeerAddressProvider = Callable[[httpx.Response], list[str]]


def default_resolver(hostname: str, port: int) -> list[str]:
    """Resolve a hostname for the SSRF guard before a network request."""
    try:
        values = socket.getaddrinfo(hostname, port, type=socket.SOCK_STREAM)
    except OSError as exc:
        raise UrlPolicyError("Hostname could not be resolved.") from exc
    return sorted({item[4][0] for item in values})


def default_peer_address_provider(response: httpx.Response) -> list[str]:
    """Read the connected peer address from the standard HTTPX network stream."""
    network_stream = response.extensions.get("network_stream")
    get_extra_info = getattr(network_stream, "get_extra_info", None)
    if not callable(get_extra_info):
        raise SafeFetchError("Connected peer address could not be verified.")

    server_address = get_extra_info("server_addr")
    if not isinstance(server_address, tuple) or not server_address:
        raise SafeFetchError("Connected peer address could not be verified.")

    peer_host = server_address[0]
    if not isinstance(peer_host, str) or not peer_host:
        raise SafeFetchError("Connected peer address could not be verified.")
    return [peer_host]


class SafeHttpFetcher:
    """HTTP fetcher with pinned DNS targets, SSRF checks, and hard body limits."""

    def __init__(
        self,
        *,
        config: SafeFetchConfig | None = None,
        resolver: Resolver | None = None,
        peer_address_provider: PeerAddressProvider | None = None,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        self.config = config or SafeFetchConfig()
        self._resolver = resolver or default_resolver
        self._peer_address_provider = peer_address_provider or default_peer_address_provider
        self._transport = transport

    def _validate_before_request(self, raw_url: str) -> _ValidatedFetchTarget:
        validated = validate_url(raw_url)
        resolved_addresses = self._resolver(validated.hostname, validated.port)
        validate_resolved_addresses(resolved_addresses)
        normalized_addresses = tuple(
            sorted({str(ipaddress.ip_address(address)) for address in resolved_addresses})
        )
        return _ValidatedFetchTarget(
            logical_url=validated.normalized,
            hostname=validated.hostname,
            port=validated.port,
            resolved_addresses=normalized_addresses,
        )

    def fetch(
        self,
        raw_url: str,
        *,
        read_body: bool = True,
        extra_headers: Mapping[str, str] | None = None,
    ) -> SafeFetchResult:
        current_target = self._validate_before_request(raw_url)
        requested_url = current_target.logical_url
        redirect_chain: list[RedirectHop] = []

        with httpx.Client(
            follow_redirects=False,
            timeout=self.config.timeout_seconds,
            transport=self._transport,
            trust_env=False,
            limits=httpx.Limits(max_keepalive_connections=0),
        ) as client:
            while True:
                response = self._fetch_validated_target(
                    client,
                    current_target,
                    read_body=read_body,
                    extra_headers=extra_headers,
                )
                location = response.headers.get("location")
                if response.status_code in REDIRECT_STATUS_CODES and location:
                    if len(redirect_chain) >= self.config.max_redirects:
                        raise SafeFetchError("Redirect limit exceeded.")
                    target_url = urljoin(current_target.logical_url, location)
                    next_target = self._validate_before_request(target_url)
                    redirect_chain.append(
                        RedirectHop(
                            source_url=current_target.logical_url,
                            target_url=next_target.logical_url,
                            status_code=response.status_code,
                        )
                    )
                    current_target = next_target
                    continue

                try:
                    body_text = response.body.decode(response.text_encoding, errors="replace")
                except LookupError:
                    body_text = response.body.decode("utf-8", errors="replace")

                return SafeFetchResult(
                    requested_url=requested_url,
                    final_url=current_target.logical_url,
                    status_code=response.status_code,
                    headers=response.headers,
                    body_text=body_text,
                    content_type=response.headers.get("content-type"),
                    redirect_chain=tuple(redirect_chain),
                )

    def _fetch_validated_target(
        self,
        client: httpx.Client,
        target: _ValidatedFetchTarget,
        *,
        read_body: bool,
        extra_headers: Mapping[str, str] | None = None,
    ) -> _FetchedResponse:
        last_transport_error: httpx.HTTPError | None = None

        for address in target.resolved_addresses:
            try:
                return self._fetch_from_address(
                    client,
                    target=target,
                    address=address,
                    read_body=read_body,
                    extra_headers=extra_headers,
                )
            except httpx.TimeoutException as exc:
                last_transport_error = exc
            except httpx.HTTPError as exc:
                last_transport_error = exc

        if isinstance(last_transport_error, httpx.TimeoutException):
            raise SafeFetchError("HTTP fetch timed out.") from last_transport_error
        if last_transport_error is not None:
            raise SafeFetchError("HTTP fetch failed.") from last_transport_error
        raise SafeFetchError("HTTP fetch failed without a validated target address.")

    def _fetch_from_address(
        self,
        client: httpx.Client,
        *,
        target: _ValidatedFetchTarget,
        address: str,
        read_body: bool,
        extra_headers: Mapping[str, str] | None = None,
    ) -> _FetchedResponse:
        headers = {
            "user-agent": self.config.user_agent,
            "accept": "text/html,*/*;q=0.8",
            "accept-encoding": "gzip, deflate",
            "connection": "close",
            "host": _host_header(target),
        }
        headers.update(_safe_extra_headers(extra_headers))
        extensions = {"sni_hostname": _ascii_hostname(target.hostname)}

        with client.stream(
            "GET",
            _connect_url(target, address),
            headers=headers,
            extensions=extensions,
        ) as response:
            self._verify_connected_peer(response, expected_address=address)
            normalized_headers = {key.lower(): value for key, value in response.headers.items()}

            if response.status_code in REDIRECT_STATUS_CODES and normalized_headers.get("location"):
                return _FetchedResponse(
                    status_code=response.status_code,
                    headers=normalized_headers,
                    body=b"",
                    text_encoding="utf-8",
                )

            if not read_body:
                return _FetchedResponse(
                    status_code=response.status_code,
                    headers=normalized_headers,
                    body=b"",
                    text_encoding=response.encoding or "utf-8",
                )

            declared_length = _declared_content_length(normalized_headers)
            if declared_length is not None and declared_length > self.config.max_body_bytes:
                raise ResponseBodyTooLargeError(
                    "HTTP response body exceeds the configured size limit."
                )

            content_encoding = normalized_headers.get("content-encoding", "").strip().lower()
            if content_encoding not in SUPPORTED_CONTENT_ENCODINGS:
                raise SafeFetchError(
                    f"Unsupported HTTP content encoding: {content_encoding or 'unknown'}."
                )

            raw_body = _read_raw_body(response, max_body_bytes=self.config.max_body_bytes)
            body = _decode_content_body(
                raw_body,
                content_encoding=content_encoding,
                max_body_bytes=self.config.max_body_bytes,
            )
            return _FetchedResponse(
                status_code=response.status_code,
                headers=normalized_headers,
                body=body,
                text_encoding=response.encoding or "utf-8",
            )

    def _verify_connected_peer(
        self,
        response: httpx.Response,
        *,
        expected_address: str,
    ) -> None:
        peer_addresses = self._peer_address_provider(response)
        validate_resolved_addresses(peer_addresses)
        normalized_peers = {str(ipaddress.ip_address(address)) for address in peer_addresses}
        if str(ipaddress.ip_address(expected_address)) not in normalized_peers:
            raise UrlPolicyError("Connected peer address does not match the pinned target address.")


def _safe_extra_headers(extra_headers: Mapping[str, str] | None) -> dict[str, str]:
    if not extra_headers:
        return {}

    blocked_names = {
        "connection",
        "content-length",
        "host",
        "proxy-authorization",
        "transfer-encoding",
        "upgrade",
    }
    values: dict[str, str] = {}
    for raw_name, raw_value in extra_headers.items():
        name = raw_name.strip().lower()
        value = raw_value.strip()
        if not name or name in blocked_names:
            continue
        if "\r" in name or "\n" in name or "\r" in value or "\n" in value:
            continue
        if len(name) > 80 or len(value) > 500:
            continue
        values[name] = value
    return values


def _ascii_hostname(hostname: str) -> str:
    return hostname.encode("idna").decode("ascii")


def _host_header(target: _ValidatedFetchTarget) -> str:
    hostname = _ascii_hostname(target.hostname)
    try:
        host_address = ipaddress.ip_address(hostname)
    except ValueError:
        authority = hostname
    else:
        authority = f"[{host_address}]" if host_address.version == 6 else str(host_address)

    parsed = urlsplit(target.logical_url)
    return f"{authority}:{target.port}" if parsed.port is not None else authority


def _connect_url(target: _ValidatedFetchTarget, address: str) -> str:
    parsed = urlsplit(target.logical_url)
    ip_address = ipaddress.ip_address(address)
    authority = f"[{ip_address}]" if ip_address.version == 6 else str(ip_address)
    if parsed.port is not None:
        authority = f"{authority}:{target.port}"
    return urlunsplit((parsed.scheme, authority, parsed.path, parsed.query, parsed.fragment))


def _declared_content_length(headers: dict[str, str]) -> int | None:
    raw_value = headers.get("content-length")
    if raw_value is None:
        return None
    try:
        value = int(raw_value)
    except ValueError:
        return None
    return value if value >= 0 else None


def _read_raw_body(response: httpx.Response, *, max_body_bytes: int) -> bytes:
    chunks: list[bytes] = []
    total = 0
    chunk_size = min(STREAM_CHUNK_BYTES, max_body_bytes + 1)

    for chunk in response.iter_raw(chunk_size=chunk_size):
        if not chunk:
            continue
        total += len(chunk)
        if total > max_body_bytes:
            raise ResponseBodyTooLargeError(
                "HTTP response body exceeds the configured size limit."
            )
        chunks.append(chunk)

    return b"".join(chunks)


def _decode_content_body(
    raw_body: bytes,
    *,
    content_encoding: str,
    max_body_bytes: int,
) -> bytes:
    if content_encoding in {"", "identity"}:
        return raw_body
    if content_encoding in {"gzip", "x-gzip"}:
        try:
            return _decompress_limited(
                raw_body,
                wbits=zlib.MAX_WBITS | 16,
                max_body_bytes=max_body_bytes,
            )
        except zlib.error as exc:
            raise SafeFetchError("Compressed HTTP response body could not be decoded.") from exc
    if content_encoding == "deflate":
        try:
            return _decompress_limited(
                raw_body,
                wbits=zlib.MAX_WBITS,
                max_body_bytes=max_body_bytes,
            )
        except zlib.error:
            try:
                return _decompress_limited(
                    raw_body,
                    wbits=-zlib.MAX_WBITS,
                    max_body_bytes=max_body_bytes,
                )
            except zlib.error as exc:
                raise SafeFetchError(
                    "Compressed HTTP response body could not be decoded."
                ) from exc
    raise SafeFetchError(f"Unsupported HTTP content encoding: {content_encoding}.")


def _decompress_limited(raw_body: bytes, *, wbits: int, max_body_bytes: int) -> bytes:
    decoder = zlib.decompressobj(wbits)
    output: list[bytes] = []
    total = 0

    for offset in range(0, len(raw_body), STREAM_CHUNK_BYTES):
        chunk = raw_body[offset : offset + STREAM_CHUNK_BYTES]
        remaining = max_body_bytes - total
        decoded = decoder.decompress(chunk, remaining + 1)
        if len(decoded) > remaining or decoder.unconsumed_tail:
            raise ResponseBodyTooLargeError(
                "Decoded HTTP response body exceeds the configured size limit."
            )
        output.append(decoded)
        total += len(decoded)

    remaining = max_body_bytes - total
    flushed = decoder.flush(remaining + 1)
    if len(flushed) > remaining:
        raise ResponseBodyTooLargeError(
            "Decoded HTTP response body exceeds the configured size limit."
        )
    output.append(flushed)

    if not decoder.eof or decoder.unused_data:
        raise SafeFetchError("Compressed HTTP response body is invalid or unsupported.")
    return b"".join(output)
