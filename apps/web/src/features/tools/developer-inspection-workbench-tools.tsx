"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { CopyButton } from "../../components/copy-button";
import {
  buildCronExpression,
  createCronPreviewRequest,
  inspectJwt,
  parseCronExpression,
  CRON_PREVIEW_WORKER_PATH,
  type CronBuilderFields,
  type CronPreviewMessage,
  type JwtInspectionResult,
  type JwtTemporalClaim,
  type JwtWarning,
  type ParsedCronExpression,
} from "./developer-inspection-workbench";

function Panel({ title, children }: { readonly title: string; readonly children: React.ReactNode }) {
  return <section className="tool-panel"><h2>{title}</h2>{children}</section>;
}

function ErrorMessage({ value }: { readonly value: string }) {
  return value ? <p className="form-error" role="alert">{value}</p> : null;
}

const errorMessages: Readonly<Record<string, { readonly ru: string; readonly en: string }>> = {
  empty_cron_expression: { ru: "Введите cron-выражение.", en: "Enter a cron expression." },
  cron_expression_too_long: { ru: "Cron-выражение превышает лимит 256 символов.", en: "The cron expression exceeds the 256-character limit." },
  invalid_cron_field_count: { ru: "Ожидается ровно 5 полей: минута, час, день месяца, месяц и день недели.", en: "Exactly five fields are required: minute, hour, day of month, month, and day of week." },
  empty_cron_field: { ru: "Одно из cron-полей пустое.", en: "One of the cron fields is empty." },
  empty_cron_list_part: { ru: "Список cron содержит пустой элемент.", en: "The cron list contains an empty item." },
  unsupported_cron_syntax: { ru: "Синтаксис не входит в поддерживаемый 5-польный Unix cron dialect.", en: "The syntax is outside the supported five-field Unix cron dialect." },
  invalid_cron_value: { ru: "Cron-поле содержит некорректное значение.", en: "A cron field contains an invalid value." },
  cron_value_out_of_range: { ru: "Значение cron-поля выходит за допустимый диапазон.", en: "A cron field value is outside its allowed range." },
  invalid_cron_step: { ru: "Шаг cron должен быть положительным целым числом.", en: "A cron step must be a positive integer." },
  cron_step_out_of_range: { ru: "Шаг cron превышает размер допустимого диапазона поля.", en: "The cron step exceeds the field's allowed range size." },
  reversed_cron_range: { ru: "Начало cron-диапазона не может быть больше конца.", en: "A cron range cannot start after it ends." },
  cron_step_requires_wildcard_or_range: { ru: "Шаг можно применять только к * или диапазону.", en: "A step can only be applied to * or a range." },
  cron_expansion_limit: { ru: "Cron-поле содержит слишком много элементов.", en: "The cron field contains too many items." },
  invalid_preview_start: { ru: "Некорректная начальная дата preview.", en: "The preview start date is invalid." },
  invalid_preview_occurrence_limit: { ru: "Можно запросить от 1 до 10 запусков.", en: "You can request between 1 and 10 occurrences." },
  invalid_preview_horizon: { ru: "Горизонт preview должен быть от 1 до 366 дней.", en: "The preview horizon must be between 1 and 366 days." },
  empty_jwt: { ru: "Введите JWT.", en: "Enter a JWT." },
  jwt_too_large: { ru: "JWT превышает лимит 64 KiB.", en: "The JWT exceeds the 64 KiB limit." },
  encrypted_jwe_unsupported: { ru: "Зашифрованный пятисегментный JWE не поддерживается.", en: "Encrypted five-segment JWE tokens are not supported." },
  invalid_jwt_segment_count: { ru: "Ожидается compact JWT/JWS из трёх сегментов.", en: "A three-segment compact JWT/JWS is required." },
  empty_jwt_segment: { ru: "Header и payload JWT не могут быть пустыми.", en: "JWT header and payload segments cannot be empty." },
  invalid_base64url: { ru: "Header или payload содержит некорректный Base64URL.", en: "The header or payload contains invalid Base64URL." },
  invalid_base64url_signature: { ru: "Signature segment содержит некорректный Base64URL.", en: "The signature segment contains invalid Base64URL." },
  invalid_utf8: { ru: "Декодированный сегмент не является корректным UTF-8.", en: "A decoded segment is not valid UTF-8." },
  invalid_jwt_json: { ru: "Header или payload не является корректным JSON.", en: "The header or payload is not valid JSON." },
  non_object_jwt_header: { ru: "JWT header должен быть JSON-объектом.", en: "The JWT header must be a JSON object." },
  non_object_jwt_payload: { ru: "JWT payload должен быть JSON-объектом.", en: "The JWT payload must be a JSON object." },
  jwt_json_node_limit: { ru: "JSON JWT превышает лимит 5 000 узлов.", en: "JWT JSON exceeds the 5,000-node limit." },
  jwt_json_depth_limit: { ru: "JSON JWT превышает глубину 64.", en: "JWT JSON exceeds the depth limit of 64." },
  invalid_current_time: { ru: "Не удалось определить время браузера.", en: "The browser clock could not be read." },
  invalid_clock_skew: { ru: "Clock skew должен быть от 0 до 3 600 секунд.", en: "Clock skew must be between 0 and 3,600 seconds." },
};

