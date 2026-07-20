import { describe, expect, it } from "vitest";
import { publicTools, tools } from "@webdiag/tool-registry";
import { toolPageContents } from "./tool-pages";

const readySlugs = new Set(publicTools.map((tool) => tool.slug));
const internalSlugs = new Set(tools.filter((tool) => tool.state !== "ready").map((tool) => tool.slug));

describe("tool editorial content", () => {
  it("covers every ready tool exactly once and no internal tools", () => {
    const slugs = toolPageContents.map((content) => content.slug);
    expect(slugs).toHaveLength(publicTools.length);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(slugs)).toEqual(readySlugs);
    for (const slug of slugs) expect(internalSlugs.has(slug)).toBe(false);
  });

  it("contains complete RU and EN editorial fields", () => {
    for (const content of toolPageContents) {
      expect(content.state).toBe("published");
      for (const value of [content.seoTitle, content.h1]) {
        expect(value.ru.trim().length).toBeGreaterThan(15);
        expect(value.en.trim().length).toBeGreaterThan(15);
      }
      for (const value of [content.metaDescription, content.lead]) {
        expect(value.ru.trim().length).toBeGreaterThan(45);
        expect(value.en.trim().length).toBeGreaterThan(45);
      }
      expect(content.quickFacts.length).toBeGreaterThanOrEqual(3);
      expect(content.howToSteps.length).toBeGreaterThanOrEqual(3);
      expect(content.supportedFeatures.length).toBeGreaterThanOrEqual(3);
      expect(content.limitations.length).toBeGreaterThanOrEqual(2);
      expect(content.useCases.length).toBeGreaterThanOrEqual(3);
      expect(content.technicalNotes.length).toBeGreaterThanOrEqual(2);
      expect(content.faq.length).toBeGreaterThanOrEqual(2);
      expect(content.sourceUrls.every((url) => url.startsWith("https://"))).toBe(true);
    }
  });

  it("links only to other ready tools", () => {
    for (const content of toolPageContents) {
      expect(content.relatedToolSlugs).not.toContain(content.slug);
      for (const slug of content.relatedToolSlugs) expect(readySlugs.has(slug)).toBe(true);
    }
  });

  it("keeps localized page titles unique", () => {
    for (const locale of ["ru", "en"] as const) {
      const titles = toolPageContents.map((content) => content.seoTitle[locale]);
      const headings = toolPageContents.map((content) => content.h1[locale]);
      expect(new Set(titles).size).toBe(titles.length);
      expect(new Set(headings).size).toBe(headings.length);
    }
  });

  it("states the implemented image output formats", () => {
    for (const content of toolPageContents.filter((item) => item.slug.startsWith("image-") && item.slug !== "image-aspect-ratio-calculator")) {
      const text = JSON.stringify(content);
      expect(text).toContain("PNG");
      expect(text).toContain("JPEG");
      expect(text).toContain("WebP");
    }
  });
});
