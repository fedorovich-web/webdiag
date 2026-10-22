import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getAccountSiteAudit, listAccountSiteAudits, startAccountSiteAudit } from "./account-workspace-client";
import { isAccountSiteAuditDetail } from "./account-workspace-contract";
import { accountSiteAuditPath } from "./account-workspace-proxy";
import { AccountCrawlSummary } from "./account-crawl-summary";

const projectId = "11111111-1111-4111-8111-111111111111";
const jobId = "22222222-2222-4222-8222-222222222222";
const counts = { critical: 0, high: 1, medium: 0, low: 0, info: 0 };
const result = {
  contract_version: "webdiag.site_audit.result.v1" as const,
  origin: "https://example.com",
  pages: [{ url: "https://example.com/", status_code: 200, title: "Home", meta_description: null,
    internal_links: [], audit_score: 70, issue_count: 1, issues_by_severity: counts }] as const,
  page_failures: [{ url: "https://example.com/unavailable", code: "fetch_failed" as const }],
  page_limit: 100,
  page_budget_exhausted: false,
  sitemap_url: null,
  sitemap_url_count: 0,
  sitemap_complete: false,
  excluded_query_url_count: 2,
  duplicate_titles: [], duplicate_descriptions: [], orphan_urls: [],
  audit_summary: { pages_audited: 1, pages_with_issues: 1, unique_issue_count: 1,
    issue_occurrence_count: 1, occurrences_by_severity: counts },
  issues: [{ issue_id: "http.test", check_id: "http.status", category: "http", severity: "high",
    priority: "P1", title: "Server error", description: "Observed server failure",
    affected_urls: ["https://example.com/"], affected_url_count: 1,
    recommendation: { summary: "Restore the response", steps: ["Inspect server logs"], expected_impact: null } }],
  completed_at: "2026-10-21T12:00:00Z",
};
const detail = {
  contract_version: "webdiag.account.site_audit_detail.v1" as const,
  job: { id: jobId, project_id: projectId, origin: result.origin, state: "succeeded" as const,
    error_code: null, created_at: result.completed_at, updated_at: result.completed_at },
  result,
};

