import { expect, test } from "@playwright/test";
import { publicTools } from "@webdiag/tool-registry";
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
  expect(groupCount).toBeGreaterThan(0);
  for (let index = 0; index < groupCount; index += 1) {
    const group = groups.nth(index);
    const text = await group.locator(".catalog-group-heading > strong").textContent();
    const expected = Number.parseInt(text?.trim() ?? "", 10);
    expect(Number.isInteger(expected)).toBe(true);
    await expect(group.locator(".compact-tool-card")).toHaveCount(expected);
  }
}

test.describe("catalog behavior", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;

  test.beforeEach(async ({ page }) => {
    assertBrowserClean = installBrowserGuard(page);
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  test("renders every ready tool and keeps group counts consistent", async ({ page }) => {
    await page.goto("/tools");
    await expect(page.locator(".catalog-summary strong")).toHaveText(String(publicTools.length));
    await expect(page.locator(".compact-tool-card")).toHaveCount(publicTools.length);
    await expectCardsMatchVisibleCount(page);
    await expectGroupCountsMatchCards(page);
  });

  test("registry category deep links select the requested ready tools", async ({ page }) => {
    await page.goto("/tools?category=seo-audit");
    const selected = page.locator('[aria-pressed="true"]');
    await expect(selected).toHaveCount(1);
    await expect(page.locator(".catalog-group")).toHaveCount(1);
    await expect(page.locator(".catalog-group")).toHaveAttribute("id", "seo-audit");
    await expectCardsMatchVisibleCount(page);
  });

  test("catalog stays inside the mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/tools");
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scroll).toBe(dimensions.viewport);
  });

  test("search and category filtering keep counts in sync", async ({ page }) => {
    await page.goto("/en/tools");
    const allCountText = await page.getByRole("button", { name: /^All/ }).locator("span").textContent();
    const allCount = Number.parseInt(allCountText?.trim() ?? "", 10);
    expect(Number.isInteger(allCount)).toBe(true);

    await page.getByRole("searchbox").fill("image");
    expect(await readVisibleCount(page)).toBeGreaterThan(0);
    await expectCardsMatchVisibleCount(page);
    await expectGroupCountsMatchCards(page);

    const categoryButtons = page.locator('button[aria-pressed]');
    expect(await categoryButtons.count()).toBeGreaterThan(1);
    await categoryButtons.nth(1).click();
    await expectCardsMatchVisibleCount(page);

    await page.getByRole("searchbox").fill("__webdiag_no_matching_tool__");
    await expect(page.locator(".compact-tool-card")).toHaveCount(0);
    await page.getByRole("button", { name: /reset/i }).click();
    await expect(page.locator(".compact-tool-card")).toHaveCount(allCount);
    await expectGroupCountsMatchCards(page);
  });
});