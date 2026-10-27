import { NextRequest, NextResponse } from "next/server";
import { readBoundedBody, RequestBodyError } from "../../lib/request-body";
import {
  resolveAccountApiBaseUrl,
  resolveRequestSessionCookie,
} from "./account-proxy-contract";
import { readOAuthJson } from "./yandex-flow";
import {
  PENDING_INVOICE_COOKIE,
  pendingInvoiceCookie,
  readPendingInvoice,
} from "./billing-checkout-state";

type BillingAction = "invoice" | "confirm" | "status" | "webhook";
const MAX_BODY = 16384;

function error(code: string, message: string, status: number) {
  return NextResponse.json(
    { detail: { code, message } },
    { status, headers: { "cache-control": "no-store" } },
  );
}

export async function proxyBilling(
  request: NextRequest,
  action: BillingAction,
): Promise<NextResponse> {
  const authenticated = action === "invoice" || action === "confirm";
  const cookie =
    action === "webhook" ? null : resolveRequestSessionCookie(request);
  if (authenticated && !cookie)
    return error("account_unauthenticated", "Sign in to continue.", 401);
  if (authenticated) {
    const origin = request.headers.get("origin");
    const expected =
      process.env.WEBDIAG_ACCOUNT_PUBLIC_ORIGIN || request.nextUrl.origin;
    if (
      request.headers.get("sec-fetch-site") === "cross-site" ||
      (origin && origin !== expected && origin !== request.nextUrl.origin)
    ) {
      return error(
        "account_cross_origin",
        "Cross-origin request rejected.",
        403,
      );
    }
    if (
      !request.headers
        .get("content-type")
        ?.toLowerCase()
        .startsWith("application/json")
    )
      return error("invalid_json", "Expected JSON.", 415);
  }
  try {
    let body: Uint8Array | undefined;
    if (action !== "status") {
      body = await readBoundedBody(request, MAX_BODY);
    }
    const upstream = await fetch(
      `${resolveAccountApiBaseUrl()}/v1/billing/${action}`,
      {
        method: action === "status" ? "GET" : "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          ...(cookie ? { cookie } : {}),
          ...(action === "webhook" && request.headers.get("x-api-key")
            ? { "x-api-key": request.headers.get("x-api-key")! }
            : {}),
        },
        body: body as BodyInit | undefined,
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(20000),
      },
    );
    const data = await readOAuthJson(upstream);
    const response = NextResponse.json(data, {
      status: upstream.status,
      headers: { "cache-control": "no-store" },
    });
    if (
      upstream.ok &&
      cookie &&
      data &&
      typeof data === "object" &&
      "invoice_id" in data &&
      "pack_id" in data &&
      typeof data.invoice_id === "string" &&
      typeof data.pack_id === "string"
    ) {
      const value = pendingInvoiceCookie(data.pack_id, data.invoice_id, cookie);
      const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge: 86400,
      };
      if (action === "invoice" && value)
        response.cookies.set(PENDING_INVOICE_COOKIE, value, options);
      if (
        action === "confirm" &&
        "status" in data &&
        data.status === "paid" &&
        readPendingInvoice(
          request.cookies.get(PENDING_INVOICE_COOKIE)?.value,
          data.pack_id,
          cookie,
        ) === data.invoice_id
      ) {
        response.cookies.set(PENDING_INVOICE_COOKIE, "", {
          ...options,
          maxAge: 0,
        });
      }
    }
    return response;
  } catch (caught) {
    if (caught instanceof RequestBodyError) {
      return caught.status === 413
        ? error("billing_request_too_large", "Request is too large.", 413)
        : error("billing_request_timeout", "Request body timed out.", 408);
    }
    return error(
      "billing_upstream_error",
      "Payment service is unavailable.",
      502,
    );
  }
}
