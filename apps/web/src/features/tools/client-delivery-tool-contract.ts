export type ToolStatus = "pass" | "warning" | "fail";
export type FindingSeverity = "info" | "medium" | "high";
export type CspPolicySource = "header" | "report-only" | "meta";
export type ScriptHostClassification =
  | "analytics-pattern"
  | "tag-manager-pattern"
  | "advertising-pattern"
  | "social-pattern"
  | "cdn-pattern"
  | "other";
export type ResourceHintRel =
  | "preconnect"
  | "dns-prefetch"
  | "preload"
  | "prefetch"
  | "modulepreload"
  | "preinit";

export interface ToolApiErrorPayload {
  readonly detail: { readonly code: string; readonly message: string };
}

export interface CspDirectiveResult {
  readonly name: string;
  readonly values: readonly string[];
}

export interface CspPolicyResult {
  readonly source: CspPolicySource;
  readonly raw: string;
  readonly directive_count: number;
  readonly duplicate_directive_count: number;
  readonly directives: readonly CspDirectiveResult[];
}

export interface CspFindingResult {
  readonly id: string;
  readonly title: string;
  readonly severity: FindingSeverity;
  readonly source: CspPolicySource | "document";
  readonly directive: string | null;
  readonly value: string | null;
  readonly recommendation: string;
}

export interface CspAnalyzerResponse {
  readonly contract_version: "webdiag.tool.csp_analyzer.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly content_type: string | null;
  readonly enforced_policy_count: number;
  readonly report_only_policy_count: number;
  readonly meta_policy_count: number;
  readonly directive_count: number;
  readonly finding_count: number;
  readonly high_risk_finding_count: number;
  readonly policies: readonly CspPolicyResult[];
  readonly findings: readonly CspFindingResult[];
  readonly redirect_count: number;
  readonly truncated: boolean;
  readonly status: ToolStatus;
  readonly recommendation: string;
}

export interface ScriptItemResult {
  readonly position: number;
  readonly source_kind: "inline" | "external";
  readonly raw_src: string | null;
  readonly resolved_url: string | null;
  readonly hostname: string | null;
  readonly same_host: boolean | null;
  readonly cross_host_candidate: boolean;
  readonly host_classification: ScriptHostClassification | null;
  readonly async_attribute: boolean;
  readonly defer_attribute: boolean;
  readonly module: boolean;
  readonly nomodule: boolean;
  readonly parser_blocking_candidate: boolean;
  readonly integrity_present: boolean;
  readonly crossorigin_present: boolean;
  readonly issues: readonly string[];
}

export interface ScriptHostGroupResult {
  readonly hostname: string;
  readonly count: number;
  readonly classification: ScriptHostClassification;
}

export interface ThirdPartyScriptAnalyzerResponse {
  readonly contract_version: "webdiag.tool.third_party_script_analyzer.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly content_type: string | null;
  readonly scan_mode: "static_html_bounded";
  readonly classification_basis: "hostname";
  readonly script_count: number;
  readonly inline_script_count: number;
  readonly external_script_count: number;
  readonly same_host_script_count: number;
  readonly cross_host_script_count: number;
  readonly parser_blocking_candidate_count: number;
  readonly async_count: number;
  readonly defer_count: number;
  readonly module_count: number;
  readonly nomodule_count: number;
  readonly integrity_count: number;
  readonly crossorigin_count: number;
  readonly duplicate_src_count: number;
  readonly issue_count: number;
  readonly scripts: readonly ScriptItemResult[];
  readonly host_groups: readonly ScriptHostGroupResult[];
  readonly redirect_count: number;
  readonly truncated: boolean;
  readonly status: ToolStatus;
  readonly recommendation: string;
}

export interface ResourceHintItemResult {
  readonly position: number;
  readonly rel: ResourceHintRel;
  readonly raw_href: string | null;
  readonly resolved_url: string | null;
  readonly hostname: string | null;
  readonly same_host: boolean | null;
  readonly as_value: string | null;
  readonly type_value: string | null;
  readonly media: string | null;
  readonly crossorigin_present: boolean;
  readonly fetchpriority: string | null;
  readonly issues: readonly string[];
}

export interface ResourceHintFindingResult {
  readonly id: string;
  readonly title: string;
  readonly severity: "info" | "medium";
  readonly rel: ResourceHintRel | null;
  readonly value: string | null;
  readonly recommendation: string;
}

