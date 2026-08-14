"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import {
  formatBytes,
  isCachePolicyResponse,
  isLighthouseNetworkResponse,
  isPageSpeedResponse,
  isPageWeightResponse,
  isToolErrorPayload,
  parsePerformanceToolUrlInput,
  statusLabel,
  type CachePolicyResponse,
  type LighthouseNetworkResponse,
  type PageSpeedResponse,
  type PageWeightResponse,
  type PerformanceToolResponse,
} from "./performance-tool-contract";

class PerformanceToolError extends Error {
  readonly code: string;

  constructor(message: string, code = "performance_tool_error") {
    super(message);
    this.name = "PerformanceToolError";
    this.code = code;
  }
}

async function runPerformanceTool<T extends PerformanceToolResponse>(
  endpoint: string,
  body: Record<string, string>,
  validator: (payload: unknown) => payload is T,
): Promise<T> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (isToolErrorPayload(payload)) {
      throw new PerformanceToolError(payload.detail.message, payload.detail.code);
    }
    throw new PerformanceToolError("Tool API request failed.", "tool_api_error");
  }
  if (!validator(payload)) {
    throw new PerformanceToolError("Tool API returned an invalid result.", "tool_api_invalid_response");
  }
  return payload;
}


export function pageSpeedResultText(result: PageSpeedResponse): string {
  return [
    `URL: ${result.normalized_url}`,
    ...result.results.map((item) => [
      `Strategy: ${item.strategy}`,
      `Available: ${item.available}`,
      `Performance score: ${item.performance_score ?? "—"}`,
      ...Object.entries(item.category_scores).map(([category, score]) => `Lighthouse ${category}: ${score ?? "—"}`),
      ...item.audit_findings.map((finding) => `Lighthouse finding: ${finding.category} / ${finding.title} — ${Math.round(finding.score * 100)}`),
      ...item.metrics.map((metric) => `${metric.title}: ${metric.display_value ?? metric.value ?? "—"} — ${metric.status}`),
      ...item.opportunities.map((opportunity) => `Opportunity: ${opportunity.title} — ${opportunity.display_value ?? opportunity.savings_ms ?? "—"}`),
      item.fetch_error ? `Error: ${item.fetch_error}` : "",
    ].filter(Boolean).join("\n")),
    `Recommendation: ${result.recommendation}`,
  ].join("\n");
}

export function cachePolicyResultText(result: CachePolicyResponse): string {
  return [
    `Final URL: ${result.final_url}`,
    `Score: ${result.score}`,
    `Cache-Control: ${result.cache_control ?? "—"}`,
    ...result.checks.map((check) => `${check.title}: ${check.value ?? "—"} — ${check.status}`),
    `Recommendation: ${result.recommendation}`,
  ].join("\n");
}

export function pageWeightResultText(result: PageWeightResponse): string {
  return [
    `Final URL: ${result.final_url}`,
    `Known bytes: ${result.total_known_bytes}`,
    `Resources: ${result.checked_resource_count}/${result.discovered_resource_count}`,
    `Images: modern ${result.modern_image_count}, legacy ${result.legacy_image_count}`,
    ...result.largest_resources.map((resource) => `${resource.type}: ${resource.content_length ?? "—"} — ${resource.url}`),
    `Recommendation: ${result.recommendation}`,
  ].join("\n");
}

export function lighthouseNetworkResultText(result: LighthouseNetworkResponse): string {
  return [
    `URL: ${result.normalized_url}`,
    `Strategy: ${result.strategy}`,
    `Resources: ${result.returned_request_count}/${result.request_count}`,
    ...result.resources.map((resource) => `${resource.resource_type}: ${resource.duration_ms} ms · ${resource.transfer_bytes ?? "—"} B · ${resource.url}`),
    `Render blocking audit: ${result.render_blocking_available ? (result.render_blocking_display_value ?? result.render_blocking_score ?? "available") : "unavailable"}`,
    ...result.render_blocking_items.map((item) => `Blocking: ${item.wasted_ms ?? "—"} ms · ${item.url}`),
    result.fetch_error ? `Error: ${result.fetch_error}` : "",
    `Recommendation: ${result.recommendation}`,
  ].filter(Boolean).join("\n");
}

