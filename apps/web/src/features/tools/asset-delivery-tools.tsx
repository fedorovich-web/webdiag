"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { CopyButton } from "../../components/copy-button";
import {
  isCssDeliveryAnalyzerResponse,
  isFontLoadingAnalyzerResponse,
  isJavaScriptBundleSurfaceResponse,
  type AssetDeliveryToolResponse,
  type CssDeliveryAnalyzerResponse,
  type FontLoadingAnalyzerResponse,
  type JavaScriptBundleSurfaceResponse,
} from "./asset-delivery-tool-contract";
import {
  isToolErrorPayload,
  parsePageUrlInput,
  type ToolStatus,
} from "./client-delivery-tool-contract";

type ToolKind = "javascript-bundle" | "css-delivery" | "font-loading";
type ToolEndpoint =
  | "/api/tools/javascript-bundle-surface"
  | "/api/tools/css-delivery"
  | "/api/tools/font-loading";

const copy = {
  ru: {
    url: "URL страницы",
    run: "Запустить анализ",
    loading: "Анализируем…",
    invalidUrl: "Введите полный http/https URL без логина и пароля.",
    result: "Результат",
    status: "Статус",
    recommendation: "Рекомендация",
    copy: "Копировать отчёт",
    truncated: "Показана ограниченная выборка; общие счётчики сохранены.",
    uniqueScripts: "Уникальные JS-файлы",
    declaredSize: "Заявленный объём",
    moduleClassic: "Модули / классические",
    blockingCandidates: "Кандидаты на блокировку парсинга",
    compressedLongCache: "Сжатие / длительный кеш",
    failedAssets: "Ошибки проверки ресурсов",
    stylesheets: "Таблицы стилей",
    decodedSample: "Проверенный объём CSS",
    inlineBlocksBytes: "Inline-блоки / объём",
    importsFontFaces: "@import / @font-face",
    compressed: "Ответы со сжатием",
    failedStylesheets: "Ошибки проверки CSS",
    fontFaces: "Начертания @font-face",
    familiesSources: "Семейства / источники",
    matchedPreloads: "Связанные preload",
    missingDisplayBlock: "Нет font-display / block",
    woff2CrossHost: "WOFF2 / другой hostname",
    unnamedFamily: "Без имени семейства",
    displayMissing: "font-display отсутствует",
  },
  en: {
    url: "Page URL",
    run: "Run analysis",
    loading: "Analyzing…",
    invalidUrl: "Enter a full http/https URL without credentials.",
    result: "Result",
    status: "Status",
    recommendation: "Recommendation",
    copy: "Copy report",
    truncated: "A bounded sample is shown; aggregate counts are preserved.",
    uniqueScripts: "Unique scripts",
    declaredSize: "Declared size",
    moduleClassic: "Module / classic",
    blockingCandidates: "Parser-blocking candidates",
    compressedLongCache: "Compressed / long cache",
    failedAssets: "Failed asset checks",
    stylesheets: "Stylesheets",
    decodedSample: "Sampled CSS bytes",
    inlineBlocksBytes: "Inline blocks / bytes",
    importsFontFaces: "@import / @font-face",
    compressed: "Compressed responses",
    failedStylesheets: "Failed stylesheet checks",
    fontFaces: "@font-face rules",
    familiesSources: "Families / sources",
    matchedPreloads: "Matched preloads",
    missingDisplayBlock: "Missing font-display / block",
    woff2CrossHost: "WOFF2 / cross-host",
    unnamedFamily: "Unnamed family",
    displayMissing: "font-display missing",
  },
} as const;

class AssetDeliveryToolError extends Error {
  readonly code: string;

  constructor(message: string, code = "asset_delivery_tool_error") {
    super(message);
    this.name = "AssetDeliveryToolError";
    this.code = code;
  }
}

function endpointFor(kind: ToolKind): ToolEndpoint {
  if (kind === "javascript-bundle") return "/api/tools/javascript-bundle-surface";
  if (kind === "css-delivery") return "/api/tools/css-delivery";
  return "/api/tools/font-loading";
}

