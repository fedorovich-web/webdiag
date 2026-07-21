export interface ToolApiErrorPayload {
  readonly detail: { readonly code: string; readonly message: string };
}

export interface CertificateNameResult {
  readonly common_name: string | null;
  readonly subject_alt_names: readonly string[];
}

export interface SslCertificateResponse {
  readonly contract_version: "webdiag.tool.ssl_certificate_checker.v1";
  readonly generated_at: string;
  readonly hostname: string;
  readonly port: number;
  readonly peer_ip: string | null;
  readonly issuer_common_name: string | null;
  readonly subject: CertificateNameResult;
  readonly not_before: string | null;
  readonly not_after: string | null;
  readonly days_until_expiry: number | null;
  readonly expired: boolean;
  readonly hostname_matches: boolean;
  readonly san_count: number;
  readonly status: "pass" | "warning" | "fail";
  readonly recommendation: string;
}

export interface TlsConfigurationResponse {
  readonly contract_version: "webdiag.tool.tls_configuration_checker.v1";
  readonly generated_at: string;
  readonly hostname: string;
  readonly port: number;
  readonly peer_ip: string | null;
  readonly tls_version: string | null;
  readonly cipher_suite: string | null;
  readonly key_exchange_bits: number | null;
  readonly negotiated_protocol: string | null;
  readonly protocol_status: "pass" | "warning" | "fail";
  readonly certificate_hostname_matches: boolean;
  readonly certificate_days_until_expiry: number | null;
  readonly status: "pass" | "warning" | "fail";
  readonly recommendation: string;
}

export interface HttpCompressionResponse {
  readonly contract_version: "webdiag.tool.http_compression_checker.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly content_type: string | null;
  readonly content_encoding: string | null;
  readonly vary: string | null;
  readonly content_length: number | null;
  readonly compressed: boolean;
  readonly compressible_candidate: boolean;
  readonly vary_accept_encoding: boolean;
  readonly redirect_count: number;
  readonly status: "pass" | "warning" | "fail";
  readonly recommendation: string;
}


export interface HeaderItemResult {
  readonly name: string;
  readonly value: string;
}

export interface HttpHeadersAnalyzerResponse {
  readonly contract_version: "webdiag.tool.http_headers_analyzer.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly header_count: number;
  readonly redirect_count: number;
  readonly server_header_present: boolean;
  readonly powered_by_header_present: boolean;
  readonly cache_control: string | null;
  readonly content_type: string | null;
  readonly content_length: number | null;
  readonly content_encoding: string | null;
  readonly vary: string | null;
  readonly headers: readonly HeaderItemResult[];
  readonly status: "pass" | "warning" | "fail";
  readonly recommendation: string;
}

export interface HttpProtocolResponse {
  readonly contract_version: "webdiag.tool.http_protocol_checker.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly scheme: "http" | "https";
  readonly tls_version: string | null;
  readonly negotiated_protocol: string | null;
  readonly http2_supported: boolean;
  readonly http3_advertised: boolean;
  readonly alt_svc: string | null;
  readonly redirect_count: number;
  readonly status: "pass" | "warning" | "fail";
  readonly recommendation: string;
}

export interface CorsResponse {
  readonly contract_version: "webdiag.tool.cors_checker.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly tested_origin: string;
  readonly status_code: number;
  readonly allow_origin: string | null;
  readonly allow_methods: string | null;
  readonly allow_headers: string | null;
  readonly expose_headers: string | null;
  readonly allow_credentials: boolean;
  readonly vary_origin: boolean;
  readonly allows_tested_origin: boolean;
  readonly wildcard_with_credentials: boolean;
  readonly redirect_count: number;
  readonly status: "pass" | "warning" | "fail";
  readonly recommendation: string;
}


export interface ServerTimingMetricResult {
  readonly name: string;
  readonly duration_ms: number | null;
  readonly description: string | null;
}