export interface ResourceHintsAnalyzerResponse {
  readonly contract_version: "webdiag.tool.resource_hints_analyzer.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly content_type: string | null;
  readonly scan_mode: "static_html_bounded";
  readonly hint_count: number;
  readonly preconnect_count: number;
  readonly dns_prefetch_count: number;
  readonly preload_count: number;
  readonly prefetch_count: number;
  readonly modulepreload_count: number;
  readonly preinit_count: number;
  readonly cross_host_hint_count: number;
  readonly duplicate_hint_count: number;
  readonly finding_count: number;
  readonly hints: readonly ResourceHintItemResult[];
  readonly findings: readonly ResourceHintFindingResult[];
  readonly redirect_count: number;
  readonly truncated: boolean;
  readonly status: ToolStatus;
  readonly recommendation: string;
}

export type ClientDeliveryToolResponse =
  | CspAnalyzerResponse
  | ThirdPartyScriptAnalyzerResponse
  | ResourceHintsAnalyzerResponse;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isNullableBoolean(value: unknown): value is boolean | null {
  return typeof value === "boolean" || value === null;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

function isHttpStatusCode(value: unknown): value is number {
  return isPositiveInteger(value) && value >= 100 && value <= 599;
}

function isStatus(value: unknown): value is ToolStatus {
  return value === "pass" || value === "warning" || value === "fail";
}

function isFindingSeverity(value: unknown): value is FindingSeverity {
  return value === "info" || value === "medium" || value === "high";
}

function isCspPolicySource(value: unknown): value is CspPolicySource {
  return value === "header" || value === "report-only" || value === "meta";
}

function isScriptHostClassification(value: unknown): value is ScriptHostClassification {
  return (
    value === "analytics-pattern" ||
    value === "tag-manager-pattern" ||
    value === "advertising-pattern" ||
    value === "social-pattern" ||
    value === "cdn-pattern" ||
    value === "other"
  );
}

function isResourceHintRel(value: unknown): value is ResourceHintRel {
  return (
    value === "preconnect" ||
    value === "dns-prefetch" ||
    value === "preload" ||
    value === "prefetch" ||
    value === "modulepreload" ||
    value === "preinit"
  );
}

function hasBaseResponseFields(payload: Record<string, unknown>): boolean {
  return (
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.final_url === "string" &&
    isHttpStatusCode(payload.status_code) &&
    isNullableString(payload.content_type) &&
    isNonNegativeInteger(payload.redirect_count) &&
    typeof payload.truncated === "boolean" &&
    isStatus(payload.status) &&
    typeof payload.recommendation === "string"
  );
}

function isCspDirectiveResult(value: unknown): value is CspDirectiveResult {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    isStringArray(value.values)
  );
}

function isCspPolicyResult(value: unknown): value is CspPolicyResult {
  return (
    isRecord(value) &&
    isCspPolicySource(value.source) &&
    typeof value.raw === "string" &&
    isNonNegativeInteger(value.directive_count) &&
    isNonNegativeInteger(value.duplicate_directive_count) &&
    Array.isArray(value.directives) &&
    value.directives.every(isCspDirectiveResult)
  );
}

function isCspFindingResult(value: unknown): value is CspFindingResult {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    isFindingSeverity(value.severity) &&
    (isCspPolicySource(value.source) || value.source === "document") &&
    isNullableString(value.directive) &&
    isNullableString(value.value) &&
    typeof value.recommendation === "string"
  );
}

export function isCspAnalyzerResponse(payload: unknown): payload is CspAnalyzerResponse {
  return (
    isRecord(payload) &&
    payload.contract_version === "webdiag.tool.csp_analyzer.v1" &&
    hasBaseResponseFields(payload) &&
    isNonNegativeInteger(payload.enforced_policy_count) &&
    isNonNegativeInteger(payload.report_only_policy_count) &&
    isNonNegativeInteger(payload.meta_policy_count) &&
    isNonNegativeInteger(payload.directive_count) &&
    isNonNegativeInteger(payload.finding_count) &&
    isNonNegativeInteger(payload.high_risk_finding_count) &&
    Array.isArray(payload.policies) &&
    payload.policies.every(isCspPolicyResult) &&
    Array.isArray(payload.findings) &&
    payload.findings.every(isCspFindingResult)
  );
}

