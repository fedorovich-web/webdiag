import { expect, test } from "@playwright/test";
import { session } from "./account-fixtures";
import { installBrowserGuard } from "./browser-guard";
import { billingSku, checkoutPackage, packagePrice } from "../src/features/account/billing-catalog";

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
    const locale = path === "/pricing" ? "ru" : "en";
    for (const [index, id] of ["pack-50", "pack-150", "pack-500"].entries()) {
      const product = checkoutPackage(billingSku(id, locale), locale);
      if (!product) throw new Error(`Missing billing fixture: ${id}`);
      await expect(page.locator(".wd-credit-pack-price").nth(index)).toHaveText(packagePrice(product, locale));
    }
    await page.locator(".wd-billing-toggle-switch").click();
    await expect(page.locator(".wd-pricing-card").nth(1)).toContainText(monthly!);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await clean(testInfo);
  });
}
