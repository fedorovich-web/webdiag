import { expect, test } from "@playwright/test";
import { installBrowserGuard } from "./browser-guard";

test.describe("tool editorial pages", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;

  test.beforeEach(async ({ page }) => {
    assertBrowserClean = installBrowserGuard(page);
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  for (const route of ["/tools/json-formatter-validator", "/en/tools/image-resizer", "/tools/uuid-generator"] as const) {
    test(`${route} keeps the working tool before the explanatory content`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator(".tool-workspace")).toBeVisible();
      await expect(page.locator(".processing-note")).toBeVisible();
      await expect(page.locator(".tool-editorial-main > section")).toHaveCount(5);
      await expect(page.locator(".limitations-card")).toBeVisible();
      await expect(page.locator(".related-tools-card a")).toHaveCount(4);

      const order = await page.evaluate(() => {
        const workspace = document.querySelector(".tool-workspace");
        const editorial = document.querySelector(".tool-editorial-layout");
        return Boolean(workspace && editorial && (workspace.compareDocumentPosition(editorial) & Node.DOCUMENT_POSITION_FOLLOWING));
      });
      expect(order).toBe(true);
    });
  }

  for (const locale of ["ru", "en"] as const) {
    test(`${locale} canonical shows invalid evidence in the selected language`, async ({ page }) => {
      await page.route("**/api/tools/canonical", (route) => route.fulfill({ json: {
        contract_version: "webdiag.tool.canonical.v1",
        generated_at: "2026-10-21T12:00:00Z",
        requested_url: "https://example.com/page",
        final_url: "https://example.com/page",
        status_code: 200,
        content_type: "text/html",
        canonical_url: "https://[invalid",
        resolved_canonical_url: null,
        canonical_present: true,
        canonical_is_absolute: null,
        canonical_matches_final_url: false,
        canonical_host_matches_final_url: null,
        has_noindex: false,
        redirect_count: 0,
        recommendation: "Canonical URL is invalid or exceeds the supported length. Use a valid HTTP or HTTPS URL for the preferred page.",
      } }));
      await page.goto(`${locale === "en" ? "/en" : ""}/tools/canonical-checker`);
      await page.getByPlaceholder("https://example.com/catalog/page").fill("https://example.com/page");
      await page.getByRole("button", { name: locale === "ru" ? "Проверить canonical" : "Check canonical", exact: true }).click();
      await expect(page.locator(".canonical-checker-recommendation")).toContainText(locale === "ru" ? "некорректен" : "invalid");
      await expect(page.locator(".canonical-checker-result .status-badge")).toHaveClass(/is-danger/);
    });
  }
});
