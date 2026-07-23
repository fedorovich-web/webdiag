"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Locale } from "@webdiag/tool-registry";
import {
  AuditClientError,
  AuditSnapshotResponse,
  parseAuditUrlInput,
  startAuditSnapshot,
} from "./audit-client";

const copy = {
  ru: {
    label: "Адрес сайта или страницы",
    placeholder: "https://example.ru",
    button: "Проверить сайт",
    buttonLoading: "Проверяем...",
    empty: "Введите адрес сайта или страницы.",
    invalid: "Введите полный URL, например https://example.ru.",
    successPrefix: "Проверка завершена:",
    errorPrefix: "Проверка не запущена:",
    apiUnavailable: "backend API сейчас недоступен. Демонстрационный отчёт ниже остаётся открытым.",
    resultTitle: "Результат быстрой проверки",
    score: "Оценка",
    issues: "Проблемы",
    checks: "Проверки",
    severity: "Риск",
    topIssues: "Первые проблемы",
    noIssues: "Критичных проблем в быстрой проверке не найдено.",
    reportLink: "Открыть пример полного отчёта",
  },
  en: {
    label: "Website or page URL",
    placeholder: "https://example.com",
    button: "Check website",
    buttonLoading: "Checking...",
    empty: "Enter a website or page URL.",
    invalid: "Enter a full URL, for example https://example.com.",
    successPrefix: "Check completed:",
    errorPrefix: "Check was not started:",
    apiUnavailable: "backend API is unavailable right now. The demo report below remains available.",
    resultTitle: "Quick check result",
    score: "Score",
    issues: "Issues",
    checks: "Checks",
    severity: "Risk",
    topIssues: "First issues",
    noIssues: "No critical issues were found in the quick check.",
    reportLink: "Open full report example",
  },
} as const;

const severityLabels = {
  ru: {
    critical: "критично",
    high: "высокий",
    medium: "средний",
    low: "низкий",
    info: "инфо",
  },
  en: {
    critical: "critical",
    high: "high",
    medium: "medium",
    low: "low",
    info: "info",
  },
} as const;

const priorityLabels = {
  ru: { p0: "P0", p1: "P1", p2: "P2", p3: "P3" },
  en: { p0: "P0", p1: "P1", p2: "P2", p3: "P3" },
} as const;

type SubmitState = "idle" | "loading" | "success" | "error";

function getClientErrorMessage(error: unknown, locale: Locale): string {
  if (error instanceof AuditClientError) {
    if (error.code === "audit_api_unavailable" || error.code === "audit_api_timeout") return copy[locale].apiUnavailable;
    return error.message;
  }
  return locale === "ru" ? "неизвестная ошибка запуска проверки." : "unknown check start error.";
}

function scrollToReportPreview() {
  window.setTimeout(() => document.getElementById("report")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
}

function AuditResultPreview({ locale, snapshot }: { locale: Locale; snapshot: AuditSnapshotResponse }) {
  const t = copy[locale];
  const runSummary = snapshot.summary;
  const issues = snapshot.run?.issues.slice(0, 3) ?? [];
  const score = runSummary?.score ?? snapshot.run?.score ?? null;
  const issueCount = runSummary?.issueCount ?? snapshot.run?.issues.length ?? 0;
  const checkCount = runSummary?.checkCount ?? snapshot.run?.checks.length ?? 0;
  const highestSeverity = runSummary?.highestSeverity ?? "info";
  const severityLabel = severityLabels[locale][highestSeverity as keyof typeof severityLabels.ru] ?? highestSeverity;

  return (
    <section className="wd-live-audit-card" aria-labelledby="wd-live-audit-title">
      <div className="wd-live-audit-card-header">
        <div>
          <span>{snapshot.job.target.hostname}</span>
          <h2 id="wd-live-audit-title">{t.resultTitle}</h2>
        </div>
        <b>{snapshot.summary?.status ?? snapshot.job.status}</b>
      </div>
      <div className="wd-live-audit-metrics">
        <article><span>{t.score}</span><strong>{score ?? "—"}</strong></article>
        <article><span>{t.issues}</span><strong>{issueCount}</strong></article>
        <article><span>{t.checks}</span><strong>{checkCount}</strong></article>
        <article><span>{t.severity}</span><strong>{severityLabel}</strong></article>
      </div>
      <div className="wd-live-audit-issues">
        <strong>{t.topIssues}</strong>
        {issues.length ? (
          <ul>
            {issues.map((issue) => {
              const priority = priorityLabels[locale][issue.priority as keyof typeof priorityLabels.ru] ?? issue.priority;
              const severity = severityLabels[locale][issue.severity as keyof typeof severityLabels.ru] ?? issue.severity;
              return (
                <li key={issue.id}>
                  <span>{priority} · {severity}</span>
                  <b>{issue.title}</b>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>{t.noIssues}</p>
        )}
      </div>
      <a className="wd-live-audit-link" href="#report">{t.reportLink}<span aria-hidden="true">→</span></a>
    </section>
  );
}

export function HomeUrlCheckForm({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [snapshot, setSnapshot] = useState<AuditSnapshotResponse | null>(null);
  const inputId = useMemo(() => `wd-url-check-${locale}`, [locale]);
  const isLoading = state === "loading";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseAuditUrlInput(value);
    if (!value.trim()) {
      setSnapshot(null);
      setState("error");
      setMessage(t.empty);
      return;
    }
    if (!parsed) {
      setSnapshot(null);
      setState("error");
      setMessage(t.invalid);
      return;
    }

    setValue(parsed.href);
    setState("loading");
    setMessage("");
    setSnapshot(null);

    try {
      const result = await startAuditSnapshot(parsed.href);
      setSnapshot(result);
      setState("success");
      setMessage(`${t.successPrefix} ${result.job.target.hostname}.`);
    } catch (error) {
      setState("error");
      setMessage(`${t.errorPrefix} ${getClientErrorMessage(error, locale)}`);
      scrollToReportPreview();
    }
  }

  return (
    <form className="wd-url-check" id="check-url" onSubmit={submit} noValidate>
      <label htmlFor={inputId}>{t.label}</label>
      <div>
        <input
          id={inputId}
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder={t.placeholder}
          value={value}
          aria-invalid={state === "error" ? "true" : undefined}
          aria-describedby={`${inputId}-status`}
          disabled={isLoading}
          onChange={(event) => {
            setValue(event.target.value);
            if (message || snapshot) {
              setMessage("");
              setSnapshot(null);
              setState("idle");
            }
          }}
        />
        <button type="submit" disabled={isLoading}>{isLoading ? t.buttonLoading : t.button}</button>
      </div>
      <p id={`${inputId}-status`} aria-live="polite" data-state={state}>{message}</p>
      {snapshot ? <AuditResultPreview locale={locale} snapshot={snapshot} /> : null}
    </form>
  );
}

