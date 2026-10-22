import { expect, it } from "vitest";
import { shouldPollAIRun } from "./account-ai-query";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AccountAIToolList } from "./account-ai-tool-list";

it("continues checking a queued run while the worker and provider are still within their deadline", () => {
  expect(shouldPollAIRun("pending", 45)).toBe(true);
  expect(shouldPollAIRun("running", 45)).toBe(true);
  expect(shouldPollAIRun("running", 60)).toBe(false);
  expect(shouldPollAIRun("provider_unknown", 0)).toBe(false);
});

it("does not enable any paid AI tool when the server catalog is empty", () => {
  const html = renderToStaticMarkup(createElement(AccountAIToolList, {
    locale: "en", loading: false,
    catalog: { contract_version: "webdiag.ai.catalog.v1", tools: [] }, onSelect: () => {},
  }));
  expect(html.match(/ disabled=""/gu)).toHaveLength(14);
  expect(html).not.toContain('is-ready');
});
