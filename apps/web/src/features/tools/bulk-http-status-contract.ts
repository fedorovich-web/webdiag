export interface BulkHttpStatusResult {
  readonly contract_version: "webdiag.tool.bulk_http_status.v1";
  readonly generated_at: string;
  readonly total: number;
  readonly succeeded: number;
  readonly failed: number;
  readonly items: readonly BulkHttpStatusItem[];
}

export interface BulkHttpStatusItem {
  readonly index: number;
  readonly requested_url: string;
  readonly status: "succeeded" | "failed";
  readonly result: HttpStatusResult | null;
  readonly error: { readonly code: string; readonly message: string } | null;
}

interface HttpStatusResult {
  readonly contract_version: "webdiag.tool.http_status.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly ok: boolean;
  readonly redirect_count: number;
  readonly redirect_chain: readonly unknown[];
  readonly headers: {
    readonly content_type: string | null;
    readonly content_length: string | null;
    readonly cache_control: string | null;
    readonly server: string | null;
  };
  readonly recommendation: string;
}

function isRedirectHop(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.source_url === "string" &&
    typeof value.target_url === "string" &&
    Number.isInteger(value.status_code) &&
    typeof value.status_code === "number" &&
    value.status_code >= 100 &&
    value.status_code <= 599
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isHttpStatusResult(value: unknown): value is HttpStatusResult {
  if (!isRecord(value) || !isRecord(value.headers)) return false;
  return (
    value.contract_version === "webdiag.tool.http_status.v1" &&
    typeof value.generated_at === "string" &&
    typeof value.requested_url === "string" &&
    typeof value.final_url === "string" &&
    Number.isInteger(value.status_code) &&
    typeof value.status_code === "number" &&
    value.status_code >= 100 &&
    value.status_code <= 599 &&
    typeof value.ok === "boolean" &&
    Number.isInteger(value.redirect_count) &&
    typeof value.redirect_count === "number" &&
    value.redirect_count >= 0 &&
    Array.isArray(value.redirect_chain) &&
    value.redirect_chain.length === value.redirect_count &&
    value.redirect_chain.every(isRedirectHop) &&
    isNullableString(value.headers.content_type) &&
    isNullableString(value.headers.content_length) &&
    isNullableString(value.headers.cache_control) &&
    isNullableString(value.headers.server) &&
    typeof value.recommendation === "string"
  );
}

function isBulkItem(value: unknown, index: number): value is BulkHttpStatusItem {
  if (
    !isRecord(value) ||
    value.index !== index ||
    typeof value.requested_url !== "string" ||
    (value.status !== "succeeded" && value.status !== "failed")
  ) {
    return false;
  }
  if (value.status === "succeeded") {
    return isHttpStatusResult(value.result) && value.error === null;
  }
  return (
    value.result === null &&
    isRecord(value.error) &&
    (value.error.code === "tool_url_rejected" ||
      value.error.code === "tool_fetch_failed" ||
      value.error.code === "tool_batch_deadline_exceeded") &&
    typeof value.error.message === "string"
  );
}

export function isBulkHttpStatusResponse(value: unknown): value is BulkHttpStatusResult {
  if (
    !isRecord(value) ||
    value.contract_version !== "webdiag.tool.bulk_http_status.v1" ||
    typeof value.generated_at !== "string" ||
    !Number.isInteger(value.total) ||
    !Number.isInteger(value.succeeded) ||
    !Number.isInteger(value.failed) ||
    typeof value.total !== "number" ||
    typeof value.succeeded !== "number" ||
    typeof value.failed !== "number" ||
    value.total < 1 ||
    value.total > 50 ||
    value.succeeded < 0 ||
    value.failed < 0 ||
    value.succeeded + value.failed !== value.total ||
    !Array.isArray(value.items) ||
    value.items.length !== value.total
  ) {
    return false;
  }
  if (!value.items.every((item, index) => isBulkItem(item, index))) return false;
  const succeeded = value.items.filter((item) => item.status === "succeeded").length;
  return succeeded === value.succeeded;
}
