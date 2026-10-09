import { expect, test } from "@playwright/test";
import { AI_TOOL_IDS } from "../src/features/account/account-ai-contract";
import { session, emptyOverview } from "./account-fixtures";

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

test("all fifteen tools open from their RU and EN deep links", async ({
  page,
}) => {
  test.setTimeout(90000);
  for (const path of ["/account/ai", "/en/account/ai"]) {
    for (const id of AI_TOOL_IDS) {
      await page.goto(`${path}?tool=${id}`);
      await expect(page.locator(".wd-ai-tool-card")).toHaveCount(15);
      await expect(
        page.locator('.wd-ai-tool-card[data-enabled="true"]'),
      ).toHaveCount(15);
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole("heading", { level: 2 })).toHaveCount(1);
      await dialog.getByRole("button", { name: /^(Закрыть|Close)$/ }).click();
      await expect(dialog).toHaveCount(0);
    }
  }
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
