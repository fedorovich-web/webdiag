import type { FindingSeverity, ToolStatus } from "./client-delivery-tool-contract";

export type AssetFetchState = "ok" | "rejected" | "failed";
export type ScriptKind = "classic" | "module";

export interface AssetFindingResult {
  readonly id: string;
  readonly title: string;
  readonly severity: FindingSeverity;
  readonly value: string | null;
  readonly recommendation: string;
}

export interface JavaScriptAssetResult {
  readonly position: number;
  readonly raw_src: string;
  readonly resolved_url: string;
  readonly final_url: string | null;
  readonly hostname: string | null;
  readonly same_host: boolean | null;
  readonly script_kind: ScriptKind;
  readonly async_attribute: boolean;
  readonly defer_attribute: boolean;
  readonly parser_blocking_candidate: boolean;
  readonly fetch_state: AssetFetchState;
  readonly status_code: number | null;
  readonly content_type: string | null;
  readonly declared_bytes: number | null;
  readonly content_encoding: string | null;
  readonly cache_control: string | null;
  readonly max_age_seconds: number | null;
  readonly immutable_cache: boolean;
  readonly redirect_count: number;
  readonly issues: readonly string[];
}

export interface JavaScriptBundleSurfaceResponse {
  readonly contract_version: "webdiag.tool.javascript_bundle_surface.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly content_type: string | null;
  readonly scan_mode: "static_html_bounded_headers";
  readonly discovered_script_count: number;
  readonly unique_script_count: number;
  readonly checked_script_count: number;
  readonly same_host_script_count: number;
  readonly cross_host_script_count: number;
  readonly module_script_count: number;
  readonly classic_script_count: number;
  readonly parser_blocking_candidate_count: number;
  readonly duplicate_src_count: number;
  readonly known_declared_bytes: number;
  readonly unknown_size_count: number;
  readonly compressed_response_count: number;
  readonly long_cache_count: number;
  readonly failed_asset_count: number;
  readonly issue_count: number;
  readonly assets: readonly JavaScriptAssetResult[];
  readonly findings: readonly AssetFindingResult[];
  readonly redirect_count: number;
  readonly truncated: boolean;
  readonly status: ToolStatus;
  readonly recommendation: string;
}

export interface StylesheetAssetResult {
  readonly position: number;
  readonly raw_href: string;
  readonly resolved_url: string;
  readonly final_url: string | null;
  readonly hostname: string | null;
  readonly same_host: boolean | null;
  readonly media: string | null;
  readonly default_media_candidate: boolean;
  readonly alternate: boolean;
  readonly disabled: boolean;
  readonly fetch_state: AssetFetchState;
  readonly status_code: number | null;
  readonly content_type: string | null;
  readonly declared_bytes: number | null;
  readonly sampled_decoded_bytes: number | null;
  readonly content_encoding: string | null;
  readonly cache_control: string | null;
  readonly max_age_seconds: number | null;
  readonly immutable_cache: boolean;
  readonly import_rule_count: number;
  readonly font_face_rule_count: number;
  readonly source_map_comment: boolean;
  readonly redirect_count: number;
  readonly issues: readonly string[];
}

export interface CssDeliveryAnalyzerResponse {
  readonly contract_version: "webdiag.tool.css_delivery_analyzer.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly content_type: string | null;
  readonly scan_mode: "static_html_bounded_css";
  readonly stylesheet_link_count: number;
  readonly unique_stylesheet_count: number;
  readonly checked_stylesheet_count: number;
  readonly inline_style_block_count: number;
  readonly inline_style_bytes: number;
  readonly same_host_stylesheet_count: number;
  readonly cross_host_stylesheet_count: number;
  readonly default_media_candidate_count: number;
  readonly conditional_media_count: number;
  readonly alternate_or_disabled_count: number;
  readonly duplicate_href_count: number;
  readonly known_declared_bytes: number;
  readonly sampled_decoded_bytes: number;
  readonly compressed_response_count: number;
  readonly import_rule_count: number;
  readonly font_face_rule_count: number;
  readonly failed_stylesheet_count: number;
  readonly issue_count: number;
  readonly stylesheets: readonly StylesheetAssetResult[];
  readonly findings: readonly AssetFindingResult[];
  readonly redirect_count: number;
  readonly truncated: boolean;
  readonly status: ToolStatus;
  readonly recommendation: string;
}

