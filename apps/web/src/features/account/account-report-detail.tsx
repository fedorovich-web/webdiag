"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent, type FocusEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { accountErrorMessage } from "./account-messages";
import {
  enableAccountReportShare,
  getAccountReport,
  revokeAccountReportShare,
} from "./account-report-client";
import type { AccountReportDetailResponse } from "./account-report-contract";
import { AccountReportSnapshotView } from "./account-report-view";
import { reportsPath } from "../../lib/routes";

export function AccountReportDetail({ locale, reportId }: { readonly locale: Locale; readonly reportId: string }) {
  const ru = locale === "ru";
  const [detail, setDetail] = useState<AccountReportDetailResponse | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getAccountReport(reportId)
      .then((value) => { if (active) setDetail(value); })
      .catch((caught) => { if (active) setError(accountErrorMessage(locale, caught)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [locale, reportId]);

  async function enableShare() {
    setPending(true);
    setError("");
    try {
      const share = await enableAccountReportShare(reportId, expiresInDays);
      setShareUrl(`${window.location.origin}${share.share_path}`);
      setDetail((current) => current ? {
        ...current,
        report: { ...current.report, shared: true, share_expires_at: share.expires_at },
      } : current);
    } catch (caught) {
      setError(accountErrorMessage(locale, caught));
    } finally {
      setPending(false);
    }
  }

  async function revokeShare() {
    setPending(true);
    setError("");
    try {
      const value = await revokeAccountReportShare(reportId);
      setDetail(value);
      setShareUrl("");
    } catch (caught) {
      setError(accountErrorMessage(locale, caught));
    } finally {
      setPending(false);
    }
  }

  if (loading) return <section className="wd-account-card" aria-busy="true"><p>{ru ? "Загружаем отчёт…" : "Loading report…"}</p></section>;
  if (!detail) return <section className="wd-account-card wd-account-empty"><h1>{ru ? "Отчёт недоступен" : "Report unavailable"}</h1>{error && <p className="wd-account-error" role="alert">{error}</p>}</section>;

  return (
    <section className="wd-account-dashboard">
      <nav className="wd-account-breadcrumb" aria-label={ru ? "Навигация кабинета" : "Workspace navigation"}><Link href={reportsPath(locale)}>{ru ? "Отчёты" : "Reports"}</Link><span aria-hidden="true">/</span><span>{detail.report.title}</span></nav>
      <div className="wd-report-actions wd-account-card">
        <div>
          <h2>{ru ? "Экспорт и общий доступ" : "Export and sharing"}</h2>
          <p>{ru ? "HTML-файл автономен. Для PDF откройте печатную версию и сохраните её через печать браузера." : "The HTML file is self-contained. For PDF, open the print view and save it through the browser print dialog."}</p>
        </div>
        <div className="wd-report-action-buttons">
          <a className="wd-button wd-button-secondary" href={`/api/account/reports/${reportId}/export.html`}>{ru ? "Скачать HTML" : "Download HTML"}</a>
          <a className="wd-button wd-button-secondary" href={`/api/account/reports/${reportId}/print`} target="_blank" rel="noreferrer">{ru ? "Печать / PDF" : "Print / PDF"}</a>
        </div>
        <div className="wd-report-share-controls">
          <label>{ru ? "Срок ссылки" : "Link expiry"}<select value={expiresInDays} onChange={(event: ChangeEvent<HTMLSelectElement>) => setExpiresInDays(Number(event.target.value))} disabled={pending}><option value={1}>{ru ? "1 день" : "1 day"}</option><option value={7}>{ru ? "7 дней" : "7 days"}</option><option value={30}>{ru ? "30 дней" : "30 days"}</option></select></label>
          <button className="wd-button wd-button-primary" type="button" onClick={enableShare} disabled={pending} aria-busy={pending}>{detail.report.shared ? (ru ? "Выпустить новую ссылку" : "Issue a new link") : (ru ? "Включить общий доступ" : "Enable sharing")}</button>
          {detail.report.shared && <button className="wd-button wd-button-secondary" type="button" onClick={revokeShare} disabled={pending}>{ru ? "Отозвать ссылку" : "Revoke link"}</button>}
        </div>
        {shareUrl && <label className="wd-report-share-url">{ru ? "Ссылка показывается один раз" : "The link is shown once"}<input value={shareUrl} readOnly onFocus={(event: FocusEvent<HTMLInputElement>) => event.currentTarget.select()} /></label>}
        {error && <p className="wd-account-error" role="alert">{error}</p>}
      </div>
      <AccountReportSnapshotView locale={locale} snapshot={detail.snapshot} />
    </section>
  );
}
