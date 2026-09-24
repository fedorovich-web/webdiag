import type {
  SavedAuditCheck,
  SavedAuditIssue,
} from "./account-workspace-contract";

export type ReportLocale = "ru" | "en";

export interface ReportSnapshot {
  readonly contract_version: "webdiag.account.report_snapshot.v1";
  readonly title: string;
  readonly locale: ReportLocale;
  readonly project_name: string;
  readonly target_origin: string;
  readonly audit_completed_at: string;
  readonly score: number | null;
  readonly checks: readonly SavedAuditCheck[];
  readonly issues: readonly SavedAuditIssue[];
  readonly generated_at: string;
}

export interface AccountReportSummary {
  readonly id: string;
  readonly project_id: string;
  readonly audit_id: string;
  readonly title: string;
  readonly locale: ReportLocale;
  readonly status: "ready";
  readonly created_at: string;
  readonly updated_at: string;
  readonly shared: boolean;
  readonly share_expires_at: string | null;
}

export interface AccountReportListItem extends AccountReportSummary {
  readonly project_name: string;
  readonly target_origin: string;
  readonly audit_completed_at: string;
}

export interface AccountReportListResponse {
  readonly contract_version: "webdiag.account.report_list.v2";
  readonly reports: readonly AccountReportListItem[];
}

export interface AccountReportDetailResponse {
  readonly contract_version: "webdiag.account.report_detail.v1";
  readonly report: AccountReportSummary;
  readonly snapshot: ReportSnapshot;
}

export interface AccountReportShareResponse {
  readonly contract_version: "webdiag.account.report_share.v1";
  readonly report_id: string;
  readonly share_token: string;
  readonly share_path: string;
  readonly expires_at: string;
}

export interface PublicReportResponse {
  readonly contract_version: "webdiag.public.report.v1";
  readonly report: {
    readonly title: string;
    readonly locale: ReportLocale;
    readonly created_at: string;
    readonly expires_at: string;
  };
  readonly snapshot: ReportSnapshot;
}

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function only(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}

function string(value: unknown): value is string {
  return typeof value === "string";
}

function nullableString(value: unknown): value is string | null {
  return value === null || string(value);
}

function uuid(value: unknown): value is string {
  return string(value) && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
}

function timestamp(value: unknown): value is string {
  if (!string(value)) return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/u.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  if (hour > 23 || minute > 59 || second > 59 || !Number.isFinite(Date.parse(value))) return false;
  const calendar = new Date(Date.UTC(year, month - 1, day));
  return calendar.getUTCFullYear() === year
    && calendar.getUTCMonth() === month - 1
    && calendar.getUTCDate() === day;
}

function canonicalHttpOrigin(value: unknown): value is string {
  if (!string(value)) return false;
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && url.origin === value;
  } catch {
    return false;
  }
}

function score(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 100);
}

function isCheck(value: unknown): value is SavedAuditCheck {
  return record(value)
    && only(value, ["check_id", "name", "category", "status"])
    && string(value.check_id)
    && string(value.name)
    && string(value.category)
    && string(value.status);
}

function isRecommendation(value: unknown): boolean {
  return record(value)
    && only(value, ["summary", "steps", "expected_impact"])
    && string(value.summary)
    && Array.isArray(value.steps)
    && value.steps.every(string)
    && nullableString(value.expected_impact);
}

function isIssue(value: unknown): value is SavedAuditIssue {
  return record(value)
    && only(value, [
      "issue_id", "check_id", "category", "severity", "priority", "title",
      "description", "affected_urls", "recommendation",
    ])
    && string(value.issue_id)
    && nullableString(value.check_id)
    && string(value.category)
    && string(value.severity)
    && string(value.priority)
    && string(value.title)
    && string(value.description)
    && Array.isArray(value.affected_urls)
    && value.affected_urls.every(string)
    && isRecommendation(value.recommendation);
}

