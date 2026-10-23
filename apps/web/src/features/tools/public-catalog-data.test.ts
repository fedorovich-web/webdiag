import { describe, expect, it } from "vitest";
import { publicTools } from "@webdiag/tool-registry";
import { ACTIVE_AI_CATALOG_TOOLS } from "./ai-tools-data";
import { getPublicCatalogTools, PUBLIC_CATALOG_TOOL_COUNT } from "./public-catalog-data";

describe("public catalog projection", () => {
  it.each(["ru", "en"] as const)("keeps %s catalog entries aligned with the public registry", (locale) => {
    const catalog = getPublicCatalogTools(locale);
    expect(catalog).toHaveLength(publicTools.length + ACTIVE_AI_CATALOG_TOOLS.length);
    expect(catalog).toHaveLength(PUBLIC_CATALOG_TOOL_COUNT);
    expect(new Set(catalog.map((tool) => tool.slug)).size).toBe(catalog.length);
    for (const tool of publicTools) {
      expect(tool.description?.[locale]).toEqual(expect.any(String));
      expect(catalog.find((entry) => entry.slug === tool.slug)).toMatchObject({
        title: tool.title[locale],
        description: tool.description?.[locale],
        category: tool.category,
      });
    }
  });

  it.each(["image-format-converter", "image-optimizer"])("discloses server processing for AVIF in %s", (slug) => {
    for (const locale of ["ru", "en"] as const) {
      const tool = getPublicCatalogTools(locale).find((entry) => entry.slug === slug);
      expect(tool?.local).toBe(false);
      expect(tool?.description).toContain("AVIF");
      expect(tool?.description).toMatch(locale === "ru" ? /сервер/ : /server/);
    }
  });
});
