import { expect, test } from "@playwright/test";

const expectedError = "Check the entered data.";

test("Unix timestamp converter rejects an empty numeric input", async ({ page }) => {
  await page.goto("/en/tools/unix-timestamp-converter");

  await page.getByLabel("Value").fill("");
  await page.getByRole("button", { name: "Convert to date" }).click();

  await expect(page.locator(".form-error")).toHaveText(expectedError);
});

test("px/rem converter rejects empty values instead of coercing them to zero", async ({ page }) => {
  await page.goto("/en/tools/px-rem-converter");

  await page.getByLabel("px", { exact: true }).fill("");
  await page.getByRole("button", { name: "Convert to rem" }).click();
  await expect(page.locator(".form-error")).toHaveText(expectedError);

  await page.getByLabel("px", { exact: true }).fill("16");
  await page.getByLabel("rem", { exact: true }).fill("");
  await page.getByRole("button", { name: "Convert to px" }).click();
  await expect(page.locator(".form-error")).toHaveText(expectedError);
});
