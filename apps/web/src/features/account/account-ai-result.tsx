import type { Locale } from "@webdiag/tool-registry";
import type { AIOutput } from "./account-ai-contract";
import { isPrivateImageOutput } from "./account-ai-restored-contract";
import { privateAIArtifactPath } from "./account-ai-client";

const LABELS: Record<string, readonly [string, string]> = {
  summary: ["Вывод", "Summary"],
  actions: ["План работ", "Actions"],
  suggested_title: ["Заголовок", "Suggested title"],
  sections: ["Разделы", "Sections"],
  heading: ["Заголовок раздела", "Heading"],
  purpose: ["Цель", "Purpose"],
  coverage: ["Подтверждённые факты", "Evidence"],
  excerpt: ["Фрагмент", "Excerpt"],
  source_fact_index: ["Номер исходного факта", "Source fact index"],
  warnings: ["Ограничения", "Warnings"],
  revised_content: ["Обновлённый текст", "Revised content"],
  changes: ["Изменения", "Changes"],
  kind: ["Тип изменения", "Change type"],
  before_excerpt: ["До", "Before"],
  after_excerpt: ["После", "After"],
  rationale: ["Обоснование", "Rationale"],
  preserved_fact_indexes: ["Сохранённые факты", "Preserved fact indexes"],
  inferred_intent: ["Поисковое намерение", "Search intent"],
  confidence: ["Уверенность", "Confidence"],
  fit: ["Соответствие страницы", "Page fit"],
  evidence: ["Основания", "Evidence"],
  gaps: ["Пробелы", "Gaps"],
  recommendations: ["Рекомендации", "Recommendations"],
  topic: ["Тема", "Topic"],
  own_evidence: ["Данные своей страницы", "Own page evidence"],
  competitor_evidence: ["Данные конкурента", "Competitor evidence"],
  page_index: ["Номер страницы", "Page index"],
  recommendation: ["Рекомендация", "Recommendation"],
  proposals: ["Предложения ссылок", "Link proposals"],
  source_page_index: ["Исходная страница", "Source page"],
  target_page_index: ["Целевая страница", "Target page"],
  suggested_anchor: ["Текст ссылки", "Suggested anchor"],
  source_evidence: ["Основание в источнике", "Source evidence"],
  target_evidence: ["Основание на целевой странице", "Target evidence"],
  issue_ids: ["Проблемы аудита", "Audit issues"],
  title: ["Задача", "Action"],
  steps: ["Шаги", "Steps"],
  verification: ["Проверка", "Verification"],
  affected_urls: ["Страницы", "Affected pages"],
  variants: ["Варианты метатегов", "Meta variants"],
  description: ["Описание", "Description"],
  json_ld: ["Разметка JSON-LD", "JSON-LD markup"],
  property_sources: ["Источники свойств", "Property sources"],
  items: ["Вопросы и ответы", "Questions and answers"],
  question: ["Вопрос", "Question"],
  answer: ["Ответ", "Answer"],
  alt_text: ["Alt-текст", "Alt text"],
  decorative: ["Декоративное изображение", "Decorative image"],
  mappings: ["Карта миграции", "Migration map"],
  old_page_index: ["Старая страница", "Old page"],
  action: ["Действие", "Action"],
  old_evidence: ["Основание на старой странице", "Old page evidence"],
  localized_content: ["Переведённый текст", "Localized text"],
  glossary_usages: ["Использование глоссария", "Glossary usage"],
  glossary_index: ["Термин глоссария", "Glossary term"],
  source_excerpt: ["Исходный фрагмент", "Source excerpt"],
  target_excerpt: ["Переведённый фрагмент", "Target excerpt"],
  preserved_constraint_indexes: ["Сохранённые фрагменты", "Preserved excerpts"],
  dialect: ["Диалект", "Dialect"],
  pattern: ["Регулярное выражение", "Regular expression"],
  validation_status: ["Статус проверки", "Validation status"],
  case_plan: ["План проверки примеров", "Case test plan"],
  case_index: ["Пример", "Case"],
  expected_match: ["Ожидается совпадение", "Expected match"],
  explanation: ["Объяснение", "Explanation"],
};

