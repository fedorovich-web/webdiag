"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { CopyButton } from "../../components/copy-button";
import {
  isToolErrorPayload,
  parsePageUrlInput,
  type ToolStatus,
} from "./client-delivery-tool-contract";
import {
  analyzeQueryParameters,
  analyzeUrlNormalization,
  type QueryParameterResult,
  type UrlNormalizationResult,
} from "./url-management-local";
import {
  isRedirectMapResponse,
  type RedirectMapInputEntry,
  type RedirectMapResponse,
} from "./url-management-tool-contract";

const copy = {
  ru: {
    input: "Входные данные",
    result: "Результат",
    url: "HTTP/HTTPS URL",
    analyze: "Анализировать",
    invalidUrl: "Введите полный HTTP/HTTPS URL без логина и пароля.",
    status: "Статус",
    recommendation: "Рекомендация",
    normalized: "Нормализованный URL",
    requestUrl: "URL HTTP-запроса",
    syntaxChanges: "Синтаксические изменения",
    reviewSignals: "Сигналы для проверки",
    components: "Компоненты URL",
    queryPairs: "Пары параметров",
    uniqueNames: "Уникальные имена",
    duplicateNames: "Повторные имена",
    trackingPagination: "Tracking / pagination",
    sensitiveCase: "Sensitive-name / регистр",
    cleanedCandidate: "Кандидат без известных tracking-параметров",
    noParameters: "Query parameters отсутствуют.",
    mapLabel: "Redirect map CSV или TSV",
    mapHelp: "Колонки: source,target,status. Header необязателен. Максимум 25 строк.",
    validateMap: "Проверить карту",
    validating: "Проверяем…",
    mapParseError: "Не удалось разобрать redirect map.",
    checkedMatched: "Проверено / совпало",
    mismatchFailed: "Несовпадения / не проверено",
    duplicateConflict: "Дубли / конфликты",
    chainsCycles: "Цепочки / циклы",
    findings: "Сводные findings",
    rows: "Строки карты",
    copyReport: "Копировать отчёт",
  },
  en: {
    input: "Input",
    result: "Result",
    url: "HTTP/HTTPS URL",
    analyze: "Analyze",
    invalidUrl: "Enter a full HTTP/HTTPS URL without credentials.",
    status: "Status",
    recommendation: "Recommendation",
    normalized: "Normalized URL",
    requestUrl: "HTTP request URL",
    syntaxChanges: "Syntax changes",
    reviewSignals: "Review signals",
    components: "URL components",
    queryPairs: "Parameter pairs",
    uniqueNames: "Unique names",
    duplicateNames: "Repeated names",
    trackingPagination: "Tracking / pagination",
    sensitiveCase: "Sensitive-name / case",
    cleanedCandidate: "Candidate without known tracking parameters",
    noParameters: "No query parameters were found.",
    mapLabel: "Redirect map CSV or TSV",
    mapHelp: "Columns: source,target,status. Header is optional. Maximum 25 rows.",
    validateMap: "Validate map",
    validating: "Validating…",
    mapParseError: "The redirect map could not be parsed.",
    checkedMatched: "Checked / matched",
    mismatchFailed: "Mismatch / unverified",
    duplicateConflict: "Duplicates / conflicts",
    chainsCycles: "Chains / cycles",
    findings: "Aggregate findings",
    rows: "Map rows",
    copyReport: "Copy report",
  },
} as const;

const DEFAULT_MAP = `source,target,status
https://example.com/old-page,https://example.com/new-page,301`;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

class UrlManagementError extends Error {
  readonly code: string;

  constructor(message: string, code = "url_management_error") {
    super(message);
    this.name = "UrlManagementError";
    this.code = code;
  }
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="tool-panel"><h2>{title}</h2>{children}</section>;
}

function StatusBadge({ value }: { value: ToolStatus | "pass" | "warning" }) {
  return <span className={`tool-status tool-status-${value}`}>{value}</span>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <article><span>{label}</span><strong>{value}</strong></article>;
}

function ResultActions({ locale, value }: { locale: Locale; value: string }) {
  return <div className="output-wrap">
    <pre className="output" aria-label={copy[locale].copyReport}>{value}</pre>
    <CopyButton value={value} locale={locale} />
  </div>;
}

function Recommendation({ locale, value }: { locale: Locale; value: string }) {
  return <p className="tool-note"><strong>{copy[locale].recommendation}:</strong> {value}</p>;
}

