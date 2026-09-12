import type { Metadata } from "next";
import { AccountReports } from "../../../../src/features/account/account-reports";
import { AccountWorkspaceShell } from "../../../../src/features/account/account-workspace-shell";

export const metadata: Metadata = { title: "Сохранённые отчёты", robots: { index: false, follow: false } };

export default function Page() {
  return <AccountWorkspaceShell locale="ru" section="reports"><AccountReports locale="ru" /></AccountWorkspaceShell>;
}
