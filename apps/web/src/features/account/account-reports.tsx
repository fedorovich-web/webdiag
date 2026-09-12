"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { accountErrorMessage } from "./account-messages";
import { listAccountReports } from "./account-report-client";
import type { AccountReportListItem } from "./account-report-contract";
import {
  formatReportDate,
  reportShareState,
} from "./account-report-presentation";
import { projectPath, reportPath, reportsPath } from "../../lib/routes";

export function AccountReports({
  locale,
  projectId,
}: {
  readonly locale: Locale;
  readonly projectId?: string;
}) {
  const ru = locale === "ru";
  const [reports, setReports] = useState<readonly AccountReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    listAccountReports(projectId ? { projectId } : {})
      .then((value) => {
        if (!active) return;
        setReports(value.reports);
        setError("");
      })
      .catch((caught) => {
        if (!active) return;
        setReports([]);
        setError(accountErrorMessage(locale, caught));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [locale, projectId, reload]);

  function retry() {
    setError("");
    setLoading(true);
    setReload((value) => value + 1);
  }

  if (loading) return <section className="wd-account-card" aria-busy="true"><p>{ru ? "Загружаем отчёты…" : "Loading reports…"}</p></section>;

  return (
    <section className="wd-account-dashboard wd-reports-page">
      <header className="wd-account-dashboard-head wd-reports-hero">
        <div>
          <span className="eyebrow">{projectId ? (ru ? "Отчёты проекта" : "Project reports") : (ru ? "Для команды и клиентов" : "For teams and clients")}</span>
          <h1>{ru ? "Сохранённые отчёты" : "Saved reports"}</h1>
          <p>{ru ? "Сохраняйте версии результатов для чтения, экспорта и контролируемого общего доступа." : "Save result versions for review, export, and controlled sharing."}</p>
        </div>
        {projectId && <Link className="wd-button wd-button-secondary" href={reportsPath(locale)}>{ru ? "Все отчёты" : "All reports"}</Link>}
      </header>

      {error ? (
        <section className="wd-account-card wd-account-empty">
          <h2>{ru ? "Не удалось загрузить отчёты" : "Reports could not be loaded"}</h2>
          <p className="wd-account-error" role="alert">{error}</p>
          <button className="wd-button wd-button-primary" type="button" onClick={retry}>{ru ? "Повторить" : "Retry"}</button>
        </section>
      ) : reports.length === 0 ? (
        <section className="wd-account-card wd-account-empty">
          <h2>{projectId ? (ru ? "У проекта пока нет отчётов" : "This project has no reports yet") : (ru ? "Отчётов пока нет" : "No reports yet")}</h2>
          <p>{ru ? "Откройте сохранённый аудит и создайте отчёт из данных проверки." : "Open a saved audit and create a report from its check data."}</p>
        </section>
      ) : (
        <div className="wd-report-list" aria-label={ru ? "Список отчётов" : "Report list"}>
          {reports.map((report) => {
            const share = reportShareState(locale, report.shared, report.share_expires_at);
            return (
              <article key={report.id}>
                <div className="wd-report-list-main">
                  <div className="wd-report-list-heading">
                    <span>{report.locale.toUpperCase()}</span>
                    <h2><Link href={reportPath(locale, report.id)}>{report.title}</Link></h2>
                  </div>
                  <p><Link href={projectPath(locale, report.project_id)}>{report.project_name}</Link> · {report.target_origin}</p>
                  <dl>
                    <div><dt>{ru ? "Проверка" : "Check"}</dt><dd>{formatReportDate(locale, report.audit_completed_at)}</dd></div>
                    <div><dt>{ru ? "Отчёт создан" : "Created"}</dt><dd>{formatReportDate(locale, report.created_at)}</dd></div>
                    <div><dt>{ru ? "Доступ" : "Access"}</dt><dd>{share.label}</dd></div>
                  </dl>
                </div>
                <div className="wd-report-list-side">
                  <span className={report.shared ? "wd-report-share-state is-shared" : "wd-report-share-state"}>{share.label}</span>
                  {share.expiry && <small>{ru ? "до" : "until"} {formatReportDate(locale, share.expiry)}</small>}
                  <Link className="wd-button wd-button-secondary" href={reportPath(locale, report.id)}>{ru ? "Открыть отчёт" : "Open report"}</Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
