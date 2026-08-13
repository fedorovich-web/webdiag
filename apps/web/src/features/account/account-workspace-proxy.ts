import { NextRequest, NextResponse } from "next/server";
import {
  AccountProxyConfigurationError,
  resolveAccountApiBaseUrl,
  selectAccountSessionCookie,
} from "./account-proxy-contract";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const MAX_BODY_BYTES = 16_384;

function json(payload: unknown, status: number) {
  return NextResponse.json(payload, { status, headers: { "cache-control": "no-store" } });
}

function error(code: string, message: string, status: number) {
  return json({ detail: { code, message } }, status);
}

export function validAccountResourceId(value: string): boolean {
  return UUID.test(value);
}

export function accountWorkspacePath(parts: readonly string[]): string | null {
  if (!parts.every(validAccountResourceId)) return null;
  if (parts.length === 1) return `/v1/account/projects/${parts[0]}`;
  if (parts.length === 2) return `/v1/account/projects/${parts[0]}/audits/${parts[1]}`;
  return null;
}

export function accountWorkspaceLifecyclePath(
  projectId: string,
  action: "archive" | "restore",
): string | null {
  return validAccountResourceId(projectId)
    ? `/v1/account/projects/${projectId}/${action}`
    : null;
}

export function accountCrawlPath(projectId: string, jobId?: string): string | null {
  if (!validAccountResourceId(projectId) || (jobId && !validAccountResourceId(jobId))) {
    return null;
  }
  return `/v1/account/projects/${projectId}/crawls${jobId ? `/${jobId}` : ""}`;
}

export async function proxyAccountWorkspace(
  request: NextRequest,
  options: { readonly method: "GET" | "POST" | "PATCH"; readonly path: string; readonly body?: boolean },
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
  const timeout = setTimeout(() => controller.abort(), options.path.endsWith("/audits") ? 60_000 : 12_000);
  try {
    const cookie = selectAccountSessionCookie(request.headers.get("cookie"));
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
      return json(text ? JSON.parse(text) : null, upstream.status);
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
