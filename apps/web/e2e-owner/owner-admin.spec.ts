
import { expect, test, type APIRequestContext } from "@playwright/test";

const PASSWORD = "Synthetic demo password 293";
const UPSTREAM = "http://127.0.0.1:4184";

async function signIn(request: APIRequestContext, email: string) {
  const response = await request.post("/api/account/login", { data: { email, password: PASSWORD } });
  expect(response.status()).toBe(200);
  const cookie = response.headers()["set-cookie"]?.split(";")[0];
  if (!cookie) throw new Error("Sign-in did not set the session cookie");
  return cookie;
}

test("owner browser, BFF and API share only the live session and isolate roles", async ({ page, browser }, info) => {
  const guest = await browser.newContext({ baseURL: "http://127.0.0.1:4183" });
  const member = await browser.newContext({ baseURL: "http://127.0.0.1:4183" });
  try {
    await page.goto("/admin");
    const login = page.getByRole("link", { name: "Войти", exact: true });
    await expect(login).toHaveAttribute("href", "/login?return_to=%2Fadmin");
    await login.click();
    await page.getByLabel("Электронная почта").fill("owner@example.test");
    await page.locator("input[type=password]").fill(PASSWORD);
    await page.getByRole("button", { name: "Войти", exact: true }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: "Регистрации" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Всего клиентов/ })).toContainText("29");
    await expect(page.getByRole("button", { name: /Оплачено счетов \(RUB\)/ })).toContainText("990");
    await expect(page.getByRole("button", { name: /Оплачено счетов \(USD\)/ })).toContainText("5");
    await expect(page.getByRole("button", { name: /Окончание до 7 дней/ })).toContainText("1");
    await page.screenshot({ path: info.outputPath("owner-overview-desktop.png"), fullPage: true });

    const ownerResult = await page.request.get("/api/admin/overview");
    expect(ownerResult.status()).toBe(200);
    expect(ownerResult.headers()["cache-control"]).toBe("private, no-store");
    const guestResult = await guest.request.get("/api/admin/overview");
    expect(guestResult.status()).toBe(401);
    expect(guestResult.headers()["cache-control"]).toBe("private, no-store");
    const guestPage = await guest.request.get("/admin");
    expect(guestPage.status()).toBe(200);
    expect(guestPage.headers()["cache-control"]).toContain("no-store");
    expect(await guestPage.text()).not.toContain("client@example.test");

    const memberCookie = await signIn(member.request, "client@example.test");
    const direct = await member.request.get(UPSTREAM + "/v1/admin/overview", { headers: { cookie: memberCookie } });
    expect(direct.status()).toBe(403);
    expect(direct.headers()["cache-control"]).toBe("private, no-store");
    const memberResult = await member.request.get("/api/admin/overview");
    expect(memberResult.status()).toBe(403);
    const memberPage = await member.newPage();
    expect((await memberPage.goto("/en/admin"))?.status()).toBe(200);
    await expect(memberPage.getByText("This dashboard is available to the WebDiag owner.")).toBeVisible();
    await memberPage.goto("/en/account");
    await expect(memberPage.getByLabel("User menu")).toBeVisible();
    await memberPage.getByLabel("User menu").click();
    await memberPage.getByRole("link", { name: "Account settings" }).click();
    await expect(memberPage.getByRole("heading", { name: "Account settings", exact: true })).toBeVisible();
    await expect(memberPage.getByRole("link", { name: "Owner dashboard" })).toHaveCount(0);

    await page.getByRole("button", { name: /Всего клиентов/ }).click();
    await expect(page.getByRole("table", { name: "Клиенты" })).toBeVisible();
    await page.getByRole("button", { name: "Далее", exact: true }).click();
    await expect(page.getByText("Страница 2")).toBeVisible();
    const search = page.getByRole("searchbox", { name: "Поиск по email" });
    await search.fill("client@example.test");
    await search.press("Enter");
    await expect(page.getByRole("rowheader", { name: "client@example.test" })).toBeVisible();
    await expect(page.getByRole("rowheader")).toHaveCount(1);
    expect(await search.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe("solid");
    await search.fill("missing@example.test");
    await search.press("Enter");
    await expect(page.getByText("По выбранным фильтрам ничего не найдено.")).toBeVisible();

    await page.getByRole("button", { name: "Обзор", exact: true }).click();
    await page.getByRole("combobox", { name: "Период" }).selectOption("7");
    await expect(page.getByText("За выбранный период подтверждённых оплат с известной датой нет.")).toBeVisible();
    await page.getByRole("combobox", { name: "Период" }).selectOption("30");
    await page.getByRole("button", { name: /Оплачено счетов \(USD\)/ }).click();
    await expect(page.getByRole("rowheader", { name: /50 кредитов/ })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Валюта" })).toHaveValue("USD");

    await page.getByRole("link", { name: "Личный кабинет" }).click();
    await page.getByLabel("Меню пользователя").click();
    await page.getByRole("link", { name: "Настройки аккаунта" }).click();
    await expect(page.getByRole("link", { name: "Кабинет владельца" })).toBeVisible();
    const cookies = await page.context().cookies();
    const ownerCookie = cookies.find((cookie) => cookie.name === "webdiag_session")!;
    const directOwner = await page.request.get(UPSTREAM + "/v1/admin/overview", {
      headers: { cookie: ownerCookie.name + "=" + ownerCookie.value },
    });
    expect(directOwner.status()).toBe(200);
    expect((await page.request.post("/api/account/logout")).status()).toBe(200);
    await page.context().addCookies([ownerCookie]);
    expect((await page.request.get("/api/admin/overview")).status()).toBe(401);
    await page.goto("/admin");
    await expect(page.getByRole("link", { name: "Войти", exact: true })).toBeVisible();
  } finally {
    await member.close();
    await guest.close();
  }
});

