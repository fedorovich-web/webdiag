import { expect, it } from "vitest";
import { buildStudioInput } from "./account-ai-studio-input";

it("builds a FAQ request from labeled values", () => {
  expect(buildStudioInput("ru", "ai_faq_studio", { source_content: "This is confirmed page content.", question_count: "3", audience: "" })).toEqual({ locale: "ru", source_content: "This is confirmed page content.", question_count: 3, audience: null });
});
it("rejects mismatched or absent glossary evidence before spending credits", () => {
  expect(() => buildStudioInput("ru", "ai_localization_workbench", { source_content: "Confirmed tree and forest text", source_locale: "ru", target_locale: "en", glossary: "absent => missing", verbatim_constraints: "" })).toThrow();
});
it("builds owned image input with no public URL", () => {
  const input = buildStudioInput("en", "ai_alt_text_studio", { purpose: "decorative", page_context: "", surrounding_text: "" }, "11111111-1111-4111-8111-111111111111");
  expect(input).toEqual({ locale: "en", upload_id: "11111111-1111-4111-8111-111111111111", purpose: "decorative", page_context: null, surrounding_text: null });
  expect(() => buildStudioInput("en", "ai_alt_text_studio", { purpose: "informative" }, "https://example.com/image.png")).toThrow();
});
it("rejects duplicate regex cases and excessive FAQ counts", () => {
  expect(() => buildStudioInput("en", "ai_regex_workbench", { dialect: "python", task: "Match letters", matches: "a", non_matches: "a" })).toThrow();
  expect(() => buildStudioInput("en", "ai_faq_studio", { source_content: "Confirmed content has enough length", question_count: "20" })).toThrow();
});
