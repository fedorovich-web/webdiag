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
});
