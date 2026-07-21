"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import {
  formatBytes,
  isCachePolicyResponse,
  isPageSpeedResponse,
  isPageWeightResponse,
  isToolErrorPayload,
  parsePerformanceToolUrlInput,
  statusLabel,
  type CachePolicyResponse,
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
  },
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

  return <form className="tool-grid" onSubmit={onSubmit}>
    <section className="tool-panel">
      <UrlField url={url} setUrl={setUrl} locale={locale} />
      <label className="field"><span>{locale === "ru" ? "Стратегия" : "Strategy"}</span><select value={strategy} onChange={(event) => setStrategy(event.target.value as "mobile" | "desktop" | "both")}><option value="mobile">Mobile</option><option value="desktop">Desktop</option><option value="both">Mobile + Desktop</option></select></label>
      <button className="button" type="submit" disabled={loading}>{loading ? dictionary[locale].loading : dictionary[locale].run}</button>
      <ErrorMessage value={error} />
    </section>
    {result && <section className="tool-panel tool-panel-wide"><h2>{dictionary[locale].result}</h2><div className="result-grid">{result.results.map((item) => <article className="result-card" key={item.strategy}><h3>{item.strategy.toUpperCase()}</h3><p className="calculated-value">{item.performance_score === null ? "—" : item.performance_score}</p><p>{item.available ? (item.field_data_available ? (locale === "ru" ? "Есть field data" : "Field data available") : (locale === "ru" ? "Только lab data" : "Lab data only")) : item.fetch_error}</p>{item.metrics.length > 0 && <ul className="result-list">{item.metrics.map((metric) => <li key={metric.id}><span className={badgeClass(metric.status)}>{statusLabel(metric.status, locale)}</span> {metric.title}: <strong>{metric.display_value ?? metric.value ?? "—"}</strong></li>)}</ul>}{item.opportunities.length > 0 && <><h4>{locale === "ru" ? "Возможности" : "Opportunities"}</h4><ul className="result-list">{item.opportunities.map((opportunity) => <li key={opportunity.id}>{opportunity.title}: {opportunity.display_value ?? `${Math.round(opportunity.savings_ms ?? 0)} ms`}</li>)}</ul></>}</article>)}</div><Recommendation value={result.recommendation} locale={locale} /></section>}
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
