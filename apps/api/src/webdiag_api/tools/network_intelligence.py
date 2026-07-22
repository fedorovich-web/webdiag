from __future__ import annotations

import ipaddress
import json
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from contextlib import suppress
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Annotated, Literal, cast
from urllib.parse import quote, urljoin, urlsplit

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, field_validator

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeFetchError, SafeHttpFetcher
from webdiag_api.security.url_policy import UrlPolicyError
from webdiag_api.tools.network_dns import (
    DnsResolver,
    DnsResolverError,
    DomainRequest,
)

router = APIRouter(tags=["tools"])

ComparisonRecordType = Literal["A", "AAAA", "CNAME", "MX", "NS", "TXT"]
ToolStatus = Literal["pass", "warning", "fail"]
ResolverStatus = Literal["ok", "error"]
RdapEventAction = Literal[
    "registration",
    "expiration",
    "last changed",
    "last update of RDAP database",
    "transfer",
    "reinstantiation",
    "other",
]

_MAX_RDAP_BODY_BYTES = 1_500_000
_MAX_RDAP_ITEMS = 30
_MAX_RDAP_TEXT = 500
_BOOTSTRAP_TTL_SECONDS = 21_600.0

_IANA_DNS_BOOTSTRAP_URL = "https://data.iana.org/rdap/dns.json"
_IANA_IPV4_BOOTSTRAP_URL = "https://data.iana.org/rdap/ipv4.json"
_IANA_IPV6_BOOTSTRAP_URL = "https://data.iana.org/rdap/ipv6.json"


class DnsResolverComparisonRequest(DomainRequest):
    record_type: ComparisonRecordType = "A"


class PublicIpRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ip: str = Field(min_length=1, max_length=64)

    @field_validator("ip")
    @classmethod
    def normalize_ip(cls, value: str) -> str:
        try:
            address = ipaddress.ip_address(value.strip())
        except ValueError as exc:
            raise ValueError("Provide a valid IPv4 or IPv6 address.") from exc
        if not address.is_global:
            raise ValueError("Provide a public global IP address.")
        return address.compressed


class ResolverAnswerResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    value: str = Field(min_length=1, max_length=2_048)
    ttl: int = Field(ge=0)
    priority: int | None = Field(default=None, ge=0, le=65_535)


class ResolverSnapshotResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    resolver_id: str = Field(min_length=1, max_length=80)
    resolver_name: str = Field(min_length=1, max_length=120)
    nameserver: str = Field(min_length=1, max_length=64)
    status: ResolverStatus
    elapsed_ms: int = Field(ge=0)
    answer_count: int = Field(ge=0)
    answers: tuple[ResolverAnswerResponse, ...]
    error: str | None = Field(default=None, max_length=300)


class DnsResolverComparisonResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.dns_resolver_comparison.v1"] = (
        "webdiag.tool.dns_resolver_comparison.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    domain: str = Field(min_length=1, max_length=253)
    record_type: ComparisonRecordType
    resolver_count: int = Field(ge=1)
    successful_resolver_count: int = Field(ge=0)
    distinct_answer_set_count: int = Field(ge=0)
    consistent: bool
    timing_scope: Literal["backend_to_resolver"] = "backend_to_resolver"
    snapshots: tuple[ResolverSnapshotResponse, ...]
    status: ToolStatus
    recommendation: str = Field(min_length=1, max_length=1_000)


class RdapEventResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    action: RdapEventAction
    raw_action: str = Field(min_length=1, max_length=120)
    date: str = Field(min_length=1, max_length=120)


class RdapNameserverResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ldh_name: str | None = Field(default=None, max_length=253)
    unicode_name: str | None = Field(default=None, max_length=253)
    statuses: tuple[str, ...]


class DomainRdapResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.domain_rdap_lookup.v1"] = (
        "webdiag.tool.domain_rdap_lookup.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    domain: str = Field(min_length=1, max_length=253)
    found: bool
    bootstrap_source: Literal["iana_rdap_dns_bootstrap"] = "iana_rdap_dns_bootstrap"
    rdap_url: str | None = Field(default=None, max_length=2_048)
    handle: str | None = Field(default=None, max_length=300)
    ldh_name: str | None = Field(default=None, max_length=253)
    unicode_name: str | None = Field(default=None, max_length=253)
    statuses: tuple[str, ...]
    events: tuple[RdapEventResponse, ...]
    nameservers: tuple[RdapNameserverResponse, ...]
    registrar_name: str | None = Field(default=None, max_length=300)
    abuse_email: str | None = Field(default=None, max_length=320)
    delegation_signed: bool | None = None
    notice_titles: tuple[str, ...]
    status: ToolStatus
    recommendation: str = Field(min_length=1, max_length=1_000)


class IpRdapCidrResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    version: Literal["v4", "v6"]
    prefix: str = Field(min_length=1, max_length=64)
    length: int = Field(ge=0, le=128)


class IpRdapResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.ip_rdap_lookup.v1"] = (
        "webdiag.tool.ip_rdap_lookup.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    ip: str = Field(min_length=1, max_length=64)
    found: bool
    bootstrap_source: Literal["iana_rdap_ip_bootstrap"] = "iana_rdap_ip_bootstrap"
    country_semantics: Literal["registration_data_not_geolocation"] = (
        "registration_data_not_geolocation"
    )
    rdap_url: str | None = Field(default=None, max_length=2_048)
    handle: str | None = Field(default=None, max_length=300)
    start_address: str | None = Field(default=None, max_length=64)
    end_address: str | None = Field(default=None, max_length=64)
    ip_version: str | None = Field(default=None, max_length=40)
    name: str | None = Field(default=None, max_length=300)
    network_type: str | None = Field(default=None, max_length=120)
    country: str | None = Field(default=None, max_length=20)
    parent_handle: str | None = Field(default=None, max_length=300)
    statuses: tuple[str, ...]
    events: tuple[RdapEventResponse, ...]
    cidrs: tuple[IpRdapCidrResponse, ...]
    abuse_email: str | None = Field(default=None, max_length=320)
    status: ToolStatus
    recommendation: str = Field(min_length=1, max_length=1_000)


@dataclass(frozen=True, slots=True)
class NamedDnsResolver:
    resolver_id: str
    resolver_name: str
    nameserver: str
    resolver: DnsResolver


@dataclass(frozen=True, slots=True)
class RdapDocument:
    found: bool
    final_url: str
    payload: dict[str, object] | None


class RdapLookupError(RuntimeError):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


class RdapClient:
    def __init__(self, *, fetcher: SafeHttpFetcher | None = None) -> None:
        self._fetcher = fetcher or SafeHttpFetcher(
            config=SafeFetchConfig(
                timeout_seconds=7.0,
                max_redirects=3,
                max_body_bytes=_MAX_RDAP_BODY_BYTES,
                user_agent="WebDiagRDAP/0.5 (+https://webdiag.local/tools)",
            )
        )
        self._cache_lock = threading.Lock()
        self._bootstrap_cache: dict[str, tuple[float, dict[str, object]]] = {}

    def lookup_domain(self, domain: str) -> RdapDocument:
        bootstrap = self._bootstrap(_IANA_DNS_BOOTSTRAP_URL)
        service_url = _domain_service_url(bootstrap, domain)
        return self._rdap_document(urljoin(_service_base(service_url), f"domain/{quote(domain)}"))

    def lookup_ip(self, ip: str) -> RdapDocument:
        address = ipaddress.ip_address(ip)
        bootstrap_url = (
            _IANA_IPV4_BOOTSTRAP_URL if address.version == 4 else _IANA_IPV6_BOOTSTRAP_URL
        )
        bootstrap = self._bootstrap(bootstrap_url)
        service_url = _ip_service_url(bootstrap, address)
        return self._rdap_document(urljoin(_service_base(service_url), f"ip/{quote(ip)}"))

    def _bootstrap(self, url: str) -> dict[str, object]:
        now = time.monotonic()
        with self._cache_lock:
            cached = self._bootstrap_cache.get(url)
            if cached and now - cached[0] < _BOOTSTRAP_TTL_SECONDS:
                return cached[1]
        document = self._fetch_json(url, allow_not_found=False)
        if document.payload is None:
            raise RdapLookupError(
                "rdap_bootstrap_invalid",
                "RDAP bootstrap returned no JSON object.",
            )
        with self._cache_lock:
            self._bootstrap_cache[url] = (now, document.payload)
        return document.payload

    def _rdap_document(self, url: str) -> RdapDocument:
        return self._fetch_json(url, allow_not_found=True)

    def _fetch_json(self, url: str, *, allow_not_found: bool) -> RdapDocument:
        try:
            result = self._fetcher.fetch(
                url,
                extra_headers={"accept": "application/rdap+json, application/json;q=0.9"},
            )
        except (SafeFetchError, UrlPolicyError) as exc:
            raise RdapLookupError("rdap_fetch_failed", "RDAP HTTP request failed safely.") from exc
        if allow_not_found and result.status_code == 404:
            return RdapDocument(found=False, final_url=result.final_url, payload=None)
        if result.status_code < 200 or result.status_code >= 300:
            raise RdapLookupError(
                "rdap_upstream_error",
                f"RDAP service returned HTTP {result.status_code}.",
            )
        try:
            parsed = json.loads(result.body_text)
        except json.JSONDecodeError as exc:
            raise RdapLookupError(
                "rdap_invalid_json",
                "RDAP service returned invalid JSON.",
            ) from exc
        if not isinstance(parsed, dict):
            raise RdapLookupError("rdap_invalid_json", "RDAP JSON root must be an object.")
        return RdapDocument(
            found=True,
            final_url=result.final_url,
            payload=cast(dict[str, object], parsed),
        )


