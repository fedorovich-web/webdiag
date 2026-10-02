import { NextRequest, NextResponse } from "next/server";
import {
  AccountProxyConfigurationError,
  resolveAccountApiBaseUrl,
  selectAccountSessionCookie,
} from "./account-proxy-contract";
import { validAccountResourceId } from "./account-workspace-proxy";

const SHARE_TOKEN = /^[A-Za-z0-9_-]{40,80}$/u;
const MAX_BODY_BYTES = 16_384;
const MAX_HTML_BYTES = 3_000_000;

function json(payload: unknown, status: number, publicResponse = false) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "cache-control": "no-store",
      ...(publicResponse ? {
        "x-robots-tag": "noindex, nofollow, noarchive, nosnippet",
        "referrer-policy": "no-referrer",
      } : {}),
    },
  });
}

function error(code: string, message: string, status: number) {
  return json({ detail: { code, message } }, status);
}

export function validReportId(value: string): boolean {
  return validAccountResourceId(value);
}

export function validReportShareToken(value: string): boolean {
  return SHARE_TOKEN.test(value);
}

export async function proxyAccountReportJson(
  request: NextRequest,
  options: {
    readonly method: "GET" | "POST" | "DELETE";
    readonly path: string;
    readonly body?: boolean;
    readonly authenticated?: boolean;
  },
) {
  let apiBase: string;
  try {
    apiBase = resolveAccountApiBaseUrl();
  } catch (caught) {
    if (!(caught instanceof AccountProxyConfigurationError)) throw caught;
    return error("account_api_misconfigured", "Account API is not configured.", 500);
  }

  let body: string | undefined;
  if (options.body) {
    body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
      return error("account_request_too_large", "Request body is too large.", 413);
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const cookie = options.authenticated === false
      ? null
      : selectAccountSessionCookie(request.headers.get("cookie"));
    const upstream = await fetch(`${apiBase}${options.path}`, {
      method: options.method,
      headers: {
        accept: "application/json",
        ...(options.body ? { "content-type": "application/json" } : {}),
        ...(cookie ? { cookie } : {}),
      },
      body,
      cache: "no-store",
      signal: controller.signal,
    });
    const text = await upstream.text();
    try {
      return json(text ? JSON.parse(text) : null, upstream.status, options.authenticated === false);
    } catch {
      return error("account_api_invalid_response", "Account API returned invalid JSON.", 502);
    }
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

export async function proxyReportHtml(
  request: NextRequest,
  options: { readonly path: string; readonly authenticated?: boolean },
) {
  let apiBase: string;
  try {
    apiBase = resolveAccountApiBaseUrl();
  } catch (caught) {
    if (!(caught instanceof AccountProxyConfigurationError)) throw caught;
    return error("account_api_misconfigured", "Account API is not configured.", 500);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const cookie = options.authenticated === false
      ? null
      : selectAccountSessionCookie(request.headers.get("cookie"));
    const upstream = await fetch(`${apiBase}${options.path}`, {
      method: "GET",
      headers: { accept: "text/html", ...(cookie ? { cookie } : {}) },
      cache: "no-store",
      signal: controller.signal,
    });
    const bytes = new Uint8Array(await upstream.arrayBuffer());
    if (bytes.byteLength > MAX_HTML_BYTES) {
      return error("account_report_too_large", "Report artifact is too large.", 502);
    }
    return new NextResponse(bytes, {
      status: upstream.status,
      headers: {
        "cache-control": "no-store",
        "content-type": upstream.headers.get("content-type") ?? "text/html; charset=utf-8",
        ...(upstream.headers.get("content-disposition")
          ? { "content-disposition": upstream.headers.get("content-disposition")! }
          : {}),
        ...(upstream.headers.get("content-security-policy")
          ? { "content-security-policy": upstream.headers.get("content-security-policy")! }
          : {}),
        "referrer-policy": "no-referrer",
        "x-content-type-options": "nosniff",
        "x-robots-tag": "noindex, nofollow, noarchive, nosnippet",
      },
    });
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
