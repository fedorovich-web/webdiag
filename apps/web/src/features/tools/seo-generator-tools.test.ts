import { describe, expect, it } from "vitest";
import {
  generateFaqSchema,
  generateRobotsTxt,
  generateSitemapXml,
  validateFaqInput,
  validateRobotsTxt,
  validateSitemapInput,
} from "./seo-generator-tools";

it.each(["0x1", "1e-1", "NaN", "Infinity"])("rejects non-decimal sitemap priority %s", (priority) => {
  expect(validateSitemapInput({ urls: "https://example.com/", lastmod: "", changefreq: "", priority })).toContain("Priority");
});

it.each(["0", ".5", "0.8", "1", "1.0", "+0.5", "-0"])("accepts XML decimal priority %s", (priority) => {
  expect(validateSitemapInput({ urls: "https://example.com/", lastmod: "", changefreq: "", priority })).toBeNull();
});

describe("SEO generator tools", () => {
  it.each(["NaN", "Infinity", "soon", "-1"])("rejects invalid Crawl-delay %s", (crawlDelay) => {
    expect(validateRobotsTxt({ userAgent: "*", allow: "", disallow: "", sitemap: "", crawlDelay })).not.toBeNull();
  });

  it("rejects injected robots groups and URL credentials", () => {
    expect(validateRobotsTxt({ userAgent: "*\nDisallow: /", allow: "", disallow: "", sitemap: "", crawlDelay: "" })).not.toBeNull();
    expect(validateRobotsTxt({ userAgent: "*", allow: "", disallow: "", sitemap: "https://user:private@example.com/sitemap.xml", crawlDelay: "" })).not.toBeNull();
  });

  it.each([
    { lastmod: "2026-02-30", changefreq: "weekly" },
    { lastmod: "not-a-date", changefreq: "weekly" },
    { lastmod: "2026-10-23", changefreq: "sometimes" },
  ])("rejects invalid sitemap metadata %j", (metadata) => {
    expect(validateSitemapInput({ urls: "https://example.com/", priority: "0.8", ...metadata })).not.toBeNull();
  });

  it("accepts leap days and timezone-qualified lastmod timestamps", () => {
    for (const lastmod of ["2024-02-29", "2026-10-23T12:34:56+02:00"]) {
      expect(validateSitemapInput({ urls: "https://example.com/", lastmod, changefreq: "weekly", priority: "0.8" })).toBeNull();
    }
  });

  it("rejects credential-bearing sitemap URLs without echoing private values", () => {
    const error = validateSitemapInput({ urls: "https://user:private@example.com/", lastmod: "", changefreq: "", priority: "" });
    expect(error).not.toBeNull();
    expect(error).not.toContain("private");
  });

  it("rejects incomplete FAQ blocks rather than silently dropping them", () => {
    expect(validateFaqInput({ url: "", questions: "Complete question?\nComplete answer.\n\nUnanswered question?" })).not.toBeNull();
  });

  it("keeps supplied FAQ text inside the JSON-LD script element", () => {
    const answer = '</script><script>alert("private")</script>';
    const output = generateFaqSchema({ url: "", questions: `Question?\n${answer}` });
    expect(output.match(/<\/script>/g)).toHaveLength(1);
    const payload = JSON.parse(output.replace(/^<script[^>]*>\s*/, "").replace(/\s*<\/script>$/, ""));
    expect(payload.mainEntity[0].acceptedAnswer.text).toBe(answer);
  });

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
