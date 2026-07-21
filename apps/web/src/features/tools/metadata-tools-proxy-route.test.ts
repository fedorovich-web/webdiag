import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST as postMetaTags } from "../../../app/api/tools/meta-tags/route";
import { POST as postSerpPreview } from "../../../app/api/tools/serp-preview/route";
import { POST as postSocialPreview } from "../../../app/api/tools/social-preview/route";

const validMetaTags = {
  contract_version: "webdiag.tool.meta_tags.v1",
  generated_at: "2026-07-21T00:00:00Z",
  requested_url: "https://example.com/",
  final_url: "https://example.com/",
  status_code: 200,
  content_type: "text/html",
  title: "Example title",
  title_length: 13,
  meta_description: "Example description",
  meta_description_length: 19,
  canonical_url: "https://example.com/",
  resolved_canonical_url: "https://example.com/",
  robots_directives: [],
  h1_count: 1,
  open_graph_count: 4,
  twitter_card_count: 3,
  json_ld_count: 1,
  checks: [{ id: "title", title: "Title", status: "pass", severity: "info", value: "13", recommendation: "OK" }],
  recommendation: "OK",
};

const validSerp = {
  contract_version: "webdiag.tool.serp_preview.v1",
  generated_at: "2026-07-21T00:00:00Z",
  requested_url: "https://example.com/",
  final_url: "https://example.com/",
  status_code: 200,
  display_url: "example.com/",
  preview_title: "Example title",
  preview_description: "Example description",
  title_source: "title",
  description_source: "meta_description",
  title_length: 13,
  description_length: 19,
  checks: [{ id: "title", status: "pass", message: "OK" }],
  recommendation: "OK",
};

const validSocial = {
  contract_version: "webdiag.tool.social_preview.v1",
  generated_at: "2026-07-21T00:00:00Z",
  requested_url: "https://example.com/",
  final_url: "https://example.com/",
  status_code: 200,
  open_graph: { title: "OG", description: "Description", image: "https://example.com/og.png", url: "https://example.com/", card_type: "website", site_name: null, missing_fields: [], complete: true },
  twitter: { title: "TW", description: "Description", image: "https://example.com/tw.png", url: "https://example.com/", card_type: "summary_large_image", site_name: null, missing_fields: [], complete: true },
  fallback_title: "Example title",
  fallback_description: "Example description",
  recommendation: "OK",
};

function request(path: string, body: unknown): NextRequest {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

async function responseJson(response: Response): Promise<unknown> {
  return response.json() as Promise<unknown>;
}

describe("metadata tool proxy routes", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("rejects request bodies without a URL string", async () => {
    const response = await postMetaTags(request("/api/tools/meta-tags", { url: 123 }));
    expect(response.status).toBe(400);
    await expect(responseJson(response)).resolves.toEqual({ detail: { code: "tool_bad_request", message: "Request body must include a URL string." } });
  });

  it("proxies valid metadata tool API results", async () => {
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      expect(init?.body).toBe(JSON.stringify({ url: "https://example.com/" }));
      const url = String(input);
      const payload = url.endsWith("/meta-tags") ? validMetaTags : url.endsWith("/serp-preview") ? validSerp : validSocial;
      return new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetch);

    await expect(responseJson(await postMetaTags(request("/api/tools/meta-tags", { url: "https://example.com/" })))).resolves.toMatchObject({ contract_version: "webdiag.tool.meta_tags.v1" });
    await expect(responseJson(await postSerpPreview(request("/api/tools/serp-preview", { url: "https://example.com/" })))).resolves.toMatchObject({ contract_version: "webdiag.tool.serp_preview.v1" });
    await expect(responseJson(await postSocialPreview(request("/api/tools/social-preview", { url: "https://example.com/" })))).resolves.toMatchObject({ contract_version: "webdiag.tool.social_preview.v1" });
  });

  it("preserves normalized backend errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ detail: { code: "tool_url_rejected", message: "Private network targets are blocked." } }), { status: 400, headers: { "content-type": "application/json" } })));

    const response = await postSerpPreview(request("/api/tools/serp-preview", { url: "http://127.0.0.1/" }));
    expect(response.status).toBe(400);
    await expect(responseJson(response)).resolves.toEqual({ detail: { code: "tool_url_rejected", message: "Private network targets are blocked." } });
  });

  it("maps invalid successful tool API contracts to 502", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ...validSocial, contract_version: "raw" }), { status: 200, headers: { "content-type": "application/json" } })));

    const response = await postSocialPreview(request("/api/tools/social-preview", { url: "https://example.com/" }));
    expect(response.status).toBe(502);
    await expect(responseJson(response)).resolves.toEqual({ detail: { code: "tool_api_invalid_response", message: "Tool API returned an invalid social preview result." } });
  });
});
