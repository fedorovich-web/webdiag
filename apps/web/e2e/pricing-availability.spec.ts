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

  test("RU route states current availability without prices", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/pricing");

    await expect(
      page.getByRole("heading", { level: 1, name: "Доступность функций WebDiag" }),
    ).toBeVisible();
    await expect(page.locator(".wd-internal-grid article")).toHaveCount(4);
    await expect(page.getByText("Оплата не подключена", { exact: true })).toBeVisible();
    await expect(page.getByText("Цены не опубликованы", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Открыть инструменты" })).toHaveAttribute(
      "href",
      "/tools",
    );
    await expect(page.getByRole("link", { name: "Создать аккаунт" })).toHaveAttribute(
      "href",
      "/register",
    );
    for (const cardTitle of ["AI-инструменты пока недоступны", "Оплата не подключена"]) {
      const card = page.locator(".wd-availability-grid article").filter({
        has: page.getByRole("heading", { level: 2, name: cardTitle }),
      });
      await expect(card.getByRole("link")).toHaveCount(0);
      await expect(card.getByRole("button")).toHaveCount(0);
    }
    await expect(page.locator("main")).not.toContainText(/₽|\/мес/i);
    await expect(page.locator(".wd-availability-grid > article").first()).toHaveCSS(
      "min-height",
      "180px",
    );

    for (const route of ["/audit", "/monitoring"]) {
      await page.goto(route);
      await expect(page.locator("main")).not.toContainText(/₽|\/мес/i);
    }
  });

  test("EN route stays readable without horizontal overflow on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/pricing");

    await expect(
      page.getByRole("heading", { level: 1, name: "WebDiag feature availability" }),
    ).toBeVisible();
    await expect(page.locator(".wd-internal-grid article")).toHaveCount(4);
    await expect(page.getByText("Payments are not connected", { exact: true })).toBeVisible();
    await expect(page.getByText("No prices are published", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open tools" })).toHaveAttribute(
      "href",
      "/en/tools",
    );
    await expect(page.getByRole("link", { name: "Create an account" })).toHaveAttribute(
      "href",
      "/en/register",
    );
    for (const cardTitle of ["AI tools are not available yet", "Payments are not connected"]) {
      const card = page.locator(".wd-availability-grid article").filter({
        has: page.getByRole("heading", { level: 2, name: cardTitle }),
      });
      await expect(card.getByRole("link")).toHaveCount(0);
      await expect(card.getByRole("button")).toHaveCount(0);
    }
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
