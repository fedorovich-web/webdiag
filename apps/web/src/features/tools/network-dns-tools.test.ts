import { describe, expect, it } from "vitest";
import {
  dkimCheckerResultText,
  dmarcCheckerResultText,
  dnsLookupResultText,
  dnssecCheckerResultText,
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

    expect(dkimCheckerResultText({
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
    })).toContain("Selector: default");

    expect(dmarcCheckerResultText({
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
    })).toContain("Policy: reject");

    expect(dnssecCheckerResultText({
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
    })).toContain("DS records: 1");
  });
});
