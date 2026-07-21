import { describe, expect, it } from "vitest";
import {
  isDnsLookupResponse,
  isMxCheckerResponse,
  isSpfCheckerResponse,
  parseDomainInput,
} from "./network-dns-tool-contract";

describe("network DNS tool contracts", () => {
  it("validates DNS lookup, MX, and SPF responses", () => {
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
  });

  it("parses only domain-like user input", () => {
    expect(parseDomainInput("Example.COM.")).toBe("example.com");
    expect(parseDomainInput("https://example.com/")).toBeNull();
    expect(parseDomainInput("example")).toBeNull();
  });
});
