export const CRON_PREVIEW_WORKER_PATH = "/workers/cron-preview-worker.js";

export type CronFieldName = "minute" | "hour" | "dayOfMonth" | "month" | "dayOfWeek";

export interface CronBuilderFields {
  readonly minute: string;
  readonly hour: string;
  readonly dayOfMonth: string;
  readonly month: string;
  readonly dayOfWeek: string;
}

export interface ParsedCronField {
  readonly name: CronFieldName;
  readonly source: string;
  readonly normalized: string;
  readonly values: readonly number[];
  readonly unrestricted: boolean;
}

export interface ParsedCronExpression {
  readonly expression: string;
  readonly fields: Readonly<Record<CronFieldName, ParsedCronField>>;
}

export interface CronPreviewRequest {
  readonly kind: "preview";
  readonly requestId: number;
  readonly fromTimestamp: number;
  readonly maximumOccurrences: number;
  readonly horizonMinutes: number;
  readonly maximumIterations: number;
  readonly schedule: {
    readonly minute: readonly number[];
    readonly hour: readonly number[];
    readonly dayOfMonth: readonly number[];
    readonly month: readonly number[];
    readonly dayOfWeek: readonly number[];
    readonly dayOfMonthUnrestricted: boolean;
    readonly dayOfWeekUnrestricted: boolean;
  };
}

export interface CronPreviewReady {
  readonly kind: "ready";
}

export interface CronPreviewSuccess {
  readonly kind: "result";
  readonly ok: true;
  readonly requestId: number;
  readonly occurrences: readonly string[];
  readonly checkedMinutes: number;
  readonly truncatedByHorizon: boolean;
}

export interface CronPreviewFailure {
  readonly kind: "result";
  readonly ok: false;
  readonly requestId: number;
  readonly error: string;
}

export type CronPreviewMessage = CronPreviewReady | CronPreviewSuccess | CronPreviewFailure;

export type JwtWarningSeverity = "info" | "warning" | "critical";

export interface JwtWarning {
  readonly code: string;
  readonly severity: JwtWarningSeverity;
}

export type JwtTemporalStatus = "active" | "expired" | "not-yet-valid" | "future" | "past" | "invalid";

export interface JwtTemporalClaim {
  readonly claim: "exp" | "nbf" | "iat";
  readonly value: unknown;
  readonly iso: string | null;
  readonly status: JwtTemporalStatus;
}

export interface JwtInspectionResult {
  readonly header: Readonly<Record<string, unknown>>;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly signaturePresent: boolean;
  readonly encodedHeaderLength: number;
  readonly encodedPayloadLength: number;
  readonly encodedSignatureLength: number;
  readonly warnings: readonly JwtWarning[];
  readonly temporalClaims: readonly JwtTemporalClaim[];
}

const MAXIMUM_CRON_CHARACTERS = 256;
const MAXIMUM_CRON_LIST_PARTS = 64;
const MAXIMUM_JWT_CHARACTERS = 65_536;
const MAXIMUM_JSON_DEPTH = 64;
const MAXIMUM_JSON_NODES = 5_000;

interface CronFieldDefinition {
  readonly name: CronFieldName;
  readonly minimum: number;
  readonly maximum: number;
  readonly names?: Readonly<Record<string, number>>;
  readonly normalizeSunday?: boolean;
}

const MONTH_NAMES: Readonly<Record<string, number>> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
};

const DAY_NAMES: Readonly<Record<string, number>> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

const CRON_FIELDS: readonly CronFieldDefinition[] = [
  { name: "minute", minimum: 0, maximum: 59 },
  { name: "hour", minimum: 0, maximum: 23 },
  { name: "dayOfMonth", minimum: 1, maximum: 31 },
  { name: "month", minimum: 1, maximum: 12, names: MONTH_NAMES },
  { name: "dayOfWeek", minimum: 0, maximum: 7, names: DAY_NAMES, normalizeSunday: true },
];

function fail(code: string): never {
  throw new Error(code);
}

function integer(value: string, code: string): number {
  if (!/^\d+$/u.test(value)) fail(code);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) fail(code);
  return parsed;
}

function resolveCronValue(token: string, definition: CronFieldDefinition): number {
  const upper = token.toUpperCase();
  const named = definition.names?.[upper];
  const value = named ?? integer(token, "invalid_cron_value");
  if (value < definition.minimum || value > definition.maximum) fail("cron_value_out_of_range");
  return value;
}

