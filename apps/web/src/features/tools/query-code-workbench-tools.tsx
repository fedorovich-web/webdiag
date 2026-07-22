"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { CopyButton } from "../../components/copy-button";
import {
  analyzeRegexRisk,
  formatGraphql,
  formatSql,
  validateRegexWorkerRequest,
  REGEX_WORKER_PATH,
  type FormatResult,
  type KeywordCase,
  type RegexRiskReport,
  type RegexWorkerMessage,
  type RegexWorkerResponse,
} from "./query-code-workbench";

function Panel({ title, children }: { readonly title: string; readonly children: React.ReactNode }) {
  return <section className="tool-panel"><h2>{title}</h2>{children}</section>;
}

function Output({ value, locale }: { readonly value: string; readonly locale: Locale }) {
  return <div className="output-wrap"><pre className="output" aria-live="polite">{value || "—"}</pre><CopyButton value={value} locale={locale} /></div>;
}

function ErrorMessage({ value }: { readonly value: string }) {
  return value ? <p className="form-error" role="alert">{value}</p> : null;
}

function formatReport(result: FormatResult, locale: Locale): string {
  return [
    `${locale === "ru" ? "Токенов" : "Tokens"}: ${result.tokenCount}`,
    `${locale === "ru" ? "Максимальная глубина" : "Maximum depth"}: ${result.maximumDepth}`,
    `${locale === "ru" ? "Предупреждения" : "Warnings"}: ${result.warnings.join(", ") || "none"}`,
  ].join("\n");
}

export function SqlFormatterTool({ locale }: { readonly locale: Locale }) {
  const [input, setInput] = useState("select u.id,u.email,count(o.id) order_count from users u left join orders o on o.user_id=u.id where u.active=true group by u.id,u.email order by order_count desc;");
  const [keywordCase, setKeywordCase] = useState<KeywordCase>("upper");
  const [indentSize, setIndentSize] = useState<2 | 4>(2);
  const [output, setOutput] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const result = formatSql(input, { keywordCase, indentSize });
      setOutput(result.output);
      setDetails(formatReport(result, locale));
      setError("");
    } catch (caught) {
      setOutput("");
      setDetails("");
      setError(caught instanceof Error ? caught.message : locale === "ru" ? "Не удалось отформатировать SQL." : "Unable to format SQL.");
    }
  }

  return <div className="tool-grid">
    <Panel title={locale === "ru" ? "SQL-запрос" : "SQL query"}>
      <form onSubmit={submit}>
        <div className="field-row">
          <label className="field"><span>{locale === "ru" ? "Регистр ключевых слов" : "Keyword case"}</span><select value={keywordCase} onChange={(event: ChangeEvent<HTMLSelectElement>) => setKeywordCase(event.target.value as KeywordCase)}><option value="upper">UPPER</option><option value="lower">lower</option><option value="preserve">Preserve</option></select></label>
          <label className="field"><span>{locale === "ru" ? "Отступ" : "Indentation"}</span><select value={indentSize} onChange={(event: ChangeEvent<HTMLSelectElement>) => setIndentSize(Number(event.target.value) as 2 | 4)}><option value={2}>2 spaces</option><option value={4}>4 spaces</option></select></label>
        </div>
        <label className="field"><span>SQL</span><textarea className="code-input" rows={20} value={input} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setInput(event.target.value)} spellCheck={false} /></label>
        <button className="button" type="submit">{locale === "ru" ? "Форматировать SQL" : "Format SQL"}</button>
        <ErrorMessage value={error} />
      </form>
    </Panel>
    <Panel title={locale === "ru" ? "Форматированный запрос" : "Formatted query"}>
      <Output value={output} locale={locale} />
      {details ? <pre className="tool-muted">{details}</pre> : null}
      <p className="tool-muted">{locale === "ru"
        ? "Консервативный tokenizer сохраняет строки, комментарии и quoted identifiers. Это formatter, а не полноценный parser конкретной СУБД: semantic validation и выполнение SQL не выполняются."
        : "The conservative tokenizer preserves strings, comments, and quoted identifiers. This is a formatter rather than a database-specific parser: it does not perform semantic validation or execute SQL."}</p>
    </Panel>
  </div>;
}

