import { describe, expect, it } from "vitest";
import { faviconResultText, imagePerformanceResultText, imageSeoResultText } from "./image-audit-tools";

describe("image audit result text helpers", () => {
  it("summarizes image performance results", () => {
    const text = imagePerformanceResultText({
      contract_version: "webdiag.tool.image_performance.v1",
      generated_at: "2026-07-21T12:00:00Z",
      requested_url: "https://example.com/",
      final_url: "https://example.com/",
      status_code: 200,
      scan_mode: "static_html_bounded",
      discovered_image_count: 2,
      checked_image_count: 2,
      total_known_image_bytes: 300000,
      unknown_size_count: 0,
      modern_raster_count: 1,
      legacy_raster_count: 1,
      svg_count: 0,
      oversized_count: 1,
      missing_dimensions_count: 1,
      lazy_loading_candidate_count: 1,
      responsive_markup_count: 1,
      format_summaries: [{ format: "jpeg", count: 1, known_bytes: 250000, unknown_size_count: 0 }],
      largest_images: [],
      recommendation: "Use AVIF/WebP.",
    });
    expect(text).toContain("Legacy raster: 1");
    expect(text).toContain("jpeg: 1");
  });

  it("summarizes image seo and favicon results", () => {
    expect(imageSeoResultText({
      contract_version: "webdiag.tool.image_seo.v1",
      generated_at: "2026-07-21T12:00:00Z",
      requested_url: "https://example.com/",
      final_url: "https://example.com/",
      status_code: 200,
      total_images: 1,
      missing_alt_count: 0,
      empty_alt_count: 0,
      decorative_count: 0,
      linked_images_without_alt_count: 0,
      missing_dimensions_count: 0,
      responsive_image_count: 1,
      lazy_loading_count: 0,
      og_image_url: "https://example.com/og.jpg",
      twitter_image_url: null,
      checks: [{ id: "alt-text", title: "Alt", status: "pass", severity: "info", value: "0", recommendation: "OK" }],
      sample_images: [],
      recommendation: "OK",
    })).toContain("OG image: https://example.com/og.jpg");
    expect(faviconResultText({
      contract_version: "webdiag.tool.favicon.v1",
      generated_at: "2026-07-21T12:00:00Z",
      requested_url: "https://example.com/",
      final_url: "https://example.com/",
      status_code: 200,
      discovered_icon_count: 1,
      checked_icon_count: 1,
      has_favicon: true,
      has_svg_icon: true,
      has_apple_touch_icon: true,
      has_manifest: true,
      manifest_url: "https://example.com/site.webmanifest",
      fallback_ico_checked: true,
      icons: [{ rel: "icon", url: "https://example.com/favicon.svg", sizes: null, declared_type: null, status_code: 200, content_type: "image/svg+xml", content_length: 500, format: "svg", recommendation: null }],
      recommendation: "OK",
    })).toContain("SVG icon: true");
  });
});
