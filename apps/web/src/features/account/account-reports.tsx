"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { accountErrorMessage } from "./account-messages";
import { listAccountReports } from "./account-report-client";
import type { AccountReportSummary } from "./account-report-contract";
import { reportPath } from "../../lib/routes";

export function AccountReports({ locale }: { readonly locale: Locale }) {
  const ru = locale === "ru";
  const [reports, setReports] = useState<readonly AccountReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    listAccountReports()
      .then((value) => { if (active) setReports(value.reports); })
      .catch((caught) => { if (active) setError(accountErrorMessage(locale, caught)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [locale]);

  if (loading) return <section className="wd-account-card" aria-busy="true"><p>{ru ? "Загружаем отчёты…" : "Loading reports…"}</p></section>;

  return (
    <section className="wd-account-dashboard">
      <header className="wd-account-dashboard-head">
        <div><span className="eyebrow">WebDiag Reports</span><h1>{ru ? "Сохранённые отчёты" : "Saved reports"}</h1></div>
      </header>
      {error && <p className="wd-account-error" role="alert">{error}</p>}
      {reports.length === 0 ? (
        <section className="wd-account-card wd-account-empty">
          <h2>{ru ? "Отчётов пока нет" : "No reports yet"}</h2>
          <p>{ru ? "Откройте сохранённый аудит и создайте отчёт из его подтверждённых данных." : "Open a saved audit and create a report from its verified data."}</p>
        </section>
      ) : (
        <div className="wd-report-list">
          {reports.map((report) => (
            <article className="wd-account-card" key={report.id}>
              <div><span className="eyebrow">{report.locale.toUpperCase()}</span><h2><Link href={reportPath(locale, report.id)}>{report.title}</Link></h2><p>{new Date(report.created_at).toLocaleString(ru ? "ru-RU" : "en-US")}</p></div>
              <span className={report.shared ? "wd-report-share-state is-shared" : "wd-report-share-state"}>{report.shared ? (ru ? "Общий доступ включён" : "Sharing enabled") : (ru ? "Приватный" : "Private")}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
