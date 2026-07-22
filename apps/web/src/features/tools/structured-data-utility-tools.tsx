"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { CopyButton } from "../../components/copy-button";
import {
  jsonToYaml,
  validateAndFormatXml,
  validateJsonSchema,
  yamlToJson,
  type JsonSchemaValidationResult,
  type XmlFormatResult,
} from "./structured-data-utilities";

function Panel({ title, children }: { readonly title: string; readonly children: React.ReactNode }) {
  return <section className="tool-panel"><h2>{title}</h2>{children}</section>;
}

function Output({ value, locale }: { readonly value: string; readonly locale: Locale }) {
  return <div className="output-wrap"><pre className="output" aria-live="polite">{value || "—"}</pre><CopyButton value={value} locale={locale} /></div>;
}

function ErrorMessage({ value }: { readonly value: string }) {
  return value ? <p className="form-error" role="alert">{value}</p> : null;
}

function schemaReport(result: JsonSchemaValidationResult, locale: Locale): string {
  const lines = [
    `${locale === "ru" ? "Результат" : "Result"}: ${result.valid ? "valid" : "invalid"}`,
    `${locale === "ru" ? "Узлов instance" : "Instance nodes"}: ${result.instanceNodeCount}`,
    `${locale === "ru" ? "Узлов schema" : "Schema nodes"}: ${result.schemaNodeCount}`,
    `${locale === "ru" ? "Ошибок instance" : "Instance errors"}: ${result.errors.length}`,
    `${locale === "ru" ? "Ошибок schema" : "Schema errors"}: ${result.schemaErrors.length}`,
  ];
  if (result.unsupportedKeywords.length) lines.push(`${locale === "ru" ? "Неподдерживаемые keywords" : "Unsupported keywords"}: ${result.unsupportedKeywords.join(", ")}`);
  for (const issue of [...result.schemaErrors, ...result.errors]) lines.push(`${issue.path || "/"} [${issue.keyword}] ${issue.message}`);
  if (result.truncated) lines.push(locale === "ru" ? "Список ошибок ограничен." : "The error list was truncated.");
  return lines.join("\n");
}

export function JsonSchemaValidatorTool({ locale }: { readonly locale: Locale }) {
  const [instance, setInstance] = useState('{\n  "name": "WebDiag",\n  "active": true\n}');
  const [schema, setSchema] = useState('{\n  "$schema": "https://json-schema.org/draft/2020-12/schema",\n  "type": "object",\n  "required": ["name"],\n  "properties": {\n    "name": { "type": "string", "minLength": 1 },\n    "active": { "type": "boolean" }\n  },\n  "additionalProperties": false\n}');
  const [result, setResult] = useState<JsonSchemaValidationResult | null>(null);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setResult(validateJsonSchema(instance, schema));
      setError("");
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : locale === "ru" ? "Не удалось проверить JSON." : "Unable to validate JSON.");
    }
  }

  const report = result ? schemaReport(result, locale) : "";
  return <div className="tool-grid">
    <Panel title={locale === "ru" ? "Instance и schema" : "Instance and schema"}>
      <form onSubmit={submit}>
        <label className="field"><span>JSON instance</span><textarea className="code-input" rows={12} value={instance} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setInstance(event.target.value)} /></label>
        <label className="field"><span>JSON Schema</span><textarea className="code-input" rows={16} value={schema} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setSchema(event.target.value)} /></label>
        <button className="button" type="submit">{locale === "ru" ? "Проверить по schema" : "Validate against schema"}</button>
        <ErrorMessage value={error} />
      </form>
    </Panel>
    <Panel title={locale === "ru" ? "Результат проверки" : "Validation result"}>
      {result ? <>
        <p className="calculated-value">{result.valid ? (locale === "ru" ? "Данные соответствуют поддерживаемому subset" : "Data matches the supported subset") : (locale === "ru" ? "Обнаружены несоответствия" : "Validation issues found")}</p>
        <div className="metric-grid">
          <div><strong>{result.errors.length}</strong><span>{locale === "ru" ? "ошибок instance" : "instance errors"}</span></div>
          <div><strong>{result.schemaErrors.length}</strong><span>{locale === "ru" ? "ошибок schema" : "schema errors"}</span></div>
          <div><strong>{result.unsupportedKeywords.length}</strong><span>{locale === "ru" ? "неподдерживаемых keywords" : "unsupported keywords"}</span></div>
        </div>
        <Output value={report} locale={locale} />
        <p className="tool-muted">{locale === "ru"
          ? "Это bounded subset JSON Schema 2020-12, а не полная meta-schema реализация. Remote $ref, dynamic references и unevaluated keywords не выполняются."
          : "This is a bounded JSON Schema 2020-12 subset, not a complete meta-schema implementation. Remote $ref, dynamic references, and unevaluated keywords are not executed."}</p>
      </> : <p className="tool-muted">{locale === "ru" ? "Запустите проверку, чтобы получить отчёт." : "Run validation to produce a report."}</p>}
    </Panel>
  </div>;
}