export function GraphqlFormatterTool({ locale }: { readonly locale: Locale }) {
  const [input, setInput] = useState("query Tool($slug:String!){tool(slug:$slug){slug title{ru en}description{ru en}}}");
  const [indentSize, setIndentSize] = useState<2 | 4>(2);
  const [output, setOutput] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const result = formatGraphql(input, { indentSize });
      setOutput(result.output);
      setDetails(formatReport(result, locale));
      setError("");
    } catch (caught) {
      setOutput("");
      setDetails("");
      setError(caught instanceof Error ? caught.message : locale === "ru" ? "Не удалось отформатировать GraphQL." : "Unable to format GraphQL.");
    }
  }

  return <div className="tool-grid">
    <Panel title={locale === "ru" ? "GraphQL-документ" : "GraphQL document"}>
      <form onSubmit={submit}>
        <label className="field"><span>{locale === "ru" ? "Отступ" : "Indentation"}</span><select value={indentSize} onChange={(event: ChangeEvent<HTMLSelectElement>) => setIndentSize(Number(event.target.value) as 2 | 4)}><option value={2}>2 spaces</option><option value={4}>4 spaces</option></select></label>
        <label className="field"><span>GraphQL</span><textarea className="code-input" rows={20} value={input} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setInput(event.target.value)} spellCheck={false} /></label>
        <button className="button" type="submit">{locale === "ru" ? "Форматировать GraphQL" : "Format GraphQL"}</button>
        <ErrorMessage value={error} />
      </form>
    </Panel>
    <Panel title={locale === "ru" ? "Форматированный документ" : "Formatted document"}>
      <Output value={output} locale={locale} />
      {details ? <pre className="tool-muted">{details}</pre> : null}
      <p className="tool-muted">{locale === "ru"
        ? "Formatter проверяет bounded lexical structure и баланс delimiters, сохраняет comments, strings и block strings. Проверка по GraphQL schema и выполнение операции не выполняются."
        : "The formatter checks bounded lexical structure and balanced delimiters while preserving comments, strings, and block strings. It does not validate against a GraphQL schema or execute the operation."}</p>
    </Panel>
  </div>;
}

function regexRiskReport(report: RegexRiskReport, locale: Locale): string {
  const lines = [`${locale === "ru" ? "Уровень review" : "Review level"}: ${report.level}`];
  if (!report.findings.length) lines.push(locale === "ru" ? "Эвристические риски не обнаружены." : "No heuristic risk signals were detected.");
  for (const finding of report.findings) lines.push(`[${finding.level}] ${finding.code}: ${finding.message}`);
  return lines.join("\n");
}

function regexMatchReport(result: Extract<RegexWorkerResponse, { readonly ok: true }>, locale: Locale): string {
  const lines = [
    `${locale === "ru" ? "Совпадений" : "Matches"}: ${result.matchCount}`,
    `${locale === "ru" ? "Результат ограничен" : "Result truncated"}: ${result.truncated ? "yes" : "no"}`,
    `${locale === "ru" ? "Время worker" : "Worker time"}: ${result.elapsedMilliseconds.toFixed(2)} ms`,
    "",
  ];
  result.matches.forEach((match, index) => {
    lines.push(`#${index + 1} [${match.index}, ${match.endIndex})`);
    lines.push(match.value || "<zero-length match>");
    if (match.captures.length) lines.push(`${locale === "ru" ? "Группы" : "Captures"}: ${JSON.stringify(match.captures)}`);
    if (Object.keys(match.namedCaptures).length) lines.push(`${locale === "ru" ? "Именованные группы" : "Named captures"}: ${JSON.stringify(match.namedCaptures)}`);
    if (match.indices) lines.push(`Indices: ${JSON.stringify(match.indices)}`);
    lines.push("");
  });
  return lines.join("\n").trim();
}

