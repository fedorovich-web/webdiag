"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import {
  isCookiePolicyResponse,
  isCorsResponse,
  isHttpCompressionResponse,
  isHttpHeadersAnalyzerResponse,
  isHttpProtocolResponse,
  isMixedContentResponse,
  isServerTimingAnalyzerResponse,
  isSslCertificateResponse,
  isTlsConfigurationResponse,
  isToolErrorPayload,
  parseHostnameInput,
  parseHttpsUrlInput,
  parseOriginInput,
  type CookiePolicyResponse,
  type CorsResponse,
  type HttpCompressionResponse,
  type HttpHeadersAnalyzerResponse,
  type HttpProtocolResponse,
  type MixedContentResponse,
  type ProtocolSecurityToolResponse,
  type ServerTimingAnalyzerResponse,
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
    | "/api/tools/http-compression"
    | "/api/tools/http-headers"
    | "/api/tools/http-protocol"
    | "/api/tools/cors"
    | "/api/tools/server-timing"
    | "/api/tools/cookie-policy"
    | "/api/tools/mixed-content",
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
  if (endpoint === "/api/tools/http-headers" && isHttpHeadersAnalyzerResponse(data)) return data;
  if (endpoint === "/api/tools/http-protocol" && isHttpProtocolResponse(data)) return data;
  if (endpoint === "/api/tools/cors" && isCorsResponse(data)) return data;
  if (endpoint === "/api/tools/server-timing" && isServerTimingAnalyzerResponse(data)) return data;
  if (endpoint === "/api/tools/cookie-policy" && isCookiePolicyResponse(data)) return data;
  if (endpoint === "/api/tools/mixed-content" && isMixedContentResponse(data)) return data;
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

function CorsForm({
  locale,
  onSubmit,
  loading,
}: {
  locale: Locale;
  onSubmit: (url: string, origin: string) => void;
  loading: boolean;
}) {
  const [url, setUrl] = useState("https://api.example.com/");
  const [origin, setOrigin] = useState("https://example.com");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedUrl = parseHttpsUrlInput(url);
    const parsedOrigin = parseOriginInput(origin);
    if (!parsedUrl || !parsedOrigin) {
      setError(locale === "ru" ? "Введите корректный URL и Origin." : "Enter a valid URL and Origin.");
      return;
    }
    setError("");
    onSubmit(parsedUrl, parsedOrigin);
  }

  return <Panel title="CORS">
    <form className="tool-form" onSubmit={submit}>
      <label className="field">
        <span>{dictionary[locale].url}</span>
        <input value={url} onChange={(event) => setUrl(event.target.value)} />
      </label>
      <label className="field">
        <span>Origin</span>
        <input value={origin} onChange={(event) => setOrigin(event.target.value)} />
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


export function httpHeadersResultText(result: HttpHeadersAnalyzerResponse): string {
  return [
    `URL: ${result.final_url}`,
    `Headers: ${result.header_count}`,
    `Server header: ${result.server_header_present ? "yes" : "no"}`,
    `X-Powered-By: ${result.powered_by_header_present ? "yes" : "no"}`,
    `Status: ${result.status}`,
    `Recommendation: ${result.recommendation}`,
  ].join("\n");
}

export function httpProtocolResultText(result: HttpProtocolResponse): string {
  return [
    `URL: ${result.final_url}`,
    `Scheme: ${result.scheme}`,
    `TLS: ${result.tls_version ?? "—"}`,
    `ALPN: ${result.negotiated_protocol ?? "—"}`,
    `HTTP/3 advertised: ${result.http3_advertised ? "yes" : "no"}`,
    `Status: ${result.status}`,
    `Recommendation: ${result.recommendation}`,
  ].join("\n");
}

export function corsResultText(result: CorsResponse): string {
  return [
    `URL: ${result.final_url}`,
    `Origin: ${result.tested_origin}`,
    `Access-Control-Allow-Origin: ${result.allow_origin ?? "—"}`,
    `Credentials: ${result.allow_credentials ? "yes" : "no"}`,
    `Status: ${result.status}`,
    `Recommendation: ${result.recommendation}`,
  ].join("\n");
}


export function serverTimingResultText(result: ServerTimingAnalyzerResponse): string {
  return [
    `URL: ${result.final_url}`,
    `Server-Timing: ${result.server_timing_present ? "present" : "missing"}`,
    `Metrics: ${result.metric_count}`,
    `Status: ${result.status}`,
    `Recommendation: ${result.recommendation}`,
  ].join("\n");
}

export function cookiePolicyResultText(result: CookiePolicyResponse): string {
  return [
    `URL: ${result.final_url}`,
    `Set-Cookie: ${result.set_cookie_count}`,
    `Issues: ${result.issue_count}`,
    `Status: ${result.status}`,
    `Recommendation: ${result.recommendation}`,
  ].join("\n");
}

