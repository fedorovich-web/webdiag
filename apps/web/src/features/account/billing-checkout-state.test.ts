import { expect, it } from "vitest";
import {
  pendingInvoiceCookie,
  readPendingInvoice,
} from "./billing-checkout-state";

const invoice = "11111111-1111-4111-8111-111111111111";
it("restores only a valid pending invoice bound to the same product and session", () => {
  const value = pendingInvoiceCookie(
    "pack-50",
    invoice,
    "webdiag_session=owner",
  );
  expect(readPendingInvoice(value, "pack-50", "webdiag_session=owner")).toBe(
    invoice,
  );
  expect(readPendingInvoice(value, "pack-150", "webdiag_session=owner")).toBe(
    "",
  );
  expect(readPendingInvoice(value, "pack-50", "webdiag_session=other")).toBe(
    "",
  );
  expect(readPendingInvoice(value, "pack-50", null)).toBe("");
  expect(
    readPendingInvoice("malformed", "pack-50", "webdiag_session=owner"),
  ).toBe("");
  expect(
    pendingInvoiceCookie("unknown", invoice, "webdiag_session=owner"),
  ).toBe("");
  expect(
    pendingInvoiceCookie("pack-50", "invalid", "webdiag_session=owner"),
  ).toBe("");
});
