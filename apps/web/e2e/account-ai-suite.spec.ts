import { expect, test } from "@playwright/test";
import { AI_TOOL_IDS } from "../src/features/account/account-ai-contract";
import { ACTIVE_AI_CATALOG_TOOLS, isActiveAIToolId } from "../src/features/tools/ai-tools-data";
import { session, emptyOverview, firstProject } from "./account-fixtures";

const runId = "11111111-1111-4111-8111-111111111111";
const artifactId = "22222222-2222-4222-8222-222222222222";
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6u3cAAAAASUVORK5CYII=",
  "base64",
);

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
  await page.route("**/api/account/ai/catalog", (route) =>
    route.fulfill({
      json: {
        contract_version: "webdiag.ai.catalog.v1",
        tools: AI_TOOL_IDS.map((id) => ({
          id,
          contract_version: "v1",
          credit_price: id.includes("image_") ? 2 : 1,
        })),
      },
    }),
  );
  await page.route("**/api/account/credits", (route) =>
    route.fulfill({
      json: {
        contract_version: "webdiag.credits.balance.v1",
        account: { available: 20, reserved: 0 },
      },
    }),
  );
  await page.route("**/api/account/ai/runs", (route) =>
    route.fulfill({
      json: { contract_version: "webdiag.ai.run_list.v1", next_cursor: null, runs: [] },
    }),
  );
});

for (const runner of ["text", "audit", "copilot"] as const) {
  test(`${runner} manual retry after response loss reuses the reservation key`, async ({ page }) => {
    const requests: { key: string; input: unknown }[] = [];
    const reservations = new Set<string>();
    await page.route("**/api/account/ai/runs", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      const key = route.request().headers()["idempotency-key"]!;
      expect(key).toMatch(/^[0-9a-f-]{36}$/);
      requests.push({ key, input: route.request().postDataJSON() });
      reservations.add(key);
      // Model an accepted run whose response was lost before reaching the browser.
      await route.abort("failed");
    });

    const firstAuditId = "33333333-3333-4333-8333-333333333333";
    const nextAuditId = "44444444-4444-4444-8444-444444444444";
    if (runner === "copilot") {
      await page.route("**/api/account/projects", (route) => route.fulfill({ json: {
        contract_version: "webdiag.account.project_list.v1", projects: [firstProject],
      } }));
      await page.route(`**/api/account/projects/${firstProject.id}/audits/*?locale=en`, (route) => {
        const auditId = new URL(route.request().url()).pathname.split("/").at(-1)!;
        return route.fulfill({ json: {
          contract_version: "webdiag.account.saved_audit_detail.v1",
          project: firstProject,
          audit: { id: auditId, project_id: firstProject.id, status: "succeeded", score: 88,
            check_count: 0, issue_count: 0, completed_at: "2026-07-31T12:00:00Z", created_at: "2026-07-31T12:00:00Z" },
          payload: { contract_version: "webdiag.account.saved_audit_payload.v1", target_origin: firstProject.origin,
            status: "succeeded", score: 88, checks: [], issues: [], completed_at: "2026-07-31T12:00:00Z" },
        } });
      });
      await page.goto(`/en/account/projects/${firstProject.id}/audits/${firstAuditId}`);
    } else {
      await page.goto(`/en/account/ai?tool=${runner === "text" ? "ai_content_brief" : "ai_audit_action_plan"}`);
      const dialog = page.getByRole("dialog");
      if (runner === "text") {
        await dialog.getByLabel("Audience", { exact: true }).fill("Editors");
        await dialog.getByLabel("Objective", { exact: true }).fill("Clarify the page");
        await dialog.getByLabel("Confirmed facts (one per line)", { exact: true }).fill("A confirmed fact with enough content.");
      } else {
        await dialog.getByLabel("Project ID (UUID):", { exact: true }).fill(firstProject.id);
        await dialog.getByLabel("Audit ID (UUID):", { exact: true }).fill(firstAuditId);
      }
    }
    const container = runner === "copilot" ? page.locator(".wd-ai-copilot-card") : page.getByRole("dialog");
    const submit = container.getByRole("button", { name: runner === "copilot" ? /Run AI plan/ : runner === "text" ? /Run tool/ : /Generate action plan/ });
    await submit.click();
    await expect(container.getByRole("alert")).toBeVisible();
    await expect(submit).toBeEnabled();
    expect(requests).toHaveLength(1);
    await submit.click();
    await expect.poll(() => requests.length).toBe(2);
    await expect(submit).toBeEnabled();
    expect(requests[1]!.key).toBe(requests[0]!.key);
    expect(requests[1]!.input).toEqual(requests[0]!.input);
    expect(reservations.size).toBe(1);

    if (runner === "text") await container.getByLabel("Audience", { exact: true }).fill("Different audience");
    else if (runner === "audit") await container.getByLabel("Audit ID (UUID):", { exact: true }).fill(nextAuditId);
    else await page.goto(`/en/account/projects/${firstProject.id}/audits/${nextAuditId}`);
    await submit.click();
    await expect.poll(() => requests.length).toBe(3);
    await expect(submit).toBeEnabled();
    expect(requests[2]!.key).not.toBe(requests[0]!.key);
    expect(requests[2]!.input).not.toEqual(requests[0]!.input);
    expect(reservations.size).toBe(2);
  });
}