export function mixedContentResultText(result: MixedContentResponse): string {
  return [
    `URL: ${result.final_url}`,
    `Mixed content: ${result.mixed_content_count}`,
    `Active: ${result.active_mixed_content_count}`,
    `Passive: ${result.passive_mixed_content_count}`,
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

function HeadersResult({ locale, result }: { locale: Locale; result: HttpHeadersAnalyzerResponse }) {
  return <Panel title={dictionary[locale].result}>
    <div className="metric-grid">
      <div><span>Status</span><strong>{result.status_code}</strong></div>
      <div><span>Headers</span><strong>{result.header_count}</strong></div>
      <div><span>{dictionary[locale].status}</span><strong><StatusBadge value={result.status} /></strong></div>
    </div>
    <ul className="result-list">
      <li><strong>Content-Type</strong><span>{result.content_type ?? "—"}</span></li>
      <li><strong>Cache-Control</strong><span>{result.cache_control ?? "—"}</span></li>
      <li><strong>Server</strong><span>{result.server_header_present ? "present" : "—"}</span></li>
      <li><strong>X-Powered-By</strong><span>{result.powered_by_header_present ? "present" : "—"}</span></li>
    </ul>
    <Recommendation locale={locale} value={result.recommendation} />
  </Panel>;
}

function HttpProtocolResult({ locale, result }: { locale: Locale; result: HttpProtocolResponse }) {
  return <Panel title={dictionary[locale].result}>
    <div className="metric-grid">
      <div><span>HTTP/2</span><strong>{result.http2_supported ? "yes" : "no"}</strong></div>
      <div><span>HTTP/3</span><strong>{result.http3_advertised ? "Alt-Svc" : "—"}</strong></div>
      <div><span>{dictionary[locale].status}</span><strong><StatusBadge value={result.status} /></strong></div>
    </div>
    <ul className="result-list">
      <li><strong>Scheme</strong><span>{result.scheme}</span></li>
      <li><strong>TLS</strong><span>{result.tls_version ?? "—"}</span></li>
      <li><strong>ALPN</strong><span>{result.negotiated_protocol ?? "—"}</span></li>
      <li><strong>Alt-Svc</strong><span>{result.alt_svc ?? "—"}</span></li>
    </ul>
    <Recommendation locale={locale} value={result.recommendation} />
  </Panel>;
}

function CorsResult({ locale, result }: { locale: Locale; result: CorsResponse }) {
  return <Panel title={dictionary[locale].result}>
    <div className="metric-grid">
      <div><span>Status</span><strong>{result.status_code}</strong></div>
      <div><span>Origin</span><strong>{result.allows_tested_origin ? "allowed" : "not allowed"}</strong></div>
      <div><span>{dictionary[locale].status}</span><strong><StatusBadge value={result.status} /></strong></div>
    </div>
    <ul className="result-list">
      <li><strong>ACAO</strong><span>{result.allow_origin ?? "—"}</span></li>
      <li><strong>Credentials</strong><span>{result.allow_credentials ? "true" : "false"}</span></li>
      <li><strong>Vary: Origin</strong><span>{result.vary_origin ? "yes" : "no"}</span></li>
      <li><strong>Wildcard + credentials</strong><span>{result.wildcard_with_credentials ? "yes" : "no"}</span></li>
    </ul>
    <Recommendation locale={locale} value={result.recommendation} />
  </Panel>;
}


function ServerTimingResult({
  locale,
  result,
}: {
  locale: Locale;
  result: ServerTimingAnalyzerResponse;
}) {
  return <Panel title={dictionary[locale].result}>
    <div className="metric-grid">
      <div><span>Status</span><strong>{result.status_code}</strong></div>
      <div><span>Metrics</span><strong>{result.metric_count}</strong></div>
      <div><span>{dictionary[locale].status}</span><strong><StatusBadge value={result.status} /></strong></div>
    </div>
    <ul className="result-list">
      <li><strong>Server-Timing</strong><span>{result.raw_header ?? "—"}</span></li>
      {result.metrics.slice(0, 8).map((metric) => (
        <li key={`${metric.name}-${metric.duration_ms ?? "none"}`}>
          <strong>{metric.name}</strong>
          <span>{metric.duration_ms ?? "—"} ms</span>
        </li>
      ))}
    </ul>
    <Recommendation locale={locale} value={result.recommendation} />
  </Panel>;
}

function CookiePolicyResult({
  locale,
  result,
}: {
  locale: Locale;
  result: CookiePolicyResponse;
}) {
  return <Panel title={dictionary[locale].result}>
    <div className="metric-grid">
      <div><span>Cookies</span><strong>{result.set_cookie_count}</strong></div>
      <div><span>Issues</span><strong>{result.issue_count}</strong></div>
      <div><span>{dictionary[locale].status}</span><strong><StatusBadge value={result.status} /></strong></div>
    </div>
    <ul className="result-list">
      <li><strong>Secure</strong><span>{result.secure_count}</span></li>
      <li><strong>HttpOnly</strong><span>{result.http_only_count}</span></li>
      <li><strong>SameSite</strong><span>{result.same_site_count}</span></li>
      {result.cookies.slice(0, 8).map((cookie) => (
        <li key={cookie.name}>
          <strong>{cookie.name}</strong>
          <span>{cookie.issues.length ? cookie.issues.join(", ") : "ok"}</span>
        </li>
      ))}
    </ul>
    <Recommendation locale={locale} value={result.recommendation} />
  </Panel>;
}

function MixedContentResult({
  locale,
  result,
}: {
  locale: Locale;
  result: MixedContentResponse;
}) {
  return <Panel title={dictionary[locale].result}>
    <div className="metric-grid">
      <div><span>Mixed</span><strong>{result.mixed_content_count}</strong></div>
      <div><span>Active</span><strong>{result.active_mixed_content_count}</strong></div>
      <div><span>{dictionary[locale].status}</span><strong><StatusBadge value={result.status} /></strong></div>
    </div>
    <ul className="result-list">
      <li><strong>Page scheme</strong><span>{result.page_scheme}</span></li>
      <li><strong>Candidates</strong><span>{result.candidate_count}</span></li>
      <li><strong>Passive</strong><span>{result.passive_mixed_content_count}</span></li>
      {result.sample_items.slice(0, 8).map((item) => (
        <li key={`${item.source}-${item.url}`}>
          <strong>{item.source}</strong>
          <span>{item.url}</span>
        </li>
      ))}
    </ul>
    <Recommendation locale={locale} value={result.recommendation} />
  </Panel>;
}


function ProtocolSecurityTool({
  locale,
  kind,
}: {
  locale: Locale;
  kind:
    | "ssl"
    | "tls"
    | "compression"
    | "headers"
    | "protocol"
    | "cors"
    | "server-timing"
    | "cookie-policy"
    | "mixed-content";
}) {
  const [result, setResult] = useState<ProtocolSecurityToolResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const endpoint = kind === "ssl"
    ? "/api/tools/ssl-certificate"
    : kind === "tls"
      ? "/api/tools/tls-configuration"
      : kind === "compression"
        ? "/api/tools/http-compression"
        : kind === "headers"
          ? "/api/tools/http-headers"
          : kind === "protocol"
            ? "/api/tools/http-protocol"
            : kind === "cors"
              ? "/api/tools/cors"
              : kind === "server-timing"
                ? "/api/tools/server-timing"
                : kind === "cookie-policy"
                  ? "/api/tools/cookie-policy"
                  : "/api/tools/mixed-content";

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

  async function runCors(url: string, origin: string) {
    setLoading(true);
    setError("");
    try {
      setResult(await runProtocolSecurityTool(endpoint, { url, origin }));
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "Tool request failed.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="tool-grid">
    {kind === "cors"
      ? <CorsForm locale={locale} onSubmit={runCors} loading={loading} />
      : kind !== "ssl" && kind !== "tls"
        ? <UrlForm locale={locale} onSubmit={runUrl} loading={loading} />
        : <HostForm locale={locale} onSubmit={runHost} loading={loading} />}
    {error && <p className="form-error" role="alert">{error}</p>}
    {isSslCertificateResponse(result) && <SslCertificateResult locale={locale} result={result} />}
    {isTlsConfigurationResponse(result) && <TlsConfigurationResult locale={locale} result={result} />}
    {isHttpCompressionResponse(result) && <CompressionResult locale={locale} result={result} />}
    {isHttpHeadersAnalyzerResponse(result) && <HeadersResult locale={locale} result={result} />}
    {isHttpProtocolResponse(result) && <HttpProtocolResult locale={locale} result={result} />}
    {isCorsResponse(result) && <CorsResult locale={locale} result={result} />}
    {isServerTimingAnalyzerResponse(result) && <ServerTimingResult locale={locale} result={result} />}
    {isCookiePolicyResponse(result) && <CookiePolicyResult locale={locale} result={result} />}
    {isMixedContentResponse(result) && <MixedContentResult locale={locale} result={result} />}
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


export function HttpHeadersAnalyzerTool({ locale }: { locale: Locale }) {
  return <ProtocolSecurityTool locale={locale} kind="headers" />;
}

export function HttpProtocolCheckerTool({ locale }: { locale: Locale }) {
  return <ProtocolSecurityTool locale={locale} kind="protocol" />;
}

export function CorsCheckerTool({ locale }: { locale: Locale }) {
  return <ProtocolSecurityTool locale={locale} kind="cors" />;
}


export function ServerTimingAnalyzerTool({ locale }: { locale: Locale }) {
  return <ProtocolSecurityTool locale={locale} kind="server-timing" />;
}

export function CookiePolicyCheckerTool({ locale }: { locale: Locale }) {
  return <ProtocolSecurityTool locale={locale} kind="cookie-policy" />;
}

export function MixedContentCheckerTool({ locale }: { locale: Locale }) {
  return <ProtocolSecurityTool locale={locale} kind="mixed-content" />;
}
