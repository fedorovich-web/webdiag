"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import {
  isHttpCompressionResponse,
  isSslCertificateResponse,
  isTlsConfigurationResponse,
  isToolErrorPayload,
  parseHostnameInput,
  parseHttpsUrlInput,
  type HttpCompressionResponse,
  type ProtocolSecurityToolResponse,
  type SslCertificateResponse,
  type TlsConfigurationResponse,
} from "./protocol-security-tool-contract";

class ProtocolSecurityToolError extends Error {
  readonly code: string;

  constructor(message: string, code = "protocol_security_tool_error") {
    super(message);
    this.name = "ProtocolSecurityToolError";
    this.code = code;
  }
}

const dictionary = {
  ru: {
    host: "Hostname",
    url: "URL",
    run: "Проверить",
    loading: "Проверяем…",
    result: "Результат",
    recommendation: "Рекомендация",
    invalidHost: "Введите hostname без протокола, пути и IP-адреса.",
    invalidUrl: "Введите http/https URL без credentials.",
    status: "Статус",
  },
  en: {
    host: "Hostname",
    url: "URL",
    run: "Check",
    loading: "Checking…",
    result: "Result",
    recommendation: "Recommendation",
    invalidHost: "Enter a hostname without protocol, path, or IP address.",
    invalidUrl: "Enter an http/https URL without credentials.",
    status: "Status",
  },
} as const;

async function runProtocolSecurityTool(
  endpoint:
    | "/api/tools/ssl-certificate"
    | "/api/tools/tls-configuration"
    | "/api/tools/http-compression",
  payload: Record<string, string | number>,
): Promise<ProtocolSecurityToolResponse> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (isToolErrorPayload(data)) {
      throw new ProtocolSecurityToolError(data.detail.message, data.detail.code);
    }
    throw new ProtocolSecurityToolError("Tool API request failed.");
  }
  if (endpoint === "/api/tools/ssl-certificate" && isSslCertificateResponse(data)) return data;
  if (endpoint === "/api/tools/tls-configuration" && isTlsConfigurationResponse(data)) return data;
  if (endpoint === "/api/tools/http-compression" && isHttpCompressionResponse(data)) return data;
  throw new ProtocolSecurityToolError("Tool API returned an invalid result.");
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="tool-panel"><h2>{title}</h2>{children}</section>;
}

function Recommendation({ locale, value }: { locale: Locale; value: string }) {
  return <p className="tool-note"><strong>{dictionary[locale].recommendation}:</strong> {value}</p>;
}

function StatusBadge({ value }: { value: "pass" | "warning" | "fail" }) {
  return <span className={`tool-status tool-status-${value}`}>{value}</span>;
}

function HostForm({
  locale,
  onSubmit,
  loading,
}: {
  locale: Locale;
  onSubmit: (hostname: string, port: number) => void;
  loading: boolean;
}) {
  const [hostname, setHostname] = useState("example.com");
  const [port, setPort] = useState("443");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseHostnameInput(hostname);
    const parsedPort = Number(port);
    if (!parsed || !Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
      setError(dictionary[locale].invalidHost);
      return;
    }
    setError("");
    onSubmit(parsed, parsedPort);
  }

  return <Panel title={dictionary[locale].host}>
    <form className="tool-form" onSubmit={submit}>
      <label className="field">
        <span>{dictionary[locale].host}</span>
        <input value={hostname} onChange={(event) => setHostname(event.target.value)} />
      </label>
      <label className="field">
        <span>Port</span>
        <input value={port} onChange={(event) => setPort(event.target.value)} inputMode="numeric" />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button" type="submit" disabled={loading}>
        {loading ? dictionary[locale].loading : dictionary[locale].run}
      </button>
    </form>
  </Panel>;
}

function UrlForm({
  locale,
  onSubmit,
  loading,
}: {
  locale: Locale;
  onSubmit: (url: string) => void;
  loading: boolean;
}) {
  const [url, setUrl] = useState("https://example.com/");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseHttpsUrlInput(url);
    if (!parsed) {
      setError(dictionary[locale].invalidUrl);
      return;
    }
    setError("");
    onSubmit(parsed);
  }

  return <Panel title={dictionary[locale].url}>
    <form className="tool-form" onSubmit={submit}>
      <label className="field">
        <span>{dictionary[locale].url}</span>
        <input value={url} onChange={(event) => setUrl(event.target.value)} />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button" type="submit" disabled={loading}>
        {loading ? dictionary[locale].loading : dictionary[locale].run}
      </button>
    </form>
  </Panel>;
}

export function sslCertificateResultText(result: SslCertificateResponse): string {
  return [
    `Hostname: ${result.hostname}:${result.port}`,
    `Issuer: ${result.issuer_common_name ?? "—"}`,
    `Expires in: ${result.days_until_expiry ?? "—"} days`,
    `Hostname match: ${result.hostname_matches ? "yes" : "no"}`,
    `Status: ${result.status}`,
    `Recommendation: ${result.recommendation}`,
  ].join("\n");
}

export function tlsConfigurationResultText(result: TlsConfigurationResponse): string {
  return [
    `Hostname: ${result.hostname}:${result.port}`,
    `TLS version: ${result.tls_version ?? "—"}`,
    `Cipher: ${result.cipher_suite ?? "—"}`,
    `ALPN: ${result.negotiated_protocol ?? "—"}`,
    `Status: ${result.status}`,
    `Recommendation: ${result.recommendation}`,
  ].join("\n");
}

