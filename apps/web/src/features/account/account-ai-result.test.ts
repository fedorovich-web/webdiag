import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { AccountAIResult } from "./account-ai-result";

it("shows the brief title, every section and its evidence", () => {
  const html = renderToStaticMarkup(createElement(AccountAIResult, { locale: "ru", output: {
    suggested_title: "Заголовок для редактора", sections: [{ heading: "Первая секция", purpose: "Ответить на вопрос",
      coverage: [{ source_fact_index: 0, excerpt: "Подтверждённый факт" }] }], warnings: ["Проверить дату"],
  } }));
  for (const text of ["Заголовок для редактора", "Первая секция", "Ответить на вопрос", "Подтверждённый факт", "Проверить дату"]) expect(html).toContain(text);
});

it("escapes model output instead of rendering HTML", () => {
  const html = renderToStaticMarkup(createElement(AccountAIResult, { locale: "en", output: {
    summary: "<script>alert(1)</script>", actions: [],
  } }));
  expect(html).not.toContain("<script>");
  expect(html).toContain("&lt;script&gt;");
});
it("uses a private owner route for image previews and downloads", () => {
  const html = renderToStaticMarkup(createElement(AccountAIResult, { locale: "ru", runId: "11111111-1111-4111-8111-111111111111", output: { artifact_id: "22222222-2222-4222-8222-222222222222", media_type: "image/png", byte_size: 100, sha256: "a".repeat(64) } }));
  expect(html).toContain("/api/account/ai/runs/11111111-1111-4111-8111-111111111111/artifacts/22222222-2222-4222-8222-222222222222");
  expect(html).toContain("Скачать изображение"); expect(html).not.toContain("https://");
});
it("displays regex verification status without claiming execution", () => {
  const html = renderToStaticMarkup(createElement(AccountAIResult, { locale: "ru", output: { dialect: "python", pattern: "^a$", validation_status: "unverified", case_plan: [{ case_index: 0, expected_match: true }], explanation: "Проверьте выражение", warnings: [] } }));
  expect(html).toContain("Не проверено исполнением"); expect(html).toContain("Ожидается совпадение"); expect(html).toContain("Да");
});
it("preserves freeform text that happens to match enum labels", () => {
  const html = renderToStaticMarkup(createElement(AccountAIResult, {
    locale: "ru", output: { alt_text: "high", decorative: false, rationale: "unknown" },
  }));
  expect(html).toContain(">high<"); expect(html).toContain(">unknown<");
});
it.each(["unknown", "__proto__", "constructor"])("preserves the literal regex pattern %s", (pattern) => {
  const html = renderToStaticMarkup(createElement(AccountAIResult, {
    locale: "ru", output: { dialect: "python", pattern, validation_status: "unverified", case_plan: [{ case_index: 0, expected_match: true }], explanation: "Explanation", warnings: [] },
  }));
  expect(html).toContain(`>${pattern}<`);
  expect(html).toContain("Не проверено исполнением");
});
