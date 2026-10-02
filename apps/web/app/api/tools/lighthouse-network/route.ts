import { NextRequest, NextResponse } from "next/server";
import { isLighthouseNetworkResponse, isToolErrorPayload } from "../../../../src/features/tools/performance-tool-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
const REQUEST_45_000_MS = 45_000;

function getApiBaseUrl(): string {
  const raw = process.env.WEBDIAG_API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_WEBDIAG_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  return raw.replace(/\/+$/, "");
}

function toJsonResponse(payload: unknown, status: number) {
  return NextResponse.json(payload, { status, headers: { "cache-control": "no-store" } });
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
    return toJsonResponse({ detail: { code: "tool_bad_request", message: "Request body must include a URL string." } }, 400);
  }

  const requestedStrategy = (payload as { strategy?: unknown }).strategy;
  if (requestedStrategy !== undefined && requestedStrategy !== "mobile" && requestedStrategy !== "desktop") {
    return toJsonResponse({ detail: { code: "tool_bad_request", message: "Strategy must be mobile or desktop." } }, 400);
  }

  const body = {
    url: (payload as { url: string }).url,
    strategy: requestedStrategy ?? "mobile",
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_45_000_MS);

  try {
    const upstreamResponse = await fetch(`${getApiBaseUrl()}/v1/tools/lighthouse-network`, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });
    const data = await parseJson(upstreamResponse);
    if (data === undefined) {
      return toJsonResponse({ detail: { code: "tool_api_invalid_response", message: "Tool API returned invalid JSON." } }, 502);
    }
    if (!upstreamResponse.ok) {
      return toJsonResponse(
        isToolErrorPayload(data) ? data : { detail: { code: "tool_api_error", message: "Tool API request failed." } },
        upstreamResponse.status,
      );
    }
    if (!isLighthouseNetworkResponse(data)) {
      return toJsonResponse({ detail: { code: "tool_api_invalid_response", message: "Tool API returned an invalid Lighthouse network result." } }, 502);
    }
    return toJsonResponse(data, upstreamResponse.status);
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === "AbortError";
    return toJsonResponse({ detail: {
      code: aborted ? "tool_api_timeout" : "tool_api_unavailable",
      message: aborted ? "Tool API request timed out." : "Tool API is not available.",
    } }, 502);
  } finally {
    clearTimeout(timeout);
  }
}
