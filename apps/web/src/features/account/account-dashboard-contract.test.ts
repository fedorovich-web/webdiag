import { describe, expect, it } from "vitest";
import {
  accountNextActionHref,
  accountOverviewMetrics,
  formatMonitorStatus,
  formatNullableScore,
} from "./account-dashboard-contract";
import type { AccountOverviewResponse } from "./account-overview-contract";

const project = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Main",
  origin: "https://example.com",
  created_at: "2026-08-12T10:00:00Z",
  updated_at: "2026-08-12T11:00:00Z",
};

const overview: AccountOverviewResponse = {
  contract_version: "webdiag.account.overview.v1",
  projects: [
    {
      project,
      latest_audit: {
        id: "22222222-2222-4222-8222-222222222222",
        project_id: project.id,
        status: "succeeded",
        score: null,
        check_count: 12,
        issue_count: 3,
        completed_at: "2026-08-12T11:00:00Z",
        created_at: "2026-08-12T11:00:00Z",
      },
      monitor: {
        contract_version: "webdiag.account.monitor.v1",
        id: "33333333-3333-4333-8333-333333333333",
        project_id: project.id,
        cadence: "daily",
        timezone: "Europe/Berlin",
        enabled: true,
        status: "changed",
        next_run_at: "2026-08-13T11:00:00Z",
        last_run_at: "2026-08-12T11:00:00Z",
        consecutive_failures: 0,
        created_at: "2026-08-11T11:00:00Z",
        updated_at: "2026-08-12T11:00:00Z",
      },
      report_count: 3,
      shared_report_count: 1,
      latest_report_created_at: "2026-08-12T12:00:00Z",
    },
    {
      project: {
        ...project,
        id: "44444444-4444-4444-8444-444444444444",
        name: "Without audit",
      },
      latest_audit: null,
      monitor: null,
      report_count: 0,
      shared_report_count: 0,
      latest_report_created_at: null,
    },
  ],
};

describe("account dashboard contract", () => {
  it("derives only real portfolio counts", () => {
    expect(accountOverviewMetrics(overview)).toEqual({
      projectCount: 2,
      projectsWithAudit: 1,
      projectsRequiringAttention: 1,
      readyReportCount: 3,
    });
    expect(JSON.stringify(accountOverviewMetrics(overview))).not.toContain("%");
  });

  it("localizes nullable scores and explicit monitor statuses", () => {
    expect(formatNullableScore(null, "ru")).toBe("Не рассчитана");
    expect(formatNullableScore(88, "en")).toBe("88/100");
    expect(formatMonitorStatus("changed", "ru")).toBe("Есть изменения");
    expect(formatMonitorStatus("failed", "en")).toBe("Check failed");
  });

  it("routes actions only to existing project resources", () => {
    expect(accountNextActionHref("ru", {
      kind: "review_change",
      projectId: project.id,
      projectName: project.name,
      label: "Проверить изменения",
    }, overview)).toBe(`/account/projects/${project.id}/monitoring`);
    expect(accountNextActionHref("en", {
      kind: "create_report",
      projectId: project.id,
      projectName: project.name,
      label: "Create a report",
    }, overview)).toBe(
      `/en/account/projects/${project.id}/audits/22222222-2222-4222-8222-222222222222`,
    );
    expect(accountNextActionHref("ru", {
      kind: "create_project",
      projectId: null,
      projectName: null,
      label: "Добавить проект",
    }, overview)).toBe("#project-create");
  });
});
