import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { installBrowserGuard } from "./browser-guard";

const result = {
  contract_version: "webdiag.tool.core_web_vitals.v2",
  generated_at: "2026-08-13T19:00:00Z",
  requested_url: "https://example.com/",
  normalized_url: "https://example.com/",
  strategy: "mobile",
  results: [{
    strategy: "mobile",
    available: true,
    performance_score: 91,
    field_data_available: true,
    field_overall_category: "FAST",
    lighthouse_version: "13.0.0",
    analysis_fetch_time: "2026-08-13T19:00:00Z",
    category_scores: { performance: 91, accessibility: 87, "best-practices": 100, seo: 92 },
    audit_findings: [
      { id: "color-contrast", category: "accessibility", title: "<script>window.lighthouseExecuted=true</script>", score: 0, score_display_mode: "binary", display_value: null, weight: 7 },
      { id: "render-blocking-resources", category: "performance", title: "Eliminate render-blocking resources", score: 0.42, score_display_mode: "numeric", display_value: "Potential savings of 350 ms", weight: 10 },
    ],
    metrics: [
      { id: "largest-contentful-paint", title: "Largest Contentful Paint", value: 2200, unit: "ms", display_value: "2.2 s", source: "lab", status: "pass" },
      { id: "interaction_to_next_paint", title: "Interaction to Next Paint", value: 180, unit: "ms", display_value: "180 ms", source: "field", status: "pass" },
    ],
    opportunities: [{ id: "uses-optimized-images", title: "Optimize images", display_value: "Potential savings of 450 ms", savings_ms: 450, score: 0.5 }],
    fetch_error: null,
  }],
  recommendation: "Review the failed and partial Lighthouse checks before rerunning the page.",
};

test.describe("PageSpeed Lighthouse workbench", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;

  test.beforeEach(async ({ page }) => {
    assertBrowserClean = installBrowserGuard(page);
    await page.route("**/api/tools/core-web-vitals", (route) => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(result),
    }));
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  test("renders four categories and an inert fix order in English", async ({ page }, testInfo) => {
    await page.goto("/en/tools/core-web-vitals-checker");
    await page.getByRole("button", { name: "Run check" }).click();

    await expect(page.getByRole("heading", { name: "Lighthouse categories" })).toBeVisible();
    await expect(page.getByText("Best practices", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Lighthouse fix order" })).toBeVisible();
    const card = page.locator(".pagespeed-tool .result-card");
    const metrics = page.locator(".pagespeed-tool .single-audit-metrics");
    const [cardBox, metricsBox] = await Promise.all([card.boundingBox(), metrics.boundingBox()]);
    expect(cardBox).not.toBeNull();
    expect(metricsBox).not.toBeNull();
    expect(metricsBox!.x + metricsBox!.width).toBeLessThanOrEqual(cardBox!.x + cardBox!.width);
    const findings = page.getByRole("list").filter({ has: page.getByText("Eliminate render-blocking resources") }).getByRole("listitem");
    await expect(findings.nth(0)).toContainText("<script>window.lighthouseExecuted=true</script>");
    await expect(findings.nth(1)).toContainText("Eliminate render-blocking resources");
    expect(await page.evaluate(() => (window as Window & { lighthouseExecuted?: boolean }).lighthouseExecuted)).toBeUndefined();

    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    if (axe.violations.length > 0) {
      await testInfo.attach("axe-violations", { body: Buffer.from(JSON.stringify(axe.violations, null, 2)), contentType: "application/json" });
    }
    expect(axe.violations).toEqual([]);
  });

  test("keeps the RU dark result inside a narrow mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => localStorage.setItem("webdiag-theme", "dark"));
    await page.goto("/tools/core-web-vitals-checker");
    await page.getByRole("button", { name: "Запустить проверку" }).click();

    await expect(page.getByRole("heading", { name: "Категории Lighthouse" })).toBeVisible();
    await expect(page.getByText("Что исправить по Lighthouse")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