export interface FontFaceResult {
  readonly position: number;
  readonly family: string | null;
  readonly style: string;
  readonly weight: string;
  readonly display: string | null;
  readonly source_stylesheet_url: string;
  readonly fetchable_source_count: number;
  readonly local_source_count: number;
  readonly issues: readonly string[];
}

export interface FontAssetResult {
  readonly position: number;
  readonly resolved_url: string;
  readonly final_url: string | null;
  readonly hostname: string | null;
  readonly same_host: boolean | null;
  readonly families: readonly string[];
  readonly format_hints: readonly string[];
  readonly preloaded: boolean;
  readonly fetch_state: AssetFetchState;
  readonly status_code: number | null;
  readonly content_type: string | null;
  readonly declared_bytes: number | null;
  readonly content_encoding: string | null;
  readonly cache_control: string | null;
  readonly max_age_seconds: number | null;
  readonly immutable_cache: boolean;
  readonly redirect_count: number;
  readonly issues: readonly string[];
}

export interface FontPreloadResult {
  readonly position: number;
  readonly raw_href: string;
  readonly resolved_url: string | null;
  readonly type_value: string | null;
  readonly crossorigin_present: boolean;
  readonly matches_discovered_font: boolean;
  readonly issues: readonly string[];
}

export interface FontLoadingAnalyzerResponse {
  readonly contract_version: "webdiag.tool.font_loading_analyzer.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly content_type: string | null;
  readonly scan_mode: "static_html_bounded_css";
  readonly stylesheet_count: number;
  readonly checked_stylesheet_count: number;
  readonly font_face_count: number;
  readonly family_count: number;
  readonly font_source_count: number;
  readonly unique_font_source_count: number;
  readonly checked_font_source_count: number;
  readonly local_source_count: number;
  readonly preload_count: number;
  readonly matched_preload_count: number;
  readonly missing_font_display_count: number;
  readonly blocking_font_display_count: number;
  readonly swap_or_optional_count: number;
  readonly cross_host_font_count: number;
  readonly woff2_source_count: number;
  readonly duplicate_source_count: number;
  readonly known_declared_bytes: number;
  readonly unknown_size_count: number;
  readonly failed_font_count: number;
  readonly issue_count: number;
  readonly faces: readonly FontFaceResult[];
  readonly assets: readonly FontAssetResult[];
  readonly preloads: readonly FontPreloadResult[];
  readonly findings: readonly AssetFindingResult[];
  readonly redirect_count: number;
  readonly truncated: boolean;
  readonly status: ToolStatus;
  readonly recommendation: string;
}

export type AssetDeliveryToolResponse =
  | JavaScriptBundleSurfaceResponse
  | CssDeliveryAnalyzerResponse
  | FontLoadingAnalyzerResponse;

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

function isNullableNonNegativeInteger(value: unknown): value is number | null {
  return value === null || isNonNegativeInteger(value);
}

function isNullableHttpStatus(value: unknown): value is number | null {
  return value === null || (isPositiveInteger(value) && value >= 100 && value <= 599);
}

function isHttpStatus(value: unknown): value is number {
  return isPositiveInteger(value) && value >= 100 && value <= 599;
}

function isToolStatus(value: unknown): value is ToolStatus {
  return value === "pass" || value === "warning" || value === "fail";
}

function isFindingSeverity(value: unknown): value is FindingSeverity {
  return value === "info" || value === "medium" || value === "high";
}

function isFetchState(value: unknown): value is AssetFetchState {
  return value === "ok" || value === "rejected" || value === "failed";
}

function hasBaseFields(value: Record<string, unknown>): boolean {
  return (
    typeof value.generated_at === "string" &&
    typeof value.requested_url === "string" &&
    typeof value.final_url === "string" &&
    isHttpStatus(value.status_code) &&
    isNullableString(value.content_type) &&
    isNonNegativeInteger(value.redirect_count) &&
    typeof value.truncated === "boolean" &&
    isToolStatus(value.status) &&
    typeof value.recommendation === "string"
  );
}