for (const locale of ["ru", "en"] as const) {
  test(`${locale} empty audit explains that no paid AI action plan is needed`, async ({ page }) => {
    await page.route("**/api/account/ai/runs", (route) => route.request().method() === "POST"
      ? route.fulfill({ status: 422, json: { detail: { code: "ai_source_no_issues", message: "Private backend detail" } } })
      : route.fulfill({ json: { contract_version: "webdiag.ai.run_list.v1", next_cursor: null, runs: [] } }));
    await page.goto(`${locale === "en" ? "/en" : ""}/account/ai?tool=ai_audit_action_plan`);
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(locale === "ru" ? "ID проекта (UUID):" : "Project ID (UUID):", { exact: true }).fill("11111111-1111-4111-8111-111111111111");
    await dialog.getByLabel(locale === "ru" ? "ID аудита (UUID):" : "Audit ID (UUID):", { exact: true }).fill("22222222-2222-4222-8222-222222222222");
    await dialog.getByRole("button", { name: locale === "ru" ? /Сгенерировать план исправлений/ : /Generate action plan/ }).click();
    await expect(dialog.getByRole("alert")).toContainText(locale === "ru" ? "нет замечаний" : "no issues");
    await expect(dialog.getByRole("alert")).toContainText(locale === "ru" ? "не списаны" : "not charged");
    await expect(dialog).not.toContainText("Private backend detail");
  });
}

test("all active AI tools open from their RU and EN deep links", async ({
  page,
}) => {
  test.setTimeout(90000);
  for (const path of ["/account/ai", "/en/account/ai"]) {
    for (const id of AI_TOOL_IDS.filter(isActiveAIToolId)) {
      await page.goto(`${path}?tool=${id}`);
      await expect(page.locator(".wd-ai-tool-card")).toHaveCount(ACTIVE_AI_CATALOG_TOOLS.length);
      await expect(
        page.locator('.wd-ai-tool-card[data-enabled="true"]'),
      ).toHaveCount(ACTIVE_AI_CATALOG_TOOLS.length);
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole("heading", { level: 2 })).toHaveCount(1);
      await dialog.getByRole("button", { name: /^(Закрыть|Close)$/ }).click();
      await expect(dialog).toHaveCount(0);
    }
  }
});

test("retired AI FAQ cannot be launched but its saved result remains readable", async ({ page }) => {
  await page.route("**/api/account/ai/runs", (route) => route.fulfill({ json: {
    contract_version: "webdiag.ai.run_list.v1", next_cursor: null,
    runs: [{
      id: runId, tool_id: "ai_faq_studio", contract_version: "v1", credit_price: 1,
      state: "succeeded", error_code: null,
      created_at: "2026-10-09T12:00:00Z", updated_at: "2026-10-09T12:01:00Z",
      output: { items: Array.from({ length: 3 }, (_, index) => ({
        question: `Saved question ${index + 1}?`, answer: "Saved factual answer.", evidence: "Saved source evidence.",
      })) },
    }],
  } }));
  await page.goto("/en/account/ai?tool=ai-faq-studio");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".wd-ai-tool-card")).toHaveCount(14);
  await expect(page.locator(".wd-ai-tool-card").filter({ hasText: /FAQ/ })).toHaveCount(0);
  await expect(page.getByText("14/14", { exact: true })).toBeVisible();
  const saved = page.locator(".wd-ai-run-row");
  await expect(saved).toContainText("FAQ");
  await saved.getByText("Result", { exact: true }).click();
  await expect(saved).toContainText("Saved factual answer.");
});

