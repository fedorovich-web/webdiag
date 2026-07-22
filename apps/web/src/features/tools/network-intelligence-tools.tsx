"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { CopyButton } from "../../components/copy-button";
import {
  isDnsResolverComparisonResponse,
  isDomainRdapResponse,
  isIpRdapResponse,
  isToolErrorPayload,
  parseDomainInput,
  parsePublicIpInput,
  type ComparisonRecordType,
  type DnsResolverComparisonResponse,
  type DomainRdapResponse,
  type IpRdapResponse,
  type NetworkIntelligenceResponse,
} from "./network-intelligence-tool-contract";

class NetworkIntelligenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkIntelligenceError";
  }
}

const dictionary = {
  ru: {
    domain: "Домен",
    ip: "Публичный IP-адрес",
    recordType: "Тип DNS-записи",
    run: "Проверить",
    loading: "Проверяем…",
    result: "Результат",
    recommendation: "Рекомендация",
    invalidDomain: "Введите домен без протокола, пути и IP-адреса.",
    invalidIp: "Введите корректный публичный IPv4 или IPv6 адрес.",
    status: "Статус",
    found: "Запись найдена",
    yes: "Да",
    no: "Нет",
    copy: "Копировать отчёт",
  },
  en: {
    domain: "Domain",
    ip: "Public IP address",
    recordType: "DNS record type",
    run: "Check",
    loading: "Checking…",
    result: "Result",
    recommendation: "Recommendation",
    invalidDomain: "Enter a domain without protocol, path, or IP address.",
    invalidIp: "Enter a valid public IPv4 or IPv6 address.",
    status: "Status",
    found: "Record found",
    yes: "Yes",
    no: "No",
    copy: "Copy report",
  },
} as const;

const recordTypes: readonly ComparisonRecordType[] = ["A", "AAAA", "CNAME", "MX", "NS", "TXT"];

type Endpoint = "/api/tools/dns-resolver-comparison" | "/api/tools/domain-rdap" | "/api/tools/ip-rdap";

async function runTool(endpoint: Endpoint, body: Record<string, string>): Promise<NetworkIntelligenceResponse> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (isToolErrorPayload(payload)) throw new NetworkIntelligenceError(payload.detail.message);
    throw new NetworkIntelligenceError("Tool API request failed.");
  }
  if (endpoint === "/api/tools/dns-resolver-comparison" && isDnsResolverComparisonResponse(payload)) return payload;
  if (endpoint === "/api/tools/domain-rdap" && isDomainRdapResponse(payload)) return payload;
  if (endpoint === "/api/tools/ip-rdap" && isIpRdapResponse(payload)) return payload;
  throw new NetworkIntelligenceError("Tool API returned an invalid response contract.");
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="tool-panel"><h2>{title}</h2>{children}</section>;
}

function StatusBadge({ value }: { value: "pass" | "warning" | "fail" }) {
  return <span className={`tool-status tool-status-${value}`}>{value}</span>;
}

function Recommendation({ locale, value }: { locale: Locale; value: string }) {
  return <p className="tool-note"><strong>{dictionary[locale].recommendation}:</strong> {value}</p>;
}

function CopyReport({ locale, value }: { locale: Locale; value: string }) {
  return <div className="output-wrap"><pre className="output">{value}</pre><CopyButton value={value} locale={locale} /></div>;
}

export function dnsResolverComparisonResultText(result: DnsResolverComparisonResponse): string {
  return [
    `Domain: ${result.domain}`,
    `Record type: ${result.record_type}`,
    `Resolvers: ${result.successful_resolver_count}/${result.resolver_count}`,
    `Distinct answer sets: ${result.distinct_answer_set_count}`,
    `Consistent snapshot: ${result.consistent}`,
    `Timing scope: ${result.timing_scope}`,
    `Status: ${result.status}`,
    `Recommendation: ${result.recommendation}`,
  ].join("\n");
}

export function domainRdapResultText(result: DomainRdapResponse): string {
  return [
    `Domain: ${result.domain}`,
    `Found: ${result.found}`,
    `Handle: ${result.handle ?? "—"}`,
    `Registrar: ${result.registrar_name ?? "—"}`,
    `Statuses: ${result.statuses.join(", ") || "—"}`,
    `Nameservers: ${result.nameservers.length}`,
    `Delegation signed: ${result.delegation_signed ?? "—"}`,
    `Status: ${result.status}`,
    `Recommendation: ${result.recommendation}`,
  ].join("\n");
}

