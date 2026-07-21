"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { CopyButton } from "../../components/copy-button";

export interface SecurityHeaderCheckResponse {
  readonly id: string;
  readonly header: string;
  readonly title: string;
  readonly value: string | null;
  readonly present: boolean;
  readonly status: "pass" | "warning" | "fail";
  readonly severity: "info" | "medium" | "high";
  readonly recommendation: string;
}

export interface SecurityHeadersResponse {
  readonly contract_version: "webdiag.tool.security_headers.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly is_https: boolean;
  readonly redirect_count: number;
  readonly score: number;
  readonly risk_level: "low" | "medium" | "high";
  readonly present_count: number;
  readonly missing_count: number;
  readonly checks: readonly SecurityHeaderCheckResponse[];
  readonly recommendation: string;
}

class SecurityHeadersToolError extends Error {
  readonly code: string;

  constructor(message: string, code = "security_headers_tool_error") {
    super(message);
    this.name = "SecurityHeadersToolError";
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isSecurityHeaderCheckResponse(payload: unknown): payload is SecurityHeaderCheckResponse {
  if (!isRecord(payload)) return false;
  return (
    typeof payload.id === "string" &&
    typeof payload.header === "string" &&
    typeof payload.title === "string" &&
    (typeof payload.value === "string" || payload.value === null) &&
    typeof payload.present === "boolean" &&
    (payload.status === "pass" || payload.status === "warning" || payload.status === "fail") &&
    (payload.severity === "info" || payload.severity === "medium" || payload.severity === "high") &&
    typeof payload.recommendation === "string"
  );
}

export function isSecurityHeadersResponse(payload: unknown): payload is SecurityHeadersResponse {
  if (!isRecord(payload) || payload.contract_version !== "webdiag.tool.security_headers.v1") return false;
  return (
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.final_url === "string" &&
    typeof payload.status_code === "number" &&
    typeof payload.is_https === "boolean" &&
    typeof payload.redirect_count === "number" &&
    typeof payload.score === "number" &&
    (payload.risk_level === "low" || payload.risk_level === "medium" || payload.risk_level === "high") &&
    typeof payload.present_count === "number" &&
    typeof payload.missing_count === "number" &&
    Array.isArray(payload.checks) &&
    payload.checks.every(isSecurityHeaderCheckResponse) &&
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

export function normalizeSecurityHeadersUrlInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function parseSecurityHeadersUrlInput(value: string): URL | null {
  const normalized = normalizeSecurityHeadersUrlInput(value);
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

export function securityHeadersRiskLabel(riskLevel: SecurityHeadersResponse["risk_level"], locale: Locale): string {
  const labels = locale === "ru"
    ? { low: "Низкий риск", medium: "Средний риск", high: "Высокий риск" }
    : { low: "Low risk", medium: "Medium risk", high: "High risk" };
  return labels[riskLevel];
}

export function securityHeaderStatusLabel(status: SecurityHeaderCheckResponse["status"], locale: Locale): string {
  const labels = locale === "ru"
    ? { pass: "Есть", warning: "Проверить", fail: "Проблема" }
    : { pass: "Present", warning: "Review", fail: "Problem" };
  return labels[status];
}

export function securityHeadersResultText(result: SecurityHeadersResponse): string {
  return [
    `Requested: ${result.requested_url}`,
    `Final URL: ${result.final_url}`,
    `HTTP: ${result.status_code}`,
    `HTTPS: ${String(result.is_https)}`,
    `Score: ${result.score}`,
    `Risk: ${result.risk_level}`,
    `Present headers: ${result.present_count}`,
    `Missing headers: ${result.missing_count}`,
    "",
    ...result.checks.map((check) => `${check.header}: ${check.value ?? "missing"} — ${check.status}`),
    "",
    result.recommendation,
  ].join("\n");
}

async function runSecurityHeadersCheck(url: string): Promise<SecurityHeadersResponse> {
  const response = await fetch("/api/tools/security-headers", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const extracted = extractError(payload);
    throw new SecurityHeadersToolError(extracted.message ?? "Security headers check failed.", extracted.code);
  }
  if (!isSecurityHeadersResponse(payload)) {
    throw new SecurityHeadersToolError("Tool API returned an invalid response.", "invalid_response");
  }
  return payload;
}

function yesNo(value: boolean, locale: Locale): string {
  return value ? (locale === "ru" ? "Да" : "Yes") : (locale === "ru" ? "Нет" : "No");
}

export function SecurityHeadersTool({ locale }: { locale: Locale }) {
  const [input, setInput] = useState("https://example.com/");
  const [result, setResult] = useState<SecurityHeadersResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const copy = locale === "ru"
    ? {
        inputTitle: "URL страницы",
        inputLabel: "Адрес страницы",
        button: "Проверить заголовки",
        loading: "Проверяем...",
        invalid: "Введите полный URL, например https://example.ru/.",
        result: "Результат проверки",
        status: "Статус",
        finalUrl: "Финальный URL",
        score: "Оценка",
        present: "Есть",
        missing: "Нет",
        https: "HTTPS",
        redirects: "Редиректы",
        checks: "Заголовки",
        recommendation: "Рекомендация",
        empty: "После проверки здесь появятся HSTS, CSP, nosniff, защита от фрейминга, Referrer-Policy, Permissions-Policy и практическая рекомендация.",
      }
    : {
        inputTitle: "Page URL",
        inputLabel: "Page address",
        button: "Check headers",
        loading: "Checking...",
        invalid: "Enter a full URL, for example https://example.com/.",
        result: "Check result",
        status: "Status",
        finalUrl: "Final URL",
        score: "Score",
        present: "Present",
        missing: "Missing",
        https: "HTTPS",
        redirects: "Redirects",
        checks: "Headers",
        recommendation: "Recommendation",
        empty: "After the check, HSTS, CSP, nosniff, frame protection, Referrer-Policy, Permissions-Policy, and practical advice will appear here.",
      };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseSecurityHeadersUrlInput(input);
    if (!parsed) {
      setError(copy.invalid);
      setResult(null);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      setResult(await runSecurityHeadersCheck(parsed.toString()));
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "Security headers check failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return <div className="tool-grid security-headers-tool">
    <section className="tool-panel">
      <h2>{copy.inputTitle}</h2>
      <form className="security-headers-form" onSubmit={onSubmit}>
        <label className="field"><span>{copy.inputLabel}</span><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="https://example.com/" /></label>
        <button className="button" type="submit" disabled={isLoading}>{isLoading ? copy.loading : copy.button}</button>
      </form>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </section>

    <section className="tool-panel security-headers-result" aria-live="polite">
      <h2>{copy.result}</h2>
      {result ? <>
        <dl className="result-meta security-headers-meta">
          <div><dt>{copy.status}</dt><dd className={`status-badge is-${result.risk_level === "low" ? "success" : result.risk_level === "medium" ? "warning" : "danger"}`}>{securityHeadersRiskLabel(result.risk_level, locale)}</dd></div>
          <div><dt>{copy.score}</dt><dd>{result.score}/100</dd></div>
          <div><dt>{copy.present}</dt><dd>{result.present_count}</dd></div>
          <div><dt>{copy.missing}</dt><dd>{result.missing_count}</dd></div>
          <div><dt>{copy.https}</dt><dd>{yesNo(result.is_https, locale)}</dd></div>
          <div><dt>{copy.redirects}</dt><dd>{result.redirect_count}</dd></div>
        </dl>
        <div className="security-headers-card">
          <h3>{copy.finalUrl}</h3>
          <p>{result.final_url}</p>
        </div>
        <div className="security-headers-checks">
          <h3>{copy.checks}</h3>
          <ul>
            {result.checks.map((check) => <li key={check.id} className={`is-${check.status}`}>
              <div>
                <strong>{check.title}</strong>
                <span>{check.header}</span>
              </div>
              <b>{securityHeaderStatusLabel(check.status, locale)}</b>
              <p>{check.value ?? check.recommendation}</p>
            </li>)}
          </ul>
        </div>
        <p className="security-headers-recommendation"><strong>{copy.recommendation}:</strong> {result.recommendation}</p>
        <CopyButton value={securityHeadersResultText(result)} locale={locale} />
      </> : <p className="muted">{copy.empty}</p>}
    </section>
  </div>;
}
