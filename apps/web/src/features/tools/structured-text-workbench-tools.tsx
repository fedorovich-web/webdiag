"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { CopyButton } from "../../components/copy-button";
import {
  csvToJson,
  jsonToCsv,
  jsonToToml,
  queryJsonPath,
  tomlToJson,
  type CsvDelimiter,
  type CsvDelimiterOption,
  type CsvToJsonResult,
  type JsonPathQueryResult,
  type JsonToCsvResult,
} from "./structured-text-workbench";

function Panel({ title, children }: { readonly title: string; readonly children: React.ReactNode }) {
  return <section className="tool-panel"><h2>{title}</h2>{children}</section>;
}

function Output({ value, locale }: { readonly value: string; readonly locale: Locale }) {
  return <div className="output-wrap"><pre className="output" aria-live="polite">{value || "—"}</pre><CopyButton value={value} locale={locale} /></div>;
}

function ErrorMessage({ value }: { readonly value: string }) {
  return value ? <p className="form-error" role="alert">{value}</p> : null;
}

function jsonPathReport(result: JsonPathQueryResult, locale: Locale): string {
  const maximumReportChars = 100_000;
  const maximumValueChars = 4_000;
  const lines = [
    `${locale === "ru" ? "Совпадений" : "Matches"}: ${result.matchCount}`,
    `${locale === "ru" ? "Посещено узлов" : "Visited nodes"}: ${result.visitedNodeCount}`,
    `${locale === "ru" ? "Результат ограничен" : "Result truncated"}: ${result.truncated ? "yes" : "no"}`,
    "",
  ];
  let reportLength = lines.join("\n").length;
  for (const match of result.matches) {
    const serialized = JSON.stringify(match.value, null, 2);
    const value = serialized.length > maximumValueChars
      ? `${serialized.slice(0, maximumValueChars)}\n… value preview truncated`
      : serialized;
    const entry = `${match.path || "/"}\n${value}\n`;
    if (reportLength + entry.length > maximumReportChars) {
      lines.push(locale === "ru" ? "… отчёт ограничен 100 000 символов" : "… report truncated at 100,000 characters");
      break;
    }
    lines.push(entry);
    reportLength += entry.length;
  }
  return lines.join("\n").trim();
}

export function JsonPathTesterTool({ locale }: { readonly locale: Locale }) {
  const [json, setJson] = useState('{\n  "store": {\n    "items": [\n      { "name": "DNS", "price": 8 },\n      { "name": "RDAP", "price": 12 }\n    ]\n  }\n}');
  const [path, setPath] = useState("$.store.items[?(@.price < 10)].name");
  const [result, setResult] = useState<JsonPathQueryResult | null>(null);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setResult(queryJsonPath(json, path));
      setError("");
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : locale === "ru" ? "Не удалось выполнить JSONPath." : "Unable to run JSONPath.");
    }
  }

  return <div className="tool-grid">
    <Panel title={locale === "ru" ? "JSON и JSONPath" : "JSON and JSONPath"}>
      <form onSubmit={submit}>
        <label className="field"><span>JSONPath</span><input value={path} onChange={(event: ChangeEvent<HTMLInputElement>) => setPath(event.target.value)} spellCheck={false} /></label>
        <label className="field"><span>JSON</span><textarea className="code-input" rows={20} value={json} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setJson(event.target.value)} /></label>
        <button className="button" type="submit">{locale === "ru" ? "Выполнить запрос" : "Run query"}</button>
        <ErrorMessage value={error} />
      </form>
    </Panel>
    <Panel title={locale === "ru" ? "Совпадения" : "Matches"}>
      {result ? <>
        <div className="metric-grid">
          <div><strong>{result.matchCount}</strong><span>{locale === "ru" ? "совпадений" : "matches"}</span></div>
          <div><strong>{result.visitedNodeCount}</strong><span>{locale === "ru" ? "посещено узлов" : "visited nodes"}</span></div>
          <div><strong>{result.truncated ? "yes" : "no"}</strong><span>{locale === "ru" ? "ограничен" : "truncated"}</span></div>
        </div>
        <Output value={jsonPathReport(result, locale)} locale={locale} />
        <p className="tool-muted">{locale === "ru"
          ? "Поддерживаются properties, indices, wildcards, recursive descent, unions, slices и bounded comparison filters. Script expressions, functions, regex и eval не выполняются."
          : "Properties, indices, wildcards, recursive descent, unions, slices, and bounded comparison filters are supported. Script expressions, functions, regex, and eval are not executed."}</p>
      </> : <p className="tool-muted">{locale === "ru" ? "Выполните запрос, чтобы получить bounded список совпадений." : "Run a query to produce a bounded match list."}</p>}
    </Panel>
  </div>;
}

