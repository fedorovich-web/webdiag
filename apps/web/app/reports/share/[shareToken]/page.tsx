import type { Metadata } from "next";
import "../../../globals.css";
import "../../../account.css";
import { PublicReport } from "../../../../src/features/account/public-report";
import { reportLocaleHint } from "../../../../src/features/account/account-report-presentation";

export const metadata: Metadata = { title: "Shared WebDiag report", robots: { index: false, follow: false, noarchive: true } };

export default async function Page({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly shareToken: string }>;
  readonly searchParams: Promise<{ readonly locale?: string | string[] }>;
}) {
  const { shareToken } = await params;
  const query = await searchParams;
  return <PublicReport shareToken={shareToken} initialLocale={reportLocaleHint(query.locale)} />;
}
