import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST as cssPost } from "../../../app/api/tools/css-delivery/route";
import { POST as fontPost } from "../../../app/api/tools/font-loading/route";
import { POST as javascriptPost } from "../../../app/api/tools/javascript-bundle-surface/route";

function request(body: unknown): NextRequest {
  return new Request("http://localhost/api/tools/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

const common = {
  generated_at: "2026-07-22T00:00:00Z",
  requested_url: "https://example.com/",
  final_url: "https://example.com/",
  status_code: 200,
  content_type: "text/html",
  redirect_count: 0,
  truncated: false,
  status: "pass",
  recommendation: "OK",
  findings: [],
};

const jsPayload = {
  ...common,
  contract_version: "webdiag.tool.javascript_bundle_surface.v1",
  scan_mode: "static_html_bounded_headers",
  discovered_script_count: 0,
  unique_script_count: 0,
  checked_script_count: 0,
  same_host_script_count: 0,
  cross_host_script_count: 0,
  module_script_count: 0,
  classic_script_count: 0,
  parser_blocking_candidate_count: 0,
  duplicate_src_count: 0,
  known_declared_bytes: 0,
  unknown_size_count: 0,
  compressed_response_count: 0,
  long_cache_count: 0,
  failed_asset_count: 0,
  issue_count: 0,
  assets: [],
};

const cssPayload = {
  ...common,
  contract_version: "webdiag.tool.css_delivery_analyzer.v1",
  scan_mode: "static_html_bounded_css",
  stylesheet_link_count: 0,
  unique_stylesheet_count: 0,
  checked_stylesheet_count: 0,
  inline_style_block_count: 0,
  inline_style_bytes: 0,
  same_host_stylesheet_count: 0,
  cross_host_stylesheet_count: 0,
  default_media_candidate_count: 0,
  conditional_media_count: 0,
  alternate_or_disabled_count: 0,
  duplicate_href_count: 0,
  known_declared_bytes: 0,
  sampled_decoded_bytes: 0,
  compressed_response_count: 0,
  import_rule_count: 0,
  font_face_rule_count: 0,
  failed_stylesheet_count: 0,
  issue_count: 0,
  stylesheets: [],
};

const fontPayload = {
  ...common,
  contract_version: "webdiag.tool.font_loading_analyzer.v1",
  scan_mode: "static_html_bounded_css",
  stylesheet_count: 0,
  checked_stylesheet_count: 0,
  font_face_count: 0,
  family_count: 0,
  font_source_count: 0,
  unique_font_source_count: 0,
  checked_font_source_count: 0,
  local_source_count: 0,
  preload_count: 0,
  matched_preload_count: 0,
  missing_font_display_count: 0,
  blocking_font_display_count: 0,
  swap_or_optional_count: 0,
  cross_host_font_count: 0,
  woff2_source_count: 0,
  duplicate_source_count: 0,
  known_declared_bytes: 0,
  unknown_size_count: 0,
  failed_font_count: 0,
  issue_count: 0,
  faces: [],
  assets: [],
  preloads: [],
};

describe("asset delivery proxy routes", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("proxies valid responses for all three analyzers", async () => {
    vi.stubGlobal("fetch", vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(jsPayload), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(cssPayload), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(fontPayload), { status: 200 })));

    expect((await javascriptPost(request({ url: "https://example.com/" }))).status).toBe(200);
    expect((await cssPost(request({ url: "https://example.com/" }))).status).toBe(200);
    expect((await fontPost(request({ url: "https://example.com/" }))).status).toBe(200);
  });

  it("forwards only the normalized URL", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(JSON.parse(String(init?.body))).toEqual({ url: "https://example.com/path" });
      return new Response(JSON.stringify(jsPayload), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await javascriptPost(request({
      url: " https://example.com/path ",
      headers: { host: "127.0.0.1" },
      extra: "ignored",
    }));

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects non-string or unsupported URLs before backend calls", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect((await cssPost(request({ url: 123 }))).status).toBe(400);
    expect((await fontPost(request({ url: "file:///tmp/page.html" }))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid successful upstream contract", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      contract_version: "wrong",
    }), { status: 200 })));

    const response = await fontPost(request({ url: "https://example.com/" }));
    expect(response.status).toBe(502);
    expect((await response.json()).detail.code).toBe("tool_api_invalid_response");
  });

  it("preserves structured backend errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      detail: { code: "tool_url_rejected", message: "Target is private." },
    }), { status: 400 })));

    const response = await cssPost(request({ url: "https://example.com/" }));
    expect(response.status).toBe(400);
    expect((await response.json()).detail.code).toBe("tool_url_rejected");
  });
});
