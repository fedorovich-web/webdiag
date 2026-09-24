export interface ToolApiErrorPayload {
  readonly detail: {
    readonly code: string;
    readonly message: string;
  };
}

export interface PageSpeedMetricResponse {
  readonly id: string;
  readonly title: string;
  readonly value: number | null;
  readonly unit: "ms" | "score" | "ratio" | "category";
  readonly display_value: string | null;
  readonly source: "lab" | "field";
  readonly status: "pass" | "warning" | "fail" | "unavailable";
}

export interface PageSpeedOpportunityResponse {
  readonly id: string;
  readonly title: string;
  readonly display_value: string | null;
  readonly savings_ms: number | null;
  readonly score: number | null;
}

export type LighthouseCategory = "performance" | "accessibility" | "best-practices" | "seo";

export interface LighthouseAuditFindingResponse {
  readonly id: string;
  readonly category: LighthouseCategory;
  readonly title: string;
  readonly score: number;
  readonly score_display_mode: string;
  readonly display_value: string | null;
  readonly weight: number;
}

export interface PageSpeedStrategyResponse {
  readonly strategy: "mobile" | "desktop";
  readonly available: boolean;
  readonly performance_score: number | null;
  readonly field_data_available: boolean;
  readonly field_overall_category: string | null;
  readonly lighthouse_version: string | null;
  readonly analysis_fetch_time: string | null;
  readonly category_scores: Readonly<Record<LighthouseCategory, number | null>>;
  readonly audit_findings: readonly LighthouseAuditFindingResponse[];
  readonly metrics: readonly PageSpeedMetricResponse[];
  readonly opportunities: readonly PageSpeedOpportunityResponse[];
  readonly fetch_error: string | null;
}

export interface PageSpeedResponse {
  readonly contract_version: "webdiag.tool.core_web_vitals.v2";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly normalized_url: string;
  readonly strategy: "mobile" | "desktop" | "both";
  readonly results: readonly PageSpeedStrategyResponse[];
  readonly recommendation: string;
}

export interface CachePolicyCheckResponse {
  readonly id: string;
  readonly title: string;
  readonly status: "pass" | "warning" | "fail";
  readonly severity: "info" | "medium" | "high";
  readonly value: string | null;
  readonly recommendation: string;
}

export interface CachePolicyResponse {
  readonly contract_version: "webdiag.tool.cache_policy.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly content_type: string | null;
  readonly is_static_asset: boolean;
  readonly cache_control: string | null;
  readonly etag: string | null;
  readonly last_modified: string | null;
  readonly expires: string | null;
  readonly vary: string | null;
  readonly score: number;
  readonly checks: readonly CachePolicyCheckResponse[];
  readonly recommendation: string;
}

export interface ResourceSummaryResponse {
  readonly type: "document" | "image" | "script" | "style" | "font" | "video" | "other";
  readonly count: number;
  readonly known_bytes: number;
  readonly unknown_size_count: number;
}

export interface PageResourceResponse {
  readonly url: string;
  readonly type: "document" | "image" | "script" | "style" | "font" | "video" | "other";
  readonly status_code: number | null;
  readonly content_type: string | null;
  readonly content_length: number | null;
  readonly modern_image_format: boolean | null;
  readonly recommendation: string | null;
}

export interface PageWeightResponse {
  readonly contract_version: "webdiag.tool.page_weight.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly scan_mode: "static_html_bounded";
  readonly html_bytes: number;
  readonly discovered_resource_count: number;
  readonly checked_resource_count: number;
  readonly total_known_bytes: number;
  readonly unknown_size_count: number;
  readonly image_count: number;
  readonly legacy_image_count: number;
  readonly modern_image_count: number;
  readonly summaries: readonly ResourceSummaryResponse[];
  readonly largest_resources: readonly PageResourceResponse[];
  readonly recommendation: string;
}

