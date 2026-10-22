import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AccountCrawlSummary } from "./account-crawl-summary";
import type { AccountCrawlDetail } from "./account-workspace-contract";
import * as client from "./account-workspace-client";

const projectId = "11111111-1111-4111-8111-111111111111";
const jobId = "22222222-2222-4222-8222-222222222222";
const legacy: AccountCrawlDetail = {
  contract_version: "webdiag.account.crawl_detail.v1",
  job: { id: jobId, project_id: projectId, origin: "https://example.com", state: "succeeded",
    error_code: null, created_at: "2026-08-13T12:00:00Z", updated_at: "2026-08-13T12:01:00Z" },
  result: { contract_version: "webdiag.crawl.result.v1", origin: "https://example.com",
    pages: [{ url: "https://example.com/", status_code: 200, title: "Home", meta_description: null, internal_links: [] }],
    page_failures: [], page_limit: 25, page_budget_exhausted: true,
    sitemap_url: "https://example.com/sitemap.xml", sitemap_url_count: 2,
    duplicate_titles: [{ value: "Duplicate", urls: ["https://example.com/a", "https://example.com/b"] }],
    duplicate_descriptions: [], orphan_urls: ["https://example.com/unlinked"], completed_at: "2026-08-13T12:01:00Z" },
};

describe("project page-check history compatibility", () => {
  it("keeps the persisted historical crawl readable after the full-audit version response", async () => {
    const fetcher = async (path: string) => path.endsWith(`/site-audits/${jobId}`)
      ? Response.json({ detail: { code: "site_audit_result_version_unavailable", message: "Historical result" } }, { status: 409 })
      : path.endsWith(`/crawls/${jobId}`) ? Response.json(legacy) : new Response(null, { status: 404 });
    await expect(client.getAccountPageCheck(projectId, jobId, fetcher)).resolves.toEqual(legacy);
  });

  it.each([
    [401, "account_authentication_required"], [404, "crawl_job_not_found"],
    [409, "crawl_result_unavailable"], [502, "site_audit_result_version_unavailable"],
  ])("preserves %s/%s errors instead of substituting legacy data", async (status, code) => {
    const fetcher = async (path: string) => {
      if (path.includes("/crawls/")) throw new Error("Legacy fallback must not be called");
      return Response.json({ detail: { code, message: "Rejected" } }, { status });
    };
    await expect(client.getAccountPageCheck(projectId, jobId, fetcher))
      .rejects.toMatchObject({ status, code });
  });

  it("still rejects a malformed legacy response rather than treating it as a report", async () => {
    const fetcher = async (path: string) => path.includes("/site-audits/")
      ? Response.json({ detail: { code: "site_audit_result_version_unavailable", message: "Historical result" } }, { status: 409 })
      : Response.json({ ...legacy, result: { ...legacy.result, pages: [{ url: "https://example.com/" }] } });
    await expect(client.getAccountPageCheck(projectId, jobId, fetcher))
      .rejects.toMatchObject({ code: "account_invalid_response" });
  });

  it("returns current full-audit data without reading a legacy projection", async () => {
    const full = { contract_version: "webdiag.account.site_audit_detail.v1", job: legacy.job, result: null };
    const fetcher = async (path: string) => {
      if (path.includes("/crawls/")) throw new Error("Legacy fallback must not be called");
      return Response.json(full);
    };
    await expect(client.getAccountPageCheck(projectId, jobId, fetcher)).resolves.toEqual(full);
  });

  it("propagates authentication loss from the legacy endpoint", async () => {
    const fetcher = async (path: string) => path.includes("/site-audits/")
      ? Response.json({ detail: { code: "site_audit_result_version_unavailable", message: "Historical result" } }, { status: 409 })
      : Response.json({ detail: { code: "account_unauthenticated", message: "Sign in" } }, { status: 401 });
    await expect(client.getAccountPageCheck(projectId, jobId, fetcher))
      .rejects.toMatchObject({ code: "account_unauthenticated", status: 401 });
  });

  it.each(["ru", "en"] as const)("labels historical data honestly and shows its stored findings in %s", (locale) => {
    let html = "";
    expect(() => { html = renderToStaticMarkup(createElement(AccountCrawlSummary, {
      locale, detail: legacy, historyCount: 1,
    })); }).not.toThrow();
    expect(html).toContain(locale === "ru" ? "Историческая проверка страниц" : "Historical page check");
    expect(html).toContain(locale === "ru"
      ? "Это сохранённый результат прежнего обхода. Оценки и замечания полного аудита в нём не сохранены."
      : "This is a saved result from the previous crawl. Full audit scores and findings were not stored.");
    expect(html).toContain("Duplicate");
    expect(html).toContain("https://example.com/unlinked");
    expect(html).toContain(locale === "ru"
      ? "Обход был ограничен; лимит страниц: 25. Результат не описывает весь сайт."
      : "The crawl was limited; page limit: 25. The result does not describe the whole site.");
    expect(html).not.toContain("/100");
    expect(html).not.toContain(locale === "ru" ? "Типов замечаний" : "Finding types");
  });
});
