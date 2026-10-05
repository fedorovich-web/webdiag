import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
const REQUEST_TIMEOUT_MS = 15_000;

interface ToolApiErrorPayload {
  readonly detail: {
    readonly code: string;
    readonly message: string;
  };
}

export interface RedirectHopResult {
  readonly source_url: string;
  readonly target_url: string;
  readonly status_code: number;
}

export interface HttpStatusToolResponse {
  readonly contract_version: "webdiag.tool.http_status.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly ok: boolean;
  readonly redirect_count: number;
  readonly redirect_chain: readonly RedirectHopResult[];
  readonly headers: {
    readonly content_type: string | null;
    readonly content_length: string | null;
    readonly cache_control: string | null;
    readonly server: string | null;
  };
  readonly recommendation: string;
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

function isRedirectHop(payload: unknown): payload is RedirectHopResult {
  if (!isRecord(payload)) return false;
  return typeof payload.source_url === "string" && typeof payload.target_url === "string" && typeof payload.status_code === "number";
}

export function isHttpStatusToolResponse(payload: unknown): payload is HttpStatusToolResponse {
  if (!isRecord(payload)) return false;
  if (payload.contract_version !== "webdiag.tool.http_status.v1") return false;
  if (!isRecord(payload.headers)) return false;
  return (
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.final_url === "string" &&
    typeof payload.status_code === "number" &&
    typeof payload.ok === "boolean" &&
    typeof payload.redirect_count === "number" &&
    Array.isArray(payload.redirect_chain) &&
    payload.redirect_chain.every(isRedirectHop) &&
    (typeof payload.headers.content_type === "string" || payload.headers.content_type === null) &&
    (typeof payload.headers.content_length === "string" || payload.headers.content_length === null) &&
    (typeof payload.headers.cache_control === "string" || payload.headers.cache_control === null) &&
    (typeof payload.headers.server === "string" || payload.headers.server === null) &&
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
    const upstream = await fetch(`${getApiBaseUrl()}/v1/tools/http-status`, {
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

    if (!isHttpStatusToolResponse(data)) {
      return toJsonResponse(
        { detail: { code: "tool_api_invalid_response", message: "Tool API returned an invalid HTTP status result." } },
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
