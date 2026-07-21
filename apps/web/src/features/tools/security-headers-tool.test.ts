import { describe, expect, it } from "vitest";
import { isSecurityHeadersResponse, normalizeSecurityHeadersUrlInput, parseSecurityHeadersUrlInput, securityHeaderStatusLabel, securityHeadersResultText, securityHeadersRiskLabel } from "./security-headers-tool";

const result = {
  contract_version: "webdiag.tool.security_headers.v1",
  generated_at: "2026-07-21T00:00:00Z",
  requested_url: "https://example.com/",
  final_url: "https://example.com/",
  status_code: 200,
  is_https: true,
  redirect_count: 0,
  score: 100,
  risk_level: "low",
  present_count: 6,
  missing_count: 0,
  checks: [
    {
      id: "hsts",
      header: "Strict-Transport-Security",
      title: "HTTPS transport policy",
      value: "max-age=31536000",
      present: true,
      status: "pass",
      severity: "info",
      recommendation: "HSTS is present.",
    },
  ],
  recommendation: "Security headers are present.",
} as const;

describe("security headers tool helpers", () => {
  it("normalizes URL input and rejects unsupported values", () => {
    expect(normalizeSecurityHeadersUrlInput(" example.com ")).toBe("https://example.com");
    expect(parseSecurityHeadersUrlInput("https://example.com/")?.hostname).toBe("example.com");
    expect(parseSecurityHeadersUrlInput("ftp://example.com/")).toBeNull();
    expect(parseSecurityHeadersUrlInput("localhost")).toBeNull();
  });

  it("validates the security headers response contract", () => {
    expect(isSecurityHeadersResponse(result)).toBe(true);
    expect(isSecurityHeadersResponse({ ...result, contract_version: "raw" })).toBe(false);
    expect(isSecurityHeadersResponse({ ...result, checks: [{ ...result.checks[0], status: "ok" }] })).toBe(false);
  });

  it("maps labels for risk and check status", () => {
    expect(securityHeadersRiskLabel("low", "ru")).toBe("Низкий риск");
    expect(securityHeadersRiskLabel("high", "en")).toBe("High risk");
    expect(securityHeaderStatusLabel("pass", "ru")).toBe("Есть");
    expect(securityHeaderStatusLabel("fail", "en")).toBe("Problem");
  });

  it("creates copyable text output from a result", () => {
    expect(securityHeadersResultText(result)).toContain("Final URL: https://example.com/");
    expect(securityHeadersResultText(result)).toContain("Score: 100");
    expect(securityHeadersResultText(result)).toContain("Strict-Transport-Security: max-age=31536000 — pass");
  });
});
