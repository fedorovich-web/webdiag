import { expect, test } from "@playwright/test";
import { installBrowserGuard } from "./browser-guard";
import { emptyOverview, firstProject, operationsOverview, secondProject, session } from "./account-fixtures";

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
      page.locator(".wd-auth-card").getByRole("link", { name: "Войти" }),
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
    await expect(page.getByRole("link", { name: "Панель управления" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { level: 1, name: "Добавьте первый сайт" })).toBeVisible();
    await expect(page.getByLabel("Текущий проект")).toBeDisabled();

    await page.getByLabel("Название проекта").fill("Основной сайт");
    await page.getByLabel("Адрес сайта").fill("example.com");
    await page.getByRole("button", { name: "Добавить проект" }).click();
    await expect(page.getByRole("heading", { name: "Основной сайт" }).first()).toBeVisible();
    await expect(page.getByLabel("Текущий проект")).toHaveValue(firstProject.id);
    await expect(page.getByLabel("Текущий проект").locator("option")).toHaveCount(2);
    expect(projectListReads).toBe(1);

    await page.getByLabel("Меню пользователя").click();
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

    await expect(page.getByRole("heading", { level: 1, name: "Добро пожаловать!" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Проблемы и приоритеты" })).toBeVisible();
    await expect(page.getByText("Есть изменения")).toBeVisible();
    await expect(page.getByRole("link", { name: "Проверить изменения" })).toBeVisible();
    await expect(page.getByText(/uptime|доступност.*%/i)).toHaveCount(0);
    await expect(page.getByRole("banner").getByRole("link", { name: "Войти", exact: true })).toBeHidden();
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
      page.getByRole("complementary", { name: "Панель кабинета" }).getByRole("link", { name: "Обзор проекта" }),
    ).toHaveAttribute("aria-current", "page");
    await expect(page.getByLabel("Текущий проект")).toBeVisible();
    await expect(page.getByLabel("Текущий проект")).toHaveValue(firstProject.id);
    await expect(page.getByRole("heading", { level: 1, name: "Основной сайт" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Проверка страниц проекта" })).toBeVisible();
    await expect(page.getByText("Проверьте до 25 HTML-страниц одного сайта.", { exact: false })).toBeVisible();
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
    await expect(page.getByText("Проверено страниц")).toBeVisible();
    await expect(page.getByText("Страниц с дублями")).toBeVisible();
    await expect(page.getByText("Достигнут лимит 25 страниц. Результат не описывает весь сайт.")).toBeVisible();
    await expect(page.getByText(/100%|полный охват|весь сайт проверен/i)).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.getByRole("button", { name: "Проверить страницы" }).evaluate((button) => button.clientHeight >= 44)).toBe(true);
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
    await expect(page.getByRole("heading", { name: "Архивированные проекты" })).toBeVisible();
    await page.getByRole("button", { name: "Открыть архив" }).click();
    await expect(page.getByText("Сайт клиента")).toBeVisible();
    await expect(page.getByText(/удалить навсегда/i)).toHaveCount(0);
    await page.getByRole("button", { name: "Восстановить" }).click();
    await expect(page.getByRole("heading", { name: "Сайт клиента" })).toBeVisible();
    await expect(page.getByText("Есть изменения", { exact: true })).toBeVisible();

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
    await expect(page.getByRole("heading", { name: "Добавьте первый сайт" })).toBeVisible();
  });

  test("English login page and header sign-in use live routes", async ({ page }) => {
    await page.goto("/en/login");
    await expect(page.getByRole("heading", { level: 1, name: "Sign in to WebDiag" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Register" })).toHaveAttribute("href", "/en/register");
    const headerSignIn = page.locator('.wd-site-header a[href="/en/login"]');
    await expect(headerSignIn).toHaveAttribute("href", "/en/login");
    await expect(headerSignIn).toBeHidden();
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
    await page.route(`**/api/account/projects/${firstProject.id}`, (route) => route.fulfill({
      json: {
        contract_version: "webdiag.account.project_detail.v1",
        project: firstProject,
        saved_audits: [audit],
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
    await expect(page.getByRole("heading", { level: 1, name: "Проблемы проекта" })).toBeVisible();
    await expect(page.locator(".wd-issues-render-row .wd-issues-priority").first()).toHaveText("P0 — исправить первым");
    await expect(page.getByText(issue.title).first()).toBeVisible();
    await expect(page.getByText("Затронутые страницы").first()).toBeVisible();
    await expect(page.getByText(issue.recommendation.summary).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Проблемы", exact: true })).toHaveAttribute("aria-current", "page");
    await page.locator(".wd-issue-filters label").filter({ hasText: /^Тип проблемы/ }).locator("select").selectOption("security");
    await expect.poll(() => filteredRequest).toContain("category=security");
    await expect(page.getByRole("button", { name: "Сбросить" })).toBeVisible();

    await page.getByRole("link", { name: "Открыть полностью" }).click();
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
