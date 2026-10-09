import { expect, test } from "@playwright/test";
import { session, emptyOverview } from "./account-fixtures";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/account/me", (route) => route.fulfill({ json: session }));
  await page.route("**/api/account/projects", (route) => route.fulfill({ json: { contract_version: "webdiag.account.project_list.v1", projects: [] } }));
  await page.route("**/api/account/overview", (route) => route.fulfill({ json: emptyOverview }));
  await page.route("**/api/billing/lava/status", (route) => route.fulfill({ json: { is_live: true, plan: { plan_id: "starter" } } }));
});

test("RU and EN pricing preserve the selected annual or monthly product", async ({ page }) => {
  for (const [path, annualSku, monthlySku] of [
    ["/pricing", "plan-pro-annual", "plan-pro"],
    ["/en/pricing", "plan-pro-annual-usd", "plan-pro-usd"],
  ]) {
    await page.goto(path!);
    const pro = page.locator(".wd-pricing-card").nth(1);
    await pro.getByRole("button").click();
    await expect(page).toHaveURL(new RegExp(`checkout\\?pack=${annualSku}$`));
    await page.goto(path!);
    await page.locator(".wd-billing-toggle-switch").click();
    await pro.getByRole("button").click();
    await expect(page).toHaveURL(new RegExp(`checkout\\?pack=${monthlySku}$`));
  }
});

test("registration and Yandex retain the chosen annual product and use the official round icon", async ({ page, request }) => {
  const destination = "/account/checkout?pack=plan-pro-annual";
  await page.goto(`/register?return_to=${encodeURIComponent(destination)}`);
  const yandex = page.locator('a[href^="/api/account/yandex/login"]');
  expect(new URL((await yandex.getAttribute("href"))!, "http://localhost").searchParams.get("return_to")).toBe(destination);
  await expect(yandex.locator("img")).toHaveAttribute("src", "/icons/yandex-id.svg");
  await expect(yandex.locator("img")).toHaveAttribute("width", "24");
  const svg = await request.get("/icons/yandex-id.svg");
  expect(svg.ok()).toBe(true);
  expect(await svg.text()).toContain('rx="22"');
  await page.screenshot({ path: "test-results/yandex-registration.png" });
});

test("a success query cannot mark an invoice paid before provider confirmation", async ({ page }) => {
  let paid = false;
  let requests = 0;
  const id = "11111111-1111-4111-8111-111111111111";
  await page.route("**/api/billing/lava/confirm", async (route) => {
    requests++;
    expect(route.request().postDataJSON()).toMatchObject({ pack_id: "plan-pro-annual", invoice_id: id });
    await route.fulfill({ json: { status: paid ? "paid" : "pending", invoice_id: id, pack_id: "plan-pro-annual", currency: "RUB", amount: 9480, credits: 1800 } });
  });
  await page.goto(`/account/checkout?pack=plan-pro-annual&invoiceId=${id}&status=success`);
  await expect(page.locator("main").getByRole("alert")).toContainText("Оплата пока не подтверждена");
  await expect(page.getByRole("heading", { name: "Оплата успешно завершена!" })).toHaveCount(0);
  paid = true;
  await page.getByRole("button", { name: "Проверить оплату" }).click();
  await expect(page.getByRole("heading", { name: "Оплата успешно завершена!" })).toBeVisible();
  expect(requests).toBe(2);
});

test("English annual checkout displays its existing USD total", async ({ page }) => {
  await page.goto("/en/account/checkout?pack=plan-team-annual-usd");
  await expect(page.getByRole("button", { name: "Pay $408 with Lava.top", exact: true })).toBeVisible();
  await expect(page.locator("main")).toContainText("Payment for one year");
  await expect(page.locator("main")).not.toContainText("₽");
});
