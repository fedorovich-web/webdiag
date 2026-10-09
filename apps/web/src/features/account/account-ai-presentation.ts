import type { Locale } from "@webdiag/tool-registry";
import { AI_TOOL_IDS, type AIToolId, type AIRunState } from "./account-ai-contract";
import { AI_CATALOG_TOOLS } from "../tools/ai-tools-data";
import { STUDIO_TOOL_IDS } from "./account-ai-studio-input";

export interface AIWorkspaceToolDescriptor {
  readonly id: AIToolId;
  readonly title: string;
  readonly summary: string;
  readonly limits: string;
  readonly workflowOrder: number;
}

const DESCRIPTORS: Record<Locale, readonly AIWorkspaceToolDescriptor[]> = {
  ru: [
    {
      id: "ai_audit_action_plan",
      title: "AI-план исправлений",
      summary: "Собирает приоритетный порядок действий по сохранённой проверке.",
      limits: "Только данные выбранной сохранённой проверки; без новых метрик.",
      workflowOrder: 1,
    },
    {
      id: "ai_competitor_gap_report",
      title: "AI-анализ конкурентных пробелов",
      summary: "Помогает разложить подтверждённые различия по страницам и темам.",
      limits: "Доступен после добавления подтверждённых данных конкурентов.",
      workflowOrder: 2,
    },
    {
      id: "ai_content_brief",
      title: "AI-бриф контента",
      summary: "Формирует рабочий бриф на основе цели страницы и доступных сигналов.",
      limits: "Не заменяет редакторскую проверку и не обещает позиции в поиске.",
      workflowOrder: 3,
    },
    {
      id: "ai_content_optimizer",
      title: "AI-оптимизатор контента",
      summary: "Предлагает точечные правки для выбранного текста и его структуры.",
      limits: "Не публикует изменения и не изменяет сайт автоматически.",
      workflowOrder: 4,
    },
    {
      id: "ai_search_intent_page_fit",
      title: "AI-соответствие интента странице",
      summary: "Помогает проверить, отвечает ли страница заявленному поисковому намерению.",
      limits: "Вывод требует проверки исходного запроса и содержимого страницы.",
      workflowOrder: 5,
    },
    {
      id: "ai_internal_linking_planner",
      title: "AI-план внутренних ссылок",
      summary: "Подсказывает безопасные варианты связать подтверждённые страницы проекта.",
      limits: "Только рекомендации; ссылки не добавляются без явного действия пользователя.",
      workflowOrder: 6,
    },
  ],
  en: [
    {
      id: "ai_audit_action_plan",
      title: "AI fix plan",
      summary: "Builds a prioritized action order from a saved audit.",
      limits: "Uses only the selected saved audit; it does not invent new metrics.",
      workflowOrder: 1,
    },
    {
      id: "ai_competitor_gap_report",
      title: "AI competitor gap",
      summary: "Organizes confirmed differences across pages and topics.",
      limits: "Available after confirmed competitor evidence has been added.",
      workflowOrder: 2,
    },
    {
      id: "ai_content_brief",
      title: "AI content brief",
      summary: "Creates a working brief from page goals and available signals.",
      limits: "It does not replace editorial review or promise search positions.",
      workflowOrder: 3,
    },
    {
      id: "ai_content_optimizer",
      title: "AI content optimizer",
      summary: "Suggests focused edits for selected copy and structure.",
      limits: "It never publishes changes or mutates the site automatically.",
      workflowOrder: 4,
    },
    {
      id: "ai_search_intent_page_fit",
      title: "AI search intent fit",
      summary: "Helps check whether a page answers the stated search intent.",
      limits: "The result still needs review against the query and page content.",
      workflowOrder: 5,
    },
    {
      id: "ai_internal_linking_planner",
      title: "AI internal linking plan",
      summary: "Suggests safe ways to connect confirmed project pages.",
      limits: "Recommendations only; links are never added without an explicit action.",
      workflowOrder: 6,
    },
  ],
};

const RUN_STATE_LABELS: Record<Locale, Record<AIRunState, string>> = {
  ru: {
    pending: "В очереди",
    running: "В работе",
    succeeded: "Готово к проверке",
    failed: "Не выполнено",
    provider_unknown: "Результат нужно проверить",
    deleted: "Удалён",
  },
  en: {
    pending: "Queued",
    running: "Processing",
    succeeded: "Ready for review",
    failed: "Could not complete",
    provider_unknown: "Outcome needs review",
    deleted: "Deleted",
  },
};

export function aiToolDescriptors(locale: Locale): readonly AIWorkspaceToolDescriptor[] {
  const restored = STUDIO_TOOL_IDS.map((id, index): AIWorkspaceToolDescriptor => {
    const entry = AI_CATALOG_TOOLS.find((tool) => tool.slug === id.replaceAll("_", "-"));
    if (!entry) throw new Error(`Missing AI catalog description: ${id}`);
    return { id, title: locale === "ru" ? entry.titleRu : entry.titleEn, summary: locale === "ru" ? entry.descriptionRu : entry.descriptionEn, limits: locale === "ru" ? "Результат сохраняется в аккаунте и требует проверки." : "Results are saved to your account and need review.", workflowOrder: index + 7 };
  });
  return [...DESCRIPTORS[locale], ...restored];
}

export function aiToolDescriptor(locale: Locale, toolId: AIToolId): AIWorkspaceToolDescriptor {
  const descriptor = aiToolDescriptors(locale).find((item) => item.id === toolId);
  if (!descriptor || !AI_TOOL_IDS.includes(toolId)) {
    throw new Error(`Unknown AI tool: ${toolId}`);
  }
  return descriptor;
}

export function aiRunStateLabel(locale: Locale, state: AIRunState): string {
  return RUN_STATE_LABELS[locale][state];
}

export function aiWorkspaceEmptyCopy(locale: Locale): string {
  return locale === "ru"
    ? "AI-инструменты временно недоступны. Повторите попытку позже."
    : "AI tools are temporarily unavailable. Try again later.";
}
