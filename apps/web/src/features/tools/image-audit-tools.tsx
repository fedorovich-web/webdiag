"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import {
  formatBytes,
  isFaviconResponse,
  isImagePerformanceResponse,
  isImageSeoResponse,
  isToolErrorPayload,
  parseImageToolUrlInput,
  statusLabel,
  type FaviconResponse,
  type ImageAuditToolResponse,
  type ImagePerformanceResponse,
  type ImageSeoResponse,
} from "./image-audit-tool-contract";

class ImageAuditToolError extends Error {
  readonly code: string;
  constructor(message: string, code = "image_audit_tool_error") {
    super(message);
    this.name = "ImageAuditToolError";
    this.code = code;
  }
}

async function runImageTool<T extends ImageAuditToolResponse>(endpoint: string, url: string, validator: (payload: unknown) => payload is T): Promise<T> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (isToolErrorPayload(payload)) throw new ImageAuditToolError(payload.detail.message, payload.detail.code);
    throw new ImageAuditToolError("Tool API request failed.", "tool_api_error");
  }
  if (!validator(payload)) throw new ImageAuditToolError("Tool API returned an invalid result.", "tool_api_invalid_response");
  return payload;
}

export function imagePerformanceResultText(result: ImagePerformanceResponse): string {
  return [
    `Final URL: ${result.final_url}`,
    `Images: ${result.checked_image_count}/${result.discovered_image_count}`,
    `Known image bytes: ${result.total_known_image_bytes}`,
    `Modern raster: ${result.modern_raster_count}`,
    `Legacy raster: ${result.legacy_raster_count}`,
    `Oversized: ${result.oversized_count}`,
    ...result.format_summaries.map((item) => `${item.format}: ${item.count} — ${item.known_bytes}`),
    `Recommendation: ${result.recommendation}`,
  ].join("\n");
}

export function imageSeoResultText(result: ImageSeoResponse): string {
  return [
    `Final URL: ${result.final_url}`,
    `Images: ${result.total_images}`,
    `Missing alt: ${result.missing_alt_count}`,
    `Linked without alt: ${result.linked_images_without_alt_count}`,
    `OG image: ${result.og_image_url ?? "—"}`,
    ...result.checks.map((check) => `${check.title}: ${check.value ?? "—"} — ${check.status}`),
    `Recommendation: ${result.recommendation}`,
  ].join("\n");
}

export function faviconResultText(result: FaviconResponse): string {
  return [
    `Final URL: ${result.final_url}`,
    `Icons: ${result.checked_icon_count}`,
    `SVG icon: ${result.has_svg_icon}`,
    `Apple touch icon: ${result.has_apple_touch_icon}`,
    `Manifest: ${result.manifest_url ?? "—"}`,
    ...result.icons.map((icon) => `${icon.rel}: ${icon.status_code ?? "—"} ${icon.format} ${icon.url}`),
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
    finalUrl: "Финальный URL",
  },
  en: {
    url: "Page URL",
    run: "Run check",
    loading: "Checking…",
    result: "Result",
    recommendation: "Recommendation",
    invalidUrl: "Enter a valid http(s) URL with a domain.",
    finalUrl: "Final URL",
  },
} as const;

function UrlField({ url, setUrl, locale }: { url: string; setUrl: (value: string) => void; locale: Locale }) {
  return <label className="field"><span>{dictionary[locale].url}</span><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/" /></label>;
}

function ErrorMessage({ value }: { value: string }) {
  return value ? <p className="tool-error" role="alert">{value}</p> : null;
}

function Recommendation({ value, locale }: { value: string; locale: Locale }) {
  return <div className="tool-note"><strong>{dictionary[locale].recommendation}:</strong> {value}</div>;
}

function badgeClass(status: string) {
  return status === "pass" ? "tool-badge tool-badge-success" : status === "fail" ? "tool-badge tool-badge-danger" : "tool-badge tool-badge-warning";
}

export function ImagePerformanceCheckerTool({ locale }: { locale: Locale }) {
  const [url, setUrl] = useState("https://example.com/");
  const [result, setResult] = useState<ImagePerformanceResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseImageToolUrlInput(url);
    if (!parsed) { setError(dictionary[locale].invalidUrl); setResult(null); return; }
    setLoading(true); setError("");
    try { setResult(await runImageTool("/api/tools/image-performance", parsed.toString(), isImagePerformanceResponse)); }
    catch (caught) { setResult(null); setError(caught instanceof Error ? caught.message : "Tool failed."); }
    finally { setLoading(false); }
  }

  return <form className="tool-grid" onSubmit={onSubmit}>
    <section className="tool-panel"><UrlField url={url} setUrl={setUrl} locale={locale} /><button className="button" type="submit" disabled={loading}>{loading ? dictionary[locale].loading : dictionary[locale].run}</button><ErrorMessage value={error} /></section>
    {result && <section className="tool-panel tool-panel-wide"><h2>{dictionary[locale].result}</h2><div className="result-grid"><article className="result-card"><h3>{locale === "ru" ? "Форматы" : "Formats"}</h3><p className="calculated-value">{result.modern_raster_count}/{result.checked_image_count}</p><p>{locale === "ru" ? "современные raster-форматы" : "modern raster formats"}</p><ul className="result-list">{result.format_summaries.map((item) => <li key={item.format}>{item.format}: <strong>{item.count}</strong> — {formatBytes(item.known_bytes)}</li>)}</ul></article><article className="result-card"><h3>{locale === "ru" ? "Проблемы" : "Issues"}</h3><ul className="result-list"><li>Legacy raster: <strong>{result.legacy_raster_count}</strong></li><li>Oversized: <strong>{result.oversized_count}</strong></li><li>Missing width/height: <strong>{result.missing_dimensions_count}</strong></li><li>Lazy-load candidates: <strong>{result.lazy_loading_candidate_count}</strong></li></ul></article></div>{result.largest_images.length > 0 && <ul className="result-list">{result.largest_images.slice(0, 6).map((image) => <li key={image.url}><strong>{image.format}</strong> {formatBytes(image.content_length)} — {image.url}</li>)}</ul>}<Recommendation value={result.recommendation} locale={locale} /></section>}
  </form>;
}

