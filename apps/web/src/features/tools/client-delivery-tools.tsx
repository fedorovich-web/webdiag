"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { CopyButton } from "../../components/copy-button";
import {
  isCspAnalyzerResponse,
  isResourceHintsAnalyzerResponse,
  isThirdPartyScriptAnalyzerResponse,
  isToolErrorPayload,
  parsePageUrlInput,
  type ClientDeliveryToolResponse,
  type CspAnalyzerResponse,
  type ResourceHintsAnalyzerResponse,
  type ThirdPartyScriptAnalyzerResponse,
  type ToolStatus,
} from "./client-delivery-tool-contract";

type ToolKind = "csp" | "third-party-scripts" | "resource-hints";
type ToolEndpoint =
  | "/api/tools/csp"
  | "/api/tools/third-party-scripts"
  | "/api/tools/resource-hints";

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
    truncated: "Показан ограниченный sample; общие счётчики сохранены.",
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
  },
} as const;

class ClientDeliveryToolError extends Error {
  readonly code: string;

  constructor(message: string, code = "client_delivery_tool_error") {
    super(message);
    this.name = "ClientDeliveryToolError";
    this.code = code;
  }
}

function endpointFor(kind: ToolKind): ToolEndpoint {
  if (kind === "csp") return "/api/tools/csp";
  if (kind === "third-party-scripts") return "/api/tools/third-party-scripts";
  return "/api/tools/resource-hints";
}

