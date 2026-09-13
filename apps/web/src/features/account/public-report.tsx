"use client";

import { useEffect, useState } from "react";
import { getPublicReport } from "./account-report-client";
import type { PublicReportResponse } from "./account-report-contract";
import { formatReportDate, publicReportShellCopy } from "./account-report-presentation";
import { AccountReportSnapshotView } from "./account-report-view";

export function PublicReport({
  shareToken,
  initialLocale,
}: {
  readonly shareToken: string;
  readonly initialLocale: "ru" | "en";
}) {
  const [report, setReport] = useState<PublicReportResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    getPublicReport(shareToken)
      .then((value) => { if (active) setReport(value); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [shareToken]);

  if (failed) {
    const copy = publicReportShellCopy(initialLocale, "error");
    return <main className="shell wd-public-report-page"><section className="wd-account-card wd-account-empty"><h1>{copy.title}</h1><p>{copy.message}</p></section></main>;
  }
  if (!report) {
    const copy = publicReportShellCopy(initialLocale, "loading");
    return <main className="shell wd-public-report-page"><section className="wd-account-card" aria-busy="true"><p>{copy.message}</p></section></main>;
  }

  const locale = report.snapshot.locale;
  const ru = locale === "ru";
  return (
    <main className="shell wd-public-report-page">
      <header className="wd-public-report-context">
        <div><span>{ru ? "Общая ссылка WebDiag" : "WebDiag shared link"}</span><strong>{report.report.title}</strong></div>
        <p>{ru ? "Доступ до" : "Available until"} {formatReportDate(locale, report.report.expires_at)}</p>
      </header>
      <AccountReportSnapshotView locale={locale} snapshot={report.snapshot} />
      <section className="wd-public-report-actions" aria-label={ru ? "Экспорт отчёта" : "Report export"}>
        <div><h2>{ru ? "Сохранить отчёт" : "Save the report"}</h2><p>{ru ? "Скачайте автономный HTML или сохраните печатную версию в PDF." : "Download the self-contained HTML or save the print view as PDF."}</p></div>
        <div className="wd-report-action-buttons">
          <a className="wd-button wd-button-secondary" href={`/api/reports/share/${shareToken}/export.html`}>{ru ? "Скачать HTML" : "Download HTML"}</a>
          <a className="wd-button wd-button-secondary" href={`/api/reports/share/${shareToken}/print`} target="_blank" rel="noreferrer">{ru ? "Печать / PDF" : "Print / PDF"}</a>
        </div>
      </section>
    </main>
  );
}