function rangeValues(start: number, end: number, step: number, definition: CronFieldDefinition): number[] {
  if (step <= 0) fail("invalid_cron_step");
  const fieldCardinality = definition.normalizeSunday ? 7 : definition.maximum - definition.minimum + 1;
  if (step > fieldCardinality) fail("cron_step_out_of_range");
  if (start > end) fail("reversed_cron_range");
  const values: number[] = [];
  for (let value = start; value <= end; value += step) {
    const normalized = definition.normalizeSunday && value === 7 ? 0 : value;
    values.push(normalized);
  }
  return values;
}

function parseCronPart(part: string, definition: CronFieldDefinition): number[] {
  if (!part) fail("empty_cron_list_part");
  const pieces = part.split("/");
  if (pieces.length > 2) fail("unsupported_cron_syntax");
  const base = pieces[0];
  if (!base) fail("unsupported_cron_syntax");
  const step = pieces[1] === undefined ? 1 : integer(pieces[1], "invalid_cron_step");
  if (step <= 0) fail("invalid_cron_step");

  if (base === "*") return rangeValues(definition.minimum, definition.maximum, step, definition);

  const range = base.split("-");
  if (range.length === 1) {
    if (pieces[1] !== undefined) fail("cron_step_requires_wildcard_or_range");
    const value = resolveCronValue(base, definition);
    return [definition.normalizeSunday && value === 7 ? 0 : value];
  }
  if (range.length !== 2 || !range[0] || !range[1]) fail("unsupported_cron_syntax");
  const start = resolveCronValue(range[0], definition);
  const end = resolveCronValue(range[1], definition);
  return rangeValues(start, end, step, definition);
}

function fullRange(definition: CronFieldDefinition): readonly number[] {
  const values = new Set<number>();
  for (let value = definition.minimum; value <= definition.maximum; value += 1) {
    values.add(definition.normalizeSunday && value === 7 ? 0 : value);
  }
  return [...values].sort((left, right) => left - right);
}