function localError(caught: unknown, locale: Locale, fallback: { readonly ru: string; readonly en: string }): string {
  const code = caught instanceof Error ? caught.message : "";
  return errorMessages[code]?.[locale] ?? fallback[locale];
}

function cronFieldLabel(name: keyof CronBuilderFields, locale: Locale): string {
  const labels = {
    minute: { ru: "Минута", en: "Minute" },
    hour: { ru: "Час", en: "Hour" },
    dayOfMonth: { ru: "День месяца", en: "Day of month" },
    month: { ru: "Месяц", en: "Month" },
    dayOfWeek: { ru: "День недели", en: "Day of week" },
  } as const;
  return labels[name][locale];
}

function formatCronExplanation(parsed: ParsedCronExpression, locale: Locale): string {
  const lines = [
    locale === "ru" ? "Dialect: 5-польный Unix cron" : "Dialect: five-field Unix cron",
    locale === "ru" ? "Время preview: UTC" : "Preview time: UTC",
    "",
  ];
  for (const name of ["minute", "hour", "dayOfMonth", "month", "dayOfWeek"] as const) {
    const field = parsed.fields[name];
    const values = field.values.join(", ");
    lines.push(`${cronFieldLabel(name, locale)}: ${field.normalized}`);
    lines.push(`${locale === "ru" ? "Значения" : "Values"}: ${values}`);
  }
  lines.push("");
  lines.push(locale === "ru"
    ? "Если и день месяца, и день недели ограничены, используется Vixie-style OR semantics."
    : "When both day-of-month and day-of-week are restricted, Vixie-style OR semantics are used.");
  return lines.join("\n");
}

const defaultCronFields: CronBuilderFields = {
  minute: "*/15",
  hour: "9-17",
  dayOfMonth: "*",
  month: "*",
  dayOfWeek: "MON-FRI",
};