function isFinding(value: unknown): value is AssetFindingResult {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    isFindingSeverity(value.severity) &&
    isNullableString(value.value) &&
    typeof value.recommendation === "string"
  );
}

function isJavaScriptAsset(value: unknown): value is JavaScriptAssetResult {
  return (
    isRecord(value) &&
    isPositiveInteger(value.position) &&
    typeof value.raw_src === "string" &&
    typeof value.resolved_url === "string" &&
    isNullableString(value.final_url) &&
    isNullableString(value.hostname) &&
    isNullableBoolean(value.same_host) &&
    (value.script_kind === "classic" || value.script_kind === "module") &&
    typeof value.async_attribute === "boolean" &&
    typeof value.defer_attribute === "boolean" &&
    typeof value.parser_blocking_candidate === "boolean" &&
    isFetchState(value.fetch_state) &&
    isNullableHttpStatus(value.status_code) &&
    isNullableString(value.content_type) &&
    isNullableNonNegativeInteger(value.declared_bytes) &&
    isNullableString(value.content_encoding) &&
    isNullableString(value.cache_control) &&
    isNullableNonNegativeInteger(value.max_age_seconds) &&
    typeof value.immutable_cache === "boolean" &&
    isNonNegativeInteger(value.redirect_count) &&
    isStringArray(value.issues)
  );
}

export function isJavaScriptBundleSurfaceResponse(
  payload: unknown,
): payload is JavaScriptBundleSurfaceResponse {
  if (!isRecord(payload)) return false;
  const countFields = [
    "discovered_script_count",
    "unique_script_count",
    "checked_script_count",
    "same_host_script_count",
    "cross_host_script_count",
    "module_script_count",
    "classic_script_count",
    "parser_blocking_candidate_count",
    "duplicate_src_count",
    "known_declared_bytes",
    "unknown_size_count",
    "compressed_response_count",
    "long_cache_count",
    "failed_asset_count",
    "issue_count",
  ] as const;
  return (
    payload.contract_version === "webdiag.tool.javascript_bundle_surface.v1" &&
    payload.scan_mode === "static_html_bounded_headers" &&
    hasBaseFields(payload) &&
    countFields.every((field) => isNonNegativeInteger(payload[field])) &&
    Array.isArray(payload.assets) &&
    payload.assets.every(isJavaScriptAsset) &&
    Array.isArray(payload.findings) &&
    payload.findings.every(isFinding)
  );
}

function isStylesheetAsset(value: unknown): value is StylesheetAssetResult {
  return (
    isRecord(value) &&
    isPositiveInteger(value.position) &&
    typeof value.raw_href === "string" &&
    typeof value.resolved_url === "string" &&
    isNullableString(value.final_url) &&
    isNullableString(value.hostname) &&
    isNullableBoolean(value.same_host) &&
    isNullableString(value.media) &&
    typeof value.default_media_candidate === "boolean" &&
    typeof value.alternate === "boolean" &&
    typeof value.disabled === "boolean" &&
    isFetchState(value.fetch_state) &&
    isNullableHttpStatus(value.status_code) &&
    isNullableString(value.content_type) &&
    isNullableNonNegativeInteger(value.declared_bytes) &&
    isNullableNonNegativeInteger(value.sampled_decoded_bytes) &&
    isNullableString(value.content_encoding) &&
    isNullableString(value.cache_control) &&
    isNullableNonNegativeInteger(value.max_age_seconds) &&
    typeof value.immutable_cache === "boolean" &&
    isNonNegativeInteger(value.import_rule_count) &&
    isNonNegativeInteger(value.font_face_rule_count) &&
    typeof value.source_map_comment === "boolean" &&
    isNonNegativeInteger(value.redirect_count) &&
    isStringArray(value.issues)
  );
}

