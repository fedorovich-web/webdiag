import { expect, test } from "@playwright/test";

for (const locale of [
  { missing: "/__webdiag_missing_navigation__", home: "/", label: "На главную" },
  { missing: "/en/__webdiag_missing_navigation__", home: "/en", label: "Go home" },
] as const) {
  test(`${locale.missing} loads recovery destinations only after selection`, async ({ page }) => {
    const speculativeRequests: string[] = [];
    const prefix = locale.home === "/" ? "" : locale.home;
    const destinations = [locale.home, ...["tools", "knowledge", "audit", "pricing", "contacts"].map((path) => `${prefix}/${path}`)];
    page.on("request", (request) => {
      if (request.headers()["next-router-prefetch"] === "1" && destinations.includes(new URL(request.url()).pathname)) {
        speculativeRequests.push(request.url());
      }
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    const response = await page.goto(locale.missing);
    expect(response?.status()).toBe(404);
    const home = page.getByRole("link", { name: locale.label, exact: true });
    await expect(home).toBeVisible();
    await home.hover();
    await page.waitForLoadState("networkidle");
    expect(speculativeRequests, "A missing page must not download all suggested destinations before a choice").toEqual([]);
    await home.click();
    await expect(page).toHaveURL(locale.home);
    await expect(page.locator(".wd-hero-dashboard")).toBeVisible();
  });
}