test("Schema runner submits evidence and keeps its result after balance refresh", async ({
  page,
}) => {
  let submitted = false;
  await page.route("**/api/account/ai/runs", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        json: { contract_version: "webdiag.ai.run_list.v1", next_cursor: null, runs: [] },
      });
      return;
    }
    expect(route.request().postDataJSON()).toEqual({
      tool_id: "ai_schema_studio",
      input: {
        locale: "ru",
        page_url: "https://example.com/",
        schema_type: "WebPage",
        facts: ["The page describes a tree."],
      },
    });
    expect(route.request().headers()["idempotency-key"]).toBeTruthy();
    submitted = true;
    await route.fulfill({
      json: {
        contract_version: "webdiag.ai.run.v1",
        run: {
          id: runId,
          tool_id: "ai_schema_studio",
          contract_version: "v1",
          credit_price: 1,
          state: "succeeded",
          output: {
            json_ld: {
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: "Tree page",
            },
            property_sources: { "/name": [0] },
            warnings: [],
          },
          error_code: null,
          created_at: "2026-10-09T12:00:00Z",
          updated_at: "2026-10-09T12:01:00Z",
        },
      },
    });
  });
  await page.goto("/account/ai?tool=ai_schema_studio");
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("URL страницы", { exact: true })
    .fill("https://example.com/");
  await dialog
    .getByLabel(/Подтверждённые факты/)
    .fill("The page describes a tree.");
  await dialog
    .getByRole("button", { name: /Запустить инструмент \(1/ })
    .click();
  await expect(
    dialog.getByRole("heading", { name: "Разметка JSON-LD" }),
  ).toBeVisible();
  await expect(dialog.locator("pre")).toContainText('"name": "Tree page"');
  expect(submitted).toBe(true);
  await expect(dialog).toBeVisible();
});

test("image editing uploads first and displays only the private artifact route", async ({
  page,
}) => {
  await page.route("**/api/account/ai/uploads/image", async (route) => {
    expect(route.request().headers()["content-type"]).toBe("image/png");
    await route.fulfill({
      status: 201,
      json: {
        contract_version: "webdiag.ai.upload.v1",
        upload: {
          id: artifactId,
          media_type: "image/png",
          byte_size: png.length,
          width: 1,
          height: 1,
          sha256: "a".repeat(64),
          created_at: "2026-10-09T12:00:00Z",
          expires_at: "2026-10-10T12:00:00Z",
        },
      },
    });
  });
  await page.route("**/api/account/ai/runs", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        json: { contract_version: "webdiag.ai.run_list.v1", next_cursor: null, runs: [] },
      });
      return;
    }
    expect(route.request().postDataJSON()).toMatchObject({
      tool_id: "ai_image_edit_studio",
      input: {
        upload_id: artifactId,
        prompt: "Make the background pale green",
      },
    });
    await route.fulfill({
      json: {
        contract_version: "webdiag.ai.run.v1",
        run: {
          id: runId,
          tool_id: "ai_image_edit_studio",
          contract_version: "v1",
          credit_price: 2,
          state: "succeeded",
          output: {
            artifact_id: artifactId,
            media_type: "image/png",
            byte_size: png.length,
            sha256: "a".repeat(64),
          },
          error_code: null,
          created_at: "2026-10-09T12:00:00Z",
          updated_at: "2026-10-09T12:01:00Z",
        },
      },
    });
  });
  const artifactPath = `/api/account/ai/runs/${runId}/artifacts/${artifactId}`;
  await page.route(`**${artifactPath}`, (route) =>
    route.fulfill({ contentType: "image/png", body: png }),
  );
  await page.goto("/account/ai?tool=ai_image_edit_studio");
  const dialog = page.getByRole("dialog");
  await dialog
    .locator('input[type="file"]')
    .setInputFiles({ name: "source.png", mimeType: "image/png", buffer: png });
  await dialog
    .getByLabel("Опишите изображение или изменения", { exact: true })
    .fill("Make the background pale green");
  await dialog
    .getByRole("button", { name: /Запустить инструмент \(2/ })
    .click();
  await expect(dialog.getByRole("img")).toHaveAttribute("src", artifactPath);
  await expect(
    dialog.getByRole("link", { name: "Скачать изображение" }),
  ).toHaveAttribute("href", artifactPath);
  await expect(dialog.getByRole("img")).toBeVisible();
});
