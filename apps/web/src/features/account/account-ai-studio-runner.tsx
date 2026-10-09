"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { createAIRun, getAIRun, uploadAIImage } from "./account-ai-client";
import type { AIRun } from "./account-ai-contract";
import {
  buildStudioInput,
  type StudioToolId,
  type StudioPage,
} from "./account-ai-studio-input";
import { aiRunStateLabel, aiToolDescriptor } from "./account-ai-presentation";
import {
  aiPollDelayMs,
  isAIRunTerminal,
  newAIIdempotencyKey,
  shouldPollAIRun,
} from "./account-ai-query";
import { AccountAIResult } from "./account-ai-result";
import { accountErrorMessage } from "./account-messages";

type Field = {
  key: string;
  label: readonly [string, string];
  max?: number;
  min?: number;
  optional?: boolean;
  multiline?: boolean;
  options?: readonly string[];
  numeric?: boolean;
};
const FIELDS: Record<StudioToolId, readonly Field[]> = {
  ai_meta_serp_studio: [
    { key: "page_url", label: ["URL страницы", "Page URL"], max: 2048, min: 8 },
    {
      key: "content",
      label: ["Содержимое страницы", "Page content"],
      min: 20,
      max: 30000,
      multiline: true,
    },
    {
      key: "current_title",
      label: ["Текущий title", "Current title"],
      max: 300,
      optional: true,
    },
    {
      key: "current_description",
      label: ["Текущее описание", "Current description"],
      max: 1000,
      optional: true,
    },
    {
      key: "h1",
      label: ["Заголовок H1", "H1 heading"],
      max: 500,
      optional: true,
    },
    {
      key: "primary_query",
      label: ["Основной запрос", "Primary query"],
      max: 300,
      optional: true,
    },
    { key: "brand", label: ["Бренд", "Brand"], max: 200, optional: true },
  ],
  ai_schema_studio: [
    { key: "page_url", label: ["URL страницы", "Page URL"], max: 2048, min: 8 },
    {
      key: "schema_type",
      label: ["Тип разметки", "Schema type"],
      options: [
        "WebPage",
        "Article",
        "Organization",
        "LocalBusiness",
        "Product",
      ],
    },
    {
      key: "facts",
      label: [
        "Подтверждённые факты: 1–50 строк, до 2000 знаков каждая",
        "Confirmed facts: 1–50 lines, up to 2000 characters each",
      ],
      max: 100049,
      multiline: true,
    },
  ],
  ai_faq_studio: [
    {
      key: "source_content",
      label: ["Исходное содержимое", "Source content"],
      min: 20,
      max: 40000,
      multiline: true,
    },
    {
      key: "audience",
      label: ["Аудитория", "Audience"],
      max: 300,
      optional: true,
    },
    {
      key: "question_count",
      label: ["Количество вопросов (3–10)", "Question count (3–10)"],
      min: 3,
      max: 10,
      numeric: true,
    },
  ],
  ai_alt_text_studio: [
    {
      key: "purpose",
      label: ["Назначение изображения", "Image purpose"],
      options: ["informative", "decorative", "unknown"],
    },
    {
      key: "page_context",
      label: ["Контекст страницы", "Page context"],
      max: 2000,
      optional: true,
      multiline: true,
    },
    {
      key: "surrounding_text",
      label: ["Текст рядом с изображением", "Surrounding text"],
      max: 2000,
      optional: true,
      multiline: true,
    },
  ],
  ai_redirect_migration_mapper: [],
  ai_localization_workbench: [
    {
      key: "source_locale",
      label: ["Исходный язык", "Source language"],
      options: ["ru", "en"],
    },
    {
      key: "target_locale",
      label: ["Язык перевода", "Target language"],
      options: ["en", "ru"],
    },
    {
      key: "source_content",
      label: ["Исходный текст", "Source text"],
      min: 20,
      max: 80000,
      multiline: true,
    },
    {
      key: "glossary",
      label: [
        "Глоссарий: термин => перевод, до 100 строк",
        "Glossary: term => translation, up to 100 lines",
      ],
      max: 40499,
      optional: true,
      multiline: true,
    },
    {
      key: "verbatim_constraints",
      label: [
        "Сохранить дословно: фрагмент из исходника на строку, до 100",
        "Keep verbatim: one source excerpt per line, up to 100",
      ],
      max: 100099,
      optional: true,
      multiline: true,
    },
  ],
  ai_regex_workbench: [
    {
      key: "dialect",
      label: ["Диалект", "Dialect"],
      options: ["python", "javascript", "re2"],
    },
    {
      key: "task",
      label: ["Что должно находить выражение", "What the pattern should match"],
      max: 2000,
      multiline: true,
    },
    {
      key: "matches",
      label: [
        "Должны совпасть: пример на строку, до 2000 знаков",
        "Should match: one case per line, up to 2000 characters",
      ],
      max: 80039,
      optional: true,
      multiline: true,
    },
    {
      key: "non_matches",
      label: [
        "Не должны совпасть: всего 1–40 примеров",
        "Should not match: 1–40 cases total",
      ],
      max: 80039,
      optional: true,
      multiline: true,
    },
    {
      key: "constraints",
      label: [
        "Ограничения: до 20 строк, 1000 знаков каждая",
        "Constraints: up to 20 lines, 1000 characters each",
      ],
      max: 20019,
      optional: true,
      multiline: true,
    },
  ],
  ai_image_studio: [],
  ai_image_edit_studio: [],
};
const IMAGE_FIELDS: readonly Field[] = [
  {
    key: "prompt",
    label: ["Опишите изображение или изменения", "Describe the image or edits"],
    min: 10,
    max: 4000,
    multiline: true,
  },
  {
    key: "aspect_ratio",
    label: ["Соотношение сторон", "Aspect ratio"],
    options: [
      "auto",
      "1:1",
      "3:2",
      "2:3",
      "4:3",
      "3:4",
      "16:9",
      "9:16",
      "21:9",
    ],
  },
  {
    key: "quality",
    label: ["Качество", "Quality"],
    options: ["medium", "auto", "low", "high"],
  },
  {
    key: "background",
    label: ["Фон", "Background"],
    options: ["auto", "opaque"],
  },
];
const OPTION_RU: Record<string, string> = {
  ru: "Русский",
  en: "Английский",
  informative: "Информативное",
  decorative: "Декоративное",
  unknown: "Не определено",
  auto: "Автоматически",
  medium: "Среднее",
  low: "Низкое",
  high: "Высокое",
  opaque: "Непрозрачный",
};