export function httpCompressionResultText(result: HttpCompressionResponse): string {
  return [
    `URL: ${result.final_url}`,
    `Content-Type: ${result.content_type ?? "—"}`,
    `Content-Encoding: ${result.content_encoding ?? "—"}`,
    `Compressed: ${result.compressed ? "yes" : "no"}`,
    `Status: ${result.status}`,
    `Recommendation: ${result.recommendation}`,
  ].join("\n");
}

function SslCertificateResult({ locale, result }: { locale: Locale; result: SslCertificateResponse }) {
  return <Panel title={dictionary[locale].result}>
    <div className="metric-grid">
      <div><span>Host</span><strong>{result.hostname}</strong></div>
      <div><span>Expires</span><strong>{result.days_until_expiry ?? "—"}d</strong></div>
      <div><span>{dictionary[locale].status}</span><strong><StatusBadge value={result.status} /></strong></div>
    </div>
    <ul className="result-list">
      <li><strong>Issuer</strong><span>{result.issuer_common_name ?? "—"}</span></li>
      <li><strong>Subject CN</strong><span>{result.subject.common_name ?? "—"}</span></li>
      <li><strong>SAN</strong><span>{result.san_count}</span></li>
      <li><strong>Hostname match</strong><span>{result.hostname_matches ? "yes" : "no"}</span></li>
    </ul>
    <Recommendation locale={locale} value={result.recommendation} />
  </Panel>;
}

function TlsConfigurationResult({ locale, result }: { locale: Locale; result: TlsConfigurationResponse }) {
  return <Panel title={dictionary[locale].result}>
    <div className="metric-grid">
      <div><span>TLS</span><strong>{result.tls_version ?? "—"}</strong></div>
      <div><span>ALPN</span><strong>{result.negotiated_protocol ?? "—"}</strong></div>
      <div><span>{dictionary[locale].status}</span><strong><StatusBadge value={result.status} /></strong></div>
    </div>
    <ul className="result-list">
      <li><strong>Cipher</strong><span>{result.cipher_suite ?? "—"}</span></li>
      <li><strong>Key bits</strong><span>{result.key_exchange_bits ?? "—"}</span></li>
      <li><strong>Certificate host</strong><span>{result.certificate_hostname_matches ? "match" : "mismatch"}</span></li>
    </ul>
    <Recommendation locale={locale} value={result.recommendation} />
  </Panel>;
}

function CompressionResult({ locale, result }: { locale: Locale; result: HttpCompressionResponse }) {
  return <Panel title={dictionary[locale].result}>
    <div className="metric-grid">
      <div><span>Status</span><strong>{result.status_code}</strong></div>
      <div><span>Encoding</span><strong>{result.content_encoding ?? "—"}</strong></div>
      <div><span>{dictionary[locale].status}</span><strong><StatusBadge value={result.status} /></strong></div>
    </div>
    <ul className="result-list">
      <li><strong>Content-Type</strong><span>{result.content_type ?? "—"}</span></li>
      <li><strong>Vary</strong><span>{result.vary ?? "—"}</span></li>
      <li><strong>Compressible</strong><span>{result.compressible_candidate ? "yes" : "no"}</span></li>
      <li><strong>Compressed</strong><span>{result.compressed ? "yes" : "no"}</span></li>
    </ul>
    <Recommendation locale={locale} value={result.recommendation} />
  </Panel>;
}

function ProtocolSecurityTool({
  locale,
  kind,
}: {
  locale: Locale;
  kind: "ssl" | "tls" | "compression";
}) {
  const [result, setResult] = useState<ProtocolSecurityToolResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const endpoint = kind === "ssl"
    ? "/api/tools/ssl-certificate"
    : kind === "tls"
      ? "/api/tools/tls-configuration"
      : "/api/tools/http-compression";

  async function runHost(hostname: string, port: number) {
    setLoading(true);
    setError("");
    try {
      setResult(await runProtocolSecurityTool(endpoint, { hostname, port }));
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "Tool request failed.");
    } finally {
      setLoading(false);
    }
  }

  async function runUrl(url: string) {
    setLoading(true);
    setError("");
    try {
      setResult(await runProtocolSecurityTool(endpoint, { url }));
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "Tool request failed.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="tool-grid">
    {kind === "compression"
      ? <UrlForm locale={locale} onSubmit={runUrl} loading={loading} />
      : <HostForm locale={locale} onSubmit={runHost} loading={loading} />}
    {error && <p className="form-error" role="alert">{error}</p>}
    {isSslCertificateResponse(result) && <SslCertificateResult locale={locale} result={result} />}
    {isTlsConfigurationResponse(result) && <TlsConfigurationResult locale={locale} result={result} />}
    {isHttpCompressionResponse(result) && <CompressionResult locale={locale} result={result} />}
  </div>;
}

export function SslCertificateCheckerTool({ locale }: { locale: Locale }) {
  return <ProtocolSecurityTool locale={locale} kind="ssl" />;
}

export function TlsConfigurationCheckerTool({ locale }: { locale: Locale }) {
  return <ProtocolSecurityTool locale={locale} kind="tls" />;
}

export function HttpCompressionCheckerTool({ locale }: { locale: Locale }) {
  return <ProtocolSecurityTool locale={locale} kind="compression" />;
}
