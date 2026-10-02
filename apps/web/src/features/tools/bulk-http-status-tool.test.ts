import { describe, expect, it } from "vitest";
import { isBulkHttpStatusResponse, parseBulkUrlInput } from "./bulk-http-status-tool";

const response = {
  contract_version: "webdiag.tool.bulk_http_status.v1",
  generated_at: "2026-08-13T00:00:00Z",
  total: 2,
  succeeded: 1,
  failed: 1,
  items: [
    {
      index: 0,
      requested_url: "https://example.com/",
      status: "succeeded",
      result: {
        contract_version: "webdiag.tool.http_status.v1",
        generated_at: "2026-08-13T00:00:00Z",
        requested_url: "https://example.com/",
        final_url: "https://example.com/",
        status_code: 200,
        ok: true,
        redirect_count: 0,
        redirect_chain: [],
        headers: {
          content_type: "text/html",
          content_length: null,
          cache_control: null,
          server: null,
        },
        recommendation: "The URL responds successfully.",
      },
      error: null,
    },
    {
      index: 1,
      requested_url: "http://127.0.0.1/",
      status: "failed",
      result: null,
      error: {
        code: "tool_url_rejected",
        message: "Private or reserved addresses are not allowed.",
      },
    },
  ],
} as const;

describe("bulk HTTP status helpers", () => {
  it("normalizes non-empty lines while preserving order and duplicates", () => {
    expect(parseBulkUrlInput(" example.com/a\n\nhttps://example.com/b\nexample.com/a ")).toEqual([
      "https://example.com/a",
      "https://example.com/b",
      "https://example.com/a",
    ]);
  });

  it("rejects unsupported URL schemes locally", () => {
    expect(() => parseBulkUrlInput("https://example.com/\nfile:///etc/passwd")).toThrow(
      "invalid_url",
    );
  });

  it("validates success and per-item failure invariants", () => {
    expect(isBulkHttpStatusResponse(response)).toBe(true);
    expect(isBulkHttpStatusResponse({ ...response, total: 3 })).toBe(false);
    expect(
      isBulkHttpStatusResponse({
        ...response,
        items: [{ ...response.items[0], status: "failed" }],
      }),
    ).toBe(false);
  });
});
