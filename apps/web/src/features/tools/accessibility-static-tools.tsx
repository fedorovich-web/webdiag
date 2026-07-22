"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { CopyButton } from "../../components/copy-button";
import { parsePageUrlInput } from "./client-delivery-tool-contract";
import {
  isFormAccessibilityResponse,
  isInteractiveAccessibleNameResponse,
  isLandmarkStructureResponse,
  type AccessibilityFinding,
  type AccessibilityStaticResponse,
  type FormAccessibilityResponse,
  type InteractiveAccessibleNameResponse,
  type LandmarkStructureResponse,
  type ToolStatus,
} from "./accessibility-static-tool-contract";

type ToolKind = "landmarks" | "forms" | "interactive-names";

const endpointByKind: Record<ToolKind, string> = {
  landmarks: "/api/tools/landmark-structure",
  forms: "/api/tools/form-accessibility",
  "interactive-names": "/api/tools/interactive-accessible-names",
};

const copy = {
  ru: {
    input: "URL страницы",
    run: "Проверить страницу",
    loading: "Проверяем…",
    invalidUrl: "Введите полный публичный HTTP/HTTPS URL без логина и пароля.",
    result: "Результат статического анализа",
    status: "Статус",
    findings: "Находки",
    recommendation: "Рекомендация",
    truncated: "Вывод ограничен; агрегированные счётчики сохранены.",
    limitation: "Анализируется только исходный HTML. JavaScript, CSS visibility, browser accessibility tree, focus order и keyboard behavior не выполняются.",
    copy: "Копируемый отчёт",
  },
  en: {
    input: "Page URL",
    run: "Analyze page",
    loading: "Analyzing…",
    invalidUrl: "Enter a full public HTTP/HTTPS URL without credentials.",
    result: "Static analysis result",
    status: "Status",
    findings: "Findings",
    recommendation: "Recommendation",
    truncated: "Output is capped; aggregate counters are preserved.",
    limitation: "Only source HTML is analyzed. JavaScript, CSS visibility, the browser accessibility tree, focus order, and keyboard behavior are not executed.",
    copy: "Copyable report",
  },
} as const;

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="tool-panel"><h2>{title}</h2>{children}</section>;
}

function StatusBadge({ value }: { value: ToolStatus }) {
  return <span className={`status-badge status-${value}`}>{value}</span>;
}

function FindingList({ findings }: { findings: readonly AccessibilityFinding[] }) {
  if (!findings.length) return null;
  return <ul className="result-list">
    {findings.slice(0, 12).map((finding) => (
      <li key={finding.id}>
        <strong>{finding.severity} · {finding.title}</strong>
        <span>{finding.value ?? finding.element ?? (finding.position ? `#${finding.position}` : "—")}</span>
      </li>
    ))}
  </ul>;
}

function ResultActions({ locale, value }: { locale: Locale; value: string }) {
  return <div className="output-wrap">
    <pre className="output" aria-label={copy[locale].copy}>{value}</pre>
    <CopyButton value={value} locale={locale} />
  </div>;
}

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function validatorForKind(kind: ToolKind, payload: unknown): payload is AccessibilityStaticResponse {
  if (kind === "landmarks") return isLandmarkStructureResponse(payload);
  if (kind === "forms") return isFormAccessibilityResponse(payload);
  return isInteractiveAccessibleNameResponse(payload);
}

async function runTool(kind: ToolKind, url: string): Promise<AccessibilityStaticResponse> {
  const response = await fetch(endpointByKind[kind], {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ url }),
    cache: "no-store",
  });
  const payload = await parseResponse(response);
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "detail" in payload
      ? String((payload as { detail?: { message?: unknown } }).detail?.message ?? "Tool request failed.")
      : "Tool request failed.";
    throw new Error(message);
  }
  if (!validatorForKind(kind, payload)) throw new Error("Tool API returned an invalid response contract.");
  return payload;
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
  return <Panel title={copy[locale].input}>
    <form className="tool-form" onSubmit={submit}>
      <label className="field">
        <span>{copy[locale].input}</span>
        <input value={url} onChange={(event: ChangeEvent<HTMLInputElement>) => setUrl(event.target.value)} inputMode="url" />
      </label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="button" type="submit" disabled={loading}>
        {loading ? copy[locale].loading : copy[locale].run}
      </button>
    </form>
  </Panel>;
}

