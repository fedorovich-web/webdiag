export interface CatalogTool {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly categoryTitle: string;
  readonly local: boolean;
}

export function normalizeSearch(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

export function filterCatalogTools(tools: readonly CatalogTool[], query: string, category: string): CatalogTool[] {
  const normalized = normalizeSearch(query);
  return tools.filter((tool) => {
    if (category !== "all" && tool.category !== category) return false;
    if (!normalized) return true;
    return normalizeSearch(`${tool.title} ${tool.description} ${tool.categoryTitle}`).includes(normalized);
  });
}

export function safeInitialCategory(value: string | undefined, categories: readonly string[]): string {
  return value && categories.includes(value) ? value : "all";
}
