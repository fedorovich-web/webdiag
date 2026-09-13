import { expect, test } from "@playwright/test";
import { installBrowserGuard } from "./browser-guard";

test.describe("pricing availability", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;

  test.beforeEach(async ({ page }) => {
    assertBrowserClean = installBrowserGuard(page);
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  test("RU route exposes the current no-payment state without publishing prices", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/pricing");

    await expect(page.locator("h1")).toHaveCount(1);
    expect(await page.locator(".wd-availability-grid article").count()).toBeGreaterThan(0);
    await expect(page.getByRole("link", { name: "Открыть инструменты" })).toHaveAttribute(
      "href",
      "/tools",
    );
    await expect(
      page.getByRole("banner").getByRole("link", { name: "Создать аккаунт" }),
    ).toHaveAttribute("href", "/register");
    await expect(page.locator("main")).not.toContainText(/₽|\/мес/i);

    for (const route of ["/audit", "/monitoring"]) {
      await page.goto(route);
      await expect(page.locator("main")).not.toContainText(/₽|\/мес/i);
    }
  });

  test("EN route stays readable without prices or horizontal overflow on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/pricing");

    await expect(page.locator("h1")).toHaveCount(1);
    expect(await page.locator(".wd-availability-grid article").count()).toBeGreaterThan(0);
    await expect(page.getByRole("link", { name: "Open tools" })).toHaveAttribute(
      "href",
      "/en/tools",
    );
    await expect(
      page.getByRole("banner").getByRole("link", { name: "Create an account" }),
    ).toHaveAttribute("href", "/en/register");
    await expect(page.locator("main")).not.toContainText(/₽|\/mo/i);

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scroll).toBe(dimensions.viewport);

    for (const route of ["/en/audit", "/en/monitoring"]) {
      await page.goto(route);
      await expect(page.locator("main")).not.toContainText(/₽|\/mo/i);
    }
  });
});
