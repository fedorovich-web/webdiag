"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { AuditClientError, parseAuditUrlInput, startAuditSnapshot } from "../home/audit-client";
import type { AuditFrontendIssue, AuditFrontendResult } from "../home/audit-contract";
import { localizeAuditCheck, localizeAuditIssue } from "./audit-taxonomy-i18n";

const priorityRank: Readonly<Record<string, number>> = { p0: 0, p1: 1, p2: 2, p3: 3 };
const severityRank: Readonly<Record<string, number>> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

export function orderAuditIssues(issues: readonly AuditFrontendIssue[]): readonly AuditFrontendIssue[] {
  return [...issues].sort((left, right) => {
    const byPriority = (priorityRank[left.priority.toLowerCase()] ?? 99) - (priorityRank[right.priority.toLowerCase()] ?? 99);
    if (byPriority !== 0) return byPriority;
    const bySeverity = (severityRank[left.severity.toLowerCase()] ?? 99) - (severityRank[right.severity.toLowerCase()] ?? 99);
    return bySeverity || left.id.localeCompare(right.id);
  });
}

const copy = {
  ru: {
    url: "URL страницы",
    placeholder: "https://example.ru/page",
    run: "Проверить страницу",
    loading: "Проверяем страницу…",
    invalid: "Введите публичный HTTP(S) URL с доменом.",
    unknownError: "Проверку не удалось завершить.",
    result: "Результат технического аудита",
    score: "Оценка",
    issues: "Проблемы",
    checks: "Проверки",
    risk: "Макс. риск",
    generated: "Получено",
    fixOrder: "Порядок исправления",
    affected: "Затронутые URL",
    recommendation: "Рекомендация",
    steps: "Шаги",
    expected: "Ожидаемый эффект",
    noIssues: "Проблем по выполненным проверкам не найдено.",
    checkResults: "Результаты проверок",
    scope: "Один URL · статический HTML · robots.txt · один sitemap.xml. Без обхода сайта, рендеринга JavaScript, Lighthouse и мониторинга.",
    emptyChecks: "Backend не вернул выполненных проверок.",
  },
  en: {
    url: "Page URL",
    placeholder: "https://example.com/page",
    run: "Audit page",
    loading: "Auditing page…",
    invalid: "Enter a public HTTP(S) URL with a domain.",
    unknownError: "The audit could not be completed.",
    result: "Technical audit result",
    score: "Score",
    issues: "Issues",
    checks: "Checks",
    risk: "Highest risk",
    generated: "Received",
    fixOrder: "Fix order",
    affected: "Affected URLs",
    recommendation: "Recommendation",
    steps: "Steps",
    expected: "Expected impact",
    noIssues: "No issues were found by the completed checks.",
    checkResults: "Check results",
    scope: "One URL · static HTML · robots.txt · one sitemap.xml. No site crawl, JavaScript rendering, Lighthouse, or monitoring.",
    emptyChecks: "The backend returned no completed checks.",
  },
} as const;

const labels = {
  ru: { critical: "критично", high: "высокий", medium: "средний", low: "низкий", info: "инфо", passed: "пройдено", warning: "предупреждение", failed: "не пройдено", skipped: "пропущено", error: "ошибка", succeeded: "завершено" },
  en: { critical: "critical", high: "high", medium: "medium", low: "low", info: "info", passed: "passed", warning: "warning", failed: "failed", skipped: "skipped", error: "error", succeeded: "succeeded" },
} as const;

function localizedLabel(locale: Locale, value: string | null | undefined): string {
  if (!value) return "—";
  return (labels[locale] as Record<string, string>)[value.toLowerCase()] ?? value;
}

function tone(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized === "passed" || normalized === "info" || normalized === "low") return "tool-badge-success";
  if (normalized === "failed" || normalized === "error" || normalized === "critical" || normalized === "high") return "tool-badge-danger";
  return "tool-badge-warning";
}

function formatResultTime(value: string, locale: Locale): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "—" : new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(date) + " UTC";
}

