"use client";

import { toolErrorMessage } from "./tool-error-presentation";

import { useState, type ReactNode } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { CopyButton } from "../../components/copy-button";
import { dictionary } from "../../lib/i18n";
import {
  compareTextLines,
  decodeHtmlEntities,
  encodeHtmlEntities,
  type DiffResult,
  type EntityNumericFormat,
} from "./text-encoding-diff-engine";

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="tool-panel"><h2>{title}</h2>{children}</section>;
}

function Output({ value, locale }: { value: string; locale: Locale }) {
  return <div className="output-wrap"><pre className="output" aria-live="polite">{value || "—"}</pre><CopyButton value={value} locale={locale} /></div>;
}

function ErrorMessage({ value }: { value: string }) {
  return value ? <p className="form-error" role="alert">{value}</p> : null;
}

function errorText(caught: unknown, locale: Locale): string {
  return toolErrorMessage(locale, caught, "invalid_input");
}

export function HtmlEntitiesConverterTool({ locale }: { locale: Locale }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [encodeQuotes, setEncodeQuotes] = useState(true);
  const [encodeNonAscii, setEncodeNonAscii] = useState(false);
  const [numericFormat, setNumericFormat] = useState<EntityNumericFormat>("decimal");

  function run(operation: "encode" | "decode"): void {
    try {
      const value = operation === "encode"
        ? encodeHtmlEntities(input, { encodeQuotes, encodeNonAscii, numericFormat })
        : decodeHtmlEntities(input);
      setOutput(value);
      setError("");
    } catch (caught) {
      setOutput("");
      setError(errorText(caught, locale));
    }
  }

  return <div className="tool-grid">
    <Panel title={dictionary[locale].input}>
      <label className="field"><span>{locale === "ru" ? "Текст или HTML-сущности" : "Text or HTML entities"}</span><textarea className="code-input" value={input} onChange={(event) => setInput(event.target.value)} rows={10} spellCheck={false} /></label>
      <label className="checkbox-row"><input type="checkbox" checked={encodeQuotes} onChange={(event) => setEncodeQuotes(event.target.checked)} /><span>{locale === "ru" ? "Кодировать кавычки" : "Encode quotation marks"}</span></label>
      <label className="checkbox-row"><input type="checkbox" checked={encodeNonAscii} onChange={(event) => setEncodeNonAscii(event.target.checked)} /><span>{locale === "ru" ? "Кодировать non-ASCII символы" : "Encode non-ASCII characters"}</span></label>
      <label className="field"><span>{locale === "ru" ? "Формат числовых сущностей" : "Numeric entity format"}</span><select value={numericFormat} onChange={(event) => setNumericFormat(event.target.value as EntityNumericFormat)} disabled={!encodeNonAscii}><option value="decimal">{locale === "ru" ? "Десятичный" : "Decimal"}</option><option value="hexadecimal">{locale === "ru" ? "Шестнадцатеричный" : "Hexadecimal"}</option></select></label>
      <div className="button-row"><button className="button" type="button" onClick={() => run("encode")}>{locale === "ru" ? "Кодировать" : "Encode"}</button><button className="button button-secondary" type="button" onClick={() => run("decode")}>{locale === "ru" ? "Декодировать" : "Decode"}</button></div>
      <p className="help-text">{locale === "ru" ? "Декодирование требует завершающую точку с запятой и не выполняет полученную HTML-разметку." : "Decoding requires a terminating semicolon and never executes the resulting HTML markup."}</p>
      <ErrorMessage value={error} />
    </Panel>
    <Panel title={dictionary[locale].result}><Output value={output} locale={locale} /></Panel>
  </div>;
}

export function DiffCheckerTool({ locale }: { locale: Locale }) {
  const [original, setOriginal] = useState("");
  const [changed, setChanged] = useState("");
  const [ignoreTrailingWhitespace, setIgnoreTrailingWhitespace] = useState(false);
  const [result, setResult] = useState<DiffResult | null>(null);
  const [error, setError] = useState("");

  function compare(): void {
    try {
      setResult(compareTextLines(original, changed, { ignoreTrailingWhitespace }));
      setError("");
    } catch (caught) {
      setResult(null);
      setError(errorText(caught, locale));
    }
  }

  return <div className="tool-grid">
    <Panel title={dictionary[locale].input}>
      <label className="field"><span>{locale === "ru" ? "Исходный текст" : "Original text"}</span><textarea className="code-input" value={original} onChange={(event) => setOriginal(event.target.value)} rows={9} spellCheck={false} /></label>
      <label className="field"><span>{locale === "ru" ? "Изменённый текст" : "Changed text"}</span><textarea className="code-input" value={changed} onChange={(event) => setChanged(event.target.value)} rows={9} spellCheck={false} /></label>
      <label className="checkbox-row"><input type="checkbox" checked={ignoreTrailingWhitespace} onChange={(event) => setIgnoreTrailingWhitespace(event.target.checked)} /><span>{locale === "ru" ? "Игнорировать пробелы в конце строк" : "Ignore trailing whitespace"}</span></label>
      <button className="button" type="button" onClick={compare}>{locale === "ru" ? "Сравнить строки" : "Compare lines"}</button>
      <p className="help-text">{locale === "ru" ? "Сравнение выполняется построчно, нормализует CRLF/CR в LF и не применяет полученный patch." : "The comparison is line-based, normalizes CRLF/CR to LF, and never applies the generated patch."}</p>
      <ErrorMessage value={error} />
    </Panel>
    <Panel title={dictionary[locale].result}>
      <Output value={result?.unifiedDiff ?? ""} locale={locale} />
      {result ? <ul className="result-list" aria-label={locale === "ru" ? "Сводка изменений" : "Change summary"}>
        <li>{locale === "ru" ? "Добавлено строк" : "Added lines"}: <strong>{result.summary.additions}</strong></li>
        <li>{locale === "ru" ? "Удалено строк" : "Deleted lines"}: <strong>{result.summary.deletions}</strong></li>
        <li>{locale === "ru" ? "Без изменений" : "Unchanged lines"}: <strong>{result.summary.unchanged}</strong></li>
        <li>{locale === "ru" ? "Групп замен" : "Replacement groups"}: <strong>{result.summary.replacementGroups}</strong></li>
      </ul> : null}
    </Panel>
  </div>;
}
