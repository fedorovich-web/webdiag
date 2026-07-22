import { describe, expect, it } from "vitest";
import {
  dnsResolverComparisonResultText,
  domainRdapResultText,
  ipRdapResultText,
} from "./network-intelligence-tools";
import type {
  DnsResolverComparisonResponse,
  DomainRdapResponse,
  IpRdapResponse,
} from "./network-intelligence-tool-contract";

describe("network intelligence report text", () => {
  it("includes resolver comparison limitations", () => {
    const result = {
      contract_version: "webdiag.tool.dns_resolver_comparison.v1",
      generated_at: "2026",
      domain: "example.com",
      record_type: "A",
      resolver_count: 4,
      successful_resolver_count: 3,
      distinct_answer_set_count: 2,
      consistent: false,
      timing_scope: "backend_to_resolver",
      snapshots: [],
      status: "warning",
      recommendation: "Not global coverage.",
    } satisfies DnsResolverComparisonResponse;
    const text = dnsResolverComparisonResultText(result);
    expect(text).toContain("Resolvers: 3/4");
    expect(text).toContain("Timing scope: backend_to_resolver");
  });

  it("includes domain registrar and IP registration semantics", () => {
    const domain = {
      contract_version: "webdiag.tool.domain_rdap_lookup.v1",
      generated_at: "2026",
      domain: "example.com",
      found: true,
      bootstrap_source: "iana_rdap_dns_bootstrap",
      rdap_url: null,
      handle: "EXAMPLE",
      ldh_name: "example.com",
      unicode_name: null,
      statuses: ["active"],
      events: [],
      nameservers: [],
      registrar_name: "Registrar",
      abuse_email: null,
      delegation_signed: true,
      notice_titles: [],
      status: "pass",
      recommendation: "Registry data.",
    } satisfies DomainRdapResponse;
    const ip = {
      contract_version: "webdiag.tool.ip_rdap_lookup.v1",
      generated_at: "2026",
      ip: "8.8.8.8",
      found: true,
      bootstrap_source: "iana_rdap_ip_bootstrap",
      country_semantics: "registration_data_not_geolocation",
      rdap_url: null,
      handle: "NET",
      start_address: "8.8.8.0",
      end_address: "8.8.8.255",
      ip_version: "v4",
      name: "EXAMPLE-NET",
      network_type: null,
      country: "US",
      parent_handle: null,
      statuses: [],
      events: [],
      cidrs: [{ version: "v4", prefix: "8.8.8.0", length: 24 }],
      abuse_email: null,
      status: "pass",
      recommendation: "Not geolocation.",
    } satisfies IpRdapResponse;
    expect(domainRdapResultText(domain)).toContain("Registrar: Registrar");
    expect(ipRdapResultText(ip)).toContain("Country semantics: registration_data_not_geolocation");
  });
});
