"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { CopyButton } from "../../components/copy-button";
import {
  isMetaTagsResponse,
  isSerpPreviewResponse,
  isSocialPreviewResponse,
  isToolErrorPayload,
  metadataCheckStatusLabel,
  parseMetadataToolUrlInput,
  type MetaTagsResponse,
  type MetadataToolResponse,
  type SerpPreviewResponse,
  type SocialCardPreviewResponse,
  type SocialPreviewResponse,
} from "./metadata-tool-contract";

class MetadataToolError extends Error {
  readonly code: string;

  constructor(message: string, code = "metadata_tool_error") {
    super(message);
    this.name = "MetadataToolError";
    this.code = code;
  }
}

async function runMetadataTool<T extends MetadataToolResponse>(
  endpoint: string,
  url: string,
  validator: (payload: unknown) => payload is T,
): Promise<T> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new MetadataToolError(
      isToolErrorPayload(payload) ? payload.detail.message : "Metadata tool request failed.",
      isToolErrorPayload(payload) ? payload.detail.code : "metadata_tool_request_failed",
    );
  }
  if (!validator(payload)) {
    throw new MetadataToolError("Tool API returned an invalid response.", "invalid_response");
  }
  return payload;
}


export function metadataStatusTone(status: "pass" | "warning" | "fail"): "success" | "warning" | "danger" {
  if (status === "pass") return "success";
  return status === "warning" ? "warning" : "danger";
}

export function metaTagsResultText(result: MetaTagsResponse): string {
  return [
    `Requested: ${result.requested_url}`,
    `Final URL: ${result.final_url}`,
    `HTTP: ${result.status_code}`,
    `Title: ${result.title ?? "missing"}`,
    `Title length: ${result.title_length}`,
    `Meta description: ${result.meta_description ?? "missing"}`,
    `Meta description length: ${result.meta_description_length}`,
    `Canonical: ${result.resolved_canonical_url ?? "missing"}`,
    `H1 count: ${result.h1_count}`,
    `Open Graph tags: ${result.open_graph_count}`,
    `Twitter/X tags: ${result.twitter_card_count}`,
    `JSON-LD blocks: ${result.json_ld_count}`,
    "",
    ...result.checks.map((check) => `${check.title}: ${check.status} — ${check.recommendation}`),
    "",
    result.recommendation,
  ].join("\n");
}

export function serpPreviewResultText(result: SerpPreviewResponse): string {
  return [
    `Display URL: ${result.display_url}`,
    `Title: ${result.preview_title}`,
    `Description: ${result.preview_description}`,
    `Title length: ${result.title_length}`,
    `Description length: ${result.description_length}`,
    "",
    ...result.checks.map((check) => `${check.id}: ${check.status} — ${check.message}`),
    "",
    result.recommendation,
  ].join("\n");
}

export function socialPreviewResultText(result: SocialPreviewResponse): string {
  return [
    `Final URL: ${result.final_url}`,
    "",
    `Open Graph title: ${result.open_graph.title ?? "missing"}`,
    `Open Graph description: ${result.open_graph.description ?? "missing"}`,
    `Open Graph image: ${result.open_graph.image ?? "missing"}`,
    `Open Graph complete: ${String(result.open_graph.complete)}`,
    "",
    `Twitter/X card: ${result.twitter.card_type ?? "missing"}`,
    `Twitter/X title: ${result.twitter.title ?? "missing"}`,
    `Twitter/X description: ${result.twitter.description ?? "missing"}`,
    `Twitter/X image: ${result.twitter.image ?? "missing"}`,
    `Twitter/X complete: ${String(result.twitter.complete)}`,
    "",
    result.recommendation,
  ].join("\n");
}

