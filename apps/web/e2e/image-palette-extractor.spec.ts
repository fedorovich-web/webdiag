import { expect, test } from "@playwright/test";
import path from "node:path";
import { installBrowserGuard } from "./browser-guard";

test.describe("browser-local image palette extractor", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;

  test.beforeEach(async ({ page }) => {
    assertBrowserClean = installBrowserGuard(page);
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  test("extracts copyable sampled colors without uploading the image", async ({ page }) => {
    const requestBodies: string[] = [];
    page.on("request", (request) => {
      const body = request.postData();
      if (body) requestBodies.push(body);
    });
    await page.goto("/en/tools/color-palette-extractor");
    await expect(page.getByRole("heading", { level: 1, name: "Image Color Palette Extractor" })).toBeVisible();
    await page.getByLabel("JPEG, PNG, WebP, or AVIF").setInputFiles(path.join(process.cwd(), "public", "logo.webp"));
    await page.getByRole("button", { name: "Extract sampled palette" }).click();
    await expect(page.locator(".palette-swatch")).toHaveCount(6);
    await expect(page.locator(".palette-swatch code").first()).toContainText(/^#[0-9A-F]{6}$/);
    await expect(page.locator(".palette-swatch").first()).toContainText("sample");
    expect(requestBodies.join("\n")).not.toContain("RIFF");
  });

  test("keeps the palette inside the narrow mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/tools/color-palette-extractor");
    await page.getByLabel("JPEG, PNG, WebP или AVIF").setInputFiles(path.join(process.cwd(), "public", "logo.webp"));
    await page.getByRole("button", { name: "Извлечь палитру выборки" }).click();
    await expect(page.locator(".palette-swatch")).toHaveCount(6);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
