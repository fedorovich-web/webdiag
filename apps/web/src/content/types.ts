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

export interface HomeToolCardContent {
  readonly slug: string;
  readonly title: LocalizedValue;
  readonly description: LocalizedValue;
}

export interface HomeStepContent {
  readonly title: LocalizedValue;
  readonly description: LocalizedValue;
}

export interface HomeResourceContent {
  readonly title: LocalizedValue;
  readonly description: LocalizedValue;
  readonly href: LocalizedValue;
}

export interface HomeContent {
  readonly seoTitle: LocalizedValue;
  readonly eyebrow: LocalizedValue;
  readonly title: LocalizedValue;
  readonly description: LocalizedValue;
  readonly primaryAction: LocalizedValue;
  readonly secondaryAction: LocalizedValue;
  readonly heroNote: LocalizedValue;
  readonly trustFacts: readonly LocalizedValue[];

  readonly platformsTitle: LocalizedValue;
  readonly platforms: readonly string[];

  readonly popularToolsTitle: LocalizedValue;
  readonly popularToolsDescription: LocalizedValue;
  readonly popularToolsAction: LocalizedValue;
  readonly popularTools: readonly HomeToolCardContent[];

  readonly processTitle: LocalizedValue;
  readonly processDescription: LocalizedValue;
  readonly processSteps: readonly HomeStepContent[];

  readonly checksTitle: LocalizedValue;
  readonly checksDescription: LocalizedValue;
  readonly auditAreas: readonly HomeAuditArea[];

  readonly reportTitle: LocalizedValue;
  readonly reportDescription: LocalizedValue;
  readonly reportAction: LocalizedValue;

  readonly monitoringTitle: LocalizedValue;
  readonly monitoringDescription: LocalizedValue;
  readonly monitoringBullets: readonly LocalizedValue[];
  readonly monitoringAction: LocalizedValue;

  readonly knowledgeTitle: LocalizedValue;
  readonly knowledgeDescription: LocalizedValue;
  readonly knowledgeAction: LocalizedValue;
  readonly resources: readonly HomeResourceContent[];

  readonly faqTitle: LocalizedValue;
  readonly faq: readonly LocalizedFaq[];

  readonly finalTitle: LocalizedValue;
  readonly finalDescription: LocalizedValue;

  readonly categories: readonly HomeCategoryContent[];
}

export function localizeValue(value: LocalizedValue, locale: Locale): string {
  return value[locale];
}
