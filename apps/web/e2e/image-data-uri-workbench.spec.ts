import { expect, test } from "@playwright/test";
import path from "node:path";
import { installBrowserGuard } from "./browser-guard";

test.describe("browser-local image Data URI workbench", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;

  test.beforeEach(async ({ page }) => {
    assertBrowserClean = installBrowserGuard(page);
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  test("returns exact source and tiny placeholder Data URIs without upload", async ({ page }) => {
    const requestBodies: string[] = [];
    page.on("request", (request) => {
      const body = request.postData();
      if (body) requestBodies.push(body);
    });
    await page.goto("/en/tools/image-data-uri-converter");
    await expect(page.getByRole("heading", { level: 1, name: "Image Data URI Workbench" })).toBeVisible();
    await page.getByLabel("JPEG, PNG, WebP, or AVIF up to 1 MiB").setInputFiles(path.join(process.cwd(), "public", "logo.webp"));
    await page.getByRole("button", { name: "Create Data URIs" }).click();
    await expect(page.getByLabel("Exact source Data URI")).toHaveValue(/^data:image\/webp;base64,/);
    await expect(page.getByLabel("Tiny PNG placeholder Data URI")).toHaveValue(/^data:image\/png;base64,/);
    await expect(page.getByText("24 × 4")).toBeVisible();
    expect(requestBodies.join("\n")).not.toContain("RIFF");
  });

  test("wraps long outputs inside the narrow mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => localStorage.setItem("webdiag-theme", "dark"));
    await page.goto("/tools/image-data-uri-converter");
    await page.getByLabel("JPEG, PNG, WebP или AVIF до 1 МиБ").setInputFiles(path.join(process.cwd(), "public", "logo.webp"));
    await page.getByRole("button", { name: "Создать Data URI" }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await expect(page.locator(".use-case-grid li").first()).toHaveCSS("background-color", "rgb(18, 22, 30)");
  });
});
