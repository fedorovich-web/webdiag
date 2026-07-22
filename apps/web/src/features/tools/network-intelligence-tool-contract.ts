export type ToolStatus = "pass" | "warning" | "fail";
export type ResolverStatus = "ok" | "error";
export type ComparisonRecordType = "A" | "AAAA" | "CNAME" | "MX" | "NS" | "TXT";

export interface ToolApiErrorPayload {
  readonly detail: { readonly code: string; readonly message: string };
}

export interface ResolverAnswer {
  readonly value: string;
  readonly ttl: number;
  readonly priority: number | null;
}

export interface ResolverSnapshot {
  readonly resolver_id: string;
  readonly resolver_name: string;
  readonly nameserver: string;
  readonly status: ResolverStatus;
  readonly elapsed_ms: number;
  readonly answer_count: number;
  readonly answers: readonly ResolverAnswer[];
  readonly error: string | null;
}

export interface DnsResolverComparisonResponse {
  readonly contract_version: "webdiag.tool.dns_resolver_comparison.v1";
  readonly generated_at: string;
  readonly domain: string;
  readonly record_type: ComparisonRecordType;
  readonly resolver_count: number;
  readonly successful_resolver_count: number;
  readonly distinct_answer_set_count: number;
  readonly consistent: boolean;
  readonly timing_scope: "backend_to_resolver";
  readonly snapshots: readonly ResolverSnapshot[];
  readonly status: ToolStatus;
  readonly recommendation: string;
}

export interface RdapEvent {
  readonly action:
    | "registration"
    | "expiration"
    | "last changed"
    | "last update of RDAP database"
    | "transfer"
    | "reinstantiation"
    | "other";
  readonly raw_action: string;
  readonly date: string;
}

export interface RdapNameserver {
  readonly ldh_name: string | null;
  readonly unicode_name: string | null;
  readonly statuses: readonly string[];
}

export interface DomainRdapResponse {
  readonly contract_version: "webdiag.tool.domain_rdap_lookup.v1";
  readonly generated_at: string;
  readonly domain: string;
  readonly found: boolean;
  readonly bootstrap_source: "iana_rdap_dns_bootstrap";
  readonly rdap_url: string | null;
  readonly handle: string | null;
  readonly ldh_name: string | null;
  readonly unicode_name: string | null;
  readonly statuses: readonly string[];
  readonly events: readonly RdapEvent[];
  readonly nameservers: readonly RdapNameserver[];
  readonly registrar_name: string | null;
  readonly abuse_email: string | null;
  readonly delegation_signed: boolean | null;
  readonly notice_titles: readonly string[];
  readonly status: ToolStatus;
  readonly recommendation: string;
}

export interface IpRdapCidr {
  readonly version: "v4" | "v6";
  readonly prefix: string;
  readonly length: number;
}

export interface IpRdapResponse {
  readonly contract_version: "webdiag.tool.ip_rdap_lookup.v1";
  readonly generated_at: string;
  readonly ip: string;
  readonly found: boolean;
  readonly bootstrap_source: "iana_rdap_ip_bootstrap";
  readonly country_semantics: "registration_data_not_geolocation";
  readonly rdap_url: string | null;
  readonly handle: string | null;
  readonly start_address: string | null;
  readonly end_address: string | null;
  readonly ip_version: string | null;
  readonly name: string | null;
  readonly network_type: string | null;
  readonly country: string | null;
  readonly parent_handle: string | null;
  readonly statuses: readonly string[];
  readonly events: readonly RdapEvent[];
  readonly cidrs: readonly IpRdapCidr[];
  readonly abuse_email: string | null;
  readonly status: ToolStatus;
  readonly recommendation: string;
}

export type NetworkIntelligenceResponse =
  | DnsResolverComparisonResponse
  | DomainRdapResponse
  | IpRdapResponse;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isToolStatus(value: unknown): value is ToolStatus {
  return value === "pass" || value === "warning" || value === "fail";
}

function isComparisonRecordType(value: unknown): value is ComparisonRecordType {
  return value === "A" || value === "AAAA" || value === "CNAME" || value === "MX" || value === "NS" || value === "TXT";
}

function isRdapEvent(value: unknown): value is RdapEvent {
  return (
    isRecord(value) &&
    (value.action === "registration" ||
      value.action === "expiration" ||
      value.action === "last changed" ||
      value.action === "last update of RDAP database" ||
      value.action === "transfer" ||
      value.action === "reinstantiation" ||
      value.action === "other") &&
    typeof value.raw_action === "string" &&
    typeof value.date === "string"
  );
}

function isResolverAnswer(value: unknown): value is ResolverAnswer {
  return (
    isRecord(value) &&
    typeof value.value === "string" &&
    isNonNegativeInteger(value.ttl) &&
    (value.priority === null || isNonNegativeInteger(value.priority))
  );
}

function isResolverSnapshot(value: unknown): value is ResolverSnapshot {
  return (
    isRecord(value) &&
    typeof value.resolver_id === "string" &&
    typeof value.resolver_name === "string" &&
    typeof value.nameserver === "string" &&
    (value.status === "ok" || value.status === "error") &&
    isNonNegativeInteger(value.elapsed_ms) &&
    isNonNegativeInteger(value.answer_count) &&
    Array.isArray(value.answers) &&
    value.answers.every(isResolverAnswer) &&
    isNullableString(value.error)
  );
}

