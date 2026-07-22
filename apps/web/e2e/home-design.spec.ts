import { expect, test } from "@playwright/test";
import { installBrowserGuard } from "./browser-guard";

test.describe("home information architecture", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;

  test.beforeEach(async ({ page }) => {
    assertBrowserClean = installBrowserGuard(page);
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  test("desktop home exposes report-first website audit positioning", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1, name: "Найдите ошибки сайта до потери SEO-трафика" })).toBeVisible();
    await expect(page.locator(".wd-hero-report")).toBeVisible();
    await expect(page.locator(".wd-report-frame")).toBeVisible();
    await expect(page.locator(".wd-report-tabs [role='tab']")).toHaveCount(8);
    await expect(page.locator(".wd-coverage-grid article")).toHaveCount(10);
    await expect(page.locator(".wd-priority-grid article")).toHaveCount(4);
    await expect(page.locator(".wd-tool-category-card")).toHaveCount(8);
    await expect(page.locator(".wd-faq-item")).toHaveCount(6);
    await expect(page.getByText("Популярные задачи")).toHaveCount(0);
    await expect(page.getByText("Пример отчёта", { exact: true })).toBeVisible();
    await expect(page.getByText("site.ru", { exact: true })).toBeVisible();

    await expect(page.getByRole("link", { name: "Попробовать бесплатно" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Проверить сайт" })).toBeVisible();
    await expect(page.getByLabel("Адрес сайта или страницы")).toBeVisible();
    await expect(page.getByRole("link", { name: "Войти" })).toHaveCount(0);
    await expect(page.getByText("Войти", { exact: true })).toBeVisible();

    const designState = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const h1 = getComputedStyle(document.querySelector(".wd-home h1")!);
      const h2 = getComputedStyle(document.querySelector(".wd-home h2")!);
      const h3 = getComputedStyle(document.querySelector(".wd-priority-grid h3")!);
      const pricingButton = getComputedStyle(document.querySelector(".wd-pricing-grid a")!);
      const processCards = Array.from(document.querySelectorAll(".wd-process-flow article"));
      const toolCards = Array.from(document.querySelectorAll(".wd-tool-category-card"));
      const tab = getComputedStyle(document.querySelector(".wd-report-tablist button")!);
      const faqQuestion = getComputedStyle(document.querySelector(".wd-faq-item button")!);
      return {
        h1: Number.parseFloat(h1.fontSize),
        h2: Number.parseFloat(h2.fontSize),
        h3: Number.parseFloat(h3.fontSize),
        pricingBackground: pricingButton.backgroundImage,
        pricingColor: pricingButton.color,
        tabBackground: tab.backgroundColor,
        tabBorder: tab.borderTopColor,
        faqQuestion: Number.parseFloat(faqQuestion.fontSize),
        rootH1: root.getPropertyValue("--wd-h1"),
        rootH2: root.getPropertyValue("--wd-h2"),
        rootH3: root.getPropertyValue("--wd-h3"),
        buttonBg: root.getPropertyValue("--wd-button-bg"),
        processCards: processCards.length,
        toolCards: toolCards.length,
      };
    });
    expect(designState.h1).toBeLessThanOrEqual(64);
    expect(designState.h2).toBeLessThanOrEqual(48);
    expect(designState.h3).toBeGreaterThanOrEqual(22);
    expect(designState.h3).toBeLessThanOrEqual(28);
    expect(designState.faqQuestion).toBeGreaterThanOrEqual(14);
    expect(designState.faqQuestion).toBeLessThanOrEqual(16);
    expect(designState.pricingBackground).toContain("gradient");
    expect(designState.pricingColor).not.toBe("rgb(9, 17, 33)");
    expect(designState.tabBackground).not.toBe("rgb(239, 239, 239)");
    expect(designState.tabBorder).not.toBe("rgb(118, 118, 118)");
    expect(designState.rootH1).toContain("64px");
    expect(designState.rootH2).toContain("48px");
    expect(designState.rootH3.trim()).toBe("28px");
    expect(designState.buttonBg).toContain("linear-gradient");
    expect(designState.processCards).toBe(4);
    expect(designState.toolCards).toBe(8);
    await expect(page.locator(".wd-step-number")).toHaveCount(0);
  });

  test("desktop report sidebar fill reaches the bottom of the report frame", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const fill = await page.locator(".wd-report-frame").evaluate((element) => {
      const style = window.getComputedStyle(element, "::after");
      return {
        top: style.top,
        bottom: style.bottom,
        width: style.width,
        display: style.display,
      };
    });
    expect(fill.display).not.toBe("none");
    expect(fill.top).toBe("56px");
    expect(fill.bottom).toBe("0px");
    expect(Number.parseFloat(fill.width)).toBeGreaterThan(200);
  });

  test("mobile header moves language navigation into the menu", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await expect(page.locator(".language-switcher-desktop")).toBeHidden();
    await expect(page.locator(".language-switcher-mobile")).toBeHidden();
    await page.locator(".mobile-menu summary").click();
    await expect(page.locator(".language-switcher-mobile")).toBeVisible();
    await expect(page.getByRole("link", { name: "Русская версия" })).toHaveAttribute("aria-current", "page");

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scroll).toBe(dimensions.viewport);
  });

  test("FAQ behaves as a single stable accordion", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const faqItems = page.locator(".wd-faq-item");
    await expect(faqItems).toHaveCount(6);
    await expect(faqItems.nth(0).locator("button")).toHaveAttribute("aria-expanded", "true");

    const beforeHeight = await page.locator(".wd-faq-grid").evaluate((node) => node.getBoundingClientRect().height);
    await faqItems.nth(2).locator("button").click();
    await expect(faqItems.nth(0).locator("button")).toHaveAttribute("aria-expanded", "false");
    await expect(faqItems.nth(2).locator("button")).toHaveAttribute("aria-expanded", "true");
    const afterHeight = await page.locator(".wd-faq-grid").evaluate((node) => node.getBoundingClientRect().height);
    expect(Math.abs(afterHeight - beforeHeight)).toBeLessThanOrEqual(12);
  });

});