function PageFields({
  locale,
  label,
  pages,
  onChange,
}: {
  locale: Locale;
  label: string;
  pages: readonly StudioPage[];
  onChange: (pages: readonly StudioPage[]) => void;
}) {
  const ru = locale === "ru";
  return (
    <fieldset>
      <legend>{label}</legend>
      {pages.map((page, index) => (
        <div key={index}>
          <label>
            {`${ru ? "URL страницы" : "Page URL"} ${index + 1}`}
            <input
              type="url"
              required
              maxLength={2048}
              value={page.page_url}
              onChange={(event) =>
                onChange(
                  pages.map((p, i) =>
                    i === index ? { ...p, page_url: event.target.value } : p,
                  ),
                )
              }
            />
          </label>
          <label>
            {`${ru ? "Содержимое страницы" : "Page content"} ${index + 1}`}
            <textarea
              required
              minLength={20}
              maxLength={20000}
              rows={4}
              value={page.content}
              onChange={(event) =>
                onChange(
                  pages.map((p, i) =>
                    i === index ? { ...p, content: event.target.value } : p,
                  ),
                )
              }
            />
          </label>
          {pages.length > 1 && (
            <button
              type="button"
              className="wd-button wd-button-ghost"
              onClick={() => onChange(pages.filter((_, i) => i !== index))}
            >
              {ru ? "Удалить страницу" : "Remove page"}
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        className="wd-button wd-button-ghost"
        disabled={pages.length >= 50}
        onClick={() => onChange([...pages, { page_url: "", content: "" }])}
      >
        {ru ? "Добавить страницу" : "Add page"}
      </button>
    </fieldset>
  );
}

export function AccountAIStudioRunner({
  locale,
  toolId,
  creditPrice,
  onClose,
  onSuccess,
}: {
  locale: Locale;
  toolId: StudioToolId;
  creditPrice: number;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const ru = locale === "ru";
  const fields =
    toolId === "ai_image_studio" || toolId === "ai_image_edit_studio"
      ? IMAGE_FIELDS
      : FIELDS[toolId];
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((f) => [
        f.key,
        f.options?.[0] ?? (f.key === "question_count" ? "5" : ""),
      ]),
    ),
  );
  const [file, setFile] = useState<File | null>(null);
  const [oldPages, setOldPages] = useState<readonly StudioPage[]>([
    { page_url: "", content: "" },
  ]);
  const [newPages, setNewPages] = useState<readonly StudioPage[]>([
    { page_url: "", content: "" },
  ]);
  const [run, setRun] = useState<AIRun | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const prepared = useRef<{
    fingerprint: string;
    key: string;
    input: Record<string, unknown>;
  } | null>(null);
  const needsUpload =
    toolId === "ai_alt_text_studio" || toolId === "ai_image_edit_studio";
  useEffect(() => {
    if (
      !run ||
      isAIRunTerminal(run.state) ||
      !shouldPollAIRun(run.state, attempt)
    )
      return;
    let active = true;
    const timer = window.setTimeout(() => {
      getAIRun(run.id)
        .then((detail) => {
          if (!active) return;
          setRun(detail.run);
          setAttempt((n) => n + 1);
          if (isAIRunTerminal(detail.run.state)) {
            prepared.current = null;
            onSuccess?.();
          }
        })
        .catch((caught) => {
          if (active) {
            setError(accountErrorMessage(locale, caught));
            setAttempt((n) => n + 1);
          }
        });
    }, aiPollDelayMs(attempt));
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [run, attempt, locale, onSuccess]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    setAttempt(0);
    try {
      const fingerprint = JSON.stringify({
        values,
        oldPages,
        newPages,
        file: file
          ? [file.name, file.size, file.lastModified, file.type]
          : null,
      });
      if (prepared.current?.fingerprint !== fingerprint) {
        // Validate every field before creating a private upload or reserving credits.
        buildStudioInput(
          locale,
          toolId,
          values,
          undefined,
          oldPages,
          newPages,
          needsUpload,
        );
        if (needsUpload && !file)
          throw new Error(ru ? "Выберите изображение." : "Choose an image.");
        const uploadId =
          needsUpload && file
            ? (await uploadAIImage(file)).upload.id
            : undefined;
        prepared.current = {
          fingerprint,
          key: newAIIdempotencyKey(),
          input: buildStudioInput(
            locale,
            toolId,
            values,
            uploadId,
            oldPages,
            newPages,
          ),
        };
      }
      const detail = await createAIRun(
        toolId,
        prepared.current.input,
        prepared.current.key,
      );
      setRun(detail.run);
      if (isAIRunTerminal(detail.run.state)) {
        prepared.current = null;
        onSuccess?.();
      }
    } catch (caught) {
      setError(
        caught instanceof Error && !("code" in caught)
          ? caught.message
          : accountErrorMessage(locale, caught),
      );
    } finally {
      setPending(false);
    }
  }
  const busy = pending || Boolean(run && !isAIRunTerminal(run.state));
  return (
    <section className="wd-ai-text-runner" aria-labelledby="ai-studio-title">
      <div className="wd-ai-section-heading">
        <h2 id="ai-studio-title">{aiToolDescriptor(locale, toolId).title}</h2>
        <button
          type="button"
          className="wd-button wd-button-ghost"
          onClick={onClose}
        >
          {ru ? "Закрыть" : "Close"}
        </button>
      </div>
      <p>
        {ru
          ? "Используйте подтверждённые данные. Результат сохраняется в вашем аккаунте и требует проверки."
          : "Use confirmed evidence. Results are saved privately to your account and need review."}
      </p>
      <form className="wd-ai-text-form" onSubmit={submit}>
        <fieldset
          disabled={busy}
          className="wd-ai-text-form"
          style={{
            border: 0,
            padding: 0,
            margin: 0,
            gridColumn: "1 / -1",
            minWidth: 0,
          }}
        >
          {needsUpload && (
            <label>
              {ru
                ? "Изображение PNG, JPEG или WebP, до 4 МиБ"
                : "PNG, JPEG or WebP image, up to 4 MiB"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                required
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
          )}
          {fields.map((field) => (
            <label key={field.key}>
              {field.label[ru ? 0 : 1]}
              {field.optional ? (ru ? " (необязательно)" : " (optional)") : ""}
              {field.options ? (
                <select
                  value={values[field.key]}
                  onChange={(event) =>
                    setValues((v) => ({
                      ...v,
                      [field.key]: event.target.value,
                    }))
                  }
                >
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {ru ? (OPTION_RU[option] ?? option) : option}
                    </option>
                  ))}
                </select>
              ) : field.multiline ? (
                <textarea
                  required={!field.optional}
                  minLength={field.min}
                  maxLength={field.max}
                  rows={5}
                  value={values[field.key]}
                  onChange={(event) =>
                    setValues((v) => ({
                      ...v,
                      [field.key]: event.target.value,
                    }))
                  }
                />
              ) : (
                <input
                  required={!field.optional}
                  type={
                    field.numeric
                      ? "number"
                      : field.key === "page_url"
                        ? "url"
                        : "text"
                  }
                  min={field.numeric ? field.min : undefined}
                  max={field.numeric ? field.max : undefined}
                  minLength={!field.numeric ? field.min : undefined}
                  maxLength={!field.numeric ? field.max : undefined}
                  value={values[field.key]}
                  onChange={(event) =>
                    setValues((v) => ({
                      ...v,
                      [field.key]: event.target.value,
                    }))
                  }
                />
              )}
            </label>
          ))}
          {toolId === "ai_redirect_migration_mapper" && (
            <>
              <PageFields
                locale={locale}
                label={ru ? "Старые страницы (1–50)" : "Old pages (1–50)"}
                pages={oldPages}
                onChange={setOldPages}
              />
              <PageFields
                locale={locale}
                label={ru ? "Новые страницы (1–50)" : "New pages (1–50)"}
                pages={newPages}
                onChange={setNewPages}
              />
            </>
          )}
        </fieldset>
        <button
          type="submit"
          className="wd-button wd-button-primary"
          disabled={busy || !Number.isInteger(creditPrice) || creditPrice <= 0}
          aria-busy={pending}
        >
          {pending
            ? ru
              ? "Ставим в очередь…"
              : "Queuing…"
            : `${ru ? "Запустить инструмент" : "Run tool"} (${creditPrice} ${ru ? "AI-кредитов" : "AI credits"})`}
        </button>
      </form>
      {error && (
        <p role="alert" className="wd-account-error">
          {error}
        </p>
      )}
      {run && <p role="status">{aiRunStateLabel(locale, run.state)}</p>}
      {run &&
        !isAIRunTerminal(run.state) &&
        !shouldPollAIRun(run.state, attempt) && (
          <button
            type="button"
            className="wd-button wd-button-ghost"
            onClick={() => setAttempt(0)}
          >
            {ru ? "Обновить статус" : "Refresh status"}
          </button>
        )}
      {run?.state === "succeeded" && run.output && (
        <AccountAIResult locale={locale} output={run.output} runId={run.id} />
      )}
    </section>
  );
}
