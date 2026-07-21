"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { CopyButton } from "../../components/copy-button";

export interface SitemapLocResult {
  readonly url: string;
}

export interface SitemapXmlToolResponse {
  readonly contract_version: "webdiag.tool.sitemap_xml.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly sitemap_url: string;
  readonly target_url: string | null;
  readonly status_code: number | null;
  readonly available: boolean;
  readonly valid_xml: boolean;
  readonly kind: "urlset" | "sitemapindex" | "unknown";
  readonly url_count: number;
  readonly sitemap_count: number;
  readonly contains_target: boolean | null;
  readonly sample_urls: readonly SitemapLocResult[];
  readonly sample_sitemaps: readonly SitemapLocResult[];
  readonly content_type: string | null;
  readonly parse_error: string | null;
  readonly fetch_error: string | null;
  readonly recommendation: string;
}

class SitemapToolError extends Error {
  readonly code: string;

  constructor(message: string, code = "sitemap_tool_error") {
    super(message);
    this.name = "SitemapToolError";
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isLoc(payload: unknown): payload is SitemapLocResult {
  return isRecord(payload) && typeof payload.url === "string";
}

export function isSitemapXmlToolResponse(payload: unknown): payload is SitemapXmlToolResponse {
  if (!isRecord(payload) || payload.contract_version !== "webdiag.tool.sitemap_xml.v1") return false;
  return (
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.sitemap_url === "string" &&
    (typeof payload.target_url === "string" || payload.target_url === null) &&
    (typeof payload.status_code === "number" || payload.status_code === null) &&
    typeof payload.available === "boolean" &&
    typeof payload.valid_xml === "boolean" &&
    (payload.kind === "urlset" || payload.kind === "sitemapindex" || payload.kind === "unknown") &&
    typeof payload.url_count === "number" &&
    typeof payload.sitemap_count === "number" &&
    (typeof payload.contains_target === "boolean" || payload.contains_target === null) &&
    Array.isArray(payload.sample_urls) &&
    payload.sample_urls.every(isLoc) &&
    Array.isArray(payload.sample_sitemaps) &&
    payload.sample_sitemaps.every(isLoc) &&
    (typeof payload.content_type === "string" || payload.content_type === null) &&
    (typeof payload.parse_error === "string" || payload.parse_error === null) &&
    (typeof payload.fetch_error === "string" || payload.fetch_error === null) &&
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

export function normalizeSitemapToolUrlInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function parseSitemapToolUrlInput(value: string): URL | null {
  const normalized = normalizeSitemapToolUrlInput(value);
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

export function sitemapStatusLabel(result: Pick<SitemapXmlToolResponse, "available" | "valid_xml" | "kind">, locale: Locale): string {
  if (!result.available) return locale === "ru" ? "Sitemap недоступен" : "Sitemap unavailable";
  if (!result.valid_xml) return locale === "ru" ? "XML с ошибкой" : "Invalid XML";
  if (result.kind === "sitemapindex") return locale === "ru" ? "Sitemap index" : "Sitemap index";
  if (result.kind === "urlset") return locale === "ru" ? "Sitemap URL" : "URL sitemap";
  return locale === "ru" ? "Неизвестный XML" : "Unknown XML";
}

export function sitemapStatusTone(result: Pick<SitemapXmlToolResponse, "available" | "valid_xml" | "kind">): "success" | "warning" | "danger" {
  if (!result.available) return "warning";
  if (!result.valid_xml) return "danger";
  if (result.kind === "unknown") return "warning";
  return "success";
}

export function sitemapContainsTargetLabel(result: Pick<SitemapXmlToolResponse, "target_url" | "contains_target">, locale: Locale): string {
  if (!result.target_url) return locale === "ru" ? "Целевой URL не задан" : "No target URL";
  if (result.contains_target === true) return locale === "ru" ? "URL найден" : "URL found";
  if (result.contains_target === false) return locale === "ru" ? "URL не найден" : "URL not found";
  return locale === "ru" ? "Не определено" : "Unknown";
}

export function sitemapResultText(result: SitemapXmlToolResponse): string {
  const samples = result.kind === "sitemapindex" ? result.sample_sitemaps : result.sample_urls;
  return [
    `Sitemap: ${result.sitemap_url}`,
    `Target: ${result.target_url ?? "—"}`,
    `Status: ${result.status_code ?? "—"}`,
    `Available: ${result.available}`,
    `Valid XML: ${result.valid_xml}`,
    `Kind: ${result.kind}`,
    `URL count: ${result.url_count}`,
    `Child sitemap count: ${result.sitemap_count}`,
    `Contains target: ${String(result.contains_target)}`,
    "",
    samples.length ? samples.map((item) => item.url).join("\n") : "No sample URLs",
  ].join("\n");
}

async function runSitemapCheck(url: string, targetUrl: string): Promise<SitemapXmlToolResponse> {
  const body: { url: string; target_url?: string } = { url };
  if (targetUrl.trim()) body.target_url = targetUrl.trim();
  const response = await fetch("/api/tools/sitemap", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const extracted = extractError(payload);
    throw new SitemapToolError(extracted.message ?? "Sitemap check failed.", extracted.code);
  }
  if (!isSitemapXmlToolResponse(payload)) {
    throw new SitemapToolError("Tool API returned an invalid response.", "invalid_response");
  }
  return payload;
}

export function SitemapValidatorTool({ locale }: { locale: Locale }) {
  const [input, setInput] = useState("https://example.com/sitemap.xml");
  const [targetUrl, setTargetUrl] = useState("https://example.com/catalog/page");
  const [result, setResult] = useState<SitemapXmlToolResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const copy = locale === "ru"
    ? {
        inputTitle: "Sitemap и целевой URL",
        inputLabel: "Адрес сайта или sitemap.xml",
        targetLabel: "Проверить наличие URL, необязательно",
        button: "Проверить sitemap.xml",
        loading: "Проверяем...",
        invalid: "Введите полный URL, например https://example.ru/sitemap.xml.",
        result: "Результат проверки",
        status: "Статус",
        sitemapUrl: "Sitemap URL",
        target: "Целевой URL",
        kind: "Тип XML",
        urls: "URL в sitemap",
        childSitemaps: "Дочерние sitemap",
        samples: "Примеры URL",
        recommendation: "Рекомендация",
        empty: "После проверки здесь появятся статус sitemap.xml, тип XML, количество URL и наличие целевой страницы.",
        noSamples: "Примеры не найдены.",
      }
    : {
        inputTitle: "Sitemap and target URL",
        inputLabel: "Site address or sitemap.xml",
        targetLabel: "Check whether this URL is listed, optional",
        button: "Check sitemap.xml",
        loading: "Checking...",
        invalid: "Enter a full URL, for example https://example.com/sitemap.xml.",
        result: "Check result",
        status: "Status",
        sitemapUrl: "Sitemap URL",
        target: "Target URL",
        kind: "XML type",
        urls: "URLs in sitemap",
        childSitemaps: "Child sitemaps",
        samples: "Sample URLs",
        recommendation: "Recommendation",
        empty: "After the check, sitemap.xml status, XML type, URL count, and target presence will appear here.",
        noSamples: "No samples found.",
      };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseSitemapToolUrlInput(input);
    if (!parsed) {
      setError(copy.invalid);
      setResult(null);
      return;
    }
    const parsedTarget = targetUrl.trim() ? parseSitemapToolUrlInput(targetUrl) : null;
    if (targetUrl.trim() && !parsedTarget) {
      setError(copy.invalid);
      setResult(null);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      setResult(await runSitemapCheck(parsed.toString(), parsedTarget ? parsedTarget.toString() : ""));
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "Sitemap check failed.");
    } finally {
      setIsLoading(false);
    }
  }

  const samples = result ? (result.kind === "sitemapindex" ? result.sample_sitemaps : result.sample_urls) : [];

  return <div className="tool-grid sitemap-validator-tool">
    <section className="tool-panel">
      <h2>{copy.inputTitle}</h2>
      <form className="sitemap-validator-form" onSubmit={onSubmit}>
        <label className="field"><span>{copy.inputLabel}</span><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="https://example.com/sitemap.xml" /></label>
        <label className="field"><span>{copy.targetLabel}</span><input value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} placeholder="https://example.com/catalog/page" /></label>
        <button className="button" type="submit" disabled={isLoading}>{isLoading ? copy.loading : copy.button}</button>
      </form>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </section>

    <section className="tool-panel sitemap-validator-result" aria-live="polite">
      <h2>{copy.result}</h2>
      {result ? <>
        <dl className="result-meta sitemap-validator-meta">
          <div><dt>{copy.status}</dt><dd className={`status-badge is-${sitemapStatusTone(result)}`}>{sitemapStatusLabel(result, locale)}</dd></div>
          <div><dt>HTTP</dt><dd>{result.status_code ?? "—"}</dd></div>
          <div><dt>{copy.kind}</dt><dd>{result.kind}</dd></div>
          <div><dt>{copy.target}</dt><dd>{sitemapContainsTargetLabel(result, locale)}</dd></div>
        </dl>
        <div className="sitemap-validator-summary">
          <article><span>{copy.urls}</span><strong>{result.url_count}</strong></article>
          <article><span>{copy.childSitemaps}</span><strong>{result.sitemap_count}</strong></article>
        </div>
        <div className="sitemap-validator-card"><h3>{copy.sitemapUrl}</h3><p>{result.sitemap_url}</p>{result.target_url ? <p>{copy.target}: {result.target_url}</p> : null}</div>
        <div className="sitemap-validator-samples">
          <h3>{copy.samples}</h3>
          {samples.length ? <ul className="result-list">{samples.map((item) => <li key={item.url}>{item.url}</li>)}</ul> : <p className="muted-text">{copy.noSamples}</p>}
        </div>
        <p className="sitemap-validator-recommendation"><strong>{copy.recommendation}:</strong> {result.recommendation}</p>
        <CopyButton value={sitemapResultText(result)} locale={locale} />
      </> : <p className="muted-text">{copy.empty}</p>}
    </section>
  </div>;
}