export function CronExpressionWorkbenchTool({ locale }: { readonly locale: Locale }) {
  const [expression, setExpression] = useState("*/15 9-17 * * MON-FRI");
  const [builder, setBuilder] = useState<CronBuilderFields>(defaultCronFields);
  const [parsed, setParsed] = useState<ParsedCronExpression | null>(null);
  const [occurrences, setOccurrences] = useState<readonly string[]>([]);
  const [checkedMinutes, setCheckedMinutes] = useState(0);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const cleanupWorker = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => cleanupWorker, [cleanupWorker]);

  const runPreview = useCallback((nextParsed: ParsedCronExpression) => {
    cleanupWorker();
    setOccurrences([]);
    setCheckedMinutes(0);
    setRunning(true);
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    const request = createCronPreviewRequest(nextParsed, {
      requestId,
      fromTimestamp: Date.now(),
      maximumOccurrences: 10,
      horizonDays: 366,
    });
    const worker = new Worker(CRON_PREVIEW_WORKER_PATH);
    workerRef.current = worker;
    worker.onmessage = (message: MessageEvent<CronPreviewMessage>) => {
      if (message.data.kind === "ready") {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setError(locale === "ru" ? "Preview остановлен после 1 000 мс." : "Preview was stopped after 1,000 ms.");
          setRunning(false);
          cleanupWorker();
        }, 1_000);
        worker.postMessage(request);
        return;
      }
      if (message.data.requestId !== requestIdRef.current) return;
      if (message.data.ok) {
        setOccurrences(message.data.occurrences);
        setCheckedMinutes(message.data.checkedMinutes);
        if (!message.data.occurrences.length) {
          setError(locale === "ru"
            ? "В пределах 366 дней подходящих запусков не найдено."
            : "No matching occurrences were found within 366 days.");
        }
      } else {
        setError(locale === "ru" ? "Cron preview завершился с ошибкой." : "Cron preview failed.");
      }
      setRunning(false);
      cleanupWorker();
    };
    worker.onerror = () => {
      setError(locale === "ru" ? "Cron preview worker завершился с ошибкой." : "The cron preview worker failed.");
      setRunning(false);
      cleanupWorker();
    };
    timerRef.current = setTimeout(() => {
      setError(locale === "ru" ? "Cron preview worker не успел запуститься." : "The cron preview worker did not start in time.");
      setRunning(false);
      cleanupWorker();
    }, 3_000);
  }, [cleanupWorker, locale]);

  function inspect(nextExpression: string) {
    try {
      const nextParsed = parseCronExpression(nextExpression);
      setExpression(nextParsed.expression);
      setParsed(nextParsed);
      setError("");
      runPreview(nextParsed);
    } catch (caught) {
      setParsed(null);
      setOccurrences([]);
      setRunning(false);
      cleanupWorker();
      setError(localError(caught, locale, { ru: "Не удалось проверить cron-выражение.", en: "Unable to inspect the cron expression." }));
    }
  }

  function submitExpression(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    inspect(expression);
  }

  function submitBuilder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const nextParsed = buildCronExpression(builder);
      setExpression(nextParsed.expression);
      setParsed(nextParsed);
      setError("");
      runPreview(nextParsed);
    } catch (caught) {
      setParsed(null);
      setOccurrences([]);
      setRunning(false);
      cleanupWorker();
      setError(localError(caught, locale, { ru: "Не удалось собрать cron-выражение.", en: "Unable to build the cron expression." }));
    }
  }

  function reset() {
    cleanupWorker();
    setExpression("*/15 9-17 * * MON-FRI");
    setBuilder(defaultCronFields);
    setParsed(null);
    setOccurrences([]);
    setCheckedMinutes(0);
    setError("");
    setRunning(false);
  }

  return <div className="tool-grid">
    <Panel title={locale === "ru" ? "Собрать или проверить cron" : "Build or inspect cron"}>
      <form onSubmit={submitBuilder}>
        <div className="result-grid">
          {(Object.keys(defaultCronFields) as Array<keyof CronBuilderFields>).map((name) => <label className="field" key={name}>
            <span>{cronFieldLabel(name, locale)}</span>
            <input value={builder[name]} onChange={(event: ChangeEvent<HTMLInputElement>) => setBuilder((current) => ({ ...current, [name]: event.target.value }))} spellCheck={false} />
          </label>)}
        </div>
        <button className="button" type="submit" disabled={running}>{locale === "ru" ? "Собрать и проверить" : "Build and inspect"}</button>
      </form>
      <form onSubmit={submitExpression}>
        <label className="field"><span>{locale === "ru" ? "5-польное выражение" : "Five-field expression"}</span><input value={expression} onChange={(event: ChangeEvent<HTMLInputElement>) => setExpression(event.target.value)} spellCheck={false} /></label>
        <div className="field-row">
          <button className="button" type="submit" disabled={running}>{running ? (locale === "ru" ? "Вычисляется…" : "Calculating…") : (locale === "ru" ? "Проверить и показать запуски" : "Inspect and preview")}</button>
          <button className="button button-secondary" type="button" onClick={reset}>{locale === "ru" ? "Сбросить" : "Reset"}</button>
        </div>
        <ErrorMessage value={error} />
      </form>
      <p className="tool-note">{locale === "ru"
        ? "Поддерживается только 5-польный Unix cron. Quartz tokens (?, L, W, #), seconds, year, macros и выполнение scheduler не поддерживаются."
        : "Only five-field Unix cron is supported. Quartz tokens (?, L, W, #), seconds, year, macros, and scheduler execution are not supported."}</p>
    </Panel>
    <Panel title={locale === "ru" ? "Объяснение и следующие запуски" : "Explanation and next occurrences"}>
      <div className="output-wrap"><pre className="output" aria-live="polite">{parsed ? formatCronExplanation(parsed, locale) : "—"}</pre><CopyButton value={parsed?.expression ?? ""} locale={locale} /></div>
      {occurrences.length ? <ol className="result-list" aria-label={locale === "ru" ? "Следующие запуски UTC" : "Next UTC occurrences"}>{occurrences.map((value) => <li key={value}><code>{value}</code></li>)}</ol> : null}
      {parsed ? <p className="tool-muted">{locale === "ru"
        ? `Проверено минут: ${checkedMinutes.toLocaleString("ru-RU")}. Preview начинается после текущей минуты браузера и ограничен 10 результатами, 366 днями и hard timeout.`
        : `Minutes checked: ${checkedMinutes.toLocaleString("en-US")}. Preview starts after the browser's current minute and is limited to 10 results, 366 days, and a hard timeout.`}</p> : null}
    </Panel>
  </div>;
}