export interface LighthouseNetworkResourceResponse {
  readonly url: string;
  readonly resource_type: string;
  readonly protocol: string | null;
  readonly mime_type: string | null;
  readonly status_code: number | null;
  readonly start_ms: number;
  readonly end_ms: number;
  readonly duration_ms: number;
  readonly transfer_bytes: number | null;
  readonly resource_bytes: number | null;
}

export interface LighthouseRenderBlockingItemResponse {
  readonly url: string;
  readonly total_bytes: number | null;
  readonly wasted_bytes: number | null;
  readonly wasted_ms: number | null;
}

export interface LighthouseNetworkResponse {
  readonly contract_version: "webdiag.tool.lighthouse_network.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly normalized_url: string;
  readonly strategy: "mobile" | "desktop";
  readonly available: boolean;
  readonly lighthouse_version: string | null;
  readonly analysis_fetch_time: string | null;
  readonly resources_available: boolean;
  readonly render_blocking_available: boolean;
  readonly request_count: number;
  readonly returned_request_count: number;
  readonly total_transfer_bytes: number | null;
  readonly total_resource_bytes: number | null;
  readonly resources: readonly LighthouseNetworkResourceResponse[];
  readonly render_blocking_score: number | null;
  readonly render_blocking_display_value: string | null;
  readonly render_blocking_savings_ms: number | null;
  readonly render_blocking_items: readonly LighthouseRenderBlockingItemResponse[];
  readonly fetch_error: string | null;
  readonly recommendation: string;
}

export type PerformanceToolResponse = PageSpeedResponse | CachePolicyResponse | PageWeightResponse | LighthouseNetworkResponse;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(payload: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(payload).length === keys.length && keys.every((key) => Object.hasOwn(payload, key));
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNullableFiniteNumber(value: unknown): value is number | null {
  return value === null || isFiniteNumber(value);
}

function isRedactedPublicUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    return (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      parsed.username === "" && parsed.password === "" && parsed.search === "" && parsed.hash === "";
  } catch {
    return false;
  }
}

export function isToolErrorPayload(payload: unknown): payload is ToolApiErrorPayload {
  return isRecord(payload) && isRecord(payload.detail) && typeof payload.detail.code === "string" && typeof payload.detail.message === "string";
}

function isStatus(value: unknown): value is "pass" | "warning" | "fail" {
  return value === "pass" || value === "warning" || value === "fail";
}

function isSeverity(value: unknown): value is "info" | "medium" | "high" {
  return value === "info" || value === "medium" || value === "high";
}

function isPageSpeedMetric(payload: unknown): payload is PageSpeedMetricResponse {
  return isRecord(payload) &&
    typeof payload.id === "string" &&
    typeof payload.title === "string" &&
    (typeof payload.value === "number" || payload.value === null) &&
    (payload.unit === "ms" || payload.unit === "score" || payload.unit === "ratio" || payload.unit === "category") &&
    (typeof payload.display_value === "string" || payload.display_value === null) &&
    (payload.source === "lab" || payload.source === "field") &&
    (payload.status === "pass" || payload.status === "warning" || payload.status === "fail" || payload.status === "unavailable");
}

function isPageSpeedOpportunity(payload: unknown): payload is PageSpeedOpportunityResponse {
  return isRecord(payload) &&
    typeof payload.id === "string" &&
    typeof payload.title === "string" &&
    (typeof payload.display_value === "string" || payload.display_value === null) &&
    (typeof payload.savings_ms === "number" || payload.savings_ms === null) &&
    (typeof payload.score === "number" || payload.score === null);
}

function isLighthouseCategory(value: unknown): value is LighthouseCategory {
  return value === "performance" || value === "accessibility" || value === "best-practices" || value === "seo";
}

function isCategoryScores(payload: unknown): payload is PageSpeedStrategyResponse["category_scores"] {
  if (!isRecord(payload)) return false;
  const categories = ["performance", "accessibility", "best-practices", "seo"];
  return Object.keys(payload).length === categories.length && categories.every((category) => (
    category in payload && (typeof payload[category] === "number" || payload[category] === null)
  ));
}

