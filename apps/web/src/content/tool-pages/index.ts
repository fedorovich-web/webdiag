import type { Locale } from "@webdiag/tool-registry";
import type { ToolPageContent } from "../types";
import { cssDesignToolPages } from "./css-design";
import { developmentDataToolPages } from "./development-data";
import { mediaUtilityToolPages } from "./media-utilities";

export const toolPageContents = [
  ...developmentDataToolPages,
  ...cssDesignToolPages,
  ...mediaUtilityToolPages,
] as const satisfies readonly ToolPageContent[];

const toolPageContentBySlug = new Map(toolPageContents.map((content) => [content.slug, content]));

export function getToolPageContent(slug: string): ToolPageContent | undefined {
  return toolPageContentBySlug.get(slug);
}

export function localizeContent(value: { readonly ru: string; readonly en: string }, locale: Locale): string {
  return value[locale];
}