async function runAssetDeliveryTool(
  kind: ToolKind,
  url: string,
): Promise<AssetDeliveryToolResponse> {
  const response = await fetch(endpointFor(kind), {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (isToolErrorPayload(data)) {
      throw new AssetDeliveryToolError(data.detail.message, data.detail.code);
    }
    throw new AssetDeliveryToolError("Tool API request failed.");
  }
  if (kind === "javascript-bundle" && isJavaScriptBundleSurfaceResponse(data)) return data;
  if (kind === "css-delivery" && isCssDeliveryAnalyzerResponse(data)) return data;
  if (kind === "font-loading" && isFontLoadingAnalyzerResponse(data)) return data;
  throw new AssetDeliveryToolError("Tool API returned an invalid result.");
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="tool-panel"><h2>{title}</h2>{children}</section>;
}

function StatusBadge({ value }: { value: ToolStatus }) {
  return <span className={`tool-status tool-status-${value}`}>{value}</span>;
}

function formatBytes(value: number | null): string {
  if (value === null) return "—";
  if (value < 1_024) return `${value} B`;
  if (value < 1_048_576) return `${(value / 1_024).toFixed(1)} KB`;
  return `${(value / 1_048_576).toFixed(2)} MB`;
}

function Recommendation({ locale, value }: { locale: Locale; value: string }) {
  return <p className="tool-note"><strong>{copy[locale].recommendation}:</strong> {value}</p>;
}

function ResultActions({ locale, value }: { locale: Locale; value: string }) {
  return <div className="output-wrap">
    <pre className="output" aria-label={copy[locale].copy}>{value}</pre>
    <CopyButton value={value} locale={locale} />
  </div>;
}

function UrlForm({
  locale,
  loading,
  onSubmit,
}: {
  locale: Locale;
  loading: boolean;
  onSubmit: (url: string) => void;
}) {
  const [url, setUrl] = useState("https://example.com/");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parsePageUrlInput(url);
    if (!parsed) {
      setError(copy[locale].invalidUrl);
      return;
    }
    setError("");
    onSubmit(parsed);
  }

  return <Panel title={copy[locale].url}>
    <form className="tool-form" onSubmit={submit}>
      <label className="field">
        <span>{copy[locale].url}</span>
        <input
          value={url}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setUrl(event.target.value)}
        />
      </label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="button" type="submit" disabled={loading}>
        {loading ? copy[locale].loading : copy[locale].run}
      </button>
    </form>
  </Panel>;
}

export function javascriptBundleResultText(
  result: JavaScriptBundleSurfaceResponse,
  locale: Locale = "en",
): string {
  const findings = result.findings
    .map((finding) => `${finding.severity}: ${finding.title}`)
    .join("\n");
  return [
    `URL: ${result.final_url}`,
    `${copy[locale].uniqueScripts}: ${result.unique_script_count}`,
    `${locale === "ru" ? "Проверено JS-файлов" : "Checked scripts"}: ${result.checked_script_count}`,
    `${copy[locale].declaredSize}: ${result.known_declared_bytes}`,
    `${copy[locale].blockingCandidates}: ${result.parser_blocking_candidate_count}`,
    `${locale === "ru" ? "Ответы со сжатием" : "Compressed responses"}: ${result.compressed_response_count}`,
    `${locale === "ru" ? "Ответы с длительным кешем" : "Long-cache responses"}: ${result.long_cache_count}`,
    `${copy[locale].failedAssets}: ${result.failed_asset_count}`,
    findings,
    `Status: ${result.status}`,
    `Recommendation: ${result.recommendation}`,
  ].filter(Boolean).join("\n");
}

export function cssDeliveryResultText(
  result: CssDeliveryAnalyzerResponse,
  locale: Locale = "en",
): string {
  const findings = result.findings
    .map((finding) => `${finding.severity}: ${finding.title}`)
    .join("\n");
  return [
    `URL: ${result.final_url}`,
    `${copy[locale].stylesheets}: ${result.unique_stylesheet_count}`,
    `${locale === "ru" ? "Проверено таблиц стилей" : "Checked stylesheets"}: ${result.checked_stylesheet_count}`,
    `${locale === "ru" ? "Объём inline CSS" : "Inline style bytes"}: ${result.inline_style_bytes}`,
    `${copy[locale].decodedSample}: ${result.sampled_decoded_bytes}`,
    `${locale === "ru" ? "@import" : "@import rules"}: ${result.import_rule_count}`,
    `${locale === "ru" ? "@font-face" : "@font-face rules"}: ${result.font_face_rule_count}`,
    `${copy[locale].failedStylesheets}: ${result.failed_stylesheet_count}`,
    findings,
    `Status: ${result.status}`,
    `Recommendation: ${result.recommendation}`,
  ].filter(Boolean).join("\n");
}