export function YamlJsonConverterTool({ locale }: { readonly locale: Locale }) {
  const [direction, setDirection] = useState<"yaml-to-json" | "json-to-yaml">("yaml-to-json");
  const [input, setInput] = useState("name: WebDiag\nfeatures:\n  - DNS\n  - RDAP\nenabled: true");
  const [output, setOutput] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const result = direction === "yaml-to-json" ? yamlToJson(input) : jsonToYaml(input);
      setOutput(result.output);
      setDetails(`${locale === "ru" ? "Узлов" : "Nodes"}: ${result.nodeCount}\n${locale === "ru" ? "Режим" : "Mode"}: ${result.warnings.join(", ")}`);
      setError("");
    } catch (caught) {
      setOutput("");
      setDetails("");
      setError(caught instanceof Error ? caught.message : locale === "ru" ? "Не удалось преобразовать данные." : "Unable to convert the data.");
    }
  }

  function changeDirection(value: "yaml-to-json" | "json-to-yaml") {
    setDirection(value);
    setOutput("");
    setDetails("");
    setError("");
    setInput(value === "yaml-to-json" ? "name: WebDiag\nfeatures:\n  - DNS\n  - RDAP\nenabled: true" : '{\n  "name": "WebDiag",\n  "features": ["DNS", "RDAP"],\n  "enabled": true\n}');
  }

  return <div className="tool-grid">
    <Panel title={locale === "ru" ? "Входные данные" : "Input data"}>
      <form onSubmit={submit}>
        <label className="field"><span>{locale === "ru" ? "Направление" : "Direction"}</span><select value={direction} onChange={(event: ChangeEvent<HTMLSelectElement>) => changeDirection(event.target.value as "yaml-to-json" | "json-to-yaml")}><option value="yaml-to-json">YAML → JSON</option><option value="json-to-yaml">JSON → YAML</option></select></label>
        <label className="field"><span>{direction === "yaml-to-json" ? "YAML" : "JSON"}</span><textarea className="code-input" rows={18} value={input} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setInput(event.target.value)} /></label>
        <button className="button" type="submit">{locale === "ru" ? "Преобразовать" : "Convert"}</button>
        <ErrorMessage value={error} />
      </form>
    </Panel>
    <Panel title={locale === "ru" ? "Результат" : "Result"}>
      <Output value={output} locale={locale} />
      {details ? <pre className="tool-muted">{details}</pre> : null}
      <p className="tool-muted">{locale === "ru"
        ? "YAML parser поддерживает безопасный configuration subset: mappings, sequences, quoted/plain scalars и JSON-style inline collections. Anchors, aliases, custom tags, merge keys и block scalars отклоняются."
        : "The YAML parser supports a safe configuration subset: mappings, sequences, quoted/plain scalars, and JSON-style inline collections. Anchors, aliases, custom tags, merge keys, and block scalars are rejected."}</p>
    </Panel>
  </div>;
}

function xmlReport(result: XmlFormatResult, locale: Locale): string {
  const lines = [
    `${locale === "ru" ? "Результат" : "Result"}: ${result.valid ? "well-formed" : "invalid"}`,
    `${locale === "ru" ? "Элементов" : "Elements"}: ${result.elementCount}`,
    `${locale === "ru" ? "Атрибутов" : "Attributes"}: ${result.attributeCount}`,
    `${locale === "ru" ? "Максимальная глубина" : "Maximum depth"}: ${result.maximumDepth}`,
  ];
  if (result.warnings.length) lines.push(`${locale === "ru" ? "Предупреждения" : "Warnings"}: ${result.warnings.join(", ")}`);
  for (const issue of result.errors) lines.push(`${issue.path || "/"} [${issue.keyword}] ${issue.message}`);
  return lines.join("\n");
}

export function XmlFormatterValidatorTool({ locale }: { readonly locale: Locale }) {
  const [input, setInput] = useState('<?xml version="1.0"?>\n<catalog><item id="1"><name>WebDiag</name></item></catalog>');
  const [indentation, setIndentation] = useState<2 | 4>(2);
  const [result, setResult] = useState<XmlFormatResult | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(validateAndFormatXml(input, indentation));
  }

  return <div className="tool-grid">
    <Panel title={locale === "ru" ? "XML документ" : "XML document"}>
      <form onSubmit={submit}>
        <label className="field"><span>{locale === "ru" ? "Отступ" : "Indentation"}</span><select value={indentation} onChange={(event: ChangeEvent<HTMLSelectElement>) => setIndentation(Number(event.target.value) as 2 | 4)}><option value={2}>2 spaces</option><option value={4}>4 spaces</option></select></label>
        <label className="field"><span>XML</span><textarea className="code-input" rows={20} value={input} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setInput(event.target.value)} /></label>
        <button className="button" type="submit">{locale === "ru" ? "Проверить и форматировать" : "Validate and format"}</button>
      </form>
    </Panel>
    <Panel title={locale === "ru" ? "Результат" : "Result"}>
      {result ? <>
        <p className="calculated-value">{result.valid ? (locale === "ru" ? "XML well-formed в поддерживаемом parser" : "XML is well-formed in the supported parser") : (locale === "ru" ? "XML содержит ошибки" : "XML contains errors")}</p>
        <Output value={result.valid ? result.formatted : xmlReport(result, locale)} locale={locale} />
        {result.valid ? <pre className="tool-muted">{xmlReport(result, locale)}</pre> : null}
        <p className="tool-muted">{locale === "ru"
          ? "DTD и ENTITY declarations отключены. XSD, namespaces semantics и external entity resolution не выполняются. Mixed content сохраняется компактно, чтобы formatter не добавлял значащие пробелы."
          : "DTD and ENTITY declarations are disabled. XSD, namespace semantics, and external entity resolution are not performed. Mixed content is kept compact so formatting does not inject significant whitespace."}</p>
      </> : <p className="tool-muted">{locale === "ru" ? "Запустите проверку XML." : "Run the XML validation."}</p>}
    </Panel>
  </div>;
}