export function isReportSnapshot(value: unknown): value is ReportSnapshot {
  return record(value)
    && only(value, [
      "contract_version", "title", "locale", "project_name", "target_origin",
      "audit_completed_at", "score", "checks", "issues", "generated_at",
    ])
    && value.contract_version === "webdiag.account.report_snapshot.v1"
    && string(value.title)
    && (value.locale === "ru" || value.locale === "en")
    && string(value.project_name)
    && canonicalHttpOrigin(value.target_origin)
    && timestamp(value.audit_completed_at)
    && score(value.score)
    && Array.isArray(value.checks)
    && value.checks.every(isCheck)
    && Array.isArray(value.issues)
    && value.issues.every(isIssue)
    && timestamp(value.generated_at);
}

function isReportSummary(value: unknown): value is AccountReportSummary {
  return record(value)
    && only(value, [
      "id", "project_id", "audit_id", "title", "locale", "status",
      "created_at", "updated_at", "shared", "share_expires_at",
    ])
    && uuid(value.id)
    && uuid(value.project_id)
    && uuid(value.audit_id)
    && string(value.title)
    && (value.locale === "ru" || value.locale === "en")
    && value.status === "ready"
    && timestamp(value.created_at)
    && timestamp(value.updated_at)
    && typeof value.shared === "boolean"
    && nullableString(value.share_expires_at)
    && (value.shared ? timestamp(value.share_expires_at) : value.share_expires_at === null);
}

function isReportListItem(value: unknown): value is AccountReportListItem {
  return record(value)
    && only(value, [
      "id", "project_id", "audit_id", "title", "locale", "status",
      "created_at", "updated_at", "shared", "share_expires_at",
      "project_name", "target_origin", "audit_completed_at",
    ])
    && isReportSummary({
      id: value.id,
      project_id: value.project_id,
      audit_id: value.audit_id,
      title: value.title,
      locale: value.locale,
      status: value.status,
      created_at: value.created_at,
      updated_at: value.updated_at,
      shared: value.shared,
      share_expires_at: value.share_expires_at,
    })
    && string(value.project_name)
    && canonicalHttpOrigin(value.target_origin)
    && timestamp(value.audit_completed_at);
}

export function isAccountReportListResponse(value: unknown): value is AccountReportListResponse {
  return record(value)
    && only(value, ["contract_version", "reports"])
    && value.contract_version === "webdiag.account.report_list.v2"
    && Array.isArray(value.reports)
    && value.reports.every(isReportListItem);
}

export function isAccountReportDetailResponse(value: unknown): value is AccountReportDetailResponse {
  return record(value)
    && only(value, ["contract_version", "report", "snapshot"])
    && value.contract_version === "webdiag.account.report_detail.v1"
    && isReportSummary(value.report)
    && isReportSnapshot(value.snapshot)
    && value.report.title === value.snapshot.title
    && value.report.locale === value.snapshot.locale;
}

export function isAccountReportShareResponse(value: unknown): value is AccountReportShareResponse {
  return record(value)
    && only(value, ["contract_version", "report_id", "share_token", "share_path", "expires_at"])
    && value.contract_version === "webdiag.account.report_share.v1"
    && uuid(value.report_id)
    && string(value.share_token)
    && /^[A-Za-z0-9_-]{40,80}$/u.test(value.share_token)
    && string(value.share_path)
    && value.share_path === `/reports/share/${value.share_token}`
    && timestamp(value.expires_at);
}

export function isPublicReportResponse(value: unknown): value is PublicReportResponse {
  return record(value)
    && only(value, ["contract_version", "report", "snapshot"])
    && value.contract_version === "webdiag.public.report.v1"
    && record(value.report)
    && only(value.report, ["title", "locale", "created_at", "expires_at"])
    && string(value.report.title)
    && (value.report.locale === "ru" || value.report.locale === "en")
    && timestamp(value.report.created_at)
    && timestamp(value.report.expires_at)
    && isReportSnapshot(value.snapshot)
    && value.report.title === value.snapshot.title
    && value.report.locale === value.snapshot.locale;
}
