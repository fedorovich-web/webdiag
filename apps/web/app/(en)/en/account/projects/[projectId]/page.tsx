import type { Metadata } from "next";
import { AccountProjectDetail } from "../../../../../../src/features/account/account-project-detail";
import { AccountWorkspaceShell } from "../../../../../../src/features/account/account-workspace-shell";

export const metadata: Metadata = { title: "Project", robots: { index: false, follow: false } };

export default async function Page({ params }: { readonly params: Promise<{ readonly projectId: string }> }) {
  const { projectId } = await params;
  return (
    <AccountWorkspaceShell locale="en" section="project" currentProjectId={projectId}>
      <AccountProjectDetail locale="en" projectId={projectId} />
    </AccountWorkspaceShell>
  );
}