export interface ServerTimingAnalyzerResponse {
  readonly contract_version: "webdiag.tool.server_timing_analyzer.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly raw_header: string | null;
  readonly server_timing_present: boolean;
  readonly metric_count: number;
  readonly metrics: readonly ServerTimingMetricResult[];
  readonly redirect_count: number;
  readonly status: "pass" | "warning" | "fail";
  readonly recommendation: string;
}

export interface CookieItemResult {
  readonly name: string;
  readonly secure: boolean;
  readonly http_only: boolean;
  readonly same_site: string | null;
  readonly domain: string | null;
  readonly path: string | null;
  readonly persistent: boolean;
  readonly issues: readonly string[];
}

export interface CookiePolicyResponse {
  readonly contract_version: "webdiag.tool.cookie_policy_checker.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly set_cookie_count: number;
  readonly secure_count: number;
  readonly http_only_count: number;
  readonly same_site_count: number;
  readonly issue_count: number;
  readonly cookies: readonly CookieItemResult[];
  readonly redirect_count: number;
  readonly status: "pass" | "warning" | "fail";
  readonly recommendation: string;
}

export interface MixedContentItemResult {
  readonly url: string;
  readonly source: string;
  readonly active: boolean;
}

export interface MixedContentResponse {
  readonly contract_version: "webdiag.tool.mixed_content_checker.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly page_scheme: "http" | "https";
  readonly candidate_count: number;
  readonly mixed_content_count: number;
  readonly active_mixed_content_count: number;
  readonly passive_mixed_content_count: number;
  readonly sample_items: readonly MixedContentItemResult[];
  readonly redirect_count: number;
  readonly status: "pass" | "warning" | "fail";
  readonly recommendation: string;
}

export type ProtocolSecurityToolResponse =
  | SslCertificateResponse
  | TlsConfigurationResponse
  | HttpCompressionResponse
  | HttpHeadersAnalyzerResponse
  | HttpProtocolResponse
  | CorsResponse
  | ServerTimingAnalyzerResponse
  | CookiePolicyResponse
  | MixedContentResponse;

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

function isStatus(value: unknown): value is "pass" | "warning" | "fail" {
  return value === "pass" || value === "warning" || value === "fail";
}

export function isSslCertificateResponse(payload: unknown): payload is SslCertificateResponse {
  return (
    isRecord(payload) &&
    payload.contract_version === "webdiag.tool.ssl_certificate_checker.v1" &&
    typeof payload.generated_at === "string" &&
    typeof payload.hostname === "string" &&
    typeof payload.port === "number" &&
    (typeof payload.peer_ip === "string" || payload.peer_ip === null) &&
    (typeof payload.issuer_common_name === "string" || payload.issuer_common_name === null) &&
    isRecord(payload.subject) &&
    (typeof payload.subject.common_name === "string" || payload.subject.common_name === null) &&
    Array.isArray(payload.subject.subject_alt_names) &&
    (typeof payload.not_before === "string" || payload.not_before === null) &&
    (typeof payload.not_after === "string" || payload.not_after === null) &&
    (typeof payload.days_until_expiry === "number" || payload.days_until_expiry === null) &&
    typeof payload.expired === "boolean" &&
    typeof payload.hostname_matches === "boolean" &&
    typeof payload.san_count === "number" &&
    isStatus(payload.status) &&
    typeof payload.recommendation === "string"
  );
}

export function isTlsConfigurationResponse(
  payload: unknown,
): payload is TlsConfigurationResponse {
  return (
    isRecord(payload) &&
    payload.contract_version === "webdiag.tool.tls_configuration_checker.v1" &&
    typeof payload.generated_at === "string" &&
    typeof payload.hostname === "string" &&
    typeof payload.port === "number" &&
    (typeof payload.peer_ip === "string" || payload.peer_ip === null) &&
    (typeof payload.tls_version === "string" || payload.tls_version === null) &&
    (typeof payload.cipher_suite === "string" || payload.cipher_suite === null) &&
    (typeof payload.key_exchange_bits === "number" || payload.key_exchange_bits === null) &&
    (typeof payload.negotiated_protocol === "string" || payload.negotiated_protocol === null) &&
    isStatus(payload.protocol_status) &&
    typeof payload.certificate_hostname_matches === "boolean" &&
    (
      typeof payload.certificate_days_until_expiry === "number" ||
      payload.certificate_days_until_expiry === null
    ) &&
    isStatus(payload.status) &&
    typeof payload.recommendation === "string"
  );
}