function isScriptItemResult(value: unknown): value is ScriptItemResult {
  return (
    isRecord(value) &&
    isPositiveInteger(value.position) &&
    (value.source_kind === "inline" || value.source_kind === "external") &&
    isNullableString(value.raw_src) &&
    isNullableString(value.resolved_url) &&
    isNullableString(value.hostname) &&
    isNullableBoolean(value.same_host) &&
    typeof value.cross_host_candidate === "boolean" &&
    (value.host_classification === null ||
      isScriptHostClassification(value.host_classification)) &&
    typeof value.async_attribute === "boolean" &&
    typeof value.defer_attribute === "boolean" &&
    typeof value.module === "boolean" &&
    typeof value.nomodule === "boolean" &&
    typeof value.parser_blocking_candidate === "boolean" &&
    typeof value.integrity_present === "boolean" &&
    typeof value.crossorigin_present === "boolean" &&
    isStringArray(value.issues)
  );
}

function isScriptHostGroupResult(value: unknown): value is ScriptHostGroupResult {
  return (
    isRecord(value) &&
    typeof value.hostname === "string" &&
    isPositiveInteger(value.count) &&
    isScriptHostClassification(value.classification)
  );
}

export function isThirdPartyScriptAnalyzerResponse(
  payload: unknown,
): payload is ThirdPartyScriptAnalyzerResponse {
  return (
    isRecord(payload) &&
    payload.contract_version === "webdiag.tool.third_party_script_analyzer.v1" &&
    hasBaseResponseFields(payload) &&
    payload.scan_mode === "static_html_bounded" &&
    payload.classification_basis === "hostname" &&
    isNonNegativeInteger(payload.script_count) &&
    isNonNegativeInteger(payload.inline_script_count) &&
    isNonNegativeInteger(payload.external_script_count) &&
    isNonNegativeInteger(payload.same_host_script_count) &&
    isNonNegativeInteger(payload.cross_host_script_count) &&
    isNonNegativeInteger(payload.parser_blocking_candidate_count) &&
    isNonNegativeInteger(payload.async_count) &&
    isNonNegativeInteger(payload.defer_count) &&
    isNonNegativeInteger(payload.module_count) &&
    isNonNegativeInteger(payload.nomodule_count) &&
    isNonNegativeInteger(payload.integrity_count) &&
    isNonNegativeInteger(payload.crossorigin_count) &&
    isNonNegativeInteger(payload.duplicate_src_count) &&
    isNonNegativeInteger(payload.issue_count) &&
    Array.isArray(payload.scripts) &&
    payload.scripts.every(isScriptItemResult) &&
    Array.isArray(payload.host_groups) &&
    payload.host_groups.every(isScriptHostGroupResult)
  );
}

function isResourceHintItemResult(value: unknown): value is ResourceHintItemResult {
  return (
    isRecord(value) &&
    isPositiveInteger(value.position) &&
    isResourceHintRel(value.rel) &&
    isNullableString(value.raw_href) &&
    isNullableString(value.resolved_url) &&
    isNullableString(value.hostname) &&
    isNullableBoolean(value.same_host) &&
    isNullableString(value.as_value) &&
    isNullableString(value.type_value) &&
    isNullableString(value.media) &&
    typeof value.crossorigin_present === "boolean" &&
    isNullableString(value.fetchpriority) &&
    isStringArray(value.issues)
  );
}

function isResourceHintFindingResult(value: unknown): value is ResourceHintFindingResult {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    (value.severity === "info" || value.severity === "medium") &&
    (value.rel === null || isResourceHintRel(value.rel)) &&
    isNullableString(value.value) &&
    typeof value.recommendation === "string"
  );
}

export function isResourceHintsAnalyzerResponse(
  payload: unknown,
): payload is ResourceHintsAnalyzerResponse {
  return (
    isRecord(payload) &&
    payload.contract_version === "webdiag.tool.resource_hints_analyzer.v1" &&
    hasBaseResponseFields(payload) &&
    payload.scan_mode === "static_html_bounded" &&
    isNonNegativeInteger(payload.hint_count) &&
    isNonNegativeInteger(payload.preconnect_count) &&
    isNonNegativeInteger(payload.dns_prefetch_count) &&
    isNonNegativeInteger(payload.preload_count) &&
    isNonNegativeInteger(payload.prefetch_count) &&
    isNonNegativeInteger(payload.modulepreload_count) &&
    isNonNegativeInteger(payload.preinit_count) &&
    isNonNegativeInteger(payload.cross_host_hint_count) &&
    isNonNegativeInteger(payload.duplicate_hint_count) &&
    isNonNegativeInteger(payload.finding_count) &&
    Array.isArray(payload.hints) &&
    payload.hints.every(isResourceHintItemResult) &&
    Array.isArray(payload.findings) &&
    payload.findings.every(isResourceHintFindingResult)
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

export function parsePageUrlInput(value: string): string | null {
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    if (parsed.username || parsed.password) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}
