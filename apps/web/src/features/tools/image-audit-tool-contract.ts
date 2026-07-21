export interface ToolApiErrorPayload { readonly detail: { readonly code: string; readonly message: string } }

export interface ImageFormatSummaryResponse {
  readonly format: string;
  readonly count: number;
  readonly known_bytes: number;
  readonly unknown_size_count: number;
}

export interface ImagePerformanceItemResponse {
  readonly url: string;
  readonly source: "img-src" | "img-srcset" | "picture-source" | "social-image";
  readonly format: string;
  readonly status_code: number | null;
  readonly content_type: string | null;
  readonly content_length: number | null;
  readonly width_attr: string | null;
  readonly height_attr: string | null;
  readonly loading: string | null;
  readonly uses_srcset: boolean;
  readonly uses_picture: boolean;
  readonly modern_raster_format: boolean | null;
  readonly oversized: boolean;
  readonly recommendations: readonly string[];
}

export interface ImagePerformanceResponse {
  readonly contract_version: "webdiag.tool.image_performance.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly scan_mode: "static_html_bounded";
  readonly discovered_image_count: number;
  readonly checked_image_count: number;
  readonly total_known_image_bytes: number;
  readonly unknown_size_count: number;
  readonly modern_raster_count: number;
  readonly legacy_raster_count: number;
  readonly svg_count: number;
  readonly oversized_count: number;
  readonly missing_dimensions_count: number;
  readonly lazy_loading_candidate_count: number;
  readonly responsive_markup_count: number;
  readonly format_summaries: readonly ImageFormatSummaryResponse[];
  readonly largest_images: readonly ImagePerformanceItemResponse[];
  readonly recommendation: string;
}

export interface ImageSeoCheckResponse {
  readonly id: string;
  readonly title: string;
  readonly status: "pass" | "warning" | "fail";
  readonly severity: "info" | "medium" | "high";
  readonly value: string | null;
  readonly recommendation: string;
}

export interface ImageSeoItemResponse {
  readonly url: string;
  readonly alt_status: "missing" | "empty" | "decorative" | "present";
  readonly alt_text: string | null;
  readonly in_link: boolean;
  readonly has_dimensions: boolean;
  readonly loading: string | null;
  readonly uses_srcset: boolean;
  readonly uses_picture: boolean;
}

export interface ImageSeoResponse {
  readonly contract_version: "webdiag.tool.image_seo.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly total_images: number;
  readonly missing_alt_count: number;
  readonly empty_alt_count: number;
  readonly decorative_count: number;
  readonly linked_images_without_alt_count: number;
  readonly missing_dimensions_count: number;
  readonly responsive_image_count: number;
  readonly lazy_loading_count: number;
  readonly og_image_url: string | null;
  readonly twitter_image_url: string | null;
  readonly checks: readonly ImageSeoCheckResponse[];
  readonly sample_images: readonly ImageSeoItemResponse[];
  readonly recommendation: string;
}

export interface FaviconIconResponse {
  readonly rel: string;
  readonly url: string;
  readonly sizes: string | null;
  readonly declared_type: string | null;
  readonly status_code: number | null;
  readonly content_type: string | null;
  readonly content_length: number | null;
  readonly format: string;
  readonly recommendation: string | null;
}

export interface FaviconResponse {
  readonly contract_version: "webdiag.tool.favicon.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly discovered_icon_count: number;
  readonly checked_icon_count: number;
  readonly has_favicon: boolean;
  readonly has_svg_icon: boolean;
  readonly has_apple_touch_icon: boolean;
  readonly has_manifest: boolean;
  readonly manifest_url: string | null;
  readonly fallback_ico_checked: boolean;
  readonly icons: readonly FaviconIconResponse[];
  readonly recommendation: string;
}

export type ImageAuditToolResponse = ImagePerformanceResponse | ImageSeoResponse | FaviconResponse;

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

