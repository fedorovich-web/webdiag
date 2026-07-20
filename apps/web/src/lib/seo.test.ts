import { describe, expect, it } from "vitest";
import { publicTools } from "@webdiag/tool-registry";
import { getToolPageContent } from "../content/tool-pages";
import { pageMetadata, toolMetadata } from "./seo";
import { toolBreadcrumbJsonLd, toolItemListJsonLd, websiteJsonLd } from "./structured-data";

describe("SEO metadata", () => {
  it("builds reciprocal localized metadata", () => {
    const metadata = pageMetadata({
      locale: "en",
      title: "Example page title",
      description: "Example page description with enough detail.",
      canonical: "/en/example",
      ruPath: "/example",
      enPath: "/en/example",
    });
    expect(metadata.alternates?.canonical).toBe("/en/example");
    expect(metadata.alternates?.languages).toEqual({ ru: "/example", en: "/en/example", "x-default": "/example" });
    expect(metadata.openGraph?.locale).toBe("en_US");
    expect((metadata.twitter as { card?: string } | undefined)?.card).toBe("summary_large_image");
  });

  it("uses the editorial title and description for every tool", () => {
    for (const tool of publicTools) {
      const content = getToolPageContent(tool.slug);
      expect(content).toBeDefined();
      if (!content) continue;
      const ru = toolMetadata(content, "ru");
      const en = toolMetadata(content, "en");
      expect(ru.title).toBe(content.seoTitle.ru);
      expect(ru.description).toBe(content.metaDescription.ru);
      expect(en.title).toBe(content.seoTitle.en);
      expect(en.description).toBe(content.metaDescription.en);
    }
  });
});

describe("structured data", () => {
  it("describes the localized website", () => {
    expect(websiteJsonLd("ru")).toMatchObject({ "@type": "WebSite", inLanguage: "ru" });
    expect(websiteJsonLd("en")).toMatchObject({ "@type": "WebSite", inLanguage: "en" });
  });

  it("lists only ready tools", () => {
    const data = toolItemListJsonLd("ru");
    expect(data.numberOfItems).toBe(publicTools.length);
    expect(data.itemListElement).toHaveLength(publicTools.length);
  });

  it("creates a three-level tool breadcrumb", () => {
    const data = toolBreadcrumbJsonLd("json-formatter-validator", "en");
    expect(data?.itemListElement).toHaveLength(3);
    expect(data?.itemListElement[2]).toMatchObject({ position: 3 });
  });
});
