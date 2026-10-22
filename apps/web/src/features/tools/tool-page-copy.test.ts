import { describe, expect, it } from "vitest";
import { getToolPageChromeCopy } from "./tool-page-copy";

describe("tool page chrome copy", () => {
  it("does not promise browser-only processing for DNS and TLS requests", () => {
    for (const locale of ["ru", "en"] as const) {
      const copy = getToolPageChromeCopy(locale, "dns_tls");
      expect(copy.local).toBe(getToolPageChromeCopy(locale, "safe_fetch").local);
      expect(copy.processingText).not.toBe(getToolPageChromeCopy(locale, "browser").processingText);
    }
  });

  it("discloses server-side AVIF conversion for both image conversion tools", () => {
    for (const locale of ["ru", "en"] as const) {
      for (const slug of ["image-optimizer", "image-format-converter"]) {
        const copy = getToolPageChromeCopy(locale, "browser", slug);
        expect(copy.processingText).toContain("AVIF");
        expect(copy.processingText).toMatch(/сервер|server/);
        expect(copy.local).not.toBe(getToolPageChromeCopy(locale, "browser", "image-resizer").local);
      }
    }
  });
  it("uses project-aware authenticated wording for crawler tools", () => {
    const copy = getToolPageChromeCopy("ru", "crawler");
    expect(copy.local).toBe("Доступно в проекте WebDiag");
    expect(copy.workspace).toBe("Открыть проект");
    expect(copy.note).toContain("авторизации");
    expect(copy.processingText).toContain("одном сайте");
    expect(copy.processingText).toContain("100 страниц");
    expect(copy.note).not.toContain("Введите URL");
  });

  it("keeps the existing backend wording for non-crawler network tools", () => {
    const copy = getToolPageChromeCopy("en", "safe_fetch");
    expect(copy.local).toBe("Checked on the WebDiag server");
    expect(copy.note).toContain("Enter a URL");
  });

  it("describes chromium-class tools as bounded PageSpeed provider checks", () => {
    const copy = getToolPageChromeCopy("en", "chromium");
    expect(copy.local).toContain("Google PageSpeed");
    expect(copy.processingText).toContain("Google PageSpeed Insights");
    expect(copy.processingText).toContain("unavailable");
  });
});