def get_dns_comparison_resolvers() -> tuple[NamedDnsResolver, ...]:
    values = (
        ("cloudflare", "Cloudflare", "1.1.1.1"),
        ("google", "Google Public DNS", "8.8.8.8"),
        ("quad9", "Quad9", "9.9.9.9"),
        ("opendns", "OpenDNS", "208.67.222.222"),
    )
    return tuple(
        NamedDnsResolver(
            resolver_id=resolver_id,
            resolver_name=resolver_name,
            nameserver=nameserver,
            resolver=DnsResolver(nameserver=nameserver, timeout_seconds=3.5),
        )
        for resolver_id, resolver_name, nameserver in values
    )


_RDAP_CLIENT = RdapClient()


def get_rdap_client() -> RdapClient:
    return _RDAP_CLIENT


@router.post("/v1/tools/dns-resolver-comparison", response_model=DnsResolverComparisonResponse)
def compare_dns_resolvers(
    payload: DnsResolverComparisonRequest,
    resolvers: Annotated[tuple[NamedDnsResolver, ...], Depends(get_dns_comparison_resolvers)],
) -> DnsResolverComparisonResponse:
    snapshots: list[ResolverSnapshotResponse] = []
    with ThreadPoolExecutor(max_workers=min(4, max(1, len(resolvers)))) as executor:
        futures = {
            executor.submit(_resolver_snapshot, item, payload.domain, payload.record_type): item
            for item in resolvers
        }
        for future in as_completed(futures):
            snapshots.append(future.result())
    order = {item.resolver_id: index for index, item in enumerate(resolvers)}
    snapshots.sort(key=lambda item: order.get(item.resolver_id, len(order)))
    successful = tuple(item for item in snapshots if item.status == "ok")
    answer_sets = {_snapshot_answer_key(item, payload.record_type) for item in successful}
    consistent = bool(successful) and len(answer_sets) == 1 and len(successful) == len(snapshots)
    distinct_count = len(answer_sets)
    health = _dns_comparison_status(
        resolver_count=len(snapshots),
        successful_count=len(successful),
        distinct_answer_set_count=distinct_count,
    )
    return DnsResolverComparisonResponse(
        domain=payload.domain,
        record_type=payload.record_type,
        resolver_count=len(snapshots),
        successful_resolver_count=len(successful),
        distinct_answer_set_count=distinct_count,
        consistent=consistent,
        snapshots=tuple(snapshots),
        status=health,
        recommendation=_dns_comparison_recommendation(
            resolver_count=len(snapshots),
            successful_count=len(successful),
            distinct_answer_set_count=distinct_count,
        ),
    )