function AuditResult({ locale, result }: { locale: Locale; result: AuditFrontendResult }) {
  const t = copy[locale];
  const issues = orderAuditIssues((result.run?.issues ?? []).map((issue) => localizeAuditIssue(issue, locale)));
  const checks = (result.run?.checks ?? []).map((check) => localizeAuditCheck(check, locale));
  const summary = result.summary;
  return <section className="tool-panel single-audit-result" aria-labelledby="single-audit-result-title">
    <header className="single-audit-result-header"><div><span className="eyebrow">{result.job.target.hostname}</span><h2 id="single-audit-result-title">{t.result}</h2></div><span className="tool-badge tool-badge-success">{localizedLabel(locale, result.job.status)}</span></header>
    <div className="single-audit-metrics">
      <article><span>{t.score}</span><strong>{summary?.score ?? result.run?.score ?? "—"}</strong><small>/100</small></article>
      <article><span>{t.issues}</span><strong>{summary?.issueCount ?? issues.length}</strong></article>
      <article><span>{t.checks}</span><strong>{summary?.checkCount ?? checks.length}</strong></article>
      <article><span>{t.risk}</span><strong>{localizedLabel(locale, summary?.highestSeverity)}</strong></article>
    </div>
    <p className="single-audit-time"><strong>{t.generated}:</strong> {formatResultTime(result.generatedAt, locale)}</p>
    <p className="tool-note single-audit-scope">{t.scope}</p>
    <section className="single-audit-findings" aria-labelledby="single-audit-findings-title">
      <div className="result-heading"><h3 id="single-audit-findings-title">{t.fixOrder}</h3><strong>{issues.length}</strong></div>
      {issues.length ? <div className="single-audit-issue-list">{issues.map((issue, index) => <article key={issue.id}>
        <header><span>{String(index + 1).padStart(2, "0")}</span><div><span className={`tool-badge ${tone(issue.severity)}`}>{issue.priority.toUpperCase()} · {localizedLabel(locale, issue.severity)}</span><h4>{issue.title}</h4></div></header>
        <p>{issue.description}</p>
        {issue.affectedUrls.length > 0 && <div className="single-audit-urls"><strong>{t.affected}</strong>{issue.affectedUrls.map((url) => <code key={url}>{url}</code>)}</div>}
        <div className="single-audit-recommendation"><span>{t.recommendation}</span><strong>{issue.recommendation.summary}</strong></div>
        {issue.recommendation.steps.length > 0 && <div><strong>{t.steps}</strong><ol>{issue.recommendation.steps.map((step) => <li key={step}>{step}</li>)}</ol></div>}
        {issue.recommendation.expectedImpact && <p><strong>{t.expected}:</strong> {issue.recommendation.expectedImpact}</p>}
      </article>)}</div> : <p className="single-audit-empty">{t.noIssues}</p>}
    </section>
    <section className="single-audit-checks" aria-labelledby="single-audit-checks-title"><div className="result-heading"><h3 id="single-audit-checks-title">{t.checkResults}</h3><strong>{checks.length}</strong></div>
      {checks.length ? <ul>{checks.map((check) => <li key={check.id}><span className={`tool-badge ${tone(check.status)}`}>{localizedLabel(locale, check.status)}</span><strong>{check.name}</strong><small>{check.category}</small></li>)}</ul> : <p>{t.emptyChecks}</p>}
    </section>
  </section>;
}

export function SinglePageAuditTool({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<AuditFrontendResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseAuditUrlInput(url);
    if (!parsed) { setError(t.invalid); setResult(null); return; }
    setUrl(parsed.href); setLoading(true); setError(""); setResult(null);
    try { setResult(await startAuditSnapshot(parsed.href)); }
    catch (caught) { setError(caught instanceof AuditClientError ? caught.message : t.unknownError); }
    finally { setLoading(false); }
  }

  return <form className="single-audit-workbench" onSubmit={submit} noValidate>
    <section className="tool-panel single-audit-input"><label className="field"><span>{t.url}</span><input type="url" inputMode="url" autoComplete="url" placeholder={t.placeholder} value={url} onChange={(event) => setUrl(event.target.value)} aria-invalid={error ? "true" : undefined} disabled={loading} /></label><button className="button" type="submit" disabled={loading}>{loading ? t.loading : t.run}</button><p className="tool-error" role="alert" aria-live="polite">{error}</p></section>
    {loading && <section className="tool-panel single-audit-loading" aria-live="polite"><span /><span /><span /><p>{t.loading}</p></section>}
    {result && <AuditResult locale={locale} result={result} />}
  </form>;
}
