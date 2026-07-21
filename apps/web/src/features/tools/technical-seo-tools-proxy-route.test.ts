import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST as hreflangPost } from "../../../app/api/tools/hreflang/route";
import { POST as indexabilityPost } from "../../../app/api/tools/indexability/route";

function request(body: unknown): NextRequest {
  return new Request("http://localhost/api/tools/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe("technical SEO proxy routes", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("proxies valid indexability responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      contract_version: "webdiag.tool.indexability.v1",
      generated_at: "2026",
      requested_url: "https://example.com/",
      final_url: "https://example.com/",
      status_code: 200,
      scan_mode: "static_html_bounded",
      redirect_count: 0,
      robots_txt_allowed: true,
      robots_txt_status_code: 200,
      meta_robots_noindex: false,
      meta_robots_nofollow: false,
      x_robots_tag_noindex: false,
      x_robots_tag_nofollow: false,
      canonical_url: null,
      resolved_canonical_url: null,
      canonical_matches_final_url: null,
      indexable_candidate: true,
      signals: [],
      recommendation: "OK",
    }), { status: 200, headers: { "content-type": "application/json" } })));

    const response = await indexabilityPost(request({ url: "https://example.com/" }));
    expect(response.status).toBe(200);
  });

  it("rejects invalid hreflang upstream payloads", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      contract_version: "wrong",
    }), { status: 200, headers: { "content-type": "application/json" } })));

    const response = await hreflangPost(request({ url: "https://example.com/" }));
    expect(response.status).toBe(502);
  });
});
