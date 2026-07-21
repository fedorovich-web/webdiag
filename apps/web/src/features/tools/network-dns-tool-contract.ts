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

export interface MailPolicyTagResult {
  readonly name: string;
  readonly value: string;
}

export interface DkimCheckerResponse {
  readonly contract_version: "webdiag.tool.dkim_checker.v1";
  readonly generated_at: string;
  readonly domain: string;
  readonly selector: string;
  readonly record_name: string;
  readonly dkim_record_count: number;
  readonly dkim_record: string | null;
  readonly tags: readonly MailPolicyTagResult[];
  readonly key_type: string | null;
  readonly has_public_key: boolean;
  readonly public_key_length: number;
  readonly status: "pass" | "warning" | "fail";
  readonly recommendation: string;
}

export interface DmarcCheckerResponse {
  readonly contract_version: "webdiag.tool.dmarc_checker.v1";
  readonly generated_at: string;
  readonly domain: string;
  readonly record_name: string;
  readonly dmarc_record_count: number;
  readonly dmarc_record: string | null;
  readonly tags: readonly MailPolicyTagResult[];
  readonly policy: string | null;
  readonly subdomain_policy: string | null;
  readonly percentage: number | null;
  readonly has_rua: boolean;
  readonly has_ruf: boolean;
  readonly alignment_dkim: string | null;
  readonly alignment_spf: string | null;
  readonly status: "pass" | "warning" | "fail";
  readonly recommendation: string;
}

export interface DnssecCheckerResponse {
  readonly contract_version: "webdiag.tool.dnssec_checker.v1";
  readonly generated_at: string;
  readonly domain: string;
  readonly ds_record_count: number;
  readonly dnskey_record_count: number;
  readonly ds_records: readonly DnsRecordResult[];
  readonly dnskey_records: readonly DnsRecordResult[];
  readonly delegation_signed: boolean;
  readonly zone_dnskey_present: boolean;
  readonly algorithms: readonly string[];
  readonly status: "pass" | "warning" | "fail";
  readonly recommendation: string;
}

export type NetworkDnsToolResponse =
  | DnsLookupResponse
  | MxCheckerResponse
  | SpfCheckerResponse
  | DkimCheckerResponse
  | DmarcCheckerResponse
  | DnssecCheckerResponse;

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

export function isDkimCheckerResponse(payload: unknown): payload is DkimCheckerResponse {
  return (
    isRecord(payload) &&
    payload.contract_version === "webdiag.tool.dkim_checker.v1" &&
    typeof payload.generated_at === "string" &&
    typeof payload.domain === "string" &&
    typeof payload.selector === "string" &&
    typeof payload.record_name === "string" &&
    typeof payload.dkim_record_count === "number" &&
    (typeof payload.dkim_record === "string" || payload.dkim_record === null) &&
    Array.isArray(payload.tags) &&
    (typeof payload.key_type === "string" || payload.key_type === null) &&
    typeof payload.has_public_key === "boolean" &&
    typeof payload.public_key_length === "number" &&
    (payload.status === "pass" || payload.status === "warning" || payload.status === "fail") &&
    typeof payload.recommendation === "string"
  );
}

export function isDmarcCheckerResponse(payload: unknown): payload is DmarcCheckerResponse {
  return (
    isRecord(payload) &&
    payload.contract_version === "webdiag.tool.dmarc_checker.v1" &&
    typeof payload.generated_at === "string" &&
    typeof payload.domain === "string" &&
    typeof payload.record_name === "string" &&
    typeof payload.dmarc_record_count === "number" &&
    (typeof payload.dmarc_record === "string" || payload.dmarc_record === null) &&
    Array.isArray(payload.tags) &&
    (typeof payload.policy === "string" || payload.policy === null) &&
    (typeof payload.subdomain_policy === "string" || payload.subdomain_policy === null) &&
    (typeof payload.percentage === "number" || payload.percentage === null) &&
    typeof payload.has_rua === "boolean" &&
    typeof payload.has_ruf === "boolean" &&
    (typeof payload.alignment_dkim === "string" || payload.alignment_dkim === null) &&
    (typeof payload.alignment_spf === "string" || payload.alignment_spf === null) &&
    (payload.status === "pass" || payload.status === "warning" || payload.status === "fail") &&
    typeof payload.recommendation === "string"
  );
}

export function isDnssecCheckerResponse(payload: unknown): payload is DnssecCheckerResponse {
  return (
    isRecord(payload) &&
    payload.contract_version === "webdiag.tool.dnssec_checker.v1" &&
    typeof payload.generated_at === "string" &&
    typeof payload.domain === "string" &&
    typeof payload.ds_record_count === "number" &&
    typeof payload.dnskey_record_count === "number" &&
    Array.isArray(payload.ds_records) &&
    Array.isArray(payload.dnskey_records) &&
    typeof payload.delegation_signed === "boolean" &&
    typeof payload.zone_dnskey_present === "boolean" &&
    Array.isArray(payload.algorithms) &&
    (payload.status === "pass" || payload.status === "warning" || payload.status === "fail") &&
    typeof payload.recommendation === "string"
  );
}

export function parseDkimSelectorInput(value: string): string | null {
  const trimmed = value.trim().replace(/\.$/, "").toLowerCase();
  if (!trimmed || trimmed.length > 120 || trimmed.includes("/")) return null;
  if (!/^[a-z0-9._-]+$/i.test(trimmed)) return null;
  if (trimmed.startsWith(".") || trimmed.endsWith(".") || trimmed.includes("..")) return null;
  return trimmed;
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
