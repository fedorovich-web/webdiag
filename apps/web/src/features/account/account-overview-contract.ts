import type { Locale } from "@webdiag/tool-registry";
import {
  isAccountMonitor,
  type AccountMonitor,
} from "./account-monitoring-contract";
import {
  isAccountProject,
  isSavedAuditSummary,
  type AccountProject,
  type SavedAuditSummary,
} from "./account-workspace-contract";

export interface AccountOverviewProject {
  readonly project: AccountProject;
  readonly latest_audit: SavedAuditSummary | null;
  readonly monitor: AccountMonitor | null;
  readonly report_count: number;
  readonly shared_report_count: number;
  readonly latest_report_created_at: string | null;
}

export interface AccountOverviewResponse {
  readonly contract_version: "webdiag.account.overview.v1";
  readonly projects: readonly AccountOverviewProject[];
}

export type AccountNextActionKind =
  | "create_project"
  | "run_audit"
  | "review_change"
  | "resolve_monitor_failure"
  | "create_report";

export interface AccountNextAction {
  readonly kind: AccountNextActionKind;
  readonly projectId: string | null;
  readonly projectName: string | null;
  readonly label: string;
}

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function only(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}

function nullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function nonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function isOverviewProject(value: unknown): value is AccountOverviewProject {
  if (!record(value) || !only(value, [
    "project",
    "latest_audit",
    "monitor",
    "report_count",
    "shared_report_count",
    "latest_report_created_at",
  ])) return false;
  if (!isAccountProject(value.project)
    || (value.latest_audit !== null && !isSavedAuditSummary(value.latest_audit))
    || (value.monitor !== null && !isAccountMonitor(value.monitor))
    || !nonNegativeInteger(value.report_count)
    || !nonNegativeInteger(value.shared_report_count)
    || Number(value.shared_report_count) > Number(value.report_count)
    || !nullableString(value.latest_report_created_at)) return false;
  if (value.latest_audit !== null && value.latest_audit.project_id !== value.project.id) return false;
  return value.monitor === null || value.monitor.project_id === value.project.id;
}

export function isAccountOverviewResponse(value: unknown): value is AccountOverviewResponse {
  return record(value)
    && only(value, ["contract_version", "projects"])
    && value.contract_version === "webdiag.account.overview.v1"
    && Array.isArray(value.projects)
    && value.projects.every(isOverviewProject);
}

function actionLabel(kind: AccountNextActionKind, locale: Locale): string {
  const ru = locale === "ru";
  const labels: Record<AccountNextActionKind, readonly [string, string]> = {
    create_project: ["Добавить проект", "Add a project"],
    run_audit: ["Запустить первый аудит", "Run the first audit"],
    review_change: ["Проверить изменения", "Review changes"],
    resolve_monitor_failure: ["Разобрать ошибку мониторинга", "Review monitoring failure"],
    create_report: ["Создать отчёт", "Create a report"],
  };
  return labels[kind][ru ? 0 : 1];
}

export function deriveAccountNextActions(
  overview: AccountOverviewResponse,
  locale: Locale,
): readonly AccountNextAction[] {
  if (overview.projects.length === 0) {
    return [{
      kind: "create_project",
      projectId: null,
      projectName: null,
      label: actionLabel("create_project", locale),
    }];
  }
  const actions: AccountNextAction[] = [];
  for (const item of overview.projects) {
    let kind: AccountNextActionKind | null = null;
    if (item.monitor?.status === "failed") kind = "resolve_monitor_failure";
    else if (item.monitor?.status === "changed") kind = "review_change";
    else if (item.latest_audit === null) kind = "run_audit";
    else if (item.report_count === 0) kind = "create_report";
    if (kind) {
      actions.push({
        kind,
        projectId: item.project.id,
        projectName: item.project.name,
        label: actionLabel(kind, locale),
      });
    }
    if (actions.length === 3) break;
  }
  return actions;
}
