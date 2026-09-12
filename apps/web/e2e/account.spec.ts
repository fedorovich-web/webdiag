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

const firstProject = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Основной сайт",
  origin: "https://example.com",
  created_at: "2026-07-30T10:00:00Z",
  updated_at: "2026-07-31T10:00:00Z",
};

const secondProject = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "Документация",
  origin: "https://docs.example.com",
  created_at: "2026-07-29T10:00:00Z",
  updated_at: "2026-07-30T10:00:00Z",
};

test.describe("account workspace", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;
  let expectedBrowserErrors: RegExp[];

  test.beforeEach(async ({ page }) => {
    expectedBrowserErrors = [];
    assertBrowserClean = installBrowserGuard(
      page,
      (error) => expectedBrowserErrors.some((pattern) => pattern.test(error)),
    );
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  test("Russian login and registration pages expose accessible real forms", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1, name: "Войти в WebDiag" })).toBeVisible();
    await expect(page.getByLabel("Электронная почта")).toHaveAttribute("autocomplete", "email");
    await expect(page.getByLabel("Пароль")).toHaveAttribute("autocomplete", "current-password");
    await expect(page.getByRole("link", { name: "Зарегистрироваться" })).toHaveAttribute("href", "/register");

    await page.goto("/register");
    await expect(page.getByRole("heading", { level: 1, name: "Создать аккаунт" })).toBeVisible();
    await expect(page.getByLabel("Имя")).toHaveAttribute("autocomplete", "name");
    await expect(page.getByLabel("Пароль")).toHaveAttribute("autocomplete", "new-password");
    await expect(
      page.locator(".wd-account-card").getByRole("link", { name: "Войти" }),
    ).toHaveAttribute("href", "/login");
  });

  test("desktop shell creates a project without reloading the project list and keeps failed logout on the page", async ({ page }) => {
    expectedBrowserErrors.push(
      /^console\.error: Failed to load resource: the server responded with a status of 502\b/,
      /^http 502: .*\/api\/account\/logout$/,
    );
    let projectListReads = 0;
    await page.route("**/api/account/me", (route) => route.fulfill({ json: session }));
    await page.route("**/api/account/projects", async (route) => {
      if (route.request().method() === "POST") return route.fulfill({ status: 201, json: firstProject });
      projectListReads += 1;
      return route.fulfill({
        json: { contract_version: "webdiag.account.project_list.v1", projects: [] },
      });
    });
    await page.route("**/api/account/logout", (route) => route.fulfill({
      status: 502,
      json: { detail: { code: "account_api_unavailable", message: "Unavailable" } },
    }));

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/account");
    await expect(page.getByRole("complementary", { name: "Панель кабинета" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Обзор" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { level: 1, name: "Обзор аккаунта Roman User" })).toBeVisible();
    await expect(page.getByLabel("Текущий проект")).toBeDisabled();

    await page.getByLabel("Название проекта").fill("Основной сайт");
    await page.getByLabel("Домен или origin").fill("example.com");
    await page.getByRole("button", { name: "Создать проект" }).click();
    await expect(page.getByRole("heading", { name: "Основной сайт" }).first()).toBeVisible();
    await expect(page.getByLabel("Текущий проект")).toHaveValue("");
    await expect(page.getByLabel("Текущий проект").locator("option")).toHaveCount(2);
    expect(projectListReads).toBe(1);

    await page.getByRole("button", { name: "Выйти" }).click();
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.locator(".wd-account-workspace-page .wd-account-error")).toContainText("Сервис аккаунтов временно недоступен");
  });

  test("project route keeps the real project selected in the shell", async ({ page }) => {
    await page.route("**/api/account/me", (route) => route.fulfill({ json: session }));
    await page.route("**/api/account/projects", (route) => route.fulfill({
      json: {
        contract_version: "webdiag.account.project_list.v1",
        projects: [firstProject, secondProject],
      },
    }));
    await page.route(`**/api/account/projects/${firstProject.id}`, (route) => route.fulfill({
      json: {
        contract_version: "webdiag.account.project_detail.v1",
        project: firstProject,
        saved_audits: [],
      },
    }));

    await page.goto(`/account/projects/${firstProject.id}`);
    await expect(
      page.getByRole("complementary", { name: "Панель кабинета" }).getByRole("link", { name: "Проекты" }),
    ).toHaveAttribute("aria-current", "page");
    await expect(page.getByLabel("Текущий проект")).toHaveValue(firstProject.id);
    await expect(page.getByRole("heading", { level: 1, name: "Основной сайт" })).toBeVisible();
  });

  test("mobile drawer traps focus, closes with Escape, and restores the trigger", async ({ page }) => {
    await page.route("**/api/account/me", (route) => route.fulfill({ json: session }));
    await page.route("**/api/account/projects", (route) => route.fulfill({
      json: {
        contract_version: "webdiag.account.project_list.v1",
        projects: [firstProject, secondProject],
      },
    }));

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/account");
    const trigger = page.getByRole("button", { name: "Меню кабинета" });
    await expect(trigger).toBeVisible();
    await trigger.click();

    const dialog = page.getByRole("dialog", { name: "Меню кабинета" });
    await expect(dialog).toBeVisible();
    const close = dialog.getByRole("button", { name: "Закрыть" });
    await expect(close).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(dialog.getByRole("button", { name: "Выйти" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scroll).toBe(dimensions.viewport);
  });

  test("unavailable account state offers retry instead of a false sign-in action", async ({ page }) => {
    expectedBrowserErrors.push(
      /^console\.error: Failed to load resource: the server responded with a status of 502\b/,
      /^http 502: .*\/api\/account\/me$/,
    );
    let calls = 0;
    await page.route("**/api/account/me", (route) => {
      calls += 1;
      if (calls === 1) {
        return route.fulfill({
          status: 502,
          json: { detail: { code: "account_api_unavailable", message: "Unavailable" } },
        });
      }
      return route.fulfill({ json: session });
    });
    await page.route("**/api/account/projects", (route) => route.fulfill({
      json: { contract_version: "webdiag.account.project_list.v1", projects: [] },
    }));

    await page.goto("/account");
    await expect(page.getByRole("button", { name: "Повторить" })).toBeVisible();
    await page.getByRole("button", { name: "Повторить" }).click();
    await expect(page.getByRole("heading", { name: "Обзор аккаунта Roman User" })).toBeVisible();
  });

  test("English login page and header sign-in use live routes", async ({ page }) => {
    await page.goto("/en/login");
    await expect(page.getByRole("heading", { level: 1, name: "Sign in to WebDiag" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Register" })).toHaveAttribute("href", "/en/register");
    await expect(page.locator(".wd-header-login")).toHaveAttribute("href", "/en/login");
  });

  test("saved audit exposes deterministic issues, filters, and issue detail", async ({ page }) => {
    const auditId = "33333333-3333-4333-8333-333333333333";
    const issue = {
      issue_id: "security.headers.missing",
      check_id: "security.headers",
      category: "security",
      source_category: "security",
      severity: "critical",
      priority: "p0",
      fix_order: 1,
      title: "Security headers are missing",
      description: "Required response headers are not present.",
      affected_urls: ["https://example.com/"],
      recommendation: {
        summary: "Configure the required headers.",
        steps: ["Add the headers at the edge or origin server."],
        expected_impact: "Reduced browser-side exposure.",
      },
    };
    const audit = {
      id: auditId,
      project_id: firstProject.id,
      status: "succeeded",
      score: 60,
      check_count: 1,
      issue_count: 1,
      completed_at: "2026-07-31T12:00:00Z",
      created_at: "2026-07-31T12:00:00Z",
    };
    let filteredRequest = "";

    await page.route("**/api/account/me", (route) => route.fulfill({ json: session }));
    await page.route("**/api/account/projects", (route) => route.fulfill({
      json: {
        contract_version: "webdiag.account.project_list.v1",
        projects: [firstProject],
      },
    }));
    await page.route(`**/api/account/projects/${firstProject.id}/audits/${auditId}/issues/**`, (route) => route.fulfill({
      json: {
        contract_version: "webdiag.account.issue_detail.v1",
        project: firstProject,
        audit,
        issue,
      },
    }));
    await page.route(`**/api/account/projects/${firstProject.id}/audits/${auditId}/issues*`, (route) => {
      filteredRequest = route.request().url();
      return route.fulfill({
        json: {
          contract_version: "webdiag.account.issue_list.v1",
          project: firstProject,
          audit,
          total: 1,
          items: [issue],
        },
      });
    });

    await page.goto(`/account/projects/${firstProject.id}/audits/${auditId}/issues`);
    await expect(page.getByRole("heading", { level: 1, name: "Проблемы и приоритеты" })).toBeVisible();
    await expect(page.getByRole("link", { name: issue.title })).toBeVisible();
    await page.locator(".wd-issue-filters label").filter({ hasText: /^Категория/ }).locator("select").selectOption("security");
    await expect.poll(() => filteredRequest).toContain("category=security");

    await page.getByRole("link", { name: issue.title }).click();
    await expect(page.getByRole("heading", { level: 1, name: issue.title })).toBeVisible();
    await expect(page.getByText("Configure the required headers.")).toBeVisible();
    await expect(page.getByText("https://example.com/")).toBeVisible();
  });

});

test.describe("account monitoring", () => {
  test("configures monitoring, runs a real check, and renders persisted history", async ({ page }) => {
    const projectId = firstProject.id;
    const monitor = {
      contract_version: "webdiag.account.monitor.v1",
      id: "44444444-4444-4444-8444-444444444444",
      project_id: projectId,
      cadence: "daily",
      timezone: "Europe/Berlin",
      enabled: true,
      status: "passed",
      next_run_at: "2026-08-01T12:00:00Z",
      last_run_at: "2026-07-31T12:00:00Z",
      consecutive_failures: 0,
      created_at: "2026-07-31T10:00:00Z",
      updated_at: "2026-07-31T12:00:00Z",
    };
    const run = {
      id: "55555555-5555-4555-8555-555555555555",
      monitor_id: monitor.id,
      project_id: projectId,
      status: "passed",
      score: 88,
      issue_count: 2,
      started_at: "2026-07-31T12:00:00Z",
      completed_at: "2026-07-31T12:00:05Z",
      change: {
        contract_version: "webdiag.account.monitor_change.v1",
        kind: "baseline",
        previous_score: null,
        current_score: 88,
        score_delta: null,
        previous_issue_count: null,
        current_issue_count: 2,
        added_issue_ids: [],
        resolved_issue_ids: [],
      },
      error_code: null,
    };
    let historyReads = 0;
    await page.route("**/api/account/me", (route) => route.fulfill({ json: session }));
    await page.route("**/api/account/projects", (route) => route.fulfill({
      json: { contract_version: "webdiag.account.project_list.v1", projects: [firstProject] },
    }));
    await page.route(`**/api/account/projects/${projectId}/monitor/history`, (route) => {
      historyReads += 1;
      if (historyReads === 1) {
        return route.fulfill({
          status: 404,
          json: { detail: { code: "account_monitor_not_found", message: "Not found" } },
        });
      }
      return route.fulfill({
        json: {
          contract_version: "webdiag.account.monitor_history.v1",
          monitor,
          runs: [run],
        },
      });
    });
    await page.route(`**/api/account/projects/${projectId}/monitor`, (route) => route.fulfill({ status: 201, json: monitor }));
    await page.route(`**/api/account/projects/${projectId}/monitor/run`, (route) => route.fulfill({
      status: 201,
      json: { contract_version: "webdiag.account.monitor_run.v1", run },
    }));

    await page.goto(`/account/projects/${projectId}/monitoring`);
    await expect(page.getByRole("heading", { level: 1, name: "Мониторинг проекта" })).toBeVisible();
    await page.getByRole("button", { name: "Включить мониторинг" }).click();
    await expect(page.getByRole("heading", { level: 2, name: "История проверок" })).toBeVisible();
    await page.getByRole("button", { name: "Проверить сейчас" }).click();
    await expect(page.getByText("Оценка: 88 · Проблем: 2")).toBeVisible();
    await expect(page.getByText(/uptime/i)).toHaveCount(0);
    await expect(page.getByText(/уведомлен/i)).toHaveCount(0);
  });
});

test.describe("account reports", () => {
  test("creates an immutable report and issues an expiring share link", async ({ page }) => {
    const auditId = "33333333-3333-4333-8333-333333333333";
    const reportId = "66666666-6666-4666-8666-666666666666";
    const snapshot = {
      contract_version: "webdiag.account.report_snapshot.v1",
      title: "Клиентский отчёт",
      locale: "ru",
      project_name: firstProject.name,
      target_origin: firstProject.origin,
      audit_completed_at: "2026-07-31T12:00:00Z",
      score: 88,
      checks: [],
      issues: [],
      generated_at: "2026-08-01T10:00:00Z",
    };
    const summary = {
      id: reportId,
      project_id: firstProject.id,
      audit_id: auditId,
      title: snapshot.title,
      locale: "ru",
      status: "ready",
      created_at: "2026-08-01T10:00:00Z",
      updated_at: "2026-08-01T10:00:00Z",
      shared: false,
      share_expires_at: null,
    };
    const reportDetail = {
      contract_version: "webdiag.account.report_detail.v1",
      report: summary,
      snapshot,
    };
    const auditDetail = {
      contract_version: "webdiag.account.saved_audit_detail.v1",
      project: firstProject,
      audit: {
        id: auditId,
        project_id: firstProject.id,
        status: "succeeded",
        score: 88,
        check_count: 0,
        issue_count: 0,
        completed_at: "2026-07-31T12:00:00Z",
        created_at: "2026-07-31T12:00:00Z",
      },
      payload: {
        contract_version: "webdiag.account.saved_audit_payload.v1",
        target_origin: firstProject.origin,
        status: "succeeded",
        score: 88,
        checks: [],
        issues: [],
        completed_at: "2026-07-31T12:00:00Z",
      },
    };

    await page.route("**/api/account/me", (route) => route.fulfill({ json: session }));
    await page.route("**/api/account/projects", (route) => route.fulfill({
      json: { contract_version: "webdiag.account.project_list.v1", projects: [firstProject] },
    }));
    await page.route(`**/api/account/projects/${firstProject.id}/audits/${auditId}`, (route) => route.fulfill({ json: auditDetail }));
    await page.route(`**/api/account/projects/${firstProject.id}/audits/${auditId}/reports`, (route) => route.fulfill({ status: 201, json: reportDetail }));
    await page.route(`**/api/account/reports/${reportId}`, (route) => route.fulfill({ json: reportDetail }));
    await page.route(`**/api/account/reports/${reportId}/share`, (route) => route.fulfill({
      json: {
        contract_version: "webdiag.account.report_share.v1",
        report_id: reportId,
        share_token: "A".repeat(43),
        share_path: `/reports/share/${"A".repeat(43)}`,
        expires_at: "2026-08-08T10:00:00Z",
      },
    }));

    await page.goto(`/account/projects/${firstProject.id}/audits/${auditId}`);
    await page.getByLabel("Название отчёта").fill(snapshot.title);
    await page.getByRole("button", { name: "Создать отчёт" }).click();
    await page.getByRole("link", { name: "Открыть сохранённый отчёт" }).click();

    await expect(page.getByRole("heading", { level: 1, name: snapshot.title })).toBeVisible();
    await expect(page.getByRole("link", { name: "Скачать HTML" })).toHaveAttribute(
      "href",
      `/api/account/reports/${reportId}/export.html`,
    );
    await page.getByRole("button", { name: "Включить общий доступ" }).click();
    await expect(page.getByLabel("Ссылка показывается один раз")).toHaveValue(
      new RegExp(`/reports/share/${"A".repeat(43)}$`),
    );
    await expect(page.getByText(/uptime/i)).toHaveCount(0);
  });
});
