"use client";

import { useState } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { AccountReportDetail } from "./account-report-detail";
import { AccountWorkspaceShell } from "./account-workspace-shell";

export function AccountReportWorkspace({ locale, reportId }: { readonly locale: Locale; readonly reportId: string }) {
  const [projectId, setProjectId] = useState<string>();
  return (
    <AccountWorkspaceShell locale={locale} section="report" currentProjectId={projectId}>
      <AccountReportDetail locale={locale} reportId={reportId} onProjectResolved={setProjectId} />
    </AccountWorkspaceShell>
  );
}
