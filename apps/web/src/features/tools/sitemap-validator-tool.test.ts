import { describe, expect, it } from "vitest";
import { isSitemapXmlToolResponse, normalizeSitemapToolUrlInput, parseSitemapToolUrlInput, sitemapContainsTargetLabel, sitemapResultText, sitemapStatusLabel, sitemapStatusTone } from "./sitemap-validator-tool";

const result = {
  contract_version: "webdiag.tool.sitemap_xml.v1",
  generated_at: "2026-07-21T00:00:00Z",
  requested_url: "https://example.com/sitemap.xml",
  sitemap_url: "https://example.com/sitemap.xml",
  target_url: "https://example.com/catalog/page",
  status_code: 200,
  available: true,
  valid_xml: true,
  kind: "urlset",
  url_count: 2,
  sitemap_count: 0,
  contains_target: true,
  sample_urls: [{ url: "https://example.com/" }, { url: "https://example.com/catalog/page" }],
  sample_sitemaps: [],
  content_type: "application/xml",
  parse_error: null,
  fetch_error: null,
  recommendation: "Sitemap is valid.",
} as const;

describe("sitemap validator tool helpers", () => {
  it("normalizes URL input and rejects unsupported values", () => {
    expect(normalizeSitemapToolUrlInput(" example.com/sitemap.xml ")).toBe("https://example.com/sitemap.xml");
    expect(parseSitemapToolUrlInput("https://example.com/sitemap.xml")?.hostname).toBe("example.com");
    expect(parseSitemapToolUrlInput("ftp://example.com/sitemap.xml")).toBeNull();
    expect(parseSitemapToolUrlInput("localhost")).toBeNull();
  });

  it("validates the sitemap tool response contract", () => {
    expect(isSitemapXmlToolResponse(result)).toBe(true);
    expect(isSitemapXmlToolResponse({ ...result, contract_version: "raw" })).toBe(false);
    expect(isSitemapXmlToolResponse({ ...result, sample_urls: [{ href: "https://example.com/" }] })).toBe(false);
  });

  it("maps sitemap state to labels and tones", () => {
    expect(sitemapStatusTone(result)).toBe("success");
    expect(sitemapStatusLabel(result, "ru")).toBe("Sitemap URL");
    expect(sitemapContainsTargetLabel(result, "ru")).toBe("URL найден");
    expect(sitemapStatusTone({ available: true, valid_xml: false, kind: "unknown" })).toBe("danger");
    expect(sitemapStatusTone({ available: false, valid_xml: false, kind: "unknown" })).toBe("warning");
  });

  it("creates copyable text output from a result", () => {
    expect(sitemapResultText(result)).toContain("Sitemap: https://example.com/sitemap.xml");
    expect(sitemapResultText(result)).toContain("URL count: 2");
    expect(sitemapResultText(result)).toContain("https://example.com/catalog/page");
  });
});