export function TomlJsonConverterTool({ locale }: { readonly locale: Locale }) {
  const [direction, setDirection] = useState<"toml-to-json" | "json-to-toml">("toml-to-json");
  const [input, setInput] = useState('title = "WebDiag"\nports = [80, 443]\n\n[database]\nenabled = true');
  const [output, setOutput] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");

  function changeDirection(value: "toml-to-json" | "json-to-toml") {
    setDirection(value);
    setOutput("");
    setDetails("");
    setError("");
    setInput(value === "toml-to-json"
      ? 'title = "WebDiag"\nports = [80, 443]\n\n[database]\nenabled = true'
      : '{\n  "title": "WebDiag",\n  "ports": [80, 443],\n  "database": { "enabled": true }\n}');
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const result = direction === "toml-to-json" ? tomlToJson(input) : jsonToToml(input);
      setOutput(result.output);
      setDetails([
        `${locale === "ru" ? "Узлов" : "Nodes"}: ${result.nodeCount}`,
        `${locale === "ru" ? "Предупреждения" : "Warnings"}: ${result.warnings.join(", ") || "none"}`,
      ].join("\n"));
      setError("");
    } catch (caught) {
      setOutput("");
      setDetails("");
      setError(caught instanceof Error ? caught.message : locale === "ru" ? "Не удалось преобразовать TOML." : "Unable to convert TOML.");
    }
  }

  return <div className="tool-grid">
    <Panel title={locale === "ru" ? "Входные данные" : "Input data"}>
      <form onSubmit={submit}>
        <label className="field"><span>{locale === "ru" ? "Направление" : "Direction"}</span><select value={direction} onChange={(event: ChangeEvent<HTMLSelectElement>) => changeDirection(event.target.value as "toml-to-json" | "json-to-toml")}><option value="toml-to-json">TOML → JSON</option><option value="json-to-toml">JSON → TOML</option></select></label>
        <label className="field"><span>{direction === "toml-to-json" ? "TOML" : "JSON"}</span><textarea className="code-input" rows={20} value={input} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setInput(event.target.value)} /></label>
        <button className="button" type="submit">{locale === "ru" ? "Преобразовать" : "Convert"}</button>
        <ErrorMessage value={error} />
      </form>
    </Panel>
    <Panel title={locale === "ru" ? "Результат" : "Result"}>
      <Output value={output} locale={locale} />
      {details ? <pre className="tool-muted">{details}</pre> : null}
      <p className="tool-muted">{locale === "ru"
        ? "Поддерживается bounded TOML 1.0 configuration subset: tables, array tables, dotted keys, arrays, inline tables и JSON-compatible scalars. Multiline strings и значения inf/nan не преобразуются."
        : "A bounded TOML 1.0 configuration subset is supported: tables, array tables, dotted keys, arrays, inline tables, and JSON-compatible scalars. Multiline strings and inf/nan values are not converted."}</p>
    </Panel>
  </div>;
}

function delimiterLabel(value: CsvDelimiterOption): string {
  if (value === "auto") return "Auto";
  if (value === "\t") return "Tab";
  if (value === ",") return "Comma";
  if (value === ";") return "Semicolon";
  return "Pipe";
}

function csvToJsonReport(result: CsvToJsonResult, locale: Locale): string {
  const lines = [
    `${locale === "ru" ? "Результат" : "Result"}: ${result.valid ? "valid" : "invalid"}`,
    `${locale === "ru" ? "Разделитель" : "Delimiter"}: ${delimiterLabel(result.delimiter)}`,
    `${locale === "ru" ? "Строк" : "Rows"}: ${result.rowCount}`,
    `${locale === "ru" ? "Столбцов" : "Columns"}: ${result.columnCount}`,
    `${locale === "ru" ? "Проблем" : "Issues"}: ${result.issueCount}`,
    `${locale === "ru" ? "Formula-like полей" : "Formula-like fields"}: ${result.formulaRiskCount}`,
  ];
  for (const issue of result.issues) lines.push(`${issue.path} [${issue.code}] ${issue.message}`);
  if (result.warnings.length) lines.push(`${locale === "ru" ? "Предупреждения" : "Warnings"}: ${result.warnings.join(", ")}`);
  return lines.join("\n");
}

function jsonToCsvReport(result: JsonToCsvResult, locale: Locale): string {
  return [
    `${locale === "ru" ? "Строк" : "Rows"}: ${result.rowCount}`,
    `${locale === "ru" ? "Столбцов" : "Columns"}: ${result.columnCount}`,
    `${locale === "ru" ? "Formula-like полей" : "Formula-like fields"}: ${result.formulaRiskCount}`,
    `${locale === "ru" ? "Префиксовано апострофом" : "Prefixed with apostrophe"}: ${result.escapedFormulaCount}`,
    `${locale === "ru" ? "Предупреждения" : "Warnings"}: ${result.warnings.join(", ") || "none"}`,
  ].join("\n");
}

