from __future__ import annotations

import ipaddress
from dataclasses import dataclass
from urllib.parse import SplitResult, urlsplit

ALLOWED_SCHEMES = frozenset({"http", "https"})
BLOCKED_HOST_SUFFIXES = (".localhost", ".local", ".internal", ".home.arpa")

class UrlPolicyError(ValueError):
    pass

@dataclass(frozen=True, slots=True)
class ValidatedUrl:
    original: str
    normalized: str
    scheme: str
    hostname: str
    port: int


def _is_blocked_ip(value: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    return any((
        value.is_private,
        value.is_loopback,
        value.is_link_local,
        value.is_multicast,
        value.is_reserved,
        value.is_unspecified,
    ))


def validate_resolved_addresses(addresses: list[str]) -> None:
    if not addresses:
        raise UrlPolicyError("Hostname did not resolve to an address.")
    for raw in addresses:
        try:
            address = ipaddress.ip_address(raw)
        except ValueError as exc:
            raise UrlPolicyError("Resolver returned an invalid IP address.") from exc
        if _is_blocked_ip(address):
            raise UrlPolicyError("Resolved address is not allowed.")


def _canonicalize_hostname(
    hostname: str,
) -> tuple[str, ipaddress.IPv4Address | ipaddress.IPv6Address | None]:
    try:
        address = ipaddress.ip_address(hostname)
    except ValueError:
        try:
            return hostname.encode("idna").decode("ascii").lower(), None
        except UnicodeError as exc:
            raise UrlPolicyError("Hostname cannot be encoded as IDNA.") from exc
    return str(address), address


def validate_url(raw: str) -> ValidatedUrl:
    value = raw.strip()
    if not value:
        raise UrlPolicyError("URL is required.")
    try:
        parsed: SplitResult = urlsplit(value)
    except ValueError as exc:
        raise UrlPolicyError("URL cannot be parsed.") from exc
    scheme = parsed.scheme.lower()
    if scheme not in ALLOWED_SCHEMES:
        raise UrlPolicyError("Only HTTP and HTTPS are allowed.")
    if parsed.username is not None or parsed.password is not None:
        raise UrlPolicyError("Credentials in URLs are not allowed.")
    raw_hostname = (parsed.hostname or "").rstrip(".")
    hostname, address = _canonicalize_hostname(raw_hostname)
    if not hostname:
        raise UrlPolicyError("Hostname is required.")
    if hostname == "localhost" or hostname.endswith(BLOCKED_HOST_SUFFIXES):
        raise UrlPolicyError("Local hostnames are not allowed.")
    if address is not None and _is_blocked_ip(address):
        raise UrlPolicyError("Private or reserved addresses are not allowed.")
    try:
        parsed_port = parsed.port
    except ValueError as exc:
        raise UrlPolicyError("Port is invalid.") from exc
    default_port = 443 if scheme == "https" else 80
    port = parsed_port or default_port
    if port not in {80, 443}:
        raise UrlPolicyError("Only ports 80 and 443 are allowed.")
    authority_hostname = f"[{hostname}]" if isinstance(address, ipaddress.IPv6Address) else hostname
    netloc = authority_hostname if port == default_port else f"{authority_hostname}:{port}"
    normalized = parsed._replace(scheme=scheme, netloc=netloc).geturl()
    return ValidatedUrl(
        original=raw,
        normalized=normalized,
        scheme=scheme,
        hostname=hostname,
        port=port,
    )
