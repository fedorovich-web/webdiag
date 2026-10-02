import { AccountClientError } from "./account-client";
import type { Locale } from "@webdiag/tool-registry";
import { isAccountErrorPayload } from "./account-contract";
import {
  isAccountProject,
  type AccountProject,
  type SavedAuditRecommendation,
  type SavedAuditSummary,
} from "./account-workspace-contract";

export type AccountIssueCategory =
  | "seo"
  | "performance"
  | "accessibility"
  | "security"
  | "content"
  | "technical";
export type AccountIssuePriority = "p0" | "p1" | "p2" | "p3";
export type AccountIssueSort = "priority" | "category" | "title";
export type AccountIssueOrder = "asc" | "desc";

export interface AccountIssue {
  readonly issue_id: string;
  readonly check_id: string | null;
  readonly category: AccountIssueCategory;
  readonly source_category: string;
  readonly severity: string;
  readonly priority: AccountIssuePriority;
  readonly fix_order: number;
  readonly title: string;
  readonly description: string;
  readonly affected_urls: readonly string[];
  readonly recommendation: SavedAuditRecommendation;
}

export interface AccountIssueListResponse {
  readonly contract_version: "webdiag.account.issue_list.v1";
  readonly project: AccountProject;
  readonly audit: SavedAuditSummary;
  readonly total: number;
  readonly items: readonly AccountIssue[];
}

export interface AccountIssueDetailResponse {
  readonly contract_version: "webdiag.account.issue_detail.v1";
  readonly project: AccountProject;
  readonly audit: SavedAuditSummary;
  readonly issue: AccountIssue;
}

export interface AccountIssueFilters {
  readonly locale?: Locale;
  readonly category?: AccountIssueCategory;
  readonly priority?: AccountIssuePriority;
  readonly sort?: AccountIssueSort;
  readonly order?: AccountIssueOrder;
}

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const ISSUE_ID = /^[A-Za-z0-9._:-]{1,120}$/u;
const CATEGORIES = new Set<AccountIssueCategory>([
  "seo", "performance", "accessibility", "security", "content", "technical",
]);
const PRIORITIES = new Set<AccountIssuePriority>(["p0", "p1", "p2", "p3"]);
const SORTS = new Set<AccountIssueSort>(["priority", "category", "title"]);
const ORDERS = new Set<AccountIssueOrder>(["asc", "desc"]);
const FILTER_ORDER = ["locale", "category", "priority", "sort", "order"] as const;

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

function isAuditSummary(value: unknown): value is SavedAuditSummary {
  return record(value)
    && only(value, [
      "id", "project_id", "status", "score", "check_count", "issue_count",
      "completed_at", "created_at",
    ])
    && string(value.id)
    && string(value.project_id)
    && value.status === "succeeded"
    && nullableNumber(value.score)
    && Number.isInteger(value.check_count)
    && Number.isInteger(value.issue_count)
    && string(value.completed_at)
    && string(value.created_at);
}

function isRecommendation(value: unknown): value is SavedAuditRecommendation {
  return record(value)
    && only(value, ["summary", "steps", "expected_impact"])
    && string(value.summary)
    && Array.isArray(value.steps)
    && value.steps.every(string)
    && (value.expected_impact === null || string(value.expected_impact));
}

function isIssue(value: unknown): value is AccountIssue {
  return record(value)
    && only(value, [
      "issue_id", "check_id", "category", "source_category", "severity", "priority",
      "fix_order", "title", "description", "affected_urls", "recommendation",
    ])
    && string(value.issue_id)
    && ISSUE_ID.test(value.issue_id)
    && (value.check_id === null || string(value.check_id))
    && string(value.category)
    && CATEGORIES.has(value.category as AccountIssueCategory)
    && string(value.source_category)
    && string(value.severity)
    && string(value.priority)
    && PRIORITIES.has(value.priority as AccountIssuePriority)
    && Number.isInteger(value.fix_order)
    && Number(value.fix_order) >= 1
    && string(value.title)
    && string(value.description)
    && Array.isArray(value.affected_urls)
    && value.affected_urls.every(string)
    && isRecommendation(value.recommendation);
}

export function isAccountIssueListResponse(value: unknown): value is AccountIssueListResponse {
  return record(value)
    && only(value, ["contract_version", "project", "audit", "total", "items"])
    && value.contract_version === "webdiag.account.issue_list.v1"
    && isAccountProject(value.project)
    && isAuditSummary(value.audit)
    && value.audit.project_id === value.project.id
    && Number.isInteger(value.total)
    && Number(value.total) >= 0
    && Array.isArray(value.items)
    && value.items.every(isIssue)
    && value.total === value.items.length;
}

