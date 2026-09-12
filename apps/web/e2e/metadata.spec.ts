import { expect, test } from "@playwright/test";
import { installBrowserGuard } from "./browser-guard";

const cases = [
  { route: "/", lang: "ru", canonical: "https://webdiag.ru", type: "WebSite" },
  { route: "/en", lang: "en", canonical: "https://webdiag.ru/en", type: "WebSite" },
  { route: "/en/tools", lang: "en", canonical: "https://webdiag.ru/en/tools", type: "ItemList" },
  { route: "/tools/json-formatter-validator", lang: "ru", canonical: "https://webdiag.ru/tools/json-formatter-validator", type: "BreadcrumbList" },
] as const;

test.describe("rendered SEO metadata", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;

  test.beforeEach(async ({ page }) => {
    assertBrowserClean = installBrowserGuard(page);
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  for (const item of cases) {
    test(`${item.route} renders canonical, alternates, social metadata, and JSON-LD`, async ({ page }) => {
      await page.goto(item.route);
      await expect(page.locator("html")).toHaveAttribute("lang", item.lang);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", item.canonical);
      await expect(page.locator('link[rel="alternate"][hreflang="ru"]')).toHaveCount(1);
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
      await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
      await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", "https://webdiag.ru/og/webdiag.png");
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
      const structured = await page.locator('script[type="application/ld+json"]').first().textContent();
      expect(structured).toContain(`\"@type\":\"${item.type}\"`);
    });
  }

  for (const route of ["/", "/en"] as const) {
    test(`${route} exposes non-empty title and description without enforcing editorial wording`, async ({ page }) => {
      await page.goto(route);
      expect((await page.title()).trim().length).toBeGreaterThan(0);
      const description = await page.locator('meta[name="description"]').getAttribute("content");
      expect(description?.trim().length ?? 0).toBeGreaterThan(0);
    });
  }
});
