import { NextRequest, NextResponse } from "next/server";
import {
  AccountProxyConfigurationError,
  resolveAccountApiBaseUrl,
  selectAccountRetryAfter,
  selectAccountSessionCookie,
  selectAccountSetCookie,
} from "./account-proxy-contract";

const REQUEST_TIMEOUT_MS = 12_000;
const MAX_BODY_BYTES = 16_384;

type AccountMethod = "GET" | "POST";
type AccountPath =
  | "/v1/account/register"
  | "/v1/account/login"
  | "/v1/account/logout"
  | "/v1/account/me"
  | "/v1/account/password"
  | "/v1/account/sessions"
  | "/v1/account/sessions/revoke-others";

interface ProxyOptions {
  readonly method: AccountMethod;
  readonly path: AccountPath;
  readonly body: boolean;
}

function toResponse(
  payload: unknown,
  status: number,
  setCookie?: string | null,
  retryAfter?: string | null,
) {
  const response = NextResponse.json(payload, {
    status,
    headers: { "cache-control": "no-store" },
  });
  const sessionCookie = selectAccountSetCookie(setCookie ?? null);
  if (sessionCookie) response.headers.set("set-cookie", sessionCookie);
  const selectedRetryAfter = selectAccountRetryAfter(status, retryAfter ?? null);
  if (selectedRetryAfter) response.headers.set("retry-after", selectedRetryAfter);
  return response;
}

function errorPayload(code: string, message: string) {
  return { detail: { code, message } };
}

export function createAccountProxy(options: ProxyOptions) {
  return async function handler(request: NextRequest) {
    const declaredLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
      return toResponse(errorPayload("account_request_too_large", "Request body is too large."), 413);
    }

    let body: string | undefined;
    if (options.body) {
      body = await request.text();
      if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
        return toResponse(errorPayload("account_request_too_large", "Request body is too large."), 413);
      }
    }

    let apiBaseUrl: string;
    try {
      apiBaseUrl = resolveAccountApiBaseUrl();
    } catch (error) {
      if (!(error instanceof AccountProxyConfigurationError)) throw error;
      return toResponse(
        errorPayload("account_api_misconfigured", "Account API is not configured."),
        500,
      );
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
        },
        body,
        cache: "no-store",
        signal: controller.signal,
      });
      const text = await upstream.text();
      let payload: unknown = null;
      try {
        payload = text ? (JSON.parse(text) as unknown) : null;
      } catch {
        return toResponse(
          errorPayload("account_api_invalid_response", "Account API returned invalid JSON."),
          502,
        );
      }
      return toResponse(
        payload,
        upstream.status,
        upstream.headers.get("set-cookie"),
        upstream.headers.get("retry-after"),
      );
    } catch (error) {
      const timedOut = error instanceof Error && error.name === "AbortError";
      return toResponse(
        errorPayload(
          timedOut ? "account_api_timeout" : "account_api_unavailable",
          timedOut ? "Account API request timed out." : "Account API is unavailable.",
        ),
        502,
      );
    } finally {
      clearTimeout(timeout);
    }
  };
}
