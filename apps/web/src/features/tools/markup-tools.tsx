import { FormEvent, useState } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { CopyButton } from "../../components/copy-button";
import { metadataCheckStatusLabel, parseMetadataToolUrlInput } from "./metadata-tool-contract";
import {
  createSchemaMarkup,
  isHtmlMarkupValidatorResponse,
  isStructuredDataValidatorResponse,
  isToolErrorPayload,
  type HtmlMarkupValidatorResponse,
  type SchemaTemplateKind,
  type StructuredDataValidatorResponse,
} from "./markup-tool-contract";

async function runMarkupTool<T>(endpoint: string, url: string, validate: (payload: unknown) => payload is T): Promise<T> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (isToolErrorPayload(payload)) throw new Error(payload.detail.message);
    throw new Error("Markup tool request failed.");
  }
  if (!validate(payload)) throw new Error("Markup tool returned an invalid response.");
  return payload;
}

export function markupStatusTone(status: "pass" | "warning" | "fail"): "success" | "warning" | "danger" {
  if (status === "pass") return "success";
  if (status === "warning") return "warning";
  return "danger";
}

export function structuredDataResultText(result: StructuredDataValidatorResponse): string {
  return [
    `Final URL: ${result.final_url}`,
    `HTTP: ${result.status_code}`,
    `JSON-LD blocks: ${result.json_ld_count}`,
    `Valid blocks: ${result.valid_json_ld_count}`,
    `Invalid blocks: ${result.invalid_json_ld_count}`,
    `Types: ${result.detected_types.map((item) => `${item.type} (${item.count})`).join(", ") || "none"}`,
    "",
    ...result.blocks.map((block) => `Block ${block.index}: ${block.valid ? "valid" : "invalid"}; types=${block.types.join(", ") || "none"}; error=${block.error ?? "none"}`),
    "",
    result.recommendation,
  ].join("\n");
}

export function htmlMarkupResultText(result: HtmlMarkupValidatorResponse): string {
  return [
    `Final URL: ${result.final_url}`,
    `HTTP: ${result.status_code}`,
    `Doctype: ${String(result.doctype_present)}`,
    `HTML lang: ${result.html_lang ?? "missing"}`,
    `Title: ${result.title ?? "missing"}`,
    `Viewport: ${String(result.viewport_present)}`,
    `Duplicate IDs: ${result.duplicate_id_count}`,
    `Unexpected end tags: ${result.unexpected_end_tag_count}`,
    `Unclosed tags: ${result.unclosed_tag_count}`,
    "",
    ...result.checks.map((check) => `${check.title}: ${check.status} — ${check.message}`),
    "",
    result.recommendation,
  ].join("\n");
}

