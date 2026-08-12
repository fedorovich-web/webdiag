export type MonitorCadence = "hourly" | "six_hours" | "twelve_hours" | "daily" | "weekly";
export type MonitorStatus = "pending" | "running" | "passed" | "changed" | "failed";

export interface AccountMonitor {
  readonly contract_version: "webdiag.account.monitor.v1";
  readonly id: string;
  readonly project_id: string;
  readonly cadence: MonitorCadence;
  readonly timezone: string;
  readonly enabled: boolean;
  readonly status: MonitorStatus;
  readonly next_run_at: string | null;
  readonly last_run_at: string | null;
  readonly consecutive_failures: number;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface MonitorChange {
  readonly contract_version: "webdiag.account.monitor_change.v1";
  readonly kind: "baseline" | "unchanged" | "changed" | "failed";
  readonly previous_score: number | null;
  readonly current_score: number | null;
  readonly score_delta: number | null;
  readonly previous_issue_count: number | null;
  readonly current_issue_count: number | null;
  readonly added_issue_ids: readonly string[];
  readonly resolved_issue_ids: readonly string[];
}

export interface MonitorRun {
  readonly id: string;
  readonly monitor_id: string;
  readonly project_id: string;
  readonly status: MonitorStatus;
  readonly score: number | null;
  readonly issue_count: number;
  readonly started_at: string;
  readonly completed_at: string;
  readonly change: MonitorChange;
  readonly error_code: string | null;
}

export interface MonitorRunResponse {
  readonly contract_version: "webdiag.account.monitor_run.v1";
  readonly run: MonitorRun;
}

export interface MonitorHistoryResponse {
  readonly contract_version: "webdiag.account.monitor_history.v1";
  readonly monitor: AccountMonitor;
  readonly runs: readonly MonitorRun[];
}

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function string(value: unknown): value is string {
  return typeof value === "string";
}

function nullableString(value: unknown): value is string | null {
  return value === null || string(value);
}

function nullableNumber(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

const cadences = new Set(["hourly", "six_hours", "twelve_hours", "daily", "weekly"]);
const statuses = new Set(["pending", "running", "passed", "changed", "failed"]);

export function isAccountMonitor(value: unknown): value is AccountMonitor {
  return record(value)
    && value.contract_version === "webdiag.account.monitor.v1"
    && string(value.id) && string(value.project_id) && cadences.has(String(value.cadence))
    && string(value.timezone) && typeof value.enabled === "boolean"
    && statuses.has(String(value.status)) && nullableString(value.next_run_at)
    && nullableString(value.last_run_at) && Number.isInteger(value.consecutive_failures)
    && string(value.created_at) && string(value.updated_at);
}

function isChange(value: unknown): value is MonitorChange {
  return record(value)
    && value.contract_version === "webdiag.account.monitor_change.v1"
    && ["baseline", "unchanged", "changed", "failed"].includes(String(value.kind))
    && nullableNumber(value.previous_score) && nullableNumber(value.current_score)
    && nullableNumber(value.score_delta) && nullableNumber(value.previous_issue_count)
    && nullableNumber(value.current_issue_count) && Array.isArray(value.added_issue_ids)
    && value.added_issue_ids.every(string) && Array.isArray(value.resolved_issue_ids)
    && value.resolved_issue_ids.every(string);
}

function isRun(value: unknown): value is MonitorRun {
  return record(value) && string(value.id) && string(value.monitor_id)
    && string(value.project_id) && statuses.has(String(value.status))
    && nullableNumber(value.score) && Number.isInteger(value.issue_count)
    && string(value.started_at) && string(value.completed_at) && isChange(value.change)
    && nullableString(value.error_code);
}

export function isMonitorRunResponse(value: unknown): value is MonitorRunResponse {
  return record(value) && value.contract_version === "webdiag.account.monitor_run.v1"
    && isRun(value.run);
}

export function isMonitorHistoryResponse(value: unknown): value is MonitorHistoryResponse {
  return record(value) && value.contract_version === "webdiag.account.monitor_history.v1"
    && isAccountMonitor(value.monitor) && Array.isArray(value.runs)
    && value.runs.every(isRun);
}
