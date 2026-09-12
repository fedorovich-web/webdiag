"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { accountErrorMessage } from "./account-messages";
import { getAccountProject, runAccountProjectAudit } from "./account-workspace-client";
import type { AccountProjectDetailResponse } from "./account-workspace-contract";
import { accountPath, projectMonitoringPath, savedAuditPath } from "../../lib/routes";

export function AccountProjectDetail({ locale, projectId }: { readonly locale: Locale; readonly projectId: string }) {
  const ru = locale === "ru";
  const [detail, setDetail] = useState<AccountProjectDetailResponse | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const requestKey = `${locale}:${projectId}:${reload}`;
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let active = true;
    getAccountProject(projectId)
      .then((value) => {
        if (!active) return;
        setDetail(value);
        setError("");
        setLoadedKey(requestKey);
      })
      .catch((caught) => {
        if (!active) return;
        setDetail(null);
        setError(accountErrorMessage(locale, caught));
        setLoadedKey(requestKey);
      });
    return () => { active = false; };
  }, [locale, projectId, requestKey]);

  async function runAudit() {
    setRunning(true);
    setError("");
    try {
      const saved = await runAccountProjectAudit(projectId);
      setDetail((current) => current ? { ...current, saved_audits: [saved.audit, ...current.saved_audits] } : current);
    } catch (caught) {
      setError(accountErrorMessage(locale, caught));
    } finally {
      setRunning(false);
    }
  }

  if (loading) return <section className="wd-account-card" aria-busy="true"><p>{ru ? "Загружаем проект…" : "Loading project…"}</p></section>;
  if (!detail) return <section className="wd-account-card wd-account-empty"><h1>{ru ? "Проект недоступен" : "Project unavailable"}</h1>{error && <p className="wd-account-error" role="alert">{error}</p>}<button className="wd-button wd-button-primary" type="button" onClick={() => setReload((value) => value + 1)}>{ru ? "Повторить" : "Retry"}</button></section>;

  return (
    <section className="wd-account-dashboard">
      <nav className="wd-account-breadcrumb" aria-label={ru ? "Навигация кабинета" : "Account navigation"}><Link href={accountPath(locale)}>{ru ? "Проекты" : "Projects"}</Link><span aria-hidden="true">/</span><span>{detail.project.name}</span></nav>
      <header className="wd-account-dashboard-head">
        <div><span className="eyebrow">{ru ? "Проект" : "Project"}</span><h1>{detail.project.name}</h1><p>{detail.project.origin}</p></div>
        <div className="wd-account-actions"><a className="wd-button wd-button-secondary" href={projectMonitoringPath(locale, projectId)}>{ru ? "Мониторинг" : "Monitoring"}</a><button className="wd-button wd-button-primary" type="button" onClick={runAudit} disabled={running} aria-busy={running}>{running ? (ru ? "Проверяем сайт…" : "Running audit…") : (ru ? "Запустить и сохранить аудит" : "Run and save audit")}</button></div>
      </header>
      {error && <p className="wd-account-error" role="alert">{error}</p>}
      <section className="wd-audit-history" aria-labelledby="audit-history-title">
        <div className="wd-project-list-head"><div><span className="eyebrow">{ru ? "Реальные результаты" : "Real results"}</span><h2 id="audit-history-title">{ru ? "История аудитов" : "Audit history"}</h2></div><strong>{detail.saved_audits.length}</strong></div>
        {detail.saved_audits.length === 0 ? <div className="wd-account-empty"><p>{ru ? "Сохранённых аудитов пока нет." : "No saved audits yet."}</p></div> : (
          <div className="wd-audit-list">
            {detail.saved_audits.map((audit) => (
              <article key={audit.id} className="wd-audit-row">
                <div><strong>{audit.score === null ? "—" : `${audit.score}/100`}</strong><p>{new Intl.DateTimeFormat(ru ? "ru-RU" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(audit.completed_at))}</p></div>
                <p>{ru ? `${audit.check_count} проверок · ${audit.issue_count} проблем` : `${audit.check_count} checks · ${audit.issue_count} issues`}</p>
                <Link className="wd-button wd-button-secondary" href={savedAuditPath(locale, projectId, audit.id)}>{ru ? "Открыть отчёт" : "Open report"}</Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
