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