const warningText: Readonly<Record<string, { readonly ru: string; readonly en: string }>> = {
  decode_does_not_verify_signature: { ru: "Декодирование не подтверждает подпись, отправителя или допустимость токена.", en: "Decoding does not verify the signature, issuer, or acceptability of the token." },
  missing_alg: { ru: "В header отсутствует alg.", en: "The header has no alg value." },
  invalid_alg: { ru: "alg должен быть непустой строкой.", en: "alg must be a non-empty string." },
  alg_none: { ru: "alg=none отключает криптографическую подпись и требует критической проверки принимающей стороны.", en: "alg=none disables cryptographic signing and requires critical review of the accepting system." },
  unknown_alg: { ru: "Алгоритм не входит в распознаваемый набор JWS algorithms.", en: "The algorithm is outside the recognized JWS algorithm set." },
  symmetric_algorithm_requires_shared_secret: { ru: "HMAC-алгоритм требует корректного shared-secret verification flow.", en: "An HMAC algorithm requires a correct shared-secret verification flow." },
  empty_signature: { ru: "Signature segment пуст.", en: "The signature segment is empty." },
  invalid_typ: { ru: "typ должен быть строкой.", en: "typ must be a string." },
  invalid_kid: { ru: "kid должен быть строкой; инструмент не получает ключ по этому значению.", en: "kid must be a string; the tool does not fetch a key from it." },
  invalid_exp: { ru: "exp должен быть конечным NumericDate.", en: "exp must be a finite NumericDate." },
  invalid_nbf: { ru: "nbf должен быть конечным NumericDate.", en: "nbf must be a finite NumericDate." },
  invalid_iat: { ru: "iat должен быть конечным NumericDate.", en: "iat must be a finite NumericDate." },
  token_expired_by_browser_clock: { ru: "По часам браузера exp уже истёк.", en: "According to the browser clock, exp has passed." },
  token_not_yet_valid_by_browser_clock: { ru: "По часам браузера nbf ещё не наступил.", en: "According to the browser clock, nbf has not been reached." },
  issued_at_in_future_by_browser_clock: { ru: "По часам браузера iat находится в будущем.", en: "According to the browser clock, iat is in the future." },
  invalid_aud: { ru: "aud должен быть непустой строкой или массивом непустых строк.", en: "aud must be a non-empty string or an array of non-empty strings." },
  invalid_iss: { ru: "iss должен быть строкой.", en: "iss must be a string." },
  invalid_sub: { ru: "sub должен быть строкой.", en: "sub must be a string." },
  invalid_jti: { ru: "jti должен быть строкой.", en: "jti must be a string." },
};

function WarningList({ warnings, locale }: { readonly warnings: readonly JwtWarning[]; readonly locale: Locale }) {
  return <ul className="metadata-tool-checks">{warnings.map((item, index) => <li className={item.severity === "critical" ? "is-fail" : item.severity === "warning" ? "is-warning" : "is-pass"} key={`${item.code}-${index}`}>
    <div><strong>{item.severity.toUpperCase()}</strong><span>{item.code}</span></div>
    <p>{warningText[item.code]?.[locale] ?? item.code}</p>
  </li>)}</ul>;
}

function TemporalClaims({ claims, locale }: { readonly claims: readonly JwtTemporalClaim[]; readonly locale: Locale }) {
  if (!claims.length) return <p className="tool-muted">{locale === "ru" ? "Claims exp, nbf и iat отсутствуют." : "No exp, nbf, or iat claims are present."}</p>;
  return <div className="result-grid">{claims.map((claim) => <article className="result-card" key={claim.claim}>
    <h3>{claim.claim}</h3>
    <p><strong>{claim.status}</strong></p>
    <p>{claim.iso ?? (locale === "ru" ? "Некорректный NumericDate" : "Invalid NumericDate")}</p>
  </article>)}</div>;
}