const dictionary = {
  ru: {
    url: "URL страницы",
    run: "Запустить проверку",
    loading: "Проверяем…",
    result: "Результат",
    recommendation: "Рекомендация",
    invalidUrl: "Введите корректный http(s) URL с доменом.",
    score: "Оценка",
    finalUrl: "Финальный URL",
    checks: "Проверки",
    categories: "Категории Lighthouse",
    findings: "Что исправить по Lighthouse",
  },
  en: {
    url: "Page URL",
    run: "Run check",
    loading: "Checking…",
    result: "Result",
    recommendation: "Recommendation",
    invalidUrl: "Enter a valid http(s) URL with a domain.",
    score: "Score",
    finalUrl: "Final URL",
    checks: "Checks",
    categories: "Lighthouse categories",
    findings: "Lighthouse fix order",
  },
} as const;

const lighthouseCategoryLabels = {
  ru: { performance: "Производительность", accessibility: "Доступность", "best-practices": "Практики", seo: "SEO" },
  en: { performance: "Performance", accessibility: "Accessibility", "best-practices": "Best practices", seo: "SEO" },
} as const;

function UrlField({ url, setUrl, locale }: { url: string; setUrl: (value: string) => void; locale: Locale }) {
  return (
    <label className="field">
      <span>{dictionary[locale].url}</span>
      <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/" />
    </label>
  );
}

function ErrorMessage({ value }: { value: string }) {
  if (!value) return null;
  return <p className="tool-error" role="alert">{value}</p>;
}

function Recommendation({ value, locale }: { value: string; locale: Locale }) {
  return <div className="tool-note"><strong>{dictionary[locale].recommendation}:</strong> {value}</div>;
}

function badgeClass(status: string) {
  return status === "pass" ? "tool-badge tool-badge-success" : status === "fail" ? "tool-badge tool-badge-danger" : "tool-badge tool-badge-warning";
}

function formatNullableBytes(value: number | null): string {
  return value === null ? "—" : formatBytes(value);
}

function LighthouseNetworkSummary({ result, locale }: { result: LighthouseNetworkResponse; locale: Locale }) {
  return <div className="lighthouse-network-summary">
    <article><span>{locale === "ru" ? "Запросы" : "Requests"}</span><strong>{result.returned_request_count}/{result.request_count}</strong><small>{locale === "ru" ? "показано / найдено" : "shown / found"}</small></article>
    <article><span>{locale === "ru" ? "Передано" : "Transferred"}</span><strong>{formatNullableBytes(result.total_transfer_bytes)}</strong><small>{locale === "ru" ? "в показанных строках" : "in returned rows"}</small></article>
    <article><span>{locale === "ru" ? "Ресурсы" : "Resources"}</span><strong>{formatNullableBytes(result.total_resource_bytes)}</strong><small>{locale === "ru" ? "известный размер строк" : "known size in rows"}</small></article>
  </div>;
}

function ResourceTimeline({ result, locale }: { result: LighthouseNetworkResponse; locale: Locale }) {
  if (!result.resources_available) return <p className="tool-state-note">{locale === "ru" ? "PageSpeed не вернул audit network-requests для этого запуска." : "PageSpeed did not return the network-requests audit for this run."}</p>;
  if (result.resources.length === 0) return <p className="tool-state-note">{locale === "ru" ? "Audit доступен, но строки ресурсов не возвращены." : "The audit is available, but no resource rows were returned."}</p>;
  const maximumEnd = Math.max(1, ...result.resources.map((resource) => resource.end_ms));
  return <div className="lighthouse-network-list" aria-label={locale === "ru" ? "Временная шкала ресурсов" : "Resource timeline"}>
    {result.resources.map((resource, index) => {
      const start = Math.min(100, (resource.start_ms / maximumEnd) * 100);
      const width = Math.max(1.5, Math.min(100 - start, (resource.duration_ms / maximumEnd) * 100));
      return <article key={`${resource.url}-${index}`}>
        <header><span className="tool-badge">{resource.resource_type || "other"}</span><strong>{Math.round(resource.duration_ms)} ms</strong><span>{formatNullableBytes(resource.transfer_bytes)}</span></header>
        <div className="lighthouse-network-track" aria-hidden="true"><i style={{ left: `${start}%`, width: `${width}%` }} /></div>
        <p title={resource.url}>{resource.url}</p>
      </article>;
    })}
  </div>;
}

