import asyncio

import httpx

from webdiag_api.main import app
from webdiag_api.tools.network_dns import DnsAnswer, DnsResolverError, get_network_dns_resolver


async def post(path: str, payload: dict[str, object]) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.post(path, json=payload)


class FakeResolver:
    def query(self, domain: str, record_type: str) -> tuple[DnsAnswer, ...]:
        key = (domain, record_type)
        records: dict[tuple[str, str], tuple[DnsAnswer, ...]] = {
            ("example.com", "A"): (
                DnsAnswer("A", "example.com", "93.184.216.34", 300),
            ),
            ("example.com", "AAAA"): (),
            ("example.com", "MX"): (
                DnsAnswer("MX", "example.com", "mail.example.com", 300, 10),
            ),
            ("example.com", "TXT"): (
                DnsAnswer(
                    "TXT",
                    "example.com",
                    "v=spf1 include:_spf.example.net -all",
                    300,
                ),
            ),
            ("example.com", "NS"): (
                DnsAnswer("NS", "example.com", "ns1.example.com", 300),
            ),
            ("example.com", "CNAME"): (),
            ("mail.example.com", "A"): (
                DnsAnswer("A", "mail.example.com", "198.51.100.10", 300),
            ),
            ("mail.example.com", "AAAA"): (),
            ("bad.example", "MX"): (),
            ("bad.example", "TXT"): (
                DnsAnswer("TXT", "bad.example", "v=spf1 +all", 300),
                DnsAnswer("TXT", "bad.example", "v=spf1 include:x.example ~all", 300),
            ),
            ("default._domainkey.example.com", "TXT"): (
                DnsAnswer(
                    "TXT",
                    "default._domainkey.example.com",
                    "v=DKIM1; k=rsa; p=" + "A" * 120,
                    300,
                ),
            ),
            ("_dmarc.example.com", "TXT"): (
                DnsAnswer(
                    "TXT",
                    "_dmarc.example.com",
                    "v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@example.com",
                    300,
                ),
            ),
            ("_dmarc.bad.example", "TXT"): (
                DnsAnswer("TXT", "_dmarc.bad.example", "v=DMARC1; p=none", 300),
            ),
            ("example.com", "DS"): (
                DnsAnswer("DS", "example.com", "12345 13 2 ABCDEF", 300),
            ),
            ("example.com", "DNSKEY"): (
                DnsAnswer(
                    "DNSKEY",
                    "example.com",
                    "flags=257 protocol=3 algorithm=13 key_bytes=64",
                    300,
                ),
            ),
            ("bad.example", "DS"): (),
            ("bad.example", "DNSKEY"): (),
        }
        if key == ("timeout.example", "A"):
            raise DnsResolverError("DNS query failed or timed out.")
        return records.get(key, ())


def clear_overrides() -> None:
    app.dependency_overrides.clear()


def test_dns_lookup_returns_selected_records_and_errors() -> None:
    app.dependency_overrides[get_network_dns_resolver] = lambda: FakeResolver()
    try:
        response = asyncio.run(
            post(
                "/v1/tools/dns-lookup",
                {"domain": "example.com", "record_types": ["A", "MX", "TXT"]},
            )
        )
    finally:
        clear_overrides()
    payload = response.json()
    assert response.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.dns_lookup.v1"
    assert payload["record_count"] == 3
    assert {record["record_type"] for record in payload["records"]} == {"A", "MX", "TXT"}
    assert payload["errors"] == []


def test_dns_lookup_reports_query_error_without_failing_whole_batch() -> None:
    app.dependency_overrides[get_network_dns_resolver] = lambda: FakeResolver()
    try:
        response = asyncio.run(
            post("/v1/tools/dns-lookup", {"domain": "timeout.example", "record_types": ["A"]})
        )
    finally:
        clear_overrides()
    payload = response.json()
    assert response.status_code == 200
    assert payload["record_count"] == 0
    assert payload["errors"][0]["code"] == "dns_query_failed"


def test_mx_checker_validates_hosts_have_address_records() -> None:
    app.dependency_overrides[get_network_dns_resolver] = lambda: FakeResolver()
    try:
        response = asyncio.run(post("/v1/tools/mx-records", {"domain": "example.com"}))
    finally:
        clear_overrides()
    payload = response.json()
    assert response.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.mx_record_checker.v1"
    assert payload["mx_count"] == 1
    assert payload["hosts"][0]["host"] == "mail.example.com"
    assert payload["hosts"][0]["address_count"] == 1
    assert payload["status"] == "pass"


