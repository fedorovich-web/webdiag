import { expect, test } from "@playwright/test";
import { installBrowserGuard } from "./browser-guard";

const viewports = [
  { name: "desktop compact", width: 1024, height: 768 },
  { name: "tablet portrait", width: 768, height: 1024 },
  { name: "200 percent reflow equivalent", width: 640, height: 720 },
] as const;

test.describe("responsive reflow", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;

  test.beforeEach(async ({ page }) => {
    assertBrowserClean = installBrowserGuard(page);
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  for (const viewport of viewports) {
    test(`${viewport.name} keeps home, catalog, and tool routes within the viewport`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      for (const route of ["/", "/tools", "/tools/json-formatter-validator"]) {
        await page.goto(route);
        const metrics = await page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
        }));
        expect(metrics.scrollWidth, `${route} overflows at ${viewport.width}px`).toBeLessThanOrEqual(metrics.clientWidth + 1);
        await expect(page.locator("h1")).toHaveCount(1);
      }
    });
  }
});