function isLighthouseAuditFinding(payload: unknown): payload is LighthouseAuditFindingResponse {
  return isRecord(payload) &&
    typeof payload.id === "string" &&
    isLighthouseCategory(payload.category) &&
    typeof payload.title === "string" &&
    typeof payload.score === "number" && payload.score >= 0 && payload.score < 1 &&
    typeof payload.score_display_mode === "string" &&
    (typeof payload.display_value === "string" || payload.display_value === null) &&
    typeof payload.weight === "number" && payload.weight >= 0;
}

function isPageSpeedStrategy(payload: unknown): payload is PageSpeedStrategyResponse {
  return isRecord(payload) &&
    (payload.strategy === "mobile" || payload.strategy === "desktop") &&
    typeof payload.available === "boolean" &&
    (typeof payload.performance_score === "number" || payload.performance_score === null) &&
    typeof payload.field_data_available === "boolean" &&
    (typeof payload.field_overall_category === "string" || payload.field_overall_category === null) &&
    (typeof payload.lighthouse_version === "string" || payload.lighthouse_version === null) &&
    (typeof payload.analysis_fetch_time === "string" || payload.analysis_fetch_time === null) &&
    isCategoryScores(payload.category_scores) &&
    Array.isArray(payload.audit_findings) && payload.audit_findings.length <= 20 && payload.audit_findings.every(isLighthouseAuditFinding) &&
    Array.isArray(payload.metrics) && payload.metrics.every(isPageSpeedMetric) &&
    Array.isArray(payload.opportunities) && payload.opportunities.every(isPageSpeedOpportunity) &&
    (typeof payload.fetch_error === "string" || payload.fetch_error === null);
}

export function isPageSpeedResponse(payload: unknown): payload is PageSpeedResponse {
  return isRecord(payload) &&
    payload.contract_version === "webdiag.tool.core_web_vitals.v2" &&
    typeof payload.generated_at === "string" &&
    isRedactedPublicUrl(payload.requested_url) &&
    isRedactedPublicUrl(payload.normalized_url) &&
    (payload.strategy === "mobile" || payload.strategy === "desktop" || payload.strategy === "both") &&
    Array.isArray(payload.results) && payload.results.every(isPageSpeedStrategy) &&
    typeof payload.recommendation === "string";
}

function isCachePolicyCheck(payload: unknown): payload is CachePolicyCheckResponse {
  return isRecord(payload) &&
    typeof payload.id === "string" &&
    typeof payload.title === "string" &&
    isStatus(payload.status) &&
    isSeverity(payload.severity) &&
    (typeof payload.value === "string" || payload.value === null) &&
    typeof payload.recommendation === "string";
}

export function isCachePolicyResponse(payload: unknown): payload is CachePolicyResponse {
  return isRecord(payload) &&
    payload.contract_version === "webdiag.tool.cache_policy.v1" &&
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.final_url === "string" &&
    typeof payload.status_code === "number" &&
    (typeof payload.content_type === "string" || payload.content_type === null) &&
    typeof payload.is_static_asset === "boolean" &&
    (typeof payload.cache_control === "string" || payload.cache_control === null) &&
    (typeof payload.etag === "string" || payload.etag === null) &&
    (typeof payload.last_modified === "string" || payload.last_modified === null) &&
    (typeof payload.expires === "string" || payload.expires === null) &&
    (typeof payload.vary === "string" || payload.vary === null) &&
    typeof payload.score === "number" &&
    Array.isArray(payload.checks) && payload.checks.every(isCachePolicyCheck) &&
    typeof payload.recommendation === "string";
}

function isResourceType(value: unknown): value is ResourceSummaryResponse["type"] {
  return value === "document" || value === "image" || value === "script" || value === "style" || value === "font" || value === "video" || value === "other";
}