export function fontLoadingResultText(
  result: FontLoadingAnalyzerResponse,
  locale: Locale = "en",
): string {
  const findings = result.findings
    .map((finding) => `${finding.severity}: ${finding.title}`)
    .join("\n");
  return [
    `URL: ${result.final_url}`,
    `${copy[locale].fontFaces}: ${result.font_face_count}`,
    `${locale === "ru" ? "Семейства" : "Families"}: ${result.family_count}`,
    `${locale === "ru" ? "Уникальные источники шрифтов" : "Unique font sources"}: ${result.unique_font_source_count}`,
    `${locale === "ru" ? "Проверено источников" : "Checked font sources"}: ${result.checked_font_source_count}`,
    `${copy[locale].matchedPreloads}: ${result.matched_preload_count}/${result.preload_count}`,
    `${locale === "ru" ? "Нет font-display" : "Missing font-display"}: ${result.missing_font_display_count}`,
    `font-display:block: ${result.blocking_font_display_count}`,
    `${copy[locale].declaredSize}: ${result.known_declared_bytes}`,
    findings,
    `Status: ${result.status}`,
    `Recommendation: ${result.recommendation}`,
  ].filter(Boolean).join("\n");
}

function Findings({ findings }: { findings: readonly { id: string; title: string; severity: string }[] }) {
  if (!findings.length) return null;
  return <ul className="result-list">
    {findings.slice(0, 10).map((finding) => (
      <li key={finding.id}><strong>{finding.severity} · {finding.title}</strong></li>
    ))}
  </ul>;
}

function JavaScriptResult({
  locale,
  result,
}: {
  locale: Locale;
  result: JavaScriptBundleSurfaceResponse;
}) {
  return <Panel title={copy[locale].result}>
    <div className="metric-grid">
      <div><span>{copy[locale].uniqueScripts}</span><strong>{result.unique_script_count}</strong></div>
      <div><span>{copy[locale].declaredSize}</span><strong>{formatBytes(result.known_declared_bytes)}</strong></div>
      <div><span>{copy[locale].status}</span><strong><StatusBadge value={result.status} /></strong></div>
    </div>
    <ul className="result-list">
      <li><strong>{copy[locale].moduleClassic}</strong><span>{result.module_script_count} / {result.classic_script_count}</span></li>
      <li><strong>{copy[locale].blockingCandidates}</strong><span>{result.parser_blocking_candidate_count}</span></li>
      <li><strong>{copy[locale].compressedLongCache}</strong><span>{result.compressed_response_count} / {result.long_cache_count}</span></li>
      <li><strong>{copy[locale].failedAssets}</strong><span>{result.failed_asset_count}</span></li>
      {result.assets.slice(0, 12).map((asset) => (
        <li key={asset.resolved_url}>
          <strong>{asset.hostname ?? asset.resolved_url}</strong>
          <span>{asset.script_kind} · {formatBytes(asset.declared_bytes)} · {asset.fetch_state}</span>
        </li>
      ))}
    </ul>
    <Findings findings={result.findings} />
    {result.truncated ? <p className="tool-note">{copy[locale].truncated}</p> : null}
    <Recommendation locale={locale} value={result.recommendation} />
    <ResultActions locale={locale} value={javascriptBundleResultText(result, locale)} />
  </Panel>;
}

