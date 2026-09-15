import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { installBrowserGuard } from "./browser-guard";

const result = {
  contract_version: "webdiag.tool.lighthouse_network.v1",
  generated_at: "2026-08-14T00:00:00Z",
  requested_url: "https://example.com/",
  normalized_url: "https://example.com/",
  strategy: "mobile",
  available: true,
  lighthouse_version: "13.0.0",
  analysis_fetch_time: "2026-08-14T00:00:00Z",
  fetch_error: null,
  resources_available: true,
  request_count: 3,
  returned_request_count: 2,
  total_transfer_bytes: 20000,
  total_resource_bytes: 56000,
  resources: [
    { url: "https://example.com/", protocol: "h2", start_ms: 0, end_ms: 210.5, duration_ms: 210.5, transfer_bytes: 12000, resource_bytes: 32000, status_code: 200, mime_type: "text/html", resource_type: "document" },
    { url: "https://cdn.example.com/app.js", protocol: "h3", start_ms: 200, end_ms: 480, duration_ms: 280, transfer_bytes: 8000, resource_bytes: 24000, status_code: 200, mime_type: "application/javascript", resource_type: "script" },
  ],
  render_blocking_available: true,
  render_blocking_score: 0.42,
  render_blocking_display_value: "Potential savings of 350 ms",
  render_blocking_savings_ms: 350,
  render_blocking_items: [{ url: "https://example.com/private.js", total_bytes: 42000, wasted_bytes: 18000, wasted_ms: 350 }],
  recommendation: "Review the bounded provider evidence before making changes.",
};

test.describe("bounded Lighthouse network evidence", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;

  test.beforeEach(async ({ page }) => {
    assertBrowserClean = installBrowserGuard(page);
    await page.route("**/api/tools/lighthouse-network", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(result) }));
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  test("renders a bounded inert resource timeline in English", async ({ page }, testInfo) => {
    await page.goto("/en/tools/resource-waterfall-analyzer");
    await page.getByRole("button", { name: "Run check" }).click();

    await expect(page.getByRole("heading", { name: "Resource timeline", exact: true })).toBeVisible();
    await expect(page.getByText("2/3", { exact: true })).toBeVisible();
    await expect(page.getByText("https://cdn.example.com/app.js", { exact: true })).toBeVisible();
    await expect(page.locator("main")).not.toContainText("source=private");
    await expect(page.locator("main")).not.toContainText("token=secret");

    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    if (axe.violations.length > 0) {
      await testInfo.attach("axe-violations", { body: Buffer.from(JSON.stringify(axe.violations, null, 2)), contentType: "application/json" });
    }
    expect(axe.violations).toEqual([]);
  });

  test("keeps RU dark blocking evidence inside a narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => localStorage.setItem("webdiag-theme", "dark"));
    await page.goto("/tools/render-blocking-resources-checker");
    await page.getByRole("button", { name: "Запустить проверку" }).click();

    await expect(page.getByRole("heading", { name: "Блокирующие ресурсы", exact: true })).toBeVisible();
    await expect(page.getByText("Potential savings of 350 ms", { exact: true })).toBeVisible();
    await expect(page.getByText("https://example.com/private.js", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });

  test("distinguishes a missing provider audit from an empty pass", async ({ page }) => {
    await page.route("**/api/tools/lighthouse-network", (route) => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ...result, render_blocking_available: false, render_blocking_score: null, render_blocking_display_value: null, render_blocking_savings_ms: null, render_blocking_items: [], recommendation: "The exact audit is unavailable for this provider run." }),
    }));
    await page.goto("/en/tools/render-blocking-resources-checker");
    await page.getByRole("button", { name: "Run check" }).click();

    await expect(page.getByText("PageSpeed did not return the exact render-blocking-resources audit. WebDiag does not replace it with a heuristic.")).toBeVisible();
    await expect(page.locator("main")).not.toContainText("No blockers");
  });
});
