import { describe, expect, it } from "vitest";
import {
  dnsLookupResultText,
  mxCheckerResultText,
  spfCheckerResultText,
} from "./network-dns-tools";

describe("network DNS presenters", () => {
  it("formats DNS, MX, and SPF summaries", () => {
    expect(dnsLookupResultText({
      contract_version: "webdiag.tool.dns_lookup.v1",
      generated_at: "2026",
      domain: "example.com",
      checked_record_types: ["A", "MX"],
      record_count: 2,
      records: [],
      errors: [],
      recommendation: "OK",
    })).toContain("Records: 2");

    expect(mxCheckerResultText({
      contract_version: "webdiag.tool.mx_record_checker.v1",
      generated_at: "2026",
      domain: "example.com",
      mx_count: 1,
      has_null_mx: false,
      hosts: [],
      status: "pass",
      recommendation: "OK",
    })).toContain("MX records: 1");

    expect(spfCheckerResultText({
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
    })).toContain("all: -all");
  });
});