function CssResult({ locale, result }: { locale: Locale; result: CssDeliveryAnalyzerResponse }) {
  return <Panel title={copy[locale].result}>
    <div className="metric-grid">
      <div><span>{copy[locale].stylesheets}</span><strong>{result.unique_stylesheet_count}</strong></div>
      <div><span>{copy[locale].decodedSample}</span><strong>{formatBytes(result.sampled_decoded_bytes + result.inline_style_bytes)}</strong></div>
      <div><span>{copy[locale].status}</span><strong><StatusBadge value={result.status} /></strong></div>
    </div>
    <ul className="result-list">
      <li><strong>{copy[locale].inlineBlocksBytes}</strong><span>{result.inline_style_block_count} / {formatBytes(result.inline_style_bytes)}</span></li>
      <li><strong>{copy[locale].importsFontFaces}</strong><span>{result.import_rule_count} / {result.font_face_rule_count}</span></li>
      <li><strong>{copy[locale].compressed}</strong><span>{result.compressed_response_count}</span></li>
      <li><strong>{copy[locale].failedStylesheets}</strong><span>{result.failed_stylesheet_count}</span></li>
      {result.stylesheets.slice(0, 12).map((asset) => (
        <li key={asset.resolved_url}>
          <strong>{asset.hostname ?? asset.resolved_url}</strong>
          <span>{formatBytes(asset.sampled_decoded_bytes)} · {asset.media ?? "all"} · {asset.fetch_state}</span>
        </li>
      ))}
    </ul>
    <Findings findings={result.findings} />
    {result.truncated ? <p className="tool-note">{copy[locale].truncated}</p> : null}
    <Recommendation locale={locale} value={result.recommendation} />
    <ResultActions locale={locale} value={cssDeliveryResultText(result, locale)} />
  </Panel>;
}

function FontResult({ locale, result }: { locale: Locale; result: FontLoadingAnalyzerResponse }) {
  return <Panel title={copy[locale].result}>
    <div className="metric-grid">
      <div><span>{copy[locale].fontFaces}</span><strong>{result.font_face_count}</strong></div>
      <div><span>{copy[locale].declaredSize}</span><strong>{formatBytes(result.known_declared_bytes)}</strong></div>
      <div><span>{copy[locale].status}</span><strong><StatusBadge value={result.status} /></strong></div>
    </div>
    <ul className="result-list">
      <li><strong>{copy[locale].familiesSources}</strong><span>{result.family_count} / {result.unique_font_source_count}</span></li>
      <li><strong>{copy[locale].matchedPreloads}</strong><span>{result.matched_preload_count} / {result.preload_count}</span></li>
      <li><strong>{copy[locale].missingDisplayBlock}</strong><span>{result.missing_font_display_count} / {result.blocking_font_display_count}</span></li>
      <li><strong>{copy[locale].woff2CrossHost}</strong><span>{result.woff2_source_count} / {result.cross_host_font_count}</span></li>
      {result.faces.slice(0, 10).map((face) => (
        <li key={`${face.position}-${face.source_stylesheet_url}`}>
          <strong>{face.family ?? copy[locale].unnamedFamily}</strong>
          <span>{face.weight} · {face.style} · {face.display ?? copy[locale].displayMissing}</span>
        </li>
      ))}
    </ul>
    <Findings findings={result.findings} />
    {result.truncated ? <p className="tool-note">{copy[locale].truncated}</p> : null}
    <Recommendation locale={locale} value={result.recommendation} />
    <ResultActions locale={locale} value={fontLoadingResultText(result, locale)} />
  </Panel>;
}

function AssetDeliveryTool({ locale, kind }: { locale: Locale; kind: ToolKind }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AssetDeliveryToolResponse | null>(null);

  async function submit(url: string) {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      setResult(await runAssetDeliveryTool(kind, url));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Tool request failed.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="tool-grid">
    <UrlForm locale={locale} loading={loading} onSubmit={submit} />
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    {result?.contract_version === "webdiag.tool.javascript_bundle_surface.v1"
      ? <JavaScriptResult locale={locale} result={result} />
      : null}
    {result?.contract_version === "webdiag.tool.css_delivery_analyzer.v1"
      ? <CssResult locale={locale} result={result} />
      : null}
    {result?.contract_version === "webdiag.tool.font_loading_analyzer.v1"
      ? <FontResult locale={locale} result={result} />
      : null}
  </div>;
}

export function JavaScriptBundleSurfaceTool({ locale }: { locale: Locale }) {
  return <AssetDeliveryTool locale={locale} kind="javascript-bundle" />;
}

export function CssDeliveryAnalyzerTool({ locale }: { locale: Locale }) {
  return <AssetDeliveryTool locale={locale} kind="css-delivery" />;
}

export function FontLoadingAnalyzerTool({ locale }: { locale: Locale }) {
  return <AssetDeliveryTool locale={locale} kind="font-loading" />;
}
