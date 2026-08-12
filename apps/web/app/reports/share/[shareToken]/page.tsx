import type { Metadata } from "next";
import { PublicReport } from "../../../../src/features/account/public-report";

export const metadata: Metadata = { title: "Shared WebDiag report", robots: { index: false, follow: false, noarchive: true } };

export default async function Page({ params }: { readonly params: Promise<{ readonly shareToken: string }> }) {
  const { shareToken } = await params;
  return <PublicReport shareToken={shareToken} />;
}
