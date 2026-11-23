import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountWorkspaceShell } from "../../../../../src/features/account/account-workspace-shell";
import { OwnerSettingsLink } from "../../../../../src/features/admin/owner-settings-link";

export const metadata: Metadata = { title: "Account", robots: { index: false, follow: false } };

export default function Page() {
  return <AccountWorkspaceShell locale="en" section="settings" ownerDashboardLink={
    <Suspense fallback={null}><OwnerSettingsLink locale="en" /></Suspense>
  } />;
}
