import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST as postCoreWebVitals } from "../../../app/api/tools/core-web-vitals/route";
import { POST as postCachePolicy } from "../../../app/api/tools/cache-policy/route";
import { POST as postPageWeight } from "../../../app/api/tools/page-weight/route";

const generated_at = "2026-07-21T00:00:00Z";

const validCore = { contract_version: "webdiag.tool.core_web_vitals.v1", generated_at, requested_url: "https://example.com/", normalized_url: "https://example.com/", strategy: "mobile", results: [{ strategy: "mobile", available: false, performance_score: null, field_data_available: false, field_overall_category: null, lighthouse_version: null, analysis_fetch_time: null, metrics: [], opportunities: [], fetch_error: "missing key" }], recommendation: "Set key" };
const validCache = { contract_version: "webdiag.tool.cache_policy.v1", generated_at, requested_url: "https://example.com/", final_url: "https://example.com/", status_code: 200, content_type: "text/html", is_static_asset: false, cache_control: null, etag: null, last_modified: null, expires: null, vary: null, score: 25, checks: [{ id: "cache-control", title: "Cache-Control", status: "fail", severity: "medium", value: null, recommendation: "Add policy" }], recommendation: "Add policy" };
const validWeight = { contract_version: "webdiag.tool.page_weight.v1", generated_at, requested_url: "https://example.com/", final_url: "https://example.com/", status_code: 200, scan_mode: "static_html_bounded", html_bytes: 1000, discovered_resource_count: 0, checked_resource_count: 0, total_known_bytes: 0, unknown_size_count: 0, image_count: 0, legacy_image_count: 0, modern_image_count: 0, summaries: [], largest_resources: [], recommendation: "OK" };

function request(path: string, body: unknown): NextRequest {
  return new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }) as NextRequest;
}

async function responseJson(response: Response): Promise<unknown> {
  return response.json() as Promise<unknown>;
}

describe("performance tool proxy routes", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("rejects request bodies without a URL string", async () => {
    const response = await postPageWeight(request("/api/tools/page-weight", { url: 123 }));
    expect(response.status).toBe(400);
    await expect(responseJson(response)).resolves.toEqual({ detail: { code: "tool_bad_request", message: "Request body must include a URL string." } });
  });

  it("proxies valid performance tool API results", async () => {
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      const url = String(input);
      const payload = url.endsWith("/core-web-vitals") ? validCore : url.endsWith("/cache-policy") ? validCache : validWeight;
      return new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetch);

    await expect(responseJson(await postCoreWebVitals(request("/api/tools/core-web-vitals", { url: "https://example.com/", strategy: "both" })))).resolves.toMatchObject({ contract_version: "webdiag.tool.core_web_vitals.v1" });
    await expect(responseJson(await postCachePolicy(request("/api/tools/cache-policy", { url: "https://example.com/" })))).resolves.toMatchObject({ contract_version: "webdiag.tool.cache_policy.v1" });
    await expect(responseJson(await postPageWeight(request("/api/tools/page-weight", { url: "https://example.com/" })))).resolves.toMatchObject({ contract_version: "webdiag.tool.page_weight.v1" });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("preserves normalized backend errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ detail: { code: "tool_url_rejected", message: "Private network targets are blocked." } }), { status: 400, headers: { "content-type": "application/json" } })));
    const response = await postCachePolicy(request("/api/tools/cache-policy", { url: "http://127.0.0.1/" }));
    expect(response.status).toBe(400);
    await expect(responseJson(response)).resolves.toEqual({ detail: { code: "tool_url_rejected", message: "Private network targets are blocked." } });
  });

  it("maps invalid successful tool API contracts to 502", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ...validWeight, contract_version: "raw" }), { status: 200, headers: { "content-type": "application/json" } })));
    const response = await postPageWeight(request("/api/tools/page-weight", { url: "https://example.com/" }));
    expect(response.status).toBe(502);
    await expect(responseJson(response)).resolves.toEqual({ detail: { code: "tool_api_invalid_response", message: "Tool API returned an invalid page weight result." } });
  });
});
