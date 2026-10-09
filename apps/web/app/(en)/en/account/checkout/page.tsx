import type { Metadata } from "next";
import { AccountWorkspaceShell } from "../../../../../src/features/account/account-workspace-shell";
import { AccountCheckoutView } from "../../../../../src/features/account/account-checkout-view";

export const metadata: Metadata = { title: "Checkout | WebDiag", robots: { index: false, follow: false } };

interface PageProps {
  searchParams: Promise<{ pack?: string; invoice?: string; invoiceId?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { pack, invoice, invoiceId } = await searchParams;
  return (
    <AccountWorkspaceShell locale="en" section="settings">
      <AccountCheckoutView locale="en" initialPackId={pack || "pack-50"} initialInvoiceId={invoiceId || invoice || ""} />
    </AccountWorkspaceShell>
  );
}
