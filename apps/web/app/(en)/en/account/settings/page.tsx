import type { Metadata } from "next";
import { AccountWorkspaceShell } from "../../../../../src/features/account/account-workspace-shell";

export const metadata: Metadata = { title: "Account", robots: { index: false, follow: false } };

export default function Page() {
  return <AccountWorkspaceShell locale="en" section="settings" />;
}
