export interface AccountProject {
  readonly id: string;
  readonly name: string;
  readonly origin: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface SavedAuditSummary {
  readonly id: string;
  readonly project_id: string;
  readonly status: "succeeded";
  readonly score: number | null;
  readonly check_count: number;
  readonly issue_count: number;
  readonly completed_at: string;
  readonly created_at: string;
}

export interface AccountProjectListResponse {
  readonly contract_version: "webdiag.account.project_list.v1";
  readonly projects: readonly AccountProject[];
}

export interface AccountProjectDetailResponse {
  readonly contract_version: "webdiag.account.project_detail.v1";
  readonly project: AccountProject;
  readonly saved_audits: readonly SavedAuditSummary[];
}

export interface SavedAuditCheck {
  readonly check_id: string;
  readonly name: string;
  readonly category: string;
  readonly status: string;
}

export interface SavedAuditRecommendation {
  readonly summary: string;
  readonly steps: readonly string[];
  readonly expected_impact: string | null;
}

export interface SavedAuditIssue {
  readonly issue_id: string;
  readonly check_id: string | null;
  readonly category: string;
  readonly severity: string;
  readonly priority: string;
  readonly title: string;
  readonly description: string;
  readonly affected_urls: readonly string[];
  readonly recommendation: SavedAuditRecommendation;
}

export interface SavedAuditPayload {
  readonly contract_version: "webdiag.account.saved_audit_payload.v1";
  readonly target_origin: string;
  readonly status: "succeeded";
  readonly score: number | null;
  readonly checks: readonly SavedAuditCheck[];
  readonly issues: readonly SavedAuditIssue[];
  readonly completed_at: string;
}

export interface SavedAuditDetailResponse {
  readonly contract_version: "webdiag.account.saved_audit_detail.v1";
  readonly project: AccountProject;
  readonly audit: SavedAuditSummary;
  readonly payload: SavedAuditPayload;
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

function nullableNumber(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

export function isAccountProject(value: unknown): value is AccountProject {
  return record(value) && only(value, ["id", "name", "origin", "created_at", "updated_at"])
    && string(value.id) && string(value.name) && string(value.origin)
    && string(value.created_at) && string(value.updated_at);
}

function isSummary(value: unknown): value is SavedAuditSummary {
  return record(value)
    && only(value, [
      "id", "project_id", "status", "score", "check_count", "issue_count",
      "completed_at", "created_at",
    ])
    && string(value.id) && string(value.project_id) && value.status === "succeeded"
    && nullableNumber(value.score) && Number.isInteger(value.check_count)
    && Number.isInteger(value.issue_count) && string(value.completed_at)
    && string(value.created_at);
}

function isCheck(value: unknown): value is SavedAuditCheck {
  return record(value) && only(value, ["check_id", "name", "category", "status"])
    && string(value.check_id) && string(value.name) && string(value.category)
    && string(value.status);
}

function isRecommendation(value: unknown): value is SavedAuditRecommendation {
  return record(value) && only(value, ["summary", "steps", "expected_impact"])
    && string(value.summary) && Array.isArray(value.steps) && value.steps.every(string)
    && (value.expected_impact === null || string(value.expected_impact));
}

function isIssue(value: unknown): value is SavedAuditIssue {
  return record(value) && only(value, [
    "issue_id", "check_id", "category", "severity", "priority", "title",
    "description", "affected_urls", "recommendation",
  ])
    && string(value.issue_id) && (value.check_id === null || string(value.check_id))
    && string(value.category) && string(value.severity) && string(value.priority)
    && string(value.title) && string(value.description)
    && Array.isArray(value.affected_urls) && value.affected_urls.every(string)
    && isRecommendation(value.recommendation);
}

function isPayload(value: unknown): value is SavedAuditPayload {
  return record(value) && only(value, [
    "contract_version", "target_origin", "status", "score", "checks", "issues",
    "completed_at",
  ])
    && value.contract_version === "webdiag.account.saved_audit_payload.v1"
    && string(value.target_origin) && value.status === "succeeded"
    && nullableNumber(value.score) && Array.isArray(value.checks)
    && value.checks.every(isCheck) && Array.isArray(value.issues)
    && value.issues.every(isIssue) && string(value.completed_at);
}

export function isAccountProjectListResponse(value: unknown): value is AccountProjectListResponse {
  return record(value) && only(value, ["contract_version", "projects"])
    && value.contract_version === "webdiag.account.project_list.v1"
    && Array.isArray(value.projects) && value.projects.every(isAccountProject);
}

export function isAccountProjectDetailResponse(value: unknown): value is AccountProjectDetailResponse {
  return record(value) && only(value, ["contract_version", "project", "saved_audits"])
    && value.contract_version === "webdiag.account.project_detail.v1"
    && isAccountProject(value.project) && Array.isArray(value.saved_audits)
    && value.saved_audits.every(isSummary);
}

export function isSavedAuditDetailResponse(value: unknown): value is SavedAuditDetailResponse {
  return record(value) && only(value, ["contract_version", "project", "audit", "payload"])
    && value.contract_version === "webdiag.account.saved_audit_detail.v1"
    && isAccountProject(value.project) && isSummary(value.audit) && isPayload(value.payload)
    && value.audit.project_id === value.project.id
    && value.audit.check_count === value.payload.checks.length
    && value.audit.issue_count === value.payload.issues.length
    && value.audit.score === value.payload.score;
}
