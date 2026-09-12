import { describe, expect, it } from "vitest";
import {
  accountIssueDetailPath,
  accountIssueListPath,
  getAccountIssue,
  isAccountIssueDetailResponse,
  isAccountIssueListResponse,
  listAccountIssues,
} from "./account-issues-contract";

const project = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Main",
  origin: "https://example.com",
  created_at: "2026-07-31T10:00:00Z",
  updated_at: "2026-07-31T10:00:00Z",
};
const audit = {
  id: "22222222-2222-4222-8222-222222222222",
  project_id: project.id,
  status: "succeeded" as const,
  score: 80,
  check_count: 1,
  issue_count: 1,
  completed_at: "2026-07-31T10:01:00Z",
  created_at: "2026-07-31T10:01:00Z",
};
const issue = {
  issue_id: "metadata.title.missing",
  check_id: "metadata.title",
  category: "seo" as const,
  source_category: "metadata",
  severity: "medium",
  priority: "p1" as const,
  fix_order: 1,
  title: "Title is missing",
  description: "The page has no title.",
  affected_urls: ["https://example.com/"],
  recommendation: {
    summary: "Add a title.",
    steps: ["Add one title element."],
    expected_impact: "Clearer search snippets.",
  },
};

const listResponse = {
  contract_version: "webdiag.account.issue_list.v1" as const,
  project,
  audit,
  total: 1,
  items: [issue],
};
const detailResponse = {
  contract_version: "webdiag.account.issue_detail.v1" as const,
  project,
  audit,
  issue,
};

describe("account issue contracts", () => {
  it("accepts exact issue contracts and rejects internal fields", () => {
    expect(isAccountIssueListResponse(listResponse)).toBe(true);
    expect(isAccountIssueDetailResponse(detailResponse)).toBe(true);
    expect(isAccountIssueDetailResponse({ ...detailResponse, evidence: [] })).toBe(false);
    expect(isAccountIssueDetailResponse({
      ...detailResponse,
      issue: { ...issue, tool_mappings: [] },
    })).toBe(false);
  });

  it("uses canonical same-origin list and detail endpoints", async () => {
    const calls: Array<[string, RequestInit | undefined]> = [];
    const fetcher = async (input: string, init?: RequestInit) => {
      calls.push([input, init]);
      const payload = input.includes(`/issues/${issue.issue_id}`) ? detailResponse : listResponse;
      return new Response(JSON.stringify(payload), { status: 200 });
    };

    await listAccountIssues(project.id, audit.id, {
      category: "security",
      priority: "p0",
      sort: "title",
      order: "desc",
    }, fetcher);
    await getAccountIssue(project.id, audit.id, issue.issue_id, fetcher);

    expect(calls[0]?.[0]).toBe(
      `/api/account/projects/${project.id}/audits/${audit.id}/issues?category=security&priority=p0&sort=title&order=desc`,
    );
    expect(calls.every(([, init]) => init?.credentials === "same-origin")).toBe(true);
  });

  it("confines dynamic proxy paths and rejects duplicate or unknown filters", () => {
    expect(accountIssueListPath(project.id, audit.id, new URLSearchParams(
      "order=desc&sort=title&priority=p0&category=security",
    ))).toBe(
      `/v1/account/projects/${project.id}/audits/${audit.id}/issues?category=security&priority=p0&sort=title&order=desc`,
    );
    expect(accountIssueListPath(project.id, audit.id, new URLSearchParams(
      "category=security&category=seo",
    ))).toBeNull();
    expect(accountIssueListPath(project.id, audit.id, new URLSearchParams("unknown=1"))).toBeNull();
    expect(accountIssueDetailPath(project.id, audit.id, issue.issue_id)).toBe(
      `/v1/account/projects/${project.id}/audits/${audit.id}/issues/${issue.issue_id}`,
    );
    expect(accountIssueDetailPath(project.id, audit.id, "../secret")).toBeNull();
  });
});
