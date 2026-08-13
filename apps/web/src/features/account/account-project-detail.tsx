"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { accountErrorMessage } from "./account-messages";
import { announceAccountAuthenticationLost } from "./account-authentication-state";
import {
  archiveAccountProject,
  getAccountCrawl,
  getAccountProject,
  listAccountCrawls,
  renameAccountProject,
  runAccountProjectAudit,
  startAccountCrawl,
} from "./account-workspace-client";
import type { AccountCrawlDetail, AccountCrawlJob, AccountProjectDetailResponse } from "./account-workspace-contract";
import { accountPath, projectMonitoringPath, savedAuditPath } from "../../lib/routes";

export function AccountProjectDetail({ locale, projectId }: { readonly locale: Locale; readonly projectId: string }) {
  const ru = locale === "ru";
  const [detail, setDetail] = useState<AccountProjectDetailResponse | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [crawlDetail, setCrawlDetail] = useState<AccountCrawlDetail | null>(null);
  const [crawlHistory, setCrawlHistory] = useState<readonly AccountCrawlJob[]>([]);
  const [crawlPending, setCrawlPending] = useState(false);
  const [crawlError, setCrawlError] = useState("");
  const [managementOpen, setManagementOpen] = useState(false);
  const [archiveConfirmationOpen, setArchiveConfirmationOpen] = useState(false);
  const [renamePending, setRenamePending] = useState(false);
  const [archivePending, setArchivePending] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [renameError, setRenameError] = useState("");
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
        setProjectName(value.project.name);
        setError("");
        setLoadedKey(requestKey);
      })
      .catch((caught) => {
        if (!active) return;
        if (announceAccountAuthenticationLost(caught)) return;
        setDetail(null);
        setError(accountErrorMessage(locale, caught));
        setLoadedKey(requestKey);
      });
    return () => { active = false; };
  }, [locale, projectId, requestKey]);

  useEffect(() => {
    let active = true;
    listAccountCrawls(projectId)
      .then((value) => {
        if (!active) return;
        setCrawlHistory(value.jobs);
        const latest = value.jobs[0];
        if (latest) return getAccountCrawl(projectId, latest.id);
        return null;
      })
      .then((value) => {
        if (active && value) setCrawlDetail(value);
      })
      .catch((caught) => {
        if (!active || announceAccountAuthenticationLost(caught)) return;
        setCrawlError(accountErrorMessage(locale, caught));
      });
    return () => { active = false; };
  }, [locale, projectId]);

  useEffect(() => {
    const job = crawlDetail?.job;
    if (!job || !["queued", "running"].includes(job.state)) return;
    const timer = window.setTimeout(() => {
      getAccountCrawl(projectId, job.id)
        .then((value) => {
          setCrawlDetail(value);
          setCrawlHistory((current) => [value.job, ...current.filter((item) => item.id !== value.job.id)]);
        })
        .catch((caught) => {
          if (announceAccountAuthenticationLost(caught)) return;
          setCrawlError(accountErrorMessage(locale, caught));
        });
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [crawlDetail, locale, projectId]);

  async function runAudit() {
    setRunning(true);
    setError("");
    try {
      const saved = await runAccountProjectAudit(projectId);
      setDetail((current) => current ? { ...current, saved_audits: [saved.audit, ...current.saved_audits] } : current);
    } catch (caught) {
      if (announceAccountAuthenticationLost(caught)) return;
      setError(accountErrorMessage(locale, caught));
    } finally {
      setRunning(false);
    }
  }

  async function runCrawl() {
    setCrawlPending(true);
    setCrawlError("");
    try {
      const created = await startAccountCrawl(projectId);
      setCrawlDetail(created);
      setCrawlHistory((current) => [created.job, ...current.filter((item) => item.id !== created.job.id)]);
    } catch (caught) {
      if (announceAccountAuthenticationLost(caught)) return;
      setCrawlError(accountErrorMessage(locale, caught));
    } finally {
      setCrawlPending(false);
    }
  }

  async function renameProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRenamePending(true);
    setError("");
    setRenameError("");
    try {
      const project = await renameAccountProject(projectId, projectName);
      setProjectName(project.name);
      setDetail((current) => current ? { ...current, project } : current);
      window.dispatchEvent(new CustomEvent("webdiag:account-project-updated", { detail: project }));
    } catch (caught) {
      if (announceAccountAuthenticationLost(caught)) return;
      setRenameError(accountErrorMessage(locale, caught));
    } finally {
      setRenamePending(false);
    }
  }

  async function archiveProject() {
    setArchivePending(true);
    setError("");
    try {
      await archiveAccountProject(projectId);
      window.location.assign(accountPath(locale));
    } catch (caught) {
      if (announceAccountAuthenticationLost(caught)) return;
      setError(accountErrorMessage(locale, caught));
      setArchivePending(false);
    }
  }

  if (loading) return <section className="wd-account-card" aria-busy="true"><p>{ru ? "Загружаем проект…" : "Loading project…"}</p></section>;
  if (!detail) return <section className="wd-account-card wd-account-empty"><h1>{ru ? "Проект недоступен" : "Project unavailable"}</h1>{error && <p className="wd-account-error" role="alert">{error}</p>}<button className="wd-button wd-button-primary" type="button" onClick={() => setReload((value) => value + 1)}>{ru ? "Повторить" : "Retry"}</button></section>;

  return (
    <section className="wd-account-dashboard">
      <nav className="wd-account-breadcrumb" aria-label={ru ? "Навигация кабинета" : "Account navigation"}><Link href={accountPath(locale)}>{ru ? "Проекты" : "Projects"}</Link><span aria-hidden="true">/</span><span>{detail.project.name}</span></nav>
      <header className="wd-account-dashboard-head">
        <div><span className="eyebrow">{ru ? "Проект" : "Project"}</span><h1>{detail.project.name}</h1><p>{detail.project.origin}</p></div>
        <div className="wd-account-actions"><a className="wd-button wd-button-secondary" href={projectMonitoringPath(locale, projectId)}>{ru ? "Мониторинг" : "Monitoring"}</a><button className="wd-button wd-button-secondary" type="button" aria-expanded={managementOpen} aria-controls="project-management" onClick={() => setManagementOpen((value) => !value)}>{ru ? "Управление проектом" : "Manage project"}</button><button className="wd-button wd-button-primary" type="button" onClick={runAudit} disabled={running} aria-busy={running}>{running ? (ru ? "Проверяем сайт…" : "Running audit…") : (ru ? "Запустить и сохранить аудит" : "Run and save audit")}</button></div>
      </header>
      {error && <p className="wd-account-error" role="alert">{error}</p>}
      {managementOpen && (
        <section id="project-management" className="wd-project-management" aria-labelledby="project-management-title">
          <div className="wd-project-management-copy">
            <span className="eyebrow">{ru ? "Настройки" : "Settings"}</span>
            <h2 id="project-management-title">{ru ? "Управление проектом" : "Project management"}</h2>
            <p>{ru ? "Домен проекта изменить нельзя: сохранённые аудиты и отчёты остаются привязаны к исходному адресу." : "The project origin cannot be changed because saved audits and reports remain tied to the original address."}</p>
          </div>
          <form className="wd-project-rename" onSubmit={renameProject} aria-busy={renamePending}>
            <label>{ru ? "Название проекта" : "Project name"}<input value={projectName} onChange={(event: ChangeEvent<HTMLInputElement>) => setProjectName(event.target.value)} minLength={2} maxLength={80} required autoComplete="off" disabled={renamePending || archivePending} aria-invalid={Boolean(renameError)} aria-describedby={renameError ? "project-rename-error" : undefined} /></label>
            <button className="wd-button wd-button-secondary" type="submit" disabled={renamePending || archivePending || projectName.trim() === detail.project.name}>{renamePending ? (ru ? "Сохраняем…" : "Saving…") : (ru ? "Сохранить название" : "Save name")}</button>
            {renameError && <p id="project-rename-error" className="wd-account-error" role="alert">{renameError}</p>}
          </form>
          <div className="wd-project-archive-zone">
            <div><strong>{ru ? "Архив проекта" : "Project archive"}</strong><p>{ru ? "Мониторинг будет остановлен. Отчёты и ссылки останутся доступны, а проект можно будет восстановить." : "Monitoring will stop. Reports and links will remain available, and the project can be restored."}</p></div>
            {!archiveConfirmationOpen ? (
              <button className="wd-button wd-button-secondary" type="button" onClick={() => setArchiveConfirmationOpen(true)} disabled={renamePending}>{ru ? "Архивировать проект" : "Archive project"}</button>
            ) : (
              <div className="wd-project-archive-confirm" role="group" aria-label={ru ? "Подтверждение архивирования" : "Archive confirmation"}>
                <button className="wd-button wd-button-secondary" type="button" onClick={() => setArchiveConfirmationOpen(false)} disabled={archivePending}>{ru ? "Отмена" : "Cancel"}</button>
                <button className="wd-button wd-button-danger" type="button" onClick={archiveProject} disabled={archivePending} aria-busy={archivePending}>{archivePending ? (ru ? "Архивируем…" : "Archiving…") : (ru ? "Подтвердить архивирование" : "Confirm archive")}</button>
              </div>
            )}
          </div>
        </section>
      )}
      <section className="wd-crawl-console" aria-labelledby="crawl-console-title">
        <div className="wd-crawl-console-head">
          <div>
            <span className="eyebrow">{ru ? "Сайт целиком" : "Whole site"}</span>
            <h2 id="crawl-console-title">{ru ? "Ограниченный обход проекта" : "Bounded project crawl"}</h2>
            <p>{ru ? "До 25 HTML-страниц одного origin. Без входа в закрытые разделы, выполнения JavaScript и отправки форм." : "Up to 25 HTML pages on one origin. No authenticated areas, JavaScript execution, or form submissions."}</p>
          </div>
          <button
            className="wd-button wd-button-primary"
            type="button"
            onClick={runCrawl}
            disabled={crawlPending || crawlDetail?.job.state === "queued" || crawlDetail?.job.state === "running"}
            aria-busy={crawlPending}
          >
            {crawlPending ? (ru ? "Ставим в очередь…" : "Queuing…") : (ru ? "Обойти сайт" : "Crawl site")}
          </button>
        </div>
        {crawlError && <p className="wd-account-error" role="alert">{crawlError}</p>}
        {!crawlDetail ? (
          <div className="wd-crawl-empty"><strong>{ru ? "Обходов пока нет" : "No crawls yet"}</strong><p>{ru ? "Запустите обход, чтобы проверить дубли метаданных и страницы из sitemap без внутренних ссылок." : "Start a crawl to inspect duplicate metadata and sitemap pages without internal links."}</p></div>
        ) : (
          <CrawlSummary locale={locale} detail={crawlDetail} historyCount={crawlHistory.length} />
        )}
      </section>
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

function CrawlSummary({ locale, detail, historyCount }: { readonly locale: Locale; readonly detail: AccountCrawlDetail; readonly historyCount: number }) {
  const ru = locale === "ru";
  const { job, result } = detail;
  const state = {
    queued: ru ? "В очереди" : "Queued",
    running: ru ? "Выполняется" : "Running",
    succeeded: ru ? "Готово" : "Completed",
    failed: ru ? "Не завершено" : "Not completed",
  }[job.state];
  if (!result) return (
    <div className="wd-crawl-progress" aria-live="polite">
      <span className="wd-crawl-state" data-state={job.state}>{state}</span>
      <div><strong>{ru ? "Последний обход" : "Latest crawl"}</strong><p>{new Intl.DateTimeFormat(ru ? "ru-RU" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(job.created_at))}</p></div>
      {job.state === "failed" && <p>{ru ? "Корневая страница не прошла безопасную проверку или не вернула HTML. Подробности сети не раскрываются." : "The root page failed the safe-fetch checks or did not return HTML. Network internals are not exposed."}</p>}
    </div>
  );
  const duplicatePages = new Set([...result.duplicate_titles, ...result.duplicate_descriptions].flatMap((group) => group.urls)).size;
  return (
    <div className="wd-crawl-result">
      <div className="wd-crawl-result-meta"><span className="wd-crawl-state" data-state={job.state}>{state}</span><span>{ru ? `История: ${historyCount}` : `History: ${historyCount}`}</span><span>{new Intl.DateTimeFormat(ru ? "ru-RU" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(result.completed_at))}</span></div>
      <dl>
        <div><dt>{ru ? "Получено HTML" : "HTML fetched"}</dt><dd>{result.pages.length}</dd></div>
        <div><dt>{ru ? "Страниц с дублями" : "Pages with duplicates"}</dt><dd>{duplicatePages}</dd></div>
        <div><dt>{ru ? "Без внутренних ссылок" : "No internal links"}</dt><dd>{result.orphan_urls.length}</dd></div>
        <div><dt>{ru ? "Не проверено" : "Not checked"}</dt><dd>{result.page_failures.length}</dd></div>
      </dl>
      {result.page_budget_exhausted && <p className="wd-crawl-limit-note">{ru ? `Достигнут лимит ${result.page_limit} страниц. Результат не описывает весь сайт.` : `The ${result.page_limit}-page limit was reached. The result does not describe the entire site.`}</p>}
      {(result.duplicate_titles.length > 0 || result.duplicate_descriptions.length > 0 || result.orphan_urls.length > 0) && (
        <div className="wd-crawl-findings">
          {result.duplicate_titles.length > 0 && <div><strong>{ru ? "Повторяющиеся title" : "Duplicate titles"}</strong><p>{formatGroupCount(result.duplicate_titles.length, locale)}</p></div>}
          {result.duplicate_descriptions.length > 0 && <div><strong>{ru ? "Повторяющиеся description" : "Duplicate descriptions"}</strong><p>{formatGroupCount(result.duplicate_descriptions.length, locale)}</p></div>}
          {result.orphan_urls.length > 0 && <div><strong>{ru ? "Кандидаты без внутренних ссылок" : "Unlinked candidates"}</strong><p>{ru ? `${result.orphan_urls.length} URL из sitemap` : `${result.orphan_urls.length} sitemap URLs`}</p></div>}
        </div>
      )}
    </div>
  );
}

function formatGroupCount(count: number, locale: Locale): string {
  if (locale === "en") return `${count} ${count === 1 ? "group" : "groups"}`;
  const mod10 = count % 10;
  const mod100 = count % 100;
  const noun = mod10 === 1 && mod100 !== 11
    ? "группа"
    : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
      ? "группы"
      : "групп";
  return `${count} ${noun}`;
}