function UrlInputForm({
  locale,
  defaultValue,
  onRun,
}: {
  locale: Locale;
  defaultValue: string;
  onRun: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!parsePageUrlInput(value)) {
      setError(copy[locale].invalidUrl);
      return;
    }
    setError("");
    onRun(value);
  }

  return <Panel title={copy[locale].input}>
    <form className="tool-form" onSubmit={submit}>
      <label className="field">
        <span>{copy[locale].url}</span>
        <input
          value={value}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setValue(event.target.value)}
        />
      </label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="button" type="submit">{copy[locale].analyze}</button>
    </form>
  </Panel>;
}

export function urlNormalizationResultText(
  result: UrlNormalizationResult,
  locale: Locale = "en",
): string {
  const changes = result.changes
    .map((item) => `${item.kind}: ${item.message}`)
    .join("\n");
  return [
    `${copy[locale].normalized}: ${result.normalized_url}`,
    `${copy[locale].requestUrl}: ${result.request_url}`,
    `${copy[locale].syntaxChanges}: ${result.change_count}`,
    `${copy[locale].reviewSignals}: ${result.review_signal_count}`,
    changes,
    `Status: ${result.status}`,
    `Recommendation: ${result.recommendation}`,
  ].filter(Boolean).join("\n");
}

function UrlNormalizationResultView({
  locale,
  result,
}: {
  locale: Locale;
  result: UrlNormalizationResult;
}) {
  return <Panel title={copy[locale].result}>
    <p><StatusBadge value={result.status} /></p>
    <div className="tool-metrics">
      <Metric label={copy[locale].syntaxChanges} value={result.change_count} />
      <Metric label={copy[locale].reviewSignals} value={result.review_signal_count} />
      <Metric label={locale === "ru" ? "Схема" : "Scheme"} value={result.scheme} />
      <Metric label={locale === "ru" ? "Hostname" : "Hostname"} value={result.hostname} />
    </div>
    <div className="result-list result-list-rich">
      <p><strong>{copy[locale].normalized}</strong><br />{result.normalized_url}</p>
      <p><strong>{copy[locale].requestUrl}</strong><br />{result.request_url}</p>
    </div>
    <h3>{copy[locale].components}</h3>
    <ul className="result-list">
      <li><strong>path</strong><span>{result.pathname}</span></li>
      <li><strong>query</strong><span>{result.query || "—"}</span></li>
      <li><strong>fragment</strong><span>{result.fragment || "—"}</span></li>
      <li><strong>port</strong><span>{result.port ?? "—"}</span></li>
    </ul>
    {result.changes.length ? <ul className="result-list result-list-rich">
      {result.changes.map((item) => <li key={item.id}>
        <strong>{item.kind}</strong><span>{item.message}</span>
      </li>)}
    </ul> : null}
    <Recommendation locale={locale} value={result.recommendation} />
    <ResultActions locale={locale} value={urlNormalizationResultText(result, locale)} />
  </Panel>;
}

export function UrlNormalizationAnalyzerTool({ locale }: { locale: Locale }) {
  const [result, setResult] = useState<UrlNormalizationResult | null>(null);
  const [error, setError] = useState("");

  function run(value: string) {
    try {
      setResult(analyzeUrlNormalization(value));
      setError("");
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : copy[locale].invalidUrl);
    }
  }

  return <div className="tool-grid">
    <UrlInputForm
      locale={locale}
      defaultValue="HTTPS://Exämple.com:443/a/../b/%7euser/?utm_source=test#section"
      onRun={run}
    />
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    {result ? <UrlNormalizationResultView locale={locale} result={result} /> : null}
  </div>;
}

export function queryParameterResultText(
  result: QueryParameterResult,
  locale: Locale = "en",
): string {
  return [
    `URL: ${result.input_url}`,
    `${copy[locale].queryPairs}: ${result.pair_count}`,
    `${copy[locale].uniqueNames}: ${result.unique_name_count}`,
    `${copy[locale].duplicateNames}: ${result.duplicate_name_count}`,
    `Tracking: ${result.tracking_parameter_count}`,
    `Pagination: ${result.pagination_parameter_count}`,
    `Sensitive-looking names: ${result.sensitive_name_count}`,
    result.tracking_removed_candidate
      ? `${copy[locale].cleanedCandidate}: ${result.tracking_removed_candidate}`
      : "",
    ...result.findings,
    `Status: ${result.status}`,
    `Recommendation: ${result.recommendation}`,
  ].filter(Boolean).join("\n");
}

