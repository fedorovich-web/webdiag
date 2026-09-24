import { expect, test } from "@playwright/test";
import { publicTools } from "@webdiag/tool-registry";
import { installBrowserGuard } from "./browser-guard";

const PAGE_SIZE = 20;

async function readResultCount(page: import("@playwright/test").Page) {
  const text = await page.locator(".wd-tools-list-head h2 span").textContent();
  const match = text?.match(/\d+/);
  const count = Number.parseInt(match?.[0] ?? "", 10);
  expect(Number.isInteger(count)).toBe(true);
  return count;
}

async function submitSearch(page: import("@playwright/test").Page, value: string) {
  const search = page.getByRole("searchbox");
  await search.fill(value);
  await search.press("Enter");
}

test.describe("catalog behavior", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;

  test.beforeEach(async ({ page }) => {
    assertBrowserClean = installBrowserGuard(page);
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  test("renders the complete ready-tool count with bounded pagination", async ({ page }) => {
    await page.goto("/tools");
    await expect(page.locator(".wd-tools-list-head h2 span")).toHaveText(`(${publicTools.length})`);
    await expect(page.locator(".wd-tool-card")).toHaveCount(Math.min(PAGE_SIZE, publicTools.length));

    if (publicTools.length > PAGE_SIZE) {
      await page.getByRole("button", { name: "Следующая страница" }).click();
      const remaining = publicTools.length - PAGE_SIZE;
      await expect(page.locator(".wd-tool-card")).toHaveCount(Math.min(PAGE_SIZE, remaining));
    }
  });

  test("registry category deep links select and count the requested ready tools", async ({ page }) => {
    const expected = publicTools.filter((tool) => tool.category === "seo-audit").length;
    await page.goto("/tools?category=seo-audit");

    await expect(page.locator('[aria-pressed="true"]')).toHaveCount(1);
    await expect(page.locator(".wd-tools-list-head h2 span")).toHaveText(`(${expected})`);
    await expect(page.locator(".wd-tool-card")).toHaveCount(Math.min(PAGE_SIZE, expected));

    const allowed = new Set(publicTools.filter((tool) => tool.category === "seo-audit").map((tool) => `/tools/${tool.slug}`));
    const hrefs = await page.locator(".wd-tool-card").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")));
    expect(hrefs.every((href) => href !== null && allowed.has(href))).toBe(true);
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

  test("search, category filtering and reset keep result counts in sync", async ({ page }) => {
    await page.goto("/en/tools");
    expect(await readResultCount(page)).toBe(publicTools.length);

    await submitSearch(page, "image");
    const imageCount = await readResultCount(page);
    expect(imageCount).toBeGreaterThan(0);
    await expect(page.locator(".wd-tool-card")).toHaveCount(Math.min(PAGE_SIZE, imageCount));

    const categoryButtons = page.locator('button[aria-pressed]');
    expect(await categoryButtons.count()).toBeGreaterThan(1);
    await categoryButtons.nth(1).click();
    const filteredCount = await readResultCount(page);
    await expect(page.locator(".wd-tool-card")).toHaveCount(Math.min(PAGE_SIZE, filteredCount));

    await submitSearch(page, "__webdiag_no_matching_tool__");
    await expect(page.locator(".wd-tool-card")).toHaveCount(0);
    await page.getByRole("button", { name: /reset/i }).click();
    expect(await readResultCount(page)).toBe(publicTools.length);
    await expect(page.locator(".wd-tool-card")).toHaveCount(Math.min(PAGE_SIZE, publicTools.length));
  });
});
