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

const emptyOverview = {
  contract_version: "webdiag.account.overview.v1",
  projects: [],
};

const operationsOverview = {
  contract_version: "webdiag.account.overview.v1",
  projects: [{
    project: firstProject,
    latest_audit: {
      id: "33333333-3333-4333-8333-333333333333",
      project_id: firstProject.id,
      status: "succeeded",
      score: 82,
      check_count: 14,
      issue_count: 3,
      completed_at: "2026-08-12T10:00:00Z",
      created_at: "2026-08-12T10:00:00Z",
    },
    monitor: {
      contract_version: "webdiag.account.monitor.v1",
      id: "44444444-4444-4444-8444-444444444444",
      project_id: firstProject.id,
      cadence: "daily",
      timezone: "Europe/Berlin",
      enabled: true,
      status: "changed",
      next_run_at: "2026-08-13T10:00:00Z",
      last_run_at: "2026-08-12T10:00:00Z",
      consecutive_failures: 0,
      created_at: "2026-08-11T10:00:00Z",
      updated_at: "2026-08-12T10:00:00Z",
    },
    report_count: 2,
    shared_report_count: 1,
    latest_report_created_at: "2026-08-12T11:00:00Z",
  }],
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
    await page.route("**/api/account/overview", (route) => route.fulfill({ json: emptyOverview }));
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

  test("native auth fallback never places credentials in the URL", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/login");
    await page.getByLabel("Электронная почта").fill("secret-user@example.com");
    await page.getByLabel("Пароль").fill("secret-password-value");
    await page.getByRole("button", { name: "Войти" }).click();
    expect(page.url()).not.toContain("secret-user");
    expect(page.url()).not.toContain("secret-password");
    await context.close();
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
    await expect(page.getByRole("heading", { level: 1, name: "Создайте первый проект" })).toBeVisible();
    await expect(page.getByLabel("Текущий проект")).toBeDisabled();

    await page.getByLabel("Название проекта").fill("Основной сайт");
    await page.getByLabel("Домен").fill("example.com");
    await page.getByRole("button", { name: "Создать проект" }).click();
    await expect(page.getByRole("heading", { name: "Основной сайт" }).first()).toBeVisible();
    await expect(page.getByLabel("Текущий проект")).toHaveValue("");
    await expect(page.getByLabel("Текущий проект").locator("option")).toHaveCount(2);
    expect(projectListReads).toBe(1);

    await page.getByRole("button", { name: "Выйти" }).click();
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.locator(".wd-account-workspace-page .wd-account-error")).toContainText("Сервис аккаунтов временно недоступен");
  });

  test("operations overview renders only persisted states and keeps desktop geometry", async ({ page }) => {
    await page.unroute("**/api/account/overview");
    await page.route("**/api/account/me", (route) => route.fulfill({ json: session }));
    await page.route("**/api/account/projects", (route) => route.fulfill({
      json: {
        contract_version: "webdiag.account.project_list.v1",
        projects: [firstProject],
      },
    }));
    await page.route("**/api/account/overview", (route) => route.fulfill({ json: operationsOverview }));

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/account");

    await expect(page.getByRole("heading", { level: 1, name: "Обзор" })).toBeVisible();
    await expect(page.getByText("Требуют внимания")).toBeVisible();
    await expect(page.getByText("Есть изменения")).toBeVisible();
    await expect(page.getByRole("link", { name: "Проверить изменения" })).toBeVisible();
    await expect(page.getByText(/uptime|доступност.*%/i)).toHaveCount(0);
    await expect(page.locator(".wd-header-login")).toBeHidden();
    await expect(page.locator(".wd-header-cta").first()).toBeHidden();
    await expect(page.locator(".site-footer")).toBeHidden();

    const rail = await page.getByRole("complementary", { name: "Панель кабинета" }).boundingBox();
    const content = await page.locator(".wd-workspace-content").boundingBox();
    expect(rail).not.toBeNull();
    expect(content).not.toBeNull();
    expect((rail?.x ?? 0) + (rail?.width ?? 0)).toBeLessThan(content?.x ?? 0);
    await page.setViewportSize({ width: 390, height: 844 });
    const nextAction = page.getByRole("link", { name: "Проверить изменения" });
    await expect(nextAction).toBeVisible();
    const nextActionBox = await nextAction.boundingBox();
    expect(nextActionBox?.width).toBeGreaterThan(300);
    expect(nextActionBox?.height).toBeGreaterThanOrEqual(44);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
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
    await page.route(`**/api/account/projects/${firstProject.id}/crawls`, (route) => route.fulfill({
      json: { contract_version: "webdiag.account.crawl_list.v1", jobs: [] },
    }));

    await page.goto(`/account/projects/${firstProject.id}`);
    await expect(
      page.getByRole("complementary", { name: "Панель кабинета" }).getByRole("link", { name: "Проекты" }),
    ).toHaveAttribute("aria-current", "page");
    await expect(page.getByLabel("Текущий проект")).toHaveValue(firstProject.id);
    await expect(page.getByRole("heading", { level: 1, name: "Основной сайт" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Ограниченный обход проекта" })).toBeVisible();
    await expect(page.getByText("До 25 HTML-страниц одного origin")).toBeVisible();
  });

  test("bounded crawl shows persisted findings without claiming full coverage", async ({ page }) => {
    const job = {
      id: "55555555-5555-4555-8555-555555555555",
      project_id: firstProject.id,
      origin: firstProject.origin,
      state: "succeeded",
      error_code: null,
      created_at: "2026-08-13T12:00:00Z",
      updated_at: "2026-08-13T12:01:00Z",
    };
    const result = {
      contract_version: "webdiag.crawl.result.v1",
      origin: firstProject.origin,
      pages: [{
        url: "https://example.com/",
        status_code: 200,
        title: "Example",
        meta_description: null,
        internal_links: ["https://example.com/about"],
      }],
      page_failures: [],
      page_limit: 25,
      page_budget_exhausted: true,
      sitemap_url: "https://example.com/sitemap.xml",
      sitemap_url_count: 3,
      duplicate_titles: [{ value: "Duplicate", urls: ["https://example.com/a", "https://example.com/b"] }],
      duplicate_descriptions: [],
      orphan_urls: ["https://example.com/orphan"],
      completed_at: "2026-08-13T12:01:00Z",
    };
    await page.route("**/api/account/me", (route) => route.fulfill({ json: session }));
    await page.route("**/api/account/projects", (route) => route.fulfill({
      json: { contract_version: "webdiag.account.project_list.v1", projects: [firstProject] },
    }));
    await page.route(`**/api/account/projects/${firstProject.id}`, (route) => route.fulfill({
      json: { contract_version: "webdiag.account.project_detail.v1", project: firstProject, saved_audits: [] },
    }));
    await page.route(`**/api/account/projects/${firstProject.id}/crawls`, (route) => route.fulfill({
      json: { contract_version: "webdiag.account.crawl_list.v1", jobs: [job] },
    }));
    await page.route(`**/api/account/projects/${firstProject.id}/crawls/${job.id}`, (route) => route.fulfill({
      json: { contract_version: "webdiag.account.crawl_detail.v1", job, result },
    }));

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/account/projects/${firstProject.id}`);
    await expect(page.getByText("Получено HTML")).toBeVisible();
    await expect(page.getByText("Страниц с дублями")).toBeVisible();
    await expect(page.getByText("Достигнут лимит 25 страниц. Результат не описывает весь сайт.")).toBeVisible();
    await expect(page.getByText(/100%|полный охват|весь сайт проверен/i)).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.getByRole("button", { name: "Обойти сайт" }).evaluate((button) => button.clientHeight >= 44)).toBe(true);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("project lifecycle is explicit, recoverable, localized, and mobile-safe", async ({ page }) => {
    let active = true;
    let currentProject = firstProject;
    const archived = () => ({
      contract_version: "webdiag.account.archived_project.v1",
      ...currentProject,
      archived_at: "2026-08-13T10:00:00Z",
    });

    await page.route("**/api/account/me", (route) => route.fulfill({ json: session }));
    await page.unroute("**/api/account/overview");
    await page.route("**/api/account/overview", (route) => route.fulfill({
      json: active ? {
        contract_version: "webdiag.account.overview.v1",
        projects: [{
          project: currentProject,
          latest_audit: operationsOverview.projects[0]?.latest_audit ?? null,
          monitor: operationsOverview.projects[0]?.monitor ?? null,
          report_count: 2,
          shared_report_count: 1,
          latest_report_created_at: "2026-08-12T11:00:00Z",
        }],
      } : emptyOverview,
    }));
    await page.route("**/api/account/projects/archived", (route) => route.fulfill({
      json: {
        contract_version: "webdiag.account.archived_project_list.v1",
        projects: active ? [] : [archived()],
      },
    }));
    await page.route(`**/api/account/projects/${firstProject.id}/archive`, (route) => {
      active = false;
      return route.fulfill({ json: archived() });
    });
    await page.route(`**/api/account/projects/${firstProject.id}/restore`, (route) => {
      active = true;
      return route.fulfill({ json: currentProject });
    });
    await page.route(`**/api/account/projects/${firstProject.id}`, async (route) => {
      if (route.request().method() === "PATCH") {
        const body = route.request().postDataJSON() as { name: string };
        currentProject = { ...currentProject, name: body.name, updated_at: "2026-08-13T09:30:00Z" };
        return route.fulfill({ json: currentProject });
      }
      return route.fulfill({
        json: {
          contract_version: "webdiag.account.project_detail.v1",
          project: currentProject,
          saved_audits: [],
        },
      });
    });
    await page.route("**/api/account/projects", (route) => route.fulfill({
      json: {
        contract_version: "webdiag.account.project_list.v1",
        projects: active ? [currentProject] : [],
      },
    }));
    await page.route(`**/api/account/projects/${firstProject.id}/crawls`, (route) => route.fulfill({
      json: { contract_version: "webdiag.account.crawl_list.v1", jobs: [] },
    }));

    await page.goto(`/account/projects/${firstProject.id}`);
    await page.getByRole("button", { name: "Управление проектом" }).click();
    await page.getByLabel("Название проекта").fill("Сайт клиента");
    await page.getByRole("button", { name: "Сохранить название" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Сайт клиента" })).toBeVisible();

    await page.getByRole("button", { name: "Архивировать проект" }).click();
    await expect(page.getByText("Отчёты и ссылки останутся доступны")).toBeVisible();
    await page.getByRole("button", { name: "Отмена" }).click();
    await expect(page).toHaveURL(new RegExp(`/account/projects/${firstProject.id}$`));
    await page.getByRole("button", { name: "Архивировать проект" }).click();
    await page.getByRole("button", { name: "Подтвердить архивирование" }).click();
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByRole("heading", { name: "Архив проектов" })).toBeVisible();
    await page.getByRole("button", { name: "Показать архив" }).click();
    await expect(page.getByText("Сайт клиента")).toBeVisible();
    await expect(page.getByText(/удалить навсегда/i)).toHaveCount(0);
    await page.getByRole("button", { name: "Восстановить" }).click();
    await expect(page.getByRole("heading", { name: "Сайт клиента" })).toBeVisible();
    await expect(page.getByText("2", { exact: true }).first()).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/en/account/projects/${firstProject.id}`);
    await expect(page.getByRole("button", { name: "Manage project" })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await page.unroute(`**/api/account/projects/${firstProject.id}/archive`);
    expectedBrowserErrors.push(
      /^console\.error: Failed to load resource: the server responded with a status of 401\b/u,
      new RegExp(`^http 401: .*\\/api\\/account\\/projects\\/${firstProject.id}\\/archive$`, "u"),
    );
    await page.route(`**/api/account/projects/${firstProject.id}/archive`, (route) => route.fulfill({
      status: 401,
      json: { detail: { code: "account_unauthenticated", message: "Session expired." } },
    }));
    await page.getByRole("button", { name: "Manage project" }).click();
    await page.getByRole("button", { name: "Archive project" }).click();
    await page.getByRole("button", { name: "Confirm archive" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Sign in to your account" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Manage project" })).toHaveCount(0);
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
    await expect(
      page.locator(".wd-site-header").getByRole("button", { name: "Меню кабинета" }),
    ).toBeVisible();
    await expect(page.locator(".wd-workspace-mobile-bar")).toHaveCount(0);
    const headerTargets = await page
      .locator(".wd-site-header a, .wd-site-header button, .wd-site-header summary")
      .evaluateAll((elements) => elements.flatMap((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          return [];
        }
        return [{
          label: element.getAttribute("aria-label") ?? element.textContent?.trim() ?? element.tagName,
          width: rect.width,
          height: rect.height,
        }];
      }));
    for (const target of headerTargets) {
      expect(target.width, `${target.label} touch target width`).toBeGreaterThanOrEqual(44);
      expect(target.height, `${target.label} touch target height`).toBeGreaterThanOrEqual(44);
    }
    await trigger.click();
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("hidden");
    const triggerBox = await trigger.boundingBox();
    expect(triggerBox?.height).toBeGreaterThanOrEqual(44);

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
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("");

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
    await expect(page.getByRole("heading", { name: "Создайте первый проект" })).toBeVisible();
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
    await expect(page.getByRole("heading", { level: 1, name: "Очередь исправлений" })).toBeVisible();
    await expect(page.getByRole("article").getByText("P0 — исправить первым")).toBeVisible();
    await expect(page.getByText("1 страница")).toBeVisible();
    await expect(page.getByText("Следующее действие")).toBeVisible();
    await expect(page.getByRole("link", { name: issue.title })).toBeVisible();
    await expect(page.getByRole("link", { name: "Проблемы", exact: true })).toHaveAttribute("aria-current", "page");
    await page.locator(".wd-issue-filters label").filter({ hasText: /^Категория/ }).locator("select").selectOption("security");
    await expect.poll(() => filteredRequest).toContain("category=security");
    await expect(page.getByRole("button", { name: "Сбросить" })).toBeVisible();

    await page.getByRole("link", { name: issue.title }).click();
    await expect(page.getByRole("heading", { level: 1, name: issue.title })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Что обнаружено" })).toBeVisible();
    await expect(page.getByText(issue.description)).toBeVisible();
    await expect(page.getByText("Configure the required headers.")).toBeVisible();
    await expect(page.getByText("https://example.com/")).toBeVisible();
    await expect(page.getByText("critical", { exact: true })).toBeHidden();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByText("Технические данные").click();
    await expect(page.getByText("critical", { exact: true })).toBeVisible();
    await expect(page.getByText(issue.issue_id, { exact: true })).toBeVisible();
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
    await expect(page.getByText("Включён", { exact: true })).toBeVisible();
    await expect(page.getByText("Раз в день", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Europe/Berlin", { exact: true }).first()).toBeVisible();
    await page.getByRole("button", { name: "Проверить сейчас" }).click();
    await expect(page.getByText("Базовый результат")).toBeVisible();
    await expect(page.getByText("88/100")).toBeVisible();
    await expect(page.getByText("Проблем в сохранённом аудите: 2")).toBeVisible();
    await expect(page.getByText(/uptime/i)).toHaveCount(0);
    await expect(page.getByText(/уведомлен/i)).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
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
      checks: [
        { check_id: "security.headers", name: "Security headers", category: "security", status: "failed" },
        { check_id: "http.status", name: "HTTP status", category: "http", status: "passed" },
      ],
      issues: [{
        issue_id: "security.headers.missing",
        check_id: "security.headers",
        category: "security",
        severity: "high",
        priority: "p0",
        title: "Security headers are missing",
        description: "Required response headers are not present.",
        affected_urls: [firstProject.origin],
        recommendation: {
          summary: "Configure the required headers.",
          steps: ["Add the headers at the edge or origin server."],
          expected_impact: "Reduced browser-side exposure.",
        },
      }],
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
    const listItem = {
      ...summary,
      project_name: snapshot.project_name,
      target_origin: snapshot.target_origin,
      audit_completed_at: snapshot.audit_completed_at,
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
    await page.route("**/api/account/reports?*", (route) => route.fulfill({
      json: { contract_version: "webdiag.account.report_list.v2", reports: [listItem] },
    }));
    let shared = false;
    let shareRequests = 0;
    let activeShareToken = "A".repeat(43);
    const currentDetail = () => ({
      ...reportDetail,
      report: {
        ...summary,
        shared,
        share_expires_at: shared ? "2026-08-08T10:00:00Z" : null,
      },
    });
    await page.route(`**/api/account/reports/${reportId}`, (route) => route.fulfill({ json: currentDetail() }));
    await page.route(`**/api/account/reports/${reportId}/share`, (route) => {
      if (route.request().method() === "DELETE") {
        shared = false;
        return route.fulfill({ json: currentDetail() });
      }
      shared = true;
      shareRequests += 1;
      activeShareToken = (shareRequests === 1 ? "A" : "B").repeat(43);
      return route.fulfill({
        json: {
          contract_version: "webdiag.account.report_share.v1",
          report_id: reportId,
          share_token: activeShareToken,
          share_path: `/reports/share/${activeShareToken}`,
          expires_at: "2026-08-08T10:00:00Z",
        },
      });
    });
    await page.route("**/api/reports/share/*", (route) => route.fulfill({
      json: {
        contract_version: "webdiag.public.report.v1",
        report: {
          title: snapshot.title,
          locale: snapshot.locale,
          created_at: summary.created_at,
          expires_at: "2026-08-08T10:00:00Z",
        },
        snapshot,
      },
    }));

    await page.goto(`/account/reports?project_id=${firstProject.id}`);
    await expect(page.getByRole("heading", { level: 1, name: "Сохранённые отчёты" })).toBeVisible();
    await expect(page.locator(".wd-report-list article").getByText(firstProject.origin, { exact: false })).toBeVisible();
    await expect(page.getByRole("link", { name: "Отчёты проекта" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByText("31 июл. 2026 г.", { exact: false })).toBeVisible();

    await page.goto(`/account/projects/${firstProject.id}/audits/${auditId}`);
    await page.getByLabel("Название отчёта").fill(snapshot.title);
    await page.getByRole("button", { name: "Создать отчёт" }).click();
    await page.getByRole("link", { name: "Открыть сохранённый отчёт" }).click();

    await expect(page.getByRole("heading", { level: 1, name: snapshot.title })).toBeVisible();
    await expect(page.getByRole("link", { name: "Отчёты проекта" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { name: "Результат сохранённого аудита" })).toBeVisible();
    await expect(page.getByText("Зафиксировано проблем: 1.", { exact: false })).toBeVisible();
    await expect(page.getByText("Высокая", { exact: true })).toBeVisible();
    await expect(page.getByText("P0 — исправить первым", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Что содержит этот отчёт" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Скачать HTML" })).toHaveAttribute(
      "href",
      `/api/account/reports/${reportId}/export.html`,
    );
    await page.getByRole("button", { name: "Включить общий доступ" }).click();
    await expect(page.getByLabel(/показывается один раз/i)).toHaveValue(
      new RegExp(`/reports/share/${"A".repeat(43)}$`),
    );
    await page.getByRole("button", { name: "Копировать ссылку" }).click();
    await expect(page.getByRole("status")).toContainText(/Ссылка скопирована|Не удалось скопировать/);

    page.once("dialog", (dialog) => dialog.dismiss());
    await page.getByRole("button", { name: "Выпустить новую ссылку" }).click();
    expect(shareRequests).toBe(1);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Выпустить новую ссылку" }).click();
    await expect.poll(() => shareRequests).toBe(2);
    await expect(page.getByLabel(/показывается один раз/i)).toHaveValue(
      new RegExp(`/reports/share/${"B".repeat(43)}$`),
    );

    const publicResponse = await page.goto(`/reports/share/${activeShareToken}`);
    expect(publicResponse?.headers()["cache-control"]).toContain("no-store");
    expect(publicResponse?.headers()["x-robots-tag"]).toBe("noindex, nofollow, noarchive");
    expect(publicResponse?.headers()["referrer-policy"]).toBe("no-referrer");
    await expect(page.getByRole("heading", { level: 1, name: snapshot.title })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Результат сохранённого аудита" })).toBeVisible();
    await expect(page.getByText(firstProject.id)).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Скачать HTML" })).toHaveAttribute(
      "href",
      `/api/reports/share/${activeShareToken}/export.html`,
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await page.goto(`/account/reports/${reportId}`);
    await expect(page.getByRole("heading", { level: 1, name: snapshot.title })).toBeVisible();
    const mobileReportLastMeta = await page.locator(".wd-report-meta > div").last().boundingBox();
    expect(mobileReportLastMeta?.width).toBeGreaterThan(300);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Отозвать ссылку" }).click();
    await expect(page.getByRole("button", { name: "Включить общий доступ" })).toBeVisible();
    await expect(page.getByText("Отчёт не является измерением uptime и не подтверждает непрерывную доступность сайта.", { exact: true })).toBeVisible();
    await expect(page.getByText(/\d+(?:[.,]\d+)?\s*%/)).toHaveCount(0);
  });
});

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
