import { expect, it } from "vitest";
import { getPublicCatalogTools, PUBLIC_CATALOG_TOOL_COUNT } from "../features/tools/public-catalog-data";
import { toolItemListJsonLd } from "./structured-data";

it.each(["ru", "en"] as const)("%s catalog SEO lists the same active tools and real destinations as the page", (locale) => {
  const catalog = getPublicCatalogTools(locale);
  const schema = toolItemListJsonLd(locale);
  expect(schema.numberOfItems).toBe(PUBLIC_CATALOG_TOOL_COUNT);
  expect(schema.itemListElement).toHaveLength(catalog.length);
  expect(schema.itemListElement.some((item) => item.url.includes("/account/ai?tool="))).toBe(true);
  expect(schema.itemListElement.some((item) => item.url.includes("ai-faq-studio"))).toBe(false);
  expect(schema.itemListElement.some((item) => item.url.includes("/tools/faq-schema-generator"))).toBe(true);
});