export function ipRdapResultText(result: IpRdapResponse): string {
  return [
    `IP: ${result.ip}`,
    `Found: ${result.found}`,
    `Network: ${result.name ?? "—"}`,
    `Range: ${result.start_address ?? "—"} — ${result.end_address ?? "—"}`,
    `Country field: ${result.country ?? "—"}`,
    `Country semantics: ${result.country_semantics}`,
    `CIDRs: ${result.cidrs.map((item) => `${item.prefix}/${item.length}`).join(", ") || "—"}`,
    `Status: ${result.status}`,
    `Recommendation: ${result.recommendation}`,
  ].join("\n");
}

function DnsComparisonResult({ locale, result }: { locale: Locale; result: DnsResolverComparisonResponse }) {
  return <Panel title={dictionary[locale].result}>
    <div className="metric-grid">
      <div><span>{dictionary[locale].status}</span><strong><StatusBadge value={result.status} /></strong></div>
      <div><span>Resolvers</span><strong>{result.successful_resolver_count}/{result.resolver_count}</strong></div>
      <div><span>Answer sets</span><strong>{result.distinct_answer_set_count}</strong></div>
      <div><span>Consistent</span><strong>{result.consistent ? dictionary[locale].yes : dictionary[locale].no}</strong></div>
    </div>
    <ul className="result-list">
      {result.snapshots.map((snapshot) => <li key={snapshot.resolver_id}>
        <strong>{snapshot.resolver_name}</strong> · {snapshot.nameserver} · {snapshot.elapsed_ms} ms · {snapshot.status}
        {snapshot.answers.length > 0 && <ul>{snapshot.answers.map((answer, index) => <li key={`${snapshot.resolver_id}-${index}`}>{answer.value} · TTL {answer.ttl}s{answer.priority !== null ? ` · priority ${answer.priority}` : ""}</li>)}</ul>}
        {snapshot.error && <p className="form-error">{snapshot.error}</p>}
      </li>)}
    </ul>
    <p className="tool-note">{locale === "ru" ? "Время измерено от backend WebDiag до resolver, а не от вашего браузера." : "Timing is measured from the WebDiag backend to the resolver, not from your browser."}</p>
    <Recommendation locale={locale} value={result.recommendation} />
    <CopyReport locale={locale} value={dnsResolverComparisonResultText(result)} />
  </Panel>;
}

function DomainRdapResultView({ locale, result }: { locale: Locale; result: DomainRdapResponse }) {
  return <Panel title={dictionary[locale].result}>
    <div className="metric-grid">
      <div><span>{dictionary[locale].found}</span><strong>{result.found ? dictionary[locale].yes : dictionary[locale].no}</strong></div>
      <div><span>{dictionary[locale].status}</span><strong><StatusBadge value={result.status} /></strong></div>
      <div><span>Registrar</span><strong>{result.registrar_name ?? "—"}</strong></div>
      <div><span>DNSSEC</span><strong>{result.delegation_signed === null ? "—" : result.delegation_signed ? dictionary[locale].yes : dictionary[locale].no}</strong></div>
    </div>
    {result.found && <>
      <ul className="result-list">
        <li><strong>Handle</strong> {result.handle ?? "—"}</li>
        <li><strong>LDH name</strong> {result.ldh_name ?? "—"}</li>
        <li><strong>Statuses</strong> {result.statuses.join(", ") || "—"}</li>
        <li><strong>Abuse contact</strong> {result.abuse_email ?? "—"}</li>
      </ul>
      {result.events.length > 0 && <><h3>Events</h3><ul className="result-list">{result.events.map((event, index) => <li key={`${event.raw_action}-${index}`}><strong>{event.raw_action}</strong> {event.date}</li>)}</ul></>}
      {result.nameservers.length > 0 && <><h3>Nameservers</h3><ul className="result-list">{result.nameservers.map((item, index) => <li key={`${item.ldh_name}-${index}`}>{item.ldh_name ?? item.unicode_name ?? "—"}</li>)}</ul></>}
    </>}
    <Recommendation locale={locale} value={result.recommendation} />
    <CopyReport locale={locale} value={domainRdapResultText(result)} />
  </Panel>;
}

