"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { CopyButton } from "../../components/copy-button";

export interface CanonicalToolResponse {
  readonly contract_version: "webdiag.tool.canonical.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly content_type: string | null;
  readonly canonical_url: string | null;
  readonly resolved_canonical_url: string | null;
  readonly canonical_present: boolean;
  readonly canonical_is_absolute: boolean | null;
  readonly canonical_matches_final_url: boolean | null;
  readonly canonical_host_matches_final_url: boolean | null;
  readonly has_noindex: boolean;
  readonly redirect_count: number;
  readonly recommendation: string;
}

class CanonicalToolError extends Error {
  readonly code: string;

  constructor(message: string, code = "canonical_tool_error") {
    super(message);
    this.name = "CanonicalToolError";
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function isCanonicalToolResponse(payload: unknown): payload is CanonicalToolResponse {
  if (!isRecord(payload) || payload.contract_version !== "webdiag.tool.canonical.v1") return false;
  return (
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.final_url === "string" &&
    typeof payload.status_code === "number" &&
    (typeof payload.content_type === "string" || payload.content_type === null) &&
    (typeof payload.canonical_url === "string" || payload.canonical_url === null) &&
    (typeof payload.resolved_canonical_url === "string" || payload.resolved_canonical_url === null) &&
    typeof payload.canonical_present === "boolean" &&
    (typeof payload.canonical_is_absolute === "boolean" || payload.canonical_is_absolute === null) &&
    (typeof payload.canonical_matches_final_url === "boolean" || payload.canonical_matches_final_url === null) &&
    (typeof payload.canonical_host_matches_final_url === "boolean" || payload.canonical_host_matches_final_url === null) &&
    typeof payload.has_noindex === "boolean" &&
    typeof payload.redirect_count === "number" &&
    typeof payload.recommendation === "string"
  );
}

function extractError(payload: unknown): { code?: string; message?: string } {
  if (!isRecord(payload) || !isRecord(payload.detail)) return {};
  return {
    code: typeof payload.detail.code === "string" ? payload.detail.code : undefined,
    message: typeof payload.detail.message === "string" ? payload.detail.message : undefined,
  };
}

export function normalizeCanonicalToolUrlInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function parseCanonicalToolUrlInput(value: string): URL | null {
  const normalized = normalizeCanonicalToolUrlInput(value);
  if (!normalized) return null;
  try {
    const parsed = new URL(normalized);
    if (!/^https?:$/i.test(parsed.protocol)) return null;
    if (!parsed.hostname.includes(".")) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function canonicalStatusTone(result: Pick<CanonicalToolResponse, "canonical_present" | "canonical_matches_final_url" | "has_noindex">): "success" | "warning" | "danger" {
  if (result.has_noindex) return "danger";
  if (!result.canonical_present) return "warning";
  if (result.canonical_matches_final_url === false) return "danger";
  return "success";
}

export function canonicalStatusLabel(result: Pick<CanonicalToolResponse, "canonical_present" | "canonical_matches_final_url" | "has_noindex">, locale: Locale): string {
  if (result.has_noindex) return locale === "ru" ? "Noindex" : "Noindex";
  if (!result.canonical_present) return locale === "ru" ? "Canonical отсутствует" : "Canonical missing";
  if (result.canonical_matches_final_url === false) return locale === "ru" ? "Canonical не совпадает" : "Canonical mismatch";
  return locale === "ru" ? "Canonical совпадает" : "Canonical matches";
}

export function canonicalResultText(result: CanonicalToolResponse): string {
  return [
    `Requested: ${result.requested_url}`,
    `Final URL: ${result.final_url}`,
    `HTTP: ${result.status_code}`,
    `Canonical: ${result.canonical_url ?? "missing"}`,
    `Resolved canonical: ${result.resolved_canonical_url ?? "—"}`,
    `Matches final URL: ${String(result.canonical_matches_final_url)}`,
    `Noindex: ${String(result.has_noindex)}`,
    `Redirects: ${result.redirect_count}`,
    "",
    result.recommendation,
  ].join("\n");
}

async function runCanonicalCheck(url: string): Promise<CanonicalToolResponse> {
  const response = await fetch("/api/tools/canonical", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const extracted = extractError(payload);
    throw new CanonicalToolError(extracted.message ?? "Canonical check failed.", extracted.code);
  }
  if (!isCanonicalToolResponse(payload)) {
    throw new CanonicalToolError("Tool API returned an invalid response.", "invalid_response");
  }
  return payload;
}

function booleanLabel(value: boolean | null, locale: Locale): string {
  if (value === true) return locale === "ru" ? "Да" : "Yes";
  if (value === false) return locale === "ru" ? "Нет" : "No";
  return "—";
}

export function CanonicalCheckerTool({ locale }: { locale: Locale }) {
  const [input, setInput] = useState("https://example.com/catalog/page");
  const [result, setResult] = useState<CanonicalToolResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const copy = locale === "ru"
    ? {
        inputTitle: "URL страницы",
        inputLabel: "Адрес страницы",
        button: "Проверить canonical",
        loading: "Проверяем...",
        invalid: "Введите полный URL, например https://example.ru/catalog/page.",
        result: "Результат проверки",
        status: "Статус",
        finalUrl: "Финальный URL",
        canonical: "Canonical href",
        resolved: "Resolved canonical",
        signals: "Сигналы",
        absolute: "Абсолютный URL",
        host: "Host совпадает",
        noindex: "Noindex",
        redirects: "Редиректы",
        contentType: "Content-Type",
        recommendation: "Рекомендация",
        empty: "После проверки здесь появятся canonical href, финальный URL, noindex-сигналы и рекомендация по SEO-каноникализации.",
        missing: "Canonical не найден.",
      }
    : {
        inputTitle: "Page URL",
        inputLabel: "Page address",
        button: "Check canonical",
        loading: "Checking...",
        invalid: "Enter a full URL, for example https://example.com/catalog/page.",
        result: "Check result",
        status: "Status",
        finalUrl: "Final URL",
        canonical: "Canonical href",
        resolved: "Resolved canonical",
        signals: "Signals",
        absolute: "Absolute URL",
        host: "Host matches",
        noindex: "Noindex",
        redirects: "Redirects",
        contentType: "Content-Type",
        recommendation: "Recommendation",
        empty: "After the check, canonical href, final URL, noindex signals, and SEO canonicalization advice will appear here.",
        missing: "Canonical not found.",
      };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseCanonicalToolUrlInput(input);
    if (!parsed) {
      setError(copy.invalid);
      setResult(null);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      setResult(await runCanonicalCheck(parsed.toString()));
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "Canonical check failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return <div className="tool-grid canonical-checker-tool">
    <section className="tool-panel">
      <h2>{copy.inputTitle}</h2>
      <form className="canonical-checker-form" onSubmit={onSubmit}>
        <label className="field"><span>{copy.inputLabel}</span><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="https://example.com/catalog/page" /></label>
        <button className="button" type="submit" disabled={isLoading}>{isLoading ? copy.loading : copy.button}</button>
      </form>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </section>

    <section className="tool-panel canonical-checker-result" aria-live="polite">
      <h2>{copy.result}</h2>
      {result ? <>
        <dl className="result-meta canonical-checker-meta">
          <div><dt>{copy.status}</dt><dd className={`status-badge is-${canonicalStatusTone(result)}`}>{canonicalStatusLabel(result, locale)}</dd></div>
          <div><dt>HTTP</dt><dd>{result.status_code}</dd></div>
          <div><dt>{copy.redirects}</dt><dd>{result.redirect_count}</dd></div>
          <div><dt>{copy.contentType}</dt><dd>{result.content_type ?? "—"}</dd></div>
        </dl>
        <div className="canonical-checker-card">
          <h3>{copy.finalUrl}</h3>
          <p>{result.final_url}</p>
        </div>
        <div className="canonical-checker-card">
          <h3>{copy.canonical}</h3>
          <p>{result.canonical_url ?? copy.missing}</p>
          {result.resolved_canonical_url ? <small>{copy.resolved}: {result.resolved_canonical_url}</small> : null}
        </div>
        <div className="canonical-checker-signals">
          <article><span>{copy.absolute}</span><strong>{booleanLabel(result.canonical_is_absolute, locale)}</strong></article>
          <article><span>{copy.host}</span><strong>{booleanLabel(result.canonical_host_matches_final_url, locale)}</strong></article>
          <article><span>{copy.noindex}</span><strong>{booleanLabel(result.has_noindex, locale)}</strong></article>
        </div>
        <p className="canonical-checker-recommendation"><strong>{copy.recommendation}:</strong> {result.recommendation}</p>
        <CopyButton value={canonicalResultText(result)} locale={locale} />
      </> : <p className="muted-text">{copy.empty}</p>}
    </section>
  </div>;
}
