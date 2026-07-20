import { expect, test } from "@playwright/test";
import { installBrowserGuard } from "./browser-guard";

const views = [
  { name: "home-ru-light", route: "/", width: 1440, height: 900, theme: "light" },
  { name: "home-ru-dark", route: "/", width: 1440, height: 900, theme: "dark" },
  { name: "home-en-light", route: "/en", width: 1440, height: 900, theme: "light" },
  { name: "catalog-ru-desktop", route: "/tools", width: 1440, height: 900, theme: "light" },
  { name: "catalog-ru-mobile", route: "/tools", width: 390, height: 844, theme: "light" },
  { name: "json-tool-desktop", route: "/tools/json-formatter-validator", width: 1440, height: 900, theme: "light" },
  { name: "image-resizer-desktop", route: "/en/tools/image-resizer", width: 1440, height: 900, theme: "light" },
  { name: "narrow-header-menu", route: "/en", width: 320, height: 800, theme: "light", menu: true },
] as const;

test.describe("approved visual baselines", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;

  test.beforeEach(async ({ page }) => {
    assertBrowserClean = installBrowserGuard(page);
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  for (const view of views) {
    test(view.name, async ({ page }) => {
      await page.setViewportSize({ width: view.width, height: view.height });
      await page.addInitScript((theme) => localStorage.setItem("webdiag-theme", theme), view.theme);
      await page.goto(view.route);
      if ("menu" in view && view.menu) await page.locator(".mobile-menu summary").click();
      await expect(page).toHaveScreenshot(`${view.name}.png`, {
        fullPage: !view.name.includes("header-menu"),
        animations: "disabled",
        caret: "hide",
        maxDiffPixelRatio: 0.002,
      });
    });
  }
});