export function isAccountIssueDetailResponse(value: unknown): value is AccountIssueDetailResponse {
  return record(value)
    && only(value, ["contract_version", "project", "audit", "issue"])
    && value.contract_version === "webdiag.account.issue_detail.v1"
    && isAccountProject(value.project)
    && isAuditSummary(value.audit)
    && value.audit.project_id === value.project.id
    && isIssue(value.issue);
}

function canonicalFilters(filters: AccountIssueFilters): string {
  const params = new URLSearchParams();
  if (filters.locale) params.set("locale", filters.locale);
  if (filters.category) params.set("category", filters.category);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.order) params.set("order", filters.order);
  const query = params.toString();
  return query ? `?${query}` : "";
}

function parseFilters(searchParams: URLSearchParams): AccountIssueFilters | null {
  const allowed = new Set<string>(FILTER_ORDER);
  let valid = true;
  searchParams.forEach((_value, key) => {
    if (!allowed.has(key) || searchParams.getAll(key).length !== 1) valid = false;
  });
  if (!valid) return null;
  const locale = searchParams.get("locale");
  const category = searchParams.get("category");
  const priority = searchParams.get("priority");
  const sort = searchParams.get("sort");
  const order = searchParams.get("order");
  if (locale && locale !== "ru" && locale !== "en") return null;
  if (category && !CATEGORIES.has(category as AccountIssueCategory)) return null;
  if (priority && !PRIORITIES.has(priority as AccountIssuePriority)) return null;
  if (sort && !SORTS.has(sort as AccountIssueSort)) return null;
  if (order && !ORDERS.has(order as AccountIssueOrder)) return null;
  return {
    ...(locale ? { locale: locale as Locale } : {}),
    ...(category ? { category: category as AccountIssueCategory } : {}),
    ...(priority ? { priority: priority as AccountIssuePriority } : {}),
    ...(sort ? { sort: sort as AccountIssueSort } : {}),
    ...(order ? { order: order as AccountIssueOrder } : {}),
  };
}

export function accountIssueListPath(
  projectId: string,
  auditId: string,
  searchParams: URLSearchParams,
): string | null {
  if (!UUID.test(projectId) || !UUID.test(auditId)) return null;
  const filters = parseFilters(searchParams);
  if (!filters) return null;
  return `/v1/account/projects/${projectId}/audits/${auditId}/issues${canonicalFilters(filters)}`;
}

export function accountIssueDetailPath(
  projectId: string,
  auditId: string,
  issueId: string,
  searchParams: URLSearchParams = new URLSearchParams(),
): string | null {
  if (!UUID.test(projectId) || !UUID.test(auditId) || !ISSUE_ID.test(issueId)) return null;
  let valid = true;
  searchParams.forEach((_value, key) => {
    if (key !== "locale" || searchParams.getAll(key).length !== 1) valid = false;
  });
  const locale = searchParams.get("locale");
  if (!valid || (locale && locale !== "ru" && locale !== "en")) return null;
  return `/v1/account/projects/${projectId}/audits/${auditId}/issues/${issueId}${
    locale ? `?locale=${locale}` : ""
  }`;
}

async function parse<T>(response: Response, validator: (value: unknown) => value is T): Promise<T> {
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (isAccountErrorPayload(payload)) {
      throw new AccountClientError(payload.detail.message, {
        status: response.status,
        code: payload.detail.code,
      });
    }
    throw new AccountClientError("Account issues request failed.", {
      status: response.status,
      code: "account_issues_request_failed",
    });
  }
  if (!validator(payload)) {
    throw new AccountClientError("Account issues returned an invalid response.", {
      status: response.status,
      code: "account_invalid_response",
    });
  }
  return payload;
}

const common: Pick<RequestInit, "cache" | "credentials"> = {
  cache: "no-store",
  credentials: "same-origin",
};

export async function listAccountIssues(
  projectId: string,
  auditId: string,
  filters: AccountIssueFilters = {},
  fetcher: Fetcher = fetch,
): Promise<AccountIssueListResponse> {
  return parse(
    await fetcher(
      `/api/account/projects/${projectId}/audits/${auditId}/issues${canonicalFilters(filters)}`,
      { ...common, method: "GET", headers: { accept: "application/json" } },
    ),
    isAccountIssueListResponse,
  );
}

export async function getAccountIssue(
  projectId: string,
  auditId: string,
  issueId: string,
  locale: Locale,
  fetcher: Fetcher = fetch,
): Promise<AccountIssueDetailResponse> {
  return parse(
    await fetcher(
      `/api/account/projects/${projectId}/audits/${auditId}/issues/${issueId}?locale=${locale}`,
      { ...common, method: "GET", headers: { accept: "application/json" } },
    ),
    isAccountIssueDetailResponse,
  );
}
