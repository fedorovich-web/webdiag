import type { Locale } from "@webdiag/tool-registry";
import type { CatalogTool } from "./catalog-utils";

export interface AIToolEntry {
  readonly slug: string;
  readonly titleRu: string;
  readonly titleEn: string;
  readonly descriptionRu: string;
  readonly descriptionEn: string;
  readonly category: string;
  readonly badge: string;
}

export const AI_CATALOG_TOOLS: readonly AIToolEntry[] = [
  {
    slug: "ai-audit-action-plan",
    titleRu: "AI-план исправлений сайта",
    titleEn: "AI Site Fix Action Plan",
    descriptionRu: "Строит пошаговый приоритетный план устранения SEO и технических ошибок на основе данных аудита.",
    descriptionEn: "Builds a prioritized step-by-step action plan to resolve technical and SEO issues from audit data.",
    category: "ai-tools",
    badge: "AI",
  },
  {
    slug: "ai-competitor-gap-report",
    titleRu: "AI-анализ конкурентных пробелов",
    titleEn: "AI Competitor Gap Analysis",
    descriptionRu: "Сравнивает контент и структуру страниц с конкурентами, выявляя упущенные темы и преимущества.",
    descriptionEn: "Compares content and page structure with competitors, identifying content gaps and opportunities.",
    category: "ai-tools",
    badge: "AI",
  },
  {
    slug: "ai-content-brief",
    titleRu: "AI-бриф контента и ТЗ",
    titleEn: "AI Content Brief Generator",
    descriptionRu: "Формирует структурированное техническое задание для копирайтеров с заголовками H2-H4 и LSI-словами.",
    descriptionEn: "Creates a detailed content brief with target intent, recommended H2-H4 structure, and LSI entities.",
    category: "ai-tools",
    badge: "AI",
  },
  {
    slug: "ai-content-optimizer",
    titleRu: "AI-оптимизатор текста страницы",
    titleEn: "AI Page Text Optimizer",
    descriptionRu: "Анализирует текст, улучшает читаемость и плотность ключевых вхождений без переспама и воды.",
    descriptionEn: "Optimizes copy for clarity, readability, and topic coverage without keyword stuffing.",
    category: "ai-tools",
    badge: "AI",
  },
  {
    slug: "ai-search-intent-page-fit",
    titleRu: "AI-соответствие поисковому интенту",
    titleEn: "AI Search Intent Alignment",
    descriptionRu: "Проверяет соответствие содержимого страницы реальным потребностям пользователей и поисковому запросу.",
    descriptionEn: "Evaluates whether your page accurately matches the target commercial or informational search intent.",
    category: "ai-tools",
    badge: "AI",
  },
  {
    slug: "ai-internal-linking-planner",
    titleRu: "AI-план внутренней перелинковки",
    titleEn: "AI Internal Linking Planner",
    descriptionRu: "Подбирает релевантные посадочные страницы для перелинковки и генерирует естественные анкоры.",
    descriptionEn: "Suggests contextually relevant internal link opportunities and high-converting anchor texts.",
    category: "ai-tools",
    badge: "AI",
  },









];

export function getAICatalogTools(locale: Locale): readonly CatalogTool[] {
  const isRu = locale === "ru";
  const aiHref = isRu ? "/account/ai" : "/en/account/ai";
  return AI_CATALOG_TOOLS.map((tool) => {
    const isImage = tool.slug.includes("image");
    const cost = isImage ? 2 : 1;
    const creditText = isRu
      ? `${cost} ${cost === 1 ? "кредит" : "кредита"}`
      : `${cost} ${cost === 1 ? "credit" : "credits"}`;
    return {
      slug: tool.slug,
      title: isRu ? tool.titleRu : tool.titleEn,
      description: isRu ? tool.descriptionRu : tool.descriptionEn,
      category: "ai-tools",
      categoryTitle: isRu ? "AI-инструменты" : "AI Tools",
      local: false,
      href: `${aiHref}?tool=${encodeURIComponent(tool.slug)}`,
      badge: `AI · ${creditText}`,
    };
  });
}