function RenderBlockingEvidence({ result, locale }: { result: LighthouseNetworkResponse; locale: Locale }) {
  if (!result.render_blocking_available) return <p className="tool-state-note">{locale === "ru" ? "PageSpeed не вернул точный audit render-blocking-resources. WebDiag не заменяет его эвристикой." : "PageSpeed did not return the exact render-blocking-resources audit. WebDiag does not replace it with a heuristic."}</p>;
  return <>
    <div className="metric-row"><span>{locale === "ru" ? "Оценка audit" : "Audit score"}</span><strong>{result.render_blocking_score === null ? "—" : `${Math.round(result.render_blocking_score * 100)}/100`}</strong></div>
    <div className="metric-row"><span>{locale === "ru" ? "Оценка экономии" : "Estimated savings"}</span><strong>{result.render_blocking_savings_ms === null ? "—" : `${Math.round(result.render_blocking_savings_ms)} ms`}</strong></div>
    {result.render_blocking_display_value && <p className="tool-state-note">{result.render_blocking_display_value}</p>}
    {result.render_blocking_items.length > 0 ? <ol className="lighthouse-blocking-list">{result.render_blocking_items.map((item, index) => <li key={`${item.url}-${index}`}><div><strong>{item.url}</strong><span>{locale === "ru" ? "Потенциальная задержка" : "Potential delay"}: {item.wasted_ms === null ? "—" : `${Math.round(item.wasted_ms)} ms`} · {locale === "ru" ? "лишние байты" : "wasted bytes"}: {formatNullableBytes(item.wasted_bytes)}</span></div><b>{formatNullableBytes(item.total_bytes)}</b></li>)}</ol> : <p className="tool-state-note">{locale === "ru" ? "Audit доступен, но строки блокирующих ресурсов для этого запуска не возвращены." : "The audit is available, but no blocking resource rows were returned for this run."}</p>}
  </>;
}

export function LighthouseNetworkTool({ locale, view }: { locale: Locale; view: "resources" | "blocking" }) {
  const [url, setUrl] = useState("https://example.com/");
  const [strategy, setStrategy] = useState<"mobile" | "desktop">("mobile");
  const [result, setResult] = useState<LighthouseNetworkResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = parsePerformanceToolUrlInput(url);
    if (!parsed) { setError(dictionary[locale].invalidUrl); setResult(null); return; }
    setLoading(true); setError("");
    try {
      setResult(await runPerformanceTool("/api/tools/lighthouse-network", { url: parsed.toString(), strategy }, isLighthouseNetworkResponse));
    } catch (caught) {
      setResult(null); setError(caught instanceof Error ? caught.message : "Tool failed.");
    } finally { setLoading(false); }
  }

  return <form className="tool-grid lighthouse-network-tool" onSubmit={onSubmit}>
    <section className="tool-panel">
      <UrlField url={url} setUrl={setUrl} locale={locale} />
      <label className="field"><span>{locale === "ru" ? "Стратегия" : "Strategy"}</span><select value={strategy} onChange={(event) => setStrategy(event.target.value as "mobile" | "desktop")}><option value="mobile">Mobile</option><option value="desktop">Desktop</option></select></label>
      <button className="button" type="submit" disabled={loading}>{loading ? dictionary[locale].loading : dictionary[locale].run}</button>
      <p className="tool-input-note">{locale === "ru" ? "Источник: Google PageSpeed Lighthouse. До 40 ресурсов и 20 blocking rows; query и fragment удаляются." : "Source: Google PageSpeed Lighthouse. Up to 40 resources and 20 blocking rows; query strings and fragments are removed."}</p>
      <ErrorMessage value={error} />
    </section>
    {result && <section className="tool-panel tool-panel-wide" aria-live="polite">
      <div className="lighthouse-network-heading"><div><span className="tool-badge">{result.strategy}</span><h2>{view === "resources" ? (locale === "ru" ? "Временная шкала" : "Resource timeline") : (locale === "ru" ? "Блокирующие ресурсы" : "Render-blocking resources")}</h2></div><span>{result.lighthouse_version ? `Lighthouse ${result.lighthouse_version}` : "Lighthouse"}</span></div>
      {!result.available && <p className="tool-state-note is-warning">{result.fetch_error ?? (locale === "ru" ? "Provider недоступен." : "Provider unavailable.")}</p>}
      {view === "resources" && <><LighthouseNetworkSummary result={result} locale={locale} /><ResourceTimeline result={result} locale={locale} /></>}
      {view === "blocking" && <RenderBlockingEvidence result={result} locale={locale} />}
      <Recommendation value={result.recommendation} locale={locale} />
    </section>}
  </form>;
}

