import { NextRequest, NextResponse } from "next/server";
import { isBulkHttpStatusResponse } from "../../../../src/features/tools/bulk-http-status-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
const REQUEST_BODY_MAX_BYTES = 128 * 1024;
const RESPONSE_BODY_MAX_BYTES = 2 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 20_000;

function getApiBaseUrl(): string {
  const raw = process.env.WEBDIAG_API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_WEBDIAG_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  return raw.replace(/\/+$/, "");
}

function jsonResponse(payload: unknown, status: number) {
  return NextResponse.json(payload, { status, headers: { "cache-control": "no-store" } });
}

function exceedsDecimalHeader(value: string | null, maximum: number): boolean {
  if (value === null || !/^\d+$/.test(value)) return false;
  const normalized = value.replace(/^0+/, "") || "0";
  const limit = String(maximum);
  return normalized.length > limit.length || (normalized.length === limit.length && normalized > limit);
}

async function readBounded(
  stream: ReadableStream<Uint8Array> | null,
  contentLength: string | null,
  maximum: number,
): Promise<string | null> {
  if (exceedsDecimalHeader(contentLength, maximum)) return null;
  if (!stream) return "";
  const reader = stream.getReader();
  const body = new Uint8Array(maximum);
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value.byteLength > maximum - size) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    body.set(value, size);
    size += value.byteLength;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(body.subarray(0, size));
  } catch {
    return null;
  }
}

function parseJson(value: string | null): unknown {
  if (value === null) return undefined;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function validRequest(value: unknown): value is { urls: string[] } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    Object.keys(record).length === 1 &&
    Array.isArray(record.urls) &&
    record.urls.length >= 1 &&
    record.urls.length <= 50 &&
    record.urls.every((url) => typeof url === "string" && url.length >= 1 && url.length <= 2_048)
  );
}

function isToolError(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const detail = (value as { detail?: unknown }).detail;
  return !!detail && typeof detail === "object" && typeof (detail as { code?: unknown }).code === "string" && typeof (detail as { message?: unknown }).message === "string";
}

export async function POST(request: NextRequest) {
  const requestText = await readBounded(request.body, request.headers.get("content-length"), REQUEST_BODY_MAX_BYTES);
  const payload = parseJson(requestText);
  if (!validRequest(payload)) {
    return jsonResponse(
      { detail: { code: "tool_bad_request", message: "Request body must contain 1 to 50 URL strings." } },
      400,
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const upstream = await fetch(`${getApiBaseUrl()}/v1/tools/http-status/bulk`, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal,
    });
    const upstreamText = await readBounded(
      upstream.body,
      upstream.headers.get("content-length"),
      RESPONSE_BODY_MAX_BYTES,
    );
    const data = parseJson(upstreamText);
    if (!upstream.ok) {
      return jsonResponse(
        isToolError(data) ? data : { detail: { code: "tool_api_error", message: "Tool API request failed." } },
        upstream.status,
      );
    }
    if (!isBulkHttpStatusResponse(data)) {
      return jsonResponse(
        { detail: { code: "tool_api_invalid_response", message: "Tool API returned an invalid bulk HTTP status result." } },
        502,
      );
    }
    return jsonResponse(data, 200);
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === "AbortError";
    return jsonResponse(
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
