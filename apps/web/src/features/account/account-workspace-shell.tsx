"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import type { Locale } from "@webdiag/tool-registry";
import { AccountDashboard } from "./account-dashboard";
import { AccountClientError, getAccountSession, logoutAccount } from "./account-client";
import type { AccountSessionResponse } from "./account-contract";
import { accountErrorMessage } from "./account-messages";
import { getAccountOverview } from "./account-overview-client";
import type { AccountOverviewResponse } from "./account-overview-contract";
import { listAccountProjects } from "./account-workspace-client";
import type { AccountProject } from "./account-workspace-contract";
import {
  buildAccountWorkspaceNavigation,
  projectLandingAfterSwitch,
  resolveActiveAccountProject,
  type AccountWorkspaceSection,
} from "./account-workspace-shell-contract";
import { loginPath } from "../../lib/routes";

interface AccountWorkspaceShellProps {
  readonly locale: Locale;
  readonly section: AccountWorkspaceSection;
  readonly currentProjectId?: string;
  readonly children?: ReactNode;
}

interface WorkspaceNavigationProps {
  readonly locale: Locale;
  readonly section: AccountWorkspaceSection;
  readonly projects: readonly AccountProject[];
  readonly currentProjectId?: string;
  readonly latestAuditId?: string;
  readonly onNavigate?: () => void;
}

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "select:not([disabled])",
  "input:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function WorkspaceNavigation({
  locale,
  section,
  projects,
  currentProjectId,
  latestAuditId,
  onNavigate,
}: WorkspaceNavigationProps) {
  const ru = locale === "ru";
  const navigation = buildAccountWorkspaceNavigation(
    locale,
    section,
    currentProjectId,
    latestAuditId,
  );
  const activeProject = resolveActiveAccountProject(projects, currentProjectId);

  function selectProject(projectId: string) {
    if (!projectId) return;
    onNavigate?.();
    window.location.assign(projectLandingAfterSwitch(locale, projectId));
  }

  function items(values: ReturnType<typeof buildAccountWorkspaceNavigation>["portfolio"]) {
    return values.map((item) => item.href ? (
      <Link
        key={item.id}
        href={item.href}
        aria-current={item.active ? "page" : undefined}
        onClick={onNavigate}
      >
        {item.label}
      </Link>
    ) : (
      <span key={item.id} aria-disabled="true">{item.label}</span>
    ));
  }

  return (
    <>
      <nav className="wd-workspace-navigation" aria-label={ru ? "Навигация кабинета" : "Workspace navigation"}>
        <div className="wd-workspace-navigation-group">
          <span>{ru ? "Рабочая область" : "Workspace"}</span>
          {items(navigation.portfolio)}
        </div>
        {navigation.project && (
          <div className="wd-workspace-navigation-group">
            <span>{ru ? "Текущий проект" : "Current project"}</span>
            {items(navigation.project)}
          </div>
        )}
      </nav>

      <div className="wd-workspace-project-switcher">
        <label htmlFor={`workspace-project-${section}`}>
          {ru ? "Текущий проект" : "Current project"}
        </label>
        <select
          id={`workspace-project-${section}`}
          value={activeProject?.id ?? ""}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => selectProject(event.target.value)}
          disabled={projects.length === 0}
        >
          <option value="">{ru ? "Выберите проект" : "Select project"}</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
        {activeProject && <small>{activeProject.origin}</small>}
      </div>
    </>
  );
}

