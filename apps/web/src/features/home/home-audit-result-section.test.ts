import { describe, expect, it } from "vitest";
import { getAuditResultViewModel, type AuditResultPanelState } from "./home-audit-result-section";
import { FRONTEND_AUDIT_RESULT_CONTRACT_VERSION, type AuditFrontendResult } from "./audit-contract";

const snapshot: AuditFrontendResult = {
  contractVersion: FRONTEND_AUDIT_RESULT_CONTRACT_VERSION,
  sourceContractVersion: "webdiag.audit.snapshot.v1",
  generatedAt: "2026-07-21T00:00:00Z",
  summary: {
    status: "succeeded",
    score: 74,
    checkCount: 4,
    issueCount: 2,
    checksByStatus: { passed: 2, warning: 2 },
    issuesBySeverity: { medium: 1, low: 1 },
    issuesByPriority: { p1: 1, p3: 1 },
    highestSeverity: "medium",
    topPriority: "p1",
  },
  job: {
    id: "00000000-0000-0000-0000-000000000000",
    status: "succeeded",
    target: {
      originalUrl: "https://example.ru/page",
      normalizedUrl: "https://example.ru/page",
      hostname: "example.ru",
      scope: "single_url",
    },
  },
  run: {
    id: "11111111-1111-1111-1111-111111111111",
    status: "succeeded",
    score: 74,
    checks: [
      { id: "http.status", name: "HTTP status", category: "technical", status: "passed" },
      { id: "metadata.title", name: "Title", category: "metadata", status: "warning" },
    ],
    issues: [
      {
        id: "metadata.title.missing",
        checkId: "metadata.title",
        category: "metadata",
        severity: "medium",
        priority: "p1",
        title: "Title is missing",
        description: "The page has no title tag.",
      },
    ],
  },
};

describe("home audit result section view model", () => {
  it("builds success metrics from the frontend audit summary", () => {
    const state: AuditResultPanelState = { status: "success", snapshot, message: "", submittedUrl: "https://example.ru/page" };
    const view = getAuditResultViewModel("ru", state);

    expect(view.title).toBe("Результат проверки готов");
    expect(view.statusTone).toBe("success");
    expect(view.metrics).toEqual([
      { label: "URL", value: "example.ru", hint: "single_url" },
      { label: "Оценка", value: "74/100", hint: "health" },
      { label: "Проблемы", value: "2", hint: "Приоритеты" },
      { label: "Проверки", value: "4", hint: "средний" },
    ]);
    expect(view.issues).toEqual([
      {
        id: "metadata.title.missing",
        meta: "P1 · средний",
        title: "Title is missing",
        description: "The page has no title tag.",
      },
    ]);
    expect(view.checksBreakdown).toEqual([
      { label: "пройдено", value: 2 },
      { label: "предупр.", value: 2 },
    ]);
    expect(view.priorityBreakdown).toEqual([
      { label: "P1", value: 1 },
      { label: "P3", value: 1 },
    ]);
  });

  it("keeps loading and error states useful without a snapshot", () => {
    const loading = getAuditResultViewModel("en", { status: "loading", snapshot: null, message: "", submittedUrl: "https://example.com" });
    expect(loading.statusLabel).toBe("checking");
    expect(loading.metrics[0]).toEqual({ label: "URL", value: "https://example.com", hint: "single_url" });
    expect(loading.metrics[1]?.value).toBe("…");

    const error = getAuditResultViewModel("en", {
      status: "error",
      snapshot: null,
      message: "Check was not started: backend API is unavailable.",
      submittedUrl: "https://example.com",
    });
    expect(error.statusTone).toBe("error");
    expect(error.subtitle).toBe("Check was not started: backend API is unavailable.");
    expect(error.demoReportLink).toBe("Open full report demo");
  });
});