function isStringOrNull(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isImageFormatSummary(payload: unknown): payload is ImageFormatSummaryResponse {
  return isRecord(payload) && typeof payload.format === "string" && typeof payload.count === "number" && typeof payload.known_bytes === "number" && typeof payload.unknown_size_count === "number";
}

function isImagePerformanceItem(payload: unknown): payload is ImagePerformanceItemResponse {
  return isRecord(payload) &&
    typeof payload.url === "string" &&
    (payload.source === "img-src" || payload.source === "img-srcset" || payload.source === "picture-source" || payload.source === "social-image") &&
    typeof payload.format === "string" &&
    (typeof payload.status_code === "number" || payload.status_code === null) &&
    isStringOrNull(payload.content_type) &&
    (typeof payload.content_length === "number" || payload.content_length === null) &&
    isStringOrNull(payload.width_attr) &&
    isStringOrNull(payload.height_attr) &&
    isStringOrNull(payload.loading) &&
    typeof payload.uses_srcset === "boolean" &&
    typeof payload.uses_picture === "boolean" &&
    (typeof payload.modern_raster_format === "boolean" || payload.modern_raster_format === null) &&
    typeof payload.oversized === "boolean" &&
    Array.isArray(payload.recommendations) && payload.recommendations.every((value) => typeof value === "string");
}

export function isImagePerformanceResponse(payload: unknown): payload is ImagePerformanceResponse {
  return isRecord(payload) &&
    payload.contract_version === "webdiag.tool.image_performance.v1" &&
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.final_url === "string" &&
    typeof payload.status_code === "number" &&
    payload.scan_mode === "static_html_bounded" &&
    typeof payload.discovered_image_count === "number" &&
    typeof payload.checked_image_count === "number" &&
    typeof payload.total_known_image_bytes === "number" &&
    typeof payload.unknown_size_count === "number" &&
    typeof payload.modern_raster_count === "number" &&
    typeof payload.legacy_raster_count === "number" &&
    typeof payload.svg_count === "number" &&
    typeof payload.oversized_count === "number" &&
    typeof payload.missing_dimensions_count === "number" &&
    typeof payload.lazy_loading_candidate_count === "number" &&
    typeof payload.responsive_markup_count === "number" &&
    Array.isArray(payload.format_summaries) && payload.format_summaries.every(isImageFormatSummary) &&
    Array.isArray(payload.largest_images) && payload.largest_images.every(isImagePerformanceItem) &&
    typeof payload.recommendation === "string";
}

function isImageSeoCheck(payload: unknown): payload is ImageSeoCheckResponse {
  return isRecord(payload) && typeof payload.id === "string" && typeof payload.title === "string" && isStatus(payload.status) && isSeverity(payload.severity) && isStringOrNull(payload.value) && typeof payload.recommendation === "string";
}

function isImageSeoItem(payload: unknown): payload is ImageSeoItemResponse {
  return isRecord(payload) &&
    typeof payload.url === "string" &&
    (payload.alt_status === "missing" || payload.alt_status === "empty" || payload.alt_status === "decorative" || payload.alt_status === "present") &&
    isStringOrNull(payload.alt_text) &&
    typeof payload.in_link === "boolean" &&
    typeof payload.has_dimensions === "boolean" &&
    isStringOrNull(payload.loading) &&
    typeof payload.uses_srcset === "boolean" &&
    typeof payload.uses_picture === "boolean";
}

export function isImageSeoResponse(payload: unknown): payload is ImageSeoResponse {
  return isRecord(payload) &&
    payload.contract_version === "webdiag.tool.image_seo.v1" &&
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.final_url === "string" &&
    typeof payload.status_code === "number" &&
    typeof payload.total_images === "number" &&
    typeof payload.missing_alt_count === "number" &&
    typeof payload.empty_alt_count === "number" &&
    typeof payload.decorative_count === "number" &&
    typeof payload.linked_images_without_alt_count === "number" &&
    typeof payload.missing_dimensions_count === "number" &&
    typeof payload.responsive_image_count === "number" &&
    typeof payload.lazy_loading_count === "number" &&
    isStringOrNull(payload.og_image_url) &&
    isStringOrNull(payload.twitter_image_url) &&
    Array.isArray(payload.checks) && payload.checks.every(isImageSeoCheck) &&
    Array.isArray(payload.sample_images) && payload.sample_images.every(isImageSeoItem) &&
    typeof payload.recommendation === "string";
}

function isFaviconIcon(payload: unknown): payload is FaviconIconResponse {
  return isRecord(payload) && typeof payload.rel === "string" && typeof payload.url === "string" && isStringOrNull(payload.sizes) && isStringOrNull(payload.declared_type) && (typeof payload.status_code === "number" || payload.status_code === null) && isStringOrNull(payload.content_type) && (typeof payload.content_length === "number" || payload.content_length === null) && typeof payload.format === "string" && isStringOrNull(payload.recommendation);
}

export function isFaviconResponse(payload: unknown): payload is FaviconResponse {
  return isRecord(payload) &&
    payload.contract_version === "webdiag.tool.favicon.v1" &&
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.final_url === "string" &&
    typeof payload.status_code === "number" &&
    typeof payload.discovered_icon_count === "number" &&
    typeof payload.checked_icon_count === "number" &&
    typeof payload.has_favicon === "boolean" &&
    typeof payload.has_svg_icon === "boolean" &&
    typeof payload.has_apple_touch_icon === "boolean" &&
    typeof payload.has_manifest === "boolean" &&
    isStringOrNull(payload.manifest_url) &&
    typeof payload.fallback_ico_checked === "boolean" &&
    Array.isArray(payload.icons) && payload.icons.every(isFaviconIcon) &&
    typeof payload.recommendation === "string";
}

export function parseImageToolUrlInput(value: string): URL | null {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

export function formatBytes(value: number | null): string {
  if (value === null) return "—";
  if (value < 1024) return `${value} B`;
  const units = ["KB", "MB", "GB"] as const;
  let current = value / 1024;
  let unit: string = units[0];
  for (const next of units.slice(1)) {
    if (current < 1024) break;
    current /= 1024;
    unit = next;
  }
  return `${current.toFixed(current >= 10 ? 1 : 2)} ${unit}`;
}

export function statusLabel(status: "pass" | "warning" | "fail", locale: "ru" | "en"): string {
  const labels = {
    ru: { pass: "ОК", warning: "Внимание", fail: "Ошибка" },
    en: { pass: "OK", warning: "Warning", fail: "Fail" },
  } as const;
  return labels[locale][status];
}
