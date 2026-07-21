"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import {
  isHreflangResponse,
  isIndexabilityResponse,
  isTechnologyDetectorResponse,
  isToolErrorPayload,
  parseTechnicalSeoToolUrlInput,
  type HreflangResponse,
  type IndexabilityResponse,
  type TechnicalSeoToolResponse,
  type TechnologyDetectorResponse,
} from "./technical-seo-tool-contract";

class TechnicalSeoToolError extends Error {
  readonly code: string;

  constructor(message: string, code = "technical_seo_tool_error") {
    super(message);
    this.name = "TechnicalSeoToolError";
    this.code = code;
  }
}

const dictionary = {
  ru: {
    url: "URL страницы",
    run: "Запустить проверку",
    loading: "Проверяем…",
    result: "Результат",
    recommendation: "Рекомендация",
    invalidUrl: "Введите корректный http(s) URL с доменом.",
  },
  en: {
    url: "Page URL",
    run: "Run check",
    loading: "Checking…",
    result: "Result",
    recommendation: "Recommendation",
    invalidUrl: "Enter a valid http(s) URL with a domain.",
  },
} as const;

async function runTool<T extends TechnicalSeoToolResponse>(
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
    if (isToolErrorPayload(payload)) {
      throw new TechnicalSeoToolError(payload.detail.message, payload.detail.code);
    }
    throw new TechnicalSeoToolError("Tool API request failed.", "tool_api_error");
  }
  if (!validator(payload)) {
    throw new TechnicalSeoToolError(
      "Tool API returned an invalid result.",
      "tool_api_invalid_response",
    );
  }
  return payload;
}

export function indexabilityResultText(result: IndexabilityResponse): string {
  return [
    `Final URL: ${result.final_url}`,
    `Indexable candidate: ${result.indexable_candidate ? "yes" : "no"}`,
    `HTTP status: ${result.status_code}`,
    `robots.txt allowed: ${String(result.robots_txt_allowed)}`,
    `Meta noindex: ${result.meta_robots_noindex ? "yes" : "no"}`,
    `X-Robots noindex: ${result.x_robots_tag_noindex ? "yes" : "no"}`,
    `Recommendation: ${result.recommendation}`,
  ].join("\n");
}

export function hreflangResultText(result: HreflangResponse): string {
  return [
    `Final URL: ${result.final_url}`,
    `Alternates: ${result.total_alternates}`,
    `Invalid alternates: ${result.invalid_alternate_count}`,
    `Duplicate hreflang: ${result.duplicate_hreflang_count}`,
    `x-default: ${result.has_x_default ? "yes" : "no"}`,
    `Self-reference: ${result.has_self_reference ? "yes" : "no"}`,
    `Recommendation: ${result.recommendation}`,
  ].join("\n");
}

export function technologyDetectorResultText(result: TechnologyDetectorResponse): string {
  return [
    `Final URL: ${result.final_url}`,
    `Detected: ${result.detected_count}`,
    `Server: ${result.server_header ?? "—"}`,
    `X-Powered-By: ${result.powered_by_header ?? "—"}`,
    `Generator: ${result.generator_meta ?? "—"}`,
    `Recommendation: ${result.recommendation}`,
  ].join("\n");
}

function ErrorMessage({ value }: { value: string }) {
  return value ? <p className="tool-error" role="alert">{value}</p> : null;
}

function Recommendation({ value, locale }: { value: string; locale: Locale }) {
  return <div className="tool-note"><strong>{dictionary[locale].recommendation}:</strong> {value}</div>;
}

function BaseTool<T extends TechnicalSeoToolResponse>({
  locale,
  endpoint,
  validator,
  render,
}: {
  locale: Locale;
  endpoint: string;
  validator: (payload: unknown) => payload is T;
  render: (result: T) => React.ReactNode;
}) {
  const [url, setUrl] = useState("https://example.com/");
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseTechnicalSeoToolUrlInput(url);
    if (!parsed) {
      setError(dictionary[locale].invalidUrl);
      setResult(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setResult(await runTool(endpoint, parsed.toString(), validator));
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "Tool failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="tool-grid" onSubmit={onSubmit}>
      <section className="tool-panel">
        <label className="field">
          <span>{dictionary[locale].url}</span>
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/"
          />
        </label>
        <button className="button" type="submit" disabled={loading}>
          {loading ? dictionary[locale].loading : dictionary[locale].run}
        </button>
        <ErrorMessage value={error} />
      </section>
      {result && (
        <section className="tool-panel tool-panel-wide">
          <h2>{dictionary[locale].result}</h2>
          {render(result)}
        </section>
      )}
    </form>
  );
}

export function IndexabilityCheckerTool({ locale }: { locale: Locale }) {
  return (
    <BaseTool
      locale={locale}
      endpoint="/api/tools/indexability"
      validator={isIndexabilityResponse}
      render={(result) => (
        <>
          <div className="result-grid">
            <article className="result-card">
              <h3>{locale === "ru" ? "Индексируемость" : "Indexability"}</h3>
              <p className="calculated-value">{result.indexable_candidate ? "OK" : "Blocked"}</p>
              <ul className="result-list">
                <li>HTTP: <strong>{result.status_code}</strong></li>
                <li>robots.txt: <strong>{String(result.robots_txt_allowed)}</strong></li>
                <li>Noindex: <strong>{result.meta_robots_noindex ? "yes" : "no"}</strong></li>
              </ul>
            </article>
          </div>
          <Recommendation value={result.recommendation} locale={locale} />
        </>
      )}
    />
  );
}

export function HreflangCheckerTool({ locale }: { locale: Locale }) {
  return (
    <BaseTool
      locale={locale}
      endpoint="/api/tools/hreflang"
      validator={isHreflangResponse}
      render={(result) => (
        <>
          <div className="result-grid">
            <article className="result-card">
              <h3>Hreflang</h3>
              <p className="calculated-value">{result.total_alternates}</p>
              <ul className="result-list">
                <li>Invalid: <strong>{result.invalid_alternate_count}</strong></li>
                <li>Duplicates: <strong>{result.duplicate_hreflang_count}</strong></li>
                <li>x-default: <strong>{result.has_x_default ? "yes" : "no"}</strong></li>
              </ul>
            </article>
          </div>
          <Recommendation value={result.recommendation} locale={locale} />
        </>
      )}
    />
  );
}

export function TechnologyDetectorTool({ locale }: { locale: Locale }) {
  return (
    <BaseTool
      locale={locale}
      endpoint="/api/tools/technology-detector"
      validator={isTechnologyDetectorResponse}
      render={(result) => (
        <>
          <div className="result-grid">
            <article className="result-card">
              <h3>{locale === "ru" ? "Технологии" : "Technologies"}</h3>
              <p className="calculated-value">{result.detected_count}</p>
              <ul className="result-list">
                <li>Server: <strong>{result.server_header ?? "—"}</strong></li>
                <li>Powered by: <strong>{result.powered_by_header ?? "—"}</strong></li>
                <li>Generator: <strong>{result.generator_meta ?? "—"}</strong></li>
              </ul>
            </article>
          </div>
          <Recommendation value={result.recommendation} locale={locale} />
        </>
      )}
    />
  );
}
