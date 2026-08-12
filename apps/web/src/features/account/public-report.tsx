"use client";

import { useEffect, useState } from "react";
import { getPublicReport } from "./account-report-client";
import type { PublicReportResponse } from "./account-report-contract";
import { AccountReportSnapshotView } from "./account-report-view";

export function PublicReport({ shareToken }: { readonly shareToken: string }) {
  const [report, setReport] = useState<PublicReportResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    getPublicReport(shareToken)
      .then((value) => { if (active) setReport(value); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [shareToken]);

  if (failed) return <main className="shell wd-public-report-page"><section className="wd-account-card wd-account-empty"><h1>Report unavailable</h1><p>The share link is invalid, revoked, or expired.</p></section></main>;
  if (!report) return <main className="shell wd-public-report-page"><section className="wd-account-card" aria-busy="true"><p>Loading report…</p></section></main>;

  return (
    <main className="shell wd-public-report-page">
      <div className="wd-report-action-buttons">
        <a className="wd-button wd-button-secondary" href={`/api/reports/share/${shareToken}/export.html`}>{report.snapshot.locale === "ru" ? "Скачать HTML" : "Download HTML"}</a>
        <a className="wd-button wd-button-secondary" href={`/api/reports/share/${shareToken}/print`} target="_blank" rel="noreferrer">{report.snapshot.locale === "ru" ? "Печать / PDF" : "Print / PDF"}</a>
      </div>
      <AccountReportSnapshotView locale={report.snapshot.locale} snapshot={report.snapshot} />
    </main>
  );
}
