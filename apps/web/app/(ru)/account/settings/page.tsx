import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountWorkspaceShell } from "../../../../src/features/account/account-workspace-shell";
import { OwnerSettingsLink } from "../../../../src/features/admin/owner-settings-link";

export const metadata: Metadata = { title: "Аккаунт", robots: { index: false, follow: false } };

export default function Page() {
  return <AccountWorkspaceShell locale="ru" section="settings" ownerDashboardLink={
    <Suspense fallback={null}><OwnerSettingsLink locale="ru" /></Suspense>
  } />;
}
