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

export interface AccountReportListResponse {
  readonly contract_version: "webdiag.account.report_list.v1";
  readonly reports: readonly AccountReportSummary[];
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

function nullableNumber(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
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
    && string(value.target_origin)
    && string(value.audit_completed_at)
    && nullableNumber(value.score)
    && Array.isArray(value.checks)
    && value.checks.every(isCheck)
    && Array.isArray(value.issues)
    && value.issues.every(isIssue)
    && string(value.generated_at);
}

function isReportSummary(value: unknown): value is AccountReportSummary {
  return record(value)
    && only(value, [
      "id", "project_id", "audit_id", "title", "locale", "status",
      "created_at", "updated_at", "shared", "share_expires_at",
    ])
    && string(value.id)
    && string(value.project_id)
    && string(value.audit_id)
    && string(value.title)
    && (value.locale === "ru" || value.locale === "en")
    && value.status === "ready"
    && string(value.created_at)
    && string(value.updated_at)
    && typeof value.shared === "boolean"
    && nullableString(value.share_expires_at);
}

export function isAccountReportListResponse(value: unknown): value is AccountReportListResponse {
  return record(value)
    && only(value, ["contract_version", "reports"])
    && value.contract_version === "webdiag.account.report_list.v1"
    && Array.isArray(value.reports)
    && value.reports.every(isReportSummary);
}

export function isAccountReportDetailResponse(value: unknown): value is AccountReportDetailResponse {
  return record(value)
    && only(value, ["contract_version", "report", "snapshot"])
    && value.contract_version === "webdiag.account.report_detail.v1"
    && isReportSummary(value.report)
    && isReportSnapshot(value.snapshot);
}

export function isAccountReportShareResponse(value: unknown): value is AccountReportShareResponse {
  return record(value)
    && only(value, ["contract_version", "report_id", "share_token", "share_path", "expires_at"])
    && value.contract_version === "webdiag.account.report_share.v1"
    && string(value.report_id)
    && string(value.share_token)
    && string(value.share_path)
    && string(value.expires_at);
}

export function isPublicReportResponse(value: unknown): value is PublicReportResponse {
  return record(value)
    && only(value, ["contract_version", "report", "snapshot"])
    && value.contract_version === "webdiag.public.report.v1"
    && record(value.report)
    && only(value.report, ["title", "locale", "created_at", "expires_at"])
    && string(value.report.title)
    && (value.report.locale === "ru" || value.report.locale === "en")
    && string(value.report.created_at)
    && string(value.report.expires_at)
    && isReportSnapshot(value.snapshot);
}
