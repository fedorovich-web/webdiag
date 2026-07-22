import { NextRequest, NextResponse } from "next/server";
import { isToolErrorPayload, parsePageUrlInput } from "./client-delivery-tool-contract";
import type { AccessibilityStaticResponse } from "./accessibility-static-tool-contract";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
const REQUEST_TIMEOUT_MS = 20_000;

type ResponseValidator = (payload: unknown) => payload is AccessibilityStaticResponse;

interface ProxyOptions {
  readonly upstreamPath:
    | "/v1/tools/landmark-structure"
    | "/v1/tools/form-accessibility"
    | "/v1/tools/interactive-accessible-names";
  readonly validator: ResponseValidator;
  readonly invalidResponseMessage: string;
}

function getApiBaseUrl(): string {
  const raw =
    process.env.WEBDIAG_API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_WEBDIAG_API_BASE_URL ??
    DEFAULT_API_BASE_URL;
  return raw.replace(/\/+$/, "");
}

function json(payload: unknown, status: number) {
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

export function createAccessibilityStaticProxy(options: ProxyOptions) {
  return async function POST(request: NextRequest) {
    const payload: unknown = await request.json().catch(() => null);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return json({ detail: { code: "tool_bad_request", message: "Request body must be a JSON object." } }, 400);
    }
    const rawUrl = (payload as Record<string, unknown>).url;
    const url = typeof rawUrl === "string" ? parsePageUrlInput(rawUrl) : null;
    if (!url) {
      return json({
        detail: {
          code: "tool_bad_request",
          message: "Enter a valid public http/https URL without credentials.",
        },
      }, 400);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${getApiBaseUrl()}${options.upstreamPath}`, {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json" },
        body: JSON.stringify({ url }),
        cache: "no-store",
        signal: controller.signal,
      });
      const data = await parseJson(response);
      if (data === undefined) {
        return json({ detail: { code: "tool_api_invalid_response", message: "Tool API returned invalid JSON." } }, 502);
      }
      if (!response.ok) {
        return json(
          isToolErrorPayload(data)
            ? data
            : { detail: { code: "tool_api_error", message: "Tool API request failed." } },
          response.status,
        );
      }
      if (!options.validator(data)) {
        return json({
          detail: { code: "tool_api_invalid_response", message: options.invalidResponseMessage },
        }, 502);
      }
      return json(data, 200);
    } catch (error) {
      const timedOut = error instanceof Error && error.name === "AbortError";
      return json({
        detail: {
          code: timedOut ? "tool_api_timeout" : "tool_api_unavailable",
          message: timedOut ? "Tool API request timed out." : "Tool API is unavailable.",
        },
      }, 502);
    } finally {
      clearTimeout(timeout);
    }
  };
}
