"use client";

import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import type { AccountSessionResponse } from "./account-contract";
import { accountErrorMessage } from "./account-messages";
import { createAccountProject } from "./account-workspace-client";
import type { AccountProject } from "./account-workspace-contract";
import { recentAccountProjects } from "./account-workspace-shell-contract";
import { projectPath } from "../../lib/routes";

interface AccountDashboardProps {
  readonly locale: Locale;
  readonly session: AccountSessionResponse;
  readonly projects: readonly AccountProject[];
  readonly onProjectCreated: (project: AccountProject) => void;
}

export function AccountDashboard({
  locale,
  session,
  projects,
  onProjectCreated,
}: AccountDashboardProps) {
  const ru = locale === "ru";
  const [error, setError] = useState("");
  const [createPending, setCreatePending] = useState(false);
  const [name, setName] = useState("");
  const [origin, setOrigin] = useState("");
  const recent = recentAccountProjects(projects, 3);

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

  return (
    <div className="wd-account-overview">
      <header className="wd-account-dashboard-head">
        <div>
          <span className="eyebrow">WebDiag Account</span>
          <h1>{ru ? `Обзор аккаунта ${session.user.display_name}` : `${session.user.display_name}'s account overview`}</h1>
          <p>{ru ? "Проекты и сохранённые аудиты без фиктивных показателей." : "Projects and saved audits without synthetic metrics."}</p>
        </div>
        <div className="wd-workspace-real-metric" aria-label={ru ? "Количество проектов" : "Project count"}>
          <strong>{projects.length}</strong>
          <span>{ru ? "проектов" : "projects"}</span>
        </div>
      </header>

      {error && <p className="wd-account-error" role="alert">{error}</p>}

      <section className="wd-project-create" aria-labelledby="project-create-title">
        <div>
          <span className="eyebrow">{ru ? "Новый проект" : "New project"}</span>
          <h2 id="project-create-title">{ru ? "Добавьте сайт для аудитов" : "Add a site for audits"}</h2>
          <p>{ru ? "Сохраняется только нормализованный публичный origin. Произвольные пути и приватные адреса отклоняются." : "Only a normalized public origin is stored. Paths and private addresses are rejected."}</p>
        </div>
        <form className="wd-project-create-form" onSubmit={createProject} aria-busy={createPending}>
          <label>{ru ? "Название проекта" : "Project name"}<input value={name} onChange={(event: ChangeEvent<HTMLInputElement>) => setName(event.target.value)} minLength={2} maxLength={80} required disabled={createPending} autoComplete="off" /></label>
          <label>{ru ? "Домен или origin" : "Domain or origin"}<input value={origin} onChange={(event: ChangeEvent<HTMLInputElement>) => setOrigin(event.target.value)} placeholder="example.com" required disabled={createPending} inputMode="url" autoComplete="url" /></label>
          <button className="wd-button wd-button-primary" type="submit" disabled={createPending}>{createPending ? (ru ? "Создаём…" : "Creating…") : (ru ? "Создать проект" : "Create project")}</button>
        </form>
      </section>

      {recent.length > 0 && (
        <section className="wd-workspace-recent" aria-labelledby="recent-projects-title">
          <div className="wd-project-list-head">
            <div><span className="eyebrow">{ru ? "Недавние" : "Recent"}</span><h2 id="recent-projects-title">{ru ? "Недавно обновлённые проекты" : "Recently updated projects"}</h2></div>
          </div>
          <div className="wd-project-grid">
            {recent.map((project) => (
              <article key={project.id} className="wd-project-card">
                <h3>{project.name}</h3>
                <p>{project.origin}</p>
                <Link className="wd-button wd-button-secondary" href={projectPath(locale, project.id)}>{ru ? "Открыть проект" : "Open project"}</Link>
              </article>
            ))}
          </div>
        </section>
      )}

      <section id="projects" className="wd-project-list" aria-labelledby="project-list-title">
        <div className="wd-project-list-head">
          <div><span className="eyebrow">{ru ? "Рабочая область" : "Workspace"}</span><h2 id="project-list-title">{ru ? "Все проекты" : "All projects"}</h2></div>
          <strong>{projects.length}</strong>
        </div>
        {projects.length === 0 ? (
          <div className="wd-account-empty"><p>{ru ? "Проектов пока нет. Создайте первый проект выше." : "No projects yet. Create the first project above."}</p></div>
        ) : (
          <div className="wd-project-grid">
            {projects.map((project) => (
              <article key={project.id} className="wd-project-card">
                <h3>{project.name}</h3>
                <p>{project.origin}</p>
                <Link className="wd-button wd-button-secondary" href={projectPath(locale, project.id)}>{ru ? "Открыть проект" : "Open project"}</Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
