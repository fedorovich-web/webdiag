import { expect, test } from "@playwright/test";

test("public navigation opens the WebDiag account for an active browser session", async ({ page }) => {
  const header = page.locator(".wd-site-header");
  await page.goto("/");
  await expect(header.getByRole("link", { name: "Войти", exact: true })).toBeVisible();
  await expect(header.getByRole("link", { name: /Создать аккаунт/ })).toBeVisible();

  const login = await page.request.post("/api/account/login", {
    data: { email: "client@example.test", password: "Synthetic demo password 293" },
  });
  expect(login.status()).toBe(200);
  await page.reload();
  await expect(header.getByRole("link", { name: /В кабинет/ })).toHaveAttribute("href", "/account");
  await expect(header.getByRole("link", { name: "Войти", exact: true })).toHaveCount(0);
  await expect(header.getByRole("link", { name: /Создать аккаунт/ })).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en");
  await header.getByRole("button", { name: "Open menu" }).click();
  const menu = header.getByRole("dialog");
  await expect(menu.getByRole("link", { name: "My account", exact: true })).toHaveAttribute("href", "/en/account");
  await expect(menu.getByRole("link", { name: "Sign in", exact: true })).toHaveCount(0);
  await expect(menu.getByRole("link", { name: "Create account", exact: true })).toHaveCount(0);
});
