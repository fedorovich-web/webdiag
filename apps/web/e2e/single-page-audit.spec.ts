import { expect, test } from "@playwright/test";
import { installBrowserGuard } from "./browser-guard";

const result = {
  contractVersion: "webdiag.web.audit_result.v1",
  sourceContractVersion: "webdiag.audit.snapshot.v1",
  generatedAt: "2026-08-13T18:00:00Z",
  job: { id: "job-fixture", status: "succeeded", target: { originalUrl: "https://example.com/page", normalizedUrl: "https://example.com/page", hostname: "example.com", scope: "single_url" } },
  summary: { status: "succeeded", score: 76, checkCount: 13, issueCount: 2, checksByStatus: { passed: 11, warning: 2 }, issuesBySeverity: { high: 1, medium: 1 }, issuesByPriority: { p0: 1, p2: 1 }, highestSeverity: "high", topPriority: "p0" },
  run: {
    id: "run-fixture", status: "succeeded", score: 76,
    checks: [
      { id: "http.status", name: "HTTP status", category: "http", status: "passed" },
      { id: "metadata.title", name: "Title tag", category: "metadata", status: "warning" },
      { id: "security.headers", name: "Security headers", category: "security", status: "warning" },
    ],
    issues: [
      { id: "metadata.title.missing", checkId: "metadata.title", category: "metadata", severity: "medium", priority: "p2", title: "Title is missing", description: "The page has no title element.", affectedUrls: ["https://example.com/page"], recommendation: { summary: "Add a concise title.", steps: ["Add one title element to the document head."], expectedImpact: "The page can be identified in search results." } },
      { id: "security.headers.missing", checkId: "security.headers", category: "security", severity: "high", priority: "p0", title: "<script>window.auditExecuted=true</script>", description: "Security header policy is incomplete.", affectedUrls: ["https://example.com/page"], recommendation: { summary: "Define the missing response headers.", steps: [], expectedImpact: null } },
    ],
  },
};

test.describe("single-page technical audit", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;
  let expectsAdmissionRejection = false;
  test.beforeEach(async ({ page }) => {
    expectsAdmissionRejection = false;
    assertBrowserClean = installBrowserGuard(page, (error) => expectsAdmissionRejection && (
      error === "console.error: Failed to load resource: the server responded with a status of 429 (Too Many Requests)"
      || (error.startsWith("http 429:") && error.endsWith("/api/audits"))
    ));
  });
  test.afterEach(async ({}, testInfo) => { await assertBrowserClean(testInfo); });

  test("renders the bounded audit result in fix order and keeps API text inert", async ({ page }) => {
    await page.route("**/api/audits", (route) => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(result) }));
    await page.goto("/en/tools/single-page-audit");
    await expect(page.getByRole("heading", { level: 1, name: "Single Page Technical Audit" })).toBeVisible();
    await page.getByLabel("Page URL").fill("example.com/page");
    await page.getByRole("button", { name: "Audit page" }).click();
    await expect(page.getByRole("heading", { name: "Technical audit result" })).toBeVisible();
    const issueHeadings = page.locator(".single-audit-issue-list h4");
    await expect(issueHeadings.nth(0)).toHaveText("<script>window.auditExecuted=true</script>");
    await expect(issueHeadings.nth(1)).toHaveText("Title is missing");
    expect(await page.evaluate(() => (window as Window & { auditExecuted?: boolean }).auditExecuted)).toBeUndefined();
    await expect(page.getByText("No site crawl, JavaScript rendering, Lighthouse, or monitoring.")).toBeVisible();
  });

  test("keeps the RU dark result inside a narrow mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => localStorage.setItem("webdiag-theme", "dark"));
    await page.route("**/api/audits", (route) => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(result) }));
    await page.goto("/tools/single-page-audit");
    await page.getByLabel("URL страницы").fill("https://example.com/page");
    await page.getByRole("button", { name: "Проверить страницу" }).click();
    await expect(page.getByRole("heading", { name: "Результат технического аудита" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await expect(page.getByText("Отсутствует title")).toBeVisible();
  });

  test("localizes the bounded admission error without exposing backend detail", async ({ page }) => {
    expectsAdmissionRejection = true;
    await page.route("**/api/audits", (route) => route.fulfill({
      status: 429,
      contentType: "application/json",
      headers: { "retry-after": "37" },
      body: JSON.stringify({ detail: { code: "audit_rate_limited", message: "Public audit rate limit reached." } }),
    }));
    await page.goto("/tools/single-page-audit");
    await page.getByLabel("URL страницы").fill("https://example.com/page");
    await page.getByRole("button", { name: "Проверить страницу" }).click();
    await expect(page.locator(".tool-error[role=alert]")).toHaveText("Достигнут лимит публичных проверок. Повторите попытку позже.");
    await expect(page.getByText("Public audit rate limit reached.")).toHaveCount(0);
  });
});
