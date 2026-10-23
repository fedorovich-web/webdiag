import { expect, test } from "@playwright/test";
import { session, emptyOverview } from "./account-fixtures";
import { createHash } from "node:crypto";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/account/me", (route) =>
    route.fulfill({ json: session }),
  );
  await page.route("**/api/account/projects", (route) =>
    route.fulfill({
      json: {
        contract_version: "webdiag.account.project_list.v1",
        projects: [],
      },
    }),
  );
  await page.route("**/api/account/overview", (route) =>
    route.fulfill({ json: emptyOverview }),
  );
  await page.route("**/api/billing/lava/status", (route) =>
    route.fulfill({ json: { is_live: true, plan: { plan_id: "starter" } } }),
  );
});

test("RU and EN pricing preserve the selected annual or monthly product", async ({
  page,
}) => {
  for (const [path, annualSku, monthlySku] of [
    ["/pricing", "plan-pro-annual", "plan-pro"],
    ["/en/pricing", "plan-pro-annual-usd", "plan-pro-usd"],
  ]) {
    await page.goto(path!);
    const pro = page.locator(".wd-pricing-card").nth(1);
    await pro.getByRole("link").click();
    await expect(page).toHaveURL(new RegExp(`checkout\\?pack=${annualSku}$`));
    await page.goto(path!);
    await page.locator(".wd-billing-toggle-switch").click();
    await pro.getByRole("link").click();
    await expect(page).toHaveURL(new RegExp(`checkout\\?pack=${monthlySku}$`));
  }
});

for (const [path, checkout, registration] of [
  ["/pricing", "/account/checkout?pack=plan-pro-annual", "/register"],
  ["/en/pricing", "/en/account/checkout?pack=plan-pro-annual-usd", "/en/register"],
] as const) {
  test(`${path} keeps checkout clickable while the account response arrives`, async ({ page }) => {
    let releaseSession!: () => void;
    let markRequested!: () => void;
    const sessionGate = new Promise<void>((resolve) => { releaseSession = resolve; });
    const requested = new Promise<void>((resolve) => { markRequested = resolve; });
    await page.route("**/api/account/me", async (route) => {
      markRequested();
      await sessionGate;
      await route.fulfill({ json: session });
    });

    await page.goto(path);
    await requested;
    const link = page.locator(".wd-pricing-card").nth(1).getByRole("link");
    await expect(link).toHaveAttribute("href", `${registration}?return_to=${encodeURIComponent(checkout)}`);
    await link.scrollIntoViewIfNeeded();
    const box = await link.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    releaseSession();
    await expect(link).toHaveAttribute("href", checkout);
    await page.mouse.up();
    await expect(page).toHaveURL(checkout);
  });
}

test("registration and Yandex retain the chosen annual product and use the official round icon", async ({
  page,
  request,
}) => {
  const destination = "/account/checkout?pack=plan-pro-annual";
  await page.goto(`/register?return_to=${encodeURIComponent(destination)}`);
  const yandex = page.locator('a[href^="/api/account/yandex/login"]');
  expect(
    new URL(
      (await yandex.getAttribute("href"))!,
      "http://localhost",
    ).searchParams.get("return_to"),
  ).toBe(destination);
  await expect(yandex.locator("img")).toHaveAttribute(
    "src",
    "/icons/yandex-id.svg",
  );
  await expect(yandex.locator("img")).toHaveAttribute("width", "24");
  const svg = await request.get("/icons/yandex-id.svg");
  expect(svg.ok()).toBe(true);
  expect(await svg.text()).toContain('rx="22"');
  await page.screenshot({ path: "test-results/yandex-registration.png" });
});

