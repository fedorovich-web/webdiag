import { NextRequest, NextResponse } from "next/server";
import { isToolErrorPayload, parsePageUrlInput } from "./client-delivery-tool-contract";
import {
  isRedirectMapResponse,
  type RedirectMapInputEntry,
} from "./url-management-tool-contract";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
const REQUEST_TIMEOUT_MS = 45_000;
const MAX_ENTRIES = 25;
const ALLOWED_STATUSES = new Set([301, 302, 303, 307, 308]);

function getApiBaseUrl(): string {
  const raw =
    process.env.WEBDIAG_API_INTERNAL_URL
    ?? process.env.NEXT_PUBLIC_WEBDIAG_API_BASE_URL
    ?? DEFAULT_API_BASE_URL;
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

function normalizeEntry(value: unknown): RedirectMapInputEntry | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const source = typeof record.source_url === "string"
    ? parsePageUrlInput(record.source_url)
    : null;
  const target = typeof record.target_url === "string"
    ? parsePageUrlInput(record.target_url)
    : null;
  if (!source || !target) return null;
  const rawStatus = record.expected_status_code;
  if (rawStatus === undefined || rawStatus === null) {
    return { source_url: source, target_url: target };
  }
  if (
    typeof rawStatus !== "number"
    || !Number.isInteger(rawStatus)
    || !ALLOWED_STATUSES.has(rawStatus)
  ) return null;
  return {
    source_url: source,
    target_url: target,
    expected_status_code: rawStatus,
  };
}

export async function POST(request: NextRequest) {
  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return toJsonResponse(
      {
        detail: {
          code: "tool_bad_request",
          message: "Request body must be a JSON object.",
        },
      },
      400,
    );
  }

  const rawEntries = (payload as Record<string, unknown>).entries;
  if (!Array.isArray(rawEntries) || rawEntries.length < 1 || rawEntries.length > MAX_ENTRIES) {
    return toJsonResponse(
      {
        detail: {
          code: "tool_bad_request",
          message: "Provide between 1 and 25 redirect-map entries.",
        },
      },
      400,
    );
  }
  const entries = rawEntries.map(normalizeEntry);
  if (entries.some((entry) => entry === null)) {
    return toJsonResponse(
      {
        detail: {
          code: "tool_bad_request",
          message: "Each row needs public http/https source and target URLs plus an optional redirect status.",
        },
      },
      400,
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const upstreamResponse = await fetch(`${getApiBaseUrl()}/v1/tools/redirect-map`, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({ entries }),
      cache: "no-store",
      signal: controller.signal,
    });
    const data = await parseJson(upstreamResponse);
    if (data === undefined) {
      return toJsonResponse(
        {
          detail: {
            code: "tool_api_invalid_response",
            message: "Redirect map API returned invalid JSON.",
          },
        },
        502,
      );
    }
    if (!upstreamResponse.ok) {
      return toJsonResponse(
        isToolErrorPayload(data)
          ? data
          : { detail: { code: "tool_api_error", message: "Redirect map API request failed." } },
        upstreamResponse.status,
      );
    }
    if (!isRedirectMapResponse(data)) {
      return toJsonResponse(
        {
          detail: {
            code: "tool_api_invalid_response",
            message: "Redirect map API returned an invalid response contract.",
          },
        },
        502,
      );
    }
    return toJsonResponse(data, 200);
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return toJsonResponse(
      {
        detail: {
          code: timedOut ? "tool_api_timeout" : "tool_api_unavailable",
          message: timedOut
            ? "Redirect map API request timed out."
            : "Redirect map API is unavailable.",
        },
      },
      502,
    );
  } finally {
    clearTimeout(timeout);
  }
}
