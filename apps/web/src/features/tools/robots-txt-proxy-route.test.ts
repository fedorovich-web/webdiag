import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST } from "../../../app/api/tools/robots-txt/route";

const validToolResult = {
  contract_version: "webdiag.tool.robots_txt.v1",
  generated_at: "2026-07-21T00:00:00Z",
  requested_url: "https://example.com/private/page",
  target_url: "https://example.com/private/page",
  target_path: "/private/page",
  robots_url: "https://example.com/robots.txt",
  user_agent: "WebDiagBot",
  status_code: 200,
  available: true,
  allows_target: false,
  matched_allow_rule: null,
  matched_disallow_rule: "/private",
  disallow_count: 1,
  disallow_rules: [{ user_agent: "*", directive: "disallow", value: "/private" }],
  sitemap_count: 1,
  sitemap_urls: [{ url: "https://example.com/sitemap.xml" }],
  recommendation: "The tested URL is blocked.",
};

function request(body: unknown): NextRequest {
  return new Request("http://localhost/api/tools/robots-txt", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

async function responseJson(response: Response): Promise<unknown> {
  return response.json() as Promise<unknown>;
}

describe("robots.txt proxy route", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("rejects request bodies without a URL string", async () => {
    const response = await POST(request({ url: 123 }));
    expect(response.status).toBe(400);
    await expect(responseJson(response)).resolves.toEqual({ detail: { code: "tool_bad_request", message: "Request body must include a URL string." } });
  });

  it("proxies valid tool API results", async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      expect(init?.body).toBe(JSON.stringify({ url: "https://example.com/private/page", user_agent: "WebDiagBot" }));
      return new Response(JSON.stringify(validToolResult), { status: 200, headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetch);

    const response = await POST(request({ url: "https://example.com/private/page", user_agent: "WebDiagBot" }));
    expect(response.status).toBe(200);
    await expect(responseJson(response)).resolves.toMatchObject({ contract_version: "webdiag.tool.robots_txt.v1", allows_target: false });
  });

  it("preserves normalized backend errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ detail: { code: "tool_url_rejected", message: "Private network targets are blocked." } }), { status: 400, headers: { "content-type": "application/json" } })));

    const response = await POST(request({ url: "http://127.0.0.1/" }));
    expect(response.status).toBe(400);
    await expect(responseJson(response)).resolves.toEqual({ detail: { code: "tool_url_rejected", message: "Private network targets are blocked." } });
  });

  it("maps invalid successful tool API contracts to 502", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ...validToolResult, contract_version: "raw" }), { status: 200, headers: { "content-type": "application/json" } })));

    const response = await POST(request({ url: "https://example.com/" }));
    expect(response.status).toBe(502);
    await expect(responseJson(response)).resolves.toEqual({ detail: { code: "tool_api_invalid_response", message: "Tool API returned an invalid robots.txt result." } });
  });
});
