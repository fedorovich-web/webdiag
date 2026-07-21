import { describe, expect, it } from "vitest";
import {
  cspAnalyzerResultText,
  resourceHintsResultText,
  thirdPartyScriptResultText,
} from "./client-delivery-tools";
import type {
  CspAnalyzerResponse,
  ResourceHintsAnalyzerResponse,
  ThirdPartyScriptAnalyzerResponse,
} from "./client-delivery-tool-contract";

const common = {
  generated_at: "2026-07-22T00:00:00Z",
  requested_url: "https://example.com/",
  final_url: "https://example.com/",
  status_code: 200,
  content_type: "text/html",
  redirect_count: 0,
  truncated: false,
  status: "warning" as const,
  recommendation: "Review.",
};

const csp: CspAnalyzerResponse = {
  ...common,
  contract_version: "webdiag.tool.csp_analyzer.v1",
  enforced_policy_count: 1,
  report_only_policy_count: 1,
  meta_policy_count: 0,
  directive_count: 5,
  finding_count: 1,
  high_risk_finding_count: 1,
  policies: [],
  findings: [{
    id: "unsafe-eval",
    title: "'unsafe-eval' is allowed",
    severity: "high",
    source: "header",
    directive: "script-src",
    value: "'unsafe-eval'",
    recommendation: "Remove it.",
  }],
};

const scripts: ThirdPartyScriptAnalyzerResponse = {
  ...common,
  contract_version: "webdiag.tool.third_party_script_analyzer.v1",
  scan_mode: "static_html_bounded",
  classification_basis: "hostname",
  script_count: 4,
  inline_script_count: 1,
  external_script_count: 3,
  same_host_script_count: 1,
  cross_host_script_count: 2,
  parser_blocking_candidate_count: 1,
  async_count: 1,
  defer_count: 1,
  module_count: 0,
  nomodule_count: 0,
  integrity_count: 0,
  crossorigin_count: 0,
  duplicate_src_count: 1,
  issue_count: 0,
  scripts: [],
  host_groups: [{ hostname: "cdn.example.net", count: 2, classification: "cdn-pattern" }],
};

const hints: ResourceHintsAnalyzerResponse = {
  ...common,
  contract_version: "webdiag.tool.resource_hints_analyzer.v1",
  scan_mode: "static_html_bounded",
  hint_count: 3,
  preconnect_count: 1,
  dns_prefetch_count: 0,
  preload_count: 2,
  prefetch_count: 0,
  modulepreload_count: 0,
  preinit_count: 0,
  cross_host_hint_count: 1,
  duplicate_hint_count: 1,
  finding_count: 1,
  hints: [],
  findings: [{
    id: "duplicate-hints",
    title: "Duplicate resource hints were found",
    severity: "medium",
    rel: null,
    value: "1",
    recommendation: "Remove duplicates.",
  }],
};

describe("client delivery result text", () => {
  it("formats CSP findings without a fake score", () => {
    expect(cspAnalyzerResultText(csp)).toContain("High-risk findings: 1");
    expect(cspAnalyzerResultText(csp)).toContain("unsafe-eval");
  });

  it("formats hostname-based script inventory", () => {
    expect(thirdPartyScriptResultText(scripts)).toContain("Classification basis: hostname");
    expect(thirdPartyScriptResultText(scripts)).toContain("cdn.example.net: 2");
  });

  it("formats resource-hint counts and findings", () => {
    expect(resourceHintsResultText(hints)).toContain("Preload: 2");
    expect(resourceHintsResultText(hints)).toContain("Duplicate resource hints");
  });
});
