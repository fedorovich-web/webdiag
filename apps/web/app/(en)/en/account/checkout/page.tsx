import type { Metadata } from "next";
import { cookies } from "next/headers";
import { PENDING_INVOICE_COOKIE, readPendingInvoice } from "../../../../../src/features/account/billing-checkout-state";
import { resolveRequestSessionCookie } from "../../../../../src/features/account/account-proxy-contract";
import { billingSku } from "../../../../../src/features/account/billing-catalog";
import { AccountWorkspaceShell } from "../../../../../src/features/account/account-workspace-shell";
import { AccountCheckoutView } from "../../../../../src/features/account/account-checkout-view";

export const metadata: Metadata = { title: "Checkout | WebDiag", robots: { index: false, follow: false } };

interface PageProps {
  searchParams: Promise<{ pack?: string; invoice?: string; invoiceId?: string; payment_return?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { pack, invoice, invoiceId, payment_return } = await searchParams;
  const jar = await cookies();
  const pending = payment_return === "1" ? readPendingInvoice(jar.get(PENDING_INVOICE_COOKIE)?.value, billingSku(pack || "pack-50", "en"), resolveRequestSessionCookie({ cookies: jar, headers: new Headers() })) : "";
  return (
    <AccountWorkspaceShell locale="en" section="settings">
      <AccountCheckoutView locale="en" initialPackId={pack || "pack-50"} initialInvoiceId={invoiceId || invoice || pending} />
    </AccountWorkspaceShell>
  );
}