test("the owner blocks, restores and ends browser sessions from the client list", async ({ page, browser }) => {
  const member = await browser.newContext({ baseURL: "http://127.0.0.1:4183" });
  try {
    await signIn(member.request, "client@example.test");
    await signIn(page.request, "owner@example.test");
    await page.goto("/en/admin");
    await page.getByRole("button", { name: "Clients", exact: true }).click();
    const search = page.getByRole("searchbox", { name: "Search by email" });
    await search.fill("client@example.test");
    await search.press("Enter");
    const account = page.getByRole("row").filter({ has: page.getByRole("rowheader", { name: "client@example.test" }) });
    const confirmation = page.getByRole("dialog");

    await account.getByRole("button", { name: "Block", exact: true }).click();
    await expect(confirmation).toContainText("client@example.test");
    await confirmation.getByRole("button", { name: "Cancel" }).click();
    await expect(account.getByText("Active", { exact: true })).toBeVisible();
    expect((await member.request.get("/api/account/me")).status()).toBe(200);

    await account.getByRole("button", { name: "Block", exact: true }).click();
    await confirmation.getByRole("button", { name: "Block", exact: true }).click();
    await expect(account.getByText("Blocked", { exact: true })).toBeVisible();
    expect((await member.request.get("/api/account/me")).status()).toBe(401);
    const blockedLogin = await member.request.post("/api/account/login", {
      data: { email: "client@example.test", password: PASSWORD },
    });
    expect(blockedLogin.status()).toBe(403);
    expect((await blockedLogin.json()).detail.code).toBe("account_access_blocked");

    await account.getByRole("button", { name: "Unblock", exact: true }).click();
    await confirmation.getByRole("button", { name: "Unblock", exact: true }).click();
    await expect(account.getByText("Active", { exact: true })).toBeVisible();
    expect((await member.request.get("/api/account/me")).status()).toBe(401);
    await signIn(member.request, "client@example.test");

    await account.getByRole("button", { name: "End sessions", exact: true }).click();
    await confirmation.getByRole("button", { name: "End sessions", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText("Sessions ended: 1.");
    expect((await member.request.get("/api/account/me")).status()).toBe(401);
    await expect(account.getByText("Active", { exact: true })).toBeVisible();
    await signIn(member.request, "client@example.test");
  } finally {
    await member.close();
  }
});

test("mobile uses the real data, keeps loading and error distinct, and retries", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: "dark" });
  await signIn(page.request, "owner@example.test");
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Регистрации" })).toBeVisible();
  await page.screenshot({ path: info.outputPath("owner-overview-mobile.png"), fullPage: true });
  expect(await page.locator("body").evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(390);

  await page.route("**/api/admin/usage?*", async (route) => {
    await expect(page.getByRole("status")).toContainText("Загружаем данные");
    await route.fulfill({ status: 503, json: { error: "admin_read_failed" } });
  }, { times: 1 });
  await page.getByRole("button", { name: "Использование", exact: true }).click();
  await expect(page.locator(".wd-owner-data").getByRole("alert")).toHaveText("Данные кабинета временно недоступны.");
  await expect(page.getByRole("heading", { name: "Запуски ИИ" })).toHaveCount(0);
  await page.getByRole("button", { name: "Повторить" }).click();
  await expect(page.getByRole("heading", { name: "Запуски ИИ" })).toBeVisible();
  await expect(page.getByText("Неизвестный результат провайдера").locator("..")).toContainText("1");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  expect(await (await page.request.get("/sitemap.xml")).text()).not.toMatch(/<loc>[^<]*\/admin/);
});


