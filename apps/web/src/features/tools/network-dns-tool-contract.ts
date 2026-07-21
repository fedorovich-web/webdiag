export interface ToolApiErrorPayload {
  readonly detail: { readonly code: string; readonly message: string };
}

export interface DnsRecordResult {
  readonly record_type: string;
  readonly name: string;
  readonly value: string;
  readonly ttl: number;
  readonly priority: number | null;
}

export interface DnsLookupResponse {
  readonly contract_version: "webdiag.tool.dns_lookup.v1";
  readonly generated_at: string;
  readonly domain: string;
  readonly checked_record_types: readonly string[];
  readonly record_count: number;
  readonly records: readonly DnsRecordResult[];
  readonly errors: readonly unknown[];
  readonly recommendation: string;
}

export interface MxHostResult {
  readonly host: string;
  readonly priority: number;
  readonly address_count: number;
  readonly addresses: readonly string[];
  readonly reachable_dns: boolean;
}

export interface MxCheckerResponse {
  readonly contract_version: "webdiag.tool.mx_record_checker.v1";
  readonly generated_at: string;
  readonly domain: string;
  readonly mx_count: number;
  readonly has_null_mx: boolean;
  readonly hosts: readonly MxHostResult[];
  readonly status: "pass" | "warning" | "fail";
  readonly recommendation: string;
}

export interface SpfCheckerResponse {
  readonly contract_version: "webdiag.tool.spf_checker.v1";
  readonly generated_at: string;
  readonly domain: string;
  readonly spf_record_count: number;
  readonly spf_record: string | null;
  readonly mechanisms: readonly unknown[];
  readonly has_all_mechanism: boolean;
  readonly all_mechanism: string | null;
  readonly uses_include: boolean;
  readonly uses_redirect: boolean;
  readonly estimated_dns_lookup_mechanisms: number;
  readonly status: "pass" | "warning" | "fail";
  readonly recommendation: string;
}

export type NetworkDnsToolResponse = DnsLookupResponse | MxCheckerResponse | SpfCheckerResponse;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function isToolErrorPayload(payload: unknown): payload is ToolApiErrorPayload {
  return (
    isRecord(payload) &&
    isRecord(payload.detail) &&
    typeof payload.detail.code === "string" &&
    typeof payload.detail.message === "string"
  );
}

export function isDnsLookupResponse(payload: unknown): payload is DnsLookupResponse {
  return (
    isRecord(payload) &&
    payload.contract_version === "webdiag.tool.dns_lookup.v1" &&
    typeof payload.generated_at === "string" &&
    typeof payload.domain === "string" &&
    Array.isArray(payload.checked_record_types) &&
    typeof payload.record_count === "number" &&
    Array.isArray(payload.records) &&
    Array.isArray(payload.errors) &&
    typeof payload.recommendation === "string"
  );
}

export function isMxCheckerResponse(payload: unknown): payload is MxCheckerResponse {
  return (
    isRecord(payload) &&
    payload.contract_version === "webdiag.tool.mx_record_checker.v1" &&
    typeof payload.generated_at === "string" &&
    typeof payload.domain === "string" &&
    typeof payload.mx_count === "number" &&
    typeof payload.has_null_mx === "boolean" &&
    Array.isArray(payload.hosts) &&
    (payload.status === "pass" || payload.status === "warning" || payload.status === "fail") &&
    typeof payload.recommendation === "string"
  );
}

export function isSpfCheckerResponse(payload: unknown): payload is SpfCheckerResponse {
  return (
    isRecord(payload) &&
    payload.contract_version === "webdiag.tool.spf_checker.v1" &&
    typeof payload.generated_at === "string" &&
    typeof payload.domain === "string" &&
    typeof payload.spf_record_count === "number" &&
    (typeof payload.spf_record === "string" || payload.spf_record === null) &&
    Array.isArray(payload.mechanisms) &&
    typeof payload.has_all_mechanism === "boolean" &&
    (typeof payload.all_mechanism === "string" || payload.all_mechanism === null) &&
    typeof payload.uses_include === "boolean" &&
    typeof payload.uses_redirect === "boolean" &&
    typeof payload.estimated_dns_lookup_mechanisms === "number" &&
    (payload.status === "pass" || payload.status === "warning" || payload.status === "fail") &&
    typeof payload.recommendation === "string"
  );
}

export function parseDomainInput(value: string): string | null {
  const trimmed = value.trim().replace(/\.$/, "").toLowerCase();
  if (!trimmed || trimmed.includes("://") || trimmed.includes("/") || trimmed.includes("#")) {
    return null;
  }
  if (!/^[a-z0-9.-]+$/i.test(trimmed)) return null;
  const labels = trimmed.split(".");
  if (labels.length < 2) return null;
  if (labels.some((label) => !label || label.length > 63)) return null;
  if (labels.some((label) => label.startsWith("-") || label.endsWith("-"))) return null;
  return trimmed;
}