function QueryParameterResultView({
  locale,
  result,
}: {
  locale: Locale;
  result: QueryParameterResult;
}) {
  return <Panel title={copy[locale].result}>
    <p><StatusBadge value={result.status} /></p>
    <div className="tool-metrics">
      <Metric label={copy[locale].queryPairs} value={result.pair_count} />
      <Metric label={copy[locale].uniqueNames} value={result.unique_name_count} />
      <Metric label={copy[locale].duplicateNames} value={result.duplicate_name_count} />
      <Metric
        label={copy[locale].trackingPagination}
        value={`${result.tracking_parameter_count} / ${result.pagination_parameter_count}`}
      />
      <Metric
        label={copy[locale].sensitiveCase}
        value={`${result.sensitive_name_count} / ${result.case_variant_group_count}`}
      />
    </div>
    {result.tracking_removed_candidate ? <p className="tool-note">
      <strong>{copy[locale].cleanedCandidate}:</strong> {result.tracking_removed_candidate}
    </p> : null}
    {result.parameters.length ? <ul className="result-list result-list-rich">
      {result.parameters.map((item) => <li key={`${item.position}-${item.raw_name}`}>
        <strong>{item.name || "(blank)"} · {item.category}</strong>
        <span>{item.value || "(empty)"}</span>
      </li>)}
    </ul> : <p>{copy[locale].noParameters}</p>}
    {result.findings.length ? <ul className="result-list">
      {result.findings.map((finding) => <li key={finding}>{finding}</li>)}
    </ul> : null}
    <Recommendation locale={locale} value={result.recommendation} />
    <ResultActions locale={locale} value={queryParameterResultText(result, locale)} />
  </Panel>;
}

export function QueryParameterAnalyzerTool({ locale }: { locale: Locale }) {
  const [result, setResult] = useState<QueryParameterResult | null>(null);
  const [error, setError] = useState("");

  function run(value: string) {
    try {
      setResult(analyzeQueryParameters(value));
      setError("");
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : copy[locale].invalidUrl);
    }
  }

  return <div className="tool-grid">
    <UrlInputForm
      locale={locale}
      defaultValue="https://example.com/catalog?page=2&sort=price&utm_source=newsletter&filter_brand=Acme"
      onRun={run}
    />
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    {result ? <QueryParameterResultView locale={locale} result={result} /> : null}
  </div>;
}

function parseDelimitedLine(line: string): string[] {
  const delimiter = line.includes("\t") ? "\t" : ",";
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (character === delimiter && !quoted) {
      values.push(value.trim());
      value = "";
      continue;
    }
    value += character;
  }
  if (quoted) throw new UrlManagementError("A CSV row has an unclosed quote.");
  values.push(value.trim());
  return values;
}

function isHeader(values: readonly string[]): boolean {
  const first = values[0]?.toLowerCase().replace(/\s+/g, "_");
  const second = values[1]?.toLowerCase().replace(/\s+/g, "_");
  return (first === "source" || first === "source_url")
    && (second === "target" || second === "target_url");
}

export function parseRedirectMapText(value: string): readonly RedirectMapInputEntry[] {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  if (!lines.length) throw new UrlManagementError("Provide at least one redirect row.");
  const parsedRows = lines.map(parseDelimitedLine);
  const rows = isHeader(parsedRows[0]!) ? parsedRows.slice(1) : parsedRows;
  if (!rows.length) throw new UrlManagementError("Provide at least one redirect row.");
  if (rows.length > 25) throw new UrlManagementError("A maximum of 25 redirect rows is supported.");

  return rows.map((fields, index) => {
    if (fields.length < 2 || fields.length > 3) {
      throw new UrlManagementError(`Row ${index + 1} must have source, target, and optional status.`);
    }
    const source = parsePageUrlInput(fields[0]!);
    const target = parsePageUrlInput(fields[1]!);
    if (!source || !target) {
      throw new UrlManagementError(`Row ${index + 1} contains an invalid HTTP/HTTPS URL.`);
    }
    const statusValue = fields[2];
    if (!statusValue) return { source_url: source, target_url: target };
    const status = Number(statusValue);
    if (!Number.isInteger(status) || !REDIRECT_STATUSES.has(status)) {
      throw new UrlManagementError(`Row ${index + 1} has an unsupported redirect status.`);
    }
    return {
      source_url: source,
      target_url: target,
      expected_status_code: status,
    };
  });
}