function parseCronField(source: string, definition: CronFieldDefinition): ParsedCronField {
  if (!source) fail("empty_cron_field");
  if (/[?LW#@]/iu.test(source)) fail("unsupported_cron_syntax");
  if (!/^[A-Za-z0-9*/,-]+$/u.test(source)) fail("unsupported_cron_syntax");
  const parts = source.split(",");
  if (parts.length > MAXIMUM_CRON_LIST_PARTS) fail("cron_expansion_limit");
  const values = new Set<number>();
  for (const part of parts) {
    for (const value of parseCronPart(part, definition)) values.add(value);
  }
  const sorted = [...values].sort((left, right) => left - right);
  if (!sorted.length) fail("empty_cron_field");
  const expected = fullRange(definition);
  const unrestricted = sorted.length === expected.length && sorted.every((value, index) => value === expected[index]);
  return {
    name: definition.name,
    source,
    normalized: definition.normalizeSunday
      ? source.toUpperCase().replace(/(^|,)7(?=,|$)/gu, (_match, prefix: string) => `${prefix}0`)
      : source.toUpperCase(),
    values: sorted,
    unrestricted,
  };
}

export function parseCronExpression(input: string): ParsedCronExpression {
  const trimmed = input.trim();
  if (!trimmed) fail("empty_cron_expression");
  if (trimmed.length > MAXIMUM_CRON_CHARACTERS) fail("cron_expression_too_long");
  const parts = trimmed.split(/\s+/u);
  if (parts.length !== CRON_FIELDS.length) fail("invalid_cron_field_count");

  const parsed = CRON_FIELDS.map((definition, index) => parseCronField(parts[index] ?? "", definition));
  const fields = Object.fromEntries(parsed.map((field) => [field.name, field])) as Record<CronFieldName, ParsedCronField>;
  return {
    expression: parsed.map((field) => field.normalized).join(" "),
    fields,
  };
}

export function buildCronExpression(fields: CronBuilderFields): ParsedCronExpression {
  return parseCronExpression([
    fields.minute,
    fields.hour,
    fields.dayOfMonth,
    fields.month,
    fields.dayOfWeek,
  ].join(" "));
}

export function createCronPreviewRequest(
  parsed: ParsedCronExpression,
  options: {
    readonly requestId: number;
    readonly fromTimestamp: number;
    readonly maximumOccurrences?: number;
    readonly horizonDays?: number;
  },
): CronPreviewRequest {
  const maximumOccurrences = options.maximumOccurrences ?? 10;
  const horizonDays = options.horizonDays ?? 366;
  if (!Number.isFinite(options.fromTimestamp)) fail("invalid_preview_start");
  if (!Number.isInteger(maximumOccurrences) || maximumOccurrences < 1 || maximumOccurrences > 10) fail("invalid_preview_occurrence_limit");
  if (!Number.isInteger(horizonDays) || horizonDays < 1 || horizonDays > 366) fail("invalid_preview_horizon");
  const horizonMinutes = horizonDays * 24 * 60;
  return {
    kind: "preview",
    requestId: options.requestId,
    fromTimestamp: options.fromTimestamp,
    maximumOccurrences,
    horizonMinutes,
    maximumIterations: Math.min(horizonMinutes, 600_000),
    schedule: {
      minute: parsed.fields.minute.values,
      hour: parsed.fields.hour.values,
      dayOfMonth: parsed.fields.dayOfMonth.values,
      month: parsed.fields.month.values,
      dayOfWeek: parsed.fields.dayOfWeek.values,
      dayOfMonthUnrestricted: parsed.fields.dayOfMonth.unrestricted,
      dayOfWeekUnrestricted: parsed.fields.dayOfWeek.unrestricted,
    },
  };
}

function decodeBase64UrlBytes(segment: string): Uint8Array {
  if (!segment) fail("empty_jwt_segment");
  if (!/^[A-Za-z0-9_-]+$/u.test(segment)) fail("invalid_base64url");
  if (segment.length % 4 === 1) fail("invalid_base64url");
  const normalized = segment.replace(/-/gu, "+").replace(/_/gu, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    fail("invalid_base64url");
  }
  const canonical = btoa(binary).replace(/\+/gu, "-").replace(/\//gu, "_").replace(/=+$/u, "");
  if (canonical !== segment) fail("invalid_base64url");
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function decodeBase64UrlSegment(segment: string): string {
  const bytes = decodeBase64UrlBytes(segment);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail("invalid_utf8");
  }
}

function parseJwtObject(segment: string, kind: "header" | "payload"): Readonly<Record<string, unknown>> {
  const text = decodeBase64UrlSegment(segment);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    fail("invalid_jwt_json");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) fail(`non_object_jwt_${kind}`);
  validateJsonBounds(parsed);
  return parsed as Readonly<Record<string, unknown>>;
}

function validateJsonBounds(root: unknown): void {
  const queue: Array<{ readonly value: unknown; readonly depth: number }> = [{ value: root, depth: 1 }];
  let nodes = 0;
  while (queue.length) {
    const current = queue.pop();
    if (!current) break;
    nodes += 1;
    if (nodes > MAXIMUM_JSON_NODES) fail("jwt_json_node_limit");
    if (current.depth > MAXIMUM_JSON_DEPTH) fail("jwt_json_depth_limit");
    if (!current.value || typeof current.value !== "object") continue;
    for (const value of Object.values(current.value)) queue.push({ value, depth: current.depth + 1 });
  }
}

function temporalClaim(
  claim: "exp" | "nbf" | "iat",
  value: unknown,
  nowSeconds: number,
  clockSkewSeconds: number,
): JwtTemporalClaim {
  if (typeof value !== "number" || !Number.isFinite(value)) return { claim, value, iso: null, status: "invalid" };
  const date = new Date(value * 1_000);
  const iso = Number.isNaN(date.valueOf()) ? null : date.toISOString();
  if (!iso) return { claim, value, iso: null, status: "invalid" };
  if (claim === "exp") return { claim, value, iso, status: value < nowSeconds - clockSkewSeconds ? "expired" : "active" };
  if (claim === "nbf") return { claim, value, iso, status: value > nowSeconds + clockSkewSeconds ? "not-yet-valid" : "active" };
  return { claim, value, iso, status: value > nowSeconds + clockSkewSeconds ? "future" : "past" };
}

function warning(code: string, severity: JwtWarningSeverity): JwtWarning {
  return { code, severity };
}

const KNOWN_JWS_ALGORITHMS = new Set([
  "HS256", "HS384", "HS512",
  "RS256", "RS384", "RS512",
  "ES256", "ES384", "ES512",
  "PS256", "PS384", "PS512",
  "EdDSA",
]);

export function inspectJwt(
  input: string,
  options: { readonly nowSeconds?: number; readonly clockSkewSeconds?: number } = {},
): JwtInspectionResult {
  const token = input.trim();
  if (!token) fail("empty_jwt");
  if (token.length > MAXIMUM_JWT_CHARACTERS) fail("jwt_too_large");
  const segments = token.split(".");
  if (segments.length === 5) fail("encrypted_jwe_unsupported");
  if (segments.length !== 3) fail("invalid_jwt_segment_count");
  const headerSegment = segments[0] ?? "";
  const payloadSegment = segments[1] ?? "";
  const signatureSegment = segments[2] ?? "";
  const header = parseJwtObject(headerSegment, "header");
  const payload = parseJwtObject(payloadSegment, "payload");
  if (signatureSegment) {
    try {
      decodeBase64UrlBytes(signatureSegment);
    } catch {
      fail("invalid_base64url_signature");
    }
  }

  const warnings: JwtWarning[] = [warning("decode_does_not_verify_signature", "critical")];
  const algorithm = header.alg;
  if (algorithm === undefined) warnings.push(warning("missing_alg", "critical"));
  else if (typeof algorithm !== "string" || !algorithm) warnings.push(warning("invalid_alg", "critical"));
  else if (algorithm.toLowerCase() === "none") warnings.push(warning("alg_none", "critical"));
  else if (!KNOWN_JWS_ALGORITHMS.has(algorithm)) warnings.push(warning("unknown_alg", "warning"));
  else if (algorithm.startsWith("HS")) warnings.push(warning("symmetric_algorithm_requires_shared_secret", "info"));

  if (!signatureSegment) warnings.push(warning("empty_signature", algorithm === "none" ? "critical" : "warning"));
  if (header.typ !== undefined && typeof header.typ !== "string") warnings.push(warning("invalid_typ", "warning"));
  if (header.kid !== undefined && typeof header.kid !== "string") warnings.push(warning("invalid_kid", "warning"));

  const nowSeconds = options.nowSeconds ?? Date.now() / 1_000;
  const clockSkewSeconds = options.clockSkewSeconds ?? 0;
  if (!Number.isFinite(nowSeconds)) fail("invalid_current_time");
  if (!Number.isFinite(clockSkewSeconds) || clockSkewSeconds < 0 || clockSkewSeconds > 3_600) fail("invalid_clock_skew");

  const temporalClaims: JwtTemporalClaim[] = [];
  for (const claim of ["exp", "nbf", "iat"] as const) {
    if (!(claim in payload)) continue;
    const inspected = temporalClaim(claim, payload[claim], nowSeconds, clockSkewSeconds);
    temporalClaims.push(inspected);
    if (inspected.status === "invalid") warnings.push(warning(`invalid_${claim}`, "warning"));
    if (inspected.status === "expired") warnings.push(warning("token_expired_by_browser_clock", "warning"));
    if (inspected.status === "not-yet-valid") warnings.push(warning("token_not_yet_valid_by_browser_clock", "warning"));
    if (inspected.status === "future") warnings.push(warning("issued_at_in_future_by_browser_clock", "warning"));
  }

  const audience = payload.aud;
  if (audience !== undefined) {
    const validAudience = typeof audience === "string" && audience.length > 0
      || Array.isArray(audience) && audience.length > 0 && audience.every((value) => typeof value === "string" && value.length > 0);
    if (!validAudience) warnings.push(warning("invalid_aud", "warning"));
  }
  for (const claim of ["iss", "sub", "jti"] as const) {
    if (payload[claim] !== undefined && typeof payload[claim] !== "string") warnings.push(warning(`invalid_${claim}`, "warning"));
  }

  return {
    header,
    payload,
    signaturePresent: signatureSegment.length > 0,
    encodedHeaderLength: headerSegment.length,
    encodedPayloadLength: payloadSegment.length,
    encodedSignatureLength: signatureSegment.length,
    warnings,
    temporalClaims,
  };
}
