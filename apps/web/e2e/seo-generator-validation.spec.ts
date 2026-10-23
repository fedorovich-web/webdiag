import { expect, test } from "@playwright/test";
import { installBrowserGuard } from "./browser-guard";

for (const locale of ["ru", "en"] as const) {
  const prefix = locale === "ru" ? "" : "/en";
  test(`${locale} robots generator reports invalid input in the selected language`, async ({ page }, testInfo) => {
    const assertBrowserClean = installBrowserGuard(page);
    await page.goto(`${prefix}/tools/robots-txt-generator`);
    const workspace = page.locator(".tool-workspace");
    await workspace.getByLabel("Crawl-delay", { exact: true }).fill("NaN");
    const generate = workspace.getByRole("button", { name: /^(Сгенерировать|Generate) robots.txt$/ });
    await generate.click();
    await expect(workspace.getByRole("alert")).toContainText(locale === "ru" ? "положительным числом" : "positive number");
    await workspace.getByLabel("Crawl-delay", { exact: true }).fill("2");
    await generate.click();
    await expect(workspace.getByRole("alert")).toHaveCount(0);
    await expect(workspace.locator("pre")).toContainText("Crawl-delay: 2");
    await assertBrowserClean(testInfo);
  });

  test(`${locale} sitemap generator rejects invalid decimal priority and generates valid XML`, async ({ page }, testInfo) => {
    const assertBrowserClean = installBrowserGuard(page);
    await page.goto(`${prefix}/tools/sitemap-generator`);
    const workspace = page.locator(".tool-workspace");
    await workspace.locator("textarea").fill("https://example.com/");
    await workspace.getByLabel("priority", { exact: true }).fill("0x1");
    const generate = workspace.getByRole("button", { name: /^(Сгенерировать|Generate) sitemap.xml$/ });
    await generate.click();
    await expect(workspace.getByRole("alert")).toContainText(locale === "ru" ? "Приоритет" : "Priority");
    await workspace.getByLabel("priority", { exact: true }).fill("0.8");
    await generate.click();
    await expect(workspace.getByRole("alert")).toHaveCount(0);
    await expect(workspace.locator("pre")).toContainText("<priority>0.8</priority>");
    await assertBrowserClean(testInfo);
  });

  test(`${locale} FAQ markup requires a complete pair and escapes embedded script tags`, async ({ page }, testInfo) => {
    const assertBrowserClean = installBrowserGuard(page);
    await page.goto(`${prefix}/tools/faq-schema-generator`);
    const workspace = page.locator(".tool-workspace");
    const generate = workspace.getByRole("button", { name: /^(Сгенерировать|Generate) FAQPage JSON-LD$/ });
    await generate.click();
    await expect(workspace.getByRole("alert")).toContainText(locale === "ru" ? "вопрос и ответ" : "question/answer");
    await workspace.locator("textarea").fill("Question?\nAn answer with </script> text.");
    await generate.click();
    await expect(workspace.getByRole("alert")).toHaveCount(0);
    const output = await workspace.locator("pre").innerText();
    expect(output.match(/<\/script>/g)).toHaveLength(1);
    expect(output).toContain("\\u003c/script>");
    await assertBrowserClean(testInfo);
  });
}