@router.post("/v1/tools/domain-rdap", response_model=DomainRdapResponse)
def lookup_domain_rdap(
    payload: DomainRequest,
    client: Annotated[RdapClient, Depends(get_rdap_client)],
) -> DomainRdapResponse:
    try:
        document = client.lookup_domain(payload.domain)
    except RdapLookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": exc.code, "message": str(exc)},
        ) from exc
    if not document.found or document.payload is None:
        return DomainRdapResponse(
            domain=payload.domain,
            found=False,
            rdap_url=document.final_url,
            statuses=(),
            events=(),
            nameservers=(),
            notice_titles=(),
            status="warning",
            recommendation=(
                "The selected RDAP service returned HTTP 404. This does not prove that the "
                "domain is available; verify with the relevant registry or registrar."
            ),
        )
    data = document.payload
    events = _rdap_events(data.get("events"))
    nameservers = _rdap_nameservers(data.get("nameservers"))
    registrar_name = _entity_contact(data.get("entities"), role="registrar", field="name")
    abuse_email = _entity_contact(data.get("entities"), role="abuse", field="email")
    statuses = _string_items(data.get("status"), max_items=20, max_length=120)
    return DomainRdapResponse(
        domain=payload.domain,
        found=True,
        rdap_url=document.final_url,
        handle=_optional_text(data.get("handle"), 300),
        ldh_name=_optional_text(data.get("ldhName"), 253),
        unicode_name=_optional_text(data.get("unicodeName"), 253),
        statuses=statuses,
        events=events,
        nameservers=nameservers,
        registrar_name=registrar_name,
        abuse_email=abuse_email,
        delegation_signed=_delegation_signed(data.get("secureDNS")),
        notice_titles=_notice_titles(data.get("notices")),
        status="pass" if data.get("objectClassName") == "domain" else "warning",
        recommendation=(
            "RDAP registration data was returned. Treat dates, statuses, and contacts as "
            "registry-published data; they do not prove domain ownership, availability, or safety."
        ),
    )


@router.post("/v1/tools/ip-rdap", response_model=IpRdapResponse)
def lookup_ip_rdap(
    payload: PublicIpRequest,
    client: Annotated[RdapClient, Depends(get_rdap_client)],
) -> IpRdapResponse:
    try:
        document = client.lookup_ip(payload.ip)
    except RdapLookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": exc.code, "message": str(exc)},
        ) from exc
    if not document.found or document.payload is None:
        return IpRdapResponse(
            ip=payload.ip,
            found=False,
            rdap_url=document.final_url,
            statuses=(),
            events=(),
            cidrs=(),
            status="warning",
            recommendation=(
                "The selected RDAP service returned HTTP 404. No network registration record "
                "was available from that service."
            ),
        )
    data = document.payload
    statuses = _string_items(data.get("status"), max_items=20, max_length=120)
    abuse_email = _entity_contact(data.get("entities"), role="abuse", field="email")
    return IpRdapResponse(
        ip=payload.ip,
        found=True,
        rdap_url=document.final_url,
        handle=_optional_text(data.get("handle"), 300),
        start_address=_optional_text(data.get("startAddress"), 64),
        end_address=_optional_text(data.get("endAddress"), 64),
        ip_version=_optional_text(data.get("ipVersion"), 40),
        name=_optional_text(data.get("name"), 300),
        network_type=_optional_text(data.get("type"), 120),
        country=_optional_text(data.get("country"), 20),
        parent_handle=_optional_text(data.get("parentHandle"), 300),
        statuses=statuses,
        events=_rdap_events(data.get("events")),
        cidrs=_rdap_cidrs(data.get("cidr0_cidrs")),
        abuse_email=abuse_email,
        status="pass" if data.get("objectClassName") == "ip network" else "warning",
        recommendation=(
            "RDAP network registration data was returned. Country and network fields describe "
            "registry allocation data, not device location, reputation, or current user identity."
        ),
    )


def _resolver_snapshot(
    item: NamedDnsResolver,
    domain: str,
    record_type: ComparisonRecordType,
) -> ResolverSnapshotResponse:
    started = time.perf_counter()
    try:
        answers = item.resolver.query(domain, record_type)
    except DnsResolverError as exc:
        return ResolverSnapshotResponse(
            resolver_id=item.resolver_id,
            resolver_name=item.resolver_name,
            nameserver=item.nameserver,
            status="error",
            elapsed_ms=max(0, round((time.perf_counter() - started) * 1_000)),
            answer_count=0,
            answers=(),
            error=str(exc),
        )
    values = tuple(
        ResolverAnswerResponse(value=answer.value, ttl=answer.ttl, priority=answer.priority)
        for answer in answers
        if answer.record_type == record_type
    )
    return ResolverSnapshotResponse(
        resolver_id=item.resolver_id,
        resolver_name=item.resolver_name,
        nameserver=item.nameserver,
        status="ok",
        elapsed_ms=max(0, round((time.perf_counter() - started) * 1_000)),
        answer_count=len(values),
        answers=values,
    )


def _snapshot_answer_key(
    snapshot: ResolverSnapshotResponse,
    record_type: ComparisonRecordType,
) -> tuple[tuple[str, int | None], ...]:
    values: list[tuple[str, int | None]] = []
    for answer in snapshot.answers:
        value = answer.value
        if record_type in {"CNAME", "MX", "NS"}:
            value = value.rstrip(".").lower()
        elif record_type in {"A", "AAAA"}:
            with suppress(ValueError):
                value = ipaddress.ip_address(value).compressed
        values.append((value, answer.priority))
    return tuple(sorted(values))


