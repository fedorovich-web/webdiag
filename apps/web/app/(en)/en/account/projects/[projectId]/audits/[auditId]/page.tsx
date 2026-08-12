import type { Metadata } from "next";
import { AccountSavedAudit } from "../../../../../../../../src/features/account/account-saved-audit";
import { AccountWorkspaceShell } from "../../../../../../../../src/features/account/account-workspace-shell";

export const metadata: Metadata = { title: "Saved audit", robots: { index: false, follow: false } };

export default async function Page({ params }: { readonly params: Promise<{ readonly projectId: string; readonly auditId: string }> }) {
  const { projectId, auditId } = await params;
  return (
    <AccountWorkspaceShell locale="en" section="audit" currentProjectId={projectId}>
      <AccountSavedAudit locale="en" projectId={projectId} auditId={auditId} />
    </AccountWorkspaceShell>
  );
}
