import { NextRequest, NextResponse } from "next/server";
import {
  AccountProxyConfigurationError,
  resolveAccountApiBaseUrl,
  selectAccountRetryAfter,
  selectAccountSessionCookie,
} from "./account-proxy-contract";
import { validAccountResourceId } from "./account-workspace-proxy";

const REQUEST_TIMEOUT_MS = 12_000;
const MAX_BODY_BYTES = 300_000;

type AccountAIMethod = "GET" | "POST" | "DELETE";
type AccountAIPath =
  | "/v1/account/ai/catalog"
  | "/v1/account/ai/runs"
  | "/v1/account/credits"
  | `/v1/account/ai/runs/${string}`;

interface AccountAIProxyOptions {
  readonly method: AccountAIMethod;
  readonly path: AccountAIPath;
  readonly body?: boolean;
  readonly requireIdempotencyKey?: boolean;
}

function response(payload: unknown, status: number, retryAfter?: string | null): Response {
  if (status === 204) {
    return new Response(null, { status, headers: { "cache-control": "no-store" } });
  }
  const result = NextResponse.json(payload, {
    status,
    headers: { "cache-control": "no-store" },
  });
  const selectedRetryAfter = selectAccountRetryAfter(status, retryAfter ?? null);
  if (selectedRetryAfter) result.headers.set("retry-after", selectedRetryAfter);
  return result;
}

function error(code: string, message: string, status: number): Response {
  return response({ detail: { code, message } }, status);
}

export function selectAIIdempotencyKey(value: string | null): string | null {
  if (!value || value.length < 8 || value.length > 128) return null;
  if ([...value].some((character) => {
    const code = character.codePointAt(0);
    return code === undefined || code < 0x21 || code > 0x7e;
  })) return null;
  return value;
}

export function accountAIRunPath(runId: string): `/v1/account/ai/runs/${string}` | null {
  return validAccountResourceId(runId) ? `/v1/account/ai/runs/${runId}` : null;
}

export async function proxyAccountAI(
  request: NextRequest,
  options: AccountAIProxyOptions,
): Promise<Response> {
  const idempotencyKey = options.requireIdempotencyKey
    ? selectAIIdempotencyKey(request.headers.get("idempotency-key"))
    : null;
  if (options.requireIdempotencyKey && !idempotencyKey) {
    return error("ai_invalid_idempotency_key", "Invalid idempotency key.", 422);
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return error("account_request_too_large", "Request body is too large.", 413);
  }

  let body: string | undefined;
  if (options.body) {
    body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
      return error("account_request_too_large", "Request body is too large.", 413);
    }
  }

  let apiBaseUrl: string;
  try {
    apiBaseUrl = resolveAccountApiBaseUrl();
  } catch (caught) {
    if (!(caught instanceof AccountProxyConfigurationError)) throw caught;
    return error("account_api_misconfigured", "Account API is not configured.", 500);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const sessionCookie = selectAccountSessionCookie(request.headers.get("cookie"));
    const upstream = await fetch(`${apiBaseUrl}${options.path}`, {
      method: options.method,
      headers: {
        accept: "application/json",
        ...(options.body ? { "content-type": "application/json" } : {}),
        ...(sessionCookie ? { cookie: sessionCookie } : {}),
        ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}),
      },
      body,
      cache: "no-store",
      signal: controller.signal,
    });
    const text = await upstream.text();
    if (upstream.status === 204) return response(null, 204);
    let payload: unknown;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      return error("account_api_invalid_response", "Account API returned invalid JSON.", 502);
    }
    return response(payload, upstream.status, upstream.headers.get("retry-after"));
  } catch (caught) {
    const timedOut = caught instanceof Error && caught.name === "AbortError";
    return error(
      timedOut ? "account_api_timeout" : "account_api_unavailable",
      timedOut ? "Account API request timed out." : "Account API is unavailable.",
      502,
    );
  } finally {
    clearTimeout(timeout);
  }
}
