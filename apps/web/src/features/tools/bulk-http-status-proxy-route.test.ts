import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST } from "../../../app/api/tools/bulk-http-status/route";

function request(body: unknown): NextRequest {
  return new Request("http://localhost/api/tools/bulk-http-status", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe("bulk HTTP status proxy", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("rejects malformed and oversized URL arrays before upstream", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);

    expect((await POST(request({ urls: "https://example.com" }))).status).toBe(400);
    expect((await POST(request({ urls: Array.from({ length: 51 }, () => "https://example.com") }))).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("proxies only a valid bounded array and preserves no-store", async () => {
    const payload = {
      contract_version: "webdiag.tool.bulk_http_status.v1",
      generated_at: "2026-08-13T00:00:00Z",
      total: 1,
      succeeded: 0,
      failed: 1,
      items: [
        {
          index: 0,
          requested_url: "http://127.0.0.1/",
          status: "failed",
          result: null,
          error: { code: "tool_url_rejected", message: "Private targets are blocked." },
        },
      ],
    };
    const fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.body).toBe(JSON.stringify({ urls: ["http://127.0.0.1/"] }));
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetch);

    const response = await POST(request({ urls: ["http://127.0.0.1/"] }));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual(payload);
  });

  it("rejects a successful upstream response with a broken aggregate contract", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            contract_version: "webdiag.tool.bulk_http_status.v1",
            generated_at: "2026-08-13T00:00:00Z",
            total: 2,
            succeeded: 0,
            failed: 0,
            items: [],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );

    const response = await POST(request({ urls: ["https://example.com/"] }));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      detail: {
        code: "tool_api_invalid_response",
        message: "Tool API returned an invalid bulk HTTP status result.",
      },
    });
  });
});
