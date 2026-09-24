import type { Metadata } from "next";
import { AccountWorkspaceShell } from "../../../../src/features/account/account-workspace-shell";

export const metadata: Metadata = { title: "Аккаунт", robots: { index: false, follow: false } };

export default function Page() {
  return <AccountWorkspaceShell locale="ru" section="settings" />;
}
