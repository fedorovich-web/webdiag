import { describe, expect, it } from "vitest";
import {
  isHreflangResponse,
  isIndexabilityResponse,
  isTechnologyDetectorResponse,
  parseTechnicalSeoToolUrlInput,
} from "./technical-seo-tool-contract";

const base = {
  generated_at: "2026",
  requested_url: "https://example.com/",
  final_url: "https://example.com/",
  status_code: 200,
  scan_mode: "static_html_bounded",
  recommendation: "OK",
};

describe("technical SEO tool contracts", () => {
  it("validates indexability responses", () => {
    expect(isIndexabilityResponse({
      ...base,
      contract_version: "webdiag.tool.indexability.v1",
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
    })).toBe(true);
  });

  it("validates hreflang responses", () => {
    expect(isHreflangResponse({
      ...base,
      contract_version: "webdiag.tool.hreflang.v1",
      html_lang: "en",
      total_alternates: 2,
      valid_alternate_count: 2,
      invalid_alternate_count: 0,
      duplicate_hreflang_count: 0,
      has_x_default: true,
      has_self_reference: true,
      alternates: [],
    })).toBe(true);
  });

  it("validates technology detector responses", () => {
    expect(isTechnologyDetectorResponse({
      ...base,
      contract_version: "webdiag.tool.technology_detector.v1",
      detected_count: 2,
      technologies: [],
      server_header: "cloudflare",
      powered_by_header: null,
      generator_meta: null,
    })).toBe(true);
  });

  it("rejects non-http URLs", () => {
    expect(parseTechnicalSeoToolUrlInput("ftp://example.com/")).toBeNull();
  });
});
