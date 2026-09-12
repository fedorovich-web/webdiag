import { NextRequest, NextResponse } from "next/server";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
const REQUEST_BODY_MAX_BYTES = 16 * 1024;
const RESPONSE_BODY_MAX_BYTES = 64 * 1024;
const REQUEST_TIMEOUT_MS = 15_000;

const actionMethods = {
  "change-password": "POST",
  "forgot-password": "POST",
  login: "POST",
  logout: "POST",
  me: "GET",
  register: "POST",
  "resend-verification": "POST",
  "reset-password": "POST",
  "verify-email": "POST",
} as const;

type AuthAction = keyof typeof actionMethods;
type AuthMethod = (typeof actionMethods)[AuthAction];

const cookieActions = new Set<AuthAction>([
  "change-password",
  "login",
  "logout",
  "reset-password",
  "verify-email",
]);

function isAuthAction(value: string): value is AuthAction {
  return Object.hasOwn(actionMethods, value);
}

function jsonError(detail: string, status: number): NextResponse {
  return NextResponse.json(
    { detail },
    { status, headers: { "cache-control": "no-store" } },
  );
}

function apiBaseUrl(): string {
  const configured = process.env.WEBDIAG_API_INTERNAL_URL ?? DEFAULT_API_BASE_URL;
  let parsed: URL;
  try {
    parsed = new URL(configured);
  } catch {
    throw new Error("Invalid internal API origin");
  }
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    (parsed.pathname !== "/" && parsed.pathname !== "")
  ) {
    throw new Error("Invalid internal API origin");
  }
  return parsed.origin;
}

function isSameOriginMutation(request: NextRequest): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (origin === null) return true;
  try {
    return new URL(origin).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

async function readBoundedBody(
  body: ReadableStream<Uint8Array> | null,
  limit: number,
): Promise<Uint8Array | null> {
  if (body === null) return new Uint8Array();
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > limit) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const result = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJsonObject(bytes: Uint8Array): Record<string, unknown> | null {
  if (bytes.byteLength === 0) return null;
  try {
    const value: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return isRecord(value) ? value : null;
  } catch {
    return null;
  }
}

export async function proxyAuthRequest(
  request: NextRequest,
  actionValue: string,
  method: AuthMethod,
): Promise<NextResponse> {
  if (!isAuthAction(actionValue)) return jsonError("Not found", 404);
  const action = actionValue;
  if (actionMethods[action] !== method) {
    return jsonError("Method not allowed", 405);
  }
  if (method === "POST" && !isSameOriginMutation(request)) {
    return jsonError("Cross-site authentication request rejected", 403);
  }

  const headers = new Headers({ accept: "application/json" });
  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  let body: string | undefined;
  if (method === "POST" && action !== "logout") {
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return jsonError("Authentication request must use JSON", 415);
    }
    const declaredLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > REQUEST_BODY_MAX_BYTES) {
      return jsonError("Authentication request is too large", 413);
    }
    const boundedBody = await readBoundedBody(request.body, REQUEST_BODY_MAX_BYTES);
    if (boundedBody === null) return jsonError("Authentication request is too large", 413);
    if (parseJsonObject(boundedBody) === null) {
      return jsonError("Authentication request must be a JSON object", 400);
    }
    body = new TextDecoder().decode(boundedBody);
    headers.set("content-type", "application/json");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const upstream = await fetch(`${apiBaseUrl()}/api/auth/${action}`, {
      method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
      signal: controller.signal,
    });
    if (upstream.status >= 300 && upstream.status < 400) {
      return jsonError("Authentication service is unavailable", 502);
    }
    if (!upstream.headers.get("content-type")?.toLowerCase().includes("application/json")) {
      return jsonError("Authentication service is unavailable", 502);
    }
    const responseBytes = await readBoundedBody(upstream.body, RESPONSE_BODY_MAX_BYTES);
    if (responseBytes === null) {
      return jsonError("Authentication service is unavailable", 502);
    }
    const payload = parseJsonObject(responseBytes);
    if (payload === null) return jsonError("Authentication service is unavailable", 502);

    const response = NextResponse.json(payload, {
      status: upstream.status,
      headers: { "cache-control": "no-store" },
    });
    if (cookieActions.has(action)) {
      for (const setCookie of upstream.headers.getSetCookie()) {
        response.headers.append("set-cookie", setCookie);
      }
    }
    return response;
  } catch {
    return jsonError("Authentication service is unavailable", 502);
  } finally {
    clearTimeout(timeout);
  }
}
