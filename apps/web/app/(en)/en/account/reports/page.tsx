import type { Metadata } from "next";
import { AccountReports } from "../../../../../src/features/account/account-reports";
import { AccountWorkspaceShell } from "../../../../../src/features/account/account-workspace-shell";

export const metadata: Metadata = { title: "Saved reports", robots: { index: false, follow: false } };

export default function Page() {
  return <AccountWorkspaceShell locale="en" section="reports"><AccountReports locale="en" /></AccountWorkspaceShell>;
}