describe("site audit preserves full results", () => {
  it.each(["ru", "en"] as const)("explains an unavailable robots policy in %s", (locale) => {
    const html = renderToStaticMarkup(createElement(AccountCrawlSummary, {
      locale, historyCount: 1, detail: {
        ...detail, result: null,
        job: { ...detail.job, state: "failed", error_code: "crawl_robots_unavailable" },
      },
    }));
    expect(html).toContain(locale === "ru"
      ? "Не удалось получить robots.txt из-за ошибки сервера или соединения. Обход остановлен."
      : "robots.txt could not be fetched due to a server or connection error. The crawl stopped.");
  });
  it("uses the site-audit API and validates page findings and coverage", async () => {
    const requests: string[] = [];
    const fetcher = async (path: string, init?: RequestInit) => {
      requests.push(`${init?.method} ${path}`);
      return Response.json(path.endsWith(jobId) || init?.method === "POST" ? detail : {
        contract_version: "webdiag.account.site_audit_list.v1", jobs: [detail.job],
      });
    };
    expect(await getAccountSiteAudit(projectId, jobId, fetcher)).toEqual(detail);
    expect((await listAccountSiteAudits(projectId, fetcher)).jobs).toEqual([detail.job]);
    expect(await startAccountSiteAudit(projectId, fetcher)).toEqual(detail);
    expect(requests).toEqual([
      `GET /api/account/projects/${projectId}/site-audits/${jobId}`,
      `GET /api/account/projects/${projectId}/site-audits`,
      `POST /api/account/projects/${projectId}/site-audits`,
    ]);
    expect(isAccountSiteAuditDetail({ ...detail, result: { ...result, audit_summary: null } })).toBe(false);
    expect(isAccountSiteAuditDetail({ ...detail, result: { ...result, excluded_query_url_count: -1 } })).toBe(false);
    expect(isAccountSiteAuditDetail({ ...detail, result: { ...result, pages: [{ ...result.pages[0], audit_score: null }] } })).toBe(false);
    expect(isAccountSiteAuditDetail({ ...detail, result: { ...result, origin: "https://other.example" } })).toBe(false);
  });

  it("bounds the proxy to valid owned resource identifiers", () => {
    expect(accountSiteAuditPath(projectId, jobId)).toBe(`/v1/account/projects/${projectId}/site-audits/${jobId}`);
    expect(accountSiteAuditPath("../internal", jobId)).toBeNull();
    expect(accountSiteAuditPath(projectId, "x?secret=y")).toBeNull();
  });

  it.each(["ru", "en"] as const)("shows partial coverage, findings, and actual failures in %s", (locale) => {
    const html = renderToStaticMarkup(createElement(AccountCrawlSummary, { locale, detail, historyCount: 1 }));
    expect(html).toContain(locale === "ru" ? "Частичный результат" : "Partial result");
    expect(html).toContain(locale === "ru" ? "URL с query пропущено: 2" : "Query URLs excluded: 2");
    expect(html).toContain(locale === "ru" ? "Sitemap не проверен полностью" : "Sitemap coverage is incomplete");
    expect(html).toContain("Server error");
    expect(html).toContain("Restore the response");
    expect(html).toContain("https://example.com/unavailable");
    expect(html).toContain(locale === "ru" ? "Не оценено" : "Not assessed");
    expect(html).not.toContain(locale === "ru" ? ">Готово<" : ">Completed<");
  });

  it("treats an audited HTTP error page as incomplete coverage", () => {
    const failedHttpResult = {
      ...result,
      sitemap_complete: true,
      excluded_query_url_count: 0,
      page_failures: [],
      pages: [...result.pages, { ...result.pages[0], url: "https://example.com/section", status_code: 503 }],
      audit_summary: { ...result.audit_summary, pages_audited: 2, pages_with_issues: 2 },
    };
    const html = renderToStaticMarkup(createElement(AccountCrawlSummary, {
      locale: "en", detail: { ...detail, result: failedHttpResult }, historyCount: 1,
    }));
    expect(html).toContain("Partial result");
    expect(html).toContain("Pages with non-success HTTP responses: 1");
    expect(html).toContain("Not assessed");
    expect(html).toContain("HTTP 503");
  });

  it.each([
    ["http.status.server_error", "Сервер вернул ошибку"],
    ["site.metadata.duplicate_title", "Повторяющиеся title"],
    ["site.metadata.duplicate_description", "Повторяющиеся метаописания"],
    ["site.crawlability.orphan_candidate", "URL из sitemap без обнаруженных внутренних ссылок"],
    ["site.http.fetch_failed", "Не удалось загрузить страницы"],
    ["site.crawlability.robots_disallowed", "Страницы исключены в robots.txt"],
    ["site.http.non_html", "Обнаруженные URL не являются HTML-страницами"],
  ])("localizes %s without changing stored findings or English output", (issueId, title) => {
    const sourceIssue = result.issues[0];
    if (!sourceIssue) throw new Error("Missing fixture issue");
    const issue = { ...sourceIssue, issue_id: issueId };
    const localizedDetail = { ...detail, result: { ...result, issues: [issue] } };
    const ru = renderToStaticMarkup(createElement(AccountCrawlSummary, {
      locale: "ru", detail: localizedDetail, historyCount: 1,
    }));
    expect(ru).toContain(title);
    expect(ru).not.toContain("Observed server failure");
    expect(ru).not.toContain("Restore the response");
    expect(ru).not.toContain("Inspect server logs");
    expect(ru).toContain("Высокая");
    expect(ru).toContain("https://example.com/");
    const en = renderToStaticMarkup(createElement(AccountCrawlSummary, {
      locale: "en", detail: localizedDetail, historyCount: 1,
    }));
    expect(en).toContain("Server error");
    expect(en).toContain("Observed server failure");
    expect(en).toContain("Restore the response");
    expect(issue.title).toBe("Server error");
  });
});
