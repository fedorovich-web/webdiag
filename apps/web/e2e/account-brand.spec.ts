import { expect, test } from "@playwright/test";
import { installBrowserGuard } from "./browser-guard";

const session = {
  contract_version: "webdiag.account.session.v1",
  authenticated: true,
  user: {
    id: "user-1",
    email: "user@example.com",
    display_name: "Roman User",
    created_at: "2026-07-24T12:00:00Z",
  },
};

const emptyOverview = {
  contract_version: "webdiag.account.overview.v1",
  projects: [],
};

test.describe("account visual brand parity", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;

  test.beforeEach(async ({ page }) => {
    assertBrowserClean = installBrowserGuard(page);
    await page.route("**/api/account/me", (route) => route.fulfill({ json: session }));
    await page.route("**/api/account/projects", (route) => route.fulfill({
      json: { contract_version: "webdiag.account.project_list.v1", projects: [] },
    }));
    await page.route("**/api/account/overview", (route) => route.fulfill({ json: emptyOverview }));
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  test("dashboard uses the same Fresh Mint primary action system as the public site", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/account");

    await expect(page.getByRole("complementary", { name: "Панель кабинета" })).toBeVisible();
    const primary = page.getByRole("button", { name: "Создать проект" });
    await expect(primary).toBeVisible();

    const brand = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const account = document.querySelector<HTMLElement>(".wd-account-workspace-page");
      const activeNav = document.querySelector<HTMLElement>('.wd-workspace-navigation a[aria-current="page"]');
      const primaryButton = [...document.querySelectorAll<HTMLElement>("button")]
        .find((button) => button.textContent?.trim() === "Создать проект");
      return {
        publicGradient: root.getPropertyValue("--wd-button-bg").trim().toLowerCase(),
        dashboardGradient: account?.style.getPropertyValue("--wd-dashboard-primary")
          || (account ? getComputedStyle(account).getPropertyValue("--wd-dashboard-primary").trim().toLowerCase() : ""),
        primaryBackground: primaryButton ? getComputedStyle(primaryButton).backgroundImage.toLowerCase() : "",
        activeNavBackground: activeNav ? getComputedStyle(activeNav).backgroundColor : "",
      };
    });

    expect(brand.publicGradient).toContain("#34d399");
    expect(brand.dashboardGradient).toContain("#34d399");
    expect(brand.dashboardGradient).toContain("#22d3ee");
    expect(brand.dashboardGradient).toContain("#60a5fa");
    expect(brand.primaryBackground).toContain("gradient");
    expect(brand.activeNavBackground).not.toBe("rgba(0, 0, 0, 0)");
  });
});
