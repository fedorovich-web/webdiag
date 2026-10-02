import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { installBrowserGuard } from "./browser-guard";

const wcagTags = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

test.describe("accessibility smoke", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;

  test.beforeEach(async ({ page }) => {
    assertBrowserClean = installBrowserGuard(page);
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  for (const route of ["/", "/en/tools/image-resizer"] as const) {
    test(`${route} has no automated WCAG 2.2 AA violations`, async ({ page }, testInfo) => {
      await page.goto(route);
      const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
      if (results.violations.length > 0) {
        await testInfo.attach("axe-violations", {
          body: Buffer.from(JSON.stringify(results.violations, null, 2)),
          contentType: "application/json",
        });
      }
      expect(results.violations).toEqual([]);
    });
  }

  test("keyboard focus reaches the language control in the light-only mobile menu", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();

    await page.locator(".mobile-menu summary").click();
    await expect(page.getByRole("switch")).toHaveCount(0);

    const englishVersion = page.getByRole("link", { name: "English version" });
    await englishVersion.focus();
    await expect(englishVersion).toBeFocused();
  });
});
