import { expect, test } from "@playwright/test";
import { installBrowserGuard } from "./browser-guard";

test.describe("local text encoding and diff tools", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;

  test.beforeEach(async ({ page }) => {
    assertBrowserClean = installBrowserGuard(page);
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  test("HTML entity conversion stays local and renders decoded markup as text", async ({ page }) => {
    const requestBodies: string[] = [];
    page.on("request", (request) => {
      const body = request.postData();
      if (body) requestBodies.push(body);
    });

    await page.goto("/en/tools/html-entities-converter");
    await expect(page.getByRole("heading", { level: 1, name: "HTML Entity Encoder and Decoder" })).toBeVisible();

    const input = page.getByLabel("Text or HTML entities");
    const source = '<strong title="café">A&B</strong>';
    await input.fill(source);
    await page.getByLabel("Encode non-ASCII characters").check();
    await page.getByLabel("Numeric entity format").selectOption("hexadecimal");
    await page.getByRole("button", { name: "Encode", exact: true }).click();
    await expect(page.locator("pre.output")).toContainText("&lt;strong title=&quot;caf&#xE9;&quot;&gt;A&amp;B&lt;/strong&gt;");

    const encodedScript = "&lt;script&gt;alert(1)&lt;/script&gt;";
    await input.fill(encodedScript);
    await page.getByRole("button", { name: "Decode", exact: true }).click();
    await expect(page.locator("pre.output")).toHaveText("<script>alert(1)</script>");
    await expect(page.locator("pre.output script")).toHaveCount(0);
    expect(requestBodies.join("\n")).not.toContain(source);
    expect(requestBodies.join("\n")).not.toContain(encodedScript);

    await page.reload();
    await expect(input).toHaveValue("");
    await expect(page.locator("pre.output")).toHaveText("—");
  });

  test("diff checker reports deterministic additions, deletions, and whitespace policy", async ({ page }) => {
    await page.goto("/tools/diff-checker");
    await expect(page.getByRole("heading", { level: 1, name: "Построчное сравнение текста и кода" })).toBeVisible();

    await page.getByLabel("Исходный текст").fill("one\ntwo\nthree");
    await page.getByLabel("Изменённый текст").fill("one\nTWO\nthree\nfour");
    await page.getByRole("button", { name: "Сравнить строки" }).click();

    const summary = page.getByRole("list", { name: "Сводка изменений" });
    await expect(summary).toContainText("Добавлено строк: 2");
    await expect(summary).toContainText("Удалено строк: 1");
    await expect(summary).toContainText("Групп замен: 1");
    await expect(page.locator("pre.output")).toContainText("-two");
    await expect(page.locator("pre.output")).toContainText("+TWO");
    await expect(page.locator("pre.output")).toContainText("+four");

    await page.getByLabel("Исходный текст").fill("value   ");
    await page.getByLabel("Изменённый текст").fill("value");
    await page.getByLabel("Игнорировать пробелы в конце строк").check();
    await page.getByRole("button", { name: "Сравнить строки" }).click();
    await expect(summary).toContainText("Добавлено строк: 0");
    await expect(summary).toContainText("Удалено строк: 0");
    await expect(summary).toContainText("Без изменений: 1");
  });
});