function ToolForm({
  locale,
  title,
  button,
  onRun,
}: {
  locale: Locale;
  title: string;
  button: string;
  onRun: (url: string) => Promise<void>;
}) {
  const [input, setInput] = useState("https://example.com/");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const invalid = locale === "ru"
    ? "Введите полный URL, например https://example.ru/."
    : "Enter a full URL, for example https://example.com/.";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseMetadataToolUrlInput(input);
    if (!parsed) {
      setError(invalid);
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      await onRun(parsed.toString());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Metadata tool request failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return <section className="tool-panel metadata-tool-input">
    <h2>{title}</h2>
    <form className="metadata-tool-form" onSubmit={onSubmit}>
      <label className="field"><span>URL</span><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="https://example.com/" /></label>
      <button className="button" type="submit" disabled={isLoading}>{isLoading ? (locale === "ru" ? "Проверяем..." : "Checking...") : button}</button>
    </form>
    {error ? <p className="form-error" role="alert">{error}</p> : null}
  </section>;
}

function CheckList({ checks, locale }: { checks: MetaTagsResponse["checks"]; locale: Locale }) {
  return <ul className="metadata-tool-checks">
    {checks.map((check) => <li key={check.id} className={`is-${check.status}`}>
      <div>
        <strong>{check.title}</strong>
        <span>{check.value ?? "—"}</span>
      </div>
      <b className={`status-badge is-${metadataStatusTone(check.status)}`}>{metadataCheckStatusLabel(check.status, locale)}</b>
      <p>{check.recommendation}</p>
    </li>)}
  </ul>;
}

export function MetaTagsCheckerTool({ locale }: { locale: Locale }) {
  const [result, setResult] = useState<MetaTagsResponse | null>(null);
  const copy = locale === "ru"
    ? { title: "URL страницы", button: "Проверить мета-теги", result: "Результат", empty: "После проверки здесь появятся title, description, robots, canonical, H1-сводка, Open Graph, Twitter/X и JSON-LD summary.", recommendation: "Рекомендация" }
    : { title: "Page URL", button: "Check meta tags", result: "Result", empty: "After the check, title, description, robots, canonical, H1 summary, Open Graph, Twitter/X, and JSON-LD summary will appear here.", recommendation: "Recommendation" };

  return <div className="tool-grid metadata-tool meta-tags-tool">
    <ToolForm locale={locale} title={copy.title} button={copy.button} onRun={async (url) => setResult(await runMetadataTool("/api/tools/meta-tags", url, isMetaTagsResponse))} />
    <section className="tool-panel metadata-tool-result" aria-live="polite">
      <h2>{copy.result}</h2>
      {result ? <>
        <dl className="result-meta metadata-tool-meta">
          <div><dt>HTTP</dt><dd>{result.status_code}</dd></div>
          <div><dt>Title</dt><dd>{result.title_length}</dd></div>
          <div><dt>Description</dt><dd>{result.meta_description_length}</dd></div>
          <div><dt>H1</dt><dd>{result.h1_count}</dd></div>
          <div><dt>OG</dt><dd>{result.open_graph_count}</dd></div>
          <div><dt>JSON-LD</dt><dd>{result.json_ld_count}</dd></div>
        </dl>
        <div className="metadata-tool-card"><h3>Title</h3><p>{result.title ?? "—"}</p></div>
        <div className="metadata-tool-card"><h3>Description</h3><p>{result.meta_description ?? "—"}</p></div>
        <div className="metadata-tool-card"><h3>Canonical</h3><p>{result.resolved_canonical_url ?? "—"}</p></div>
        <CheckList checks={result.checks} locale={locale} />
        <p className="metadata-tool-recommendation"><strong>{copy.recommendation}:</strong> {result.recommendation}</p>
        <CopyButton value={metaTagsResultText(result)} locale={locale} />
      </> : <p className="muted">{copy.empty}</p>}
    </section>
  </div>;
}

export function SerpPreviewTool({ locale }: { locale: Locale }) {
  const [result, setResult] = useState<SerpPreviewResponse | null>(null);
  const copy = locale === "ru"
    ? { title: "URL страницы", button: "Собрать SERP preview", result: "Поисковый сниппет", empty: "После проверки здесь появится preview поискового результата, источники title/description и предупреждения по сниппету.", recommendation: "Рекомендация" }
    : { title: "Page URL", button: "Build SERP preview", result: "Search snippet", empty: "After the check, a search result preview, title/description sources, and snippet warnings will appear here.", recommendation: "Recommendation" };

  return <div className="tool-grid metadata-tool serp-preview-tool">
    <ToolForm locale={locale} title={copy.title} button={copy.button} onRun={async (url) => setResult(await runMetadataTool("/api/tools/serp-preview", url, isSerpPreviewResponse))} />
    <section className="tool-panel metadata-tool-result" aria-live="polite">
      <h2>{copy.result}</h2>
      {result ? <>
        <article className="serp-preview-card">
          <span>{result.display_url}</span>
          <h3>{result.preview_title}</h3>
          <p>{result.preview_description}</p>
        </article>
        <dl className="result-meta metadata-tool-meta">
          <div><dt>Title source</dt><dd>{result.title_source}</dd></div>
          <div><dt>Title length</dt><dd>{result.title_length}</dd></div>
          <div><dt>Description source</dt><dd>{result.description_source}</dd></div>
          <div><dt>Description length</dt><dd>{result.description_length}</dd></div>
        </dl>
        <ul className="metadata-tool-checks compact">
          {result.checks.map((check) => <li key={check.id} className={`is-${check.status}`}>
            <div><strong>{check.id}</strong><span>{check.message}</span></div>
            <b className={`status-badge is-${metadataStatusTone(check.status)}`}>{metadataCheckStatusLabel(check.status, locale)}</b>
          </li>)}
        </ul>
        <p className="metadata-tool-recommendation"><strong>{copy.recommendation}:</strong> {result.recommendation}</p>
        <CopyButton value={serpPreviewResultText(result)} locale={locale} />
      </> : <p className="muted">{copy.empty}</p>}
    </section>
  </div>;
}

function SocialCard({ title, card, locale }: { title: string; card: SocialCardPreviewResponse; locale: Locale }) {
  return <article className="social-preview-card">
    <header>
      <h3>{title}</h3>
      <span className={`status-badge is-${card.complete ? "success" : "warning"}`}>{card.complete ? (locale === "ru" ? "Готово" : "Complete") : (locale === "ru" ? "Неполно" : "Partial")}</span>
    </header>
    {card.image ? <div className="social-preview-image">{card.image}</div> : <div className="social-preview-image is-empty">{locale === "ru" ? "Изображение не найдено" : "Image missing"}</div>}
    <strong>{card.title ?? "—"}</strong>
    <p>{card.description ?? "—"}</p>
    <small>{card.url ?? card.site_name ?? "—"}</small>
    {card.missing_fields.length ? <p className="muted">{locale === "ru" ? "Не хватает" : "Missing"}: {card.missing_fields.join(", ")}</p> : null}
  </article>;
}

export function SocialPreviewTool({ locale }: { locale: Locale }) {
  const [result, setResult] = useState<SocialPreviewResponse | null>(null);
  const copy = locale === "ru"
    ? { title: "URL страницы", button: "Проверить social preview", result: "Open Graph / Twitter preview", empty: "После проверки здесь появятся Open Graph и Twitter/X card превью, fallback-данные и недостающие поля.", recommendation: "Рекомендация" }
    : { title: "Page URL", button: "Check social preview", result: "Open Graph / Twitter preview", empty: "After the check, Open Graph and Twitter/X card previews, fallback data, and missing fields will appear here.", recommendation: "Recommendation" };

  return <div className="tool-grid metadata-tool social-preview-tool">
    <ToolForm locale={locale} title={copy.title} button={copy.button} onRun={async (url) => setResult(await runMetadataTool("/api/tools/social-preview", url, isSocialPreviewResponse))} />
    <section className="tool-panel metadata-tool-result" aria-live="polite">
      <h2>{copy.result}</h2>
      {result ? <>
        <div className="social-preview-grid">
          <SocialCard title="Open Graph" card={result.open_graph} locale={locale} />
          <SocialCard title="Twitter/X" card={result.twitter} locale={locale} />
        </div>
        <p className="metadata-tool-recommendation"><strong>{copy.recommendation}:</strong> {result.recommendation}</p>
        <CopyButton value={socialPreviewResultText(result)} locale={locale} />
      </> : <p className="muted">{copy.empty}</p>}
    </section>
  </div>;
}
