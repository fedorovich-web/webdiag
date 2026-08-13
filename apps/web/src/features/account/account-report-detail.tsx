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
import { formatReportDate } from "./account-report-presentation";
import { AccountReportSnapshotView } from "./account-report-view";
import { reportsPath } from "../../lib/routes";

export function AccountReportDetail({ locale, reportId, onProjectResolved }: { readonly locale: Locale; readonly reportId: string; readonly onProjectResolved?: (projectId: string) => void }) {
  const ru = locale === "ru";
  const [detail, setDetail] = useState<AccountReportDetailResponse | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [copyStatus, setCopyStatus] = useState<"" | "copied" | "failed">("");
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getAccountReport(reportId)
      .then((value) => { if (active) { setDetail(value); onProjectResolved?.(value.report.project_id); } })
      .catch((caught) => { if (active) setError(accountErrorMessage(locale, caught)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [locale, onProjectResolved, reportId]);

  async function enableShare() {
    if (detail?.report.shared && !window.confirm(ru
      ? "Новая ссылка сразу отключит текущую. Выпустить новую ссылку?"
      : "A new link will immediately disable the current link. Issue a new link?")) return;
    setPending(true);
    setError("");
    setCopyStatus("");
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
    if (!window.confirm(ru
      ? "Отозвать ссылку? После этого она сразу перестанет открывать отчёт."
      : "Revoke this link? It will stop opening the report immediately.")) return;
    setPending(true);
    setError("");
    setCopyStatus("");
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

  async function copyShareUrl() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  if (loading) return <section className="wd-account-card" aria-busy="true"><p>{ru ? "Загружаем отчёт…" : "Loading report…"}</p></section>;
  if (!detail) return <section className="wd-account-card wd-account-empty"><h1>{ru ? "Отчёт недоступен" : "Report unavailable"}</h1>{error && <p className="wd-account-error" role="alert">{error}</p>}</section>;

  return (
    <section className="wd-account-dashboard wd-report-detail-page">
      <nav className="wd-account-breadcrumb" aria-label={ru ? "Навигация кабинета" : "Workspace navigation"}><Link href={reportsPath(locale)}>{ru ? "Отчёты" : "Reports"}</Link><span aria-hidden="true">/</span><span>{detail.report.title}</span></nav>

      <AccountReportSnapshotView locale={locale} snapshot={detail.snapshot} />

      <section className="wd-report-actions" aria-labelledby="report-delivery-title">
        <div className="wd-report-delivery-head">
          <span className="eyebrow">{ru ? "Экспорт и передача" : "Export and delivery"}</span>
          <h2 id="report-delivery-title">{ru ? "Передать отчёт клиенту" : "Deliver the report"}</h2>
          <p>{ru ? "HTML-файл автономен. Печатная версия предназначена для сохранения в PDF через браузер." : "The HTML file is self-contained. Use the print view to save a PDF through the browser."}</p>
        </div>
        <div className="wd-report-action-buttons">
          <a className="wd-button wd-button-secondary" href={`/api/account/reports/${reportId}/export.html`}>{ru ? "Скачать HTML" : "Download HTML"}</a>
          <a className="wd-button wd-button-secondary" href={`/api/account/reports/${reportId}/print`} target="_blank" rel="noreferrer">{ru ? "Печать / PDF" : "Print / PDF"}</a>
        </div>

        <div className="wd-report-share-panel">
          <div>
            <h3>{ru ? "Ссылка для просмотра" : "View-only link"}</h3>
            <p>{detail.report.shared
              ? (ru ? `Общий доступ включён до ${formatReportDate(locale, detail.report.share_expires_at)}. Сохранённую ссылку повторно показать нельзя.` : `Sharing is enabled until ${formatReportDate(locale, detail.report.share_expires_at)}. The existing link cannot be shown again.`)
              : (ru ? "Ссылка открывает только этот неизменяемый отчёт и не даёт доступ к кабинету." : "The link opens only this immutable report and does not grant workspace access.")}</p>
          </div>
          <div className="wd-report-share-controls">
            <label>{ru ? "Срок ссылки" : "Link expiry"}<select value={expiresInDays} onChange={(event: ChangeEvent<HTMLSelectElement>) => setExpiresInDays(Number(event.target.value))} disabled={pending}><option value={1}>{ru ? "1 день" : "1 day"}</option><option value={7}>{ru ? "7 дней" : "7 days"}</option><option value={30}>{ru ? "30 дней" : "30 days"}</option></select></label>
            <button className="wd-button wd-button-primary" type="button" onClick={enableShare} disabled={pending} aria-busy={pending}>{detail.report.shared ? (ru ? "Выпустить новую ссылку" : "Issue a new link") : (ru ? "Включить общий доступ" : "Enable sharing")}</button>
            {detail.report.shared && <button className="wd-button wd-button-secondary" type="button" onClick={revokeShare} disabled={pending}>{ru ? "Отозвать ссылку" : "Revoke link"}</button>}
          </div>
          {shareUrl && (
            <div className="wd-report-share-result">
              <label className="wd-report-share-url">{ru ? "Сохраните ссылку сейчас — она показывается один раз" : "Save this link now — it is shown once"}<input value={shareUrl} readOnly onFocus={(event: FocusEvent<HTMLInputElement>) => event.currentTarget.select()} /></label>
              <button className="wd-button wd-button-secondary" type="button" onClick={copyShareUrl}>{ru ? "Копировать ссылку" : "Copy link"}</button>
              {copyStatus && <p role="status">{copyStatus === "copied" ? (ru ? "Ссылка скопирована." : "Link copied.") : (ru ? "Не удалось скопировать. Выделите ссылку вручную." : "Copy failed. Select the link manually.")}</p>}
            </div>
          )}
        </div>
        {error && <p className="wd-account-error" role="alert">{error}</p>}
      </section>
    </section>
  );
}
