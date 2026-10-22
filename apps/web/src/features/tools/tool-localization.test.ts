import { describe, expect, it } from "vitest";
import { localizeRecommendation, localizeSingleAuditIssue } from "./tool-localization";
import type { AuditFrontendIssue } from "../home/audit-contract";

describe("tool-localization", () => {
  it("translates known English recommendations to Russian", () => {
    const raw = "URL opens directly with a successful HTTP response. Keep it stable for users and search crawlers.";
    expect(localizeRecommendation(raw, "ru")).toContain("URL открывается напрямую с успешным HTTP-ответом");
    expect(localizeRecommendation(raw, "en")).toBe(raw);
  });

  it("translates pattern-matched recommendations to Russian", () => {
    const raw = "The URL returns 404. Restore the page, redirect it to a relevant replacement, or remove internal links to it.";
    expect(localizeRecommendation(raw, "ru")).toContain("URL возвращает");
  });

  it("explains malformed canonical evidence in the selected language", () => {
    const raw = "Canonical URL is invalid or exceeds the supported length. Use a valid HTTP or HTTPS URL for the preferred page.";
    expect(localizeRecommendation(raw, "ru")).toContain("некорректен");
    expect(localizeRecommendation(raw, "en")).toBe(raw);
  });

  it("localizes audit issues to Russian", () => {
    const issue: AuditFrontendIssue = {
      id: "metadata.title.missing",
      checkId: "metadata.title",
      category: "metadata",
      severity: "high",
      priority: "p1",
      title: "Title tag is missing",
      description: "The deterministic scanner found no title tag.",
      affectedUrls: ["https://example.com/"],
      recommendation: {
        summary: "Add a title",
        steps: ["Add title element"],
        expectedImpact: "Title passes",
      },
    };

    const localized = localizeSingleAuditIssue(issue, "ru");
    expect(localized.title).toBe("Отсутствует title");
    expect(localized.recommendation.summary).toBe("Добавьте уникальный title, который описывает тему страницы.");
  });
});