function isResourceSummary(payload: unknown): payload is ResourceSummaryResponse {
  return isRecord(payload) && isResourceType(payload.type) && typeof payload.count === "number" && typeof payload.known_bytes === "number" && typeof payload.unknown_size_count === "number";
}

function isPageResource(payload: unknown): payload is PageResourceResponse {
  return isRecord(payload) &&
    typeof payload.url === "string" &&
    isResourceType(payload.type) &&
    (typeof payload.status_code === "number" || payload.status_code === null) &&
    (typeof payload.content_type === "string" || payload.content_type === null) &&
    (typeof payload.content_length === "number" || payload.content_length === null) &&
    (typeof payload.modern_image_format === "boolean" || payload.modern_image_format === null) &&
    (typeof payload.recommendation === "string" || payload.recommendation === null);
}

export function isPageWeightResponse(payload: unknown): payload is PageWeightResponse {
  return isRecord(payload) &&
    payload.contract_version === "webdiag.tool.page_weight.v1" &&
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.final_url === "string" &&
    typeof payload.status_code === "number" &&
    payload.scan_mode === "static_html_bounded" &&
    typeof payload.html_bytes === "number" &&
    typeof payload.discovered_resource_count === "number" &&
    typeof payload.checked_resource_count === "number" &&
    typeof payload.total_known_bytes === "number" &&
    typeof payload.unknown_size_count === "number" &&
    typeof payload.image_count === "number" &&
    typeof payload.legacy_image_count === "number" &&
    typeof payload.modern_image_count === "number" &&
    Array.isArray(payload.summaries) && payload.summaries.every(isResourceSummary) &&
    Array.isArray(payload.largest_resources) && payload.largest_resources.every(isPageResource) &&
    typeof payload.recommendation === "string";
}

const LIGHTHOUSE_NETWORK_KEYS = [
  "contract_version", "generated_at", "requested_url", "normalized_url", "strategy", "available",
  "lighthouse_version", "analysis_fetch_time", "resources_available", "render_blocking_available",
  "request_count", "returned_request_count", "total_transfer_bytes", "total_resource_bytes", "resources",
  "render_blocking_score", "render_blocking_display_value", "render_blocking_savings_ms", "render_blocking_items", "fetch_error", "recommendation",
] as const;

const LIGHTHOUSE_RESOURCE_KEYS = [
  "url", "resource_type", "protocol", "mime_type", "status_code", "start_ms", "end_ms", "duration_ms", "transfer_bytes", "resource_bytes",
] as const;

const LIGHTHOUSE_BLOCKING_KEYS = ["url", "total_bytes", "wasted_bytes", "wasted_ms"] as const;

function isLighthouseNetworkResource(payload: unknown): payload is LighthouseNetworkResourceResponse {
  return isRecord(payload) &&
    hasExactKeys(payload, LIGHTHOUSE_RESOURCE_KEYS) &&
    isRedactedPublicUrl(payload.url) &&
    typeof payload.resource_type === "string" &&
    (typeof payload.protocol === "string" || payload.protocol === null) &&
    (typeof payload.mime_type === "string" || payload.mime_type === null) &&
    ((typeof payload.status_code === "number" && Number.isInteger(payload.status_code)) || payload.status_code === null) &&
    isFiniteNumber(payload.start_ms) && payload.start_ms >= 0 &&
    isFiniteNumber(payload.end_ms) && payload.end_ms >= payload.start_ms &&
    isFiniteNumber(payload.duration_ms) && payload.duration_ms >= 0 &&
    isNullableFiniteNumber(payload.transfer_bytes) && (payload.transfer_bytes === null || payload.transfer_bytes >= 0) &&
    isNullableFiniteNumber(payload.resource_bytes) && (payload.resource_bytes === null || payload.resource_bytes >= 0);
}