export function AccountWorkspaceShell({
  locale,
  section,
  currentProjectId,
  children,
}: AccountWorkspaceShellProps) {
  const ru = locale === "ru";
  const [session, setSession] = useState<AccountSessionResponse | null>(null);
  const [projects, setProjects] = useState<readonly AccountProject[]>([]);
  const [overview, setOverview] = useState<AccountOverviewResponse | null>(null);
  const [overviewError, setOverviewError] = useState("");
  const [loadedToken, setLoadedToken] = useState<number | null>(null);
  const [loadState, setLoadState] = useState<"ready" | "unauthenticated" | "unavailable">("ready");
  const [reloadToken, setReloadToken] = useState(0);
  const [logoutPending, setLogoutPending] = useState(false);
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerTriggerRef = useRef<HTMLButtonElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const drawerPanelRef = useRef<HTMLElement>(null);
  const loading = loadedToken !== reloadToken;

  useEffect(() => {
    let active = true;
    Promise.allSettled([getAccountSession(), listAccountProjects(), getAccountOverview()])
      .then(([sessionResult, projectResult, overviewResult]) => {
        if (!active) return;
        if (sessionResult.status === "rejected" || projectResult.status === "rejected") {
          const caught = sessionResult.status === "rejected"
            ? sessionResult.reason
            : projectResult.reason;
          setSession(null);
          setProjects([]);
          setOverview(null);
          setOverviewError("");
          setLoadState(
            caught instanceof AccountClientError && caught.status === 401
              ? "unauthenticated"
              : "unavailable",
          );
          setLoadedToken(reloadToken);
          return;
        }
        setSession(sessionResult.value);
        setProjects(projectResult.value.projects);
        setLoadState("ready");
        setError("");
        if (overviewResult.status === "fulfilled") {
          setOverview(overviewResult.value);
          setOverviewError("");
        } else {
          setOverview(null);
          setOverviewError(accountErrorMessage(locale, overviewResult.reason));
        }
        setLoadedToken(reloadToken);
      });
    return () => {
      active = false;
    };
  }, [locale, reloadToken]);

  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => drawerCloseRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

  function closeDrawer(restoreFocus = true) {
    setDrawerOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => drawerTriggerRef.current?.focus());
    }
  }

  function handleDrawerKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDrawer();
      return;
    }
    if (event.key !== "Tab") return;
    const panel = drawerPanelRef.current;
    if (!panel) return;
    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector))
      .filter((element) => !element.hasAttribute("disabled") && element.tabIndex !== -1);
    if (focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function logout() {
    setLogoutPending(true);
    setError("");
    try {
      await logoutAccount();
      window.location.assign(loginPath(locale));
    } catch (caught) {
      setError(accountErrorMessage(locale, caught));
      setLogoutPending(false);
    }
  }

  function addProject(project: AccountProject) {
    setProjects((current) => [project, ...current.filter((item) => item.id !== project.id)]);
    setOverview((current) => current ? {
      ...current,
      projects: [
        {
          project,
          latest_audit: null,
          monitor: null,
          report_count: 0,
          shared_report_count: 0,
          latest_report_created_at: null,
        },
        ...current.projects.filter((item) => item.project.id !== project.id),
      ],
    } : current);
  }

  if (loading) {
    return (
      <main className="shell wd-account-workspace-page">
        <section className="wd-account-card" aria-busy="true">
          <p>{ru ? "Загружаем рабочую область…" : "Loading workspace…"}</p>
        </section>
      </main>
    );
  }

  if (!session) {
    const unavailable = loadState === "unavailable";
    return (
      <main className="shell wd-account-workspace-page">
        <section className="wd-account-card wd-account-empty">
          <h1>{unavailable ? (ru ? "Кабинет временно недоступен" : "Workspace is temporarily unavailable") : (ru ? "Войдите в аккаунт" : "Sign in to your account")}</h1>
          <p>{unavailable ? (ru ? "Не удалось загрузить данные аккаунта и проектов." : "Account and project data could not be loaded.") : (ru ? "Для доступа к проектам требуется действующая сессия." : "An active session is required to access projects.")}</p>
          {unavailable ? (
            <button className="wd-button wd-button-primary" type="button" onClick={() => setReloadToken((value) => value + 1)}>{ru ? "Повторить" : "Retry"}</button>
          ) : (
            <Link className="wd-button wd-button-primary" href={loginPath(locale)}>{ru ? "Войти" : "Sign in"}</Link>
          )}
        </section>
      </main>
    );
  }

  const navigationProps: WorkspaceNavigationProps = {
    locale,
    section,
    projects,
    currentProjectId,
    latestAuditId: overview?.projects.find(
      (item) => item.project.id === currentProjectId,
    )?.latest_audit?.id,
  };

  return (
    <main className="shell wd-account-workspace-page">
      <div className="wd-workspace-mobile-bar">
        <button
          ref={drawerTriggerRef}
          className="wd-button wd-button-secondary wd-workspace-menu-trigger"
          type="button"
          aria-expanded={drawerOpen}
          aria-controls="account-workspace-drawer"
          onClick={() => setDrawerOpen(true)}
        >
          {ru ? "Меню кабинета" : "Workspace menu"}
        </button>
        <strong>{session.user.display_name}</strong>
      </div>

      <div className="wd-workspace-layout">
        <aside className="wd-workspace-sidebar" aria-label={ru ? "Панель кабинета" : "Workspace panel"}>
          <div className="wd-workspace-identity">
            <span className="eyebrow">WebDiag Account</span>
            <strong>{session.user.display_name}</strong>
            <small>{session.user.email}</small>
          </div>
          <WorkspaceNavigation {...navigationProps} />
          <button className="wd-button wd-button-secondary" type="button" onClick={logout} disabled={logoutPending} aria-busy={logoutPending}>
            {logoutPending ? (ru ? "Выходим…" : "Signing out…") : (ru ? "Выйти" : "Sign out")}
          </button>
        </aside>

        <section className="wd-workspace-content" aria-label={ru ? "Содержимое кабинета" : "Workspace content"}>
          {error && <p className="wd-account-error" role="alert">{error}</p>}
          {overviewError && section === "overview" && (
            <div className="wd-account-error" role="alert">
              <span>{overviewError}</span>
              <button type="button" onClick={() => setReloadToken((value) => value + 1)}>
                {ru ? "Повторить загрузку обзора" : "Retry overview"}
              </button>
            </div>
          )}
          {section === "overview" || section === "projects" ? (
            <AccountDashboard
              locale={locale}
              session={session}
              projects={projects}
              overview={overview}
              onProjectCreated={addProject}
            />
          ) : children}
        </section>
      </div>

      {drawerOpen && (
        <div className="wd-workspace-drawer is-open">
          <div className="wd-workspace-drawer-backdrop" aria-hidden="true" onClick={() => closeDrawer()} />
          <aside
            ref={drawerPanelRef}
            id="account-workspace-drawer"
            className="wd-workspace-drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label={ru ? "Меню кабинета" : "Workspace menu"}
            onKeyDown={handleDrawerKeyDown}
          >
            <div className="wd-workspace-drawer-head">
              <div className="wd-workspace-identity">
                <strong>{session.user.display_name}</strong>
                <small>{session.user.email}</small>
              </div>
              <button
                ref={drawerCloseRef}
                className="wd-button wd-button-secondary"
                type="button"
                onClick={() => closeDrawer()}
              >
                {ru ? "Закрыть" : "Close"}
              </button>
            </div>
            <WorkspaceNavigation {...navigationProps} onNavigate={() => closeDrawer(false)} />
            <button className="wd-button wd-button-secondary" type="button" onClick={logout} disabled={logoutPending} aria-busy={logoutPending}>
              {logoutPending ? (ru ? "Выходим…" : "Signing out…") : (ru ? "Выйти" : "Sign out")}
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}
