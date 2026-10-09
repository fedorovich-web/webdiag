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
    descriptionRu: "Формирует бриф, структуру текста и требования к материалу на основе ваших фактов, цели и аудитории.",
    descriptionEn: "Creates a content brief, outline, and editorial requirements from your facts, objective, and audience.",
    category: "ai-tools",
    badge: "AI",
  },
  {
    slug: "ai-content-optimizer",
    titleRu: "AI-оптимизатор текста страницы",
    titleEn: "AI Page Text Optimizer",
    descriptionRu: "Предлагает правки текста публичной страницы и показывает фрагменты до и после изменения.",
    descriptionEn: "Proposes revisions to a public page's text and shows before-and-after excerpts.",
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
    descriptionEn: "Suggests internal links and anchor texts grounded in the supplied page content.",
    category: "ai-tools",
    badge: "AI",
  },
  {
    slug: "ai-meta-serp-studio",
    titleRu: "AI-генератор Title и Description",
    titleEn: "AI Meta Tags Generator",
    descriptionRu: "Предлагает три варианта title и description по предоставленным данным страницы.",
    descriptionEn: "Suggests three title and description variants from the page facts you provide.",
    category: "ai-tools",
    badge: "AI",
  },
  {
    slug: "ai-schema-studio",
    titleRu: "AI-генератор Schema.org микроразметки",
    titleEn: "AI Schema.org JSON-LD Generator",
    descriptionRu: "Собирает JSON-LD для страницы, статьи, организации, местного бизнеса или товара только из ваших фактов.",
    descriptionEn: "Builds JSON-LD for a page, article, organization, local business, or product using only your source facts.",
    category: "ai-tools",
    badge: "AI",
  },
  {
    slug: "ai-faq-studio",
    titleRu: "AI-генератор вопросов и ответов (FAQ)",
    titleEn: "AI FAQ & Q&A Generator",
    descriptionRu: "Составляет вопросы и ответы по вашему тексту и приводит подтверждающие фрагменты источника.",
    descriptionEn: "Creates questions and answers from your text with supporting source excerpts.",
    category: "ai-tools",
    badge: "AI",
  },
  {
    slug: "ai-alt-text-studio",
    titleRu: "AI-генератор Alt-текстов для картинок",
    titleEn: "AI Image Alt Text Generator",
    descriptionRu: "Формирует точные и лаконичные описания alt для изображений с учетом контекста страницы и доступности.",
    descriptionEn: "Creates descriptive, accessible alt text for images to enhance image SEO and screen reader usability.",
    category: "ai-tools",
    badge: "AI",
  },
  {
    slug: "ai-redirect-migration-mapper",
    titleRu: "AI-карта редиректов при миграции",
    titleEn: "AI Redirect Migration Mapper",
    descriptionRu: "Сопоставляет старые и новые URL при переезде сайта или смене структуры, исключая цепочки редиректов.",
    descriptionEn: "Maps old and new URLs during site migrations or structure overhauls, eliminating redirect loops.",
    category: "ai-tools",
    badge: "AI",
  },
  {
    slug: "ai-localization-workbench",
    titleRu: "AI-локализация контента",
    titleEn: "AI SEO Localization Workbench",
    descriptionRu: "Переводит контент между русским и английским с учётом вашего словаря и неизменяемых фрагментов.",
    descriptionEn: "Translates content between Russian and English while preserving your glossary and verbatim constraints.",
    category: "ai-tools",
    badge: "AI",
  },
  {
    slug: "ai-regex-workbench",
    titleRu: "AI-генератор Regex для robots и редиректов",
    titleEn: "AI Regex Workbench for SEO",
    descriptionRu: "Предлагает регулярное выражение для Python, JavaScript или RE2 и план проверки на ваших примерах.",
    descriptionEn: "Proposes a Python, JavaScript, or RE2 pattern and a verification plan using your examples.",
    category: "ai-tools",
    badge: "AI",
  },
  {
    slug: "ai-image-studio",
    titleRu: "AI-генератор веб-графики",
    titleEn: "AI Web Image Studio",
    descriptionRu: "Создаёт изображение по описанию и сохраняет его в приватном хранилище вашего кабинета.",
    descriptionEn: "Generates an image from your description and saves it privately in your account.",
    category: "ai-tools",
    badge: "AI",
  },
  {
    slug: "ai-image-edit-studio",
    titleRu: "AI-редактор и ремастер изображений",
    titleEn: "AI Image Remaster & Edit Studio",
    descriptionRu: "Улучшает четкость, удаляет артефакты и адаптирует пропорции картинок под сетку каталога.",
    descriptionEn: "Enhances visual clarity, removes compression noise, and reformats aspect ratios for page layouts.",
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
