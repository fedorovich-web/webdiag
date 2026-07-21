export interface ToolApiErrorPayload {
  readonly detail: { readonly code: string; readonly message: string };
}

export interface IndexabilityResponse {
  readonly contract_version: "webdiag.tool.indexability.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly scan_mode: "static_html_bounded";
  readonly redirect_count: number;
  readonly robots_txt_allowed: boolean | null;
  readonly robots_txt_status_code: number | null;
  readonly meta_robots_noindex: boolean;
  readonly meta_robots_nofollow: boolean;
  readonly x_robots_tag_noindex: boolean;
  readonly x_robots_tag_nofollow: boolean;
  readonly canonical_url: string | null;
  readonly resolved_canonical_url: string | null;
  readonly canonical_matches_final_url: boolean | null;
  readonly indexable_candidate: boolean;
  readonly signals: readonly unknown[];
  readonly recommendation: string;
}

export interface HreflangResponse {
  readonly contract_version: "webdiag.tool.hreflang.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly scan_mode: "static_html_bounded";
  readonly html_lang: string | null;
  readonly total_alternates: number;
  readonly valid_alternate_count: number;
  readonly invalid_alternate_count: number;
  readonly duplicate_hreflang_count: number;
  readonly has_x_default: boolean;
  readonly has_self_reference: boolean;
  readonly alternates: readonly unknown[];
  readonly recommendation: string;
}

export interface TechnologyDetectorResponse {
  readonly contract_version: "webdiag.tool.technology_detector.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly scan_mode: "static_html_bounded";
  readonly detected_count: number;
  readonly technologies: readonly unknown[];
  readonly server_header: string | null;
  readonly powered_by_header: string | null;
  readonly generator_meta: string | null;
  readonly recommendation: string;
}

export type TechnicalSeoToolResponse =
  | HreflangResponse
  | IndexabilityResponse
  | TechnologyDetectorResponse;

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

export function isIndexabilityResponse(payload: unknown): payload is IndexabilityResponse {
  return (
    isRecord(payload) &&
    payload.contract_version === "webdiag.tool.indexability.v1" &&
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.final_url === "string" &&
    typeof payload.status_code === "number" &&
    payload.scan_mode === "static_html_bounded" &&
    typeof payload.redirect_count === "number" &&
    (typeof payload.robots_txt_allowed === "boolean" || payload.robots_txt_allowed === null) &&
    (typeof payload.robots_txt_status_code === "number" || payload.robots_txt_status_code === null) &&
    typeof payload.meta_robots_noindex === "boolean" &&
    typeof payload.meta_robots_nofollow === "boolean" &&
    typeof payload.x_robots_tag_noindex === "boolean" &&
    typeof payload.x_robots_tag_nofollow === "boolean" &&
    (typeof payload.canonical_url === "string" || payload.canonical_url === null) &&
    (typeof payload.resolved_canonical_url === "string" ||
      payload.resolved_canonical_url === null) &&
    (typeof payload.canonical_matches_final_url === "boolean" ||
      payload.canonical_matches_final_url === null) &&
    typeof payload.indexable_candidate === "boolean" &&
    Array.isArray(payload.signals) &&
    typeof payload.recommendation === "string"
  );
}

export function isHreflangResponse(payload: unknown): payload is HreflangResponse {
  return (
    isRecord(payload) &&
    payload.contract_version === "webdiag.tool.hreflang.v1" &&
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.final_url === "string" &&
    typeof payload.status_code === "number" &&
    payload.scan_mode === "static_html_bounded" &&
    (typeof payload.html_lang === "string" || payload.html_lang === null) &&
    typeof payload.total_alternates === "number" &&
    typeof payload.valid_alternate_count === "number" &&
    typeof payload.invalid_alternate_count === "number" &&
    typeof payload.duplicate_hreflang_count === "number" &&
    typeof payload.has_x_default === "boolean" &&
    typeof payload.has_self_reference === "boolean" &&
    Array.isArray(payload.alternates) &&
    typeof payload.recommendation === "string"
  );
}

export function isTechnologyDetectorResponse(
  payload: unknown,
): payload is TechnologyDetectorResponse {
  return (
    isRecord(payload) &&
    payload.contract_version === "webdiag.tool.technology_detector.v1" &&
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.final_url === "string" &&
    typeof payload.status_code === "number" &&
    payload.scan_mode === "static_html_bounded" &&
    typeof payload.detected_count === "number" &&
    Array.isArray(payload.technologies) &&
    (typeof payload.server_header === "string" || payload.server_header === null) &&
    (typeof payload.powered_by_header === "string" || payload.powered_by_header === null) &&
    (typeof payload.generator_meta === "string" || payload.generator_meta === null) &&
    typeof payload.recommendation === "string"
  );
}

export function parseTechnicalSeoToolUrlInput(value: string): URL | null {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}
