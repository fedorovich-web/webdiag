import { expect, test } from "@playwright/test";
import { installBrowserGuard } from "./browser-guard";
import { session } from "./account-fixtures";

const locales = [
  { route: "/", prefix: "", open: "Открыть меню", close: "Закрыть меню", title: "Меню сайта", catalog: "Все 129 инструментов", register: "Создать аккаунт", pricing: "Тарифы" },
  { route: "/en", prefix: "/en", open: "Open menu", close: "Close menu", title: "Site menu", catalog: "All 129 tools", register: "Create account", pricing: "Pricing" },
] as const;

test.describe("mobile navigation drawer", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;

  test.beforeEach(async ({ page }) => {
    assertBrowserClean = installBrowserGuard(page);
    await page.route("**/api/account/me", (route) => route.fulfill({ json: session }));
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  for (const locale of locales) {
    test(`${locale.route} contains focus, locks scrolling and restores the opener on Escape`, async ({ page }) => {
      await page.goto(locale.route);
      const trigger = page.getByRole("button", { name: locale.open, exact: true });
      const dialog = page.getByRole("dialog", { name: locale.title, exact: true });
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(dialog).toBeHidden();
      await trigger.focus();
      await page.keyboard.press("Enter");
      await expect(dialog).toBeVisible();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(await dialog.evaluate((element) => element.matches(":modal"))).toBe(true);
      const close = dialog.getByRole("button", { name: locale.close, exact: true });
      await expect(close).toBeFocused();
      await expect(page.locator("html")).toHaveCSS("overflow", "hidden");
      await expect(dialog.getByRole("link", { name: locale.catalog, exact: true })).toHaveAttribute("href", `${locale.prefix}/tools`);

      await page.keyboard.press("Shift+Tab");
      await expect(dialog.getByRole("link", { name: locale.register, exact: true })).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(close).toBeFocused();
      await page.locator(".skip-link").evaluate((element: HTMLAnchorElement) => element.focus());
      await expect(close).toBeFocused();

      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
    });

    test(`${locale.route} closes from the backdrop, close button and a localized navigation link`, async ({ page }, testInfo) => {
      await page.goto(locale.route);
      const trigger = page.getByRole("button", { name: locale.open, exact: true });
      const dialog = page.getByRole("dialog", { name: locale.title, exact: true });
      await trigger.click();
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
      const box = await dialog.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(32);
      expect(box!.x + box!.width).toBeCloseTo(390, 0);
      expect(await dialog.evaluate((element) => getComputedStyle(element, "::backdrop").backgroundColor)).toMatch(/0\.58\)/);
      await page.screenshot({ path: testInfo.outputPath("mobile-navigation.png") });
      await page.mouse.click(8, 420);
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();

      await trigger.click();
      await dialog.getByRole("button", { name: locale.close, exact: true }).click();
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();

      await trigger.click();
      await dialog.getByRole("link", { name: locale.pricing, exact: true }).click();
      await expect(page).toHaveURL(`${locale.prefix}/pricing`);
      await expect(page.getByRole("dialog", { name: locale.title, exact: true })).toBeHidden();
      await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
    });
  }

  test("closes when switching to desktop and opens without motion when reduced motion is requested", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Открыть меню", exact: true });
    const dialog = page.getByRole("dialog", { name: "Меню сайта", exact: true });
    await trigger.click();
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveCSS("transition-duration", "0s");
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeHidden();
    await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
  });
});
