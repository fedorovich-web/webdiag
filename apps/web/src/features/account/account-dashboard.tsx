"use client";

import Link from "next/link";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import type { AccountSessionResponse } from "./account-contract";
import {
  accountNextActionHref,
  accountOverviewMetrics,
  formatAccountDate,
  formatMonitorStatus,
  formatNullableScore,
} from "./account-dashboard-contract";
import { accountErrorMessage } from "./account-messages";
import {
  deriveAccountNextActions,
  type AccountOverviewProject,
  type AccountOverviewResponse,
} from "./account-overview-contract";
import { createAccountProject } from "./account-workspace-client";
import type { AccountProject } from "./account-workspace-contract";
import { projectPath } from "../../lib/routes";

interface AccountDashboardProps {
  readonly locale: Locale;
  readonly session: AccountSessionResponse;
  readonly projects: readonly AccountProject[];
  readonly overview: AccountOverviewResponse | null;
  readonly onProjectCreated: (project: AccountProject) => void;
}

export function AccountDashboard({
  locale,
  session,
  projects,
  overview,
  onProjectCreated,
}: AccountDashboardProps) {
  const ru = locale === "ru";
  const [error, setError] = useState("");
  const [createPending, setCreatePending] = useState(false);
  const [name, setName] = useState("");
  const [origin, setOrigin] = useState("");
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
      setError(accountErrorMessage(locale, caught));
    } finally {
      setCreatePending(false);
    }
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
            {ru ? "Добавьте сайт для первой проверки" : "Add a site for the first check"}
          </h2>
          <p>
            {ru
              ? "Укажите название и публичный домен. WebDiag сохранит канонический адрес проекта."
              : "Enter a name and public domain. WebDiag will store the canonical project origin."}
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
            {ru ? "Домен" : "Domain"}
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
              ? (ru ? "Создаём…" : "Creating…")
              : (ru ? "Создать проект" : "Create project")}
          </button>
        </form>
      </section>
    );
  }

  function projectCard(item: AccountOverviewProject) {
    const audit = item.latest_audit;
    const monitor = item.monitor;
    const monitorTone = monitor?.status === "failed"
      ? "danger"
      : monitor?.status === "changed"
        ? "warning"
        : "neutral";
    return (
      <article key={item.project.id} className="wd-operation-project-card">
        <header>
          <div>
            <h3><Link href={projectPath(locale, item.project.id)}>{item.project.name}</Link></h3>
            <p>{item.project.origin}</p>
          </div>
          {monitor && (
            <span className="wd-operation-status" data-tone={monitorTone}>
              {formatMonitorStatus(monitor.status, locale)}
            </span>
          )}
        </header>
        <dl>
          <div>
            <dt>{ru ? "Последний аудит" : "Latest audit"}</dt>
            <dd>{audit ? formatAccountDate(audit.completed_at, locale) : (ru ? "Не запускался" : "Not run")}</dd>
          </div>
          <div>
            <dt>{ru ? "Оценка" : "Score"}</dt>
            <dd>{audit ? formatNullableScore(audit.score, locale) : "—"}</dd>
          </div>
          <div>
            <dt>{ru ? "Проблемы" : "Issues"}</dt>
            <dd>{audit ? audit.issue_count : "—"}</dd>
          </div>
          <div>
            <dt>{ru ? "Отчёты" : "Reports"}</dt>
            <dd>{item.report_count}</dd>
          </div>
        </dl>
        <div className="wd-operation-project-footer">
          <span>
            {monitor?.next_run_at
              ? `${ru ? "Следующая проверка" : "Next check"}: ${formatAccountDate(monitor.next_run_at, locale)}`
              : (ru ? "Расписание не настроено" : "No schedule configured")}
          </span>
          <Link className="wd-button wd-button-secondary" href={projectPath(locale, item.project.id)}>
            {ru ? "Открыть проект" : "Open project"}
          </Link>
        </div>
      </article>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="wd-account-overview is-first-use">
        <header className="wd-account-dashboard-head">
          <div>
            <span className="eyebrow">WebDiag Workspace</span>
            <h1>{ru ? "Создайте первый проект" : "Create your first project"}</h1>
            <p>
              {ru
                ? `${session.user.display_name}, начните с сайта, который нужно проверить.`
                : `${session.user.display_name}, start with the site you need to check.`}
            </p>
          </div>
        </header>
        {error && <p className="wd-account-error" role="alert">{error}</p>}
        {projectCreatePanel(true)}
      </div>
    );
  }

  const metrics = overview ? accountOverviewMetrics(overview) : null;
  const actions = overview ? deriveAccountNextActions(overview, locale) : [];

  return (
    <div className="wd-account-overview">
      <header className="wd-account-dashboard-head wd-operation-heading">
        <div>
          <span className="eyebrow">WebDiag Workspace</span>
          <h1>{ru ? "Обзор" : "Overview"}</h1>
          <p>
            {ru
              ? `${session.user.display_name}, здесь собраны сохранённые результаты и следующие действия.`
              : `${session.user.display_name}, your saved results and next actions are collected here.`}
          </p>
        </div>
        <button className="wd-button wd-button-primary" type="button" onClick={openProjectCreation}>
          {ru ? "Добавить проект" : "Add project"}
        </button>
      </header>

      {error && <p className="wd-account-error" role="alert">{error}</p>}

      {metrics && (
        <section className="wd-operation-metrics" aria-label={ru ? "Сводка аккаунта" : "Account summary"}>
          <article><strong>{metrics.projectCount}</strong><span>{ru ? "Проекты" : "Projects"}</span></article>
          <article><strong>{metrics.projectsWithAudit}</strong><span>{ru ? "С аудитами" : "With audits"}</span></article>
          <article><strong>{metrics.projectsRequiringAttention}</strong><span>{ru ? "Требуют внимания" : "Need attention"}</span></article>
          <article><strong>{metrics.readyReportCount}</strong><span>{ru ? "Готовые отчёты" : "Ready reports"}</span></article>
        </section>
      )}

      {overview && actions.length > 0 && (
        <section className="wd-operation-actions" aria-labelledby="account-next-actions-title">
          <div>
            <span className="eyebrow">{ru ? "Приоритет" : "Priority"}</span>
            <h2 id="account-next-actions-title">{ru ? "Что сделать дальше" : "What to do next"}</h2>
          </div>
          <div className="wd-operation-action-list">
            {actions.map((action) => (
              <Link
                key={`${action.kind}:${action.projectId ?? "account"}`}
                href={accountNextActionHref(locale, action, overview)}
              >
                <span>{action.projectName ?? (ru ? "Рабочая область" : "Workspace")}</span>
                <strong>{action.label}</strong>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section id="projects" className="wd-operation-projects" aria-labelledby="project-list-title">
        <div className="wd-project-list-head">
          <div>
            <span className="eyebrow">{ru ? "Рабочая область" : "Workspace"}</span>
            <h2 id="project-list-title">{ru ? "Все проекты" : "All projects"}</h2>
          </div>
          <strong>{projects.length}</strong>
        </div>
        {overview ? (
          <div className="wd-operation-project-list">{overview.projects.map(projectCard)}</div>
        ) : (
          <div className="wd-operation-project-list">
            {projects.map((project) => (
              <article key={project.id} className="wd-operation-project-card">
                <header><div><h3><Link href={projectPath(locale, project.id)}>{project.name}</Link></h3><p>{project.origin}</p></div></header>
                <div className="wd-operation-project-footer">
                  <span>{ru ? "Сводка временно недоступна" : "Summary temporarily unavailable"}</span>
                  <Link className="wd-button wd-button-secondary" href={projectPath(locale, project.id)}>{ru ? "Открыть проект" : "Open project"}</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <details ref={createDetailsRef} id="project-create" className="wd-operation-add-project">
        <summary>{ru ? "Добавить ещё один проект" : "Add another project"}</summary>
        {projectCreatePanel(false)}
      </details>
    </div>
  );
}
