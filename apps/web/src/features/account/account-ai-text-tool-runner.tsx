"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { accountErrorMessage } from "./account-messages";
import { createAIRun, getAIRun } from "./account-ai-client";
import type { AIOutput, AIToolId, AIRun } from "./account-ai-contract";
import { aiRunStateLabel, aiToolDescriptor } from "./account-ai-presentation";
import { aiPollDelayMs, isAIRunTerminal, newAIIdempotencyKey, shouldPollAIRun } from "./account-ai-query";

type TextToolId = Exclude<AIToolId, "ai_audit_action_plan">;
type FormValues = Record<string, string>;

interface AccountAITextToolRunnerProps {
  readonly locale: Locale;
  readonly toolId: TextToolId;
  readonly onClose: () => void;
}

const EMPTY_VALUES: FormValues = {
  audience: "",
  objective: "",
  facts: "",
  page_url: "https://example.com/page",
  content: "",
  target_query: "",
  primary_query: "",
  intended_page_type: "informational",
  own_page_url: "https://example.com/page",
  own_content: "",
  competitor_page_url: "https://competitor.example/page",
  competitor_content: "",
  pages: "",
};

function lines(value: string): string[] {
  return value.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean);
}

function fieldValue(values: FormValues, key: string): string {
  return values[key] ?? "";
}

function outputPreview(output: AIOutput, locale: Locale): string {
  if ("summary" in output) return output.summary;
  if ("revised_content" in output) return output.revised_content;
  if ("evidence" in output) return output.evidence.join(" ");
  return output.warnings.join(" ") || (locale === "ru" ? "Результат без дополнительного текста." : "The result contains no additional text.");
}

function buildInput(locale: Locale, toolId: TextToolId, values: FormValues): Record<string, unknown> {
  if (toolId === "ai_content_brief") {
    return { locale, audience: fieldValue(values, "audience"), objective: fieldValue(values, "objective"), facts: lines(fieldValue(values, "facts")) };
  }
  if (toolId === "ai_content_optimizer") {
    return { locale, page_url: fieldValue(values, "page_url"), content: fieldValue(values, "content"), target_query: fieldValue(values, "target_query") || null, objective: fieldValue(values, "objective") || null, factual_constraints: [] };
  }
  if (toolId === "ai_search_intent_page_fit") {
    return { locale, page_url: fieldValue(values, "page_url"), primary_query: fieldValue(values, "primary_query"), intended_page_type: fieldValue(values, "intended_page_type"), page_title: null, h1: null, content: fieldValue(values, "content") };
  }
  if (toolId === "ai_competitor_gap_report") {
    return { locale, objective: fieldValue(values, "objective") || null, own_page: { page_url: fieldValue(values, "own_page_url"), title: null, h1: null, content: fieldValue(values, "own_content") }, competitor_pages: [{ page_url: fieldValue(values, "competitor_page_url"), title: null, h1: null, content: fieldValue(values, "competitor_content") }] };
  }
  return {
    locale,
    pages: lines(fieldValue(values, "pages")).map((entry) => {
      const [page_url, content] = entry.split("|", 2);
      return { page_url: page_url?.trim() ?? "", title: null, h1: null, content: content?.trim() ?? "" };
    }),
    existing_links: [],
  };
}

function fieldLabel(locale: Locale, key: string): string {
  const ru = locale === "ru";
  return ({
    audience: ru ? "Аудитория" : "Audience",
    objective: ru ? "Цель" : "Objective",
    facts: ru ? "Подтверждённые факты (по одному в строке)" : "Confirmed facts (one per line)",
    page_url: ru ? "URL страницы" : "Page URL",
    content: ru ? "Текст страницы" : "Page content",
    target_query: ru ? "Целевой запрос (необязательно)" : "Target query (optional)",
    primary_query: ru ? "Основной запрос" : "Primary query",
    intended_page_type: ru ? "Тип страницы" : "Intended page type",
    own_page_url: ru ? "URL своей страницы" : "Own page URL",
    own_content: ru ? "Текст своей страницы" : "Own page content",
    competitor_page_url: ru ? "URL страницы конкурента" : "Competitor page URL",
    competitor_content: ru ? "Текст страницы конкурента" : "Competitor page content",
    pages: ru ? "Страницы: URL|текст, по одной в строке" : "Pages: URL|content, one per line",
  } satisfies Record<string, string>)[key] ?? key;
}

