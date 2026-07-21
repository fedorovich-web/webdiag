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

export interface CanonicalToolResponse {
  readonly contract_version: "webdiag.tool.canonical.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly content_type: string | null;
  readonly canonical_url: string | null;
  readonly resolved_canonical_url: string | null;
  readonly canonical_present: boolean;
  readonly canonical_is_absolute: boolean | null;
  readonly canonical_matches_final_url: boolean | null;
  readonly canonical_host_matches_final_url: boolean | null;
  readonly has_noindex: boolean;
  readonly redirect_count: number;
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

export function isCanonicalToolResponse(payload: unknown): payload is CanonicalToolResponse {
  if (!isRecord(payload) || payload.contract_version !== "webdiag.tool.canonical.v1") return false;
  return (
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.final_url === "string" &&
    typeof payload.status_code === "number" &&
    (typeof payload.content_type === "string" || payload.content_type === null) &&
    (typeof payload.canonical_url === "string" || payload.canonical_url === null) &&
    (typeof payload.resolved_canonical_url === "string" || payload.resolved_canonical_url === null) &&
    typeof payload.canonical_present === "boolean" &&
    (typeof payload.canonical_is_absolute === "boolean" || payload.canonical_is_absolute === null) &&
    (typeof payload.canonical_matches_final_url === "boolean" || payload.canonical_matches_final_url === null) &&
    (typeof payload.canonical_host_matches_final_url === "boolean" || payload.canonical_host_matches_final_url === null) &&
    typeof payload.has_noindex === "boolean" &&
    typeof payload.redirect_count === "number" &&
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
    const upstream = await fetch(`${getApiBaseUrl()}/v1/tools/canonical`, {
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

    if (!isCanonicalToolResponse(data)) {
      return toJsonResponse(
        { detail: { code: "tool_api_invalid_response", message: "Tool API returned an invalid canonical result." } },
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