export function isHttpCompressionResponse(payload: unknown): payload is HttpCompressionResponse {
  return (
    isRecord(payload) &&
    payload.contract_version === "webdiag.tool.http_compression_checker.v1" &&
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.final_url === "string" &&
    typeof payload.status_code === "number" &&
    (typeof payload.content_type === "string" || payload.content_type === null) &&
    (typeof payload.content_encoding === "string" || payload.content_encoding === null) &&
    (typeof payload.vary === "string" || payload.vary === null) &&
    (typeof payload.content_length === "number" || payload.content_length === null) &&
    typeof payload.compressed === "boolean" &&
    typeof payload.compressible_candidate === "boolean" &&
    typeof payload.vary_accept_encoding === "boolean" &&
    typeof payload.redirect_count === "number" &&
    isStatus(payload.status) &&
    typeof payload.recommendation === "string"
  );
}


export function isHttpHeadersAnalyzerResponse(
  payload: unknown,
): payload is HttpHeadersAnalyzerResponse {
  return (
    isRecord(payload) &&
    payload.contract_version === "webdiag.tool.http_headers_analyzer.v1" &&
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.final_url === "string" &&
    typeof payload.status_code === "number" &&
    typeof payload.header_count === "number" &&
    typeof payload.redirect_count === "number" &&
    typeof payload.server_header_present === "boolean" &&
    typeof payload.powered_by_header_present === "boolean" &&
    (typeof payload.cache_control === "string" || payload.cache_control === null) &&
    (typeof payload.content_type === "string" || payload.content_type === null) &&
    (typeof payload.content_length === "number" || payload.content_length === null) &&
    (typeof payload.content_encoding === "string" || payload.content_encoding === null) &&
    (typeof payload.vary === "string" || payload.vary === null) &&
    Array.isArray(payload.headers) &&
    payload.headers.every(
      (item) => isRecord(item) && typeof item.name === "string" && typeof item.value === "string",
    ) &&
    isStatus(payload.status) &&
    typeof payload.recommendation === "string"
  );
}

export function isHttpProtocolResponse(payload: unknown): payload is HttpProtocolResponse {
  return (
    isRecord(payload) &&
    payload.contract_version === "webdiag.tool.http_protocol_checker.v1" &&
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.final_url === "string" &&
    typeof payload.status_code === "number" &&
    (payload.scheme === "http" || payload.scheme === "https") &&
    (typeof payload.tls_version === "string" || payload.tls_version === null) &&
    (typeof payload.negotiated_protocol === "string" || payload.negotiated_protocol === null) &&
    typeof payload.http2_supported === "boolean" &&
    typeof payload.http3_advertised === "boolean" &&
    (typeof payload.alt_svc === "string" || payload.alt_svc === null) &&
    typeof payload.redirect_count === "number" &&
    isStatus(payload.status) &&
    typeof payload.recommendation === "string"
  );
}

export function isCorsResponse(payload: unknown): payload is CorsResponse {
  return (
    isRecord(payload) &&
    payload.contract_version === "webdiag.tool.cors_checker.v1" &&
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.final_url === "string" &&
    typeof payload.tested_origin === "string" &&
    typeof payload.status_code === "number" &&
    (typeof payload.allow_origin === "string" || payload.allow_origin === null) &&
    (typeof payload.allow_methods === "string" || payload.allow_methods === null) &&
    (typeof payload.allow_headers === "string" || payload.allow_headers === null) &&
    (typeof payload.expose_headers === "string" || payload.expose_headers === null) &&
    typeof payload.allow_credentials === "boolean" &&
    typeof payload.vary_origin === "boolean" &&
    typeof payload.allows_tested_origin === "boolean" &&
    typeof payload.wildcard_with_credentials === "boolean" &&
    typeof payload.redirect_count === "number" &&
    isStatus(payload.status) &&
    typeof payload.recommendation === "string"
  );
}


