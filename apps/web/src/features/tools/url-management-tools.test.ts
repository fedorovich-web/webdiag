import { describe, expect, it } from "vitest";
import {
  parseRedirectMapText,
  queryParameterResultText,
  redirectMapResultText,
  urlNormalizationResultText,
} from "./url-management-tools";
import { analyzeQueryParameters, analyzeUrlNormalization } from "./url-management-local";
import type { RedirectMapResponse } from "./url-management-tool-contract";

describe("URL management tools", () => {
  it("parses CSV, TSV, headers, quotes, and optional statuses", () => {
    expect(parseRedirectMapText(
      "source,target,status\nhttps://example.com/a,https://example.com/b,301",
    )).toEqual([{
      source_url: "https://example.com/a",
      target_url: "https://example.com/b",
      expected_status_code: 301,
    }]);
    expect(parseRedirectMapText(
      '"https://example.com/a,b"\t"https://example.com/c"\t308',
    )[0]?.expected_status_code).toBe(308);
  });

  it("rejects malformed or oversized map input", () => {
    expect(() => parseRedirectMapText("https://example.com/a")).toThrow();
    expect(() => parseRedirectMapText(
      "https://example.com/a,https://example.com/b,304",
    )).toThrow();
  });

  it("builds copyable local and redirect reports", () => {
    expect(urlNormalizationResultText(
      analyzeUrlNormalization("https://example.com/a/../b"),
    )).toContain("Normalized URL: https://example.com/b");
    expect(queryParameterResultText(
      analyzeQueryParameters("https://example.com/?utm_source=x&page=2"),
    )).toContain("Tracking: 1");

    const mapResult = {
      contract_version: "webdiag.tool.redirect_map_validator.v1",
      generated_at: "2026-07-22T00:00:00Z",
      scan_mode: "explicit_map_bounded_safe_fetch",
      entry_count: 1,
      checked_count: 1,
      matched_count: 1,
      mismatch_count: 0,
      failed_count: 0,
      duplicate_source_count: 0,
      conflicting_source_count: 0,
      self_redirect_count: 0,
      chain_source_count: 0,
      cycle_count: 0,
      issue_count: 0,
      entries: [{
        position: 1,
        source_url: "https://example.com/a",
        target_url: "https://example.com/b",
        expected_status_code: 301,
        normalized_source_url: "https://example.com/a",
        normalized_target_url: "https://example.com/b",
        fetch_state: "ok",
        observed_first_status_code: 301,
        observed_first_target_url: "https://example.com/b",
        final_url: "https://example.com/b",
        redirect_count: 1,
        target_matches: true,
        status_matches: true,
        issues: [],
        status: "pass",
      }],
      findings: [],
      status: "pass",
      recommendation: "OK",
    } satisfies RedirectMapResponse;
    expect(redirectMapResultText(mapResult)).toContain("Checked / matched: 1 / 1");
  });
});
