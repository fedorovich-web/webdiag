import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST as faviconPost } from "../../../app/api/tools/favicon/route";
import { POST as imagePerformancePost } from "../../../app/api/tools/image-performance/route";
import { POST as imageSeoPost } from "../../../app/api/tools/image-seo/route";

function request(body: unknown): NextRequest {
  return new Request("http://localhost/api/tools/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe("image audit proxy routes", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("proxies valid image performance responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      contract_version: "webdiag.tool.image_performance.v1",
      generated_at: "2026-07-21T12:00:00Z",
      requested_url: "https://example.com/",
      final_url: "https://example.com/",
      status_code: 200,
      scan_mode: "static_html_bounded",
      discovered_image_count: 0,
      checked_image_count: 0,
      total_known_image_bytes: 0,
      unknown_size_count: 0,
      modern_raster_count: 0,
      legacy_raster_count: 0,
      svg_count: 0,
      oversized_count: 0,
      missing_dimensions_count: 0,
      lazy_loading_candidate_count: 0,
      responsive_markup_count: 0,
      format_summaries: [],
      largest_images: [],
      recommendation: "OK",
    }), { status: 200, headers: { "content-type": "application/json" } })));
    const response = await imagePerformancePost(request({ url: "https://example.com/" }));
    expect(response.status).toBe(200);
    expect((await response.json()).contract_version).toBe("webdiag.tool.image_performance.v1");
  });

  it("proxies valid image SEO responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      contract_version: "webdiag.tool.image_seo.v1",
      generated_at: "2026-07-21T12:00:00Z",
      requested_url: "https://example.com/",
      final_url: "https://example.com/",
      status_code: 200,
      total_images: 0,
      missing_alt_count: 0,
      empty_alt_count: 0,
      decorative_count: 0,
      linked_images_without_alt_count: 0,
      missing_dimensions_count: 0,
      responsive_image_count: 0,
      lazy_loading_count: 0,
      og_image_url: null,
      twitter_image_url: null,
      checks: [],
      sample_images: [],
      recommendation: "OK",
    }), { status: 200, headers: { "content-type": "application/json" } })));
    const response = await imageSeoPost(request({ url: "https://example.com/" }));
    expect(response.status).toBe(200);
    expect((await response.json()).contract_version).toBe("webdiag.tool.image_seo.v1");
  });

  it("rejects invalid favicon upstream payloads", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ contract_version: "wrong" }), { status: 200, headers: { "content-type": "application/json" } })));
    const response = await faviconPost(request({ url: "https://example.com/" }));
    expect(response.status).toBe(502);
    expect((await response.json()).detail.code).toBe("tool_api_invalid_response");
  });
});