def test_mx_checker_flags_missing_mx_records() -> None:
    app.dependency_overrides[get_network_dns_resolver] = lambda: FakeResolver()
    try:
        response = asyncio.run(post("/v1/tools/mx-records", {"domain": "bad.example"}))
    finally:
        clear_overrides()
    payload = response.json()
    assert response.status_code == 200
    assert payload["mx_count"] == 0
    assert payload["status"] == "fail"


def test_spf_checker_extracts_mechanisms_and_policy() -> None:
    app.dependency_overrides[get_network_dns_resolver] = lambda: FakeResolver()
    try:
        response = asyncio.run(post("/v1/tools/spf", {"domain": "example.com"}))
    finally:
        clear_overrides()
    payload = response.json()
    assert response.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.spf_checker.v1"
    assert payload["spf_record_count"] == 1
    assert payload["uses_include"] is True
    assert payload["all_mechanism"] == "-all"
    assert payload["status"] == "pass"


def test_spf_checker_flags_multiple_records() -> None:
    app.dependency_overrides[get_network_dns_resolver] = lambda: FakeResolver()
    try:
        response = asyncio.run(post("/v1/tools/spf", {"domain": "bad.example"}))
    finally:
        clear_overrides()
    payload = response.json()
    assert response.status_code == 200
    assert payload["spf_record_count"] == 2
    assert payload["spf_record"] is None
    assert payload["status"] == "fail"


def test_dns_tools_reject_urls_and_ip_literals() -> None:
    response = asyncio.run(post("/v1/tools/spf", {"domain": "https://example.com/"}))
    assert response.status_code == 422
    response = asyncio.run(post("/v1/tools/mx-records", {"domain": "127.0.0.1"}))
    assert response.status_code == 422


def test_dkim_checker_validates_selector_record() -> None:
    app.dependency_overrides[get_network_dns_resolver] = lambda: FakeResolver()
    try:
        response = asyncio.run(
            post("/v1/tools/dkim", {"domain": "example.com", "selector": "default"})
        )
    finally:
        clear_overrides()
    payload = response.json()
    assert response.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.dkim_checker.v1"
    assert payload["record_name"] == "default._domainkey.example.com"
    assert payload["dkim_record_count"] == 1
    assert payload["key_type"] == "rsa"
    assert payload["has_public_key"] is True
    assert payload["status"] == "pass"


def test_dkim_checker_rejects_invalid_selector() -> None:
    response = asyncio.run(
        post("/v1/tools/dkim", {"domain": "example.com", "selector": "bad/selector"})
    )
    assert response.status_code == 422


def test_dmarc_checker_extracts_policy_and_reporting() -> None:
    app.dependency_overrides[get_network_dns_resolver] = lambda: FakeResolver()
    try:
        response = asyncio.run(post("/v1/tools/dmarc", {"domain": "example.com"}))
    finally:
        clear_overrides()
    payload = response.json()
    assert response.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.dmarc_checker.v1"
    assert payload["policy"] == "quarantine"
    assert payload["percentage"] == 100
    assert payload["has_rua"] is True
    assert payload["status"] == "pass"


def test_dmarc_checker_flags_monitoring_only_policy() -> None:
    app.dependency_overrides[get_network_dns_resolver] = lambda: FakeResolver()
    try:
        response = asyncio.run(post("/v1/tools/dmarc", {"domain": "bad.example"}))
    finally:
        clear_overrides()
    payload = response.json()
    assert response.status_code == 200
    assert payload["policy"] == "none"
    assert payload["status"] == "warning"


def test_dnssec_checker_reports_ds_and_dnskey_publication() -> None:
    app.dependency_overrides[get_network_dns_resolver] = lambda: FakeResolver()
    try:
        response = asyncio.run(post("/v1/tools/dnssec", {"domain": "example.com"}))
    finally:
        clear_overrides()
    payload = response.json()
    assert response.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.dnssec_checker.v1"
    assert payload["ds_record_count"] == 1
    assert payload["dnskey_record_count"] == 1
    assert payload["delegation_signed"] is True
    assert payload["zone_dnskey_present"] is True
    assert payload["status"] == "pass"


def test_dnssec_checker_flags_missing_records() -> None:
    app.dependency_overrides[get_network_dns_resolver] = lambda: FakeResolver()
    try:
        response = asyncio.run(post("/v1/tools/dnssec", {"domain": "bad.example"}))
    finally:
        clear_overrides()
    payload = response.json()
    assert response.status_code == 200
    assert payload["ds_record_count"] == 0
    assert payload["dnskey_record_count"] == 0
    assert payload["status"] == "fail"
