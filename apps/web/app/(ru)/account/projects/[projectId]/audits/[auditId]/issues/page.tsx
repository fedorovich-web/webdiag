import type { Metadata } from "next";
import { AccountIssuesList } from "../../../../../../../../src/features/account/account-issues-list";
import { AccountWorkspaceShell } from "../../../../../../../../src/features/account/account-workspace-shell";

export const metadata: Metadata = { title: "Проблемы и приоритеты", robots: { index: false, follow: false } };

export default async function Page({ params }: { readonly params: Promise<{ readonly projectId: string; readonly auditId: string }> }) {
  const { projectId, auditId } = await params;
  return (
    <AccountWorkspaceShell locale="ru" section="issues" currentProjectId={projectId}>
      <AccountIssuesList locale="ru" projectId={projectId} auditId={auditId} />
    </AccountWorkspaceShell>
  );
}
