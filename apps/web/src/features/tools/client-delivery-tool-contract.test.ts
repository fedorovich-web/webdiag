import { describe, expect, it } from "vitest";
import {
  isCspAnalyzerResponse,
  isResourceHintsAnalyzerResponse,
  isThirdPartyScriptAnalyzerResponse,
  parsePageUrlInput,
} from "./client-delivery-tool-contract";

const base = {
  generated_at: "2026-07-22T00:00:00Z",
  requested_url: "https://example.com/",
  final_url: "https://example.com/",
  status_code: 200,
  content_type: "text/html",
  redirect_count: 0,
  truncated: false,
  status: "warning" as const,
  recommendation: "Review the result.",
};

describe("client delivery tool contracts", () => {
  it("accepts a valid CSP analyzer response", () => {
    expect(isCspAnalyzerResponse({
      ...base,
      contract_version: "webdiag.tool.csp_analyzer.v1",
      enforced_policy_count: 1,
      report_only_policy_count: 0,
      meta_policy_count: 0,
      directive_count: 2,
      finding_count: 1,
      high_risk_finding_count: 1,
      policies: [{
        source: "header",
        raw: "default-src 'self'; script-src *",
        directive_count: 2,
        duplicate_directive_count: 0,
        directives: [
          { name: "default-src", values: ["'self'"] },
          { name: "script-src", values: ["*"] },
        ],
      }],
      findings: [{
        id: "wildcard-source-1-script-src",
        title: "A wildcard CSP source is allowed",
        severity: "high",
        source: "header",
        directive: "script-src",
        value: "*",
        recommendation: "Restrict the source list.",
      }],
    })).toBe(true);
  });

  it("accepts valid script and resource-hint responses", () => {
    expect(isThirdPartyScriptAnalyzerResponse({
      ...base,
      contract_version: "webdiag.tool.third_party_script_analyzer.v1",
      scan_mode: "static_html_bounded",
      classification_basis: "hostname",
      script_count: 1,
      inline_script_count: 0,
      external_script_count: 1,
      same_host_script_count: 0,
      cross_host_script_count: 1,
      parser_blocking_candidate_count: 0,
      async_count: 1,
      defer_count: 0,
      module_count: 0,
      nomodule_count: 0,
      integrity_count: 0,
      crossorigin_count: 0,
      duplicate_src_count: 0,
      issue_count: 0,
      scripts: [{
        position: 1,
        source_kind: "external",
        raw_src: "https://cdn.example.net/app.js",
        resolved_url: "https://cdn.example.net/app.js",
        hostname: "cdn.example.net",
        same_host: false,
        cross_host_candidate: true,
        host_classification: "other",
        async_attribute: true,
        defer_attribute: false,
        module: false,
        nomodule: false,
        parser_blocking_candidate: false,
        integrity_present: false,
        crossorigin_present: false,
        issues: [],
      }],
      host_groups: [{ hostname: "cdn.example.net", count: 1, classification: "other" }],
    })).toBe(true);

    expect(isResourceHintsAnalyzerResponse({
      ...base,
      contract_version: "webdiag.tool.resource_hints_analyzer.v1",
      scan_mode: "static_html_bounded",
      hint_count: 1,
      preconnect_count: 1,
      dns_prefetch_count: 0,
      preload_count: 0,
      prefetch_count: 0,
      modulepreload_count: 0,
      preinit_count: 0,
      cross_host_hint_count: 1,
      duplicate_hint_count: 0,
      finding_count: 1,
      hints: [{
        position: 1,
        rel: "preconnect",
        raw_href: "https://cdn.example.net",
        resolved_url: "https://cdn.example.net",
        hostname: "cdn.example.net",
        same_host: false,
        as_value: null,
        type_value: null,
        media: null,
        crossorigin_present: false,
        fetchpriority: null,
        issues: ["cross-host hint has no crossorigin signal"],
      }],
      findings: [{
        id: "cross-host-without-crossorigin",
        title: "Cross-host hints without a crossorigin signal were found",
        severity: "info",
        rel: null,
        value: "1",
        recommendation: "Review the fetch mode.",
      }],
    })).toBe(true);
  });

  it("rejects wrong versions, invalid counts, and malformed nested values", () => {
    expect(isCspAnalyzerResponse({ ...base, contract_version: "wrong" })).toBe(false);
    expect(isCspAnalyzerResponse({
      ...base,
      contract_version: "webdiag.tool.csp_analyzer.v1",
      enforced_policy_count: -1,
      report_only_policy_count: 0,
      meta_policy_count: 0,
      directive_count: 0,
      finding_count: 0,
      high_risk_finding_count: 0,
      policies: [],
      findings: [],
    })).toBe(false);
    expect(isThirdPartyScriptAnalyzerResponse({
      ...base,
      contract_version: "webdiag.tool.third_party_script_analyzer.v1",
      scan_mode: "static_html_bounded",
      classification_basis: "hostname",
      scripts: [{ issues: "not-an-array" }],
      host_groups: [],
    })).toBe(false);
  });

  it("normalizes public URLs and rejects credentials or unsupported schemes", () => {
    expect(parsePageUrlInput(" https://example.com/path ")).toBe("https://example.com/path");
    expect(parsePageUrlInput("https://user:pass@example.com/")).toBeNull();
    expect(parsePageUrlInput("file:///tmp/test.html")).toBeNull();
  });
});
