export interface ToolApiErrorPayload {
  readonly detail: {
    readonly code: string;
    readonly message: string;
  };
}

export interface MetadataSignalResponse {
  readonly name: string;
  readonly content: string;
}

export interface MetadataCheckResponse {
  readonly id: string;
  readonly title: string;
  readonly status: "pass" | "warning" | "fail";
  readonly severity: "info" | "medium" | "high";
  readonly value: string | null;
  readonly recommendation: string;
}

export interface MetaTagsResponse {
  readonly contract_version: "webdiag.tool.meta_tags.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly content_type: string | null;
  readonly title: string | null;
  readonly title_length: number;
  readonly meta_description: string | null;
  readonly meta_description_length: number;
  readonly canonical_url: string | null;
  readonly resolved_canonical_url: string | null;
  readonly robots_directives: readonly MetadataSignalResponse[];
  readonly h1_count: number;
  readonly open_graph_count: number;
  readonly twitter_card_count: number;
  readonly json_ld_count: number;
  readonly checks: readonly MetadataCheckResponse[];
  readonly recommendation: string;
}

export interface SerpPreviewCheckResponse {
  readonly id: string;
  readonly status: "pass" | "warning" | "fail";
  readonly message: string;
}

export interface SerpPreviewResponse {
  readonly contract_version: "webdiag.tool.serp_preview.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly display_url: string;
  readonly preview_title: string;
  readonly preview_description: string;
  readonly title_source: "title" | "fallback";
  readonly description_source: "meta_description" | "fallback";
  readonly title_length: number;
  readonly description_length: number;
  readonly checks: readonly SerpPreviewCheckResponse[];
  readonly recommendation: string;
}

export interface SocialCardPreviewResponse {
  readonly title: string | null;
  readonly description: string | null;
  readonly image: string | null;
  readonly url: string | null;
  readonly card_type: string | null;
  readonly site_name: string | null;
  readonly missing_fields: readonly string[];
  readonly complete: boolean;
}

export interface SocialPreviewResponse {
  readonly contract_version: "webdiag.tool.social_preview.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly open_graph: SocialCardPreviewResponse;
  readonly twitter: SocialCardPreviewResponse;
  readonly fallback_title: string | null;
  readonly fallback_description: string | null;
  readonly recommendation: string;
}

export type MetadataToolResponse = MetaTagsResponse | SerpPreviewResponse | SocialPreviewResponse;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function isToolErrorPayload(payload: unknown): payload is ToolApiErrorPayload {
  if (!isRecord(payload) || !isRecord(payload.detail)) return false;
  return typeof payload.detail.code === "string" && typeof payload.detail.message === "string";
}

export function isMetadataSignalResponse(payload: unknown): payload is MetadataSignalResponse {
  return isRecord(payload) && typeof payload.name === "string" && typeof payload.content === "string";
}

export function isMetadataCheckResponse(payload: unknown): payload is MetadataCheckResponse {
  if (!isRecord(payload)) return false;
  return (
    typeof payload.id === "string" &&
    typeof payload.title === "string" &&
    (payload.status === "pass" || payload.status === "warning" || payload.status === "fail") &&
    (payload.severity === "info" || payload.severity === "medium" || payload.severity === "high") &&
    (typeof payload.value === "string" || payload.value === null) &&
    typeof payload.recommendation === "string"
  );
}

export function isMetaTagsResponse(payload: unknown): payload is MetaTagsResponse {
  if (!isRecord(payload) || payload.contract_version !== "webdiag.tool.meta_tags.v1") return false;
  return (
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.final_url === "string" &&
    typeof payload.status_code === "number" &&
    (typeof payload.content_type === "string" || payload.content_type === null) &&
    (typeof payload.title === "string" || payload.title === null) &&
    typeof payload.title_length === "number" &&
    (typeof payload.meta_description === "string" || payload.meta_description === null) &&
    typeof payload.meta_description_length === "number" &&
    (typeof payload.canonical_url === "string" || payload.canonical_url === null) &&
    (typeof payload.resolved_canonical_url === "string" || payload.resolved_canonical_url === null) &&
    Array.isArray(payload.robots_directives) &&
    payload.robots_directives.every(isMetadataSignalResponse) &&
    typeof payload.h1_count === "number" &&
    typeof payload.open_graph_count === "number" &&
    typeof payload.twitter_card_count === "number" &&
    typeof payload.json_ld_count === "number" &&
    Array.isArray(payload.checks) &&
    payload.checks.every(isMetadataCheckResponse) &&
    typeof payload.recommendation === "string"
  );
}

export function isSerpPreviewCheckResponse(payload: unknown): payload is SerpPreviewCheckResponse {
  if (!isRecord(payload)) return false;
  return (
    typeof payload.id === "string" &&
    (payload.status === "pass" || payload.status === "warning" || payload.status === "fail") &&
    typeof payload.message === "string"
  );
}

export function isSerpPreviewResponse(payload: unknown): payload is SerpPreviewResponse {
  if (!isRecord(payload) || payload.contract_version !== "webdiag.tool.serp_preview.v1") return false;
  return (
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.final_url === "string" &&
    typeof payload.status_code === "number" &&
    typeof payload.display_url === "string" &&
    typeof payload.preview_title === "string" &&
    typeof payload.preview_description === "string" &&
    (payload.title_source === "title" || payload.title_source === "fallback") &&
    (payload.description_source === "meta_description" || payload.description_source === "fallback") &&
    typeof payload.title_length === "number" &&
    typeof payload.description_length === "number" &&
    Array.isArray(payload.checks) &&
    payload.checks.every(isSerpPreviewCheckResponse) &&
    typeof payload.recommendation === "string"
  );
}

export function isSocialCardPreviewResponse(payload: unknown): payload is SocialCardPreviewResponse {
  if (!isRecord(payload)) return false;
  return (
    (typeof payload.title === "string" || payload.title === null) &&
    (typeof payload.description === "string" || payload.description === null) &&
    (typeof payload.image === "string" || payload.image === null) &&
    (typeof payload.url === "string" || payload.url === null) &&
    (typeof payload.card_type === "string" || payload.card_type === null) &&
    (typeof payload.site_name === "string" || payload.site_name === null) &&
    Array.isArray(payload.missing_fields) &&
    payload.missing_fields.every((item) => typeof item === "string") &&
    typeof payload.complete === "boolean"
  );
}

export function isSocialPreviewResponse(payload: unknown): payload is SocialPreviewResponse {
  if (!isRecord(payload) || payload.contract_version !== "webdiag.tool.social_preview.v1") return false;
  return (
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.final_url === "string" &&
    typeof payload.status_code === "number" &&
    isSocialCardPreviewResponse(payload.open_graph) &&
    isSocialCardPreviewResponse(payload.twitter) &&
    (typeof payload.fallback_title === "string" || payload.fallback_title === null) &&
    (typeof payload.fallback_description === "string" || payload.fallback_description === null) &&
    typeof payload.recommendation === "string"
  );
}

export function normalizeMetadataToolUrlInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function parseMetadataToolUrlInput(value: string): URL | null {
  const normalized = normalizeMetadataToolUrlInput(value);
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

export function metadataCheckStatusLabel(status: "pass" | "warning" | "fail", locale: "ru" | "en"): string {
  const labels = locale === "ru"
    ? { pass: "Ок", warning: "Проверить", fail: "Проблема" }
    : { pass: "OK", warning: "Review", fail: "Problem" };
  return labels[status];
}