function isLighthouseRenderBlockingItem(payload: unknown): payload is LighthouseRenderBlockingItemResponse {
  return isRecord(payload) &&
    hasExactKeys(payload, LIGHTHOUSE_BLOCKING_KEYS) &&
    isRedactedPublicUrl(payload.url) &&
    isNullableFiniteNumber(payload.total_bytes) && (payload.total_bytes === null || payload.total_bytes >= 0) &&
    isNullableFiniteNumber(payload.wasted_bytes) && (payload.wasted_bytes === null || payload.wasted_bytes >= 0) &&
    isNullableFiniteNumber(payload.wasted_ms) && (payload.wasted_ms === null || payload.wasted_ms >= 0);
}

export function isLighthouseNetworkResponse(payload: unknown): payload is LighthouseNetworkResponse {
  if (!isRecord(payload) || !hasExactKeys(payload, LIGHTHOUSE_NETWORK_KEYS)) return false;
  if (!Array.isArray(payload.resources) || payload.resources.length > 40 || !payload.resources.every(isLighthouseNetworkResource)) return false;
  if (!Array.isArray(payload.render_blocking_items) || payload.render_blocking_items.length > 20 || !payload.render_blocking_items.every(isLighthouseRenderBlockingItem)) return false;

  const validCounts = typeof payload.request_count === "number" && Number.isInteger(payload.request_count) && payload.request_count >= 0 && payload.request_count <= 1000 &&
    typeof payload.returned_request_count === "number" && Number.isInteger(payload.returned_request_count) && payload.returned_request_count === payload.resources.length;
  const validScores = isNullableFiniteNumber(payload.render_blocking_score) &&
    (payload.render_blocking_score === null || (payload.render_blocking_score >= 0 && payload.render_blocking_score <= 1));
  const validAvailability = typeof payload.available === "boolean" &&
    typeof payload.resources_available === "boolean" &&
    typeof payload.render_blocking_available === "boolean" &&
    (payload.resources_available || payload.resources.length === 0) &&
    (payload.render_blocking_available || payload.render_blocking_items.length === 0);

  return payload.contract_version === "webdiag.tool.lighthouse_network.v1" &&
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.normalized_url === "string" &&
    (payload.strategy === "mobile" || payload.strategy === "desktop") &&
    validAvailability &&
    (typeof payload.lighthouse_version === "string" || payload.lighthouse_version === null) &&
    (typeof payload.analysis_fetch_time === "string" || payload.analysis_fetch_time === null) &&
    validCounts &&
    isNullableFiniteNumber(payload.total_transfer_bytes) && (payload.total_transfer_bytes === null || payload.total_transfer_bytes >= 0) &&
    isNullableFiniteNumber(payload.total_resource_bytes) && (payload.total_resource_bytes === null || payload.total_resource_bytes >= 0) &&
    validScores &&
    (typeof payload.render_blocking_display_value === "string" || payload.render_blocking_display_value === null) &&
    isNullableFiniteNumber(payload.render_blocking_savings_ms) && (payload.render_blocking_savings_ms === null || payload.render_blocking_savings_ms >= 0) &&
    (typeof payload.fetch_error === "string" || payload.fetch_error === null) &&
    typeof payload.recommendation === "string";
}

export function normalizePerformanceToolUrlInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function parsePerformanceToolUrlInput(value: string): URL | null {
  const normalized = normalizePerformanceToolUrlInput(value);
  if (!normalized) return null;
  try {
    const parsed = new URL(normalized);
    if (!/^https?:$/i.test(parsed.protocol)) return null;
    if (!parsed.hostname.includes(".")) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function statusLabel(status: "pass" | "warning" | "fail" | "unavailable", locale: "ru" | "en") {
  const values = {
    ru: { pass: "OK", warning: "Внимание", fail: "Проблема", unavailable: "Нет данных" },
    en: { pass: "OK", warning: "Warning", fail: "Issue", unavailable: "Unavailable" },
  } as const;
  return values[locale][status];
}

export function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
}