export function ImageSeoAuditTool({ locale }: { locale: Locale }) {
  const [url, setUrl] = useState("https://example.com/");
  const [result, setResult] = useState<ImageSeoResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseImageToolUrlInput(url);
    if (!parsed) { setError(dictionary[locale].invalidUrl); setResult(null); return; }
    setLoading(true); setError("");
    try { setResult(await runImageTool("/api/tools/image-seo", parsed.toString(), isImageSeoResponse)); }
    catch (caught) { setResult(null); setError(caught instanceof Error ? caught.message : "Tool failed."); }
    finally { setLoading(false); }
  }

  return <form className="tool-grid" onSubmit={onSubmit}>
    <section className="tool-panel"><UrlField url={url} setUrl={setUrl} locale={locale} /><button className="button" type="submit" disabled={loading}>{loading ? dictionary[locale].loading : dictionary[locale].run}</button><ErrorMessage value={error} /></section>
    {result && <section className="tool-panel tool-panel-wide"><h2>{dictionary[locale].result}</h2><div className="result-grid"><article className="result-card"><h3>Alt / SEO</h3><p className="calculated-value">{result.total_images}</p><p>{locale === "ru" ? "изображений найдено" : "images found"}</p><ul className="result-list"><li>Missing alt: <strong>{result.missing_alt_count}</strong></li><li>Empty alt: <strong>{result.empty_alt_count}</strong></li><li>Linked without alt: <strong>{result.linked_images_without_alt_count}</strong></li><li>Responsive: <strong>{result.responsive_image_count}</strong></li></ul></article><article className="result-card"><h3>{locale === "ru" ? "Проверки" : "Checks"}</h3><ul className="result-list">{result.checks.map((check) => <li key={check.id}><span className={badgeClass(check.status)}>{statusLabel(check.status, locale)}</span> {check.title}: {check.value ?? "—"}</li>)}</ul></article></div><Recommendation value={result.recommendation} locale={locale} /></section>}
  </form>;
}

export function FaviconCheckerTool({ locale }: { locale: Locale }) {
  const [url, setUrl] = useState("https://example.com/");
  const [result, setResult] = useState<FaviconResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseImageToolUrlInput(url);
    if (!parsed) { setError(dictionary[locale].invalidUrl); setResult(null); return; }
    setLoading(true); setError("");
    try { setResult(await runImageTool("/api/tools/favicon", parsed.toString(), isFaviconResponse)); }
    catch (caught) { setResult(null); setError(caught instanceof Error ? caught.message : "Tool failed."); }
    finally { setLoading(false); }
  }

  return <form className="tool-grid" onSubmit={onSubmit}>
    <section className="tool-panel"><UrlField url={url} setUrl={setUrl} locale={locale} /><button className="button" type="submit" disabled={loading}>{loading ? dictionary[locale].loading : dictionary[locale].run}</button><ErrorMessage value={error} /></section>
    {result && <section className="tool-panel tool-panel-wide"><h2>{dictionary[locale].result}</h2><div className="result-grid"><article className="result-card"><h3>{locale === "ru" ? "Покрытие" : "Coverage"}</h3><ul className="result-list"><li>Favicon: <strong>{result.has_favicon ? "yes" : "no"}</strong></li><li>SVG: <strong>{result.has_svg_icon ? "yes" : "no"}</strong></li><li>Apple touch icon: <strong>{result.has_apple_touch_icon ? "yes" : "no"}</strong></li><li>Manifest: <strong>{result.has_manifest ? "yes" : "no"}</strong></li></ul></article><article className="result-card"><h3>{locale === "ru" ? "Иконки" : "Icons"}</h3><ul className="result-list">{result.icons.map((icon) => <li key={`${icon.rel}-${icon.url}`}><strong>{icon.format}</strong> {icon.status_code ?? "—"} — {icon.rel}</li>)}</ul></article></div><Recommendation value={result.recommendation} locale={locale} /></section>}
  </form>;
}