function MarkupToolForm({
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
      setError(caught instanceof Error ? caught.message : "Markup tool request failed.");
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

export function StructuredDataValidatorTool({ locale }: { locale: Locale }) {
  const [result, setResult] = useState<StructuredDataValidatorResponse | null>(null);
  const copy = locale === "ru"
    ? { title: "URL страницы", button: "Проверить JSON-LD", result: "Структурированные данные", empty: "После проверки здесь появятся JSON-LD блоки, валидность, Schema.org типы и ошибки парсинга.", recommendation: "Рекомендация" }
    : { title: "Page URL", button: "Check JSON-LD", result: "Structured data", empty: "After the check, JSON-LD blocks, validity, Schema.org types, and parse errors will appear here.", recommendation: "Recommendation" };

  return <div className="tool-grid metadata-tool markup-tool structured-data-tool">
    <MarkupToolForm locale={locale} title={copy.title} button={copy.button} onRun={async (url) => setResult(await runMarkupTool("/api/tools/structured-data", url, isStructuredDataValidatorResponse))} />
    <section className="tool-panel metadata-tool-result" aria-live="polite">
      <h2>{copy.result}</h2>
      {result ? <>
        <dl className="result-meta metadata-tool-meta">
          <div><dt>HTTP</dt><dd>{result.status_code}</dd></div>
          <div><dt>JSON-LD</dt><dd>{result.json_ld_count}</dd></div>
          <div><dt>Valid</dt><dd>{result.valid_json_ld_count}</dd></div>
          <div><dt>Invalid</dt><dd>{result.invalid_json_ld_count}</dd></div>
        </dl>
        <div className="metadata-tool-card"><h3>Schema.org types</h3><p>{result.detected_types.map((item) => `${item.type} × ${item.count}`).join(", ") || "—"}</p></div>
        <ul className="metadata-tool-checks compact">
          {result.blocks.map((block) => <li key={block.index} className={block.valid ? "is-pass" : "is-fail"}>
            <div><strong>JSON-LD #{block.index}</strong><span>{block.types.join(", ") || block.error || "No @type detected"}</span></div>
            <b className={`status-badge is-${block.valid ? "success" : "danger"}`}>{block.valid ? (locale === "ru" ? "Валиден" : "Valid") : (locale === "ru" ? "Ошибка" : "Invalid")}</b>
          </li>)}
        </ul>
        <p className="metadata-tool-recommendation"><strong>{copy.recommendation}:</strong> {result.recommendation}</p>
        <CopyButton value={structuredDataResultText(result)} locale={locale} />
      </> : <p className="muted">{copy.empty}</p>}
    </section>
  </div>;
}

export function HtmlMarkupValidatorTool({ locale }: { locale: Locale }) {
  const [result, setResult] = useState<HtmlMarkupValidatorResponse | null>(null);
  const copy = locale === "ru"
    ? { title: "URL страницы", button: "Проверить HTML", result: "HTML-разметка", empty: "После проверки здесь появятся doctype, lang, viewport, дубли id, unmatched/unclosed tags и рекомендации.", recommendation: "Рекомендация" }
    : { title: "Page URL", button: "Check HTML", result: "HTML markup", empty: "After the check, doctype, lang, viewport, duplicate IDs, unmatched/unclosed tags, and recommendations will appear here.", recommendation: "Recommendation" };

  return <div className="tool-grid metadata-tool markup-tool html-markup-tool">
    <MarkupToolForm locale={locale} title={copy.title} button={copy.button} onRun={async (url) => setResult(await runMarkupTool("/api/tools/html-validator", url, isHtmlMarkupValidatorResponse))} />
    <section className="tool-panel metadata-tool-result" aria-live="polite">
      <h2>{copy.result}</h2>
      {result ? <>
        <dl className="result-meta metadata-tool-meta">
          <div><dt>HTTP</dt><dd>{result.status_code}</dd></div>
          <div><dt>Doctype</dt><dd>{result.doctype_present ? "yes" : "no"}</dd></div>
          <div><dt>Lang</dt><dd>{result.html_lang ?? "—"}</dd></div>
          <div><dt>Viewport</dt><dd>{result.viewport_present ? "yes" : "no"}</dd></div>
          <div><dt>Duplicate IDs</dt><dd>{result.duplicate_id_count}</dd></div>
        </dl>
        <ul className="metadata-tool-checks">
          {result.checks.map((check) => <li key={check.id} className={`is-${check.status}`}>
            <div><strong>{check.title}</strong><span>{check.message}</span></div>
            <b className={`status-badge is-${markupStatusTone(check.status)}`}>{metadataCheckStatusLabel(check.status, locale)}</b>
            <p>{check.recommendation}</p>
          </li>)}
        </ul>
        <p className="metadata-tool-recommendation"><strong>{copy.recommendation}:</strong> {result.recommendation}</p>
        <CopyButton value={htmlMarkupResultText(result)} locale={locale} />
      </> : <p className="muted">{copy.empty}</p>}
    </section>
  </div>;
}

export function SchemaMarkupGeneratorTool({ locale }: { locale: Locale }) {
  const [kind, setKind] = useState<SchemaTemplateKind>("Organization");
  const [name, setName] = useState("WebDiag");
  const [url, setUrl] = useState("https://example.com/");
  const [description, setDescription] = useState("Short factual description of the entity or page.");
  const [telephone, setTelephone] = useState("");
  const [address, setAddress] = useState("");
  const output = createSchemaMarkup({ kind, name, url, description, telephone, address });
  const copy = locale === "ru"
    ? { input: "Параметры Schema.org", result: "JSON-LD", note: "Генератор создаёт только поддерживаемые шаблоны. Он не выдумывает факты и не заменяет проверку структурированных данных." }
    : { input: "Schema.org parameters", result: "JSON-LD", note: "The generator creates only supported templates. It does not invent facts and does not replace structured data validation." };

  return <div className="tool-grid metadata-tool markup-tool schema-generator-tool">
    <section className="tool-panel">
      <h2>{copy.input}</h2>
      <label className="field"><span>Type</span><select value={kind} onChange={(event) => setKind(event.target.value as SchemaTemplateKind)}><option>Organization</option><option>LocalBusiness</option><option>FAQPage</option><option>BreadcrumbList</option></select></label>
      <label className="field"><span>{locale === "ru" ? "Название / вопрос / текущая страница" : "Name / question / current page"}</span><input value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label className="field"><span>URL</span><input value={url} onChange={(event) => setUrl(event.target.value)} /></label>
      <label className="field"><span>{locale === "ru" ? "Описание / ответ" : "Description / answer"}</span><textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      {kind === "LocalBusiness" ? <><label className="field"><span>{locale === "ru" ? "Телефон" : "Phone"}</span><input value={telephone} onChange={(event) => setTelephone(event.target.value)} /></label><label className="field"><span>{locale === "ru" ? "Адрес" : "Address"}</span><input value={address} onChange={(event) => setAddress(event.target.value)} /></label></> : null}
      <p className="muted">{copy.note}</p>
    </section>
    <section className="tool-panel">
      <h2>{copy.result}</h2>
      <div className="output-wrap"><pre className="output code-output">{output}</pre><CopyButton value={output} locale={locale} /></div>
    </section>
  </div>;
}
