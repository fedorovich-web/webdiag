import { getCategoryTitle, localize, publicTools, type Locale } from "@webdiag/tool-registry";
import { homeContent } from "../../content/home";
import { localizeValue } from "../../content/types";
import { ToolCatalog } from "./tool-catalog";

export function ToolList({ locale }: { locale: Locale }) {
  const catalogCategoryIds = new Set(homeContent.categories.map((category) => category.id));
  const categoryCounts = new Map<string, number>();
  const tools = publicTools
    .filter((tool) => catalogCategoryIds.has(tool.category))
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
  const categories = homeContent.categories.map((category) => ({
    id: category.id,
    count: categoryCounts.get(category.id) ?? 0,
    title: localizeValue(category.title, locale),
  }));
  return <ToolCatalog locale={locale} tools={tools} categories={categories} />;
}
