import { expect, test } from "@playwright/test";
import { installBrowserGuard } from "./browser-guard";

test.describe("production browser smoke", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;

  test.beforeEach(async ({ page }) => {
    assertBrowserClean = installBrowserGuard(page);
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  test("desktop layouts declare smooth-scroll handling and hydrate cleanly", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute("data-scroll-behavior", "smooth");
    await expect(page.locator("body")).toHaveAttribute("data-theme-ready", "true");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const iconResponse = await page.request.get("/icon.svg");
    expect(iconResponse.status()).toBe(200);
  });

  test("self-hosted Manrope is loaded from the optimized local WOFF2", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);

    const typography = await page.evaluate(() => ({
      family: getComputedStyle(document.body).fontFamily,
      loaded: document.fonts.check('16px "Manrope Web"'),
    }));
    expect(typography.family).toContain("Manrope Web");
    expect(typography.loaded).toBe(true);

    const fontResponse = await page.request.get("/fonts/manrope-ru-en-400-700.woff2");
    expect(fontResponse.status()).toBe(200);
    expect(fontResponse.headers()["content-type"]).toContain("font/woff2");
    expect((await fontResponse.body()).byteLength).toBeLessThan(35_000);
  });

  test("mobile header has no horizontal overflow and keeps controls usable", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scroll).toBe(dimensions.viewport);

    const themeBox = await page.getByRole("switch", { name: "Тёмная тема" }).boundingBox();
    const menu = page.locator(".mobile-menu summary");
    const menuBox = await menu.boundingBox();
    expect(themeBox?.height).toBeGreaterThanOrEqual(44);
    expect(menuBox?.height).toBeGreaterThanOrEqual(44);
    await menu.click();
    const localeBox = await page.getByRole("navigation", { name: "Выбор языка" }).boundingBox();
    expect(localeBox?.height).toBeGreaterThanOrEqual(44);
  });

  test("narrow mobile viewport remains free of horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/en/tools/image-resizer");

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scroll).toBe(dimensions.viewport);
    await expect(page.getByRole("switch", { name: "Dark theme" })).toBeVisible();
    await page.locator(".mobile-menu summary").click();
    await expect(page.getByRole("navigation", { name: "Language selection" })).toBeVisible();
  });
});
