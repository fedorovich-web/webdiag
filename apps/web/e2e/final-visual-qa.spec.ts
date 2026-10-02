import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { installBrowserGuard } from "./browser-guard";

const publicRoutes = [
  ["home-ru", "/"],
  ["home-en", "/en"],
  ["tools-ru", "/tools"],
  ["tools-en", "/en/tools"],
  ["robots-ru", "/tools/robots-txt-tester"],
  ["robots-en", "/en/tools/robots-txt-tester"],
  ["audit-ru", "/audit"],
  ["audit-en", "/en/audit"],
  ["contacts-ru", "/contacts"],
  ["contacts-en", "/en/contacts"],
  ["knowledge-ru", "/knowledge"],
  ["knowledge-en", "/en/knowledge"],
  ["monitoring-ru", "/monitoring"],
  ["monitoring-en", "/en/monitoring"],
  ["pricing-ru", "/pricing"],
  ["pricing-en", "/en/pricing"],
  ["privacy-ru", "/privacy"],
  ["privacy-en", "/en/privacy"],
  ["login-ru", "/login"],
  ["login-en", "/en/login"],
  ["register-ru", "/register"],
  ["register-en", "/en/register"],
  ["404-ru", "/__webdiag_visual_qa_missing__"],
  ["404-en", "/en/__webdiag_visual_qa_missing__"],
] as const;

function isExpectedNotFoundNoise(error: string): boolean {
  if (error === "console.error: Failed to load resource: the server responded with a status of 404 (Not Found)") {
    return true;
  }
  return error.startsWith("http 404:") && error.includes("__webdiag_visual_qa_missing__");
}

async function capture(
  page: import("@playwright/test").Page,
  name: string,
  route: string,
  width: number,
  height: number,
  navigate = false,
) {
  await page.setViewportSize({ width, height });
  if (navigate) {
    const response = await page.goto(route);
    if (name.startsWith("404-")) {
      expect(response?.status()).toBe(404);
    } else {
      expect(response?.ok()).toBe(true);
    }
    await page.locator("body").waitFor({ state: "visible" });
  }
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.screenshot({
    path: `test-results/final-visual-qa/${name}-${width}.png`,
    fullPage: true,
    animations: "disabled",
  });
}

test.describe("final public visual QA captures", () => {
  test.beforeAll(async () => {
    await mkdir("test-results/final-visual-qa", { recursive: true });
  });

  for (const [name, route] of publicRoutes) {
    test(`${name} desktop and mobile browser renders`, async ({ page }, testInfo) => {
      const assertBrowserClean = installBrowserGuard(
        page,
        name.startsWith("404-") ? isExpectedNotFoundNoise : undefined,
      );
      await capture(page, name, route, 1440, 1000, true);
      if (name.startsWith("tools-") || name.startsWith("contacts-") || name.startsWith("404-")) {
        await capture(page, name, route, 1024, 768);
      }
      await capture(page, name, route, 390, 844);
      await assertBrowserClean(testInfo);
    });
  }
});
