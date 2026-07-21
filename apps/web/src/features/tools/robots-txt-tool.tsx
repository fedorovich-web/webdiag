"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { CopyButton } from "../../components/copy-button";

export interface RobotsTxtRuleResult {
  readonly user_agent: string;
  readonly directive: "allow" | "disallow";
  readonly value: string;
}

export interface RobotsTxtSitemapResult {
  readonly url: string;
}

export interface RobotsTxtToolResponse {
  readonly contract_version: "webdiag.tool.robots_txt.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly target_url: string;
  readonly target_path: string;
  readonly robots_url: string;
  readonly user_agent: string;
  readonly status_code: number | null;
  readonly available: boolean;
  readonly allows_target: boolean | null;
  readonly matched_allow_rule: string | null;
  readonly matched_disallow_rule: string | null;
  readonly disallow_count: number;
  readonly disallow_rules: readonly RobotsTxtRuleResult[];
  readonly sitemap_count: number;
  readonly sitemap_urls: readonly RobotsTxtSitemapResult[];
  readonly recommendation: string;
}

class RobotsTxtToolError extends Error {
  readonly code: string;

  constructor(message: string, code = "robots_txt_tool_error") {
    super(message);
    this.name = "RobotsTxtToolError";
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isRobotsRule(payload: unknown): payload is RobotsTxtRuleResult {
  if (!isRecord(payload)) return false;
  return typeof payload.user_agent === "string" && (payload.directive === "allow" || payload.directive === "disallow") && typeof payload.value === "string";
}

function isSitemap(payload: unknown): payload is RobotsTxtSitemapResult {
  return isRecord(payload) && typeof payload.url === "string";
}

export function isRobotsTxtToolResponse(payload: unknown): payload is RobotsTxtToolResponse {
  if (!isRecord(payload) || payload.contract_version !== "webdiag.tool.robots_txt.v1") return false;
  return (
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.target_url === "string" &&
    typeof payload.target_path === "string" &&
    typeof payload.robots_url === "string" &&
    typeof payload.user_agent === "string" &&
    (typeof payload.status_code === "number" || payload.status_code === null) &&
    typeof payload.available === "boolean" &&
    (typeof payload.allows_target === "boolean" || payload.allows_target === null) &&
    (typeof payload.matched_allow_rule === "string" || payload.matched_allow_rule === null) &&
    (typeof payload.matched_disallow_rule === "string" || payload.matched_disallow_rule === null) &&
    typeof payload.disallow_count === "number" &&
    Array.isArray(payload.disallow_rules) &&
    payload.disallow_rules.every(isRobotsRule) &&
    typeof payload.sitemap_count === "number" &&
    Array.isArray(payload.sitemap_urls) &&
    payload.sitemap_urls.every(isSitemap) &&
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

export function normalizeRobotsToolUrlInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function parseRobotsToolUrlInput(value: string): URL | null {
  const normalized = normalizeRobotsToolUrlInput(value);
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

export function robotsAccessLabel(result: Pick<RobotsTxtToolResponse, "available" | "allows_target">, locale: Locale): string {
  if (!result.available) return locale === "ru" ? "robots.txt недоступен" : "robots.txt unavailable";
  if (result.allows_target === true) return locale === "ru" ? "URL разрешён" : "URL allowed";
  if (result.allows_target === false) return locale === "ru" ? "URL закрыт" : "URL blocked";
  return locale === "ru" ? "Не определено" : "Unknown";
}

export function robotsAccessTone(result: Pick<RobotsTxtToolResponse, "available" | "allows_target">): "success" | "warning" | "danger" {
  if (!result.available) return "warning";
  if (result.allows_target === false) return "danger";
  return "success";
}

export function robotsResultText(result: RobotsTxtToolResponse): string {
  const matched = result.matched_disallow_rule ?? result.matched_allow_rule ?? "—";
  const sitemaps = result.sitemap_urls.length ? result.sitemap_urls.map((item) => item.url).join("\n") : "No sitemaps declared";
  return [
    `robots.txt: ${result.robots_url}`,
    `Target: ${result.target_url}`,
    `User-agent: ${result.user_agent}`,
    `Available: ${result.available}`,
    `Allows target: ${String(result.allows_target)}`,
    `Matched rule: ${matched}`,
    `Sitemaps: ${result.sitemap_count}`,
    "",
    sitemaps,
  ].join("\n");
}

async function runRobotsTxtCheck(url: string, userAgent: string): Promise<RobotsTxtToolResponse> {
  const response = await fetch("/api/tools/robots-txt", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ url, user_agent: userAgent }),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const extracted = extractError(payload);
    throw new RobotsTxtToolError(extracted.message ?? "robots.txt check failed.", extracted.code);
  }
  if (!isRobotsTxtToolResponse(payload)) {
    throw new RobotsTxtToolError("Tool API returned an invalid response.", "invalid_response");
  }
  return payload;
}

export function RobotsTxtTool({ locale }: { locale: Locale }) {
  const [input, setInput] = useState("https://example.com/catalog/page");
  const [userAgent, setUserAgent] = useState("WebDiagBot");
  const [result, setResult] = useState<RobotsTxtToolResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const copy = locale === "ru"
    ? {
        inputTitle: "URL и user-agent",
        inputLabel: "Адрес страницы",
        userAgent: "User-agent",
        button: "Проверить robots.txt",
        loading: "Проверяем...",
        invalid: "Введите полный URL, например https://example.ru/catalog/page.",
        result: "Результат проверки",
        status: "Статус",
        targetPath: "Путь URL",
        robotsUrl: "Файл robots.txt",
        matchedRule: "Сработавшее правило",
        sitemaps: "Sitemap directives",
        rules: "Disallow rules",
        recommendation: "Рекомендация",
        empty: "После проверки здесь появятся доступность robots.txt, правило для URL и Sitemap directives.",
        noRule: "Подходящее правило не найдено — URL считается разрешённым.",
        noSitemaps: "Sitemap directives не найдены.",
        noRules: "Disallow rules не найдены.",
      }
    : {
        inputTitle: "URL and user-agent",
        inputLabel: "Page address",
        userAgent: "User-agent",
        button: "Check robots.txt",
        loading: "Checking...",
        invalid: "Enter a full URL, for example https://example.com/catalog/page.",
        result: "Check result",
        status: "Status",
        targetPath: "URL path",
        robotsUrl: "robots.txt file",
        matchedRule: "Matched rule",
        sitemaps: "Sitemap directives",
        rules: "Disallow rules",
        recommendation: "Recommendation",
        empty: "After the check, robots.txt availability, the URL rule, and Sitemap directives will appear here.",
        noRule: "No matching rule found — the URL is considered allowed.",
        noSitemaps: "No Sitemap directives found.",
        noRules: "No Disallow rules found.",
      };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseRobotsToolUrlInput(input);
    if (!parsed) {
      setError(copy.invalid);
      setResult(null);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      setResult(await runRobotsTxtCheck(parsed.toString(), userAgent.trim() || "WebDiagBot"));
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "robots.txt check failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return <div className="tool-grid robots-txt-tool">
    <section className="tool-panel">
      <h2>{copy.inputTitle}</h2>
      <form className="robots-txt-form" onSubmit={onSubmit}>
        <label className="field"><span>{copy.inputLabel}</span><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="https://example.com/catalog/page" /></label>
        <label className="field"><span>{copy.userAgent}</span><input value={userAgent} onChange={(event) => setUserAgent(event.target.value)} placeholder="WebDiagBot" /></label>
        <button className="button" type="submit" disabled={isLoading}>{isLoading ? copy.loading : copy.button}</button>
      </form>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </section>

    <section className="tool-panel robots-txt-result" aria-live="polite">
      <h2>{copy.result}</h2>
      {result ? <>
        <dl className="result-meta robots-txt-meta">
          <div><dt>{copy.status}</dt><dd className={`status-badge is-${robotsAccessTone(result)}`}>{robotsAccessLabel(result, locale)}</dd></div>
          <div><dt>HTTP</dt><dd>{result.status_code ?? "—"}</dd></div>
          <div><dt>{copy.targetPath}</dt><dd>{result.target_path}</dd></div>
          <div><dt>{copy.robotsUrl}</dt><dd>{result.robots_url}</dd></div>
        </dl>
        <div className="robots-txt-rule-card">
          <h3>{copy.matchedRule}</h3>
          <p>{result.matched_disallow_rule ?? result.matched_allow_rule ?? copy.noRule}</p>
        </div>
        <div className="robots-txt-columns">
          <div><h3>{copy.sitemaps}</h3>{result.sitemap_urls.length ? <ul className="result-list">{result.sitemap_urls.map((item) => <li key={item.url}>{item.url}</li>)}</ul> : <p className="muted-text">{copy.noSitemaps}</p>}</div>
          <div><h3>{copy.rules}</h3>{result.disallow_rules.length ? <ul className="result-list">{result.disallow_rules.slice(0, 6).map((rule) => <li key={`${rule.user_agent}-${rule.value}`}>{rule.user_agent}: {rule.directive} {rule.value || "—"}</li>)}</ul> : <p className="muted-text">{copy.noRules}</p>}</div>
        </div>
        <p className="robots-txt-recommendation"><strong>{copy.recommendation}:</strong> {result.recommendation}</p>
        <CopyButton value={robotsResultText(result)} locale={locale} />
      </> : <p className="muted-text">{copy.empty}</p>}
    </section>
  </div>;
}