const VALUES: Record<string, string> = {
  low: "Низкая",
  medium: "Средняя",
  high: "Высокая",
  aligned: "Соответствует",
  partial: "Частично соответствует",
  misaligned: "Не соответствует",
  insufficient_evidence: "Недостаточно данных",
  unknown: "Не определено",
  informational: "Информационное",
  commercial: "Коммерческое",
  transactional: "Транзакционное",
  navigational: "Навигационное",
  local: "Локальное",
  clarity: "Ясность",
  structure: "Структура",
  relevance: "Релевантность",
  style: "Стиль",
  unverified: "Не проверено исполнением",
  redirect: "Редирект",
  no_match: "Соответствие не найдено",
};

const ENUM_FIELDS = new Set([
  "inferred_intent",
  "confidence",
  "fit",
  "kind",
  "validation_status",
  "action",
]);

function ResultValue({
  value,
  locale,
  depth = 0,
  field,
}: {
  value: unknown;
  locale: Locale;
  depth?: number;
  field?: string;
}) {
  if (value === null || value === undefined)
    return <span>{locale === "ru" ? "Не указано" : "Not specified"}</span>;
  if (depth > 5) return null;
  if (typeof value === "boolean")
    return (
      <span>
        {locale === "ru" ? (value ? "Да" : "Нет") : value ? "Yes" : "No"}
      </span>
    );
  if (Array.isArray(value))
    return value.length ? (
      <ol>
        {value.map((item, index) => (
          <li key={index}>
            <ResultValue value={item} locale={locale} depth={depth + 1} />
          </li>
        ))}
      </ol>
    ) : (
      <span>{locale === "ru" ? "Нет" : "None"}</span>
    );
  if (typeof value === "object")
    return (
      <dl>
        {Object.entries(value).map(([key, item]) => (
          <div key={key}>
            <dt>
              <strong>
                {Object.hasOwn(LABELS, key)
                  ? LABELS[key]?.[locale === "ru" ? 0 : 1]
                  : key}
              </strong>
            </dt>
            <dd>
              <ResultValue
                value={item}
                locale={locale}
                depth={depth + 1}
                field={key}
              />
            </dd>
          </div>
        ))}
      </dl>
    );
  const text = String(value);
  const translated =
    locale === "ru" &&
    field !== undefined &&
    ENUM_FIELDS.has(field) &&
    Object.hasOwn(VALUES, text)
      ? VALUES[text]
      : text;
  return <span style={{ whiteSpace: "pre-wrap" }}>{translated}</span>;
}

export function AccountAIResult({
  locale,
  output,
  runId,
}: {
  locale: Locale;
  output: AIOutput;
  runId?: string;
}) {
  if (isPrivateImageOutput(output)) {
    if (!runId)
      return (
        <p>
          {locale === "ru"
            ? "Откройте изображение из сохранённого запуска."
            : "Open the image from its saved run."}
        </p>
      );
    const path = privateAIArtifactPath(runId, output.artifact_id);
    return (
      <div className="wd-ai-text-output">
        <img
          src={path}
          alt={
            locale === "ru"
              ? "Изображение из AI-запуска"
              : "Image from the AI run"
          }
          style={{ maxWidth: "100%", height: "auto" }}
        />
        <p>
          {output.media_type} · {Math.ceil(output.byte_size / 1024)}{" "}
          {locale === "ru" ? "КиБ" : "KiB"}
        </p>
        <a className="wd-button wd-button-ghost" href={path} download>
          {locale === "ru" ? "Скачать изображение" : "Download image"}
        </a>
      </div>
    );
  }
  if ("json_ld" in output)
    return (
      <div className="wd-ai-text-output">
        <h3>{locale === "ru" ? "Разметка JSON-LD" : "JSON-LD markup"}</h3>
        <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
          {JSON.stringify(output.json_ld, null, 2)}
        </pre>
        <ResultValue
          value={{
            property_sources: output.property_sources,
            warnings: output.warnings,
          }}
          locale={locale}
        />
      </div>
    );
  return (
    <div className="wd-ai-text-output">
      <ResultValue value={output} locale={locale} />
    </div>
  );
}
