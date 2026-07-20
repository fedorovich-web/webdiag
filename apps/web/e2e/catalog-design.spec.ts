import { expect, test } from "@playwright/test";
import { installBrowserGuard } from "./browser-guard";

test.describe("catalog structure", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;

  test.beforeEach(async ({ page }) => {
    assertBrowserClean = installBrowserGuard(page);
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  test("groups the internal ready tools into three categories", async ({ page }) => {
    await page.goto("/tools");
    await expect(page.locator(".catalog-group")).toHaveCount(3);
    await expect(page.locator(".compact-tool-card")).toHaveCount(14);
    await expect(page.getByRole("heading", { level: 2, name: "Разметка и данные" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "UI и accessibility" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Изображения на страницах" })).toBeVisible();
  });

  test("search and category filtering preserve the compact grouped layout", async ({ page }) => {
    await page.goto("/en/tools");
    await page.getByRole("searchbox").fill("image");
    await expect(page.locator(".compact-tool-card")).toHaveCount(5);
    await page.getByRole("button", { name: /UI and accessibility/ }).click();
    await expect(page.getByText("No tools found")).toBeVisible();
    await page.getByRole("button", { name: "Reset filters" }).click();
    await expect(page.locator(".compact-tool-card")).toHaveCount(14);
  });
});
