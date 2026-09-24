"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { accountErrorMessage } from "./account-messages";
import { createAccountReport } from "./account-report-client";
import { getAccountSavedAudit } from "./account-workspace-client";
import type { SavedAuditDetailResponse } from "./account-workspace-contract";
import { projectPath, reportPath, savedAuditIssuesPath } from "../../lib/routes";
import { AccountAIAuditCopilot } from "./account-ai-audit-copilot";
import { AccountReportSnapshotView } from "./account-report-view";
import type { ReportSnapshot } from "./account-report-contract";


export function AccountSavedAudit({ locale, projectId, auditId }: { readonly locale: Locale; readonly projectId: string; readonly auditId: string }) {
  const ru = locale === "ru";
  const [detail, setDetail] = useState<SavedAuditDetailResponse | null>(null);
  const [reportTitle, setReportTitle] = useState(ru ? "Отчёт по аудиту сайта" : "Website audit report");
  const [reportPending, setReportPending] = useState(false);
  const [createdReportId, setCreatedReportId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getAccountSavedAudit(projectId, auditId, locale)
      .then((value) => { if (active) setDetail(value); })
      .catch((caught) => { if (active) setError(accountErrorMessage(locale, caught)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [auditId, locale, projectId]);

  async function createReport() {
    setReportPending(true);
    setError("");
    try {
      const report = await createAccountReport(projectId, auditId, {
        title: reportTitle,
        locale,
      });
      setCreatedReportId(report.report.id);
    } catch (caught) {
      setError(accountErrorMessage(locale, caught));
    } finally {
      setReportPending(false);
    }
  }

  if (loading) return <section className="wd-account-card" aria-busy="true"><p>{ru ? "Загружаем отчёт…" : "Loading report…"}</p></section>;
  if (!detail) return <section className="wd-account-card wd-account-empty"><h1>{ru ? "Отчёт недоступен" : "Report unavailable"}</h1>{error && <p className="wd-account-error" role="alert">{error}</p>}</section>;

  const snapshot: ReportSnapshot = {
    contract_version: "webdiag.account.report_snapshot.v1",
    title: ru ? "Отчёт по проверке сайта" : "Website audit report",
    locale,
    project_name: detail.project.name,
    target_origin: detail.payload.target_origin,
    audit_completed_at: detail.payload.completed_at,
    score: detail.payload.score,
    pagespeed: detail.payload.pagespeed ?? null,
    checks: detail.payload.checks,
    issues: detail.payload.issues,
    generated_at: detail.audit.created_at,
  };

  return (
    <section className="wd-account-dashboard wd-saved-audit-render">
      <nav className="wd-account-breadcrumb" aria-label={ru ? "Навигация кабинета" : "Account navigation"}>
        <Link href={projectPath(locale, projectId)}>{detail.project.name}</Link>
        <span aria-hidden="true">/</span>
        <span>{ru ? "Отчёт" : "Report"}</span>
      </nav>

      <AccountReportSnapshotView locale={locale} snapshot={snapshot} />


      <div className="wd-saved-audit-actions wd-saved-audit-render-actions">
        <Link className="wd-button wd-button-primary" href={savedAuditIssuesPath(locale, projectId, auditId)}>
          {ru ? "Проблемы и приоритеты" : "Issues and priorities"}
        </Link>
      </div>

      <AccountAIAuditCopilot locale={locale} projectId={projectId} auditId={auditId} />

      <section className="wd-account-card wd-create-report-card wd-create-report-render" aria-labelledby="create-report-title">
        <div>
          <span className="eyebrow">{ru ? "Сохранённый отчёт" : "Saved report"}</span>
          <h2 id="create-report-title">{ru ? "Сохранить отдельную версию отчёта" : "Save a standalone report"}</h2>
          <p>{ru ? "Создаётся неизменяемый snapshot, который можно экспортировать или открыть по временной ссылке." : "Creates an immutable snapshot that can be exported or shared through an expiring link."}</p>
        </div>
        <label>
          {ru ? "Название отчёта" : "Report title"}
          <input value={reportTitle} onChange={(event: ChangeEvent<HTMLInputElement>) => setReportTitle(event.target.value)} maxLength={120} disabled={reportPending} />
        </label>
        <button className="wd-button wd-button-secondary" type="button" onClick={createReport} disabled={reportPending || reportTitle.trim().length < 2} aria-busy={reportPending}>
          {reportPending ? (ru ? "Создаём…" : "Creating…") : (ru ? "Создать отчёт" : "Create report")}
        </button>
        {createdReportId && <p role="status"><Link href={reportPath(locale, createdReportId)}>{ru ? "Открыть сохранённый отчёт" : "Open saved report"}</Link></p>}
        {error && <p className="wd-account-error" role="alert">{error}</p>}
      </section>
    </section>
  );
}
