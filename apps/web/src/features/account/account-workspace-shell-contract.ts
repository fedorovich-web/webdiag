import type { Locale } from "@webdiag/tool-registry";
import {
  accountPath,
  projectMonitoringPath,
  projectPath,
  reportsPath,
  savedAuditIssuesPath,
} from "../../lib/routes";
import type { AccountProject } from "./account-workspace-contract";

export type AccountWorkspaceSection =
  | "overview"
  | "projects"
  | "project"
  | "audit"
  | "issues"
  | "monitoring"
  | "reports"
  | "report";

export type AccountWorkspaceNavigationId =
  | "overview"
  | "projects"
  | "reports"
  | "project_overview"
  | "audits"
  | "issues"
  | "monitoring"
  | "project_reports";

export interface AccountWorkspaceNavigationItem {
  readonly id: AccountWorkspaceNavigationId;
  readonly label: string;
  readonly href: string | null;
  readonly active: boolean;
  readonly disabled: boolean;
}

export interface AccountWorkspaceNavigation {
  readonly portfolio: readonly AccountWorkspaceNavigationItem[];
  readonly project: readonly AccountWorkspaceNavigationItem[] | null;
}

export function buildAccountWorkspaceNavigation(
  locale: Locale,
  section: AccountWorkspaceSection,
  projectId?: string,
  latestAuditId?: string,
): AccountWorkspaceNavigation {
  const root = accountPath(locale);
  const ru = locale === "ru";
  const projectSections = new Set<AccountWorkspaceSection>([
    "project", "audit", "issues", "monitoring",
  ]);
  const portfolio: readonly AccountWorkspaceNavigationItem[] = [
    {
      id: "overview",
      label: ru ? "Обзор" : "Overview",
      href: root,
      active: section === "overview",
      disabled: false,
    },
    {
      id: "projects",
      label: ru ? "Проекты" : "Projects",
      href: `${root}#projects`,
      active: section === "projects" || projectSections.has(section),
      disabled: false,
    },
    {
      id: "reports",
      label: ru ? "Отчёты" : "Reports",
      href: reportsPath(locale),
      active: section === "reports" || section === "report",
      disabled: false,
    },
  ];
  if (!projectId) return { portfolio, project: null };

  const base = projectPath(locale, projectId);
  const project: readonly AccountWorkspaceNavigationItem[] = [
    {
      id: "project_overview",
      label: ru ? "Обзор проекта" : "Project overview",
      href: base,
      active: section === "project",
      disabled: false,
    },
    {
      id: "audits",
      label: ru ? "Аудиты" : "Audits",
      href: `${base}#audit-history`,
      active: section === "audit",
      disabled: false,
    },
    {
      id: "issues",
      label: ru ? "Проблемы" : "Issues",
      href: latestAuditId ? savedAuditIssuesPath(locale, projectId, latestAuditId) : null,
      active: section === "issues",
      disabled: !latestAuditId,
    },
    {
      id: "monitoring",
      label: ru ? "Мониторинг" : "Monitoring",
      href: projectMonitoringPath(locale, projectId),
      active: section === "monitoring",
      disabled: false,
    },
    {
      id: "project_reports",
      label: ru ? "Отчёты проекта" : "Project reports",
      href: null,
      active: false,
      disabled: true,
    },
  ];
  return { portfolio, project };
}

export function projectLandingAfterSwitch(locale: Locale, projectId: string): string {
  return projectPath(locale, projectId);
}

export function recentAccountProjects(
  projects: readonly AccountProject[],
  limit = 3,
): readonly AccountProject[] {
  const boundedLimit = Math.max(0, Math.min(10, Math.trunc(limit)));
  return [...projects]
    .sort((left, right) => {
      const time = Date.parse(right.updated_at) - Date.parse(left.updated_at);
      if (time !== 0) return time;
      const name = left.name.localeCompare(right.name, "en");
      return name !== 0 ? name : left.id.localeCompare(right.id, "en");
    })
    .slice(0, boundedLimit);
}

export function resolveActiveAccountProject(
  projects: readonly AccountProject[],
  projectId: string | null | undefined,
): AccountProject | null {
  if (!projectId) return null;
  return projects.find((project) => project.id === projectId) ?? null;
}
