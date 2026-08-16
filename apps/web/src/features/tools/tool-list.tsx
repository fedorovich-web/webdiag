import {
  categories as registryCategories,
  getCategoryTitle,
  localize,
  publicTools,
  type Locale,
} from "@webdiag/tool-registry";
import { ToolCatalog } from "./tool-catalog";

export function ToolList({ locale }: { locale: Locale }) {
  const categoryCounts = new Map<string, number>();
  const tools = publicTools
    .map((tool) => {
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
  const categories = Object.keys(registryCategories)
    .filter((id) => categoryCounts.has(id))
    .map((id) => ({
      id,
      count: categoryCounts.get(id) ?? 0,
      title: getCategoryTitle(id, locale),
    }));
  return <ToolCatalog locale={locale} tools={tools} categories={categories} />;
}