def _dns_comparison_status(
    *, resolver_count: int, successful_count: int, distinct_answer_set_count: int
) -> ToolStatus:
    if successful_count == 0:
        return "fail"
    if successful_count < resolver_count or distinct_answer_set_count > 1:
        return "warning"
    return "pass"


def _dns_comparison_recommendation(
    *, resolver_count: int, successful_count: int, distinct_answer_set_count: int
) -> str:
    if successful_count == 0:
        return (
            "All resolver queries failed from the WebDiag backend. Retry later and verify the "
            "authoritative zone directly before changing DNS."
        )
    if successful_count < resolver_count:
        return (
            "Some recursive resolvers did not answer. Compare successful snapshots and retry; "
            "a partial backend view is not proof of global DNS propagation."
        )
    if distinct_answer_set_count > 1:
        return (
            "The selected resolvers returned different answer sets. Review TTLs and authoritative "
            "DNS, then repeat after expected cache expiry; this snapshot is not global coverage."
        )
    return (
        "All selected resolvers returned the same answer set in this backend snapshot. This is "
        "useful corroboration, not proof that every resolver worldwide has the same cache state."
    )


def _service_base(raw_url: str) -> str:
    parsed = urlsplit(raw_url)
    if parsed.scheme != "https" or not parsed.hostname:
        raise RdapLookupError("rdap_bootstrap_invalid", "RDAP bootstrap service URL is invalid.")
    return raw_url.rstrip("/") + "/"


def _services(value: object) -> tuple[tuple[tuple[str, ...], tuple[str, ...]], ...]:
    if not isinstance(value, list):
        raise RdapLookupError("rdap_bootstrap_invalid", "RDAP bootstrap has no services list.")
    services: list[tuple[tuple[str, ...], tuple[str, ...]]] = []
    for item in value:
        if not isinstance(item, list) or len(item) != 2:
            continue
        keys = _string_items(item[0], max_items=500, max_length=120)
        urls = _string_items(item[1], max_items=20, max_length=2_048)
        if keys and urls:
            services.append((keys, urls))
    return tuple(services)


def _domain_service_url(bootstrap: dict[str, object], domain: str) -> str:
    tld = domain.rsplit(".", 1)[-1].lower()
    for keys, urls in _services(bootstrap.get("services")):
        if tld in {key.lower() for key in keys}:
            for url in urls:
                if url.startswith("https://"):
                    return url
    raise RdapLookupError(
        "rdap_service_not_found",
        "IANA RDAP bootstrap has no HTTPS service for this domain suffix.",
    )


def _ip_service_url(
    bootstrap: dict[str, object], address: ipaddress.IPv4Address | ipaddress.IPv6Address
) -> str:
    candidates: list[tuple[int, str]] = []
    for keys, urls in _services(bootstrap.get("services")):
        https_url = next((url for url in urls if url.startswith("https://")), None)
        if not https_url:
            continue
        for raw_network in keys:
            try:
                network = ipaddress.ip_network(raw_network, strict=False)
            except ValueError:
                continue
            if network.version == address.version and address in network:
                candidates.append((network.prefixlen, https_url))
    if not candidates:
        raise RdapLookupError(
            "rdap_service_not_found",
            "IANA RDAP bootstrap has no HTTPS service for this IP range.",
        )
    return max(candidates, key=lambda item: item[0])[1]


def _optional_text(value: object, limit: int) -> str | None:
    if not isinstance(value, str):
        return None
    normalized = " ".join(value.split())
    return normalized[:limit] if normalized else None


def _string_items(value: object, *, max_items: int, max_length: int) -> tuple[str, ...]:
    if not isinstance(value, list):
        return ()
    values: list[str] = []
    for item in value:
        text = _optional_text(item, max_length)
        if text is not None:
            values.append(text)
        if len(values) >= max_items:
            break
    return tuple(values)


def _rdap_events(value: object) -> tuple[RdapEventResponse, ...]:
    if not isinstance(value, list):
        return ()
    events: list[RdapEventResponse] = []
    allowed = {
        "registration",
        "expiration",
        "last changed",
        "last update of RDAP database",
        "transfer",
        "reinstantiation",
    }
    for item in value:
        if not isinstance(item, dict):
            continue
        raw_action = _optional_text(item.get("eventAction"), 120)
        date = _optional_text(item.get("eventDate"), 120)
        if not raw_action or not date:
            continue
        action = raw_action if raw_action in allowed else "other"
        events.append(
            RdapEventResponse(
                action=cast(RdapEventAction, action),
                raw_action=raw_action,
                date=date,
            )
        )
        if len(events) >= _MAX_RDAP_ITEMS:
            break
    return tuple(events)


