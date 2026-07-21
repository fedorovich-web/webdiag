"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import {
  isDkimCheckerResponse,
  isDmarcCheckerResponse,
  isDnsLookupResponse,
  isDnssecCheckerResponse,
  isMxCheckerResponse,
  isSpfCheckerResponse,
  isToolErrorPayload,
  parseDkimSelectorInput,
  parseDomainInput,
  type DkimCheckerResponse,
  type DmarcCheckerResponse,
  type DnsLookupResponse,
  type DnssecCheckerResponse,
  type MxCheckerResponse,
  type NetworkDnsToolResponse,
  type SpfCheckerResponse,
} from "./network-dns-tool-contract";

class NetworkDnsToolError extends Error {
  readonly code: string;

  constructor(message: string, code = "network_dns_tool_error") {
    super(message);
    this.name = "NetworkDnsToolError";
    this.code = code;
  }
}

const dictionary = {
  ru: {
    domain: "Домен",
    run: "Проверить",
    loading: "Проверяем DNS…",
    result: "Результат",
    recommendation: "Рекомендация",
    invalidDomain: "Введите домен без протокола, пути и IP-адреса.",
    records: "Записи",
    status: "Статус",
  },
  en: {
    domain: "Domain",
    run: "Check",
    loading: "Checking DNS…",
    result: "Result",
    recommendation: "Recommendation",
    invalidDomain: "Enter a domain without protocol, path, or IP address.",
    records: "Records",
    status: "Status",
  },
} as const;

async function runNetworkDnsTool(
  endpoint:
    | "/api/tools/dns-lookup"
    | "/api/tools/mx-records"
    | "/api/tools/spf"
    | "/api/tools/dkim"
    | "/api/tools/dmarc"
    | "/api/tools/dnssec",
  domain: string,
  extraPayload: Record<string, string> = {},
): Promise<NetworkDnsToolResponse> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ domain, ...extraPayload }),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (isToolErrorPayload(payload)) {
      throw new NetworkDnsToolError(payload.detail.message, payload.detail.code);
    }
    throw new NetworkDnsToolError("Tool API request failed.");
  }
  if (endpoint === "/api/tools/dns-lookup" && isDnsLookupResponse(payload)) return payload;
  if (endpoint === "/api/tools/mx-records" && isMxCheckerResponse(payload)) return payload;
  if (endpoint === "/api/tools/spf" && isSpfCheckerResponse(payload)) return payload;
  if (endpoint === "/api/tools/dkim" && isDkimCheckerResponse(payload)) return payload;
  if (endpoint === "/api/tools/dmarc" && isDmarcCheckerResponse(payload)) return payload;
  if (endpoint === "/api/tools/dnssec" && isDnssecCheckerResponse(payload)) return payload;
  throw new NetworkDnsToolError("Tool API returned an invalid result.", "tool_invalid_response");
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="tool-panel"><h2>{title}</h2>{children}</section>;
}

function DomainForm({
  locale,
  onSubmit,
  loading,
}: {
  locale: Locale;
  onSubmit: (domain: string) => void;
  loading: boolean;
}) {
  const [domain, setDomain] = useState("example.com");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseDomainInput(domain);
    if (!parsed) {
      setError(dictionary[locale].invalidDomain);
      return;
    }
    setError("");
    onSubmit(parsed);
  }

  return <Panel title={dictionary[locale].domain}>
    <form className="tool-form" onSubmit={submit}>
      <label className="field">
        <span>{dictionary[locale].domain}</span>
        <input value={domain} onChange={(event) => setDomain(event.target.value)} />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button" type="submit" disabled={loading}>
        {loading ? dictionary[locale].loading : dictionary[locale].run}
      </button>
    </form>
  </Panel>;
}

function DkimForm({
  locale,
  onSubmit,
  loading,
}: {
  locale: Locale;
  onSubmit: (domain: string, selector: string) => void;
  loading: boolean;
}) {
  const [domain, setDomain] = useState("example.com");
  const [selector, setSelector] = useState("default");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedDomain = parseDomainInput(domain);
    const parsedSelector = parseDkimSelectorInput(selector);
    if (!parsedDomain || !parsedSelector) {
      setError(
        locale === "ru"
          ? "Введите домен и DKIM selector без протокола и пути."
          : "Enter a domain and DKIM selector without protocol or path.",
      );
      return;
    }
    setError("");
    onSubmit(parsedDomain, parsedSelector);
  }

  return <Panel title="DKIM selector">
    <form className="tool-form" onSubmit={submit}>
      <label className="field">
        <span>{dictionary[locale].domain}</span>
        <input value={domain} onChange={(event) => setDomain(event.target.value)} />
      </label>
      <label className="field">
        <span>Selector</span>
        <input value={selector} onChange={(event) => setSelector(event.target.value)} />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button" type="submit" disabled={loading}>
        {loading ? dictionary[locale].loading : dictionary[locale].run}
      </button>
    </form>
  </Panel>;
}


