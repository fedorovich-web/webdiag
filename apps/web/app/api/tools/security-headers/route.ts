import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
const REQUEST_TIMEOUT_MS = 15_000;

interface SecurityHeaderCheckResponse {
  readonly id: string;
  readonly header: string;
  readonly title: string;
  readonly value: string | null;
  readonly present: boolean;
  readonly status: "pass" | "warning" | "fail";
  readonly severity: "info" | "medium" | "high";
  readonly recommendation: string;
}

interface SecurityHeadersResponse {
  readonly contract_version: "webdiag.tool.security_headers.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly is_https: boolean;
  readonly redirect_count: number;
  readonly score: number;
  readonly risk_level: "low" | "medium" | "high";
  readonly present_count: number;
  readonly missing_count: number;
  readonly checks: readonly SecurityHeaderCheckResponse[];
  readonly recommendation: string;
}

interface ToolApiErrorPayload {
  readonly detail: {
    readonly code: string;
    readonly message: string;
  };
}

function getApiBaseUrl(): string {
  const raw = process.env.WEBDIAG_API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_WEBDIAG_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  return raw.replace(/\/+$/, "");
}

function toJsonResponse(payload: unknown, status: number) {
  return NextResponse.json(payload, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isToolErrorPayload(payload: unknown): payload is ToolApiErrorPayload {
  if (!isRecord(payload) || !isRecord(payload.detail)) return false;
  return typeof payload.detail.code === "string" && typeof payload.detail.message === "string";
}

function isSecurityHeaderCheckResponse(payload: unknown): payload is SecurityHeaderCheckResponse {
  if (!isRecord(payload)) return false;
  return (
    typeof payload.id === "string" &&
    typeof payload.header === "string" &&
    typeof payload.title === "string" &&
    (typeof payload.value === "string" || payload.value === null) &&
    typeof payload.present === "boolean" &&
    (payload.status === "pass" || payload.status === "warning" || payload.status === "fail") &&
    (payload.severity === "info" || payload.severity === "medium" || payload.severity === "high") &&
    typeof payload.recommendation === "string"
  );
}

export function isSecurityHeadersResponse(payload: unknown): payload is SecurityHeadersResponse {
  if (!isRecord(payload) || payload.contract_version !== "webdiag.tool.security_headers.v1") return false;
  return (
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.final_url === "string" &&
    typeof payload.status_code === "number" &&
    typeof payload.is_https === "boolean" &&
    typeof payload.redirect_count === "number" &&
    typeof payload.score === "number" &&
    (payload.risk_level === "low" || payload.risk_level === "medium" || payload.risk_level === "high") &&
    typeof payload.present_count === "number" &&
    typeof payload.missing_count === "number" &&
    Array.isArray(payload.checks) &&
    payload.checks.every(isSecurityHeaderCheckResponse) &&
    typeof payload.recommendation === "string"
  );
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || typeof (payload as { url?: unknown }).url !== "string") {
    return toJsonResponse(
      { detail: { code: "tool_bad_request", message: "Request body must include a URL string." } },
      400,
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const upstream = await fetch(`${getApiBaseUrl()}/v1/tools/security-headers`, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({ url: (payload as { url: string }).url }),
      cache: "no-store",
      signal: controller.signal,
    });

    const data = await parseJson(upstream);
    if (data === undefined) {
      return toJsonResponse(
        { detail: { code: "tool_api_invalid_response", message: "Tool API returned invalid JSON." } },
        502,
      );
    }

    if (!upstream.ok) {
      return toJsonResponse(
        isToolErrorPayload(data) ? data : { detail: { code: "tool_api_error", message: "Tool API request failed." } },
        upstream.status,
      );
    }

    if (!isSecurityHeadersResponse(data)) {
      return toJsonResponse(
        { detail: { code: "tool_api_invalid_response", message: "Tool API returned an invalid security headers result." } },
        502,
      );
    }

    return toJsonResponse(data, upstream.status);
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === "AbortError";
    return toJsonResponse(
      {
        detail: {
          code: aborted ? "tool_api_timeout" : "tool_api_unavailable",
          message: aborted ? "Tool API request timed out." : "Tool API is not available.",
        },
      },
      502,
    );
  } finally {
    clearTimeout(timeout);
  }
}