def _rdap_nameservers(value: object) -> tuple[RdapNameserverResponse, ...]:
    if not isinstance(value, list):
        return ()
    nameservers: list[RdapNameserverResponse] = []
    for item in value:
        if not isinstance(item, dict):
            continue
        ldh_name = _optional_text(item.get("ldhName"), 253)
        unicode_name = _optional_text(item.get("unicodeName"), 253)
        if not ldh_name and not unicode_name:
            continue
        nameservers.append(
            RdapNameserverResponse(
                ldh_name=ldh_name,
                unicode_name=unicode_name,
                statuses=_string_items(item.get("status"), max_items=10, max_length=120),
            )
        )
        if len(nameservers) >= _MAX_RDAP_ITEMS:
            break
    return tuple(nameservers)


def _vcard_fields(value: object) -> dict[str, tuple[str, ...]]:
    if not isinstance(value, list) or len(value) != 2 or value[0] != "vcard":
        return {}
    entries = value[1]
    if not isinstance(entries, list):
        return {}
    fields: dict[str, list[str]] = {}
    for entry in entries:
        if not isinstance(entry, list) or len(entry) < 4 or not isinstance(entry[0], str):
            continue
        name = entry[0].lower()
        raw = entry[3]
        values: list[str] = []
        if isinstance(raw, str):
            text = _optional_text(raw, _MAX_RDAP_TEXT)
            if text:
                values.append(text)
        elif isinstance(raw, list):
            for item in raw:
                text = _optional_text(item, _MAX_RDAP_TEXT)
                if text:
                    values.append(text)
        if values:
            fields.setdefault(name, []).extend(values)
    return {name: tuple(values[:10]) for name, values in fields.items()}


def _entity_contact(value: object, *, role: str, field: Literal["name", "email"]) -> str | None:
    if not isinstance(value, list):
        return None
    pending: list[tuple[object, int]] = [(item, 0) for item in value[:50]]
    checked = 0
    while pending and checked < 100:
        raw_entity, depth = pending.pop(0)
        checked += 1
        if not isinstance(raw_entity, dict):
            continue
        roles = _string_items(raw_entity.get("roles"), max_items=20, max_length=80)
        if role in {item.lower() for item in roles}:
            fields = _vcard_fields(raw_entity.get("vcardArray"))
            keys = ("org", "fn") if field == "name" else ("email",)
            for key in keys:
                values = fields.get(key, ())
                if values:
                    return values[0][: 300 if field == "name" else 320]
        nested = raw_entity.get("entities")
        if depth < 3 and isinstance(nested, list):
            pending.extend((item, depth + 1) for item in nested[:50])
    return None


def _delegation_signed(value: object) -> bool | None:
    if not isinstance(value, dict):
        return None
    delegated = value.get("delegationSigned")
    return delegated if isinstance(delegated, bool) else None


def _notice_titles(value: object) -> tuple[str, ...]:
    if not isinstance(value, list):
        return ()
    titles: list[str] = []
    for item in value:
        if not isinstance(item, dict):
            continue
        title = _optional_text(item.get("title"), 240)
        if title:
            titles.append(title)
        if len(titles) >= 10:
            break
    return tuple(titles)


def _rdap_cidrs(value: object) -> tuple[IpRdapCidrResponse, ...]:
    if not isinstance(value, list):
        return ()
    cidrs: list[IpRdapCidrResponse] = []
    for item in value:
        if not isinstance(item, dict):
            continue
        if isinstance(item.get("v4prefix"), str):
            prefix = cast(str, item["v4prefix"])
            length = item.get("length")
            if isinstance(length, int) and 0 <= length <= 32:
                cidrs.append(IpRdapCidrResponse(version="v4", prefix=prefix[:64], length=length))
        elif isinstance(item.get("v6prefix"), str):
            prefix = cast(str, item["v6prefix"])
            length = item.get("length")
            if isinstance(length, int) and 0 <= length <= 128:
                cidrs.append(IpRdapCidrResponse(version="v6", prefix=prefix[:64], length=length))
        if len(cidrs) >= _MAX_RDAP_ITEMS:
            break
    return tuple(cidrs)
