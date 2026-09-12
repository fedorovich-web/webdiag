import { expect, test } from "@playwright/test";

const PASSWORD = "correct horse battery staple";
const NEW_PASSWORD = "new correct horse battery";

test("registration exposes resend and verification keeps a persistent session", async ({
  context,
  page,
}) => {
  await page.route("**/api/auth/register", async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      email: "user@example.com",
      password: PASSWORD,
      locale: "ru",
    });
    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Если адрес доступен для регистрации, письмо подтверждения отправлено.",
      }),
    });
  });

  await page.goto("/auth/register");
  await page.getByLabel("Email").fill("user@example.com");
  await page.getByLabel("Пароль").fill(PASSWORD);
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page.getByRole("strong")).toHaveText("Проверьте почту");
  await page.getByRole("link", { name: "Отправить письмо повторно" }).click();
  await expect(page).toHaveURL(/\/auth\/resend-verification$/u);

  await page.route("**/api/auth/resend-verification", async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      email: "user@example.com",
      locale: "ru",
    });
    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Если аккаунту требуется подтверждение, новое письмо будет отправлено.",
      }),
    });
  });
  await page.getByLabel("Email").fill("user@example.com");
  await page.getByRole("button", { name: "Отправить письмо повторно" }).click();
  await expect(page.getByText("Если аккаунту требуется подтверждение")).toBeVisible();

  await page.route("**/api/auth/verify-email", async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      token: "verification-token-value-1234567890",
      locale: "ru",
    });
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "set-cookie":
          "webdiag_session=persistent-session; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax",
      },
      body: JSON.stringify({ message: "Email подтверждён." }),
    });
  });
  await page.goto("/auth/verify-email?token=verification-token-value-1234567890");
  await page.getByRole("button", { name: "Подтвердить email" }).click();
  await expect(page.getByText("Email подтверждён", { exact: true })).toBeVisible();

  const sessionBeforeReload = (await context.cookies()).find(
    (cookie) => cookie.name === "webdiag_session",
  );
  expect(sessionBeforeReload).toMatchObject({
    value: "persistent-session",
    httpOnly: true,
    sameSite: "Lax",
  });
  expect(sessionBeforeReload?.expires).toBeGreaterThan(Date.now() / 1000);

  await page.reload();
  const sessionAfterReload = (await context.cookies()).find(
    (cookie) => cookie.name === "webdiag_session",
  );
  expect(sessionAfterReload?.value).toBe("persistent-session");
});

test("English recovery validates confirmation, revokes the old cookie, and accepts login", async ({
  context,
  page,
}) => {
  await context.addCookies([
    {
      name: "webdiag_session",
      value: "old-session",
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await page.route("**/api/auth/forgot-password", async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      email: "user@example.com",
      locale: "en",
    });
    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({
        message: "If the account exists, password recovery instructions will be sent.",
      }),
    });
  });

  await page.goto("/en/auth/forgot-password");
  await page.getByLabel("Email").fill("user@example.com");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText("Request received")).toBeVisible();

  let resetRequests = 0;
  await page.route("**/api/auth/reset-password", async (route) => {
    resetRequests += 1;
    expect(route.request().postDataJSON()).toEqual({
      token: "password-reset-token-value-1234567890",
      new_password: NEW_PASSWORD,
      locale: "en",
    });
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "set-cookie": "webdiag_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax" },
      body: JSON.stringify({ message: "Password changed. Sign in with your new password." }),
    });
  });
  await page.goto("/en/auth/reset-password?token=password-reset-token-value-1234567890");
  await page.locator('input[name="new-password"]').fill(NEW_PASSWORD);
  await page.locator('input[name="confirm-password"]').fill("different password");
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page.getByText("Passwords do not match.", { exact: true })).toBeVisible();
  expect(resetRequests).toBe(0);

  await page.locator('input[name="confirm-password"]').fill(NEW_PASSWORD);
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page.getByText("Password changed", { exact: true })).toBeVisible();
  expect(resetRequests).toBe(1);
  expect((await context.cookies()).find((cookie) => cookie.name === "webdiag_session")).toBeUndefined();

  await page.route("**/api/auth/login", async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      email: "user@example.com",
      password: NEW_PASSWORD,
      locale: "en",
    });
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "set-cookie": "webdiag_session=new-session; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax",
      },
      body: JSON.stringify({
        id: "00000000-0000-4000-8000-000000000000",
        email: "user@example.com",
        status: "active",
        email_verified_at: "2026-09-11T12:00:00Z",
        created_at: "2026-09-11T11:00:00Z",
        updated_at: "2026-09-11T12:00:00Z",
      }),
    });
  });
  await page.goto("/en/auth/login");
  await page.getByLabel("Email").fill("user@example.com");
  await page.getByLabel("Password").fill(NEW_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en$/u);
  expect((await context.cookies()).find((cookie) => cookie.name === "webdiag_session")?.value).toBe(
    "new-session",
  );
});
