import { describe, expect, it } from "vitest";
import {
  isDkimCheckerResponse,
  isDmarcCheckerResponse,
  isDnsLookupResponse,
  isDnssecCheckerResponse,
  isMxCheckerResponse,
  isSpfCheckerResponse,
  parseDkimSelectorInput,
  parseDomainInput,
} from "./network-dns-tool-contract";

describe("network DNS tool contracts", () => {
  it("validates DNS lookup, MX, SPF, DKIM, DMARC, and DNSSEC responses", () => {
    expect(isDnsLookupResponse({
      contract_version: "webdiag.tool.dns_lookup.v1",
      generated_at: "2026",
      domain: "example.com",
      checked_record_types: ["A"],
      record_count: 1,
      records: [],
      errors: [],
      recommendation: "OK",
    })).toBe(true);

    expect(isMxCheckerResponse({
      contract_version: "webdiag.tool.mx_record_checker.v1",
      generated_at: "2026",
      domain: "example.com",
      mx_count: 1,
      has_null_mx: false,
      hosts: [],
      status: "pass",
      recommendation: "OK",
    })).toBe(true);

    expect(isSpfCheckerResponse({
      contract_version: "webdiag.tool.spf_checker.v1",
      generated_at: "2026",
      domain: "example.com",
      spf_record_count: 1,
      spf_record: "v=spf1 -all",
      mechanisms: [],
      has_all_mechanism: true,
      all_mechanism: "-all",
      uses_include: false,
      uses_redirect: false,
      estimated_dns_lookup_mechanisms: 0,
      status: "pass",
      recommendation: "OK",
    })).toBe(true);

    expect(isDkimCheckerResponse({
      contract_version: "webdiag.tool.dkim_checker.v1",
      generated_at: "2026",
      domain: "example.com",
      selector: "default",
      record_name: "default._domainkey.example.com",
      dkim_record_count: 1,
      dkim_record: "v=DKIM1; k=rsa; p=abc",
      tags: [],
      key_type: "rsa",
      has_public_key: true,
      public_key_length: 120,
      status: "pass",
      recommendation: "OK",
    })).toBe(true);

    expect(isDmarcCheckerResponse({
      contract_version: "webdiag.tool.dmarc_checker.v1",
      generated_at: "2026",
      domain: "example.com",
      record_name: "_dmarc.example.com",
      dmarc_record_count: 1,
      dmarc_record: "v=DMARC1; p=reject",
      tags: [],
      policy: "reject",
      subdomain_policy: null,
      percentage: 100,
      has_rua: true,
      has_ruf: false,
      alignment_dkim: null,
      alignment_spf: null,
      status: "pass",
      recommendation: "OK",
    })).toBe(true);

    expect(isDnssecCheckerResponse({
      contract_version: "webdiag.tool.dnssec_checker.v1",
      generated_at: "2026",
      domain: "example.com",
      ds_record_count: 1,
      dnskey_record_count: 1,
      ds_records: [],
      dnskey_records: [],
      delegation_signed: true,
      zone_dnskey_present: true,
      algorithms: ["13"],
      status: "pass",
      recommendation: "OK",
    })).toBe(true);
  });

  it("parses only domain-like user input", () => {
    expect(parseDomainInput("Example.COM.")).toBe("example.com");
    expect(parseDomainInput("https://example.com/")).toBeNull();
    expect(parseDomainInput("example")).toBeNull();
    expect(parseDkimSelectorInput("Default.")).toBe("default");
    expect(parseDkimSelectorInput("bad/selector")).toBeNull();
  });
});
