import { expect, test } from "@playwright/test";
import { publicTools } from "@webdiag/tool-registry";
import { installBrowserGuard } from "./browser-guard";

async function readVisibleCount(page: import("@playwright/test").Page) {
  const text = await page.locator(".catalog-summary strong").textContent();
  const count = Number.parseInt(text?.trim() ?? "", 10);
  expect(Number.isInteger(count)).toBe(true);
  return count;
}

async function expectCardsMatchVisibleCount(
  page: import("@playwright/test").Page,
) {
  await expect(page.locator(".compact-tool-card")).toHaveCount(
    await readVisibleCount(page),
  );
}

async function expectGroupCountsMatchCards(
  page: import("@playwright/test").Page,
) {
  const groups = page.locator(".catalog-group");
  const groupCount = await groups.count();
  for (let index = 0; index < groupCount; index += 1) {
    const group = groups.nth(index);
    const text = await group
      .locator(".catalog-group-heading > strong")
      .textContent();
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

  test("groups every ready tool by its registry category", async ({ page }) => {
    await page.goto("/tools");
    await expect(page.locator(".catalog-group")).toHaveCount(6);
    await expect(page.locator(".catalog-summary strong")).toHaveText(String(publicTools.length));
    await expect(page.locator(".compact-tool-card")).toHaveCount(publicTools.length);
    await expectCardsMatchVisibleCount(page);
    await expectGroupCountsMatchCards(page);
    await expect(
      page.getByRole("heading", { level: 2, name: "Текст и данные" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Интерфейсы и CSS" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Изображения" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "SEO и аудит" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Безопасность и сеть" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Производительность" }),
    ).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scroll).toBe(dimensions.viewport);
  });

  test("registry category deep links select the requested ready tools", async ({ page }) => {
    await page.goto("/tools?category=seo-audit");
    await expect(page.getByRole("button", { name: /SEO и аудит/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator(".catalog-group")).toHaveCount(1);
    await expect(page.locator(".catalog-group")).toHaveAttribute("id", "seo-audit");
    await expectCardsMatchVisibleCount(page);
  });

  test("all registry categories stay inside the mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/tools");
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scroll).toBe(dimensions.viewport);
  });

  test("search and category filtering preserve the compact grouped layout", async ({
    page,
  }) => {
    await page.goto("/en/tools");
    const allCountText = await page
      .getByRole("button", { name: /^All/ })
      .locator("span")
      .textContent();
    const allCount = Number.parseInt(allCountText?.trim() ?? "", 10);
    expect(Number.isInteger(allCount)).toBe(true);

    await page.getByRole("searchbox").fill("image");
    expect(await readVisibleCount(page)).toBeGreaterThan(0);
    await expectCardsMatchVisibleCount(page);
    await expectGroupCountsMatchCards(page);

    await page.getByRole("button", { name: /Interfaces and CSS/ }).click();
    await expectCardsMatchVisibleCount(page);
    await expectGroupCountsMatchCards(page);

    await page.getByRole("searchbox").fill("__webdiag_no_matching_tool__");
    await expect(page.getByText("No tools found")).toBeVisible();
    await page.getByRole("button", { name: "Reset filters" }).click();
    await expect(page.locator(".compact-tool-card")).toHaveCount(allCount);
    await expectGroupCountsMatchCards(page);
  });
});
