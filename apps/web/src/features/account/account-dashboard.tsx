"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, FolderKanban, TrendingUp } from "lucide-react";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import type { AccountSessionResponse } from "./account-contract";
import {
  accountNextActionHref,
  formatAccountDate,
  formatMonitorStatus,
} from "./account-dashboard-contract";
import { accountErrorMessage } from "./account-messages";
import { announceAccountAuthenticationLost } from "./account-authentication-state";
import {
  deriveAccountNextActions,
  type AccountOverviewProject,
  type AccountOverviewResponse,
} from "./account-overview-contract";
import {
  createAccountProject,
  listArchivedAccountProjects,
  restoreAccountProject,
} from "./account-workspace-client";
import type { AccountProject, ArchivedAccountProject } from "./account-workspace-contract";
import { projectPath, reportsPath, savedAuditIssuesPath, toolsPath } from "../../lib/routes";
import { HomeUrlCheckForm } from "../home/home-url-check-form";

interface AccountDashboardProps {
  readonly locale: Locale;
  readonly session: AccountSessionResponse;
  readonly projects: readonly AccountProject[];
  readonly overview: AccountOverviewResponse | null;
  readonly onProjectCreated: (project: AccountProject) => void;
  readonly onProjectRestored: () => void;
}

export function AccountDashboard({
  locale,
  session,
  projects,
  overview,
  onProjectCreated,
  onProjectRestored,
}: AccountDashboardProps) {
  const ru = locale === "ru";
  const [error, setError] = useState("");
  const [createPending, setCreatePending] = useState(false);
  const [name, setName] = useState("");
  const [origin, setOrigin] = useState("");
  const [archivedProjects, setArchivedProjects] = useState<readonly ArchivedAccountProject[]>([]);
  const [archiveState, setArchiveState] = useState<"idle" | "loading" | "ready" | "failed">("idle");
  const [restorePendingId, setRestorePendingId] = useState<string | null>(null);
  const createDetailsRef = useRef<HTMLDetailsElement>(null);

  function openProjectCreation() {
    const details = createDetailsRef.current;
    if (!details) return;
    details.open = true;
    details.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatePending(true);
    setError("");
    try {
      const project = await createAccountProject({ name, origin });
      onProjectCreated(project);
      setName("");
      setOrigin("");
    } catch (caught) {
      if (announceAccountAuthenticationLost(caught)) return;
      setError(accountErrorMessage(locale, caught));
    } finally {
      setCreatePending(false);
    }
  }

  async function loadArchivedProjects() {
    if (archiveState === "loading" || archiveState === "ready") return;
    setArchiveState("loading");
    setError("");
    try {
      const response = await listArchivedAccountProjects();
      setArchivedProjects(response.projects);
      setArchiveState("ready");
    } catch (caught) {
      if (announceAccountAuthenticationLost(caught)) return;
      setError(accountErrorMessage(locale, caught));
      setArchiveState("failed");
    }
  }

  async function restoreProject(projectId: string) {
    setRestorePendingId(projectId);
    setError("");
    try {
      await restoreAccountProject(projectId);
      setArchivedProjects((current) => current.filter((item) => item.id !== projectId));
      onProjectRestored();
    } catch (caught) {
      if (announceAccountAuthenticationLost(caught)) return;
      setError(accountErrorMessage(locale, caught));
    } finally {
      setRestorePendingId(null);
    }
  }

  function projectArchivePanel() {
    return (
      <section className="wd-project-archive-list" aria-labelledby="project-archive-title">
        <div className="wd-project-list-head">
          <div><span className="eyebrow">{ru ? "Архив" : "Archive"}</span><h2 id="project-archive-title">{ru ? "Архивированные проекты" : "Archived projects"}</h2></div>
          {archiveState === "ready" && <strong>{archivedProjects.length}</strong>}
        </div>
        {archiveState === "idle" || archiveState === "failed" ? <button className="wd-button wd-button-secondary" type="button" onClick={loadArchivedProjects}>{ru ? "Открыть архив" : "Open archive"}</button> : archiveState === "loading" ? <p aria-live="polite">{ru ? "Загружаем архив…" : "Loading archive…"}</p> : archivedProjects.length === 0 ? <p>{ru ? "Архивированных проектов нет." : "There are no archived projects."}</p> : (
          <div className="wd-project-archive-items">
            {archivedProjects.map((project) => (
              <article key={project.id}>
                <div><strong>{project.name}</strong><p>{project.origin}</p><small>{ru ? "В архиве с" : "Archived"}: {formatAccountDate(project.archived_at, locale)}</small></div>
                <button className="wd-button wd-button-secondary" type="button" onClick={() => restoreProject(project.id)} disabled={restorePendingId !== null} aria-busy={restorePendingId === project.id}>{restorePendingId === project.id ? (ru ? "Восстанавливаем…" : "Restoring…") : (ru ? "Восстановить" : "Restore")}</button>
              </article>
            ))}
          </div>
        )}
      </section>
    );
  }

  function projectCreatePanel(primary: boolean) {
    return (
      <section
        id={primary ? "project-create" : undefined}
        className={primary ? "wd-project-create is-primary" : "wd-project-create"}
        aria-labelledby={primary ? "project-create-title" : "project-create-title-secondary"}
      >
        <div>
          <span className="eyebrow">{ru ? "Новый проект" : "New project"}</span>
          <h2 id={primary ? "project-create-title" : "project-create-title-secondary"}>
            {ru ? "Добавьте сайт в WebDiag" : "Add a website to WebDiag"}
          </h2>
          <p>
            {ru
              ? "Укажите название проекта и адрес сайта. Этот домен будет использоваться для аудитов, отчётов и мониторинга."
              : "Enter a project name and website address. This domain will be used for audits, reports and monitoring."}
          </p>
        </div>
        <form className="wd-project-create-form" onSubmit={createProject} aria-busy={createPending}>
          <label>
            {ru ? "Название проекта" : "Project name"}
            <input
              value={name}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
              minLength={2}
              maxLength={80}
              required
              disabled={createPending}
              autoComplete="off"
            />
          </label>
          <label>
            {ru ? "Адрес сайта" : "Website address"}
            <input
              value={origin}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setOrigin(event.target.value)}
              placeholder="example.com"
              required
              disabled={createPending}
              inputMode="url"
              autoComplete="url"
            />
          </label>
          <button className="wd-button wd-button-primary" type="submit" disabled={createPending}>
            {createPending
              ? (ru ? "Добавляем…" : "Adding…")
              : (ru ? "Добавить проект" : "Add project")}
          </button>
        </form>
      </section>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="wd-account-overview is-first-use">
        <header className="wd-account-dashboard-head">
          <div>
            <span className="eyebrow">{ru ? "Личный кабинет" : "Account"}</span>
            <h1>{ru ? "Добавьте первый сайт" : "Add your first website"}</h1>
            <p>
              {ru
                ? `${session.user.display_name}, создайте проект, чтобы запускать проверки и сохранять результаты.`
                : `${session.user.display_name}, create a project to run checks and keep the results.`}
            </p>
          </div>
        </header>
        {error && <p className="wd-account-error" role="alert">{error}</p>}
        {projectCreatePanel(true)}
        {projectArchivePanel()}
      </div>
    );
  }

  const overviewProjects = overview?.projects ?? [];
  const latestAudits = overviewProjects
    .map((item) => item.latest_audit)
    .filter((audit): audit is NonNullable<AccountOverviewProject["latest_audit"]> => audit !== null);
  const scoreValues = latestAudits
    .map((audit) => audit.score)
    .filter((score): score is number => typeof score === "number");
  const averageScore = scoreValues.length
    ? Math.round(scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length)
    : null;
  const issueTotal = latestAudits.reduce((sum, audit) => sum + audit.issue_count, 0);
  const checkTotal = latestAudits.reduce((sum, audit) => sum + audit.check_count, 0);
  const actions = overview ? deriveAccountNextActions(overview, locale) : [];
  const recentProjects = [...overviewProjects]
    .filter((item) => item.latest_audit !== null)
    .sort((a, b) => {
      const left = a.latest_audit ? Date.parse(a.latest_audit.completed_at) : 0;
      const right = b.latest_audit ? Date.parse(b.latest_audit.completed_at) : 0;
      return right - left;
    })
    .slice(0, 5);
  const trendAudits = [...latestAudits]
    .sort((left, right) => Date.parse(left.completed_at) - Date.parse(right.completed_at))
    .slice(-8);
  const trendSource = trendAudits.map((audit) => audit.score).filter((score): score is number => typeof score === "number");
  const drawableTrend = trendSource.length === 1 ? [trendSource[0]!, trendSource[0]!] : trendSource;
  const trendPoints = drawableTrend
    .map((score, index) => {
      const x = drawableTrend.length === 1 ? 0 : (index * 100) / (drawableTrend.length - 1);
      const y = 96 - score * 0.82;
      return [x, y].join(",");
    })
    .join(" ");
  const minScore = scoreValues.length ? Math.min(...scoreValues) : null;
  const maxScore = scoreValues.length ? Math.max(...scoreValues) : null;
  const chartDateFormatter = new Intl.DateTimeFormat(ru ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "short",
  });
  const firstTrendDate = trendAudits[0]?.completed_at
    ? chartDateFormatter.format(new Date(trendAudits[0].completed_at))
    : null;
  const lastTrendDate = trendAudits.at(-1)?.completed_at
    ? chartDateFormatter.format(new Date(trendAudits.at(-1)!.completed_at))
    : null;
  const priorityProjects = [...overviewProjects]
    .filter((item) => item.latest_audit !== null)
    .sort((a, b) => (b.latest_audit?.issue_count ?? 0) - (a.latest_audit?.issue_count ?? 0))
    .slice(0, 4);
  const highestPriority = priorityProjects[0] ?? null;

  return (
    <div className="wd-account-overview wd-dashboard-render">
      <header className="wd-dashboard-welcome">
        <div className="wd-dashboard-welcome-copy">
          <h1>{ru ? "Добро пожаловать!" : "Welcome!"}</h1>
          <p>{ru
            ? "Здесь вы можете отслеживать состояние своих проектов, проводить проверки и улучшать SEO-показатели."
            : "Track your projects, run checks and improve SEO performance from one workspace."}</p>
        </div>
        <div className="wd-dashboard-quick-check">
          <div className="wd-dashboard-quick-check-copy">
            <strong>{ru ? "Проверьте новый сайт" : "Check a new website"}</strong>
            <p>{ru
              ? "Введите URL и получите полный SEO-аудит за несколько минут."
              : "Enter a URL and get a complete SEO audit in a few minutes."}</p>
          </div>
          <img src="/design/icons/seo-audit.webp" alt="" width="160" height="160" loading="lazy" decoding="async" />
          <HomeUrlCheckForm locale={locale} instance="final" />
        </div>
      </header>

      {error && <p className="wd-account-error" role="alert">{error}</p>}

      <section className="wd-dashboard-kpis" aria-label={ru ? "Сводка кабинета" : "Workspace summary"}>
        <article className="is-health">
          <span className="wd-dashboard-kpi-visual wd-dashboard-kpi-score" aria-hidden="true">
            <b>{averageScore ?? "—"}</b>
          </span>
          <span className="wd-dashboard-kpi-copy">
            <span className="wd-dashboard-kpi-label">{ru ? "SEO-здоровье" : "SEO health"}</span>
            <strong className="wd-dashboard-kpi-badge" data-tone={averageScore !== null && averageScore >= 80 ? "good" : "attention"}>
              {averageScore === null ? (ru ? "Нет данных" : "No data") : averageScore >= 80 ? (ru ? "Хорошо" : "Good") : (ru ? "Есть задачи" : "Needs work")}
            </strong>
            <small>{ru ? "Средняя по последним аудитам" : "Average of latest audits"}</small>
          </span>
        </article>
        <article>
          <span className="wd-dashboard-kpi-visual" aria-hidden="true"><FolderKanban /></span>
          <span className="wd-dashboard-kpi-copy">
            <span className="wd-dashboard-kpi-label">{ru ? "Всего проектов" : "Total projects"}</span>
            <strong>{projects.length}</strong>
            <small>{ru ? `${latestAudits.length} с завершённым аудитом` : `${latestAudits.length} with a completed audit`}</small>
          </span>
        </article>
        <article className="is-danger">
          <span className="wd-dashboard-kpi-visual" aria-hidden="true"><AlertTriangle /></span>
          <span className="wd-dashboard-kpi-copy">
            <span className="wd-dashboard-kpi-label">{ru ? "Найдено проблем" : "Issues found"}</span>
            <strong>{issueTotal}</strong>
            <small>{ru ? "В последних аудитах проектов" : "Across latest project audits"}</small>
          </span>
        </article>
        <article>
          <span className="wd-dashboard-kpi-visual" aria-hidden="true"><CheckCircle2 /></span>
          <span className="wd-dashboard-kpi-copy">
            <span className="wd-dashboard-kpi-label">{ru ? "Выполнено проверок" : "Checks completed"}</span>
            <strong>{checkTotal}</strong>
            <small>{ru ? "Сумма проверок последних аудитов" : "Checks in latest audits"}</small>
          </span>
        </article>
      </section>

      <section className="wd-dashboard-main-grid">
        <article className="wd-dashboard-panel wd-dashboard-health-chart">
          <header>
            <div><h2>{ru ? "Динамика SEO-здоровья" : "SEO health trend"}</h2></div>
            <span className="wd-dashboard-chart-scope">{ru ? "Последние аудиты" : "Latest audits"}</span>
          </header>
          <div className="wd-dashboard-chart">
            <div className="wd-dashboard-chart-y" aria-hidden="true">
              <span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
            </div>
            {trendPoints ? (
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={ru ? "Оценки последних аудитов проектов" : "Latest project audit scores"}>
                <defs>
                  <linearGradient id="wd-dashboard-chart-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity=".24" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polyline className="wd-dashboard-chart-area" points={"0,100 " + trendPoints + " 100,100"} />
                <polyline className="wd-dashboard-chart-line" points={trendPoints} />
              </svg>
            ) : (
              <p className="wd-dashboard-chart-empty">{ru ? "Запустите аудит, чтобы увидеть оценки." : "Run an audit to see scores."}</p>
            )}
            {(firstTrendDate || lastTrendDate) && (
              <div className="wd-dashboard-chart-x" aria-hidden="true">
                <span>{firstTrendDate}</span>
                <span>{lastTrendDate}</span>
              </div>
            )}
          </div>
          <div className="wd-dashboard-chart-summary">
            <div><strong>{averageScore ?? "—"}</strong><span>{ru ? "Средняя оценка" : "Average"}</span></div>
            <div><strong>{minScore ?? "—"}</strong><span>{ru ? "Минимум" : "Minimum"}</span></div>
            <div><strong>{maxScore ?? "—"}</strong><span>{ru ? "Максимум" : "Maximum"}</span></div>
            <div className="wd-dashboard-chart-insight">
              <TrendingUp aria-hidden="true" />
              <span><strong>{issueTotal}</strong>{ru ? " проблем в последних аудитах" : " issues in latest audits"}</span>
            </div>
          </div>
        </article>

        <article className="wd-dashboard-panel wd-dashboard-priorities">
          <header>
            <div><h2>{ru ? "Проблемы и приоритеты" : "Issues and priorities"}</h2></div>
            {highestPriority?.latest_audit && (
              <Link className="wd-dashboard-panel-link" href={savedAuditIssuesPath(locale, highestPriority.project.id, highestPriority.latest_audit.id)}>
                {ru ? "Все проблемы" : "All issues"} <span aria-hidden="true">→</span>
              </Link>
            )}
          </header>
          {priorityProjects.length ? (
            <>
              <div className="wd-dashboard-priority-list">
                {priorityProjects.map((item) => {
                  const count = item.latest_audit?.issue_count ?? 0;
                  const tone = count >= 20 ? "high" : count >= 5 ? "medium" : "low";
                  return (
                    <Link href={projectPath(locale, item.project.id)} key={item.project.id}>
                      <span className={"wd-dashboard-priority-icon tone-" + tone} aria-hidden="true"><AlertTriangle /></span>
                      <span><strong>{item.project.name}</strong><small>{ru ? `${count} проблем в последнем аудите` : `${count} issues in latest audit`}</small></span>
                      <b data-tone={tone}>{count}</b>
                    </Link>
                  );
                })}
              </div>
              {highestPriority?.latest_audit && (
                <Link className="wd-dashboard-priority-cta" href={savedAuditIssuesPath(locale, highestPriority.project.id, highestPriority.latest_audit.id)}>
                  <span><AlertTriangle aria-hidden="true" /></span>
                  <span><strong>{ru ? "Разобрать проблемы проекта" : "Review project issues"}</strong><small>{highestPriority.project.name}</small></span>
                  <b aria-hidden="true">→</b>
                </Link>
              )}
            </>
          ) : <p>{ru ? "Нет завершённых аудитов с данными о проблемах." : "No completed audits with issue data yet."}</p>}
        </article>
      </section>

      <section className="wd-dashboard-main-grid wd-dashboard-lists-grid">
        <article className="wd-dashboard-panel wd-dashboard-checks-panel">
          <header>
            <div><h2>{ru ? "Последние проверки" : "Recent checks"}</h2></div>
            {overviewProjects[0] && (
              <Link className="wd-dashboard-panel-link" href={`${projectPath(locale, overviewProjects[0].project.id)}#audit-history`}>
                {ru ? "Все проверки" : "All checks"} <span aria-hidden="true">→</span>
              </Link>
            )}
          </header>
          {recentProjects.length ? (
            <div className="wd-dashboard-check-table">
              <div className="wd-dashboard-check-table-head" aria-hidden="true">
                <span>{ru ? "Сайт" : "Site"}</span>
                <span>{ru ? "Тип проверки" : "Check type"}</span>
                <span>{ru ? "Дата" : "Date"}</span>
                <span>{ru ? "Статус" : "Status"}</span>
                <span>{ru ? "Оценка" : "Score"}</span>
              </div>
              <div className="wd-dashboard-check-list">
                {recentProjects.map((item) => (
                  <Link href={projectPath(locale, item.project.id)} key={item.project.id}>
                    <span className="wd-dashboard-check-site">
                      <span className="wd-dashboard-site-mark" aria-hidden="true">W</span>
                      <span><strong>{item.project.name}</strong><small>{item.project.origin.replace(/^https?:\/\//u, "")}</small></span>
                    </span>
                    <span className="wd-dashboard-check-type">{ru ? "Полный SEO-аудит" : "Full SEO audit"}</span>
                    <span className="wd-dashboard-check-date">{item.latest_audit ? formatAccountDate(item.latest_audit.completed_at, locale) : "—"}</span>
                    <span className="wd-dashboard-check-status">{ru ? "Завершена" : "Completed"}</span>
                    <span className="wd-dashboard-score-pill" data-tone={(item.latest_audit?.score ?? 0) >= 80 ? "good" : (item.latest_audit?.score ?? 0) >= 60 ? "warn" : "bad"}>
                      {item.latest_audit?.score ?? "—"}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : <p>{ru ? "Проверок пока нет." : "No checks yet."}</p>}
        </article>

        <article id="projects" className="wd-dashboard-panel wd-dashboard-projects-panel">
          <header>
            <div><h2>{ru ? "Мои проекты" : "My projects"}</h2></div>
            <button className="wd-dashboard-text-button" type="button" onClick={openProjectCreation}>{ru ? "Добавить" : "Add"}</button>
          </header>
          <div className="wd-dashboard-project-list">
            {overviewProjects.slice(0, 5).map((item) => (
              <Link href={projectPath(locale, item.project.id)} key={item.project.id}>
                <span className="wd-dashboard-project-icon" aria-hidden="true">W</span>
                <span className="wd-dashboard-project-copy">
                  <h3>{item.project.name}</h3>
                  <small>{item.project.origin.replace(/^https?:\/\//u, "")}</small>
                  <span className="wd-dashboard-project-meta">
                    <b>{item.latest_audit ? (ru ? `Проблемы: ${item.latest_audit.issue_count}` : `Issues: ${item.latest_audit.issue_count}`) : (ru ? "Без аудита" : "No audit")}</b>
                    <em>{item.monitor ? formatMonitorStatus(item.monitor.status, locale) : (ru ? "Без мониторинга" : "No monitoring")}</em>
                  </span>
                </span>
                <span className="wd-dashboard-score-pill" data-tone={(item.latest_audit?.score ?? 0) >= 80 ? "good" : (item.latest_audit?.score ?? 0) >= 60 ? "warn" : "bad"}>
                  {item.latest_audit?.score ?? "—"}
                </span>
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section id="tasks" className="wd-dashboard-main-grid wd-dashboard-bottom-grid">
        <article className="wd-dashboard-panel wd-dashboard-tasks-panel">
          <header>
            <div><h2>{ru ? "Мои задачи и рекомендации" : "Tasks and recommendations"}</h2></div>
            <span className="wd-dashboard-task-count">{actions.length}</span>
          </header>
          <div className="wd-dashboard-task-tabs" aria-hidden="true">
            <span className="is-active">{ru ? "Все" : "All"} <b>{actions.length}</b></span>
          </div>
          {actions.length ? (
            <div className="wd-dashboard-task-list">
              {actions.map((action) => (
                <Link key={action.kind + ":" + (action.projectId ?? "account")} href={accountNextActionHref(locale, action, overview!)}>
                  <span className="wd-dashboard-task-check" aria-hidden="true" />
                  <span className="wd-dashboard-task-dot" aria-hidden="true" />
                  <span><strong>{action.label}</strong><small>{action.projectName ?? (ru ? "Все проекты" : "All projects")}</small></span>
                  <span className="wd-dashboard-task-arrow" aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          ) : <p>{ru ? "Срочных задач нет." : "No urgent tasks."}</p>}
        </article>

        <article className="wd-dashboard-panel wd-dashboard-quick-actions">
          <header><div><h2>{ru ? "Быстрые действия" : "Quick actions"}</h2></div></header>
          <div>
            <Link href={toolsPath(locale)}><img src="/design/icons/seo-audit.webp" alt="" width="72" height="72" /><span>{ru ? "Запустить проверку" : "Run a check"}</span></Link>
            <Link href={`${toolsPath(locale)}/robots-txt-tester`}><img src="/design/icons/robots.webp" alt="" width="72" height="72" /><span>{ru ? "Проверить robots.txt" : "Check robots.txt"}</span></Link>
            <Link href={`${toolsPath(locale)}/sitemap-validator`}><img src="/design/icons/sitemap.webp" alt="" width="72" height="72" /><span>{ru ? "Проверить sitemap.xml" : "Check sitemap.xml"}</span></Link>
            <Link href={`${toolsPath(locale)}/core-web-vitals-checker`}><img src="/design/icons/performance.webp" alt="" width="72" height="72" /><span>{ru ? "Анализ скорости" : "Analyze performance"}</span></Link>
            <Link href={`${toolsPath(locale)}/redirect-chain-checker`}><img src="/design/icons/analytics.webp" alt="" width="72" height="72" /><span>{ru ? "Проверка редиректов" : "Check redirects"}</span></Link>
            <Link href={`${toolsPath(locale)}/image-seo-audit`}><img src="/design/icons/images.webp" alt="" width="72" height="72" /><span>{ru ? "Проверка изображений" : "Check images"}</span></Link>
            <Link href={reportsPath(locale)}><img src="/design/icons/issues.webp" alt="" width="72" height="72" /><span>{ru ? "Создать отчёт" : "Create report"}</span></Link>
            <button type="button" onClick={openProjectCreation}><img src="/design/icons/analytics.webp" alt="" width="72" height="72" /><span>{ru ? "Добавить проект" : "Add project"}</span></button>
          </div>
        </article>
      </section>

      <details ref={createDetailsRef} id="project-create" className="wd-operation-add-project wd-dashboard-management">
        <summary>{ru ? "Добавить сайт или управлять проектами" : "Add or manage projects"}</summary>
        {projectCreatePanel(false)}
        {projectArchivePanel()}
      </details>
    </div>
  );
}
