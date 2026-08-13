import type { Metadata } from "next";
import { AccountIssueDetail } from "../../../../../../../../../src/features/account/account-issue-detail";
import { AccountWorkspaceShell } from "../../../../../../../../../src/features/account/account-workspace-shell";

export const metadata: Metadata = { title: "Проблема аудита", robots: { index: false, follow: false } };

export default async function Page({ params }: { readonly params: Promise<{ readonly projectId: string; readonly auditId: string; readonly issueId: string }> }) {
  const { projectId, auditId, issueId } = await params;
  return (
    <AccountWorkspaceShell locale="ru" section="issues" currentProjectId={projectId}>
      <AccountIssueDetail locale="ru" projectId={projectId} auditId={auditId} issueId={issueId} />
    </AccountWorkspaceShell>
  );
}