export function CoreWebVitalsTool({ locale }: { locale: Locale }) {
  const [url, setUrl] = useState("https://example.com/");
  const [strategy, setStrategy] = useState<"mobile" | "desktop" | "both">("mobile");
  const [result, setResult] = useState<PageSpeedResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = parsePerformanceToolUrlInput(url);
    if (!parsed) { setError(dictionary[locale].invalidUrl); setResult(null); return; }
    setLoading(true); setError("");
    try {
      setResult(await runPerformanceTool("/api/tools/core-web-vitals", { url: parsed.toString(), strategy }, isPageSpeedResponse));
    } catch (caught) {
      setResult(null); setError(caught instanceof Error ? caught.message : "Tool failed.");
    } finally { setLoading(false); }
  }

  return <form className="tool-grid pagespeed-tool" onSubmit={onSubmit}>
    <section className="tool-panel">
      <UrlField url={url} setUrl={setUrl} locale={locale} />
      <label className="field"><span>{locale === "ru" ? "Стратегия" : "Strategy"}</span><select value={strategy} onChange={(event) => setStrategy(event.target.value as "mobile" | "desktop" | "both")}><option value="mobile">Mobile</option><option value="desktop">Desktop</option><option value="both">Mobile + Desktop</option></select></label>
      <button className="button" type="submit" disabled={loading}>{loading ? dictionary[locale].loading : dictionary[locale].run}</button>
      <ErrorMessage value={error} />
    </section>
    {result && <section className="tool-panel tool-panel-wide"><h2>{dictionary[locale].result}</h2><div className="result-grid">{result.results.map((item) => <article className="result-card" key={item.strategy}><h3>{item.strategy.toUpperCase()}</h3><p>{item.available ? (item.field_data_available ? (locale === "ru" ? "Есть field data" : "Field data available") : (locale === "ru" ? "Только lab data" : "Lab data only")) : item.fetch_error}</p><h4>{dictionary[locale].categories}</h4><div className="single-audit-metrics">{Object.entries(item.category_scores).map(([category, score]) => <article key={category}><span>{lighthouseCategoryLabels[locale][category as keyof typeof lighthouseCategoryLabels.ru]}</span><strong>{score ?? "—"}</strong><small>/100</small></article>)}</div>{item.audit_findings.length > 0 && <><h4>{dictionary[locale].findings}</h4><ol className="result-list">{item.audit_findings.map((finding) => <li key={finding.id}><span className={badgeClass(finding.score === 0 ? "fail" : "warning")}>{lighthouseCategoryLabels[locale][finding.category]}</span> <strong>{finding.title}</strong>{finding.display_value ? ` · ${finding.display_value}` : ""}</li>)}</ol></>}{item.metrics.length > 0 && <ul className="result-list">{item.metrics.map((metric) => <li key={metric.id}><span className={badgeClass(metric.status)}>{statusLabel(metric.status, locale)}</span> {metric.title}: <strong>{metric.display_value ?? metric.value ?? "—"}</strong></li>)}</ul>}{item.opportunities.length > 0 && <><h4>{locale === "ru" ? "Возможности" : "Opportunities"}</h4><ul className="result-list">{item.opportunities.map((opportunity) => <li key={opportunity.id}>{opportunity.title}: {opportunity.display_value ?? `${Math.round(opportunity.savings_ms ?? 0)} ms`}</li>)}</ul></>}</article>)}</div><Recommendation value={result.recommendation} locale={locale} /></section>}
  </form>;
}

