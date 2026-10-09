import type { Locale } from "@webdiag/tool-registry";
import type { AIOutput } from "./account-ai-contract";

const LABELS: Record<string, readonly [string, string]> = {
  summary: ["Вывод", "Summary"], actions: ["План работ", "Actions"],
  suggested_title: ["Заголовок", "Suggested title"], sections: ["Разделы", "Sections"],
  heading: ["Заголовок раздела", "Heading"], purpose: ["Цель", "Purpose"],
  coverage: ["Подтверждённые факты", "Evidence"], excerpt: ["Фрагмент", "Excerpt"],
  source_fact_index: ["Номер исходного факта", "Source fact index"], warnings: ["Ограничения", "Warnings"],
  revised_content: ["Обновлённый текст", "Revised content"], changes: ["Изменения", "Changes"],
  kind: ["Тип изменения", "Change type"], before_excerpt: ["До", "Before"],
  after_excerpt: ["После", "After"], rationale: ["Обоснование", "Rationale"],
  preserved_fact_indexes: ["Сохранённые факты", "Preserved fact indexes"],
  inferred_intent: ["Поисковое намерение", "Search intent"], confidence: ["Уверенность", "Confidence"],
  fit: ["Соответствие страницы", "Page fit"], evidence: ["Основания", "Evidence"],
  gaps: ["Пробелы", "Gaps"], recommendations: ["Рекомендации", "Recommendations"],
  topic: ["Тема", "Topic"], own_evidence: ["Данные своей страницы", "Own page evidence"],
  competitor_evidence: ["Данные конкурента", "Competitor evidence"], page_index: ["Номер страницы", "Page index"],
  recommendation: ["Рекомендация", "Recommendation"], proposals: ["Предложения ссылок", "Link proposals"],
  source_page_index: ["Исходная страница", "Source page"], target_page_index: ["Целевая страница", "Target page"],
  suggested_anchor: ["Текст ссылки", "Suggested anchor"], source_evidence: ["Основание в источнике", "Source evidence"],
  target_evidence: ["Основание на целевой странице", "Target evidence"], issue_ids: ["Проблемы аудита", "Audit issues"],
  title: ["Задача", "Action"], steps: ["Шаги", "Steps"], verification: ["Проверка", "Verification"],
  affected_urls: ["Страницы", "Affected pages"],
};

const VALUES: Record<string, string> = {
  low: "Низкая", medium: "Средняя", high: "Высокая", aligned: "Соответствует", partial: "Частично соответствует",
  misaligned: "Не соответствует", insufficient_evidence: "Недостаточно данных", unknown: "Не определено",
  informational: "Информационное", commercial: "Коммерческое", transactional: "Транзакционное",
  navigational: "Навигационное", local: "Локальное", clarity: "Ясность", structure: "Структура",
  relevance: "Релевантность", style: "Стиль",
};

function ResultValue({ value, locale, depth = 0 }: { value: unknown; locale: Locale; depth?: number }) {
  if (value === null || value === undefined || depth > 5) return null;
  if (Array.isArray(value)) return value.length ? <ol>{value.map((item, index) => <li key={index}><ResultValue value={item} locale={locale} depth={depth + 1} /></li>)}</ol> : <span>{locale === "ru" ? "Нет" : "None"}</span>;
  if (typeof value === "object") return <dl>{Object.entries(value).map(([key, item]) => <div key={key}>
    <dt><strong>{LABELS[key]?.[locale === "ru" ? 0 : 1] ?? key}</strong></dt>
    <dd><ResultValue value={item} locale={locale} depth={depth + 1} /></dd>
  </div>)}</dl>;
  const text = String(value);
  return <span style={{ whiteSpace: "pre-wrap" }}>{locale === "ru" ? (VALUES[text] ?? text) : text}</span>;
}

export function AccountAIResult({ locale, output }: { locale: Locale; output: AIOutput }) {
  return <div className="wd-ai-text-output"><ResultValue value={output} locale={locale} /></div>;
}
