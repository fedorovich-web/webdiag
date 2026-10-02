import { expect, test } from "@playwright/test";

const retiredBlogRoutes = ["/blog", "/en/blog"] as const;

test.describe("retired blog surface", () => {
  test("legacy blog routes return 404", async ({ request }) => {
    for (const route of retiredBlogRoutes) {
      const response = await request.get(route);
      expect(response.status(), route).toBe(404);
    }
  });

  test("global navigation does not expose blog destinations", async ({ page }) => {
    for (const route of ["/", "/en"] as const) {
      await page.goto(route);
      await expect(page.locator('a[href="/blog"]')).toHaveCount(0);
      await expect(page.locator('a[href="/en/blog"]')).toHaveCount(0);
    }
  });
});
