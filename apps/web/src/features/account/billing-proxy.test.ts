import { NextRequest } from "next/server";
import { afterEach, expect, it, vi } from "vitest";
import { proxyBilling } from "./billing-proxy";
import {
  PENDING_INVOICE_COOKIE,
  pendingInvoiceCookie,
} from "./billing-checkout-state";

const invoiceId = "11111111-1111-4111-8111-111111111111";
const session = "webdiag_session=checkout-test-owner";
const selector = pendingInvoiceCookie("pack-50", invoiceId, session);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function request(action: string, selectorValue = selector): NextRequest {
  return new NextRequest(`https://webdiag.test/api/billing/lava/${action}`, {
    method: "POST",
    body: JSON.stringify({ pack_id: "pack-50", invoice_id: invoiceId }),
    headers: {
      "content-type": "application/json",
      origin: "https://webdiag.test",
      cookie: `${session}; ${PENDING_INVOICE_COOKIE}=${selectorValue}; unrelated=private`,
    },
  });
}

function provider(status: string, httpStatus = 200) {
  vi.stubEnv("WEBDIAG_API_INTERNAL_URL", "http://127.0.0.1:8000");
  const upstream = vi.fn<typeof fetch>(
    async () =>
      Response.json(
        { invoice_id: invoiceId, pack_id: "pack-50", status },
        { status: httpStatus },
      ),
  );
  vi.stubGlobal("fetch", upstream);
  return upstream;
}

it("sets a secure private session-bound selector after invoice creation", async () => {
  vi.stubEnv("NODE_ENV", "production");
  const upstream = provider("pending", 201);
  const response = await proxyBilling(request("invoice"), "invoice");
  expect(response.status).toBe(201);
  expect(response.cookies.get(PENDING_INVOICE_COOKIE)).toMatchObject({
    value: selector,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 86400,
  });
  const init = upstream.mock.calls[0]?.[1] as RequestInit | undefined;
  expect(new Headers(init?.headers).get("cookie")).toBe(session);
});

it("retains the selector until the provider confirms payment", async () => {
  provider("pending");
  const response = await proxyBilling(request("confirm"), "confirm");
  expect(response.cookies.get(PENDING_INVOICE_COOKIE)).toBeUndefined();
});

it("clears only the confirmed invoice for the same session and product", async () => {
  provider("paid");
  const matching = await proxyBilling(request("confirm"), "confirm");
  expect(matching.cookies.get(PENDING_INVOICE_COOKIE)).toMatchObject({
    value: "",
    maxAge: 0,
  });
  const otherSession = pendingInvoiceCookie(
    "pack-50",
    invoiceId,
    "webdiag_session=other-owner",
  );
  const nonmatching = await proxyBilling(
    request("confirm", otherSession),
    "confirm",
  );
  expect(nonmatching.cookies.get(PENDING_INVOICE_COOKIE)).toBeUndefined();
});

it("does not save a selector from an unsuccessful provider response", async () => {
  provider("pending", 503);
  const response = await proxyBilling(request("invoice"), "invoice");
  expect(response.status).toBe(503);
  expect(response.cookies.get(PENDING_INVOICE_COOKIE)).toBeUndefined();
});