export function isServerTimingAnalyzerResponse(
  payload: unknown,
): payload is ServerTimingAnalyzerResponse {
  return (
    isRecord(payload) &&
    payload.contract_version === "webdiag.tool.server_timing_analyzer.v1" &&
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.final_url === "string" &&
    typeof payload.status_code === "number" &&
    (typeof payload.raw_header === "string" || payload.raw_header === null) &&
    typeof payload.server_timing_present === "boolean" &&
    typeof payload.metric_count === "number" &&
    Array.isArray(payload.metrics) &&
    payload.metrics.every(
      (item) => isRecord(item) &&
        typeof item.name === "string" &&
        (typeof item.duration_ms === "number" || item.duration_ms === null) &&
        (typeof item.description === "string" || item.description === null),
    ) &&
    typeof payload.redirect_count === "number" &&
    isStatus(payload.status) &&
    typeof payload.recommendation === "string"
  );
}

export function isCookiePolicyResponse(payload: unknown): payload is CookiePolicyResponse {
  return (
    isRecord(payload) &&
    payload.contract_version === "webdiag.tool.cookie_policy_checker.v1" &&
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.final_url === "string" &&
    typeof payload.status_code === "number" &&
    typeof payload.set_cookie_count === "number" &&
    typeof payload.secure_count === "number" &&
    typeof payload.http_only_count === "number" &&
    typeof payload.same_site_count === "number" &&
    typeof payload.issue_count === "number" &&
    Array.isArray(payload.cookies) &&
    payload.cookies.every(
      (item) => isRecord(item) &&
        typeof item.name === "string" &&
        typeof item.secure === "boolean" &&
        typeof item.http_only === "boolean" &&
        (typeof item.same_site === "string" || item.same_site === null) &&
        (typeof item.domain === "string" || item.domain === null) &&
        (typeof item.path === "string" || item.path === null) &&
        typeof item.persistent === "boolean" &&
        Array.isArray(item.issues),
    ) &&
    typeof payload.redirect_count === "number" &&
    isStatus(payload.status) &&
    typeof payload.recommendation === "string"
  );
}

export function isMixedContentResponse(payload: unknown): payload is MixedContentResponse {
  return (
    isRecord(payload) &&
    payload.contract_version === "webdiag.tool.mixed_content_checker.v1" &&
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.final_url === "string" &&
    typeof payload.status_code === "number" &&
    (payload.page_scheme === "http" || payload.page_scheme === "https") &&
    typeof payload.candidate_count === "number" &&
    typeof payload.mixed_content_count === "number" &&
    typeof payload.active_mixed_content_count === "number" &&
    typeof payload.passive_mixed_content_count === "number" &&
    Array.isArray(payload.sample_items) &&
    payload.sample_items.every(
      (item) => isRecord(item) &&
        typeof item.url === "string" &&
        typeof item.source === "string" &&
        typeof item.active === "boolean",
    ) &&
    typeof payload.redirect_count === "number" &&
    isStatus(payload.status) &&
    typeof payload.recommendation === "string"
  );
}

export function parseHostnameInput(value: string): string | null {
  const hostname = value.trim().replace(/\.$/, "").toLowerCase();
  if (!hostname || hostname.includes("://") || hostname.includes("/") || hostname.includes("@")) {
    return null;
  }
  if (!hostname.includes(".")) return null;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return null;
  if (!/^[a-z0-9.-]+$/.test(hostname)) return null;
  if (hostname.split(".").some((label) => !label || label.startsWith("-") || label.endsWith("-"))) {
    return null;
  }
  return hostname;
}

export function parseHttpsUrlInput(value: string): string | null {
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    if (parsed.username || parsed.password) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}


export function parseOriginInput(value: string): string | null {
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    if (parsed.username || parsed.password || parsed.pathname !== "/") return null;
    if (parsed.search || parsed.hash) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}