function requiredFields(toolId: TextToolId): readonly string[] {
  if (toolId === "ai_content_brief") return ["audience", "objective", "facts"];
  if (toolId === "ai_content_optimizer") return ["page_url", "content"];
  if (toolId === "ai_search_intent_page_fit") return ["page_url", "primary_query", "content"];
  if (toolId === "ai_competitor_gap_report") return ["own_page_url", "own_content", "competitor_page_url", "competitor_content"];
  return ["pages"];
}

export function AccountAITextToolRunner({ locale, toolId, onClose }: AccountAITextToolRunnerProps) {
  const ru = locale === "ru";
  const [values, setValues] = useState<FormValues>(() => ({ ...EMPTY_VALUES }));
  const [run, setRun] = useState<AIRun | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!run || isAIRunTerminal(run.state) || stopped) return;
    if (!shouldPollAIRun(run.state, attempt)) {
      setStopped(true);
      return;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      getAIRun(run.id).then((detail) => {
        if (!active) return;
        setRun(detail.run);
        setAttempt((current) => current + 1);
      }).catch((caught) => {
        if (!active) return;
        setError(accountErrorMessage(locale, caught));
        setAttempt((current) => current + 1);
      });
    }, aiPollDelayMs(attempt));
    return () => { active = false; window.clearTimeout(timer); };
  }, [attempt, locale, run, stopped]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setRun(null);
    setAttempt(0);
    setStopped(false);
    try {
      const detail = await createAIRun(toolId, buildInput(locale, toolId, values), newAIIdempotencyKey());
      setRun(detail.run);
    } catch (caught) {
      setError(accountErrorMessage(locale, caught));
    } finally {
      setPending(false);
    }
  }

  const required = new Set(requiredFields(toolId));
  const descriptor = aiToolDescriptor(locale, toolId);
  const output = run?.state === "succeeded" ? run.output : null;
  return (
    <section className="wd-ai-text-runner" aria-labelledby="ai-text-runner-title">
      <div className="wd-ai-section-heading">
        <div><span className="eyebrow">{ru ? "ПОДТВЕРЖДЁННЫЕ ДАННЫЕ" : "CONFIRMED EVIDENCE"}</span><h2 id="ai-text-runner-title">{descriptor.title}</h2></div>
        <button className="wd-button wd-button-ghost" type="button" onClick={onClose}>{ru ? "Закрыть" : "Close"}</button>
      </div>
      <p className="wd-ai-text-runner-note">{ru ? "Вставляйте только данные, которыми вы уже владеете. AI не получает доступ к сайту и не публикует изменения." : "Paste only evidence you already own. AI does not access the site or publish changes."}</p>
      <form className="wd-ai-text-form" onSubmit={submit}>
        {Object.keys(EMPTY_VALUES).filter((key) => {
          if (toolId === "ai_content_brief") return ["audience", "objective", "facts"].includes(key);
          if (toolId === "ai_content_optimizer") return ["page_url", "content", "target_query", "objective"].includes(key);
          if (toolId === "ai_search_intent_page_fit") return ["page_url", "primary_query", "intended_page_type", "content"].includes(key);
          if (toolId === "ai_competitor_gap_report") return ["own_page_url", "own_content", "competitor_page_url", "competitor_content", "objective"].includes(key);
          return key === "pages";
        }).map((key) => key === "intended_page_type" ? (
          <label key={key}>{fieldLabel(locale, key)}<select value={fieldValue(values, key)} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}><option value="informational">informational</option><option value="commercial">commercial</option><option value="transactional">transactional</option><option value="navigational">navigational</option><option value="local">local</option><option value="unknown">unknown</option></select></label>
        ) : (
          <label key={key}>{fieldLabel(locale, key)}{key.includes("content") || key === "facts" || key === "pages" ? <textarea value={fieldValue(values, key)} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} minLength={20} required={required.has(key)} rows={key === "pages" ? 5 : 6} /> : <input value={fieldValue(values, key)} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} required={required.has(key)} />}</label>
        ))}
        <button className="wd-button wd-button-primary" type="submit" disabled={pending || Boolean(run && !isAIRunTerminal(run.state))} aria-busy={pending}>{pending ? (ru ? "Ставим в очередь…" : "Queuing…") : (ru ? "Запустить инструмент" : "Run tool")}</button>
      </form>
      {run && <p className="wd-ai-copilot-status" role="status">{aiRunStateLabel(locale, run.state)}{stopped ? (ru ? " — обновите позже" : " — check again later") : ""}</p>}
      {error && <p className="wd-account-error" role="alert">{error}</p>}
      {output && <div className="wd-ai-text-output"><strong>{ru ? "Результат подтверждён контрактом" : "Result validated by contract"}</strong><p>{outputPreview(output, locale)}</p></div>}
    </section>
  );
}