export function landmarkStructureResultText(result: LandmarkStructureResponse): string {
  const findings = result.findings.map((finding) => `${finding.severity}: ${finding.title}`).join("\n");
  return [
    `URL: ${result.final_url}`,
    `Landmarks: ${result.landmark_count}`,
    `Named landmarks: ${result.named_landmark_count}`,
    `Main landmarks: ${result.main_count}`,
    `Navigation landmarks: ${result.navigation_count}`,
    `Banner/contentinfo: ${result.banner_count}/${result.contentinfo_count}`,
    `Duplicate role/name pairs: ${result.duplicate_role_name_count}`,
    `Findings: ${result.finding_count}`,
    findings,
    `Status: ${result.status}`,
    `Recommendation: ${result.recommendation}`,
  ].filter(Boolean).join("\n");
}

export function formAccessibilityResultText(result: FormAccessibilityResponse): string {
  const findings = result.findings.map((finding) => `${finding.severity}: ${finding.title}`).join("\n");
  return [
    `URL: ${result.final_url}`,
    `Forms: ${result.form_count}`,
    `Controls: ${result.control_count}`,
    `Labeled controls: ${result.labeled_control_count}`,
    `Unlabeled controls: ${result.unlabeled_control_count}`,
    `Placeholder-only candidates: ${result.placeholder_only_count}`,
    `Fieldsets without legend: ${result.fieldset_without_legend_count}`,
    `Broken label references: ${result.broken_label_reference_count}`,
    `Broken description references: ${result.broken_description_reference_count}`,
    `Ungrouped choice sets: ${result.ungrouped_choice_set_count}`,
    `Findings: ${result.finding_count}`,
    findings,
    `Status: ${result.status}`,
    `Recommendation: ${result.recommendation}`,
  ].filter(Boolean).join("\n");
}

export function interactiveAccessibleNameResultText(result: InteractiveAccessibleNameResponse): string {
  const findings = result.findings.map((finding) => `${finding.severity}: ${finding.title}`).join("\n");
  return [
    `URL: ${result.final_url}`,
    `Interactive elements: ${result.interactive_count}`,
    `Links/buttons: ${result.link_count}/${result.button_count}`,
    `Role links/buttons: ${result.role_link_count}/${result.role_button_count}`,
    `Named: ${result.named_count}`,
    `Unnamed: ${result.unnamed_count}`,
    `Generic names: ${result.generic_name_count}`,
    `Nested interactive: ${result.nested_interactive_count}`,
    `Custom roles without tabindex=0: ${result.role_without_keyboard_signal_count}`,
    `Findings: ${result.finding_count}`,
    findings,
    `Status: ${result.status}`,
    `Recommendation: ${result.recommendation}`,
  ].filter(Boolean).join("\n");
}

function LandmarkResult({ locale, result }: { locale: Locale; result: LandmarkStructureResponse }) {
  return <Panel title={copy[locale].result}>
    <div className="metric-grid">
      <div><span>{locale === "ru" ? "Landmarks" : "Landmarks"}</span><strong>{result.landmark_count}</strong></div>
      <div><span>{locale === "ru" ? "Main" : "Main"}</span><strong>{result.main_count}</strong></div>
      <div><span>{copy[locale].status}</span><strong><StatusBadge value={result.status} /></strong></div>
    </div>
    <ul className="result-list">
      <li><strong>navigation / complementary</strong><span>{result.navigation_count} / {result.complementary_count}</span></li>
      <li><strong>banner / contentinfo</strong><span>{result.banner_count} / {result.contentinfo_count}</span></li>
      <li><strong>search / form / region</strong><span>{result.search_count} / {result.form_landmark_count} / {result.region_count}</span></li>
      <li><strong>{locale === "ru" ? "Именованные" : "Named"}</strong><span>{result.named_landmark_count}</span></li>
      <li><strong>{locale === "ru" ? "Дубли type/name" : "Duplicate type/name"}</strong><span>{result.duplicate_role_name_count}</span></li>
    </ul>
    <FindingList findings={result.findings} />
    {result.truncated ? <p className="tool-note">{copy[locale].truncated}</p> : null}
    <p className="tool-note">{copy[locale].limitation}</p>
    <p><strong>{copy[locale].recommendation}:</strong> {result.recommendation}</p>
    <ResultActions locale={locale} value={landmarkStructureResultText(result)} />
  </Panel>;
}