export function CsvDataWorkbenchTool({ locale }: { readonly locale: Locale }) {
  const [direction, setDirection] = useState<"csv-to-json" | "json-to-csv">("csv-to-json");
  const [delimiter, setDelimiter] = useState<CsvDelimiterOption>("auto");
  const [header, setHeader] = useState(true);
  const [escapeFormulae, setEscapeFormulae] = useState(true);
  const [input, setInput] = useState('name,category,note\nWebDiag,SEO,"DNS, RDAP"\nAudit,Tools,"line 1\nline 2"');
  const [output, setOutput] = useState("");
  const [report, setReport] = useState("");
  const [error, setError] = useState("");

  function changeDirection(value: "csv-to-json" | "json-to-csv") {
    setDirection(value);
    setDelimiter(value === "csv-to-json" ? "auto" : ",");
    setInput(value === "csv-to-json"
      ? 'name,category,note\nWebDiag,SEO,"DNS, RDAP"\nAudit,Tools,"line 1\nline 2"'
      : '[\n  { "name": "WebDiag", "category": "SEO" },\n  { "name": "Audit", "category": "Tools" }\n]');
    setOutput("");
    setReport("");
    setError("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (direction === "csv-to-json") {
        const result = csvToJson(input, { delimiter, header });
        setOutput(result.output);
        setReport(csvToJsonReport(result, locale));
      } else {
        const selected = delimiter === "auto" ? "," : delimiter;
        const result = jsonToCsv(input, { delimiter: selected as CsvDelimiter, escapeFormulae });
        setOutput(result.output);
        setReport(jsonToCsvReport(result, locale));
      }
      setError("");
    } catch (caught) {
      setOutput("");
      setReport("");
      setError(caught instanceof Error ? caught.message : locale === "ru" ? "Не удалось обработать CSV." : "Unable to process CSV.");
    }
  }

  return <div className="tool-grid">
    <Panel title={locale === "ru" ? "CSV Data Workbench" : "CSV Data Workbench"}>
      <form onSubmit={submit}>
        <label className="field"><span>{locale === "ru" ? "Направление" : "Direction"}</span><select value={direction} onChange={(event: ChangeEvent<HTMLSelectElement>) => changeDirection(event.target.value as "csv-to-json" | "json-to-csv")}><option value="csv-to-json">CSV → JSON</option><option value="json-to-csv">JSON → CSV</option></select></label>
        <label className="field"><span>{locale === "ru" ? "Разделитель" : "Delimiter"}</span><select value={delimiter} onChange={(event: ChangeEvent<HTMLSelectElement>) => setDelimiter(event.target.value as CsvDelimiterOption)}>{direction === "csv-to-json" ? <option value="auto">Auto detect</option> : null}<option value=",">Comma (,)</option><option value=";">Semicolon (;)</option><option value="\t">Tab</option><option value="|">Pipe (|)</option></select></label>
        {direction === "csv-to-json" ? <label className="field checkbox-field"><input type="checkbox" checked={header} onChange={(event: ChangeEvent<HTMLInputElement>) => setHeader(event.target.checked)} /><span>{locale === "ru" ? "Первая строка — заголовок" : "First row is a header"}</span></label> : <label className="field checkbox-field"><input type="checkbox" checked={escapeFormulae} onChange={(event: ChangeEvent<HTMLInputElement>) => setEscapeFormulae(event.target.checked)} /><span>{locale === "ru" ? "Префиксовать formula-like значения апострофом" : "Prefix formula-like values with an apostrophe"}</span></label>}
        <label className="field"><span>{direction === "csv-to-json" ? "CSV" : "JSON"}</span><textarea className="code-input" rows={20} value={input} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setInput(event.target.value)} /></label>
        <button className="button" type="submit">{locale === "ru" ? "Проверить и преобразовать" : "Validate and convert"}</button>
        <ErrorMessage value={error} />
      </form>
    </Panel>
    <Panel title={locale === "ru" ? "Результат и диагностика" : "Result and diagnostics"}>
      <Output value={output || report} locale={locale} />
      {output && report ? <pre className="tool-muted">{report}</pre> : null}
      <p className="tool-muted">{locale === "ru"
        ? "Parser поддерживает quoted fields, escaped quotes, CRLF/LF и multiline quoted values. Formula-like поля только маркируются или опционально префиксуются; это не универсальная гарантия безопасности всех spreadsheet-приложений."
        : "The parser supports quoted fields, escaped quotes, CRLF/LF, and multiline quoted values. Formula-like fields are only flagged or optionally prefixed; this is not a universal security guarantee for every spreadsheet application."}</p>
    </Panel>
  </div>;
}
