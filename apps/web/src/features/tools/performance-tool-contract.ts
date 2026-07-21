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

export interface PageSpeedStrategyResponse {
  readonly strategy: "mobile" | "desktop";
  readonly available: boolean;
  readonly performance_score: number | null;
  readonly field_data_available: boolean;
  readonly field_overall_category: string | null;
  readonly lighthouse_version: string | null;
  readonly analysis_fetch_time: string | null;
  readonly metrics: readonly PageSpeedMetricResponse[];
  readonly opportunities: readonly PageSpeedOpportunityResponse[];
  readonly fetch_error: string | null;
}

export interface PageSpeedResponse {
  readonly contract_version: "webdiag.tool.core_web_vitals.v1";
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

export type PerformanceToolResponse = PageSpeedResponse | CachePolicyResponse | PageWeightResponse;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
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

function isPageSpeedStrategy(payload: unknown): payload is PageSpeedStrategyResponse {
  return isRecord(payload) &&
    (payload.strategy === "mobile" || payload.strategy === "desktop") &&
    typeof payload.available === "boolean" &&
    (typeof payload.performance_score === "number" || payload.performance_score === null) &&
    typeof payload.field_data_available === "boolean" &&
    (typeof payload.field_overall_category === "string" || payload.field_overall_category === null) &&
    (typeof payload.lighthouse_version === "string" || payload.lighthouse_version === null) &&
    (typeof payload.analysis_fetch_time === "string" || payload.analysis_fetch_time === null) &&
    Array.isArray(payload.metrics) && payload.metrics.every(isPageSpeedMetric) &&
    Array.isArray(payload.opportunities) && payload.opportunities.every(isPageSpeedOpportunity) &&
    (typeof payload.fetch_error === "string" || payload.fetch_error === null);
}

export function isPageSpeedResponse(payload: unknown): payload is PageSpeedResponse {
  return isRecord(payload) &&
    payload.contract_version === "webdiag.tool.core_web_vitals.v1" &&
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.normalized_url === "string" &&
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
