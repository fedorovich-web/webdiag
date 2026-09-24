import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { firstProject, operationsOverview, session } from "./account-fixtures";
import { installBrowserGuard } from "./browser-guard";

const auditId = "33333333-3333-4333-8333-333333333333";

const audit = {
  id: auditId,
  project_id: firstProject.id,
  status: "succeeded",
  score: 78,
  check_count: 8,
  issue_count: 4,
  completed_at: "2026-09-12T10:24:00Z",
  created_at: "2026-09-12T10:00:00Z",
} as const;

const issues = [
  {
    issue_id: "seo.meta-description.missing",
    check_id: "seo.meta-description",
    category: "seo",
    source_category: "seo",
    severity: "critical",
    priority: "p0",
    fix_order: 1,
    title: "Отсутствует meta description",
    description: "На части страниц отсутствует meta description.",
    affected_urls: ["https://example.com/catalog", "https://example.com/about"],
    recommendation: {
      summary: "Добавьте уникальные meta description.",
      steps: ["Подготовьте описания для затронутых страниц."],
      expected_impact: "Более полные сниппеты в поиске.",
    },
  },
  {
    issue_id: "links.broken",
    check_id: "links.broken",
    category: "links",
    source_category: "links",
    severity: "high",
    priority: "p1",
    fix_order: 2,
    title: "Найдены битые ссылки",
    description: "Некоторые внутренние ссылки возвращают ошибку.",
    affected_urls: ["https://example.com/old-page"],
    recommendation: {
      summary: "Исправьте или удалите битые ссылки.",
      steps: ["Обновите href на актуальные URL."],
      expected_impact: "Лучше обход сайта и пользовательский путь.",
    },
  },
] as const;

function localizedIssues(locale: "ru" | "en") {
  if (locale === "ru") return issues;
  return [
    {
      ...issues[0],
      title: "Meta description is missing",
      description: "Some pages do not have a meta description.",
      recommendation: {
        summary: "Add unique meta descriptions.",
        steps: ["Prepare descriptions for the affected pages."],
        expected_impact: "More complete search snippets.",
      },
    },
    {
      ...issues[1],
      title: "Broken links found",
      description: "Some internal links return an error.",
      recommendation: {
        summary: "Fix or remove broken links.",
        steps: ["Update href values to current URLs."],
        expected_impact: "Better crawling and user navigation.",
      },
    },
  ] as const;
}

function savedAuditIssues(locale: "ru" | "en") {
  return localizedIssues(locale).map((issue) => ({
    issue_id: issue.issue_id,
    check_id: issue.check_id,
    category: issue.category,
    severity: issue.severity,
    priority: issue.priority,
    title: issue.title,
    description: issue.description,
    affected_urls: issue.affected_urls,
    recommendation: issue.recommendation,
  }));
}

async function setupAccount(page: import("@playwright/test").Page) {
  await page.route("**/api/account/me", (route) => route.fulfill({ json: session }));
  await page.route("**/api/account/projects", (route) => route.fulfill({
    json: {
      contract_version: "webdiag.account.project_list.v1",
      projects: [firstProject],
    },
  }));
  await page.route("**/api/account/overview", (route) => route.fulfill({ json: operationsOverview }));
}

async function capture(
  page: import("@playwright/test").Page,
  name: string,
  route: string,
  width: number,
  height: number,
) {
  await page.setViewportSize({ width, height });
  await page.goto(route);
  await page.locator("body").waitFor({ state: "visible" });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.screenshot({
    path: `test-results/final-visual-qa/${name}-${width}.png`,
    fullPage: true,
    animations: "disabled",
  });
}

test.describe("final account visual QA captures", () => {
  let assertBrowserClean: ReturnType<typeof installBrowserGuard>;

  test.beforeAll(async () => {
    await mkdir("test-results/final-visual-qa", { recursive: true });
  });

  test.beforeEach(async ({ page }) => {
    assertBrowserClean = installBrowserGuard(page);
    await setupAccount(page);
  });

  test.afterEach(async ({}, testInfo) => {
    await assertBrowserClean(testInfo);
  });

  for (const [name, route] of [["dashboard-ru", "/account"], ["dashboard-en", "/en/account"]] as const) {
    test(`${name} desktop and mobile browser renders`, async ({ page }) => {
      await capture(page, name, route, 1440, 1000);
      await capture(page, name, route, 390, 844);
    });
  }

  for (const locale of ["ru", "en"] as const) {
    const prefix = locale === "ru" ? "" : "/en";
    const name = `issues-${locale}`;
    test(`${name} desktop and mobile browser renders`, async ({ page }) => {
      await page.route(`**/api/account/projects/${firstProject.id}/audits/${auditId}/issues*`, (route) => route.fulfill({
        json: {
          contract_version: "webdiag.account.issue_list.v1",
          project: firstProject,
          audit,
          total: issues.length,
          items: localizedIssues(locale),
        },
      }));
      await capture(page, name, `${prefix}/account/projects/${firstProject.id}/audits/${auditId}/issues`, 1440, 1000);
      await capture(page, name, `${prefix}/account/projects/${firstProject.id}/audits/${auditId}/issues`, 390, 844);
    });
  }

  for (const locale of ["ru", "en"] as const) {
    const prefix = locale === "ru" ? "" : "/en";
    const name = `audit-report-${locale}`;
    test(`${name} desktop and mobile browser renders`, async ({ page }) => {
      await page.route(`**/api/account/projects/${firstProject.id}/audits/${auditId}*`, (route) => route.fulfill({
        json: {
          contract_version: "webdiag.account.saved_audit_detail.v1",
          project: firstProject,
          audit,
          payload: {
            contract_version: "webdiag.account.saved_audit_payload.v1",
            target_origin: firstProject.origin,
            status: "succeeded",
            score: 78,
            checks: [
              { check_id: "seo.meta-description", name: "Meta description", category: "seo", status: "failed" },
              { check_id: "links.broken", name: "Broken links", category: "links", status: "failed" },
              { check_id: "security.headers", name: "Security headers", category: "security", status: "passed" },
            ],
            issues: savedAuditIssues(locale),
            completed_at: audit.completed_at,
          },
        },
      }));
      await capture(page, name, `${prefix}/account/projects/${firstProject.id}/audits/${auditId}`, 1440, 1000);
      await capture(page, name, `${prefix}/account/projects/${firstProject.id}/audits/${auditId}`, 390, 844);
    });
  }
});
