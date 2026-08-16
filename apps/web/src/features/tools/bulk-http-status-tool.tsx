"use client";

import { toolErrorMessage } from "./tool-error-presentation";

import { type FormEvent, useState } from "react";
import type { Locale } from "@webdiag/tool-registry";
import {
  isBulkHttpStatusResponse,
  type BulkHttpStatusResult,
} from "./bulk-http-status-contract";

export { isBulkHttpStatusResponse } from "./bulk-http-status-contract";

class BulkInputError extends Error {}

export function parseBulkUrlInput(value: string): string[] {
  const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) throw new BulkInputError("empty_input");
  if (lines.length > 50) throw new BulkInputError("too_many_urls");
  return lines.map((line) => {
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(line) && !/^https?:\/\//i.test(line)) {
      throw new BulkInputError("invalid_url");
    }
    const normalized = /^https?:\/\//i.test(line) ? line : `https://${line}`;
    if (normalized.length > 2_048) throw new BulkInputError("invalid_url");
    try {
      const parsed = new URL(normalized);
      if (!/^https?:$/.test(parsed.protocol) || !parsed.hostname) {
        throw new BulkInputError("invalid_url");
      }
      return parsed.toString();
    } catch (error) {
      if (error instanceof BulkInputError) throw error;
      throw new BulkInputError("invalid_url");
    }
  });
}

function errorMessage(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const detail = (value as { detail?: unknown }).detail;
  if (!detail || typeof detail !== "object") return "";
  const message = (detail as { message?: unknown }).message;
  return typeof message === "string" ? message : "";
}

async function inspectUrls(urls: readonly string[]): Promise<BulkHttpStatusResult> {
  const response = await fetch("/api/tools/bulk-http-status", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ urls }),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(errorMessage(payload) || "Bulk HTTP status check failed.");
  if (!isBulkHttpStatusResponse(payload)) throw new Error("Tool API returned an invalid response.");
  return payload;
}

export function BulkHttpStatusTool({ locale }: { locale: Locale }) {
  const [input, setInput] = useState("https://example.com/\nhttps://example.com/missing");
  const [result, setResult] = useState<BulkHttpStatusResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const copy = locale === "ru"
    ? {
        title: "URL для проверки",
        label: "До 50 адресов, по одному в строке",
        button: "Проверить HTTP-статусы",
        loading: "Проверяем...",
        invalid: "Укажите от 1 до 50 корректных HTTP(S) URL, по одному в строке.",
        result: "Результаты",
        empty: "После проверки здесь появятся статусы и ошибки по каждому URL.",
        success: "Успешно",
        failed: "С ошибкой",
        final: "Финальный URL",
      }
    : {
        title: "URLs to inspect",
        label: "Up to 50 addresses, one per line",
        button: "Check HTTP statuses",
        loading: "Checking...",
        invalid: "Enter 1 to 50 valid HTTP(S) URLs, one per line.",
        result: "Results",
        empty: "Per-URL statuses and errors will appear here after the check.",
        success: "Succeeded",
        failed: "Failed",
        final: "Final URL",
      };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let urls: string[];
    try {
      urls = parseBulkUrlInput(input);
    } catch {
      setError(copy.invalid);
      setResult(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setResult(await inspectUrls(urls));
    } catch (caught) {
      setResult(null);
      setError(toolErrorMessage(locale, caught, "invalid_input"));
    } finally {
      setLoading(false);
    }
  }

  return <div className="tool-grid">
    <section className="tool-panel">
      <h2>{copy.title}</h2>
      <form onSubmit={onSubmit}>
        <label className="field"><span>{copy.label}</span><textarea value={input} onChange={(event) => setInput(event.target.value)} rows={10} /></label>
        <button className="button" type="submit" disabled={loading}>{loading ? copy.loading : copy.button}</button>
      </form>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </section>
    <section className="tool-panel" aria-live="polite">
      <h2>{copy.result}</h2>
      {result ? <>
        <dl className="result-meta">
          <div><dt>{copy.success}</dt><dd>{result.succeeded}</dd></div>
          <div><dt>{copy.failed}</dt><dd>{result.failed}</dd></div>
          <div><dt>{locale === "ru" ? "Всего" : "Total"}</dt><dd>{result.total}</dd></div>
        </dl>
        <ol className="result-list">
          {result.items.map((item) => <li key={`${item.index}-${item.requested_url}`}>
            <strong>{item.result ? `HTTP ${item.result.status_code}` : item.error?.code}</strong>{" "}
            <span>{item.requested_url}</span>
            {item.result && item.result.final_url !== item.requested_url ? <span> · {copy.final}: {item.result.final_url}</span> : null}
            {item.error ? <span> · {item.error.message}</span> : null}
          </li>)}
        </ol>
      </> : <p className="muted-text">{copy.empty}</p>}
    </section>
  </div>;
}