export function SafeRegexLabTool({ locale }: { readonly locale: Locale }) {
  const [pattern, setPattern] = useState("(?<protocol>https?):\\/\\/(?<host>[^\\s/]+)");
  const [flags, setFlags] = useState("giu");
  const [text, setText] = useState("WebDiag checks https://example.com and http://localhost.test/path.");
  const [timeoutMilliseconds, setTimeoutMilliseconds] = useState<100 | 250 | 500 | 1_000>(250);
  const [output, setOutput] = useState("");
  const [riskOutput, setRiskOutput] = useState("");
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanupWorker = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => {
    return cleanupWorker;
  }, [cleanupWorker]);

  function run(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    cleanupWorker();
    setOutput("");
    setError("");

    try {
      const risk = analyzeRegexRisk(pattern, flags);
      setRiskOutput(regexRiskReport(risk, locale));
      const request = validateRegexWorkerRequest({
        pattern,
        flags,
        text,
        maximumMatches: 500,
        maximumPreviewCharacters: 4_000,
      });
      if (typeof Worker === "undefined") throw new Error(locale === "ru" ? "Web Worker недоступен в этом браузере." : "Web Worker is unavailable in this browser.");

      const worker = new Worker(REGEX_WORKER_PATH, { name: "webdiag-regex-lab" });
      workerRef.current = worker;
      setRunning(true);

      worker.onmessage = (message: MessageEvent<RegexWorkerMessage>) => {
        if (message.data.kind === "ready") {
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            setError(locale === "ru"
              ? `Выполнение остановлено после ${timeoutMilliseconds} мс. Паттерн может быть слишком дорогим для этого текста.`
              : `Execution was stopped after ${timeoutMilliseconds} ms. The pattern may be too expensive for this input.`);
            setRunning(false);
            cleanupWorker();
          }, timeoutMilliseconds);
          worker.postMessage(request);
          return;
        }
        if (message.data.ok) setOutput(regexMatchReport(message.data, locale));
        else setError(message.data.error);
        setRunning(false);
        cleanupWorker();
      };
      worker.onerror = () => {
        setError(locale === "ru" ? "Regex worker завершился с ошибкой." : "The regex worker failed.");
        setRunning(false);
        cleanupWorker();
      };
      timerRef.current = setTimeout(() => {
        setError(locale === "ru" ? "Regex worker не успел запуститься." : "The regex worker did not start in time.");
        setRunning(false);
        cleanupWorker();
      }, 3_000);
    } catch (caught) {
      setRunning(false);
      setRiskOutput("");
      setError(caught instanceof Error ? caught.message : locale === "ru" ? "Не удалось выполнить регулярное выражение." : "Unable to run the regular expression.");
      cleanupWorker();
    }
  }

  return <div className="tool-grid">
    <Panel title={locale === "ru" ? "Паттерн и тестовый текст" : "Pattern and test text"}>
      <form onSubmit={run}>
        <label className="field"><span>{locale === "ru" ? "Паттерн без /разделителей/" : "Pattern without /delimiters/"}</span><input value={pattern} onChange={(event: ChangeEvent<HTMLInputElement>) => setPattern(event.target.value)} spellCheck={false} /></label>
        <div className="field-row">
          <label className="field"><span>{locale === "ru" ? "Флаги" : "Flags"}</span><input value={flags} onChange={(event: ChangeEvent<HTMLInputElement>) => setFlags(event.target.value)} spellCheck={false} /></label>
          <label className="field"><span>{locale === "ru" ? "Жёсткий timeout" : "Hard timeout"}</span><select value={timeoutMilliseconds} onChange={(event: ChangeEvent<HTMLSelectElement>) => setTimeoutMilliseconds(Number(event.target.value) as 100 | 250 | 500 | 1_000)}><option value={100}>100 ms</option><option value={250}>250 ms</option><option value={500}>500 ms</option><option value={1_000}>1000 ms</option></select></label>
        </div>
        <label className="field"><span>{locale === "ru" ? "Тестовый текст" : "Test text"}</span><textarea className="code-input" rows={16} value={text} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setText(event.target.value)} spellCheck={false} /></label>
        <button className="button" type="submit" disabled={running}>{running ? (locale === "ru" ? "Выполняется…" : "Running…") : (locale === "ru" ? "Запустить в изолированном worker" : "Run in isolated worker")}</button>
        <ErrorMessage value={error} />
      </form>
    </Panel>
    <Panel title={locale === "ru" ? "Результат и review рисков" : "Result and risk review"}>
      <Output value={output} locale={locale} />
      {riskOutput ? <pre className="tool-muted">{riskOutput}</pre> : null}
      <p className="tool-muted">{locale === "ru"
        ? "Выражение компилируется и выполняется только в отдельном Web Worker, который принудительно завершается по timeout. Эвристический risk review не является доказательством отсутствия ReDoS и не заменяет серверное тестирование целевого runtime."
        : "The expression is compiled and executed only inside a dedicated Web Worker that is forcibly terminated at the timeout. Heuristic risk review is not proof that a pattern is ReDoS-free and does not replace testing in the target server runtime."}</p>
    </Panel>
  </div>;
}
