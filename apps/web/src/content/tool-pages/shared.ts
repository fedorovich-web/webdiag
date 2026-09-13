import type { ToolPageContent } from "../types";

const editorial = {
  state: "published" as const,
  author: "WebDiag product team",
  reviewer: "WebDiag technical review",
  lastReviewedAt: "2026-07-17",
  reviewDueAt: "2027-01-17",
};

type EditorialFields = typeof editorial;
type ToolPageInput = Omit<ToolPageContent, keyof EditorialFields | "translationGroupId"> & Partial<EditorialFields>;

export function toolPage(
  content: ToolPageInput,
): ToolPageContent {
  return {
    ...editorial,
    ...content,
    translationGroupId: `tool-${content.slug}`,
  };
}
