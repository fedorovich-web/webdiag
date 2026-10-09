import { expect, test } from "@playwright/test";
import { session } from "./account-fixtures";
import { installBrowserGuard } from "./browser-guard";

for (const [path, annual, monthly, pack] of [
  ["/pricing", "790 ₽", "990 ₽", "390 ₽"],
  ["/en/pricing", "$11", "$14", "$5"],
]) {
  test(`${path} retains existing prices, annual billing and mobile layout`, async ({ page }, testInfo) => {
    const clean = installBrowserGuard(page);
    await page.route("**/api/account/me", (route) => route.fulfill({ json: session }));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path!);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator(".wd-pricing-card")).toHaveCount(3);
    await expect(page.locator(".wd-pricing-card").nth(1)).toContainText(annual!);
    await expect(page.locator("main")).toContainText(pack!);
    await page.locator(".wd-billing-toggle-switch").click();
    await expect(page.locator(".wd-pricing-card").nth(1)).toContainText(monthly!);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await clean(testInfo);
  });
}
