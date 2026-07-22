import { expect, test } from "@playwright/test";
import { installBrowserGuard } from "./browser-guard";

async function readVisibleCount(page: import("@playwright/test").Page) {
  const text = await page.locator(".catalog-summary strong").textContent();
  const count = Number.parseInt(text?.trim() ?? "", 10);
  expect(Number.isInteger(count)).toBe(true);
  return count;
}

async function expectCardsMatchVisibleCount(page: import("@playwright/test").Page) {
  await expect(page.locator(".compact-tool-card")).toHaveCount(await readVisibleCount(page));
}

async function expectGroupCountsMatchCards(page: import("@playwright/test").Page) {
  const groups = page.locator(".catalog-group");
  const groupCount = await groups.count();
  for (let index = 0; index < groupCount; index += 1) {
    const group = groups.nth(index);
    const text = await group.locator(".catalog-group-heading > strong").textContent();
    const expected = Number.parseInt(text?.trim() ?? "", 10);
    expect(Number.isInteger(expected)).toBe(true);
    await expect(group.locator(".compact-tool-card")).toHaveCount(expected);
  }
}

test.describe("catalog structure", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;

  test.beforeEach(async ({ page }) => {
    assertBrowserClean = installBrowserGuard(page);
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  test("groups the ready tools into three categories", async ({ page }) => {
    await page.goto("/tools");
    await expect(page.locator(".catalog-group")).toHaveCount(3);
    await expectCardsMatchVisibleCount(page);
    await expectGroupCountsMatchCards(page);
    await expect(page.getByRole("heading", { level: 2, name: "Разметка и данные" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "UI и accessibility" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Изображения на страницах" })).toBeVisible();
  });

  test("search and category filtering preserve the compact grouped layout", async ({ page }) => {
    await page.goto("/en/tools");
    const allCountText = await page.getByRole("button", { name: /^All/ }).locator("span").textContent();
    const allCount = Number.parseInt(allCountText?.trim() ?? "", 10);
    expect(Number.isInteger(allCount)).toBe(true);

    await page.getByRole("searchbox").fill("image");
    expect(await readVisibleCount(page)).toBeGreaterThan(0);
    await expectCardsMatchVisibleCount(page);
    await expectGroupCountsMatchCards(page);

    await page.getByRole("button", { name: /UI and accessibility/ }).click();
    await expect(page.getByText("No tools found")).toBeVisible();
    await page.getByRole("button", { name: "Reset filters" }).click();
    await expect(page.locator(".compact-tool-card")).toHaveCount(allCount);
    await expectGroupCountsMatchCards(page);
  });
});
