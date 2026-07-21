import { describe, expect, it } from "vitest";
import { isHttpStatusToolResponse, normalizeToolUrlInput, parseToolUrlInput, resultText, statusTone } from "./redirect-chain-tool";

const result = {
  contract_version: "webdiag.tool.http_status.v1",
  generated_at: "2026-07-21T00:00:00Z",
  requested_url: "https://example.com/old",
  final_url: "https://example.com/new",
  status_code: 200,
  ok: true,
  redirect_count: 1,
  redirect_chain: [{ source_url: "https://example.com/old", target_url: "https://example.com/new", status_code: 301 }],
  headers: { content_type: "text/html", content_length: "123", cache_control: null, server: null },
  recommendation: "Review avoidable hops.",
} as const;

describe("redirect chain tool helpers", () => {
  it("normalizes URL input and rejects unsupported values", () => {
    expect(normalizeToolUrlInput(" example.com/page ")).toBe("https://example.com/page");
    expect(parseToolUrlInput("https://example.com/")?.hostname).toBe("example.com");
    expect(parseToolUrlInput("ftp://example.com/")).toBeNull();
    expect(parseToolUrlInput("localhost")).toBeNull();
  });

  it("validates the HTTP status tool response contract", () => {
    expect(isHttpStatusToolResponse(result)).toBe(true);
    expect(isHttpStatusToolResponse({ ...result, contract_version: "raw" })).toBe(false);
    expect(isHttpStatusToolResponse({ ...result, redirect_chain: [{ source_url: "x" }] })).toBe(false);
  });

  it("maps status codes to UI tones", () => {
    expect(statusTone(200)).toBe("success");
    expect(statusTone(301)).toBe("warning");
    expect(statusTone(404)).toBe("danger");
    expect(statusTone(500)).toBe("danger");
  });

  it("creates copyable text output from a result", () => {
    expect(resultText(result)).toContain("HTTP 200");
    expect(resultText(result)).toContain("301: https://example.com/old -> https://example.com/new");
  });
});
