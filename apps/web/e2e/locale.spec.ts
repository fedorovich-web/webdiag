import { expect, test } from "@playwright/test";
import { installBrowserGuard } from "./browser-guard";

async function openMobileMenu(page: import("@playwright/test").Page) {
  await page.locator(".mobile-menu summary").click();
  await expect(page.locator(".mobile-menu")).toHaveAttribute("open", "");
}

test.describe("RU and EN segmented navigation", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;

  test.beforeEach(async ({ page }) => {
    assertBrowserClean = installBrowserGuard(page);
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  test("preserves the equivalent tool route, query, and hash in both directions", async ({ page }) => {
    await page.goto("/tools/image-resizer?source=audit&mode=1#privacy");
    await openMobileMenu(page);

    const languageNavigation = page.getByRole("navigation", { name: "Выбор языка" });
    const ru = languageNavigation.getByRole("link", { name: "Русская версия" });
    const en = languageNavigation.getByRole("link", { name: "English version" });

    await expect(ru).toHaveAttribute("aria-current", "page");
    await expect(en).toHaveAttribute(
      "href",
      "/en/tools/image-resizer?source=audit&mode=1#privacy",
    );

    const [ruBox, enBox] = await Promise.all([ru.boundingBox(), en.boundingBox()]);
    expect(ruBox?.width).toBe(enBox?.width);
    expect(ruBox?.height).toBeGreaterThanOrEqual(44);
    expect(enBox?.height).toBeGreaterThanOrEqual(44);

    await en.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/en\/tools\/image-resizer\?source=audit&mode=1#privacy$/);

    await openMobileMenu(page);
    const englishNavigation = page.getByRole("navigation", { name: "Language selection" });
    const englishActive = englishNavigation.getByRole("link", { name: "English version" });
    const russianTarget = englishNavigation.getByRole("link", { name: "Русская версия" });
    await expect(englishActive).toHaveAttribute("aria-current", "page");
    await expect(russianTarget).toHaveAttribute(
      "href",
      "/tools/image-resizer?source=audit&mode=1#privacy",
    );

    await russianTarget.click();
    await expect(page).toHaveURL(/\/tools\/image-resizer\?source=audit&mode=1#privacy$/);
  });

  test("keeps decorative homepage copy in the active locale", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".wd-process-callout")).toContainText("Просто.");
    await expect(page.locator(".wd-process-callout")).not.toContainText("Simple.");

    await page.goto("/en");
    await expect(page.locator(".wd-process-callout")).toContainText("Simple.");
    await expect(page.locator(".wd-process-callout")).not.toContainText("Просто.");
  });

  test("keeps home routes stable without duplicating the English prefix", async ({ page }) => {
    await page.goto("/en?ref=header#how-it-works");
    await openMobileMenu(page);
    const languageNavigation = page.getByRole("navigation", { name: "Language selection" });

    await expect(languageNavigation.getByRole("link", { name: "English version" }))
      .toHaveAttribute("href", "/en?ref=header#how-it-works");
    await expect(languageNavigation.getByRole("link", { name: "Русская версия" }))
      .toHaveAttribute("href", "/?ref=header#how-it-works");
  });
});