async function runRedirectMap(entries: readonly RedirectMapInputEntry[]): Promise<RedirectMapResponse> {
  const response = await fetch("/api/tools/redirect-map", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ entries }),
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (isToolErrorPayload(data)) {
      throw new UrlManagementError(data.detail.message, data.detail.code);
    }
    throw new UrlManagementError("Redirect map API request failed.");
  }
  if (!isRedirectMapResponse(data)) {
    throw new UrlManagementError("Redirect map API returned an invalid result.");
  }
  return data;
}

export function redirectMapResultText(
  result: RedirectMapResponse,
  locale: Locale = "en",
): string {
  const rows = result.entries.map((entry) => (
    `${entry.status.toUpperCase()} ${entry.source_url} -> ${entry.target_url}; `
    + `observed=${entry.observed_first_status_code ?? "—"} ${entry.observed_first_target_url ?? "—"}`
  ));
  return [
    `${copy[locale].checkedMatched}: ${result.checked_count} / ${result.matched_count}`,
    `${copy[locale].mismatchFailed}: ${result.mismatch_count} / ${result.failed_count}`,
    `${copy[locale].duplicateConflict}: ${result.duplicate_source_count} / ${result.conflicting_source_count}`,
    `${copy[locale].chainsCycles}: ${result.chain_source_count} / ${result.cycle_count}`,
    ...rows,
    `Status: ${result.status}`,
    `Recommendation: ${result.recommendation}`,
  ].join("\n");
}

function RedirectMapResultView({
  locale,
  result,
}: {
  locale: Locale;
  result: RedirectMapResponse;
}) {
  return <Panel title={copy[locale].result}>
    <p><StatusBadge value={result.status} /></p>
    <div className="tool-metrics">
      <Metric label={copy[locale].checkedMatched} value={`${result.checked_count} / ${result.matched_count}`} />
      <Metric label={copy[locale].mismatchFailed} value={`${result.mismatch_count} / ${result.failed_count}`} />
      <Metric label={copy[locale].duplicateConflict} value={`${result.duplicate_source_count} / ${result.conflicting_source_count}`} />
      <Metric label={copy[locale].chainsCycles} value={`${result.chain_source_count} / ${result.cycle_count}`} />
    </div>
    {result.findings.length ? <>
      <h3>{copy[locale].findings}</h3>
      <ul className="result-list result-list-rich">
        {result.findings.map((finding) => <li key={finding.id}>
          <strong>{finding.severity} · {finding.title}</strong>
          <span>{finding.recommendation}</span>
        </li>)}
      </ul>
    </> : null}
    <h3>{copy[locale].rows}</h3>
    <ul className="result-list result-list-rich">
      {result.entries.map((entry) => <li key={entry.position}>
        <strong>{entry.status.toUpperCase()} · {entry.observed_first_status_code ?? "—"}</strong>
        <span>{entry.source_url} → {entry.observed_first_target_url ?? "—"}</span>
        {entry.issues.length ? <small>{entry.issues.join(", ")}</small> : null}
      </li>)}
    </ul>
    <Recommendation locale={locale} value={result.recommendation} />
    <ResultActions locale={locale} value={redirectMapResultText(result, locale)} />
  </Panel>;
}

export function RedirectMapValidatorTool({ locale }: { locale: Locale }) {
  const [value, setValue] = useState(DEFAULT_MAP);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RedirectMapResponse | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    let entries: readonly RedirectMapInputEntry[];
    try {
      entries = parseRedirectMapText(value);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy[locale].mapParseError);
      return;
    }
    setLoading(true);
    try {
      setResult(await runRedirectMap(entries));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Redirect map request failed.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="tool-grid">
    <Panel title={copy[locale].input}>
      <form className="tool-form" onSubmit={submit}>
        <label className="field">
          <span>{copy[locale].mapLabel}</span>
          <textarea
            value={value}
            rows={10}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setValue(event.target.value)}
          />
        </label>
        <p className="tool-note">{copy[locale].mapHelp}</p>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="button" type="submit" disabled={loading}>
          {loading ? copy[locale].validating : copy[locale].validateMap}
        </button>
      </form>
    </Panel>
    {result ? <RedirectMapResultView locale={locale} result={result} /> : null}
  </div>;
}
