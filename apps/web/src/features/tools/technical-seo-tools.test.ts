import { describe, expect, it } from "vitest";
import {
  hreflangResultText,
  indexabilityResultText,
  technologyDetectorResultText,
} from "./technical-seo-tools";

describe("technical SEO presenters", () => {
  it("formats technical SEO summaries", () => {
    expect(indexabilityResultText({
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
    })).toContain("Indexable candidate: yes");

    expect(hreflangResultText({
      contract_version: "webdiag.tool.hreflang.v1",
      generated_at: "2026",
      requested_url: "https://example.com/",
      final_url: "https://example.com/",
      status_code: 200,
      scan_mode: "static_html_bounded",
      html_lang: "en",
      total_alternates: 3,
      valid_alternate_count: 3,
      invalid_alternate_count: 0,
      duplicate_hreflang_count: 0,
      has_x_default: true,
      has_self_reference: true,
      alternates: [],
      recommendation: "OK",
    })).toContain("Alternates: 3");

    expect(technologyDetectorResultText({
      contract_version: "webdiag.tool.technology_detector.v1",
      generated_at: "2026",
      requested_url: "https://example.com/",
      final_url: "https://example.com/",
      status_code: 200,
      scan_mode: "static_html_bounded",
      detected_count: 2,
      technologies: [],
      server_header: "cloudflare",
      powered_by_header: "Next.js",
      generator_meta: "WordPress",
      recommendation: "OK",
    })).toContain("Detected: 2");
  });
});
