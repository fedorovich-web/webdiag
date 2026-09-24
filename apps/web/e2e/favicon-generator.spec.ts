import { expect, test } from "@playwright/test";
import path from "node:path";
import { installBrowserGuard } from "./browser-guard";

test.describe("browser-local favicon generator", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;

  test.beforeEach(async ({ page }) => {
    assertBrowserClean = installBrowserGuard(page);
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  test("generates the exact PNG assets without sending the source file", async ({ page }) => {
    const requestBodies: string[] = [];
    page.on("request", (request) => {
      const body = request.postData();
      if (body) requestBodies.push(body);
    });

    await page.goto("/en/tools/favicon-generator");
    await expect(page.getByRole("heading", { level: 1, name: "PNG Favicon and Web App Icon Generator" })).toBeVisible();
    await page.getByLabel("JPEG, PNG, WebP, or AVIF").setInputFiles(path.join(process.cwd(), "public", "logo.webp"));
    await page.getByRole("button", { name: "Generate 5 PNG icons" }).click();

    const downloads = page.locator(".favicon-asset a[download]");
    await expect(downloads).toHaveCount(5);
    for (let index = 0; index < 5; index += 1) {
      await expect(downloads.nth(index)).toHaveAttribute("href", /^blob:/);
      await expect(downloads.nth(index)).toHaveAttribute("download", /\.png$/);
    }
    await expect(page.locator(".favicon-asset")).toContainText([
      "favicon-32x32.png",
      "favicon-48x48.png",
      "apple-touch-icon.png",
      "web-app-icon-192.png",
      "web-app-icon-512.png",
    ]);
    await expect(page.locator("pre.output").first()).toContainText('rel="apple-touch-icon"');
    await expect(page.locator("pre.output").last()).toContainText('"sizes": "512x512"');
    expect(requestBodies.join("\n")).not.toContain("RIFF");
  });

  test("keeps the generated asset list within the mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/tools/favicon-generator");
    await page.getByLabel("JPEG, PNG, WebP или AVIF").setInputFiles(path.join(process.cwd(), "public", "logo.webp"));
    await page.getByRole("button", { name: "Создать 5 PNG-иконок" }).click();
    await expect(page.locator(".favicon-asset")).toHaveCount(5);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
