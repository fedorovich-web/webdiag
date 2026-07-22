import { describe, expect, it } from "vitest";
import {
  cssDeliveryResultText,
  fontLoadingResultText,
  javascriptBundleResultText,
} from "./asset-delivery-tools";
import type {
  CssDeliveryAnalyzerResponse,
  FontLoadingAnalyzerResponse,
  JavaScriptBundleSurfaceResponse,
} from "./asset-delivery-tool-contract";

const base = {
  generated_at: "2026-07-22T00:00:00Z",
  requested_url: "https://example.com/",
  final_url: "https://example.com/",
  status_code: 200,
  content_type: "text/html",
  redirect_count: 0,
  truncated: false,
  status: "warning" as const,
  recommendation: "Review it.",
  findings: [],
};

describe("asset delivery report text", () => {
  it("includes the important JavaScript delivery counters", () => {
    const result = {
      ...base,
      contract_version: "webdiag.tool.javascript_bundle_surface.v1",
      scan_mode: "static_html_bounded_headers",
      discovered_script_count: 4,
      unique_script_count: 3,
      checked_script_count: 3,
      same_host_script_count: 2,
      cross_host_script_count: 1,
      module_script_count: 1,
      classic_script_count: 2,
      parser_blocking_candidate_count: 1,
      duplicate_src_count: 1,
      known_declared_bytes: 500000,
      unknown_size_count: 0,
      compressed_response_count: 3,
      long_cache_count: 2,
      failed_asset_count: 0,
      issue_count: 0,
      assets: [],
    } satisfies JavaScriptBundleSurfaceResponse;
    expect(javascriptBundleResultText(result)).toContain("Unique scripts: 3");
    expect(javascriptBundleResultText(result)).toContain("Known declared bytes: 500000");
  });

  it("includes CSS and font-specific counters", () => {
    const css = {
      ...base,
      contract_version: "webdiag.tool.css_delivery_analyzer.v1",
      scan_mode: "static_html_bounded_css",
      stylesheet_link_count: 2,
      unique_stylesheet_count: 2,
      checked_stylesheet_count: 2,
      inline_style_block_count: 1,
      inline_style_bytes: 100,
      same_host_stylesheet_count: 2,
      cross_host_stylesheet_count: 0,
      default_media_candidate_count: 2,
      conditional_media_count: 0,
      alternate_or_disabled_count: 0,
      duplicate_href_count: 0,
      known_declared_bytes: 1000,
      sampled_decoded_bytes: 2000,
      compressed_response_count: 2,
      import_rule_count: 1,
      font_face_rule_count: 1,
      failed_stylesheet_count: 0,
      issue_count: 0,
      stylesheets: [],
    } satisfies CssDeliveryAnalyzerResponse;
    expect(cssDeliveryResultText(css)).toContain("@import rules: 1");

    const fonts = {
      ...base,
      contract_version: "webdiag.tool.font_loading_analyzer.v1",
      scan_mode: "static_html_bounded_css",
      stylesheet_count: 1,
      checked_stylesheet_count: 1,
      font_face_count: 2,
      family_count: 1,
      font_source_count: 2,
      unique_font_source_count: 2,
      checked_font_source_count: 2,
      local_source_count: 0,
      preload_count: 1,
      matched_preload_count: 1,
      missing_font_display_count: 1,
      blocking_font_display_count: 0,
      swap_or_optional_count: 1,
      cross_host_font_count: 0,
      woff2_source_count: 2,
      duplicate_source_count: 0,
      known_declared_bytes: 30000,
      unknown_size_count: 0,
      failed_font_count: 0,
      issue_count: 0,
      faces: [],
      assets: [],
      preloads: [],
    } satisfies FontLoadingAnalyzerResponse;
    expect(fontLoadingResultText(fonts)).toContain("Missing font-display: 1");
    expect(fontLoadingResultText(fonts)).toContain("Preloads matched: 1/1");
  });
});
