import { NextRequest, NextResponse } from "next/server";
import { resolveAccountApiBaseUrl, resolveRequestSessionCookie } from "./account-proxy-contract";
import { readOAuthJson } from "./yandex-flow";

type BillingAction = "invoice" | "confirm" | "status" | "webhook";
const MAX_BODY = 16384;

function error(code: string, message: string, status: number) {
  return NextResponse.json({ detail: { code, message } }, { status, headers: { "cache-control": "no-store" } });
}

export async function proxyBilling(request: NextRequest, action: BillingAction): Promise<NextResponse> {
  const authenticated = action === "invoice" || action === "confirm";
  const cookie = action === "webhook" ? null : resolveRequestSessionCookie(request);
  if (authenticated && !cookie) return error("account_unauthenticated", "Sign in to continue.", 401);
  if (authenticated) {
    const origin = request.headers.get("origin");
    const expected = process.env.WEBDIAG_ACCOUNT_PUBLIC_ORIGIN || request.nextUrl.origin;
    if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== expected && origin !== request.nextUrl.origin)) {
      return error("account_cross_origin", "Cross-origin request rejected.", 403);
    }
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return error("invalid_json", "Expected JSON.", 415);
  }
  try {
    let body: Uint8Array | undefined;
    if (action !== "status") {
      if (Number(request.headers.get("content-length")) > MAX_BODY) return error("billing_request_too_large", "Request is too large.", 413);
      const reader = request.body?.getReader();
      const chunks: Uint8Array[] = [];
      let length = 0;
      if (reader) {
        try {
          for (;;) {
            const chunk = await reader.read();
            if (chunk.done) break;
            length += chunk.value.byteLength;
            if (length > MAX_BODY) return error("billing_request_too_large", "Request is too large.", 413);
            chunks.push(chunk.value);
          }
        } finally { await reader.cancel(); }
      }
      body = Buffer.concat(chunks);
    }
    const upstream = await fetch(`${resolveAccountApiBaseUrl()}/v1/billing/${action}`, {
      method: action === "status" ? "GET" : "POST",
      headers: { accept: "application/json", "content-type": "application/json",
        ...(cookie ? { cookie } : {}),
        ...(action === "webhook" && request.headers.get("x-api-key") ? { "x-api-key": request.headers.get("x-api-key")! } : {}),
      }, body: body as BodyInit | undefined, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20000),
    });
    const data = await readOAuthJson(upstream);
    return NextResponse.json(data, { status: upstream.status, headers: { "cache-control": "no-store" } });
  } catch { return error("billing_upstream_error", "Payment service is unavailable.", 502); }
}
