import { expect, test } from "@playwright/test";
import { firstProject, session } from "./account-fixtures";

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
        { check_id: "security.headers", name: "Заголовки безопасности", category: "security", status: "failed" },
        { check_id: "http.status", name: "HTTP-статус", category: "http", status: "passed" },
      ],
      issues: [{
        issue_id: "security.headers.missing",
        check_id: "security.headers",
        category: "security",
        severity: "high",
        priority: "p0",
        title: "Заголовки безопасности требуют внимания",
        description: "В ответе отсутствует или ослаблен один или несколько базовых заголовков безопасности.",
        affected_urls: [firstProject.origin],
        recommendation: {
          summary: "Добавьте совместимые с сайтом базовые заголовки безопасности ответа.",
          steps: ["Добавьте X-Content-Type-Options: nosniff."],
          expected_impact: "Снижает устранимые риски безопасности в браузере.",
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
    await page.route(`**/api/account/projects/${firstProject.id}/audits/${auditId}?locale=ru`, (route) => route.fulfill({ json: auditDetail }));
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
    await expect(page.locator(".wd-workspace-navigation a[aria-current=\"page\"]")).toHaveText("Отчёты");
    await expect(page.getByText("31 июл. 2026 г.", { exact: false })).toBeVisible();

    await page.goto(`/account/projects/${firstProject.id}/audits/${auditId}`);
    await page.getByLabel("Название отчёта").fill(snapshot.title);
    await page.getByRole("button", { name: "Создать отчёт" }).click();
    await page.getByRole("link", { name: "Открыть сохранённый отчёт" }).click();

    await expect(page.getByRole("heading", { level: 1, name: snapshot.title })).toBeVisible();
    await expect(page.locator(".wd-workspace-navigation a[aria-current=\"page\"]")).toHaveText("Отчёты");
    await expect(page.getByRole("heading", { name: "Результаты проверок" })).toBeVisible();
    await expect(page.getByText("Заголовки безопасности", { exact: true })).toBeVisible();
    await expect(page.getByText("Заголовки безопасности требуют внимания", { exact: true })).toBeVisible();
    await expect(page.locator(".wd-report-render-kpis .is-danger")).toContainText("1");
    await expect(page.getByText("Безопасность", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("P0 — исправить первым", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Что содержит этот отчёт" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Скачать HTML" })).toHaveAttribute(
      "href",
      `/api/account/reports/${reportId}/export.html`,
    );
    await page.getByRole("button", { name: "Включить общий доступ" }).click();
    await expect(page.getByLabel(/показывается один раз/i)).toHaveValue(
      new RegExp(`/reports/share/${"A".repeat(43)}\\?locale=ru$`),
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
      new RegExp(`/reports/share/${"B".repeat(43)}\\?locale=ru$`),
    );

    const publicResponse = await page.goto(`/reports/share/${activeShareToken}`);
    expect(publicResponse?.headers()["cache-control"]).toContain("no-store");
    expect(publicResponse?.headers()["x-robots-tag"]).toBe("noindex, nofollow, noarchive");
    expect(publicResponse?.headers()["referrer-policy"]).toBe("no-referrer");
    await expect(page.getByRole("heading", { level: 1, name: snapshot.title })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Результаты проверок" })).toBeVisible();
    await expect(page.getByText(firstProject.id)).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Скачать HTML" })).toHaveAttribute(
      "href",
      `/api/reports/share/${activeShareToken}/export.html`,
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await page.goto(`/account/reports/${reportId}`);
    await expect(page.getByRole("heading", { level: 1, name: snapshot.title })).toBeVisible();
    const mobileReportLastKpi = await page.locator(".wd-report-render-kpis article").last().boundingBox();
    expect(mobileReportLastKpi?.width).toBeGreaterThan(300);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Отозвать ссылку" }).click();
    await expect(page.getByRole("button", { name: "Включить общий доступ" })).toBeVisible();
    await expect(page.getByText("Отчёт не является измерением uptime и не подтверждает непрерывную доступность сайта.", { exact: true })).toBeVisible();
    await expect(page.getByText(/\d+(?:[.,]\d+)?\s*%/)).toHaveCount(0);
  });
});
