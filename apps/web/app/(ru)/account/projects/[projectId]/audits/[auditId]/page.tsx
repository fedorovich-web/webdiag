import type { Metadata } from "next";
import { AccountSavedAudit } from "../../../../../../../src/features/account/account-saved-audit";
import { AccountWorkspaceShell } from "../../../../../../../src/features/account/account-workspace-shell";

export const metadata: Metadata = { title: "Сохранённый аудит", robots: { index: false, follow: false } };

export default async function Page({ params }: { readonly params: Promise<{ readonly projectId: string; readonly auditId: string }> }) {
  const { projectId, auditId } = await params;
  return (
    <AccountWorkspaceShell locale="ru" section="audit" currentProjectId={projectId} currentAuditId={auditId}>
      <AccountSavedAudit locale="ru" projectId={projectId} auditId={auditId} />
    </AccountWorkspaceShell>
  );
}