export function dnsLookupResultText(result: DnsLookupResponse): string {
  return [
    `Domain: ${result.domain}`,
    `Records: ${result.record_count}`,
    `Types: ${result.checked_record_types.join(", ")}`,
    `Recommendation: ${result.recommendation}`,
  ].join("\n");
}

export function mxCheckerResultText(result: MxCheckerResponse): string {
  return [
    `Domain: ${result.domain}`,
    `MX records: ${result.mx_count}`,
    `Status: ${result.status}`,
    `Recommendation: ${result.recommendation}`,
  ].join("\n");
}

export function spfCheckerResultText(result: SpfCheckerResponse): string {
  return [
    `Domain: ${result.domain}`,
    `SPF records: ${result.spf_record_count}`,
    `Status: ${result.status}`,
    `all: ${result.all_mechanism ?? "—"}`,
    `Recommendation: ${result.recommendation}`,
  ].join("\n");
}

export function dkimCheckerResultText(result: DkimCheckerResponse): string {
  return [
    `Domain: ${result.domain}`,
    `Selector: ${result.selector}`,
    `DKIM records: ${result.dkim_record_count}`,
    `Status: ${result.status}`,
    `Recommendation: ${result.recommendation}`,
  ].join("\n");
}

export function dmarcCheckerResultText(result: DmarcCheckerResponse): string {
  return [
    `Domain: ${result.domain}`,
    `DMARC records: ${result.dmarc_record_count}`,
    `Policy: ${result.policy ?? "—"}`,
    `Status: ${result.status}`,
    `Recommendation: ${result.recommendation}`,
  ].join("\n");
}

export function dnssecCheckerResultText(result: DnssecCheckerResponse): string {
  return [
    `Domain: ${result.domain}`,
    `DS records: ${result.ds_record_count}`,
    `DNSKEY records: ${result.dnskey_record_count}`,
    `Status: ${result.status}`,
    `Recommendation: ${result.recommendation}`,
  ].join("\n");
}

function Recommendation({ locale, value }: { locale: Locale; value: string }) {
  return <p className="tool-note"><strong>{dictionary[locale].recommendation}:</strong> {value}</p>;
}

function StatusBadge({ value }: { value: "pass" | "warning" | "fail" }) {
  return <span className={`tool-status tool-status-${value}`}>{value}</span>;
}

function DnsLookupResult({ locale, result }: { locale: Locale; result: DnsLookupResponse }) {
  return <Panel title={dictionary[locale].result}>
    <div className="metric-grid">
      <div><span>Domain</span><strong>{result.domain}</strong></div>
      <div><span>{dictionary[locale].records}</span><strong>{result.record_count}</strong></div>
      <div><span>Types</span><strong>{result.checked_record_types.join(", ")}</strong></div>
    </div>
    <ul className="result-list">
      {result.records.slice(0, 30).map((record, index) => <li key={`${record.record_type}-${index}`}>
        <strong>{record.record_type}</strong> {record.value}
        {record.priority !== null ? ` · priority ${record.priority}` : ""} · TTL {record.ttl}s
      </li>)}
    </ul>
    {result.errors.length > 0 && <p className="form-error">{result.errors.length} DNS query errors</p>}
    <Recommendation locale={locale} value={result.recommendation} />
  </Panel>;
}

function MxResult({ locale, result }: { locale: Locale; result: MxCheckerResponse }) {
  return <Panel title={dictionary[locale].result}>
    <div className="metric-grid">
      <div><span>Domain</span><strong>{result.domain}</strong></div>
      <div><span>MX</span><strong>{result.mx_count}</strong></div>
      <div><span>{dictionary[locale].status}</span><strong><StatusBadge value={result.status} /></strong></div>
    </div>
    <ul className="result-list">
      {result.hosts.map((host) => <li key={host.host}>
        <strong>{host.priority}</strong> {host.host} · {host.address_count} A/AAAA
      </li>)}
    </ul>
    {result.has_null_mx && <p className="tool-note">Null MX configured.</p>}
    <Recommendation locale={locale} value={result.recommendation} />
  </Panel>;
}

function SpfResult({ locale, result }: { locale: Locale; result: SpfCheckerResponse }) {
  return <Panel title={dictionary[locale].result}>
    <div className="metric-grid">
      <div><span>Domain</span><strong>{result.domain}</strong></div>
      <div><span>SPF</span><strong>{result.spf_record_count}</strong></div>
      <div><span>{dictionary[locale].status}</span><strong><StatusBadge value={result.status} /></strong></div>
    </div>
    <pre className="output">{result.spf_record ?? "—"}</pre>
    <ul className="result-list">
      <li>all: {result.all_mechanism ?? "—"}</li>
      <li>include: {result.uses_include ? "yes" : "no"}</li>
      <li>redirect: {result.uses_redirect ? "yes" : "no"}</li>
      <li>estimated DNS lookup mechanisms: {result.estimated_dns_lookup_mechanisms}</li>
    </ul>
    <Recommendation locale={locale} value={result.recommendation} />
  </Panel>;
}

