import type { Metadata } from "next";
import { AccountReportDetail } from "../../../../../src/features/account/account-report-detail";
import { AccountWorkspaceShell } from "../../../../../src/features/account/account-workspace-shell";

export const metadata: Metadata = { title: "Сохранённый отчёт", robots: { index: false, follow: false } };

export default async function Page({ params }: { readonly params: Promise<{ readonly reportId: string }> }) {
  const { reportId } = await params;
  return <AccountWorkspaceShell locale="ru" section="report"><AccountReportDetail locale="ru" reportId={reportId} /></AccountWorkspaceShell>;
}
