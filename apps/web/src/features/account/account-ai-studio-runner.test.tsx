import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { AccountAIStudioRunner } from "./account-ai-studio-runner";
import { STUDIO_TOOL_IDS } from "./account-ai-studio-input";

it.each(STUDIO_TOOL_IDS)("renders labeled %s fields and the server price", (toolId) => {
  const html = renderToStaticMarkup(createElement(AccountAIStudioRunner, { locale: "ru", toolId, creditPrice: 7, onClose: () => {} }));
  expect(html).toContain("<label>"); expect(html).toContain("(7 AI-кредитов)"); expect(html).not.toContain("(1 AI-кредит)");
  expect(html).not.toContain("JSON input"); expect(html).toContain("type=\"submit\"");
  if (toolId === "ai_alt_text_studio" || toolId === "ai_image_edit_studio") { expect(html).toContain("type=\"file\""); expect(html).toContain("image/png,image/jpeg,image/webp"); }
  if (toolId === "ai_redirect_migration_mapper") { expect(html).toContain("Старые страницы"); expect(html).toContain("Новые страницы"); expect(html).toContain("minLength=\"20\""); }
  if (toolId === "ai_regex_workbench") { expect(html).toContain("Должны совпасть"); expect(html).toContain("Не должны совпасть"); }
});
it("disables launch when a backend price is unavailable", () => {
  const html = renderToStaticMarkup(createElement(AccountAIStudioRunner, { locale: "en", toolId: "ai_faq_studio", creditPrice: 0, onClose: () => {} }));
  expect(html).toMatch(/type="submit"[^>]*disabled=""/u);
});