function FormResult({ locale, result }: { locale: Locale; result: FormAccessibilityResponse }) {
  return <Panel title={copy[locale].result}>
    <div className="metric-grid">
      <div><span>{locale === "ru" ? "Контролы" : "Controls"}</span><strong>{result.control_count}</strong></div>
      <div><span>{locale === "ru" ? "Без имени" : "Unlabeled"}</span><strong>{result.unlabeled_control_count}</strong></div>
      <div><span>{copy[locale].status}</span><strong><StatusBadge value={result.status} /></strong></div>
    </div>
    <ul className="result-list">
      <li><strong>{locale === "ru" ? "Формы" : "Forms"}</strong><span>{result.form_count}</span></li>
      <li><strong>{locale === "ru" ? "Именованные / без имени" : "Labeled / unlabeled"}</strong><span>{result.labeled_control_count} / {result.unlabeled_control_count}</span></li>
      <li><strong>{locale === "ru" ? "Placeholder-only" : "Placeholder-only"}</strong><span>{result.placeholder_only_count}</span></li>
      <li><strong>fieldset / missing legend</strong><span>{result.fieldset_count} / {result.fieldset_without_legend_count}</span></li>
      <li><strong>label / description refs</strong><span>{result.broken_label_reference_count} / {result.broken_description_reference_count}</span></li>
      <li><strong>{locale === "ru" ? "Несгруппированные choices" : "Ungrouped choices"}</strong><span>{result.ungrouped_choice_set_count}</span></li>
    </ul>
    <FindingList findings={result.findings} />
    {result.truncated ? <p className="tool-note">{copy[locale].truncated}</p> : null}
    <p className="tool-note">{copy[locale].limitation}</p>
    <p><strong>{copy[locale].recommendation}:</strong> {result.recommendation}</p>
    <ResultActions locale={locale} value={formAccessibilityResultText(result)} />
  </Panel>;
}

function InteractiveResult({ locale, result }: { locale: Locale; result: InteractiveAccessibleNameResponse }) {
  return <Panel title={copy[locale].result}>
    <div className="metric-grid">
      <div><span>{locale === "ru" ? "Элементы" : "Elements"}</span><strong>{result.interactive_count}</strong></div>
      <div><span>{locale === "ru" ? "Без имени" : "Unnamed"}</span><strong>{result.unnamed_count}</strong></div>
      <div><span>{copy[locale].status}</span><strong><StatusBadge value={result.status} /></strong></div>
    </div>
    <ul className="result-list">
      <li><strong>links / buttons</strong><span>{result.link_count} / {result.button_count}</span></li>
      <li><strong>role=link / role=button</strong><span>{result.role_link_count} / {result.role_button_count}</span></li>
      <li><strong>{locale === "ru" ? "Именованные" : "Named"}</strong><span>{result.named_count}</span></li>
      <li><strong>{locale === "ru" ? "Общие названия" : "Generic names"}</strong><span>{result.generic_name_count}</span></li>
      <li><strong>{locale === "ru" ? "Вложенные interactive" : "Nested interactive"}</strong><span>{result.nested_interactive_count}</span></li>
      <li><strong>{locale === "ru" ? "Custom role без tabindex" : "Custom role without tabindex"}</strong><span>{result.role_without_keyboard_signal_count}</span></li>
    </ul>
    <FindingList findings={result.findings} />
    {result.truncated ? <p className="tool-note">{copy[locale].truncated}</p> : null}
    <p className="tool-note">{copy[locale].limitation}</p>
    <p><strong>{copy[locale].recommendation}:</strong> {result.recommendation}</p>
    <ResultActions locale={locale} value={interactiveAccessibleNameResultText(result)} />
  </Panel>;
}

function AccessibilityStaticTool({ locale, kind }: { locale: Locale; kind: ToolKind }) {
  const [result, setResult] = useState<AccessibilityStaticResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function run(url: string) {
    setLoading(true);
    setError("");
    try {
      setResult(await runTool(kind, url));
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
    {isLandmarkStructureResponse(result) ? <LandmarkResult locale={locale} result={result} /> : null}
    {isFormAccessibilityResponse(result) ? <FormResult locale={locale} result={result} /> : null}
    {isInteractiveAccessibleNameResponse(result) ? <InteractiveResult locale={locale} result={result} /> : null}
  </div>;
}

export function LandmarkStructureAnalyzerTool({ locale }: { locale: Locale }) {
  return <AccessibilityStaticTool locale={locale} kind="landmarks" />;
}

export function FormAccessibilityAnalyzerTool({ locale }: { locale: Locale }) {
  return <AccessibilityStaticTool locale={locale} kind="forms" />;
}

export function InteractiveAccessibleNameAnalyzerTool({ locale }: { locale: Locale }) {
  return <AccessibilityStaticTool locale={locale} kind="interactive-names" />;
}
