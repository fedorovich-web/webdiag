import asyncio
from typing import cast

import httpx

from webdiag_api.audit.fetcher import SafeFetchResult
from webdiag_api.main import app
from webdiag_api.tools.network_dns import DnsAnswer, DnsResolverError
from webdiag_api.tools.network_intelligence import (
    NamedDnsResolver,
    RdapClient,
    RdapDocument,
    RdapLookupError,
    get_dns_comparison_resolvers,
    get_rdap_client,
)


async def post(path: str, payload: dict[str, object]) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.post(path, json=payload)


class FakeDnsResolver:
    def __init__(self, answers: tuple[DnsAnswer, ...] = (), error: str | None = None) -> None:
        self.answers = answers
        self.error = error

    def query(self, domain: str, record_type: str) -> tuple[DnsAnswer, ...]:
        assert domain == "example.com"
        assert record_type == "A"
        if self.error:
            raise DnsResolverError(self.error)
        return self.answers


def named_resolver(
    resolver_id: str,
    answers: tuple[DnsAnswer, ...] = (),
    error: str | None = None,
) -> NamedDnsResolver:
    return NamedDnsResolver(
        resolver_id=resolver_id,
        resolver_name=resolver_id.title(),
        nameserver="192.0.2.1",
        resolver=cast(object, FakeDnsResolver(answers, error)),
    )


class FakeRdapClient:
    def __init__(
        self,
        *,
        domain: RdapDocument | None = None,
        ip: RdapDocument | None = None,
        error: RdapLookupError | None = None,
    ) -> None:
        self.domain = domain
        self.ip = ip
        self.error = error

    def lookup_domain(self, domain: str) -> RdapDocument:
        assert domain == "example.com"
        if self.error:
            raise self.error
        assert self.domain is not None
        return self.domain

    def lookup_ip(self, ip: str) -> RdapDocument:
        assert ip == "8.8.8.8"
        if self.error:
            raise self.error
        assert self.ip is not None
        return self.ip


class SequenceFetcher:
    def __init__(self, responses: dict[str, SafeFetchResult]) -> None:
        self.responses = responses
        self.calls: list[str] = []

    def fetch(
        self,
        url: str,
        *,
        read_body: bool = True,
        extra_headers: dict[str, str] | None = None,
    ) -> SafeFetchResult:
        assert read_body is True
        assert extra_headers and "application/rdap+json" in extra_headers["accept"]
        self.calls.append(url)
        return self.responses[url]


def safe_result(url: str, body: str, status_code: int = 200) -> SafeFetchResult:
    return SafeFetchResult(
        requested_url=url,
        final_url=url,
        status_code=status_code,
        headers={"content-type": "application/rdap+json"},
        body_text=body,
        content_type="application/rdap+json",
        redirect_chain=(),
    )


def clear_overrides() -> None:
    app.dependency_overrides.clear()


def test_dns_resolver_comparison_reports_consistent_answer_sets() -> None:
    answers = (DnsAnswer("A", "example.com", "93.184.216.34", 300),)
    app.dependency_overrides[get_dns_comparison_resolvers] = lambda: (
        named_resolver("one", answers),
        named_resolver("two", answers),
    )
    try:
        response = asyncio.run(
            post("/v1/tools/dns-resolver-comparison", {"domain": "example.com", "record_type": "A"})
        )
    finally:
        clear_overrides()
    payload = response.json()
    assert response.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.dns_resolver_comparison.v1"
    assert payload["successful_resolver_count"] == 2
    assert payload["distinct_answer_set_count"] == 1
    assert payload["consistent"] is True
    assert payload["status"] == "pass"
    assert payload["timing_scope"] == "backend_to_resolver"


def test_dns_resolver_comparison_flags_disagreement_and_partial_errors() -> None:
    first = (DnsAnswer("A", "example.com", "93.184.216.34", 300),)
    second = (DnsAnswer("A", "example.com", "203.0.113.20", 60),)
    app.dependency_overrides[get_dns_comparison_resolvers] = lambda: (
        named_resolver("one", first),
        named_resolver("two", second),
        named_resolver("three", error="DNS query failed or timed out."),
    )
    try:
        response = asyncio.run(
            post("/v1/tools/dns-resolver-comparison", {"domain": "example.com", "record_type": "A"})
        )
    finally:
        clear_overrides()
    payload = response.json()
    assert response.status_code == 200
    assert payload["successful_resolver_count"] == 2
    assert payload["distinct_answer_set_count"] == 2
    assert payload["consistent"] is False
    assert payload["status"] == "warning"
    assert payload["snapshots"][2]["status"] == "error"


