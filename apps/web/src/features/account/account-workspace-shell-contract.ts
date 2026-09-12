import type { Locale } from "@webdiag/tool-registry";
import { accountPath, reportsPath } from "../../lib/routes";
import type { AccountProject } from "./account-workspace-contract";

export type AccountWorkspaceSection = "overview" | "projects" | "project" | "audit" | "reports" | "report";

export interface AccountWorkspaceNavigationItem {
  readonly id: "overview" | "projects" | "reports";
  readonly label: string;
  readonly href: string;
  readonly active: boolean;
}

export function buildAccountWorkspaceNavigation(
  locale: Locale,
  section: AccountWorkspaceSection,
): readonly AccountWorkspaceNavigationItem[] {
  const root = accountPath(locale);
  const ru = locale === "ru";
  return [
    {
      id: "overview",
      label: ru ? "Обзор" : "Overview",
      href: root,
      active: section === "overview",
    },
    {
      id: "projects",
      label: ru ? "Проекты" : "Projects",
      href: `${root}#projects`,
      active: section === "projects" || section === "project" || section === "audit",
    },
    {
      id: "reports",
      label: ru ? "Отчёты" : "Reports",
      href: reportsPath(locale),
      active: section === "reports" || section === "report",
    },
  ];
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
