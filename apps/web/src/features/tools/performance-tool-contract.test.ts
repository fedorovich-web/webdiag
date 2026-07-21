import { describe, expect, it } from "vitest";
import { formatBytes, isCachePolicyResponse, isPageSpeedResponse, isPageWeightResponse, parsePerformanceToolUrlInput } from "./performance-tool-contract";

const generated_at = "2026-07-21T00:00:00Z";

describe("performance tool contracts", () => {
  it("validates Core Web Vitals responses", () => {
    expect(isPageSpeedResponse({
      contract_version: "webdiag.tool.core_web_vitals.v1",
      generated_at,
      requested_url: "https://example.com/",
      normalized_url: "https://example.com/",
      strategy: "mobile",
      results: [{ strategy: "mobile", available: true, performance_score: 92, field_data_available: true, field_overall_category: "FAST", lighthouse_version: "13", analysis_fetch_time: generated_at, metrics: [{ id: "lcp", title: "LCP", value: 1200, unit: "ms", display_value: "1.2 s", source: "lab", status: "pass" }], opportunities: [{ id: "images", title: "Optimize images", display_value: "450 ms", savings_ms: 450, score: 0.5 }], fetch_error: null }],
      recommendation: "OK",
    })).toBe(true);
  });

  it("validates cache policy responses", () => {
    expect(isCachePolicyResponse({
      contract_version: "webdiag.tool.cache_policy.v1",
      generated_at,
      requested_url: "https://example.com/app.css",
      final_url: "https://example.com/app.css",
      status_code: 200,
      content_type: "text/css",
      is_static_asset: true,
      cache_control: "public, max-age=31536000, immutable",
      etag: '"1"',
      last_modified: null,
      expires: null,
      vary: "Accept-Encoding",
      score: 100,
      checks: [{ id: "cache-control", title: "Cache-Control", status: "pass", severity: "info", value: "public", recommendation: "OK" }],
      recommendation: "OK",
    })).toBe(true);
  });

  it("validates page weight responses and formats bytes", () => {
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(isPageWeightResponse({
      contract_version: "webdiag.tool.page_weight.v1",
      generated_at,
      requested_url: "https://example.com/",
      final_url: "https://example.com/",
      status_code: 200,
      scan_mode: "static_html_bounded",
      html_bytes: 12000,
      discovered_resource_count: 2,
      checked_resource_count: 2,
      total_known_bytes: 200000,
      unknown_size_count: 0,
      image_count: 1,
      legacy_image_count: 1,
      modern_image_count: 0,
      summaries: [{ type: "image", count: 1, known_bytes: 200000, unknown_size_count: 0 }],
      largest_resources: [{ url: "https://example.com/a.jpg", type: "image", status_code: 200, content_type: "image/jpeg", content_length: 200000, modern_image_format: false, recommendation: "Use AVIF/WebP" }],
      recommendation: "Use AVIF/WebP",
    })).toBe(true);
  });

  it("normalizes URL input", () => {
    expect(parsePerformanceToolUrlInput("example.com")?.toString()).toBe("https://example.com/");
    expect(parsePerformanceToolUrlInput("localhost")).toBeNull();
  });
});
