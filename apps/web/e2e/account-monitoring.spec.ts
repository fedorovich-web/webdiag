import { expect, test } from "@playwright/test";
import { firstProject, operationsOverview, session } from "./account-fixtures";

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
    await expect(page.getByText("Найдено проблем: 2")).toBeVisible();
    await expect(page.getByText(/uptime/i)).toHaveCount(0);
    await expect(page.getByText(/уведомлен/i)).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("AI workspace stays factual and runs the saved-audit copilot", async ({ page }) => {
    const auditId = "33333333-3333-4333-8333-333333333333";
    const runId = "77777777-7777-4777-8777-777777777777";
    const toolIds = [
      "ai_audit_action_plan",
      "ai_competitor_gap_report",
      "ai_content_brief",
      "ai_content_optimizer",
      "ai_search_intent_page_fit",
      "ai_internal_linking_planner",
    ] as const;
    const catalog = {
      contract_version: "webdiag.ai.catalog.v1",
      tools: toolIds.map((id) => ({ id, contract_version: "webdiag.ai.tool.v1", credit_price: 1 })),
    };
    const running = {
      id: runId,
      tool_id: "ai_audit_action_plan",
      contract_version: "webdiag.ai.run.v1",
      credit_price: 1,
      state: "running",
      output: null,
      error_code: null,
      created_at: "2026-08-13T12:00:00Z",
      updated_at: "2026-08-13T12:00:01Z",
    };
    const succeeded = {
      ...running,
      state: "succeeded",
      output: {
        summary: "Начните с исправления заголовков безопасности, затем перепроверьте сохранённый аудит.",
        actions: [{
          issue_ids: ["security.headers.missing"],
          title: "Усилить заголовки безопасности",
          rationale: "Проблема подтверждена исходным аудитом.",
          steps: ["Добавьте X-Content-Type-Options: nosniff."],
          verification: "Повторите аудит и проверьте заголовок в ответе.",
          affected_urls: [firstProject.origin],
        }],
      },
    };

    await page.route("**/api/account/me", (route) => route.fulfill({ json: session }));
    await page.route("**/api/account/projects", (route) => route.fulfill({
      json: { contract_version: "webdiag.account.project_list.v1", projects: [firstProject] },
    }));
    await page.route("**/api/account/overview", (route) => route.fulfill({ json: operationsOverview }));
    await page.route("**/api/account/ai/catalog", (route) => route.fulfill({ json: catalog }));
    await page.route("**/api/account/credits", (route) => route.fulfill({
      json: { contract_version: "webdiag.credits.balance.v1", account: { available: 12, reserved: 0 } },
    }));
    await page.route("**/api/account/ai/runs", async (route) => {
      if (route.request().method() === "POST") return route.fulfill({ status: 202, json: { contract_version: "webdiag.ai.run.v1", run: running } });
      return route.fulfill({ json: { contract_version: "webdiag.ai.run_list.v1", runs: [], next_cursor: null } });
    });
    await page.route(`**/api/account/ai/runs/${runId}`, (route) => route.fulfill({
      json: { contract_version: "webdiag.ai.run.v1", run: succeeded },
    }));
    await page.route(`**/api/account/projects/${firstProject.id}/audits/${auditId}?locale=ru`, (route) => route.fulfill({
      json: {
        contract_version: "webdiag.account.saved_audit_detail.v1",
        project: firstProject,
        audit: { id: auditId, project_id: firstProject.id, status: "succeeded", score: 82, check_count: 0, issue_count: 1, completed_at: "2026-08-12T10:00:00Z", created_at: "2026-08-12T10:00:00Z" },
        payload: { contract_version: "webdiag.account.saved_audit_payload.v1", target_origin: firstProject.origin, status: "succeeded", score: 82, checks: [], issues: [{ issue_id: "security.headers.missing", check_id: "security.headers", category: "security", severity: "high", priority: "p0", title: "Заголовки безопасности", description: "Недостаёт заголовка.", affected_urls: [firstProject.origin], recommendation: { summary: "Добавьте заголовок.", steps: ["Добавьте nosniff."], expected_impact: "Снижает риск." } }], completed_at: "2026-08-12T10:00:00Z" },
      },
    }));

    await page.goto("/account/ai");
    await expect(page.getByRole("heading", { level: 1, name: "AI-инструменты WebDiag" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "AI-план исправлений" })).toBeVisible();
    await expect(page.getByText("Доступен", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("доступно для запуска", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Открыть форму" })).toHaveCount(5);
    await expect(page.getByRole("button", { name: "Запуск из сохранённого аудита" })).toBeDisabled();
    await page.getByRole("article").filter({ hasText: "AI-бриф контента" }).getByRole("button", { name: "Открыть форму" }).click();
    await expect(page.locator(".wd-ai-text-runner").getByRole("heading", { name: "AI-бриф контента" })).toBeVisible();
    await expect(page.getByLabel("Подтверждённые факты (по одному в строке)")).toBeVisible();
    await page.getByRole("button", { name: "Закрыть" }).click();

    await page.getByRole("article").filter({ hasText: "AI-оптимизатор контента" }).getByRole("button", { name: "Открыть форму" }).click();
    await expect(page.getByLabel("URL страницы")).toBeVisible();
    await expect(page.getByLabel("Текст страницы")).toHaveCount(0);
    await page.getByRole("button", { name: "Закрыть" }).click();

    await page.getByRole("article").filter({ hasText: "AI-соответствие интента странице" }).getByRole("button", { name: "Открыть форму" }).click();
    await expect(page.getByLabel("URL страницы")).toBeVisible();
    await expect(page.getByLabel("Основной запрос")).toBeVisible();
    await expect(page.getByLabel("Текст страницы")).toHaveCount(0);
    await page.getByRole("button", { name: "Закрыть" }).click();

    await page.getByRole("article").filter({ hasText: "AI-анализ конкурентных пробелов" }).getByRole("button", { name: "Открыть форму" }).click();
    await expect(page.locator(".wd-ai-text-runner").getByRole("heading", { name: "AI-анализ конкурентных пробелов" })).toBeVisible();
    await expect(page.getByLabel("URL своей страницы")).toBeVisible();
    await expect(page.getByLabel("URL страницы конкурента")).toBeVisible();
    await expect(page.getByLabel("Текст своей страницы")).toHaveCount(0);
    await expect(page.getByLabel("Текст страницы конкурента")).toHaveCount(0);
    await page.getByRole("button", { name: "Закрыть" }).click();

    await page.getByRole("article").filter({ hasText: "AI-план внутренних ссылок" }).getByRole("button", { name: "Открыть форму" }).click();
    await expect(page.locator(".wd-ai-text-runner").getByRole("heading", { name: "AI-план внутренних ссылок" })).toBeVisible();
    await expect(page.getByLabel("Страницы проекта: URL, по одному в строке")).toBeVisible();
    await expect(page.getByLabel("Текст страницы")).toHaveCount(0);
    await page.getByRole("button", { name: "Закрыть" }).click();
    await expect(page.getByText(/uptime|инцидент/i)).toHaveCount(0);

    await page.goto(`/account/projects/${firstProject.id}/audits/${auditId}`);
    await page.getByRole("button", { name: "Запустить AI-план" }).click();
    await expect(page.getByText("Заголовки безопасности", { exact: true }).last()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Порядок исправлений" })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect.poll(() => page.locator(".wd-ai-copilot-actions").getByRole("button", { name: "Запустить AI-план" }).evaluate((button) => button.getBoundingClientRect().height >= 44)).toBe(true);
  });

  test("English AI workspace keeps an empty catalog honest on mobile", async ({ page }) => {
    await page.route("**/api/account/me", (route) => route.fulfill({ json: session }));
    await page.route("**/api/account/projects", (route) => route.fulfill({
      json: { contract_version: "webdiag.account.project_list.v1", projects: [firstProject] },
    }));
    await page.route("**/api/account/ai/catalog", (route) => route.fulfill({
      json: { contract_version: "webdiag.ai.catalog.v1", tools: [] },
    }));
    await page.route("**/api/account/credits", (route) => route.fulfill({
      json: { contract_version: "webdiag.credits.balance.v1", account: { available: 0, reserved: 0 } },
    }));
    await page.route("**/api/account/ai/runs", (route) => route.fulfill({
      json: { contract_version: "webdiag.ai.run_list.v1", runs: [], next_cursor: null },
    }));

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/account/ai");
    await expect(page.getByRole("heading", { level: 1, name: "WebDiag AI tools" })).toBeVisible();
    await expect(page.getByText("0/6", { exact: true })).toBeVisible();
    await expect(page.locator(".wd-ai-tool-status").filter({ hasText: /^Not available$/u })).toHaveCount(6);
    await expect(page.getByRole("button", { name: "Not available" })).toHaveCount(6);
    await expect(page.getByText(/soon|coming soon|uptime|incident/i)).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("English AI form presents insufficient credits without attempting a provider call", async ({ page }) => {
    const toolIds = [
      "ai_audit_action_plan",
      "ai_competitor_gap_report",
      "ai_content_brief",
      "ai_content_optimizer",
      "ai_search_intent_page_fit",
      "ai_internal_linking_planner",
    ] as const;
    let providerSubmissionCount = 0;
    await page.route("**/api/account/me", (route) => route.fulfill({ json: session }));
    await page.route("**/api/account/projects", (route) => route.fulfill({
      json: { contract_version: "webdiag.account.project_list.v1", projects: [firstProject] },
    }));
    await page.route("**/api/account/ai/catalog", (route) => route.fulfill({
      json: {
        contract_version: "webdiag.ai.catalog.v1",
        tools: toolIds.map((id) => ({ id, contract_version: "v1", credit_price: 3 })),
      },
    }));
    await page.route("**/api/account/credits", (route) => route.fulfill({
      json: { contract_version: "webdiag.credits.balance.v1", account: { available: 0, reserved: 0 } },
    }));
    await page.route("**/api/account/ai/runs", async (route) => {
      if (route.request().method() === "POST") {
        providerSubmissionCount += 1;
        return route.fulfill({
          status: 402,
          json: { detail: { code: "ai_insufficient_credits", message: "Insufficient credits" } },
        });
      }
      return route.fulfill({
        json: { contract_version: "webdiag.ai.run_list.v1", runs: [], next_cursor: null },
      });
    });

    await page.goto("/en/account/ai");
    await expect(page.getByText("Available", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("available to run", { exact: true })).toBeVisible();
    await page.getByRole("article").filter({ hasText: "AI content brief" }).getByRole("button", { name: "Open form" }).click();
    await page.getByLabel("Audience").fill("Site owners and product teams");
    await page.getByLabel("Objective").fill("Explain the workflow and define a useful next step.");
    await page.getByLabel("Confirmed facts (one per line)").fill("WebDiag stores confirmed audit evidence.\nThe result remains reviewable.");
    await page.getByRole("button", { name: "Run tool" }).click();
    await expect(page.locator(".wd-ai-text-runner").getByRole("alert")).toContainText("There are not enough credits to run this AI tool.");
    expect(providerSubmissionCount).toBe(1);
    await expect(page.getByText(/uptime|incident/i)).toHaveCount(0);
  });
});
