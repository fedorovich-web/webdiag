import type { Locale } from "@webdiag/tool-registry";
import type {
  SavedAuditCheck,
  SavedAuditIssue,
} from "./account-workspace-contract";
import type { ReportSnapshot } from "./account-report-contract";

const priorities = ["p0", "p1", "p2", "p3"] as const;
const priorityRank = new Map<string, number>(priorities.map((priority, index) => [priority, index]));
const checkRank = new Map<string, number>([
  ["error", 0],
  ["failed", 1],
  ["warning", 2],
  ["running", 3],
  ["pending", 4],
  ["skipped", 5],
  ["passed", 6],
]);

function lexicalCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function orderedReportIssues(
  issues: readonly SavedAuditIssue[],
): readonly SavedAuditIssue[] {
  return [...issues].sort((left, right) => {
    const rank = (priorityRank.get(left.priority) ?? 99) - (priorityRank.get(right.priority) ?? 99);
    return rank !== 0 ? rank : lexicalCompare(left.issue_id, right.issue_id);
  });
}

export function groupReportIssues(issues: readonly SavedAuditIssue[]) {
  const ordered = orderedReportIssues(issues);
  const known = priorities
    .map((priority) => ({ priority, issues: ordered.filter((issue) => issue.priority === priority) }))
    .filter((group) => group.issues.length > 0);
  const other = ordered.filter((issue) => !priorityRank.has(issue.priority));
  return other.length > 0 ? [...known, { priority: "other", issues: other }] : known;
}

export function reportPriorityDistribution(issues: readonly SavedAuditIssue[]) {
  return priorities.map((priority) => ({
    priority,
    count: issues.filter((issue) => issue.priority === priority).length,
  }));
}

export function groupReportChecks(checks: readonly SavedAuditCheck[]): {
  readonly attention: readonly SavedAuditCheck[];
  readonly passed: readonly SavedAuditCheck[];
} {
  const ordered = [...checks].sort((left, right) => {
    const rank = (checkRank.get(left.status) ?? 99) - (checkRank.get(right.status) ?? 99);
    return rank !== 0 ? rank : lexicalCompare(left.check_id, right.check_id);
  });
  return {
    attention: ordered.filter((check) => check.status !== "passed"),
    passed: ordered.filter((check) => check.status === "passed"),
  };
}

export function reportSummary(snapshot: ReportSnapshot) {
  const ordered = orderedReportIssues(snapshot.issues);
  return {
    score: snapshot.score,
    checkCount: snapshot.checks.length,
    issueCount: snapshot.issues.length,
    nonPassingCheckCount: snapshot.checks.filter((check) => check.status !== "passed").length,
    firstActions: ordered.slice(0, 3).map((issue) => issue.recommendation.summary),
  };
}

export function reportPriorityLabel(locale: Locale, priority: string): string {
  const labels: Record<Locale, Record<(typeof priorities)[number], string>> = {
    ru: {
      p0: "P0 — исправить первым",
      p1: "P1 — следующим",
      p2: "P2 — планово",
      p3: "P3 — позже",
    },
    en: {
      p0: "P0 — fix first",
      p1: "P1 — next",
      p2: "P2 — planned",
      p3: "P3 — later",
    },
  };
  return priorities.includes(priority as (typeof priorities)[number])
    ? labels[locale][priority as (typeof priorities)[number]]
    : locale === "ru" ? "Не классифицировано" : "Not classified";
}

export function formatReportDate(locale: Locale, value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function reportShareState(
  locale: Locale,
  shared: boolean,
  expiresAt: string | null,
): { readonly label: string; readonly expiry: string | null } {
  return shared
    ? { label: locale === "ru" ? "Общий доступ" : "Shared", expiry: expiresAt }
    : { label: locale === "ru" ? "Приватный" : "Private", expiry: null };
}
