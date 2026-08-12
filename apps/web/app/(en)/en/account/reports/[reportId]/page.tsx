import type { Metadata } from "next";
import { AccountReportDetail } from "../../../../../../src/features/account/account-report-detail";
import { AccountWorkspaceShell } from "../../../../../../src/features/account/account-workspace-shell";

export const metadata: Metadata = { title: "Saved report", robots: { index: false, follow: false } };

export default async function Page({ params }: { readonly params: Promise<{ readonly reportId: string }> }) {
  const { reportId } = await params;
  return <AccountWorkspaceShell locale="en" section="report"><AccountReportDetail locale="en" reportId={reportId} /></AccountWorkspaceShell>;
}
