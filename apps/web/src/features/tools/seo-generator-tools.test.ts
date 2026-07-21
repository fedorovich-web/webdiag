import { describe, expect, it } from "vitest";
import {
  generateFaqSchema,
  generateRobotsTxt,
  generateSitemapXml,
  validateFaqInput,
  validateRobotsTxt,
  validateSitemapInput,
} from "./seo-generator-tools";

describe("SEO generator tools", () => {
  it("generates deterministic robots.txt with normalized paths", () => {
    const value = generateRobotsTxt({
      userAgent: "*",
      allow: "assets",
      disallow: "admin\n/private",
      sitemap: "https://example.com/sitemap.xml",
      crawlDelay: "2",
    });

    expect(value).toContain("User-agent: *");
    expect(value).toContain("Allow: /assets");
    expect(value).toContain("Disallow: /admin");
    expect(value).toContain("Sitemap: https://example.com/sitemap.xml");
    expect(validateRobotsTxt({ userAgent: "*", allow: "", disallow: "", sitemap: "ftp://bad", crawlDelay: "" })).toContain("Sitemap");
  });

  it("generates escaped sitemap XML from explicit URL list", () => {
    const value = generateSitemapXml({
      urls: "https://example.com/?a=1&b=2\nhttps://example.com/about",
      lastmod: "2026-07-21",
      changefreq: "weekly",
      priority: "0.8",
    });

    expect(value).toContain("<urlset");
    expect(value).toContain("https://example.com/?a=1&amp;b=2");
    expect(value).toContain("<lastmod>2026-07-21</lastmod>");
    expect(validateSitemapInput({ urls: "javascript:alert(1)", lastmod: "", changefreq: "", priority: "" })).toContain("Invalid URL");
  });

  it("generates FAQPage JSON-LD without inventing answers", () => {
    const value = generateFaqSchema({
      url: "https://example.com/faq",
      questions: "Question one?\nAnswer one.\n\nQuestion two?\nAnswer two.",
    });

    expect(value).toContain('"@type": "FAQPage"');
    expect(value).toContain('"name": "Question one?"');
    expect(value).toContain('"text": "Answer two."');
    expect(validateFaqInput({ url: "https://example.com/faq", questions: "Only question" })).toContain("question/answer");
  });
});