test("a success query cannot mark an invoice paid before provider confirmation", async ({
  page,
}) => {
  let paid = false;
  let requests = 0;
  const id = "11111111-1111-4111-8111-111111111111";
  await page.route("**/api/billing/lava/confirm", async (route) => {
    requests++;
    expect(route.request().postDataJSON()).toMatchObject({
      pack_id: "plan-pro-annual",
      invoice_id: id,
    });
    await route.fulfill({
      json: {
        status: paid ? "paid" : "pending",
        invoice_id: id,
        pack_id: "plan-pro-annual",
        currency: "RUB",
        amount: 9480,
        credits: 1800,
      },
    });
  });
  await page.goto(
    `/account/checkout?pack=plan-pro-annual&invoiceId=${id}&status=success`,
  );
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Оплата пока не подтверждена",
  );
  await expect(
    page.getByRole("heading", { name: "Оплата успешно завершена!" }),
  ).toHaveCount(0);
  paid = true;
  await page.getByRole("button", { name: "Проверить оплату" }).click();
  await expect(
    page.getByRole("heading", { name: "Оплата успешно завершена!" }),
  ).toBeVisible();
  expect(requests).toBe(2);
});

test("English annual checkout displays its existing USD total", async ({
  page,
}) => {
  await page.goto("/en/account/checkout?pack=plan-team-annual-usd");
  await expect(
    page.getByRole("button", { name: "Pay $408 with Lava.top", exact: true }),
  ).toBeVisible();
  await expect(page.locator("main")).toContainText("Payment for one year");
  await expect(page.locator("main")).not.toContainText("₽");
});

test("return from Lava restores the session-bound invoice and still checks the provider", async ({
  page,
  context,
}) => {
  const id = "11111111-1111-4111-8111-111111111111";
  const digest = createHash("sha256")
    .update("webdiag_session=checkout-test-owner")
    .digest("hex");
  await context.addCookies([
    {
      name: "webdiag_session",
      value: "checkout-test-owner",
      url: "http://127.0.0.1:4173",
      httpOnly: true,
    },
    {
      name: "webdiag_pending_invoice",
      value: `pack-50.${id}.${digest}`,
      url: "http://127.0.0.1:4173",
      httpOnly: true,
    },
  ]);
  let confirmations = 0;
  await page.route("**/api/billing/lava/confirm", async (route) => {
    confirmations++;
    expect(route.request().postDataJSON()).toMatchObject({
      pack_id: "pack-50",
      invoice_id: id,
    });
    await route.fulfill({
      json: {
        status: "pending",
        invoice_id: id,
        pack_id: "pack-50",
        currency: "RUB",
        amount: 390,
      },
    });
  });
  await page.goto("/account/checkout?pack=pack-50&payment_return=1");
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Оплата пока не подтверждена",
  );
  expect(confirmations).toBe(1);
  await expect(
    page.getByRole("button", { name: "Проверить оплату", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Оплата успешно завершена!" }),
  ).toHaveCount(0);
});

test("checkout explains provider configuration and rejection errors in the selected language", async ({
  page,
}) => {
  for (const [path, code, expected] of [
    [
      "/account/checkout",
      "billing_misconfigured",
      "Оплата временно недоступна",
    ],
    [
      "/account/checkout",
      "billing_provider_error",
      "Не удалось получить ссылку на оплату",
    ],
    [
      "/en/account/checkout",
      "billing_misconfigured",
      "Payments are temporarily unavailable",
    ],
    [
      "/en/account/checkout",
      "billing_provider_error",
      "Could not obtain a payment link",
    ],
  ]) {
    await page.route("**/api/billing/lava/invoice", (route) =>
      route.fulfill({
        status: 503,
        json: {
          detail: { code, message: "Payment service rejected the request." },
        },
      }),
    );
    await page.goto(path!);
    await page
      .locator("main")
      .getByRole("button", { name: /Перейти к оплате|with Lava.top/ })
      .click();
    await expect(page.locator("main").getByRole("alert")).toContainText(
      expected!,
    );
    await expect(page.locator("main").getByRole("alert")).toContainText(
      "support@webdiag.ru",
    );
    await expect(page.locator("main").getByRole("alert")).not.toContainText(
      "Payment service rejected the request.",
    );
    await page.unroute("**/api/billing/lava/invoice");
  }
});
