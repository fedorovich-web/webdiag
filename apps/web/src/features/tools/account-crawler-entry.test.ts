import { describe, expect, it } from "vitest";
import { getAccountCrawlerEntryCopy } from "./account-crawler-entry";

describe("account crawler public entry", () => {
  it("routes RU and EN visitors to the authenticated project workspace", () => {
    expect(getAccountCrawlerEntryCopy("whole-site-audit", "ru").href).toBe("/account");
    expect(getAccountCrawlerEntryCopy("duplicate-meta-checker", "en").href).toBe("/en/account");
  });

  it("describes one bounded project crawl instead of separate or complete scans", () => {
    for (const slug of ["whole-site-audit", "duplicate-meta-checker", "orphan-page-finder"] as const) {
      const copy = getAccountCrawlerEntryCopy(slug, "en");
      expect(copy.limit).toContain("25 HTML pages");
      expect(copy.limit).toContain("does not execute JavaScript");
      expect(copy.limit).toContain("does not prove complete site coverage");
    }
  });

  it("labels unlinked URLs as candidates rather than proven orphan pages", () => {
    const copy = getAccountCrawlerEntryCopy("orphan-page-finder", "en");
    expect(copy.title).toContain("candidates");
    expect(copy.description).toContain("sitemap");
    expect(copy.description).toContain("internal links");
  });
});
