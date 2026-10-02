import { expect, test } from "@playwright/test";
import { installBrowserGuard } from "./browser-guard";

test.describe("bounded crawler public entry points", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;

  test.beforeEach(async ({ page }) => {
    assertBrowserClean = installBrowserGuard(page);
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  for (const scenario of [
    { route: "/tools/whole-site-audit", heading: "Ограниченный аудит сайта", href: "/account" },
    { route: "/en/tools/duplicate-meta-checker", heading: "Duplicate Titles and Descriptions", href: "/en/account" },
    { route: "/tools/orphan-page-finder", heading: "Кандидаты без внутренних ссылок", href: "/account" },
  ] as const) {
    test(`${scenario.route} opens the authenticated project flow without a fake URL form`, async ({ page }) => {
      await page.goto(scenario.route);

      await expect(page.getByRole("heading", { level: 1, name: scenario.heading })).toBeVisible();
      await expect(page.locator(".account-crawler-entry input")).toHaveCount(0);
      await expect(page.locator(".account-crawler-entry form")).toHaveCount(0);
      await expect(page.locator(".account-crawler-entry-action")).toContainText("25 HTML");
      await expect(page.locator(`.account-crawler-entry a[href='${scenario.href}']`)).toBeVisible();
    });
  }
});