export function isCssDeliveryAnalyzerResponse(
  payload: unknown,
): payload is CssDeliveryAnalyzerResponse {
  if (!isRecord(payload)) return false;
  const countFields = [
    "stylesheet_link_count",
    "unique_stylesheet_count",
    "checked_stylesheet_count",
    "inline_style_block_count",
    "inline_style_bytes",
    "same_host_stylesheet_count",
    "cross_host_stylesheet_count",
    "default_media_candidate_count",
    "conditional_media_count",
    "alternate_or_disabled_count",
    "duplicate_href_count",
    "known_declared_bytes",
    "sampled_decoded_bytes",
    "compressed_response_count",
    "import_rule_count",
    "font_face_rule_count",
    "failed_stylesheet_count",
    "issue_count",
  ] as const;
  return (
    payload.contract_version === "webdiag.tool.css_delivery_analyzer.v1" &&
    payload.scan_mode === "static_html_bounded_css" &&
    hasBaseFields(payload) &&
    countFields.every((field) => isNonNegativeInteger(payload[field])) &&
    Array.isArray(payload.stylesheets) &&
    payload.stylesheets.every(isStylesheetAsset) &&
    Array.isArray(payload.findings) &&
    payload.findings.every(isFinding)
  );
}

function isFontFace(value: unknown): value is FontFaceResult {
  return (
    isRecord(value) &&
    isPositiveInteger(value.position) &&
    isNullableString(value.family) &&
    typeof value.style === "string" &&
    typeof value.weight === "string" &&
    isNullableString(value.display) &&
    typeof value.source_stylesheet_url === "string" &&
    isNonNegativeInteger(value.fetchable_source_count) &&
    isNonNegativeInteger(value.local_source_count) &&
    isStringArray(value.issues)
  );
}

function isFontAsset(value: unknown): value is FontAssetResult {
  return (
    isRecord(value) &&
    isPositiveInteger(value.position) &&
    typeof value.resolved_url === "string" &&
    isNullableString(value.final_url) &&
    isNullableString(value.hostname) &&
    isNullableBoolean(value.same_host) &&
    isStringArray(value.families) &&
    isStringArray(value.format_hints) &&
    typeof value.preloaded === "boolean" &&
    isFetchState(value.fetch_state) &&
    isNullableHttpStatus(value.status_code) &&
    isNullableString(value.content_type) &&
    isNullableNonNegativeInteger(value.declared_bytes) &&
    isNullableString(value.content_encoding) &&
    isNullableString(value.cache_control) &&
    isNullableNonNegativeInteger(value.max_age_seconds) &&
    typeof value.immutable_cache === "boolean" &&
    isNonNegativeInteger(value.redirect_count) &&
    isStringArray(value.issues)
  );
}

function isFontPreload(value: unknown): value is FontPreloadResult {
  return (
    isRecord(value) &&
    isPositiveInteger(value.position) &&
    typeof value.raw_href === "string" &&
    isNullableString(value.resolved_url) &&
    isNullableString(value.type_value) &&
    typeof value.crossorigin_present === "boolean" &&
    typeof value.matches_discovered_font === "boolean" &&
    isStringArray(value.issues)
  );
}

export function isFontLoadingAnalyzerResponse(
  payload: unknown,
): payload is FontLoadingAnalyzerResponse {
  if (!isRecord(payload)) return false;
  const countFields = [
    "stylesheet_count",
    "checked_stylesheet_count",
    "font_face_count",
    "family_count",
    "font_source_count",
    "unique_font_source_count",
    "checked_font_source_count",
    "local_source_count",
    "preload_count",
    "matched_preload_count",
    "missing_font_display_count",
    "blocking_font_display_count",
    "swap_or_optional_count",
    "cross_host_font_count",
    "woff2_source_count",
    "duplicate_source_count",
    "known_declared_bytes",
    "unknown_size_count",
    "failed_font_count",
    "issue_count",
  ] as const;
  return (
    payload.contract_version === "webdiag.tool.font_loading_analyzer.v1" &&
    payload.scan_mode === "static_html_bounded_css" &&
    hasBaseFields(payload) &&
    countFields.every((field) => isNonNegativeInteger(payload[field])) &&
    Array.isArray(payload.faces) &&
    payload.faces.every(isFontFace) &&
    Array.isArray(payload.assets) &&
    payload.assets.every(isFontAsset) &&
    Array.isArray(payload.preloads) &&
    payload.preloads.every(isFontPreload) &&
    Array.isArray(payload.findings) &&
    payload.findings.every(isFinding)
  );
}
