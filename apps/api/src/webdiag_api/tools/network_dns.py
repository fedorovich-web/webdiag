from __future__ import annotations

import ipaddress
import random
import socket
import struct
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, field_validator

router = APIRouter(tags=["tools"])

RecordType = Literal["A", "AAAA", "CNAME", "MX", "NS", "TXT"]
DnsHealthStatus = Literal["pass", "warning", "fail"]

_ALLOWED_RECORD_TYPES: tuple[RecordType, ...] = ("A", "AAAA", "CNAME", "MX", "NS", "TXT")
_RECORD_TYPE_CODES: dict[str, int] = {
    "A": 1,
    "NS": 2,
    "CNAME": 5,
    "MX": 15,
    "TXT": 16,
    "AAAA": 28,
}
_CODE_RECORD_TYPES = {value: key for key, value in _RECORD_TYPE_CODES.items()}
_MAX_DOMAIN_LENGTH = 253
_MAX_LABEL_LENGTH = 63
_MAX_DNS_UDP_SIZE = 4_096


class DnsLookupRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    domain: str = Field(min_length=1, max_length=_MAX_DOMAIN_LENGTH)
    record_types: tuple[RecordType, ...] = _ALLOWED_RECORD_TYPES

    @field_validator("domain")
    @classmethod
    def normalize_domain(cls, value: str) -> str:
        return _normalize_domain(value)

    @field_validator("record_types")
    @classmethod
    def normalize_record_types(cls, value: tuple[RecordType, ...]) -> tuple[RecordType, ...]:
        if not value:
            return _ALLOWED_RECORD_TYPES
        deduped: list[RecordType] = []
        for record_type in value:
            if record_type not in deduped:
                deduped.append(record_type)
        return tuple(deduped[: len(_ALLOWED_RECORD_TYPES)])


class DomainRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    domain: str = Field(min_length=1, max_length=_MAX_DOMAIN_LENGTH)

    @field_validator("domain")
    @classmethod
    def normalize_domain(cls, value: str) -> str:
        return _normalize_domain(value)


class DnsRecordResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    record_type: RecordType
    name: str = Field(min_length=1, max_length=300)
    value: str = Field(min_length=1, max_length=2_048)
    ttl: int = Field(ge=0)
    priority: int | None = Field(default=None, ge=0, le=65_535)


class DnsQueryErrorResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    record_type: RecordType
    code: str = Field(min_length=1, max_length=80)
    message: str = Field(min_length=1, max_length=300)


class DnsLookupResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.dns_lookup.v1"] = "webdiag.tool.dns_lookup.v1"
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    domain: str = Field(min_length=1, max_length=_MAX_DOMAIN_LENGTH)
    checked_record_types: tuple[RecordType, ...]
    record_count: int = Field(ge=0)
    records: tuple[DnsRecordResponse, ...]
    errors: tuple[DnsQueryErrorResponse, ...]
    recommendation: str = Field(min_length=1, max_length=800)


class MxHostResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    host: str = Field(min_length=1, max_length=300)
    priority: int = Field(ge=0, le=65_535)
    address_count: int = Field(ge=0)
    addresses: tuple[str, ...]
    reachable_dns: bool


class MxCheckerResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.mx_record_checker.v1"] = (
        "webdiag.tool.mx_record_checker.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    domain: str = Field(min_length=1, max_length=_MAX_DOMAIN_LENGTH)
    mx_count: int = Field(ge=0)
    has_null_mx: bool
    hosts: tuple[MxHostResponse, ...]
    status: DnsHealthStatus
    recommendation: str = Field(min_length=1, max_length=800)


class SpfMechanismResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    value: str = Field(min_length=1, max_length=240)
    qualifier: Literal["+", "-", "~", "?"]
    name: str = Field(min_length=1, max_length=80)


class SpfCheckerResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.spf_checker.v1"] = "webdiag.tool.spf_checker.v1"
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    domain: str = Field(min_length=1, max_length=_MAX_DOMAIN_LENGTH)
    spf_record_count: int = Field(ge=0)
    spf_record: str | None = Field(default=None, max_length=2_048)
    mechanisms: tuple[SpfMechanismResponse, ...]
    has_all_mechanism: bool
    all_mechanism: str | None = Field(default=None, max_length=40)
    uses_include: bool
    uses_redirect: bool
    estimated_dns_lookup_mechanisms: int = Field(ge=0)
    status: DnsHealthStatus
    recommendation: str = Field(min_length=1, max_length=800)


@dataclass(frozen=True, slots=True)
class DnsAnswer:
    record_type: str
    name: str
    value: str
    ttl: int
    priority: int | None = None


class DnsResolverError(RuntimeError):
    pass


class DnsResolver:
    def __init__(
        self,
        *,
        nameserver: str = "1.1.1.1",
        timeout_seconds: float = 4.0,
    ) -> None:
        self.nameserver = nameserver
        self.timeout_seconds = timeout_seconds

    def query(self, domain: str, record_type: RecordType) -> tuple[DnsAnswer, ...]:
        query_id = random.SystemRandom().randrange(0, 65_536)
        packet = _build_query_packet(query_id=query_id, domain=domain, record_type=record_type)
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
                sock.settimeout(self.timeout_seconds)
                sock.sendto(packet, (self.nameserver, 53))
                response, _address = sock.recvfrom(_MAX_DNS_UDP_SIZE)
        except OSError as exc:
            raise DnsResolverError("DNS query failed or timed out.") from exc
        return _parse_dns_response(response, expected_query_id=query_id)


NetworkDnsResolverDependency = Annotated[DnsResolver, Depends(lambda: DnsResolver())]


def get_network_dns_resolver() -> DnsResolver:
    return DnsResolver()


@router.post("/v1/tools/dns-lookup", response_model=DnsLookupResponse)
def inspect_dns(
    payload: DnsLookupRequest,
    resolver: Annotated[DnsResolver, Depends(get_network_dns_resolver)],
) -> DnsLookupResponse:
    records: list[DnsRecordResponse] = []
    errors: list[DnsQueryErrorResponse] = []
    for record_type in payload.record_types:
        try:
            answers = resolver.query(payload.domain, record_type)
        except DnsResolverError as exc:
            errors.append(
                DnsQueryErrorResponse(
                    record_type=record_type,
                    code="dns_query_failed",
                    message=str(exc),
                )
            )
            continue
        records.extend(
            _record_response(answer)
            for answer in answers
            if answer.record_type == record_type
        )
    return DnsLookupResponse(
        domain=payload.domain,
        checked_record_types=payload.record_types,
        record_count=len(records),
        records=tuple(records),
        errors=tuple(errors),
        recommendation=_dns_lookup_recommendation(records=records, errors=errors),
    )


@router.post("/v1/tools/mx-records", response_model=MxCheckerResponse)
def inspect_mx(
    payload: DomainRequest,
    resolver: Annotated[DnsResolver, Depends(get_network_dns_resolver)],
) -> MxCheckerResponse:
    try:
        mx_records = tuple(
            answer for answer in resolver.query(payload.domain, "MX") if answer.record_type == "MX"
        )
    except DnsResolverError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "dns_query_failed", "message": str(exc)},
        ) from exc

    has_null_mx = any(record.value == "." for record in mx_records)
    hosts = tuple(
        _mx_host_response(resolver, record)
        for record in mx_records
        if record.value != "."
    )
    health = _mx_status(mx_count=len(mx_records), has_null_mx=has_null_mx, hosts=hosts)
    return MxCheckerResponse(
        domain=payload.domain,
        mx_count=len(mx_records),
        has_null_mx=has_null_mx,
        hosts=hosts,
        status=health,
        recommendation=_mx_recommendation(
            mx_count=len(mx_records),
            has_null_mx=has_null_mx,
            hosts=hosts,
        ),
    )