export function CachePolicyTool({ locale }: { locale: Locale }) {
  const [url, setUrl] = useState("https://example.com/app.css");
  const [result, setResult] = useState<CachePolicyResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = parsePerformanceToolUrlInput(url);
    if (!parsed) { setError(dictionary[locale].invalidUrl); setResult(null); return; }
    setLoading(true); setError("");
    try {
      setResult(await runPerformanceTool("/api/tools/cache-policy", { url: parsed.toString() }, isCachePolicyResponse));
    } catch (caught) {
      setResult(null); setError(caught instanceof Error ? caught.message : "Tool failed.");
    } finally { setLoading(false); }
  }

  return <form className="tool-grid" onSubmit={onSubmit}>
    <section className="tool-panel"><UrlField url={url} setUrl={setUrl} locale={locale} /><button className="button" type="submit" disabled={loading}>{loading ? dictionary[locale].loading : dictionary[locale].run}</button><ErrorMessage value={error} /></section>
    {result && <section className="tool-panel tool-panel-wide"><h2>{dictionary[locale].result}</h2><div className="metric-row"><span>{dictionary[locale].score}</span><strong>{result.score}/100</strong></div><div className="metric-row"><span>{dictionary[locale].finalUrl}</span><strong>{result.final_url}</strong></div><div className="result-grid">{result.checks.map((check) => <article className="result-card" key={check.id}><span className={badgeClass(check.status)}>{statusLabel(check.status, locale)}</span><h3>{check.title}</h3><p>{check.value ?? "—"}</p><p>{check.recommendation}</p></article>)}</div><Recommendation value={result.recommendation} locale={locale} /></section>}
  </form>;
}

export function PageWeightTool({ locale }: { locale: Locale }) {
  const [url, setUrl] = useState("https://example.com/");
  const [result, setResult] = useState<PageWeightResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = parsePerformanceToolUrlInput(url);
    if (!parsed) { setError(dictionary[locale].invalidUrl); setResult(null); return; }
    setLoading(true); setError("");
    try {
      setResult(await runPerformanceTool("/api/tools/page-weight", { url: parsed.toString() }, isPageWeightResponse));
    } catch (caught) {
      setResult(null); setError(caught instanceof Error ? caught.message : "Tool failed.");
    } finally { setLoading(false); }
  }

  return <form className="tool-grid" onSubmit={onSubmit}>
    <section className="tool-panel"><UrlField url={url} setUrl={setUrl} locale={locale} /><button className="button" type="submit" disabled={loading}>{loading ? dictionary[locale].loading : dictionary[locale].run}</button><ErrorMessage value={error} /></section>
    {result && <section className="tool-panel tool-panel-wide"><h2>{dictionary[locale].result}</h2><div className="result-grid"><article className="result-card"><h3>{locale === "ru" ? "Известный вес" : "Known weight"}</h3><p className="calculated-value">{formatBytes(result.total_known_bytes)}</p></article><article className="result-card"><h3>{locale === "ru" ? "Ресурсы" : "Resources"}</h3><p className="calculated-value">{result.checked_resource_count}/{result.discovered_resource_count}</p></article><article className="result-card"><h3>{locale === "ru" ? "Изображения" : "Images"}</h3><p>Modern: {result.modern_image_count} · Legacy: {result.legacy_image_count}</p></article></div>{result.summaries.length > 0 && <ul className="result-list">{result.summaries.map((summary) => <li key={summary.type}>{summary.type}: <strong>{summary.count}</strong> · {formatBytes(summary.known_bytes)} · unknown {summary.unknown_size_count}</li>)}</ul>}{result.largest_resources.length > 0 && <><h3>{locale === "ru" ? "Самые тяжёлые ресурсы" : "Largest resources"}</h3><ul className="result-list">{result.largest_resources.map((resource) => <li key={resource.url}>{resource.type}: <strong>{resource.content_length === null ? "—" : formatBytes(resource.content_length)}</strong> — {resource.url}</li>)}</ul></>}<Recommendation value={result.recommendation} locale={locale} /></section>}
  </form>;
}
