import { AccountMonitoring } from "../../../../../../src/features/account/account-monitoring";
import { AccountWorkspaceShell } from "../../../../../../src/features/account/account-workspace-shell";

export const metadata = { title: "Мониторинг проекта" };

export default async function MonitoringPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <AccountWorkspaceShell locale="ru" section="monitoring" currentProjectId={projectId}><AccountMonitoring locale="ru" projectId={projectId} /></AccountWorkspaceShell>;
}
