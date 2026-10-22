import { describe, expect, it } from "vitest";
import { canonicalResultText, canonicalStatusLabel, canonicalStatusTone, isCanonicalToolResponse, normalizeCanonicalToolUrlInput, parseCanonicalToolUrlInput } from "./canonical-checker-tool";

const result = {
  contract_version: "webdiag.tool.canonical.v1",
  generated_at: "2026-07-21T00:00:00Z",
  requested_url: "https://example.com/page",
  final_url: "https://example.com/page",
  status_code: 200,
  content_type: "text/html",
  canonical_url: "https://example.com/page",
  resolved_canonical_url: "https://example.com/page",
  canonical_present: true,
  canonical_is_absolute: true,
  canonical_matches_final_url: true,
  canonical_host_matches_final_url: true,
  has_noindex: false,
  redirect_count: 0,
  recommendation: "Canonical is present.",
} as const;

describe("canonical checker tool helpers", () => {
  it("normalizes URL input and rejects unsupported values", () => {
    expect(normalizeCanonicalToolUrlInput(" example.com/page ")).toBe("https://example.com/page");
    expect(parseCanonicalToolUrlInput("https://example.com/page")?.hostname).toBe("example.com");
    expect(parseCanonicalToolUrlInput("ftp://example.com/page")).toBeNull();
    expect(parseCanonicalToolUrlInput("localhost")).toBeNull();
  });

  it("validates the canonical tool response contract", () => {
    expect(isCanonicalToolResponse(result)).toBe(true);
    expect(isCanonicalToolResponse({ ...result, contract_version: "raw" })).toBe(false);
    expect(isCanonicalToolResponse({ ...result, canonical_matches_final_url: "yes" })).toBe(false);
  });

  it("maps canonical states to labels and tones", () => {
    expect(canonicalStatusTone(result)).toBe("success");
    expect(canonicalStatusLabel(result, "ru")).toBe("Canonical совпадает");
    expect(canonicalStatusTone({ ...result, canonical_present: false, canonical_matches_final_url: null })).toBe("warning");
    expect(canonicalStatusTone({ ...result, canonical_matches_final_url: false })).toBe("danger");
    expect(canonicalStatusTone({ ...result, has_noindex: true })).toBe("danger");
  });

  it("creates copyable text output from a result", () => {
    expect(canonicalResultText(result)).toContain("Final URL: https://example.com/page");
    expect(canonicalResultText(result)).toContain("Canonical: https://example.com/page");
    expect(canonicalResultText(result)).toContain("Matches final URL: true");
  });

  it("does not present an unsuccessful page response as a matching healthy canonical", () => {
    const unavailable = { ...result, status_code: 503 };
    expect(canonicalStatusTone(unavailable)).toBe("danger");
    expect(canonicalStatusLabel(unavailable, "ru")).toContain("503");
    expect(canonicalStatusTone({ ...result, canonical_matches_final_url: null })).toBe("warning");
    expect(canonicalStatusLabel({ ...result, canonical_matches_final_url: null }, "en")).not.toBe("Canonical matches");
  });
});