async function runClientDeliveryTool(
  kind: ToolKind,
  url: string,
): Promise<ClientDeliveryToolResponse> {
  const response = await fetch(endpointFor(kind), {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (isToolErrorPayload(data)) {
      throw new ClientDeliveryToolError(data.detail.message, data.detail.code);
    }
    throw new ClientDeliveryToolError("Tool API request failed.");
  }
  if (kind === "csp" && isCspAnalyzerResponse(data)) return data;
  if (kind === "third-party-scripts" && isThirdPartyScriptAnalyzerResponse(data)) {
    return data;
  }
  if (kind === "resource-hints" && isResourceHintsAnalyzerResponse(data)) return data;
  throw new ClientDeliveryToolError("Tool API returned an invalid result.");
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="tool-panel"><h2>{title}</h2>{children}</section>;
}

function StatusBadge({ value }: { value: ToolStatus }) {
  return <span className={`tool-status tool-status-${value}`}>{value}</span>;
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
        <input value={url} onChange={(event: ChangeEvent<HTMLInputElement>) => setUrl(event.target.value)} />
      </label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="button" type="submit" disabled={loading}>
        {loading ? copy[locale].loading : copy[locale].run}
      </button>
    </form>
  </Panel>;
}

export function cspAnalyzerResultText(result: CspAnalyzerResponse): string {
  const findings = result.findings
    .map((finding) => `${finding.severity}: ${finding.title}`)
    .join("\n");
  return [
    `URL: ${result.final_url}`,
    `Enforced policies: ${result.enforced_policy_count}`,
    `Report-only policies: ${result.report_only_policy_count}`,
    `Meta policies: ${result.meta_policy_count}`,
    `Directives: ${result.directive_count}`,
    `Findings: ${result.finding_count}`,
    `High-risk findings: ${result.high_risk_finding_count}`,
    findings,
    `Status: ${result.status}`,
    `Recommendation: ${result.recommendation}`,
  ].filter(Boolean).join("\n");
}

export function thirdPartyScriptResultText(result: ThirdPartyScriptAnalyzerResponse): string {
  const hosts = result.host_groups
    .map((group) => `${group.hostname}: ${group.count} (${group.classification})`)
    .join("\n");
  return [
    `URL: ${result.final_url}`,
    `Scripts: ${result.script_count}`,
    `Inline: ${result.inline_script_count}`,
    `External: ${result.external_script_count}`,
    `Same-host: ${result.same_host_script_count}`,
    `Cross-host candidates: ${result.cross_host_script_count}`,
    `Parser-blocking candidates: ${result.parser_blocking_candidate_count}`,
    `Duplicate src: ${result.duplicate_src_count}`,
    `Classification basis: ${result.classification_basis}`,
    hosts,
    `Status: ${result.status}`,
    `Recommendation: ${result.recommendation}`,
  ].filter(Boolean).join("\n");
}

export function resourceHintsResultText(result: ResourceHintsAnalyzerResponse): string {
  const findings = result.findings
    .map((finding) => `${finding.severity}: ${finding.title}`)
    .join("\n");
  return [
    `URL: ${result.final_url}`,
    `Hints: ${result.hint_count}`,
    `Preconnect: ${result.preconnect_count}`,
    `DNS prefetch: ${result.dns_prefetch_count}`,
    `Preload: ${result.preload_count}`,
    `Prefetch: ${result.prefetch_count}`,
    `Modulepreload: ${result.modulepreload_count}`,
    `Preinit: ${result.preinit_count}`,
    `Duplicates: ${result.duplicate_hint_count}`,
    findings,
    `Status: ${result.status}`,
    `Recommendation: ${result.recommendation}`,
  ].filter(Boolean).join("\n");
}

function CspResult({ locale, result }: { locale: Locale; result: CspAnalyzerResponse }) {
  return <Panel title={copy[locale].result}>
    <div className="metric-grid">
      <div><span>{locale === "ru" ? "Политики" : "Policies"}</span><strong>{result.enforced_policy_count}</strong></div>
      <div><span>{locale === "ru" ? "Находки" : "Findings"}</span><strong>{result.finding_count}</strong></div>
      <div><span>{copy[locale].status}</span><strong><StatusBadge value={result.status} /></strong></div>
    </div>
    <ul className="result-list">
      <li><strong>Header / meta</strong><span>{result.enforced_policy_count} / {result.meta_policy_count}</span></li>
      <li><strong>Report-Only</strong><span>{result.report_only_policy_count}</span></li>
      <li><strong>{locale === "ru" ? "Директивы" : "Directives"}</strong><span>{result.directive_count}</span></li>
      <li><strong>{locale === "ru" ? "Высокий риск" : "High risk"}</strong><span>{result.high_risk_finding_count}</span></li>
      {result.findings.slice(0, 10).map((finding) => (
        <li key={finding.id}>
          <strong>{finding.severity} · {finding.title}</strong>
          <span>{finding.directive ?? finding.source}</span>
        </li>
      ))}
    </ul>
    {result.truncated ? <p className="tool-note">{copy[locale].truncated}</p> : null}
    <Recommendation locale={locale} value={result.recommendation} />
    <ResultActions locale={locale} value={cspAnalyzerResultText(result)} />
  </Panel>;
}

function ScriptResult({
  locale,
  result,
}: {
  locale: Locale;
  result: ThirdPartyScriptAnalyzerResponse;
}) {
  return <Panel title={copy[locale].result}>
    <div className="metric-grid">
      <div><span>{locale === "ru" ? "Скрипты" : "Scripts"}</span><strong>{result.script_count}</strong></div>
      <div><span>{locale === "ru" ? "Другие hosts" : "Cross-host"}</span><strong>{result.cross_host_script_count}</strong></div>
      <div><span>{copy[locale].status}</span><strong><StatusBadge value={result.status} /></strong></div>
    </div>
    <ul className="result-list">
      <li><strong>Inline / external</strong><span>{result.inline_script_count} / {result.external_script_count}</span></li>
      <li><strong>async / defer / module</strong><span>{result.async_count} / {result.defer_count} / {result.module_count}</span></li>
      <li><strong>{locale === "ru" ? "Blocking candidates" : "Blocking candidates"}</strong><span>{result.parser_blocking_candidate_count}</span></li>
      <li><strong>{locale === "ru" ? "Дубли src" : "Duplicate src"}</strong><span>{result.duplicate_src_count}</span></li>
      {result.host_groups.slice(0, 10).map((group) => (
        <li key={group.hostname}>
          <strong>{group.hostname}</strong>
          <span>{group.count} · {group.classification}</span>
        </li>
      ))}
    </ul>
    <p className="tool-note">
      {locale === "ru"
        ? "Third-party означает cross-host candidate по hostname, а не доказанного владельца или tracker."
        : "Third-party means a hostname-based cross-host candidate, not proven ownership or tracking."}
    </p>
    {result.truncated ? <p className="tool-note">{copy[locale].truncated}</p> : null}
    <Recommendation locale={locale} value={result.recommendation} />
    <ResultActions locale={locale} value={thirdPartyScriptResultText(result)} />
  </Panel>;
}

function ResourceHintsResult({
  locale,
  result,
}: {
  locale: Locale;
  result: ResourceHintsAnalyzerResponse;
}) {
  return <Panel title={copy[locale].result}>
    <div className="metric-grid">
      <div><span>{locale === "ru" ? "Hints" : "Hints"}</span><strong>{result.hint_count}</strong></div>
      <div><span>{locale === "ru" ? "Находки" : "Findings"}</span><strong>{result.finding_count}</strong></div>
      <div><span>{copy[locale].status}</span><strong><StatusBadge value={result.status} /></strong></div>
    </div>
    <ul className="result-list">
      <li><strong>preconnect / dns-prefetch</strong><span>{result.preconnect_count} / {result.dns_prefetch_count}</span></li>
      <li><strong>preload / modulepreload</strong><span>{result.preload_count} / {result.modulepreload_count}</span></li>
      <li><strong>prefetch / preinit</strong><span>{result.prefetch_count} / {result.preinit_count}</span></li>
      <li><strong>{locale === "ru" ? "Дубли" : "Duplicates"}</strong><span>{result.duplicate_hint_count}</span></li>
      {result.findings.slice(0, 10).map((finding) => (
        <li key={finding.id}>
          <strong>{finding.severity} · {finding.title}</strong>
          <span>{finding.value ?? finding.rel ?? "—"}</span>
        </li>
      ))}
    </ul>
    {result.truncated ? <p className="tool-note">{copy[locale].truncated}</p> : null}
    <Recommendation locale={locale} value={result.recommendation} />
    <ResultActions locale={locale} value={resourceHintsResultText(result)} />
  </Panel>;
}

function ClientDeliveryTool({ locale, kind }: { locale: Locale; kind: ToolKind }) {
  const [result, setResult] = useState<ClientDeliveryToolResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function run(url: string) {
    setLoading(true);
    setError("");
    try {
      setResult(await runClientDeliveryTool(kind, url));
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "Tool request failed.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="tool-grid">
    <UrlForm locale={locale} loading={loading} onSubmit={run} />
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    {isCspAnalyzerResponse(result) ? <CspResult locale={locale} result={result} /> : null}
    {isThirdPartyScriptAnalyzerResponse(result)
      ? <ScriptResult locale={locale} result={result} />
      : null}
    {isResourceHintsAnalyzerResponse(result)
      ? <ResourceHintsResult locale={locale} result={result} />
      : null}
  </div>;
}

export function CspAnalyzerTool({ locale }: { locale: Locale }) {
  return <ClientDeliveryTool locale={locale} kind="csp" />;
}

export function ThirdPartyScriptAnalyzerTool({ locale }: { locale: Locale }) {
  return <ClientDeliveryTool locale={locale} kind="third-party-scripts" />;
}

export function ResourceHintsAnalyzerTool({ locale }: { locale: Locale }) {
  return <ClientDeliveryTool locale={locale} kind="resource-hints" />;
}
