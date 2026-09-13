import { describe, expect, it } from "vitest";
import { getToolPageChromeCopy } from "./tool-page-copy";

describe("tool page chrome copy", () => {
  it("uses project-aware authenticated wording for crawler tools", () => {
    const copy = getToolPageChromeCopy("ru", "crawler");
    expect(copy.local).toBe("Доступно в проекте WebDiag");
    expect(copy.workspace).toBe("Открыть проект");
    expect(copy.note).toContain("авторизации");
    expect(copy.processingText).toContain("одного origin");
    expect(copy.processingText).toContain("25 HTML-страниц");
    expect(copy.note).not.toContain("Введите URL");
  });

  it("keeps the existing backend wording for non-crawler network tools", () => {
    const copy = getToolPageChromeCopy("en", "safe_fetch");
    expect(copy.local).toBe("Checked through WebDiag API");
    expect(copy.note).toContain("Enter a URL");
  });

  it("describes chromium-class tools as bounded PageSpeed provider checks", () => {
    const copy = getToolPageChromeCopy("en", "chromium");
    expect(copy.local).toContain("Google PageSpeed");
    expect(copy.processingText).toContain("API key stays on the server");
    expect(copy.processingText).toContain("without raw bodies");
  });
});
