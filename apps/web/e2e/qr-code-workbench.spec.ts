import { expect, test } from "@playwright/test";
import { installBrowserGuard } from "./browser-guard";

test.describe("browser-local QR code workbench", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;

  test.beforeEach(async ({ page }) => {
    assertBrowserClean = installBrowserGuard(page);
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  test("generates and reads an inert QR payload without upload", async ({ page }) => {
    const requestBodies: string[] = [];
    page.on("request", (request) => {
      const body = request.postData();
      if (body) requestBodies.push(body);
    });
    await page.goto("/en/tools/qr-code-generator");
    await expect(page.getByRole("heading", { level: 1, name: "QR Code Workbench" })).toBeVisible();
    const payload = "<script>window.qrExecuted=true</script> https://example.com/path?q=1";
    await page.getByLabel("Text to encode").fill(payload);
    await page.getByRole("button", { name: "Generate QR code" }).click();
    await expect(page.getByRole("img", { name: "Generated QR code" })).toBeVisible();
    const pngDataUri = await page.getByRole("link", { name: "Download PNG" }).getAttribute("href");
    expect(pngDataUri).toMatch(/^data:image\/png;base64,/);
    const pngBase64 = pngDataUri?.split(",")[1];
    expect(pngBase64).toBeTruthy();
    await page.getByLabel("QR image up to 5 MiB").setInputFiles({
      name: "generated.png",
      mimeType: "image/png",
      buffer: Buffer.from(pngBase64!, "base64"),
    });
    await page.getByRole("button", { name: "Read QR code" }).click();
    await expect(page.getByLabel("Decoded QR text")).toHaveValue(payload);
    expect(await page.evaluate(() => (window as Window & { qrExecuted?: boolean }).qrExecuted)).toBeUndefined();
    expect(requestBodies.join("\n")).not.toContain("qrExecuted");
  });

  test("keeps RU dark output inside a narrow mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => localStorage.setItem("webdiag-theme", "dark"));
    await page.goto("/tools/qr-code-generator");
    await page.getByLabel("Текст для кодирования").fill("WebDiag mobile QR");
    await page.getByRole("button", { name: "Создать QR-код" }).click();
    await expect(page.getByRole("img", { name: "Созданный QR-код" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
