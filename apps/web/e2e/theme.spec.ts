import { expect, test } from "@playwright/test";
import { installBrowserGuard } from "./browser-guard";

const storageKey = "webdiag-theme";

type FirstPaintSample = { theme: string | undefined; background: string };

declare global {
  interface Window {
    __webdiagFirstPaint?: Promise<FirstPaintSample>;
  }
}

async function installFirstPaintProbe(page: import("@playwright/test").Page, stored: string | null) {
  await page.addInitScript(({ key, value }) => {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
    window.__webdiagFirstPaint = new Promise((resolve) => {
      requestAnimationFrame(() => {
        resolve({
          theme: document.body?.dataset.theme,
          background: document.body ? getComputedStyle(document.body).backgroundColor : "",
        });
      });
    });
  }, { key: storageKey, value: stored });
}

async function firstPaint(page: import("@playwright/test").Page) {
  return page.evaluate(() => window.__webdiagFirstPaint);
}

test.describe("explicit theme model", () => {
  let assertBrowserClean: Awaited<ReturnType<typeof installBrowserGuard>>;

  test.beforeEach(async ({ page }) => {
    assertBrowserClean = installBrowserGuard(page);
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  test("first visit stays light even when the operating system prefers dark", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await installFirstPaintProbe(page, null);
    await page.goto("/");

    await expect(page.locator("body")).toHaveAttribute("data-theme", "light");
    await expect(page.getByRole("switch", { name: "Тёмная тема" })).toHaveAttribute("aria-checked", "false");
    expect(await firstPaint(page)).toEqual({ theme: "light", background: "rgb(244, 246, 251)" });
    expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeNull();
  });

  test("stored dark is applied before first paint and survives reload", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await installFirstPaintProbe(page, "dark");
    await page.goto("/");

    expect(await firstPaint(page)).toEqual({ theme: "dark", background: "rgb(8, 12, 16)" });
    await expect(page.locator("body")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("switch", { name: "Тёмная тема" })).toHaveAttribute("aria-checked", "true");
    await page.reload();
    await expect(page.locator("body")).toHaveAttribute("data-theme", "dark");
  });

  test("legacy values migrate to light", async ({ page }) => {
    await installFirstPaintProbe(page, "automatic");
    await page.goto("/");

    await expect(page.locator("body")).toHaveAttribute("data-theme", "light");
    expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe("light");
  });

  test("keyboard toggle persists and ignores later OS changes", async ({ page }) => {
    await page.goto("/");
    await page.evaluate((key) => localStorage.removeItem(key), storageKey);
    await page.reload();
    const themeSwitch = page.getByRole("switch", { name: "Тёмная тема" });

    await themeSwitch.focus();
    await page.keyboard.press("Space");
    await expect(themeSwitch).toHaveAttribute("aria-checked", "true");
    await expect(page.locator("body")).toHaveAttribute("data-theme", "dark");
    expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe("dark");

    await page.emulateMedia({ colorScheme: "light" });
    await expect(page.locator("body")).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(page.locator("body")).toHaveAttribute("data-theme", "dark");
  });

  test("reduced motion keeps the control functional", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await installFirstPaintProbe(page, null);
    await page.goto("/en");

    const themeSwitch = page.getByRole("switch", { name: "Dark theme" });
    await themeSwitch.click();
    await expect(themeSwitch).toHaveAttribute("aria-checked", "true");
    expect(await themeSwitch.evaluate((element) => getComputedStyle(element).transitionDuration)).toBe("0s");
  });
});
