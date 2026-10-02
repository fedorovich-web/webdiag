import type { Metadata } from "next";
import { AccountProjectDetail } from "../../../../../src/features/account/account-project-detail";
import { AccountWorkspaceShell } from "../../../../../src/features/account/account-workspace-shell";

export const metadata: Metadata = { title: "Проект", robots: { index: false, follow: false } };

export default async function Page({ params }: { readonly params: Promise<{ readonly projectId: string }> }) {
  const { projectId } = await params;
  return (
    <AccountWorkspaceShell locale="ru" section="project" currentProjectId={projectId}>
      <AccountProjectDetail locale="ru" projectId={projectId} />
    </AccountWorkspaceShell>
  );
}
