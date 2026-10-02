import type { Metadata } from "next";
import { AccountReportWorkspace } from "../../../../../../src/features/account/account-report-workspace";

export const metadata: Metadata = { title: "Saved report", robots: { index: false, follow: false } };

export default async function Page({ params }: { readonly params: Promise<{ readonly reportId: string }> }) {
  const { reportId } = await params;
  return <AccountReportWorkspace locale="en" reportId={reportId} />;
}
