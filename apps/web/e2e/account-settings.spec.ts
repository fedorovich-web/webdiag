import { expect, test } from "@playwright/test";
import { installBrowserGuard } from "./browser-guard";
import { firstProject, operationsOverview, session } from "./account-fixtures";

test.describe("account settings", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;
  let expectedBrowserErrors: RegExp[];

  test.beforeEach(async ({ page }) => {
    expectedBrowserErrors = [];
    assertBrowserClean = installBrowserGuard(
      page,
      (error) => expectedBrowserErrors.some((pattern) => pattern.test(error)),
    );
    await page.route("**/api/account/me", (route) => route.fulfill({ json: session }));
    await page.route("**/api/account/projects", (route) => route.fulfill({
      json: { contract_version: "webdiag.account.project_list.v1", projects: [firstProject] },
    }));
    await page.route("**/api/account/overview", (route) => route.fulfill({ json: operationsOverview }));
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  test("changes the password and revokes other sessions without fake controls", async ({ page }) => {
    let passwordRequests = 0;
    let revokeRequests = 0;
    await page.route("**/api/account/sessions", (route) => route.fulfill({
      json: {
        contract_version: "webdiag.account.sessions.v1",
        active_session_count: 3,
      },
    }));
    await page.route("**/api/account/password", async (route) => {
      passwordRequests += 1;
      expect(route.request().method()).toBe("POST");
      expect(route.request().postDataJSON()).toEqual({
        current_password: "current password value",
        new_password: "replacement password value",
      });
      if (passwordRequests === 1) {
        return route.fulfill({
          status: 401,
          json: {
            detail: {
              code: "account_invalid_current_password",
              message: "The current password is incorrect.",
            },
          },
        });
      }
      return route.fulfill({ json: session });
    });
    await page.route("**/api/account/sessions/revoke-others", (route) => {
      revokeRequests += 1;
      return route.fulfill({
        json: {
          contract_version: "webdiag.account.sessions_revoked.v1",
          active_session_count: 1,
          revoked_session_count: 2,
        },
      });
    });

    await page.goto("/account/settings");
    await expect(page.getByRole("heading", { level: 1, name: "Аккаунт" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Аккаунт" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByText(session.user.email, { exact: true }).first()).toBeVisible();
    await expect(page.getByText("активных сессий")).toBeVisible();
    await expect(page.getByText("3", { exact: true })).toBeVisible();

    const current = page.getByLabel("Текущий пароль");
    const replacement = page.getByLabel("Новый пароль", { exact: true });
    const confirmation = page.getByLabel("Повторите новый пароль");
    await expect(current).toHaveAttribute("autocomplete", "current-password");
    await expect(replacement).toHaveAttribute("autocomplete", "new-password");
    await current.fill("current password value");
    await replacement.fill("replacement password value");
    await confirmation.fill("different replacement value");
    await page.getByRole("button", { name: "Изменить пароль" }).click();
    await expect(page.locator(".wd-account-password-card .wd-account-error")).toContainText("Новые пароли не совпадают");
    await expect(replacement).toHaveAttribute("aria-invalid", "true");
    await expect(confirmation).toHaveAttribute("aria-describedby", /account-password-error/u);
    expect(passwordRequests).toBe(0);

    expectedBrowserErrors.push(
      /^console\.error: Failed to load resource: the server responded with a status of 401\b/u,
      /^http 401: .*\/api\/account\/password$/u,
    );
    await confirmation.fill("replacement password value");
    await page.getByRole("button", { name: "Изменить пароль" }).click();
    await expect.poll(() => passwordRequests).toBe(1);
    await expect(page.locator(".wd-account-password-card .wd-account-error")).toContainText("Текущий пароль указан неверно");
    await expect(current).toHaveAttribute("aria-invalid", "true");
    await expect(replacement).toHaveAttribute("aria-invalid", "false");
    await expect(current).toHaveValue("current password value");
    await expect(replacement).toHaveValue("");

    await replacement.fill("replacement password value");
    await confirmation.fill("replacement password value");
    await page.getByRole("button", { name: "Изменить пароль" }).click();
    await expect.poll(() => passwordRequests).toBe(2);
    await expect(page.getByRole("status")).toContainText("Пароль изменён");
    await expect(current).toHaveValue("");
    await expect(replacement).toHaveValue("");
    await expect(confirmation).toHaveValue("");

    page.once("dialog", (dialog) => dialog.dismiss());
    await page.getByRole("button", { name: "Завершить другие сессии" }).click();
    expect(revokeRequests).toBe(0);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Завершить другие сессии" }).click();
    await expect.poll(() => revokeRequests).toBe(1);
    await expect(page.getByText("Завершено сессий: 2.", { exact: true })).toBeVisible();

    await expect(page.getByText(/Lava|оплат|удалить аккаунт/i)).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await page.goto("/en/account/settings");
    await expect(page.getByRole("heading", { level: 1, name: "Account" })).toBeVisible();
    await page.getByRole("button", { name: "Workspace menu" }).click();
    await expect(page.getByRole("link", { name: "Account" })).toHaveAttribute("aria-current", "page");
    await page.getByRole("button", { name: "Close" }).click();

    await page.unroute("**/api/account/sessions/revoke-others");
    expectedBrowserErrors.push(
      /^console\.error: Failed to load resource: the server responded with a status of 401\b/u,
      /^http 401: .*\/api\/account\/sessions\/revoke-others$/u,
    );
    await page.route("**/api/account/sessions/revoke-others", (route) => route.fulfill({
      status: 401,
      json: { detail: { code: "account_unauthenticated", message: "Session expired." } },
    }));
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "End other sessions" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Sign in to your account" })).toBeVisible();
    await expect(page.getByLabel("Current password")).toHaveCount(0);
  });
});