function DkimResult({ locale, result }: { locale: Locale; result: DkimCheckerResponse }) {
  return <Panel title={dictionary[locale].result}>
    <div className="metric-grid">
      <div><span>Selector</span><strong>{result.selector}</strong></div>
      <div><span>Records</span><strong>{result.dkim_record_count}</strong></div>
      <div><span>{dictionary[locale].status}</span><strong><StatusBadge value={result.status} /></strong></div>
    </div>
    <ul className="result-list">
      <li><strong>Record</strong><span>{result.record_name}</span></li>
      <li><strong>Key type</strong><span>{result.key_type ?? "—"}</span></li>
      <li><strong>Public key</strong><span>{result.has_public_key ? "present" : "missing"}</span></li>
    </ul>
    <Recommendation locale={locale} value={result.recommendation} />
  </Panel>;
}

function DmarcResult({ locale, result }: { locale: Locale; result: DmarcCheckerResponse }) {
  return <Panel title={dictionary[locale].result}>
    <div className="metric-grid">
      <div><span>Policy</span><strong>{result.policy ?? "—"}</strong></div>
      <div><span>pct</span><strong>{result.percentage ?? "—"}</strong></div>
      <div><span>{dictionary[locale].status}</span><strong><StatusBadge value={result.status} /></strong></div>
    </div>
    <ul className="result-list">
      <li><strong>Record</strong><span>{result.record_name}</span></li>
      <li><strong>rua</strong><span>{result.has_rua ? "present" : "missing"}</span></li>
      <li><strong>Alignment</strong><span>{result.alignment_dkim ?? "r"} / {result.alignment_spf ?? "r"}</span></li>
    </ul>
    <Recommendation locale={locale} value={result.recommendation} />
  </Panel>;
}

function DnssecResult({ locale, result }: { locale: Locale; result: DnssecCheckerResponse }) {
  return <Panel title={dictionary[locale].result}>
    <div className="metric-grid">
      <div><span>DS</span><strong>{result.ds_record_count}</strong></div>
      <div><span>DNSKEY</span><strong>{result.dnskey_record_count}</strong></div>
      <div><span>{dictionary[locale].status}</span><strong><StatusBadge value={result.status} /></strong></div>
    </div>
    <ul className="result-list">
      <li><strong>Delegation signed</strong><span>{result.delegation_signed ? "yes" : "no"}</span></li>
      <li><strong>Zone DNSKEY</strong><span>{result.zone_dnskey_present ? "yes" : "no"}</span></li>
      <li><strong>Algorithms</strong><span>{result.algorithms.join(", ") || "—"}</span></li>
    </ul>
    <Recommendation locale={locale} value={result.recommendation} />
  </Panel>;
}

function NetworkDnsTool({
  locale,
  kind,
}: {
  locale: Locale;
  kind: "dns" | "mx" | "spf" | "dkim" | "dmarc" | "dnssec";
}) {
  const [result, setResult] = useState<NetworkDnsToolResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const endpoint = kind === "dns"
    ? "/api/tools/dns-lookup"
    : kind === "mx"
      ? "/api/tools/mx-records"
      : kind === "spf"
        ? "/api/tools/spf"
        : kind === "dkim"
          ? "/api/tools/dkim"
          : kind === "dmarc"
            ? "/api/tools/dmarc"
            : "/api/tools/dnssec";

  async function run(domain: string, selector?: string) {
    setLoading(true);
    setError("");
    try {
      setResult(await runNetworkDnsTool(endpoint, domain, selector ? { selector } : {}));
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "Tool request failed.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="tool-grid">
    {kind === "dkim"
      ? <DkimForm locale={locale} onSubmit={run} loading={loading} />
      : <DomainForm locale={locale} onSubmit={run} loading={loading} />}
    {error && <p className="form-error" role="alert">{error}</p>}
    {isDnsLookupResponse(result) && <DnsLookupResult locale={locale} result={result} />}
    {isMxCheckerResponse(result) && <MxResult locale={locale} result={result} />}
    {isSpfCheckerResponse(result) && <SpfResult locale={locale} result={result} />}
    {isDkimCheckerResponse(result) && <DkimResult locale={locale} result={result} />}
    {isDmarcCheckerResponse(result) && <DmarcResult locale={locale} result={result} />}
    {isDnssecCheckerResponse(result) && <DnssecResult locale={locale} result={result} />}
  </div>;
}

export function DnsLookupTool({ locale }: { locale: Locale }) {
  return <NetworkDnsTool locale={locale} kind="dns" />;
}

export function MxRecordCheckerTool({ locale }: { locale: Locale }) {
  return <NetworkDnsTool locale={locale} kind="mx" />;
}

export function SpfCheckerTool({ locale }: { locale: Locale }) {
  return <NetworkDnsTool locale={locale} kind="spf" />;
}

export function DkimCheckerTool({ locale }: { locale: Locale }) {
  return <NetworkDnsTool locale={locale} kind="dkim" />;
}

export function DmarcCheckerTool({ locale }: { locale: Locale }) {
  return <NetworkDnsTool locale={locale} kind="dmarc" />;
}

export function DnssecCheckerTool({ locale }: { locale: Locale }) {
  return <NetworkDnsTool locale={locale} kind="dnssec" />;
}
