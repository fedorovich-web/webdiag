import { describe, expect, it } from "vitest";
import { isFaviconResponse, isImagePerformanceResponse, isImageSeoResponse, parseImageToolUrlInput } from "./image-audit-tool-contract";

describe("image audit tool contracts", () => {
  it("validates image performance responses and rejects partial payloads", () => {
    const payload = {
      contract_version: "webdiag.tool.image_performance.v1",
      generated_at: "2026-07-21T12:00:00Z",
      requested_url: "https://example.com/",
      final_url: "https://example.com/",
      status_code: 200,
      scan_mode: "static_html_bounded",
      discovered_image_count: 1,
      checked_image_count: 1,
      total_known_image_bytes: 120000,
      unknown_size_count: 0,
      modern_raster_count: 0,
      legacy_raster_count: 1,
      svg_count: 0,
      oversized_count: 0,
      missing_dimensions_count: 1,
      lazy_loading_candidate_count: 0,
      responsive_markup_count: 0,
      format_summaries: [{ format: "jpeg", count: 1, known_bytes: 120000, unknown_size_count: 0 }],
      largest_images: [{ url: "https://example.com/a.jpg", source: "img-src", format: "jpeg", status_code: 200, content_type: "image/jpeg", content_length: 120000, width_attr: null, height_attr: null, loading: null, uses_srcset: false, uses_picture: false, modern_raster_format: false, oversized: false, recommendations: [] }],
      recommendation: "Use AVIF/WebP.",
    };
    expect(isImagePerformanceResponse(payload)).toBe(true);
    expect(isImagePerformanceResponse({ ...payload, largest_images: [{}] })).toBe(false);
  });

  it("validates image seo and favicon responses", () => {
    expect(isImageSeoResponse({
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
      og_image_url: null,
      twitter_image_url: null,
      checks: [{ id: "alt-text", title: "Alt", status: "pass", severity: "info", value: "0", recommendation: "OK" }],
      sample_images: [{ url: "https://example.com/a.webp", alt_status: "present", alt_text: "A", in_link: false, has_dimensions: true, loading: null, uses_srcset: true, uses_picture: false }],
      recommendation: "OK",
    })).toBe(true);
    expect(isFaviconResponse({
      contract_version: "webdiag.tool.favicon.v1",
      generated_at: "2026-07-21T12:00:00Z",
      requested_url: "https://example.com/",
      final_url: "https://example.com/",
      status_code: 200,
      discovered_icon_count: 1,
      checked_icon_count: 1,
      has_favicon: true,
      has_svg_icon: true,
      has_apple_touch_icon: false,
      has_manifest: false,
      manifest_url: null,
      fallback_ico_checked: true,
      icons: [{ rel: "icon", url: "https://example.com/favicon.svg", sizes: null, declared_type: "image/svg+xml", status_code: 200, content_type: "image/svg+xml", content_length: 500, format: "svg", recommendation: null }],
      recommendation: "OK",
    })).toBe(true);
  });

  it("parses only http and https URLs", () => {
    expect(parseImageToolUrlInput("https://example.com/")?.hostname).toBe("example.com");
    expect(parseImageToolUrlInput("ftp://example.com/")).toBeNull();
  });
});
