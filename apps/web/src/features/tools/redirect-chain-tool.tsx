"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { CopyButton } from "../../components/copy-button";

export interface RedirectHopResult {
  readonly source_url: string;
  readonly target_url: string;
  readonly status_code: number;
}

export interface HttpStatusToolResponse {
  readonly contract_version: "webdiag.tool.http_status.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly ok: boolean;
  readonly redirect_count: number;
  readonly redirect_chain: readonly RedirectHopResult[];
  readonly headers: {
    readonly content_type: string | null;
    readonly content_length: string | null;
    readonly cache_control: string | null;
    readonly server: string | null;
  };
  readonly recommendation: string;
}

class RedirectChainToolError extends Error {
  readonly code: string;

  constructor(message: string, code = "redirect_chain_tool_error") {
    super(message);
    this.name = "RedirectChainToolError";
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isRedirectHop(payload: unknown): payload is RedirectHopResult {
  if (!isRecord(payload)) return false;
  return typeof payload.source_url === "string" && typeof payload.target_url === "string" && typeof payload.status_code === "number";
}

export function isHttpStatusToolResponse(payload: unknown): payload is HttpStatusToolResponse {
  if (!isRecord(payload) || payload.contract_version !== "webdiag.tool.http_status.v1") return false;
  if (!isRecord(payload.headers)) return false;
  return (
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.final_url === "string" &&
    typeof payload.status_code === "number" &&
    typeof payload.ok === "boolean" &&
    typeof payload.redirect_count === "number" &&
    Array.isArray(payload.redirect_chain) &&
    payload.redirect_chain.every(isRedirectHop) &&
    (typeof payload.headers.content_type === "string" || payload.headers.content_type === null) &&
    (typeof payload.headers.content_length === "string" || payload.headers.content_length === null) &&
    (typeof payload.headers.cache_control === "string" || payload.headers.cache_control === null) &&
    (typeof payload.headers.server === "string" || payload.headers.server === null) &&
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

export function normalizeToolUrlInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function parseToolUrlInput(value: string): URL | null {
  const normalized = normalizeToolUrlInput(value);
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

export function statusTone(statusCode: number): "success" | "warning" | "danger" {
  if (statusCode >= 200 && statusCode < 300) return "success";
  if (statusCode >= 300 && statusCode < 400) return "warning";
  return "danger";
}

export function resultText(result: HttpStatusToolResponse): string {
  const redirects = result.redirect_chain.length
    ? result.redirect_chain.map((hop) => `${hop.status_code}: ${hop.source_url} -> ${hop.target_url}`).join("\n")
    : "No redirects";
  return [
    `HTTP ${result.status_code}`,
    `Requested: ${result.requested_url}`,
    `Final: ${result.final_url}`,
    `Redirects: ${result.redirect_count}`,
    `Content-Type: ${result.headers.content_type ?? "—"}`,
    "",
    redirects,
  ].join("\n");
}

async function runRedirectCheck(url: string): Promise<HttpStatusToolResponse> {
  const response = await fetch("/api/tools/redirect-chain", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const extracted = extractError(payload);
    throw new RedirectChainToolError(extracted.message ?? "Redirect chain check failed.", extracted.code);
  }
  if (!isHttpStatusToolResponse(payload)) {
    throw new RedirectChainToolError("Tool API returned an invalid response.", "invalid_response");
  }
  return payload;
}

export function RedirectChainTool({ locale }: { locale: Locale }) {
  const [input, setInput] = useState("https://example.com/");
  const [result, setResult] = useState<HttpStatusToolResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const copy = locale === "ru"
    ? {
        inputTitle: "URL для проверки",
        inputLabel: "Адрес страницы",
        button: "Проверить статус и редиректы",
        loading: "Проверяем...",
        invalid: "Введите полный URL, например https://example.ru/.",
        result: "Результат проверки",
        finalUrl: "Финальный URL",
        redirects: "Редиректы",
        headers: "Заголовки ответа",
        recommendation: "Рекомендация",
        noRedirects: "Редиректов нет — URL отвечает напрямую.",
      }
    : {
        inputTitle: "URL to inspect",
        inputLabel: "Page address",
        button: "Check status and redirects",
        loading: "Checking...",
        invalid: "Enter a full URL, for example https://example.com/.",
        result: "Check result",
        finalUrl: "Final URL",
        redirects: "Redirects",
        headers: "Response headers",
        recommendation: "Recommendation",
        noRedirects: "No redirects — the URL responds directly.",
      };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseToolUrlInput(input);
    if (!parsed) {
      setError(copy.invalid);
      setResult(null);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      setResult(await runRedirectCheck(parsed.toString()));
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "Redirect chain check failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return <div className="tool-grid redirect-chain-tool">
    <section className="tool-panel">
      <h2>{copy.inputTitle}</h2>
      <form className="redirect-chain-form" onSubmit={onSubmit}>
        <label className="field"><span>{copy.inputLabel}</span><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="https://example.com/" /></label>
        <button className="button" type="submit" disabled={isLoading}>{isLoading ? copy.loading : copy.button}</button>
      </form>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </section>

    <section className="tool-panel redirect-chain-result" aria-live="polite">
      <h2>{copy.result}</h2>
      {result ? <>
        <dl className="result-meta">
          <div><dt>HTTP</dt><dd className={`status-badge is-${statusTone(result.status_code)}`}>{result.status_code}</dd></div>
          <div><dt>{copy.redirects}</dt><dd>{result.redirect_count}</dd></div>
          <div><dt>{copy.finalUrl}</dt><dd>{result.final_url}</dd></div>
          <div><dt>Content-Type</dt><dd>{result.headers.content_type ?? "—"}</dd></div>
        </dl>
        <div className="redirect-chain-hops">
          <h3>{copy.redirects}</h3>
          {result.redirect_chain.length ? <ol>
            {result.redirect_chain.map((hop) => <li key={`${hop.source_url}-${hop.target_url}-${hop.status_code}`}><b>{hop.status_code}</b><span>{hop.source_url}</span><span aria-hidden="true">→</span><strong>{hop.target_url}</strong></li>)}
          </ol> : <p className="muted-text">{copy.noRedirects}</p>}
        </div>
        <div className="redirect-chain-headers"><h3>{copy.headers}</h3><ul className="result-list"><li>Content-Length: {result.headers.content_length ?? "—"}</li><li>Cache-Control: {result.headers.cache_control ?? "—"}</li><li>Server: {result.headers.server ?? "—"}</li></ul></div>
        <p className="redirect-chain-recommendation"><strong>{copy.recommendation}:</strong> {result.recommendation}</p>
        <CopyButton value={resultText(result)} locale={locale} />
      </> : <p className="muted-text">{locale === "ru" ? "После проверки здесь появятся HTTP-статус, финальный URL и цепочка переходов." : "After the check, the HTTP status, final URL, and redirect chain will appear here."}</p>}
    </section>
  </div>;
}
