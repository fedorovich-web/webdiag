import type { Locale } from "@webdiag/tool-registry";
import type { MonitorStatus } from "./account-monitoring-contract";
import type {
  AccountNextAction,
  AccountOverviewResponse,
} from "./account-overview-contract";
import {
  accountPath,
  projectMonitoringPath,
  projectPath,
  savedAuditPath,
} from "../../lib/routes";

export interface AccountOverviewMetrics {
  readonly projectCount: number;
  readonly projectsWithAudit: number;
  readonly projectsRequiringAttention: number;
  readonly readyReportCount: number;
}

export function accountOverviewMetrics(
  overview: AccountOverviewResponse,
): AccountOverviewMetrics {
  return {
    projectCount: overview.projects.length,
    projectsWithAudit: overview.projects.filter((item) => item.latest_audit !== null).length,
    projectsRequiringAttention: overview.projects.filter(
      (item) => item.monitor?.status === "failed" || item.monitor?.status === "changed",
    ).length,
    readyReportCount: overview.projects.reduce(
      (total, item) => total + item.report_count,
      0,
    ),
  };
}

export function formatNullableScore(score: number | null, locale: Locale): string {
  if (score === null) return locale === "ru" ? "Не рассчитана" : "Not calculated";
  return `${score}/100`;
}

export function formatMonitorStatus(status: MonitorStatus, locale: Locale): string {
  const ru = locale === "ru";
  const labels: Record<MonitorStatus, readonly [string, string]> = {
    pending: ["Ожидает проверки", "Waiting for check"],
    running: ["Проверка выполняется", "Check in progress"],
    passed: ["Без изменений", "No changes"],
    changed: ["Есть изменения", "Changes detected"],
    failed: ["Проверка завершилась ошибкой", "Check failed"],
  };
  return labels[status][ru ? 0 : 1];
}

export function formatAccountDate(value: string | null, locale: Locale): string {
  if (value === null) return locale === "ru" ? "Нет данных" : "No data";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return locale === "ru" ? "Нет данных" : "No data";
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function accountNextActionHref(
  locale: Locale,
  action: AccountNextAction,
  overview: AccountOverviewResponse,
): string {
  if (action.kind === "create_project") return "#project-create";
  if (!action.projectId) return accountPath(locale);
  if (action.kind === "review_change" || action.kind === "resolve_monitor_failure") {
    return projectMonitoringPath(locale, action.projectId);
  }
  if (action.kind === "create_report") {
    const latestAuditId = overview.projects.find(
      (item) => item.project.id === action.projectId,
    )?.latest_audit?.id;
    if (latestAuditId) return savedAuditPath(locale, action.projectId, latestAuditId);
  }
  return projectPath(locale, action.projectId);
}