test("returning to an earlier tab waits for fresh owner authorization", async ({ page }) => {
  await signIn(page.request, "owner@example.test");
  await page.goto("/admin");
  await page.getByRole("button", { name: /Всего клиентов/ }).click();
  await expect(page.getByRole("rowheader", { name: "client@example.test" })).toBeVisible();

  let releaseOverview = () => {};
  const pendingOverview = new Promise<void>((resolve) => { releaseOverview = resolve; });
  await page.route("**/api/admin/overview?*", async (route) => {
    await pendingOverview;
    await route.abort();
  });
  await page.getByRole("button", { name: "Обзор", exact: true }).click();
  const clientResponse = page.waitForResponse((response) => response.url().includes("/api/admin/clients"));
  const oldSession = (await page.context().cookies()).find((cookie) => cookie.name === "webdiag_session")!;
  expect((await page.request.post("/api/account/logout")).status()).toBe(200);
  await page.context().addCookies([oldSession]);
  let showedStaleClient = false;
  await page.exposeFunction("recordStaleClient", () => { showedStaleClient = true; });
  await page.evaluate(() => {
    const report = window as Window & { recordStaleClient?: () => void };
    new MutationObserver(() => {
      if (document.querySelector(".wd-owner-table")?.textContent?.includes("client@example.test")) {
        report.recordStaleClient?.();
      }
    }).observe(document.body, { childList: true, subtree: true });
  });
  await page.getByRole("button", { name: "Клиенты", exact: true }).click();
  releaseOverview();
  expect((await clientResponse).status()).toBe(401);
  await expect(page.locator(".wd-owner-data").getByRole("alert")).toContainText("Сессия завершилась");
  expect(showedStaleClient).toBe(false);
});

test("a newly registered customer keeps the existing account flow", async ({ page }) => {
  await page.goto("/en/register");
  await page.locator("input[name=display_name]").fill("Synthetic Registration");
  await page.locator("input[type=email]").fill("registration@example.test");
  await page.locator("input[type=password]").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/account$/);
  await expect(page.getByLabel("User menu")).toBeVisible();
  expect((await page.request.get("/api/admin/access")).status()).toBe(403);
});

test("returning from the public homepage reuses the active account session", async ({ page }) => {
  await signIn(page.request, "client@example.test");
  await page.goto("/account");
  await expect(page.getByLabel("Меню пользователя")).toBeVisible();

  await page.goto("/");
  await page.locator(".wd-header-cta").filter({ hasText: "В кабинет" }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByLabel("Меню пользователя")).toBeVisible();

  await page.goto("/en/login?return_to=%2Fen%2Faccount%2Fsettings");
  await expect(page).toHaveURL(/\/en\/account\/settings$/);
  await expect(page.getByRole("heading", { name: "Account settings", exact: true })).toBeVisible();
});