@router.post("/v1/tools/spf", response_model=SpfCheckerResponse)
def inspect_spf(
    payload: DomainRequest,
    resolver: Annotated[DnsResolver, Depends(get_network_dns_resolver)],
) -> SpfCheckerResponse:
    try:
        txt_records = tuple(
            answer
            for answer in resolver.query(payload.domain, "TXT")
            if answer.record_type == "TXT"
        )
    except DnsResolverError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "dns_query_failed", "message": str(exc)},
        ) from exc

    spf_records = tuple(
        record.value for record in txt_records if record.value.lower().startswith("v=spf1")
    )
    selected = spf_records[0] if len(spf_records) == 1 else None
    mechanisms = _spf_mechanisms(selected) if selected else ()
    all_mechanism = next((item.value for item in mechanisms if item.name == "all"), None)
    lookup_mechanisms = sum(
        1 for item in mechanisms if item.name in {"a", "mx", "include", "exists", "redirect"}
    )
    health = _spf_status(record_count=len(spf_records), all_mechanism=all_mechanism)
    return SpfCheckerResponse(
        domain=payload.domain,
        spf_record_count=len(spf_records),
        spf_record=selected,
        mechanisms=mechanisms,
        has_all_mechanism=all_mechanism is not None,
        all_mechanism=all_mechanism,
        uses_include=any(item.name == "include" for item in mechanisms),
        uses_redirect=any(item.name == "redirect" for item in mechanisms),
        estimated_dns_lookup_mechanisms=lookup_mechanisms,
        status=health,
        recommendation=_spf_recommendation(
            record_count=len(spf_records),
            all_mechanism=all_mechanism,
            lookup_mechanisms=lookup_mechanisms,
        ),
    )


def _normalize_domain(value: str) -> str:
    raw = value.strip().rstrip(".").lower()
    if "://" in raw or "/" in raw or "?" in raw or "#" in raw:
        raise ValueError("Provide a domain name, not a URL.")
    if not raw or len(raw) > _MAX_DOMAIN_LENGTH:
        raise ValueError("Domain is empty or too long.")
    try:
        ipaddress.ip_address(raw)
    except ValueError:
        pass
    else:
        raise ValueError("Provide a domain name, not an IP address.")
    try:
        ascii_domain = raw.encode("idna").decode("ascii")
    except UnicodeError as exc:
        raise ValueError("Domain contains invalid IDN characters.") from exc
    labels = ascii_domain.split(".")
    if len(labels) < 2 or any(not label for label in labels):
        raise ValueError("Domain must contain at least two labels.")
    if any(len(label) > _MAX_LABEL_LENGTH for label in labels):
        raise ValueError("Domain label is too long.")
    allowed = set("abcdefghijklmnopqrstuvwxyz0123456789-")
    for label in labels:
        invalid_chars = any(char not in allowed for char in label)
        if label.startswith("-") or label.endswith("-") or invalid_chars:
            raise ValueError("Domain contains invalid label syntax.")
    return ascii_domain


def _build_query_packet(*, query_id: int, domain: str, record_type: RecordType) -> bytes:
    header = struct.pack("!HHHHHH", query_id, 0x0100, 1, 0, 0, 0)
    question = b"".join(bytes([len(label)]) + label.encode("ascii") for label in domain.split("."))
    question += b"\x00"
    question += struct.pack("!HH", _RECORD_TYPE_CODES[record_type], 1)
    return header + question


