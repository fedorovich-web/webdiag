import { describe, expect, it } from "vitest";
import {
  isDnsResolverComparisonResponse,
  isDomainRdapResponse,
  isIpRdapResponse,
  parseDomainInput,
  parsePublicIpInput,
} from "./network-intelligence-tool-contract";

const dnsResult = {
  contract_version: "webdiag.tool.dns_resolver_comparison.v1",
  generated_at: "2026-07-22T00:00:00Z",
  domain: "example.com",
  record_type: "A",
  resolver_count: 4,
  successful_resolver_count: 4,
  distinct_answer_set_count: 1,
  consistent: true,
  timing_scope: "backend_to_resolver",
  snapshots: [{
    resolver_id: "cloudflare",
    resolver_name: "Cloudflare",
    nameserver: "1.1.1.1",
    status: "ok",
    elapsed_ms: 12,
    answer_count: 1,
    answers: [{ value: "93.184.216.34", ttl: 300, priority: null }],
    error: null,
  }],
  status: "pass",
  recommendation: "Review the snapshot.",
} as const;

const domainResult = {
  contract_version: "webdiag.tool.domain_rdap_lookup.v1",
  generated_at: "2026-07-22T00:00:00Z",
  domain: "example.com",
  found: true,
  bootstrap_source: "iana_rdap_dns_bootstrap",
  rdap_url: "https://rdap.example/domain/example.com",
  handle: "EXAMPLE",
  ldh_name: "example.com",
  unicode_name: null,
  statuses: ["active"],
  events: [{ action: "registration", raw_action: "registration", date: "1995" }],
  nameservers: [{ ldh_name: "ns.example", unicode_name: null, statuses: [] }],
  registrar_name: "Registrar",
  abuse_email: "abuse@example.test",
  delegation_signed: true,
  notice_titles: ["Terms"],
  status: "pass",
  recommendation: "Registry data.",
} as const;

const ipResult = {
  contract_version: "webdiag.tool.ip_rdap_lookup.v1",
  generated_at: "2026-07-22T00:00:00Z",
  ip: "8.8.8.8",
  found: true,
  bootstrap_source: "iana_rdap_ip_bootstrap",
  country_semantics: "registration_data_not_geolocation",
  rdap_url: "https://rdap.example/ip/8.8.8.8",
  handle: "NET",
  start_address: "8.8.8.0",
  end_address: "8.8.8.255",
  ip_version: "v4",
  name: "EXAMPLE-NET",
  network_type: "DIRECT ALLOCATION",
  country: "US",
  parent_handle: null,
  statuses: ["active"],
  events: [],
  cidrs: [{ version: "v4", prefix: "8.8.8.0", length: 24 }],
  abuse_email: null,
  status: "pass",
  recommendation: "Registration data, not geolocation.",
} as const;

describe("network intelligence contracts", () => {
  it("accepts valid response contracts", () => {
    expect(isDnsResolverComparisonResponse(dnsResult)).toBe(true);
    expect(isDomainRdapResponse(domainResult)).toBe(true);
    expect(isIpRdapResponse(ipResult)).toBe(true);
  });

  it("rejects malformed nested counters and semantics", () => {
    expect(isDnsResolverComparisonResponse({ ...dnsResult, resolver_count: -1 })).toBe(false);
    expect(isDomainRdapResponse({ ...domainResult, events: [{ action: "wrong", raw_action: "x", date: "y" }] })).toBe(false);
    expect(isIpRdapResponse({ ...ipResult, country_semantics: "geolocation" })).toBe(false);
  });

  it("normalizes domains and accepts IPv4/IPv6 syntax", () => {
    expect(parseDomainInput(" Example.COM. ")).toBe("example.com");
    expect(parseDomainInput("https://example.com")).toBeNull();
    expect(parsePublicIpInput("8.8.8.8")).toBe("8.8.8.8");
    expect(parsePublicIpInput("2001:4860:4860::8888")).toBe("2001:4860:4860::8888");
    expect(parsePublicIpInput("999.1.1.1")).toBeNull();
  });
});