function JwtResult({ result, locale }: { readonly result: JwtInspectionResult; readonly locale: Locale }) {
  const header = JSON.stringify(result.header, null, 2);
  const payload = JSON.stringify(result.payload, null, 2);
  return <>
    <div className="result-grid">
      <article className="result-card"><h3>Header</h3><div className="output-wrap"><pre className="output">{header}</pre><CopyButton value={header} locale={locale} /></div></article>
      <article className="result-card"><h3>Payload</h3><div className="output-wrap"><pre className="output">{payload}</pre><CopyButton value={payload} locale={locale} /></div></article>
    </div>
    <dl className="result-meta">
      <div><dt>{locale === "ru" ? "Подпись" : "Signature"}</dt><dd>{result.signaturePresent ? (locale === "ru" ? "сегмент присутствует" : "segment present") : (locale === "ru" ? "сегмент пуст" : "segment empty")}</dd></div>
      <div><dt>{locale === "ru" ? "Длины сегментов" : "Segment lengths"}</dt><dd>{result.encodedHeaderLength} / {result.encodedPayloadLength} / {result.encodedSignatureLength}</dd></div>
    </dl>
    <TemporalClaims claims={result.temporalClaims} locale={locale} />
    <WarningList warnings={result.warnings} locale={locale} />
  </>;
}

const sampleJwt = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2V4YW1wbGUuY29tIiwic3ViIjoidXNlci0xMjMiLCJhdWQiOiJ3ZWJkaWFnIiwiZXhwIjoyMDUwMDAwMDAwLCJpYXQiOjE3MDAwMDAwMDB9.c2lnbmF0dXJl";

export function JwtInspectionLabTool({ locale }: { readonly locale: Locale }) {
  const [token, setToken] = useState(sampleJwt);
  const [clockSkewSeconds, setClockSkewSeconds] = useState<0 | 30 | 60 | 300>(0);
  const [result, setResult] = useState<JwtInspectionResult | null>(null);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setResult(inspectJwt(token, { clockSkewSeconds }));
      setError("");
    } catch (caught) {
      setResult(null);
      setError(localError(caught, locale, { ru: "Не удалось декодировать JWT.", en: "Unable to decode the JWT." }));
    }
  }

  function reset() {
    setToken("");
    setResult(null);
    setError("");
    setClockSkewSeconds(0);
  }

  return <div className="tool-grid">
    <Panel title={locale === "ru" ? "JWT для локальной проверки" : "JWT for local inspection"}>
      <form onSubmit={submit}>
        <label className="field"><span>Compact JWT/JWS</span><textarea className="code-input" rows={14} value={token} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setToken(event.target.value)} spellCheck={false} autoComplete="off" /></label>
        <label className="field"><span>{locale === "ru" ? "Допуск часов" : "Clock skew allowance"}</span><select value={clockSkewSeconds} onChange={(event: ChangeEvent<HTMLSelectElement>) => setClockSkewSeconds(Number(event.target.value) as 0 | 30 | 60 | 300)}><option value={0}>0 s</option><option value={30}>30 s</option><option value={60}>60 s</option><option value={300}>300 s</option></select></label>
        <div className="field-row">
          <button className="button" type="submit">{locale === "ru" ? "Декодировать и проверить claims" : "Decode and inspect claims"}</button>
          <button className="button button-secondary" type="button" onClick={reset}>{locale === "ru" ? "Очистить" : "Clear"}</button>
        </div>
        <ErrorMessage value={error} />
      </form>
      <p className="tool-note">{locale === "ru"
        ? "Токен обрабатывается только в браузере, не сохраняется и не отправляется на сервер. Инструмент не проверяет подпись и не получает JWKS. Не используйте декодированный результат как доказательство подлинности."
        : "The token is processed only in the browser, is not stored, and is not sent to a server. The tool does not verify signatures or fetch JWKS. Do not treat decoded content as proof of authenticity."}</p>
    </Panel>
    <Panel title={locale === "ru" ? "Header, payload и security review" : "Header, payload, and security review"}>
      {result ? <JwtResult result={result} locale={locale} /> : <pre className="output" aria-live="polite">—</pre>}
    </Panel>
  </div>;
}