function isRdapNameserver(value: unknown): value is RdapNameserver {
  return (
    isRecord(value) &&
    isNullableString(value.ldh_name) &&
    isNullableString(value.unicode_name) &&
    isStringArray(value.statuses)
  );
}

function isIpRdapCidr(value: unknown): value is IpRdapCidr {
  return (
    isRecord(value) &&
    (value.version === "v4" || value.version === "v6") &&
    typeof value.prefix === "string" &&
    isNonNegativeInteger(value.length)
  );
}

export function isToolErrorPayload(payload: unknown): payload is ToolApiErrorPayload {
  return (
    isRecord(payload) &&
    isRecord(payload.detail) &&
    typeof payload.detail.code === "string" &&
    typeof payload.detail.message === "string"
  );
}

export function isDnsResolverComparisonResponse(
  payload: unknown,
): payload is DnsResolverComparisonResponse {
  return (
    isRecord(payload) &&
    payload.contract_version === "webdiag.tool.dns_resolver_comparison.v1" &&
    typeof payload.generated_at === "string" &&
    typeof payload.domain === "string" &&
    isComparisonRecordType(payload.record_type) &&
    isNonNegativeInteger(payload.resolver_count) &&
    isNonNegativeInteger(payload.successful_resolver_count) &&
    isNonNegativeInteger(payload.distinct_answer_set_count) &&
    typeof payload.consistent === "boolean" &&
    payload.timing_scope === "backend_to_resolver" &&
    Array.isArray(payload.snapshots) &&
    payload.snapshots.every(isResolverSnapshot) &&
    isToolStatus(payload.status) &&
    typeof payload.recommendation === "string"
  );
}

export function isDomainRdapResponse(payload: unknown): payload is DomainRdapResponse {
  return (
    isRecord(payload) &&
    payload.contract_version === "webdiag.tool.domain_rdap_lookup.v1" &&
    typeof payload.generated_at === "string" &&
    typeof payload.domain === "string" &&
    typeof payload.found === "boolean" &&
    payload.bootstrap_source === "iana_rdap_dns_bootstrap" &&
    isNullableString(payload.rdap_url) &&
    isNullableString(payload.handle) &&
    isNullableString(payload.ldh_name) &&
    isNullableString(payload.unicode_name) &&
    isStringArray(payload.statuses) &&
    Array.isArray(payload.events) &&
    payload.events.every(isRdapEvent) &&
    Array.isArray(payload.nameservers) &&
    payload.nameservers.every(isRdapNameserver) &&
    isNullableString(payload.registrar_name) &&
    isNullableString(payload.abuse_email) &&
    (payload.delegation_signed === null || typeof payload.delegation_signed === "boolean") &&
    isStringArray(payload.notice_titles) &&
    isToolStatus(payload.status) &&
    typeof payload.recommendation === "string"
  );
}

export function isIpRdapResponse(payload: unknown): payload is IpRdapResponse {
  return (
    isRecord(payload) &&
    payload.contract_version === "webdiag.tool.ip_rdap_lookup.v1" &&
    typeof payload.generated_at === "string" &&
    typeof payload.ip === "string" &&
    typeof payload.found === "boolean" &&
    payload.bootstrap_source === "iana_rdap_ip_bootstrap" &&
    payload.country_semantics === "registration_data_not_geolocation" &&
    isNullableString(payload.rdap_url) &&
    isNullableString(payload.handle) &&
    isNullableString(payload.start_address) &&
    isNullableString(payload.end_address) &&
    isNullableString(payload.ip_version) &&
    isNullableString(payload.name) &&
    isNullableString(payload.network_type) &&
    isNullableString(payload.country) &&
    isNullableString(payload.parent_handle) &&
    isStringArray(payload.statuses) &&
    Array.isArray(payload.events) &&
    payload.events.every(isRdapEvent) &&
    Array.isArray(payload.cidrs) &&
    payload.cidrs.every(isIpRdapCidr) &&
    isNullableString(payload.abuse_email) &&
    isToolStatus(payload.status) &&
    typeof payload.recommendation === "string"
  );
}

export function parseDomainInput(value: string): string | null {
  const normalized = value.trim().toLowerCase().replace(/\.$/, "");
  if (!normalized || normalized.length > 253) return null;
  if (normalized.includes("://") || /[/?#@]/u.test(normalized)) return null;
  const labels = normalized.split(".");
  if (labels.length < 2) return null;
  if (labels.some((label) => !label || label.length > 63 || !/^[a-z0-9-]+$/u.test(label))) return null;
  if (labels.some((label) => label.startsWith("-") || label.endsWith("-"))) return null;
  return normalized;
}

export function parsePublicIpInput(value: string): string | null {
  const normalized = value.trim();
  if (!normalized || normalized.length > 64 || /\s/u.test(normalized)) return null;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/u.test(normalized)) {
    const parts = normalized.split(".").map(Number);
    if (parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)) {
      return parts.join(".");
    }
    return null;
  }
  if (normalized.includes(":") && /^[0-9a-f:]+$/iu.test(normalized)) return normalized.toLowerCase();
  return null;
}
