import { describe, expect, it } from "vitest";
import type { ReportSnapshot } from "./account-report-contract";
import {
  formatReportDate,
  groupReportChecks,
  groupReportIssues,
  orderedReportIssues,
  reportPriorityLabel,
  reportPriorityDistribution,
  reportSeverityLabel,
  reportShareState,
  reportSummary,
} from "./account-report-presentation";

const snapshot: ReportSnapshot = {
  contract_version: "webdiag.account.report_snapshot.v1",
  title: "Client report",
  locale: "en",
  project_name: "Main",
  target_origin: "https://example.com",
  audit_completed_at: "2026-08-12T10:00:00Z",
  score: 82,
  checks: [
    { check_id: "passed", name: "Passed", category: "seo", status: "passed" },
    { check_id: "warning", name: "Warning", category: "seo", status: "warning" },
    { check_id: "failed", name: "Failed", category: "security", status: "failed" },
  ],
  issues: [
    {
      issue_id: "later",
      check_id: "warning",
      category: "seo",
      severity: "low",
      priority: "p3",
      title: "Later issue",
      description: "Stored description.",
      affected_urls: [],
      recommendation: { summary: "Later action.", steps: [], expected_impact: null },
    },
    {
      issue_id: "first",
      check_id: "failed",
      category: "security",
      severity: "high",
      priority: "p0",
      title: "First issue",
      description: "Stored description.",
      affected_urls: ["https://example.com"],
      recommendation: { summary: "First action.", steps: ["Do first."], expected_impact: null },
    },
  ],
  generated_at: "2026-08-13T10:00:00Z",
};

describe("account report presentation", () => {
  it("derives only deterministic counts and first stored actions", () => {
    expect(reportSummary(snapshot)).toEqual({
      score: 82,
      checkCount: 3,
      issueCount: 2,
      nonPassingCheckCount: 2,
      firstActions: ["First action.", "Later action."],
    });
    expect(reportPriorityDistribution(snapshot.issues)).toEqual([
      { priority: "p0", count: 1 },
      { priority: "p1", count: 0 },
      { priority: "p2", count: 0 },
      { priority: "p3", count: 1 },
    ]);
  });

  it("orders issues by defined priority and groups checks without changing stored text", () => {
    expect(orderedReportIssues(snapshot.issues).map((issue) => issue.issue_id)).toEqual([
      "first",
      "later",
    ]);
    expect(groupReportChecks(snapshot.checks)).toEqual({
      attention: [snapshot.checks[2], snapshot.checks[1]],
      passed: [snapshot.checks[0]],
    });
    expect(groupReportIssues(snapshot.issues).map((group) => ({
      priority: group.priority,
      issueIds: group.issues.map((issue) => issue.issue_id),
    }))).toEqual([
      { priority: "p0", issueIds: ["first"] },
      { priority: "p3", issueIds: ["later"] },
    ]);
    expect(reportPriorityLabel("ru", "p0")).toBe("P0 — исправить первым");
    expect(reportPriorityLabel("en", "unknown")).toBe("Not classified");
    expect(formatReportDate("ru", "not-a-date")).toBe("—");
    expect(reportShareState("ru", false, null)).toEqual({ label: "Приватный", expiry: null });
    expect(reportShareState("en", true, "2026-08-20T10:00:00Z")).toEqual({
      label: "Shared",
      expiry: "2026-08-20T10:00:00Z",
    });
  });

  it("localizes known stored severities without reclassifying unknown values", () => {
    expect(reportSeverityLabel("ru", "critical")).toBe("Критическая");
    expect(reportSeverityLabel("ru", "high")).toBe("Высокая");
    expect(reportSeverityLabel("en", "medium")).toBe("Medium");
    expect(reportSeverityLabel("en", "warning")).toBe("Warning");
    expect(reportSeverityLabel("ru", "provider-specific")).toBe("provider-specific");
  });
});
