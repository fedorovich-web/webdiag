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
  {
    slug: "ai-meta-tags-generator",
    titleRu: "AI-генератор Title и Description",
    titleEn: "AI Meta Tags Generator",
    descriptionRu: "Создает кликабельные мета-теги с учетом лимитов символов поисковых систем Яндекс и Google.",
    descriptionEn: "Generates high-CTR Title and Meta Description tags tailored to Google and Yandex search snippets.",
    category: "ai-tools",
    badge: "AI",
  },
  {
    slug: "ai-schema-generator",
    titleRu: "AI-генератор Schema.org микроразметки",
    titleEn: "AI Schema.org JSON-LD Generator",
    descriptionRu: "Создает безошибочный JSON-LD код для статей, товаров, организаций, курсов и FAQ страниц.",
    descriptionEn: "Generates validated JSON-LD structured data for articles, products, organizations, and FAQs.",
    category: "ai-tools",
    badge: "AI",
  },
  {
    slug: "ai-faq-generator",
    titleRu: "AI-генератор вопросов и ответов (FAQ)",
    titleEn: "AI FAQ & Q&A Generator",
    descriptionRu: "Находит частые вопросы пользователей по тематике и составляет развернутые экспертные ответы.",
    descriptionEn: "Discovers frequent customer questions and generates structured, expert answers ready for FAQ blocks.",
    category: "ai-tools",
    badge: "AI",
  },
  {
    slug: "ai-alt-generator",
    titleRu: "AI-генератор Alt-текстов для картинок",
    titleEn: "AI Image Alt Text Generator",
    descriptionRu: "Формирует точные и лаконичные описания alt для изображений с учетом контекста страницы и доступности.",
    descriptionEn: "Creates descriptive, accessible alt text for images to enhance image SEO and screen reader usability.",
    category: "ai-tools",
    badge: "AI",
  },
];

export function getAICatalogTools(locale: Locale): readonly CatalogTool[] {
  const isRu = locale === "ru";
  const aiHref = isRu ? "/account/ai" : "/en/account/ai";
  return AI_CATALOG_TOOLS.map((tool) => ({
    slug: tool.slug,
    title: isRu ? tool.titleRu : tool.titleEn,
    description: isRu ? tool.descriptionRu : tool.descriptionEn,
    category: "ai-tools",
    categoryTitle: isRu ? "AI-инструменты" : "AI Tools",
    local: false,
    href: `${aiHref}?tool=${encodeURIComponent(tool.slug)}`,
    badge: tool.badge,
  }));
}
