import { describe, expect, it } from "vitest";
import { isRedirectMapResponse } from "./url-management-tool-contract";

const valid = {
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
    source_url: "https://example.com/old",
    target_url: "https://example.com/new",
    expected_status_code: 301,
    normalized_source_url: "https://example.com/old",
    normalized_target_url: "https://example.com/new",
    fetch_state: "ok",
    observed_first_status_code: 301,
    observed_first_target_url: "https://example.com/new",
    final_url: "https://example.com/new",
    redirect_count: 1,
    target_matches: true,
    status_matches: true,
    issues: [],
    status: "pass",
  }],
  findings: [],
  status: "pass",
  recommendation: "Keep the map under version control.",
};

describe("redirect map response contract", () => {
  it("accepts a valid bounded redirect map response", () => {
    expect(isRedirectMapResponse(valid)).toBe(true);
  });

  it("rejects invalid nested counters and statuses", () => {
    expect(isRedirectMapResponse({ ...valid, entry_count: -1 })).toBe(false);
    expect(isRedirectMapResponse({
      ...valid,
      entries: [{ ...valid.entries[0], observed_first_status_code: 999 }],
    })).toBe(false);
  });
});