function IpRdapResultView({ locale, result }: { locale: Locale; result: IpRdapResponse }) {
  return <Panel title={dictionary[locale].result}>
    <div className="metric-grid">
      <div><span>{dictionary[locale].found}</span><strong>{result.found ? dictionary[locale].yes : dictionary[locale].no}</strong></div>
      <div><span>{dictionary[locale].status}</span><strong><StatusBadge value={result.status} /></strong></div>
      <div><span>Network</span><strong>{result.name ?? "—"}</strong></div>
      <div><span>Country</span><strong>{result.country ?? "—"}</strong></div>
    </div>
    {result.found && <ul className="result-list">
      <li><strong>Handle</strong> {result.handle ?? "—"}</li>
      <li><strong>Range</strong> {result.start_address ?? "—"} — {result.end_address ?? "—"}</li>
      <li><strong>Type</strong> {result.network_type ?? "—"}</li>
      <li><strong>CIDR</strong> {result.cidrs.map((item) => `${item.prefix}/${item.length}`).join(", ") || "—"}</li>
      <li><strong>Abuse contact</strong> {result.abuse_email ?? "—"}</li>
    </ul>}
    <p className="tool-note">{locale === "ru" ? "Поле country относится к registry allocation и не является геолокацией устройства." : "The country field describes registry allocation and is not device geolocation."}</p>
    <Recommendation locale={locale} value={result.recommendation} />
    <CopyReport locale={locale} value={ipRdapResultText(result)} />
  </Panel>;
}

export function DnsResolverComparisonTool({ locale }: { locale: Locale }) {
  const [domain, setDomain] = useState("example.com");
  const [recordType, setRecordType] = useState<ComparisonRecordType>("A");
  const [result, setResult] = useState<DnsResolverComparisonResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseDomainInput(domain);
    if (!parsed) { setError(dictionary[locale].invalidDomain); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const value = await runTool("/api/tools/dns-resolver-comparison", { domain: parsed, record_type: recordType });
      if (!isDnsResolverComparisonResponse(value)) throw new NetworkIntelligenceError("Invalid result.");
      setResult(value);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Tool failed.");
    } finally { setLoading(false); }
  }

  return <div className="tool-grid"><Panel title={dictionary[locale].domain}><form className="tool-form" onSubmit={submit}>
    <label className="field"><span>{dictionary[locale].domain}</span><input value={domain} onChange={(event) => setDomain(event.target.value)} /></label>
    <label className="field"><span>{dictionary[locale].recordType}</span><select value={recordType} onChange={(event) => setRecordType(event.target.value as ComparisonRecordType)}>{recordTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button" disabled={loading}>{loading ? dictionary[locale].loading : dictionary[locale].run}</button>
  </form></Panel>{result && <DnsComparisonResult locale={locale} result={result} />}</div>;
}

export function DomainRdapLookupTool({ locale }: { locale: Locale }) {
  const [domain, setDomain] = useState("example.com");
  const [result, setResult] = useState<DomainRdapResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseDomainInput(domain);
    if (!parsed) { setError(dictionary[locale].invalidDomain); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const value = await runTool("/api/tools/domain-rdap", { domain: parsed });
      if (!isDomainRdapResponse(value)) throw new NetworkIntelligenceError("Invalid result.");
      setResult(value);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Tool failed.");
    } finally { setLoading(false); }
  }

  return <div className="tool-grid"><Panel title={dictionary[locale].domain}><form className="tool-form" onSubmit={submit}>
    <label className="field"><span>{dictionary[locale].domain}</span><input value={domain} onChange={(event) => setDomain(event.target.value)} /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button" disabled={loading}>{loading ? dictionary[locale].loading : dictionary[locale].run}</button>
  </form></Panel>{result && <DomainRdapResultView locale={locale} result={result} />}</div>;
}

export function IpRdapLookupTool({ locale }: { locale: Locale }) {
  const [ip, setIp] = useState("8.8.8.8");
  const [result, setResult] = useState<IpRdapResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parsePublicIpInput(ip);
    if (!parsed) { setError(dictionary[locale].invalidIp); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const value = await runTool("/api/tools/ip-rdap", { ip: parsed });
      if (!isIpRdapResponse(value)) throw new NetworkIntelligenceError("Invalid result.");
      setResult(value);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Tool failed.");
    } finally { setLoading(false); }
  }

  return <div className="tool-grid"><Panel title={dictionary[locale].ip}><form className="tool-form" onSubmit={submit}>
    <label className="field"><span>{dictionary[locale].ip}</span><input value={ip} onChange={(event) => setIp(event.target.value)} /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button" disabled={loading}>{loading ? dictionary[locale].loading : dictionary[locale].run}</button>
  </form></Panel>{result && <IpRdapResultView locale={locale} result={result} />}</div>;
}
