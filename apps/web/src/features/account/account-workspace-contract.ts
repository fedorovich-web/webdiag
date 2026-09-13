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

export interface ArchivedAccountProject extends AccountProject {
  readonly contract_version: "webdiag.account.archived_project.v1";
  readonly archived_at: string;
}

export interface ArchivedAccountProjectListResponse {
  readonly contract_version: "webdiag.account.archived_project_list.v1";
  readonly projects: readonly ArchivedAccountProject[];
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

export type CrawlState = "queued" | "running" | "succeeded" | "failed";

export interface AccountCrawlJob {
  readonly id: string;
  readonly project_id: string;
  readonly origin: string;
  readonly state: CrawlState;
  readonly error_code: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface CrawlPage {
  readonly url: string;
  readonly status_code: number;
  readonly title: string | null;
  readonly meta_description: string | null;
  readonly internal_links: readonly string[];
}

export interface CrawlPageFailure {
  readonly url: string;
  readonly code: "fetch_failed" | "not_html" | "robots_disallowed";
}

export interface CrawlDuplicateGroup {
  readonly value: string;
  readonly urls: readonly string[];
}

export interface CrawlResult {
  readonly contract_version: "webdiag.crawl.result.v1";
  readonly origin: string;
  readonly pages: readonly CrawlPage[];
  readonly page_failures: readonly CrawlPageFailure[];
  readonly page_limit: number;
  readonly page_budget_exhausted: boolean;
  readonly sitemap_url: string | null;
  readonly sitemap_url_count: number;
  readonly duplicate_titles: readonly CrawlDuplicateGroup[];
  readonly duplicate_descriptions: readonly CrawlDuplicateGroup[];
  readonly orphan_urls: readonly string[];
  readonly completed_at: string;
}

export interface AccountCrawlDetail {
  readonly contract_version: "webdiag.account.crawl_detail.v1";
  readonly job: AccountCrawlJob;
  readonly result: CrawlResult | null;
}

export interface AccountCrawlList {
  readonly contract_version: "webdiag.account.crawl_list.v1";
  readonly jobs: readonly AccountCrawlJob[];
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

function dateTime(value: unknown): value is string {
  return string(value)
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value)
    && Number.isFinite(Date.parse(value));
}

function nullableNumber(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

export function isAccountProject(value: unknown): value is AccountProject {
  return record(value) && only(value, ["id", "name", "origin", "created_at", "updated_at"])
    && string(value.id) && string(value.name) && string(value.origin)
    && dateTime(value.created_at) && dateTime(value.updated_at);
}

export function isSavedAuditSummary(value: unknown): value is SavedAuditSummary {
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
    && value.saved_audits.every(isSavedAuditSummary);
}

export function isArchivedAccountProject(value: unknown): value is ArchivedAccountProject {
  return record(value) && only(value, [
    "contract_version", "id", "name", "origin", "created_at", "updated_at", "archived_at",
  ])
    && value.contract_version === "webdiag.account.archived_project.v1"
    && string(value.id) && string(value.name) && string(value.origin)
    && dateTime(value.created_at) && dateTime(value.updated_at) && dateTime(value.archived_at);
}

export function isArchivedAccountProjectListResponse(
  value: unknown,
): value is ArchivedAccountProjectListResponse {
  return record(value) && only(value, ["contract_version", "projects"])
    && value.contract_version === "webdiag.account.archived_project_list.v1"
    && Array.isArray(value.projects) && value.projects.every(isArchivedAccountProject);
}

export function isSavedAuditDetailResponse(value: unknown): value is SavedAuditDetailResponse {
  return record(value) && only(value, ["contract_version", "project", "audit", "payload"])
    && value.contract_version === "webdiag.account.saved_audit_detail.v1"
    && isAccountProject(value.project) && isSavedAuditSummary(value.audit) && isPayload(value.payload)
    && value.audit.project_id === value.project.id
    && value.audit.check_count === value.payload.checks.length
    && value.audit.issue_count === value.payload.issues.length
    && value.audit.score === value.payload.score;
}

function isCrawlJob(value: unknown): value is AccountCrawlJob {
  return record(value) && only(value, [
    "id", "project_id", "origin", "state", "error_code", "created_at", "updated_at",
  ]) && string(value.id) && string(value.project_id) && string(value.origin)
    && ["queued", "running", "succeeded", "failed"].includes(String(value.state))
    && (value.error_code === null || string(value.error_code))
    && dateTime(value.created_at) && dateTime(value.updated_at);
}

function isCrawlPage(value: unknown): value is CrawlPage {
  return record(value) && only(value, [
    "url", "status_code", "title", "meta_description", "internal_links",
  ]) && string(value.url) && Number.isInteger(value.status_code)
    && (value.title === null || string(value.title))
    && (value.meta_description === null || string(value.meta_description))
    && Array.isArray(value.internal_links) && value.internal_links.every(string);
}

function isDuplicateGroup(value: unknown): value is CrawlDuplicateGroup {
  return record(value) && only(value, ["value", "urls"])
    && string(value.value) && Array.isArray(value.urls) && value.urls.length >= 2
    && value.urls.every(string);
}

function isCrawlResult(value: unknown): value is CrawlResult {
  return record(value) && only(value, [
    "contract_version", "origin", "pages", "page_failures", "page_limit",
    "page_budget_exhausted", "sitemap_url", "sitemap_url_count", "duplicate_titles",
    "duplicate_descriptions", "orphan_urls", "completed_at",
  ]) && value.contract_version === "webdiag.crawl.result.v1" && string(value.origin)
    && Array.isArray(value.pages) && value.pages.every(isCrawlPage)
    && Array.isArray(value.page_failures) && value.page_failures.every((failure) => record(failure)
      && only(failure, ["url", "code"]) && string(failure.url)
      && ["fetch_failed", "not_html", "robots_disallowed"].includes(String(failure.code)))
    && Number.isInteger(value.page_limit) && typeof value.page_budget_exhausted === "boolean"
    && (value.sitemap_url === null || string(value.sitemap_url))
    && Number.isInteger(value.sitemap_url_count)
    && Array.isArray(value.duplicate_titles) && value.duplicate_titles.every(isDuplicateGroup)
    && Array.isArray(value.duplicate_descriptions) && value.duplicate_descriptions.every(isDuplicateGroup)
    && Array.isArray(value.orphan_urls) && value.orphan_urls.every(string)
    && dateTime(value.completed_at);
}

export function isAccountCrawlDetail(value: unknown): value is AccountCrawlDetail {
  return record(value) && only(value, ["contract_version", "job", "result"])
    && value.contract_version === "webdiag.account.crawl_detail.v1"
    && isCrawlJob(value.job) && (value.result === null || isCrawlResult(value.result))
    && (value.result === null || value.result.origin === value.job.origin);
}

export function isAccountCrawlList(value: unknown): value is AccountCrawlList {
  return record(value) && only(value, ["contract_version", "jobs"])
    && value.contract_version === "webdiag.account.crawl_list.v1"
    && Array.isArray(value.jobs) && value.jobs.every(isCrawlJob);
}
