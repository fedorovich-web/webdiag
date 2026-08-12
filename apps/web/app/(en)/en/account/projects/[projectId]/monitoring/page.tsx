import { AccountMonitoring } from "../../../../../../../src/features/account/account-monitoring";
import { AccountWorkspaceShell } from "../../../../../../../src/features/account/account-workspace-shell";

export const metadata = { title: "Project monitoring" };

export default async function MonitoringPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <AccountWorkspaceShell locale="en" section="project" currentProjectId={projectId}><AccountMonitoring locale="en" projectId={projectId} /></AccountWorkspaceShell>;
}
