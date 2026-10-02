import {
  categories as registryCategories,
  getCategoryTitle,
  localize,
  publicTools,
  type Locale,
} from "@webdiag/tool-registry";
import { ToolCatalog } from "./tool-catalog";
import { getAICatalogTools } from "./ai-tools-data";
import type { CatalogTool } from "./catalog-utils";

export function ToolList({ locale }: { locale: Locale }) {
  const isRu = locale === "ru";
  const categoryCounts = new Map<string, number>();

  const publicCatalogTools: CatalogTool[] = publicTools.map((tool) => {
    categoryCounts.set(tool.category, (categoryCounts.get(tool.category) ?? 0) + 1);
    return {
      slug: tool.slug,
      title: localize(tool.title, locale),
      description: tool.description ? localize(tool.description, locale) : "",
      category: tool.category,
      categoryTitle: getCategoryTitle(tool.category, locale),
      local: tool.executorClass === "browser",
    };
  });

  const aiTools = getAICatalogTools(locale);
  categoryCounts.set("ai-tools", aiTools.length);

  const allTools = [...publicCatalogTools, ...aiTools];

  const categories = [
    ...Object.keys(registryCategories)
      .filter((id) => categoryCounts.has(id))
      .map((id) => ({
        id,
        count: categoryCounts.get(id) ?? 0,
        title: getCategoryTitle(id, locale),
      })),
    {
      id: "ai-tools",
      count: aiTools.length,
      title: isRu ? "AI-инструменты" : "AI Tools",
    },
  ];

  return <ToolCatalog locale={locale} tools={allTools} categories={categories} />;
}
