import { expect, test } from "@playwright/test";
import { session } from "./account-fixtures";
import { installBrowserGuard } from "./browser-guard";

for (const locale of [
  { pricing: "/pricing", home: "/", label: "Главная", artwork: "/home/hero-dashboard.webp" },
  { pricing: "/en/pricing", home: "/en", label: "Home", artwork: "/design/icons/seo-audit.webp" },
] as const) {
  test(`${locale.pricing} prefetches the home breadcrumb without fetching its unused hero artwork`, async ({ page }, testInfo) => {
    const assertBrowserClean = installBrowserGuard(page);
    const artworkRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname === locale.artwork) artworkRequests.push(request.url());
    });
    await page.route("**/api/account/me", (route) => route.fulfill({ json: session }));
    await page.setViewportSize({ width: 1440, height: 900 });

    const homePrefetch = page.waitForResponse((response) =>
      new URL(response.url()).pathname === locale.home && response.request().headers()["rsc"] === "1",
    );
    await page.goto(locale.pricing);
    const homeBreadcrumb = page.locator(".wd-pricing-breadcrumbs").getByRole("link", { name: locale.label, exact: true });
    await expect(homeBreadcrumb).toBeVisible();
    await homeBreadcrumb.hover();
    const response = await homePrefetch;
    expect(response.ok()).toBe(true);
    await response.finished();
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(locale.pricing);
    await expect(page.locator(".wd-hero-dashboard")).toHaveCount(0);
    expect(artworkRequests, "Speculative home prefetch must not download artwork for an unopened page").toEqual([]);
    await assertBrowserClean(testInfo);
  });
}
