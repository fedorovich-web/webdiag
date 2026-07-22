import type { ToolStatus } from "./client-delivery-tool-contract";

export type RedirectMapFetchState = "ok" | "rejected" | "failed" | "not_checked";
export type RedirectMapFindingSeverity = "info" | "medium" | "high";

export interface RedirectMapInputEntry {
  readonly source_url: string;
  readonly target_url: string;
  readonly expected_status_code?: number;
}

export interface RedirectMapFindingResult {
  readonly id: string;
  readonly title: string;
  readonly severity: RedirectMapFindingSeverity;
  readonly value: string | null;
  readonly recommendation: string;
}

export interface RedirectMapEntryResult {
  readonly position: number;
  readonly source_url: string;
  readonly target_url: string;
  readonly expected_status_code: number | null;
  readonly normalized_source_url: string | null;
  readonly normalized_target_url: string | null;
  readonly fetch_state: RedirectMapFetchState;
  readonly observed_first_status_code: number | null;
  readonly observed_first_target_url: string | null;
  readonly final_url: string | null;
  readonly redirect_count: number;
  readonly target_matches: boolean | null;
  readonly status_matches: boolean | null;
  readonly issues: readonly string[];
  readonly status: ToolStatus;
}

export interface RedirectMapResponse {
  readonly contract_version: "webdiag.tool.redirect_map_validator.v1";
  readonly generated_at: string;
  readonly scan_mode: "explicit_map_bounded_safe_fetch";
  readonly entry_count: number;
  readonly checked_count: number;
  readonly matched_count: number;
  readonly mismatch_count: number;
  readonly failed_count: number;
  readonly duplicate_source_count: number;
  readonly conflicting_source_count: number;
  readonly self_redirect_count: number;
  readonly chain_source_count: number;
  readonly cycle_count: number;
  readonly issue_count: number;
  readonly entries: readonly RedirectMapEntryResult[];
  readonly findings: readonly RedirectMapFindingResult[];
  readonly status: ToolStatus;
  readonly recommendation: string;
}

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

function isNullableHttpStatus(value: unknown): value is number | null {
  return value === null
    || (isNonNegativeInteger(value) && value >= 100 && value <= 599);
}

function isNullableRedirectStatus(value: unknown): value is number | null {
  return value === null
    || (isNonNegativeInteger(value) && value >= 300 && value <= 399);
}

function isToolStatus(value: unknown): value is ToolStatus {
  return value === "pass" || value === "warning" || value === "fail";
}

function isFetchState(value: unknown): value is RedirectMapFetchState {
  return value === "ok"
    || value === "rejected"
    || value === "failed"
    || value === "not_checked";
}

function isFinding(value: unknown): value is RedirectMapFindingResult {
  if (!isRecord(value)) return false;
  return typeof value.id === "string"
    && typeof value.title === "string"
    && (value.severity === "info" || value.severity === "medium" || value.severity === "high")
    && isNullableString(value.value)
    && typeof value.recommendation === "string";
}

function isEntry(value: unknown): value is RedirectMapEntryResult {
  if (!isRecord(value)) return false;
  return isNonNegativeInteger(value.position) && value.position >= 1
    && typeof value.source_url === "string"
    && typeof value.target_url === "string"
    && isNullableRedirectStatus(value.expected_status_code)
    && isNullableString(value.normalized_source_url)
    && isNullableString(value.normalized_target_url)
    && isFetchState(value.fetch_state)
    && isNullableHttpStatus(value.observed_first_status_code)
    && isNullableString(value.observed_first_target_url)
    && isNullableString(value.final_url)
    && isNonNegativeInteger(value.redirect_count)
    && isNullableBoolean(value.target_matches)
    && isNullableBoolean(value.status_matches)
    && isStringArray(value.issues)
    && isToolStatus(value.status);
}

export function isRedirectMapResponse(value: unknown): value is RedirectMapResponse {
  if (!isRecord(value)) return false;
  return value.contract_version === "webdiag.tool.redirect_map_validator.v1"
    && typeof value.generated_at === "string"
    && value.scan_mode === "explicit_map_bounded_safe_fetch"
    && isNonNegativeInteger(value.entry_count)
    && value.entry_count >= 1
    && isNonNegativeInteger(value.checked_count)
    && isNonNegativeInteger(value.matched_count)
    && isNonNegativeInteger(value.mismatch_count)
    && isNonNegativeInteger(value.failed_count)
    && isNonNegativeInteger(value.duplicate_source_count)
    && isNonNegativeInteger(value.conflicting_source_count)
    && isNonNegativeInteger(value.self_redirect_count)
    && isNonNegativeInteger(value.chain_source_count)
    && isNonNegativeInteger(value.cycle_count)
    && isNonNegativeInteger(value.issue_count)
    && Array.isArray(value.entries)
    && value.entries.every(isEntry)
    && Array.isArray(value.findings)
    && value.findings.every(isFinding)
    && isToolStatus(value.status)
    && typeof value.recommendation === "string";
}
