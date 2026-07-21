import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST } from "../../../app/api/tools/sitemap/route";

const validToolResult = {
  contract_version: "webdiag.tool.sitemap_xml.v1",
  generated_at: "2026-07-21T00:00:00Z",
  requested_url: "https://example.com/sitemap.xml",
  sitemap_url: "https://example.com/sitemap.xml",
  target_url: "https://example.com/catalog/page",
  status_code: 200,
  available: true,
  valid_xml: true,
  kind: "urlset",
  url_count: 2,
  sitemap_count: 0,
  contains_target: true,
  sample_urls: [{ url: "https://example.com/" }, { url: "https://example.com/catalog/page" }],
  sample_sitemaps: [],
  content_type: "application/xml",
  parse_error: null,
  fetch_error: null,
  recommendation: "Sitemap is valid.",
};

function request(body: unknown): NextRequest {
  return new Request("http://localhost/api/tools/sitemap", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

async function responseJson(response: Response): Promise<unknown> {
  return response.json() as Promise<unknown>;
}

describe("sitemap proxy route", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("rejects request bodies without a URL string", async () => {
    const response = await POST(request({ url: 123 }));
    expect(response.status).toBe(400);
    await expect(responseJson(response)).resolves.toEqual({ detail: { code: "tool_bad_request", message: "Request body must include a URL string." } });
  });

  it("proxies valid tool API results", async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      expect(init?.body).toBe(JSON.stringify({ url: "https://example.com/sitemap.xml", target_url: "https://example.com/catalog/page" }));
      return new Response(JSON.stringify(validToolResult), { status: 200, headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetch);

    const response = await POST(request({ url: "https://example.com/sitemap.xml", target_url: "https://example.com/catalog/page" }));
    expect(response.status).toBe(200);
    await expect(responseJson(response)).resolves.toMatchObject({ contract_version: "webdiag.tool.sitemap_xml.v1", contains_target: true });
  });

  it("preserves normalized backend errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ detail: { code: "tool_url_rejected", message: "Private network targets are blocked." } }), { status: 400, headers: { "content-type": "application/json" } })));

    const response = await POST(request({ url: "http://127.0.0.1/sitemap.xml" }));
    expect(response.status).toBe(400);
    await expect(responseJson(response)).resolves.toEqual({ detail: { code: "tool_url_rejected", message: "Private network targets are blocked." } });
  });

  it("maps invalid successful tool API contracts to 502", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ...validToolResult, contract_version: "raw" }), { status: 200, headers: { "content-type": "application/json" } })));

    const response = await POST(request({ url: "https://example.com/sitemap.xml" }));
    expect(response.status).toBe(502);
    await expect(responseJson(response)).resolves.toEqual({ detail: { code: "tool_api_invalid_response", message: "Tool API returned an invalid sitemap result." } });
  });
});