def _parse_dns_response(packet: bytes, *, expected_query_id: int) -> tuple[DnsAnswer, ...]:
    if len(packet) < 12:
        raise DnsResolverError("DNS response is truncated.")
    query_id, flags, qdcount, ancount, _nscount, _arcount = struct.unpack("!HHHHHH", packet[:12])
    if query_id != expected_query_id:
        raise DnsResolverError("DNS response id mismatch.")
    response_code = flags & 0x000F
    if response_code != 0:
        if response_code == 3:
            return ()
        raise DnsResolverError(f"DNS server returned RCODE {response_code}.")
    offset = 12
    for _index in range(qdcount):
        _name, offset = _read_dns_name(packet, offset)
        offset += 4
    answers: list[DnsAnswer] = []
    for _index in range(ancount):
        name, offset = _read_dns_name(packet, offset)
        if offset + 10 > len(packet):
            raise DnsResolverError("DNS answer is truncated.")
        rtype, _rclass, ttl, rdlength = struct.unpack("!HHIH", packet[offset : offset + 10])
        offset += 10
        rdata_offset = offset
        rdata = packet[offset : offset + rdlength]
        offset += rdlength
        record_type = _CODE_RECORD_TYPES.get(rtype)
        if record_type is None:
            continue
        parsed = _parse_rdata(
            packet=packet,
            rdata=rdata,
            rdata_offset=rdata_offset,
            record_type=record_type,
        )
        if parsed is None:
            continue
        value, priority = parsed
        answers.append(
            DnsAnswer(
                record_type=record_type,
                name=name,
                value=value,
                ttl=ttl,
                priority=priority,
            )
        )
    return tuple(answers)


def _read_dns_name(packet: bytes, offset: int) -> tuple[str, int]:
    labels: list[str] = []
    original_offset = offset
    jumped = False
    seen_offsets: set[int] = set()
    while True:
        if offset >= len(packet):
            raise DnsResolverError("DNS name is truncated.")
        length = packet[offset]
        if length & 0xC0 == 0xC0:
            if offset + 1 >= len(packet):
                raise DnsResolverError("DNS compression pointer is truncated.")
            pointer = ((length & 0x3F) << 8) | packet[offset + 1]
            if pointer in seen_offsets:
                raise DnsResolverError("DNS compression pointer loop detected.")
            seen_offsets.add(pointer)
            offset = pointer
            if not jumped:
                original_offset += 2
                jumped = True
            continue
        if length == 0:
            offset += 1
            break
        offset += 1
        if offset + length > len(packet):
            raise DnsResolverError("DNS label is truncated.")
        labels.append(packet[offset : offset + length].decode("ascii", errors="replace"))
        offset += length
    next_offset = original_offset if jumped else offset
    return (".".join(labels) or "."), next_offset


def _parse_rdata(
    *,
    packet: bytes,
    rdata: bytes,
    rdata_offset: int,
    record_type: str,
) -> tuple[str, int | None] | None:
    if record_type == "A" and len(rdata) == 4:
        return socket.inet_ntop(socket.AF_INET, rdata), None
    if record_type == "AAAA" and len(rdata) == 16:
        return socket.inet_ntop(socket.AF_INET6, rdata), None
    if record_type in {"CNAME", "NS"}:
        value, _offset = _read_dns_name(packet, rdata_offset)
        return value, None
    if record_type == "MX" and len(rdata) >= 3:
        priority = struct.unpack("!H", rdata[:2])[0]
        exchange, _offset = _read_dns_name(packet, rdata_offset + 2)
        return exchange, priority
    if record_type == "TXT":
        chunks: list[str] = []
        offset = 0
        while offset < len(rdata):
            chunk_length = rdata[offset]
            offset += 1
            chunks.append(rdata[offset : offset + chunk_length].decode("utf-8", errors="replace"))
            offset += chunk_length
        return "".join(chunks), None
    return None


def _record_response(answer: DnsAnswer) -> DnsRecordResponse:
    return DnsRecordResponse(
        record_type=answer.record_type,  # type: ignore[arg-type]
        name=answer.name,
        value=answer.value,
        ttl=answer.ttl,
        priority=answer.priority,
    )


def _mx_host_response(resolver: DnsResolver, record: DnsAnswer) -> MxHostResponse:
    addresses: list[str] = []
    for record_type in ("A", "AAAA"):
        try:
            answers = resolver.query(record.value, record_type)  # type: ignore[arg-type]
        except DnsResolverError:
            continue
        addresses.extend(answer.value for answer in answers if answer.record_type == record_type)
    return MxHostResponse(
        host=record.value,
        priority=record.priority or 0,
        address_count=len(addresses),
        addresses=tuple(addresses[:8]),
        reachable_dns=bool(addresses),
    )


