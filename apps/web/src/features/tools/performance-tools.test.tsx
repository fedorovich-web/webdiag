import { describe, expect, it } from "vitest";
import { cachePolicyResultText, pageSpeedResultText, pageWeightResultText } from "./performance-tools";
import type { CachePolicyResponse, PageSpeedResponse, PageWeightResponse } from "./performance-tool-contract";

const generated_at = "2026-07-21T00:00:00Z";

const coreWebVitals: PageSpeedResponse = {
  contract_version: "webdiag.tool.core_web_vitals.v1",
  generated_at,
  requested_url: "https://example.com/",
  normalized_url: "https://example.com/",
  strategy: "mobile",
  results: [{ strategy: "mobile", available: true, performance_score: 91, field_data_available: true, field_overall_category: "FAST", lighthouse_version: "13", analysis_fetch_time: generated_at, metrics: [{ id: "largest-contentful-paint", title: "Largest Contentful Paint", value: 2200, unit: "ms", display_value: "2.2 s", source: "lab", status: "pass" }], opportunities: [], fetch_error: null }],
  recommendation: "Good",
};

const cachePolicy: CachePolicyResponse = {
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
  checks: [{ id: "cache-control", title: "Cache-Control policy", status: "pass", severity: "info", value: "public, max-age=31536000, immutable", recommendation: "OK" }],
  recommendation: "Good",
};

const pageWeight: PageWeightResponse = {
  contract_version: "webdiag.tool.page_weight.v1",
  generated_at,
  requested_url: "https://example.com/",
  final_url: "https://example.com/",
  status_code: 200,
  scan_mode: "static_html_bounded",
  html_bytes: 12000,
  discovered_resource_count: 3,
  checked_resource_count: 3,
  total_known_bytes: 600000,
  unknown_size_count: 0,
  image_count: 2,
  legacy_image_count: 1,
  modern_image_count: 1,
  summaries: [{ type: "image", count: 2, known_bytes: 600000, unknown_size_count: 0 }],
  largest_resources: [{ url: "https://example.com/hero.jpg", type: "image", status_code: 200, content_type: "image/jpeg", content_length: 600000, modern_image_format: false, recommendation: "Use AVIF/WebP" }],
  recommendation: "Use AVIF/WebP",
};

describe("performance tool helpers", () => {
  it("creates copyable text for PageSpeed results", () => {
    expect(pageSpeedResultText(coreWebVitals)).toContain("Performance score: 91");
    expect(pageSpeedResultText(coreWebVitals)).toContain("Largest Contentful Paint: 2.2 s — pass");
  });

  it("creates copyable text for cache policy results", () => {
    expect(cachePolicyResultText(cachePolicy)).toContain("Score: 100");
    expect(cachePolicyResultText(cachePolicy)).toContain("Cache-Control policy");
  });

  it("creates copyable text for page weight results and image format signals", () => {
    expect(pageWeightResultText(pageWeight)).toContain("Images: modern 1, legacy 1");
    expect(pageWeightResultText(pageWeight)).toContain("Use AVIF/WebP");
  });
});
