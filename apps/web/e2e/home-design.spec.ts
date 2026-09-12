import { expect, test } from "@playwright/test";
import { installBrowserGuard } from "./browser-guard";

test.describe("home redesign contract", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;

  test.beforeEach(async ({ page }) => {
    assertBrowserClean = installBrowserGuard(page);
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  test("Russian homepage exposes the approved production information architecture", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    await expect(page.getByRole("heading", {
      level: 1,
      name: "Проверка сайта на технические и SEO-ошибки",
    })).toBeVisible();

    for (const heading of [
      "Популярные инструменты",
      "Как проходит проверка",
      "Что проверяет WebDiag",
      "Пример отчёта",
      "Мониторинг изменений",
      "База знаний и полезные материалы",
      "Часто задаваемые вопросы",
      "Проверьте свой сайт прямо сейчас",
    ]) {
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }

    await expect(page.getByRole("link", { name: "Создать аккаунт" }).first()).toHaveAttribute("href", "/register");
    await expect(page.getByRole("link", { name: "Войти" }).first()).toHaveAttribute("href", "/login");
    await expect(page.getByRole("button", { name: "Проверить сайт" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Посмотреть пример отчёта" })).toBeVisible();
    await expect(page.getByLabel("Адрес сайта или страницы").first()).toBeVisible();

    await expect(page.locator(".wd-popular-tool-card")).toHaveCount(8);
    await expect(page.locator(".wd-check-card")).toHaveCount(12);
    await expect(page.locator(".wd-process-step")).toHaveCount(3);
    await expect(page.locator(".wd-resource-card")).toHaveCount(3);
    await expect(page.locator(".wd-faq-item")).toHaveCount(5);

    await expect(page.locator("body")).not.toContainText(/будущ(?:ий|его|ая)|audit engine|пока недоступно|не подключено/i);

    const design = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const section = document.querySelector<HTMLElement>(".wd-section");
      const hero = document.querySelector<HTMLElement>(".wd-hero");
      return {
        buttonGradient: root.getPropertyValue("--wd-button-bg").trim().toLowerCase(),
        sectionY: Number.parseFloat(root.getPropertyValue("--wd-section-y")),
        sectionPadding: section ? Number.parseFloat(getComputedStyle(section).paddingTop) : 0,
        heroBackground: hero ? getComputedStyle(hero).backgroundImage : "",
      };
    });

    expect(design.buttonGradient).toContain("#34d399");
    expect(design.buttonGradient).toContain("#22d3ee");
    expect(design.buttonGradient).toContain("#60a5fa");
    expect(design.sectionY).toBeGreaterThanOrEqual(110);
    expect(design.sectionPadding).toBeGreaterThanOrEqual(110);
    expect(design.heroBackground).toContain("gradient");
  });

  test("English homepage keeps the same product hierarchy without roadmap copy", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en");

    await expect(page.getByRole("heading", {
      level: 1,
      name: "Check Your Website for Technical and SEO Issues",
    })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create account" }).first()).toHaveAttribute("href", "/en/register");
    await expect(page.getByRole("button", { name: "Check website" }).first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/future report|future scenario|audit engine|not available|not connected/i);
  });

  test("mobile homepage keeps generous section rhythm without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const dimensions = await page.evaluate(() => {
      const section = document.querySelector<HTMLElement>(".wd-section");
      return {
        viewport: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
        sectionPadding: section ? Number.parseFloat(getComputedStyle(section).paddingTop) : 0,
      };
    });

    expect(dimensions.scroll).toBe(dimensions.viewport);
    expect(dimensions.sectionPadding).toBeGreaterThanOrEqual(64);

    await expect(page.locator(".language-switcher-desktop")).toBeHidden();
    await page.locator(".mobile-menu summary").click();
    await expect(page.locator(".language-switcher-mobile")).toBeVisible();
  });

  test("FAQ remains a keyboard-accessible single accordion", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const faqItems = page.locator(".wd-faq-item");
    await expect(faqItems).toHaveCount(5);
    await expect(faqItems.nth(0).locator("button")).toHaveAttribute("aria-expanded", "true");

    await faqItems.nth(2).locator("button").focus();
    await page.keyboard.press("Enter");
    await expect(faqItems.nth(0).locator("button")).toHaveAttribute("aria-expanded", "false");
    await expect(faqItems.nth(2).locator("button")).toHaveAttribute("aria-expanded", "true");
  });
});
