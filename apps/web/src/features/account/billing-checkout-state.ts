import { createHash } from "node:crypto";
import { checkoutPackage } from "./billing-catalog";

export const PENDING_INVOICE_COOKIE = "webdiag_pending_invoice";
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

function sessionDigest(session: string): string {
  return createHash("sha256").update(session).digest("hex");
}

export function pendingInvoiceCookie(
  pack: string,
  invoice: string,
  session: string,
): string {
  if (
    !checkoutPackage(pack, pack.endsWith("-usd") ? "en" : "ru") ||
    !UUID.test(invoice)
  )
    return "";
  return `${pack}.${invoice}.${sessionDigest(session)}`;
}

export function readPendingInvoice(
  value: string | undefined,
  pack: string,
  session: string | null,
): string {
  if (!value || value.length > 180 || !session) return "";
  const [savedPack, invoice = "", digest, extra] = value.split(".");
  if (
    extra !== undefined ||
    savedPack !== pack ||
    digest !== sessionDigest(session) ||
    !UUID.test(invoice)
  )
    return "";
  return checkoutPackage(pack, pack.endsWith("-usd") ? "en" : "ru")
    ? invoice
    : "";
}