def _spf_mechanisms(record: str) -> tuple[SpfMechanismResponse, ...]:
    mechanisms: list[SpfMechanismResponse] = []
    for token in record.split()[1:]:
        if token.startswith("exp="):
            continue
        qualifier = token[0] if token[0] in "+-~?" else "+"
        body = token[1:] if token[0] in "+-~?" else token
        name = body.split(":", 1)[0].split("=", 1)[0].split("/", 1)[0]
        if not name:
            continue
        mechanisms.append(
            SpfMechanismResponse(
                value=token[:240],
                qualifier=qualifier,  # type: ignore[arg-type]
                name=name.lower()[:80],
            )
        )
    return tuple(mechanisms)


def _dns_lookup_recommendation(
    *,
    records: list[DnsRecordResponse],
    errors: list[DnsQueryErrorResponse],
) -> str:
    if errors and not records:
        return (
            "DNS queries failed; check resolver availability and domain syntax before "
            "deeper mail checks."
        )
    if not records:
        return (
            "No records were returned for the selected types. Verify the domain and "
            "authoritative DNS zone."
        )
    has_spf = any(
        record.record_type == "TXT" and record.value.lower().startswith("v=spf1")
        for record in records
    )
    if has_spf:
        return "DNS records are present; run SPF/MX tools to validate mail-specific policy quality."
    return (
        "DNS records are present. Review TTLs, mail records, and host coverage for "
        "operational gaps."
    )


def _mx_status(
    *,
    mx_count: int,
    has_null_mx: bool,
    hosts: tuple[MxHostResponse, ...],
) -> DnsHealthStatus:
    if has_null_mx:
        return "warning"
    if mx_count == 0:
        return "fail"
    if any(not host.reachable_dns for host in hosts):
        return "warning"
    return "pass"


def _mx_recommendation(
    *,
    mx_count: int,
    has_null_mx: bool,
    hosts: tuple[MxHostResponse, ...],
) -> str:
    if has_null_mx:
        return "Null MX is configured; this domain declares that it does not accept email."
    if mx_count == 0:
        return "No MX records were found. Add MX records if the domain must receive email."
    if any(not host.reachable_dns for host in hosts):
        return "At least one MX host has no A/AAAA address response; verify mail host DNS."
    if len(hosts) == 1:
        return (
            "One MX host is configured. Add a secondary provider only if mail "
            "continuity requires it."
        )
    return "MX records resolve to addressable hosts. Confirm SPF, DKIM, and DMARC alignment next."


def _spf_status(*, record_count: int, all_mechanism: str | None) -> DnsHealthStatus:
    if record_count != 1:
        return "fail"
    if all_mechanism in {"+all", "?all"}:
        return "fail"
    if all_mechanism is None or all_mechanism == "~all":
        return "warning"
    return "pass"


def _spf_recommendation(
    *,
    record_count: int,
    all_mechanism: str | None,
    lookup_mechanisms: int,
) -> str:
    if record_count == 0:
        return (
            "No SPF record was found. Publish a single v=spf1 TXT record for "
            "outbound mail sources."
        )
    if record_count > 1:
        return (
            "Multiple SPF records were found. Merge them into one TXT record to "
            "avoid SPF permerror."
        )
    if all_mechanism in {"+all", "?all"}:
        return "SPF ends with a permissive all mechanism. Use -all or a controlled ~all policy."
    if all_mechanism is None:
        return "SPF has no all mechanism. Add an explicit final policy such as -all or ~all."
    if lookup_mechanisms > 10:
        return (
            "SPF appears to exceed the 10 DNS-lookup mechanism limit. Reduce "
            "include/a/mx/exists usage."
        )
    if all_mechanism == "~all":
        return (
            "SPF uses softfail. Move to -all after verifying all legitimate "
            "senders are included."
        )
    return (
        "SPF has a controlled final policy. Validate DKIM and DMARC alignment "
        "before tightening mail security."
    )
