import categoriesJson from "../registry/categories.json";
import toolsJson from "../registry/tools.json";
import type { Locale, LocalizedText, ToolDefinition } from "./types";

export type { ExecutorClass, Locale, LocalizedText, ToolDefinition, ToolState } from "./types";

export const tools = toolsJson as readonly ToolDefinition[];
export const categories = categoriesJson as Readonly<Record<string, LocalizedText>>;
export const publicTools = tools.filter((tool) => tool.state === "ready");

export function getPublicTool(slug: string): ToolDefinition | undefined {
  return publicTools.find((tool) => tool.slug === slug);
}

export function localize(text: LocalizedText, locale: Locale): string {
  return text[locale];
}

export function getCategoryTitle(category: string, locale: Locale): string {
  const value = categories[category];
  return value ? value[locale] : category;
}
