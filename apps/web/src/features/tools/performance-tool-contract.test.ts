import { describe, expect, it } from "vitest";
import { formatBytes, isCachePolicyResponse, isLighthouseNetworkResponse, isPageSpeedResponse, isPageWeightResponse, parsePerformanceToolUrlInput } from "./performance-tool-contract";

const generated_at = "2026-07-21T00:00:00Z";

describe("performance tool contracts", () => {
  it("validates Core Web Vitals responses", () => {
    expect(isPageSpeedResponse({
      contract_version: "webdiag.tool.core_web_vitals.v2",
      generated_at,
      requested_url: "https://example.com/",
      normalized_url: "https://example.com/",
      strategy: "mobile",
      results: [{ strategy: "mobile", available: true, performance_score: 92, field_data_available: true, field_overall_category: "FAST", lighthouse_version: "13", analysis_fetch_time: generated_at, category_scores: { performance: 92, accessibility: 88, "best-practices": 100, seo: 91 }, audit_findings: [{ id: "color-contrast", category: "accessibility", title: "Color contrast", score: 0, score_display_mode: "binary", display_value: null, weight: 7 }], metrics: [{ id: "lcp", title: "LCP", value: 1200, unit: "ms", display_value: "1.2 s", source: "lab", status: "pass" }], opportunities: [{ id: "images", title: "Optimize images", display_value: "450 ms", savings_ms: 450, score: 0.5 }], fetch_error: null }],
      recommendation: "OK",
    })).toBe(true);
    expect(isPageSpeedResponse({
      contract_version: "webdiag.tool.core_web_vitals.v2",
      generated_at,
      requested_url: "https://example.com/",
      normalized_url: "https://example.com/",
      strategy: "mobile",
      results: [{ strategy: "mobile", available: true, performance_score: 92, field_data_available: true, field_overall_category: "FAST", lighthouse_version: "13", analysis_fetch_time: generated_at, category_scores: { performance: 92 }, audit_findings: [], metrics: [], opportunities: [], fetch_error: null }],
      recommendation: "Incomplete category contract",
    })).toBe(false);
    expect(isPageSpeedResponse({
      contract_version: "webdiag.tool.core_web_vitals.v2",
      generated_at,
      requested_url: "https://example.com/",
      normalized_url: "https://example.com/",
      strategy: "mobile",
      results: [{ strategy: "mobile", available: true, performance_score: 92, field_data_available: false, field_overall_category: null, lighthouse_version: "13", analysis_fetch_time: generated_at, category_scores: { performance: 92, accessibility: 88, "best-practices": 100, seo: 91, injected: 100 }, audit_findings: [], metrics: [], opportunities: [], fetch_error: null }],
      recommendation: "Unexpected provider category",
    })).toBe(false);
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

  it("validates bounded redacted Lighthouse network evidence", () => {
    const valid = {
      contract_version: "webdiag.tool.lighthouse_network.v1",
      generated_at,
      requested_url: "https://example.com/",
      normalized_url: "https://example.com/",
      strategy: "mobile",
      available: true,
      lighthouse_version: "13",
      analysis_fetch_time: generated_at,
      fetch_error: null,
      resources_available: true,
      request_count: 1,
      returned_request_count: 1,
      total_transfer_bytes: 12000,
      total_resource_bytes: 32000,
      resources: [{ url: "https://example.com/", protocol: "h2", start_ms: 0, end_ms: 200, duration_ms: 200, transfer_bytes: 12000, resource_bytes: 32000, status_code: 200, mime_type: "text/html", resource_type: "document" }],
      render_blocking_available: true,
      render_blocking_score: 0.42,
      render_blocking_display_value: "Potential savings of 350 ms",
      render_blocking_savings_ms: 350,
      render_blocking_items: [{ url: "https://example.com/app.css", total_bytes: 42000, wasted_bytes: 18000, wasted_ms: 350 }],
      recommendation: "Review provider evidence.",
    };
    expect(isLighthouseNetworkResponse(valid)).toBe(true);
    expect(isLighthouseNetworkResponse({ ...valid, resources: Array.from({ length: 41 }, () => valid.resources[0]) })).toBe(false);
    expect(isLighthouseNetworkResponse({ ...valid, resources: [{ ...valid.resources[0], injected: true }] })).toBe(false);
    expect(isLighthouseNetworkResponse({ ...valid, strategy: "both" })).toBe(false);
  });
});
