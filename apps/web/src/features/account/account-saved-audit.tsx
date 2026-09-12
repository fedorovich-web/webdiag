"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { accountErrorMessage } from "./account-messages";
import { createAccountReport } from "./account-report-client";
import { getAccountSavedAudit } from "./account-workspace-client";
import type { SavedAuditDetailResponse } from "./account-workspace-contract";
import { projectPath, reportPath, savedAuditIssuesPath } from "../../lib/routes";

const ruChecks: Readonly<Record<string, string>> = {
  "http.status": "HTTP-статус",
  "redirects.chain": "Цепочка перенаправлений",
  "content_type.html": "HTML-тип содержимого",
  "metadata.title": "Title",
  "metadata.description": "Метаописание",
  "metadata.h1": "H1",
  "metadata.canonical": "Canonical",
  "indexability.robots_meta": "Robots meta",
  "metadata.open_graph": "Open Graph",
  "structured_data.json_ld": "JSON-LD",
  "security.headers": "Заголовки безопасности",
  "crawlability.robots_txt": "robots.txt",
  "crawlability.sitemap_xml": "sitemap.xml",
};

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
    getAccountSavedAudit(projectId, auditId)
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

  return (
    <section className="wd-account-dashboard">
      <nav className="wd-account-breadcrumb" aria-label={ru ? "Навигация кабинета" : "Account navigation"}><Link href={projectPath(locale, projectId)}>{detail.project.name}</Link><span aria-hidden="true">/</span><span>{ru ? "Сохранённый аудит" : "Saved audit"}</span></nav>
      <header className="wd-saved-audit-head"><div><span className="eyebrow">{ru ? "Версионированный результат" : "Versioned result"}</span><h1>{ru ? "Отчёт по сайту" : "Website report"}</h1><p>{detail.payload.target_origin}</p></div><strong>{detail.payload.score === null ? "—" : `${detail.payload.score}/100`}</strong></header>
      <div className="wd-saved-audit-actions">
        <Link className="wd-button wd-button-primary" href={savedAuditIssuesPath(locale, projectId, auditId)}>{ru ? "Проблемы и приоритеты" : "Issues and priorities"}</Link>
      </div>
      <section className="wd-account-card wd-create-report-card" aria-labelledby="create-report-title">
        <div><h2 id="create-report-title">{ru ? "Сохранить отдельный отчёт" : "Save a standalone report"}</h2><p>{ru ? "Создаётся неизменяемый snapshot без raw evidence и внутренних идентификаторов." : "Creates an immutable snapshot without raw evidence or internal identifiers."}</p></div>
        <label>{ru ? "Название отчёта" : "Report title"}<input value={reportTitle} onChange={(event: ChangeEvent<HTMLInputElement>) => setReportTitle(event.target.value)} maxLength={120} disabled={reportPending} /></label>
        <button className="wd-button wd-button-secondary" type="button" onClick={createReport} disabled={reportPending || reportTitle.trim().length < 2} aria-busy={reportPending}>{reportPending ? (ru ? "Создаём…" : "Creating…") : (ru ? "Создать отчёт" : "Create report")}</button>
        {createdReportId && <p role="status"><Link href={reportPath(locale, createdReportId)}>{ru ? "Открыть сохранённый отчёт" : "Open saved report"}</Link></p>}
        {error && <p className="wd-account-error" role="alert">{error}</p>}
      </section>
      <section className="wd-saved-checks" aria-labelledby="saved-checks-title"><h2 id="saved-checks-title">{ru ? "Проверки" : "Checks"}</h2><div className="wd-check-grid">{detail.payload.checks.map((check) => <article key={check.check_id}><h3>{ru ? (ruChecks[check.check_id] ?? check.name) : check.name}</h3><p>{check.status}</p></article>)}</div></section>
      <section className="wd-saved-issues" aria-labelledby="saved-issues-title"><h2 id="saved-issues-title">{ru ? "Проблемы" : "Issues"}</h2>{detail.payload.issues.length === 0 ? <p>{ru ? "Проблем не найдено." : "No issues found."}</p> : <div className="wd-issue-list">{detail.payload.issues.map((issue) => <article key={issue.issue_id}><header><span>{issue.priority.toUpperCase()}</span><h3>{issue.title}</h3></header><p>{issue.description}</p><strong>{issue.recommendation.summary}</strong>{issue.recommendation.steps.length > 0 && <ol>{issue.recommendation.steps.map((step) => <li key={step}>{step}</li>)}</ol>}</article>)}</div>}</section>
    </section>
  );
}
