import { describe, expect, it } from "vitest";
import {
  deriveAccountNextActions,
  isAccountOverviewResponse,
} from "./account-overview-contract";

const project = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Main",
  origin: "https://example.com",
  created_at: "2026-08-12T10:00:00Z",
  updated_at: "2026-08-12T11:00:00Z",
};

const audit = {
  id: "22222222-2222-4222-8222-222222222222",
  project_id: project.id,
  status: "succeeded" as const,
  score: 88,
  check_count: 12,
  issue_count: 3,
  completed_at: "2026-08-12T11:00:00Z",
  created_at: "2026-08-12T11:00:00Z",
};

const monitor = {
  contract_version: "webdiag.account.monitor.v1" as const,
  id: "33333333-3333-4333-8333-333333333333",
  project_id: project.id,
  cadence: "daily" as const,
  timezone: "Europe/Berlin",
  enabled: true,
  status: "changed" as const,
  next_run_at: "2026-08-13T11:00:00Z",
  last_run_at: "2026-08-12T11:00:00Z",
  consecutive_failures: 0,
  created_at: "2026-08-11T11:00:00Z",
  updated_at: "2026-08-12T11:00:00Z",
};

const item = {
  project,
  latest_audit: audit,
  monitor,
  report_count: 1,
  shared_report_count: 1,
  latest_report_created_at: "2026-08-12T12:00:00Z",
};

const overview = {
  contract_version: "webdiag.account.overview.v1" as const,
  projects: [item],
};

describe("account overview contract", () => {
  it("accepts the exact versioned response and rejects extra or inconsistent fields", () => {
    expect(isAccountOverviewResponse(overview)).toBe(true);
    expect(isAccountOverviewResponse({ ...overview, synthetic_health: 92 })).toBe(false);
    expect(isAccountOverviewResponse({
      ...overview,
      projects: [{ ...item, project: { ...project, owner_id: "internal" } }],
    })).toBe(false);
    expect(isAccountOverviewResponse({
      ...overview,
      projects: [{ ...item, monitor: { ...monitor, lease_token: "internal" } }],
    })).toBe(false);
    expect(isAccountOverviewResponse({
      ...overview,
      projects: [{ ...item, latest_audit: { ...audit, project_id: "foreign" } }],
    })).toBe(false);
    expect(isAccountOverviewResponse({
      ...overview,
      projects: [{ ...item, report_count: 0, shared_report_count: 1 }],
    })).toBe(false);
  });

  it("derives at most three actions from explicit persisted states", () => {
    const failed = {
      ...item,
      project: { ...project, id: "44444444-4444-4444-8444-444444444444", name: "Failed" },
      latest_audit: { ...audit, project_id: "44444444-4444-4444-8444-444444444444" },
      monitor: {
        ...monitor,
        project_id: "44444444-4444-4444-8444-444444444444",
        status: "failed" as const,
      },
    };
    const withoutAudit = {
      ...item,
      project: { ...project, id: "55555555-5555-4555-8555-555555555555", name: "New" },
      latest_audit: null,
      monitor: null,
      report_count: 0,
      shared_report_count: 0,
      latest_report_created_at: null,
    };
    const response = {
      contract_version: "webdiag.account.overview.v1" as const,
      projects: [failed, item, withoutAudit],
    };

    expect(deriveAccountNextActions(response, "ru").map((action) => action.kind)).toEqual([
      "resolve_monitor_failure",
      "review_change",
      "run_audit",
    ]);
    expect(deriveAccountNextActions({ ...response, projects: [] }, "en")).toEqual([
      { kind: "create_project", projectId: null, projectName: null, label: "Add a project" },
    ]);
  });
});
