import { expect, test } from "@playwright/test";
import { installBrowserGuard } from "./browser-guard";

test.describe("responsive srcset generator", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;

  test.beforeEach(async ({ page }) => {
    assertBrowserClean = installBrowserGuard(page);
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  test("escapes untrusted attributes and stays browser-only", async ({ page }) => {
    const requestBodies: string[] = [];
    page.on("request", (request) => {
      const body = request.postData();
      if (body) requestBodies.push(body);
    });
    await page.goto("/en/tools/responsive-image-srcset-generator");
    await expect(page.getByRole("heading", { level: 1, name: "Responsive Image Srcset Generator" })).toBeVisible();
    await page.getByLabel("URL | width, one per line").fill("/img-1280.webp?x=1&y=2 | 1280\nhttps://cdn.example.com/img-640.webp | 640");
    await page.getByLabel("Fallback src").fill("/img-640.webp?x=1&y=2");
    await page.getByLabel("alt").fill('<img src=x onerror="window.__srcsetInjected=1">');
    await page.getByRole("button", { name: "Generate srcset" }).click();

    const html = page.locator("pre.output").last();
    await expect(html).toContainText('alt="&lt;img src=x onerror=&quot;window.__srcsetInjected=1&quot;&gt;"');
    await expect(html.locator("img")).toHaveCount(0);
    expect(await page.evaluate(() => (window as typeof window & { __srcsetInjected?: number }).__srcsetInjected)).toBeUndefined();
    expect(requestBodies.join("\n")).not.toContain("img-1280.webp");
  });

  test("reports empty alt and stays within the mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/tools/responsive-image-srcset-generator");
    await page.getByRole("button", { name: "Создать srcset" }).click();
    await expect(page.getByText("Пустой alt подходит только декоративному изображению.")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
