import { AccountClientError } from "./account-client";
import { isAccountErrorPayload } from "./account-contract";
import {
  isAccountMonitor,
  isMonitorHistoryResponse,
  isMonitorRunResponse,
  type AccountMonitor,
  type MonitorCadence,
  type MonitorHistoryResponse,
  type MonitorRunResponse,
} from "./account-monitoring-contract";

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;
const common: Pick<RequestInit, "cache" | "credentials"> = {
  cache: "no-store",
  credentials: "same-origin",
};

async function parse<T>(response: Response, validator: (value: unknown) => value is T): Promise<T> {
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (isAccountErrorPayload(payload)) {
      throw new AccountClientError(payload.detail.message, {
        status: response.status,
        code: payload.detail.code,
      });
    }
    throw new AccountClientError("Monitoring request failed.", {
      status: response.status,
      code: "account_monitoring_request_failed",
    });
  }
  if (!validator(payload)) {
    throw new AccountClientError("Monitoring returned an invalid response.", {
      status: response.status,
      code: "account_invalid_response",
    });
  }
  return payload;
}

export function getAccountMonitor(projectId: string, fetcher: Fetcher = fetch): Promise<AccountMonitor> {
  return fetcher(`/api/account/projects/${projectId}/monitor`, {
    ...common, method: "GET", headers: { accept: "application/json" },
  }).then((response) => parse(response, isAccountMonitor));
}

export function createAccountMonitor(
  projectId: string,
  input: { readonly cadence: MonitorCadence; readonly timezone: string },
  fetcher: Fetcher = fetch,
): Promise<AccountMonitor> {
  return fetcher(`/api/account/projects/${projectId}/monitor`, {
    ...common,
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify(input),
  }).then((response) => parse(response, isAccountMonitor));
}

export function updateAccountMonitor(
  projectId: string,
  input: { readonly cadence?: MonitorCadence; readonly timezone?: string; readonly enabled?: boolean },
  fetcher: Fetcher = fetch,
): Promise<AccountMonitor> {
  return fetcher(`/api/account/projects/${projectId}/monitor`, {
    ...common,
    method: "PATCH",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify(input),
  }).then((response) => parse(response, isAccountMonitor));
}

export function runAccountMonitor(projectId: string, fetcher: Fetcher = fetch): Promise<MonitorRunResponse> {
  return fetcher(`/api/account/projects/${projectId}/monitor/run`, {
    ...common, method: "POST", headers: { accept: "application/json" },
  }).then((response) => parse(response, isMonitorRunResponse));
}

export function getAccountMonitorHistory(
  projectId: string,
  fetcher: Fetcher = fetch,
): Promise<MonitorHistoryResponse> {
  return fetcher(`/api/account/projects/${projectId}/monitor/history`, {
    ...common, method: "GET", headers: { accept: "application/json" },
  }).then((response) => parse(response, isMonitorHistoryResponse));
}
