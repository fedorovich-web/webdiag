import type { Locale } from "@webdiag/tool-registry";

export type EditorialState = "draft" | "review" | "published" | "outdated" | "archived";

export interface LocalizedValue {
  readonly ru: string;
  readonly en: string;
}

export interface LocalizedFaq {
  readonly question: LocalizedValue;
  readonly answer: LocalizedValue;
}

export interface ToolPageContent {
  readonly slug: string;
  readonly translationGroupId: string;
  readonly state: EditorialState;
  readonly seoTitle: LocalizedValue;
  readonly metaDescription: LocalizedValue;
  readonly h1: LocalizedValue;
  readonly lead: LocalizedValue;
  readonly quickFacts: readonly LocalizedValue[];
  readonly howToSteps: readonly LocalizedValue[];
  readonly supportedFeatures: readonly LocalizedValue[];
  readonly limitations: readonly LocalizedValue[];
  readonly useCases: readonly LocalizedValue[];
  readonly technicalNotes: readonly LocalizedValue[];
  readonly faq: readonly LocalizedFaq[];
  readonly relatedToolSlugs: readonly string[];
  readonly sourceUrls: readonly string[];
  readonly author: string;
  readonly reviewer: string;
  readonly lastReviewedAt: string;
  readonly reviewDueAt: string;
}

export interface HomeTask {
  readonly slug: string;
  readonly title: LocalizedValue;
  readonly description: LocalizedValue;
}

export interface HomeCategoryContent {
  readonly id: string;
  readonly title: LocalizedValue;
  readonly description: LocalizedValue;
  readonly toolSlugs: readonly string[];
}

export interface HomeAuditArea {
  readonly id: string;
  readonly title: LocalizedValue;
  readonly description: LocalizedValue;
  readonly checks: readonly LocalizedValue[];
}

export interface HomeContent {
  readonly eyebrow: LocalizedValue;
  readonly title: LocalizedValue;
  readonly description: LocalizedValue;
  readonly primaryAction: LocalizedValue;
  readonly secondaryAction: LocalizedValue;
  readonly trustFacts: readonly LocalizedValue[];
  readonly quickTasks: readonly HomeTask[];
  readonly categories: readonly HomeCategoryContent[];
  readonly auditAreas: readonly HomeAuditArea[];
  readonly faq: readonly LocalizedFaq[];
}

export function localizeValue(value: LocalizedValue, locale: Locale): string {
  return value[locale];
}