def test_domain_rdap_returns_bounded_registration_fields() -> None:
    document = RdapDocument(
        found=True,
        final_url="https://rdap.example/domain/example.com",
        payload={
            "objectClassName": "domain",
            "handle": "EXAMPLE-COM",
            "ldhName": "example.com",
            "status": ["active"],
            "events": [
                {"eventAction": "registration", "eventDate": "1995-08-14T00:00:00Z"},
                {"eventAction": "expiration", "eventDate": "2030-08-13T00:00:00Z"},
            ],
            "nameservers": [{"ldhName": "a.iana-servers.net", "status": ["active"]}],
            "secureDNS": {"delegationSigned": True},
            "entities": [
                {
                    "roles": ["registrar"],
                    "vcardArray": ["vcard", [["fn", {}, "text", "Example Registrar"]]],
                    "entities": [
                        {
                            "roles": ["abuse"],
                            "vcardArray": [
                                "vcard",
                                [["email", {}, "text", "abuse@example.test"]],
                            ],
                        }
                    ],
                },
            ],
            "notices": [{"title": "Terms of Use"}],
        },
    )
    app.dependency_overrides[get_rdap_client] = lambda: FakeRdapClient(domain=document)
    try:
        response = asyncio.run(post("/v1/tools/domain-rdap", {"domain": "example.com"}))
    finally:
        clear_overrides()
    payload = response.json()
    assert response.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.domain_rdap_lookup.v1"
    assert payload["found"] is True
    assert payload["registrar_name"] == "Example Registrar"
    assert payload["abuse_email"] == "abuse@example.test"
    assert payload["delegation_signed"] is True
    assert payload["events"][0]["action"] == "registration"
    assert payload["nameservers"][0]["ldh_name"] == "a.iana-servers.net"


def test_domain_rdap_404_does_not_claim_availability() -> None:
    document = RdapDocument(
        found=False,
        final_url="https://rdap.example/domain/example.com",
        payload=None,
    )
    app.dependency_overrides[get_rdap_client] = lambda: FakeRdapClient(domain=document)
    try:
        response = asyncio.run(post("/v1/tools/domain-rdap", {"domain": "example.com"}))
    finally:
        clear_overrides()
    payload = response.json()
    assert response.status_code == 200
    assert payload["found"] is False
    assert payload["status"] == "warning"
    assert "does not prove" in payload["recommendation"]


def test_ip_rdap_marks_country_as_registration_data_not_geolocation() -> None:
    document = RdapDocument(
        found=True,
        final_url="https://rdap.example/ip/8.8.8.8",
        payload={
            "objectClassName": "ip network",
            "handle": "NET-8-8-8-0-1",
            "startAddress": "8.8.8.0",
            "endAddress": "8.8.8.255",
            "ipVersion": "v4",
            "name": "EXAMPLE-NET",
            "type": "DIRECT ALLOCATION",
            "country": "US",
            "status": ["active"],
            "cidr0_cidrs": [{"v4prefix": "8.8.8.0", "length": 24}],
            "entities": [
                {
                    "roles": ["abuse"],
                    "vcardArray": ["vcard", [["email", {}, "text", "abuse@example.test"]]],
                }
            ],
        },
    )
    app.dependency_overrides[get_rdap_client] = lambda: FakeRdapClient(ip=document)
    try:
        response = asyncio.run(post("/v1/tools/ip-rdap", {"ip": "8.8.8.8"}))
    finally:
        clear_overrides()
    payload = response.json()
    assert response.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.ip_rdap_lookup.v1"
    assert payload["country_semantics"] == "registration_data_not_geolocation"
    assert payload["cidrs"] == [{"version": "v4", "prefix": "8.8.8.0", "length": 24}]
    assert "not device location" in payload["recommendation"]


def test_ip_rdap_rejects_private_addresses() -> None:
    response = asyncio.run(post("/v1/tools/ip-rdap", {"ip": "127.0.0.1"}))
    assert response.status_code == 422
    response = asyncio.run(post("/v1/tools/ip-rdap", {"ip": "10.0.0.1"}))
    assert response.status_code == 422


def test_rdap_errors_are_normalized() -> None:
    app.dependency_overrides[get_rdap_client] = lambda: FakeRdapClient(
        error=RdapLookupError("rdap_fetch_failed", "RDAP HTTP request failed safely.")
    )
    try:
        response = asyncio.run(post("/v1/tools/domain-rdap", {"domain": "example.com"}))
    finally:
        clear_overrides()
    assert response.status_code == 502
    assert response.json()["detail"]["code"] == "rdap_fetch_failed"


def test_rdap_client_uses_iana_domain_bootstrap_service() -> None:
    bootstrap_url = "https://data.iana.org/rdap/dns.json"
    service_url = "https://rdap.example/domain/example.com"
    fetcher = SequenceFetcher(
        {
            bootstrap_url: safe_result(
                bootstrap_url,
                '{"services":[[["com"],["https://rdap.example/"]]]}',
            ),
            service_url: safe_result(service_url, '{"objectClassName":"domain"}'),
        }
    )
    client = RdapClient(fetcher=cast(object, fetcher))
    document = client.lookup_domain("example.com")
    assert document.found is True
    assert fetcher.calls == [bootstrap_url, service_url]


def test_rdap_client_uses_most_specific_ip_bootstrap_prefix() -> None:
    bootstrap_url = "https://data.iana.org/rdap/ipv4.json"
    service_url = "https://specific.example/ip/8.8.8.8"
    fetcher = SequenceFetcher(
        {
            bootstrap_url: safe_result(
                bootstrap_url,
                """{"services":[
                    [["8.0.0.0/8"],["https://broad.example/"]],
                    [["8.8.8.0/24"],["https://specific.example/"]]
                ]}""",
            ),
            service_url: safe_result(service_url, '{"objectClassName":"ip network"}'),
        }
    )
    client = RdapClient(fetcher=cast(object, fetcher))
    document = client.lookup_ip("8.8.8.8")
    assert document.found is True
    assert fetcher.calls == [bootstrap_url, service_url]
