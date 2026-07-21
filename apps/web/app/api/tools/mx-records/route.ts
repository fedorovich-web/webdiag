import { NextRequest, NextResponse } from "next/server";
import {
  isMxCheckerResponse,
  isToolErrorPayload,
} from "../../../../src/features/tools/network-dns-tool-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
const REQUEST_TIMEOUT_MS = 20_000;

function getApiBaseUrl(): string {
  const raw =
    process.env.WEBDIAG_API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_WEBDIAG_API_BASE_URL ??
    DEFAULT_API_BASE_URL;
  return raw.replace(/\/+$/, "");
}

function toJsonResponse(payload: unknown, status: number) {
  return NextResponse.json(payload, {
    status,
    headers: { "cache-control": "no-store" },
  });
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
  if (
    !payload ||
    typeof payload !== "object" ||
    typeof (payload as { domain?: unknown }).domain !== "string"
  ) {
    return toJsonResponse(
      { detail: { code: "tool_bad_request", message: "Request body must include a domain string." } },
      400,
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const upstreamResponse = await fetch(`${getApiBaseUrl()}/v1/tools/mx-records`, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal,
    });
    const data = await parseJson(upstreamResponse);
    if (data === undefined) {
      return toJsonResponse(
        { detail: { code: "tool_api_invalid_response", message: "Tool API returned invalid JSON." } },
        502,
      );
    }
    if (!upstreamResponse.ok) {
      return toJsonResponse(
        isToolErrorPayload(data)
          ? data
          : { detail: { code: "tool_api_error", message: "Tool API request failed." } },
        upstreamResponse.status,
      );
    }
    if (!isMxCheckerResponse(data)) {
      return toJsonResponse(
        {
          detail: {
            code: "tool_api_invalid_response",
            message: "Tool API returned an invalid MX checker result.",
          },
        },
        502,
      );
    }
    return toJsonResponse(data, upstreamResponse.status);
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
