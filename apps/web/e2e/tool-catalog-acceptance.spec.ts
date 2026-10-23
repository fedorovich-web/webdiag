import { expect, test } from "@playwright/test";
import { publicTools } from "@webdiag/tool-registry";
import { installBrowserGuard } from "./browser-guard";

for (const locale of ["ru", "en"] as const) {
  for (const tool of publicTools) {
    test(`${locale}/${tool.slug} opens a usable workspace on mobile`, async ({ page }, testInfo) => {
      const assertBrowserClean = installBrowserGuard(page);
      await page.setViewportSize({ width: 390, height: 844 });
      const path = `${locale === "en" ? "/en" : ""}/tools/${tool.slug}`;
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toBeVisible();
      const workspace = page.locator(".tool-workspace");
      await expect(workspace).toBeVisible();
      const control = workspace.locator('input:not([type="hidden"]):enabled, textarea:enabled, select:enabled, button:enabled, a[href]').first();
      await expect(control).toBeVisible();
      await control.focus();
      await expect(control).toBeFocused();
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
      }));
      expect(dimensions.content, "Tool controls must stay within the mobile page").toBeLessThanOrEqual(dimensions.viewport + 1);
      await assertBrowserClean(testInfo);
    });
  }
}
