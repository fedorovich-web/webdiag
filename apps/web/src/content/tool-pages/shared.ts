import type { ToolPageContent } from "../types";

const editorial = {
  state: "published" as const,
  author: "WebDiag product team",
  reviewer: "WebDiag technical review",
  lastReviewedAt: "2026-07-17",
  reviewDueAt: "2027-01-17",
};

export function toolPage(
  content: Omit<ToolPageContent, keyof typeof editorial | "translationGroupId">,
): ToolPageContent {
  return {
    ...content,
    ...editorial,
    translationGroupId: `tool-${content.slug}`,
  };
}
