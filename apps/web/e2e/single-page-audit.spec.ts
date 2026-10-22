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

  test("follow-up checks keep the submitted query even when public evidence is redacted", async ({ page }) => {
    await page.route("**/api/audits", (route) => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(result) }));
    await page.goto("/en/tools/single-page-audit?url=https%3A%2F%2Fexample.com%2F%3Fp%3D42");
    await expect(page.getByRole("heading", { name: "Technical audit result" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Run in-depth Google PageSpeed/ })).toHaveAttribute("href", "/en/tools/core-web-vitals-checker?url=https%3A%2F%2Fexample.com%2F%3Fp%3D42");
    await expect(page.getByRole("link", { name: /Open tool.*Meta Tags/ })).toHaveAttribute("href", "/en/tools/meta-tags-checker?url=https%3A%2F%2Fexample.com%2F%3Fp%3D42");
  });

  test("clipboard denial shows an error without claiming success", async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", { value: { writeText: () => Promise.reject(new DOMException("Denied", "NotAllowedError")) } }));
    await page.route("**/api/audits", (route) => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(result) }));
    await page.goto("/en/tools/single-page-audit?url=https%3A%2F%2Fexample.com%2Fpage");
    await page.getByRole("button", { name: "Copy audit URL", exact: true }).click();
    await expect(page.getByText("Could not copy. Check browser clipboard permissions.", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Link copied", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Copy code", exact: true }).first().click();
    await expect(page.getByText("Could not copy. Check browser clipboard permissions.", { exact: true })).toHaveCount(2);
    await expect(page.getByRole("button", { name: "Copied!", exact: true })).toHaveCount(0);
  });

  for (const locale of ["ru", "en"] as const) {
    for (const formIndex of [0, 1]) {
    test(`${locale} footer audit entry form ${formIndex} launches the entered domain without a second submit`, async ({ page }) => {
      const requests: unknown[] = [];
      await page.route("**/api/audits", async (route) => {
        requests.push(route.request().postDataJSON());
        await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(result) });
      });
      const prefix = locale === "ru" ? "" : "/en";
      await page.goto(prefix || "/");
      await page.locator(`footer a[href="${prefix}/audit"]`).click();
      const form = page.locator(".wd-audit-url-form").nth(formIndex);
      await form.locator("input").fill("example.com/page");
      await form.locator("button").click();
      await expect(page.getByRole("heading", { name: locale === "ru" ? "Результат технического аудита" : "Technical audit result" })).toBeVisible();
      await expect(page.locator(".single-audit-input input")).toHaveValue("https://example.com/page");
      expect(requests).toEqual([{ url: "https://example.com/page" }]);
    });
    }
  }

  test("can retry the same target after a completed check", async ({ page }) => {
    let requests = 0;
    await page.route("**/api/audits", async (route) => {
      requests += 1;
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(result) });
    });
    await page.goto("/en/tools/single-page-audit?url=https%3A%2F%2Fexample.com%2Fpage");
    await expect(page.getByRole("heading", { name: "Technical audit result" })).toBeVisible();
    await page.getByRole("button", { name: "Audit page", exact: true }).click();
    await expect.poll(() => requests).toBe(2);
    await expect(page.getByRole("heading", { name: "Technical audit result" })).toBeVisible();
  });

  test("shows actual failing and field CWV measurements supplied by the backend", async ({ page }) => {
    const measured = structuredClone(result);
    measured.run.checks.push({ id: "performance.pagespeed_mobile", name: "PageSpeed", category: "performance", status: "warning" });
    Object.assign(measured.run.checks.at(-1)!, { evidence: [
      { kind: "tool_output", source: "google.pagespeed.mobile.largest-contentful-paint", value: "4.8 s", metadata: { status: "fail", source: "lab" } },
      { kind: "tool_output", source: "google.pagespeed.mobile.interaction_to_next_paint", value: "380 ms", metadata: { status: "warning", source: "field" } },
    ] });
    await page.route("**/api/audits", (route) => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(measured) }));
    await page.goto("/en/tools/single-page-audit?url=https%3A%2F%2Fexample.com%2Fpage");
    const performance = page.locator('section[aria-labelledby="audit-performance-title"]');
    await expect(performance.getByText("4.8 s", { exact: true })).toBeVisible();
    await expect(performance.getByText("380 ms", { exact: true })).toBeVisible();
    await expect(performance.getByText("Field data · warning", { exact: true })).toBeVisible();
    await expect(performance.getByText("No data", { exact: true })).toHaveCount(2);
  });

  for (const locale of ["ru", "en"] as const) {
    for (const instance of ["hero", "final"] as const) {
      test(`${locale} ${instance} carries the URL into an automatic audit exactly once`, async ({ page }) => {
        const requests: unknown[] = [];
        await page.route("**/api/audits", async (route) => {
          requests.push(route.request().postDataJSON());
          await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(result) });
        });
        await page.goto(locale === "ru" ? "/" : "/en");
        const form = page.locator(`#check-url-${instance}`);
        await form.locator("input").fill("example.com/page?x=1&y=2");
        await form.getByRole("button").click();
        await expect(page.getByRole("heading", { name: locale === "ru" ? "Результат технического аудита" : "Technical audit result" })).toBeVisible();
        await expect(page.locator(".single-audit-input input")).toHaveValue("https://example.com/page?x=1&y=2");
        expect(requests).toEqual([{ url: "https://example.com/page?x=1&y=2" }]);
      });
    }
  }

  test("query navigation to another target reruns the audit and updates the input", async ({ page }) => {
    const requests: unknown[] = [];
    await page.route("**/api/audits", async (route) => {
      requests.push(route.request().postDataJSON());
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(result) });
    });
    await page.goto("/en/tools/single-page-audit?url=https%3A%2F%2Fexample.com%2Fone");
    await expect(page.getByRole("heading", { name: "Technical audit result" })).toBeVisible();
    await page.evaluate(() => window.history.pushState(null, "", "?url=https%3A%2F%2Fexample.com%2Ftwo"));
    await expect(page.locator(".single-audit-input input")).toHaveValue("https://example.com/two");
    await expect.poll(() => requests).toEqual([{ url: "https://example.com/one" }, { url: "https://example.com/two" }]);
  });

  test("keeps progress indeterminate and never invents completed stages or CWV values", async ({ page }) => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => { release = resolve; });
    await page.route("**/api/audits", async (route) => {
      await pending;
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(result) });
    });
    await page.goto("/en/tools/single-page-audit?url=https%3A%2F%2Fexample.com%2Fpage");
    try {
      await expect(page.getByRole("button", { name: /Running/ })).toBeDisabled();
      await expect(page.locator('[role="progressbar"][aria-valuenow]')).toHaveCount(0);
      await expect(page.getByText("Completed", { exact: true })).toHaveCount(0);
    } finally { release(); }
    await expect(page.getByRole("heading", { name: "Technical audit result" })).toBeVisible();
    await expect(page.getByText("< 2.5 с", { exact: true })).toHaveCount(0);
    await expect(page.getByText("< 200 мс", { exact: true })).toHaveCount(0);
  });

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
    await expect(page.getByText("Google PageSpeed is included when available. No site crawl, local JavaScript rendering, or monitoring.")).toBeVisible();
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
    await expect(page.getByRole("heading", { name: "Отсутствует title", exact: true })).toBeVisible();
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
