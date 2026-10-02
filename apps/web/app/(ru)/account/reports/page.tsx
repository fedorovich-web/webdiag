import type { Metadata } from "next";
import { AccountReports } from "../../../../src/features/account/account-reports";
import { validAccountReportProjectId } from "../../../../src/features/account/account-report-query";
import { AccountWorkspaceShell } from "../../../../src/features/account/account-workspace-shell";

export const metadata: Metadata = { title: "Сохранённые отчёты", robots: { index: false, follow: false } };

export default async function Page({ searchParams }: { readonly searchParams: Promise<{ readonly project_id?: string | string[] }> }) {
  const value = (await searchParams).project_id;
  const projectId = typeof value === "string" && validAccountReportProjectId(value) ? value : undefined;
  return <AccountWorkspaceShell locale="ru" section="reports" currentProjectId={projectId}><AccountReports key={projectId ?? "all"} locale="ru" projectId={projectId} /></AccountWorkspaceShell>;
}
