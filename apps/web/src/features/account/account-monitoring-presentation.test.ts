import { describe, expect, it } from "vitest";
import {
  isAccountMonitor,
  isMonitorHistoryResponse,
  type AccountMonitor,
  type MonitorRun,
} from "./account-monitoring-contract";
import {
  monitorCadenceLabel,
  monitorChangeLabel,
  monitorStatusLabel,
  suppliedMonitorDeltas,
} from "./account-monitoring-presentation";

const monitor: AccountMonitor = {
  contract_version: "webdiag.account.monitor.v1",
  id: "44444444-4444-4444-8444-444444444444",
  project_id: "11111111-1111-4111-8111-111111111111",
  cadence: "daily",
  timezone: "Europe/Berlin",
  enabled: true,
  status: "changed",
  next_run_at: "2026-08-14T10:00:00Z",
  last_run_at: "2026-08-13T10:00:00Z",
  consecutive_failures: 0,
  created_at: "2026-08-12T10:00:00Z",
  updated_at: "2026-08-13T10:00:00Z",
};

const run: MonitorRun = {
  id: "55555555-5555-4555-8555-555555555555",
  monitor_id: monitor.id,
  project_id: monitor.project_id,
  status: "changed",
  score: 84,
  issue_count: 3,
  started_at: "2026-08-13T10:00:00Z",
  completed_at: "2026-08-13T10:00:05Z",
  change: {
    contract_version: "webdiag.account.monitor_change.v1",
    kind: "changed",
    previous_score: 80,
    current_score: 84,
    score_delta: 4,
    previous_issue_count: 4,
    current_issue_count: 3,
    added_issue_ids: ["new.issue"],
    resolved_issue_ids: ["old.issue", "other.issue"],
  },
  error_code: null,
};

describe("account monitoring presentation", () => {
  it("localizes only contract-defined states", () => {
    expect(monitorCadenceLabel("ru", "six_hours")).toBe("Каждые 6 часов");
    expect(monitorStatusLabel("ru", "running")).toBe("Проверка выполняется");
    expect(monitorStatusLabel("en", "failed")).toBe("Last run failed");
    expect(monitorChangeLabel("ru", "baseline")).toBe("Базовый результат");
    expect(monitorChangeLabel("en", "unchanged")).toBe("No changes");
  });

  it("shows only deltas supplied by the persisted change contract", () => {
    expect(suppliedMonitorDeltas("ru", run.change)).toEqual([
      "Оценка: +4",
      "Добавлено проблем: 1",
      "Исправлено проблем: 2",
    ]);
    expect(suppliedMonitorDeltas("ru", { ...run.change, score_delta: null, added_issue_ids: [], resolved_issue_ids: [] })).toEqual([]);
  });
});

describe("account monitoring strict boundary", () => {
  it("rejects extra fields and negative counters", () => {
    expect(isAccountMonitor(monitor)).toBe(true);
    expect(isAccountMonitor({ ...monitor, internal_lease_token: "secret" })).toBe(false);
    expect(isAccountMonitor({ ...monitor, consecutive_failures: -1 })).toBe(false);
    expect(isMonitorHistoryResponse({
      contract_version: "webdiag.account.monitor_history.v1",
      monitor,
      runs: [{ ...run, issue_count: -1 }],
    })).toBe(false);
  });

  it("rejects cross-project and cross-monitor history rows", () => {
    expect(isMonitorHistoryResponse({
      contract_version: "webdiag.account.monitor_history.v1",
      monitor,
      runs: [run],
    })).toBe(true);
    expect(isMonitorHistoryResponse({
      contract_version: "webdiag.account.monitor_history.v1",
      monitor,
      runs: [{ ...run, project_id: "99999999-9999-4999-8999-999999999999" }],
    })).toBe(false);
    expect(isMonitorHistoryResponse({
      contract_version: "webdiag.account.monitor_history.v1",
      monitor,
      runs: [{ ...run, monitor_id: "99999999-9999-4999-8999-999999999999" }],
    })).toBe(false);
  });
});
