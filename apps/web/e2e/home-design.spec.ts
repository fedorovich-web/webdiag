import { expect, test } from "@playwright/test";
import { installBrowserGuard } from "./browser-guard";

const urlForm = 'form:has(input[type="url"], input[inputmode="url"])';

test.describe("home functional smoke", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;

  test.beforeEach(async ({ page }) => {
    assertBrowserClean = installBrowserGuard(page);
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  test("Russian homepage exposes the complete site-check journey without enforcing presentation", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.goto("/");

    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator(urlForm)).toHaveCount(2);
    await expect(page.locator('a[href="/register"]').first()).toBeVisible();
    await expect(page.locator('a[href="/login"]').first()).toBeVisible();

    for (const id of ["tools", "report", "monitoring", "knowledge", "faq"]) {
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }

    const desktopScreenshot = await page.screenshot({ fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const mobileScreenshot = await page.screenshot({ fullPage: true });

    await page.setViewportSize({ width: 1854, height: 1200 });
    await page.setContent(`
      <style>
        html, body { margin: 0; background: #eef3f7; }
        main { display: flex; align-items: flex-start; gap: 24px; }
        img { display: block; height: auto; }
        .desktop { width: 1440px; }
        .mobile { width: 390px; }
      </style>
      <main>
        <img class="desktop" alt="" src="data:image/png;base64,${desktopScreenshot.toString("base64")}">
        <img class="mobile" alt="" src="data:image/png;base64,${mobileScreenshot.toString("base64")}">
      </main>
    `);
    await page.screenshot({ path: "test-results/homepage-current.png", fullPage: true });
  });

  test("homepage uses the approved standalone artwork without duplicate hero callouts", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator('img.wd-hero-dashboard[src="/home/hero-dashboard.webp"]')).toHaveCount(1);
    await expect(page.locator(".wd-hero-callout")).toHaveCount(0);

    for (const src of [
      "/home/benefit-tools.webp",
      "/home/benefit-reports.webp",
      "/home/benefit-time.webp",
      "/home/process-accent.webp",
      "/home/knowledge-technical-seo.webp",
      "/home/knowledge-robots.webp",
      "/home/knowledge-core-web-vitals.webp",
    ]) {
      await expect(page.locator(`img[src="${src}"]`)).toHaveCount(1);
    }
  });

  test("English homepage exposes the localized core user flow", async ({ page }) => {
    await page.goto("/en");

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator(urlForm)).toHaveCount(2);
    await expect(page.locator('a[href="/en/register"]').first()).toBeVisible();
    await expect(page.locator('a[href="/en/login"]').first()).toBeVisible();
  });

  test("mobile homepage does not overflow horizontally and keeps mobile navigation usable", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));

    expect(dimensions.scroll).toBe(dimensions.viewport);

    const platformLogos = page.locator(".wd-platform-strip .wd-platform-logo");
    await expect(platformLogos).toHaveCount(6);
    for (let index = 0; index < 6; index += 1) {
      await expect(platformLogos.nth(index)).toBeInViewport();
    }

    await expect(page.locator(".language-switcher-desktop")).toBeHidden();
    await page.locator(".mobile-menu summary").click();
    await expect(page.locator(".language-switcher-mobile")).toBeVisible();
  });

  test("FAQ controls remain keyboard operable when FAQ items are present", async ({ page }) => {
    await page.goto("/");

    const faqItems = page.locator(".wd-faq-item");
    const count = await faqItems.count();
    expect(count).toBeGreaterThan(0);

    const firstButton = faqItems.first().locator("button");
    await expect(firstButton).toHaveAttribute("aria-expanded", /true|false/);
    const before = await firstButton.getAttribute("aria-expanded");

    await firstButton.focus();
    await page.keyboard.press("Enter");

    await expect(firstButton).toHaveAttribute("aria-expanded", before === "true" ? "false" : "true");
  });
});
