import { AccountClientError } from "./account-client";
import { isAccountErrorPayload } from "./account-contract";
import {
  isAccountReportDetailResponse,
  isAccountReportListResponse,
  isAccountReportShareResponse,
  isPublicReportResponse,
  type AccountReportDetailResponse,
  type AccountReportListResponse,
  type AccountReportShareResponse,
  type PublicReportResponse,
  type ReportLocale,
} from "./account-report-contract";

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
    throw new AccountClientError("Report request failed.", {
      status: response.status,
      code: "account_report_request_failed",
    });
  }
  if (!validator(payload)) {
    throw new AccountClientError("Report API returned an invalid response.", {
      status: response.status,
      code: "account_invalid_response",
    });
  }
  return payload;
}

export async function createAccountReport(
  projectId: string,
  auditId: string,
  input: { readonly title: string; readonly locale: ReportLocale },
  fetcher: Fetcher = fetch,
): Promise<AccountReportDetailResponse> {
  return parse(
    await fetcher(`/api/account/projects/${projectId}/audits/${auditId}/reports`, {
      ...common,
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify(input),
    }),
    isAccountReportDetailResponse,
  );
}

export async function listAccountReports(fetcher: Fetcher = fetch): Promise<AccountReportListResponse> {
  return parse(
    await fetcher("/api/account/reports", {
      ...common,
      method: "GET",
      headers: { accept: "application/json" },
    }),
    isAccountReportListResponse,
  );
}

export async function getAccountReport(
  reportId: string,
  fetcher: Fetcher = fetch,
): Promise<AccountReportDetailResponse> {
  return parse(
    await fetcher(`/api/account/reports/${reportId}`, {
      ...common,
      method: "GET",
      headers: { accept: "application/json" },
    }),
    isAccountReportDetailResponse,
  );
}

export async function enableAccountReportShare(
  reportId: string,
  expiresInDays: number,
  fetcher: Fetcher = fetch,
): Promise<AccountReportShareResponse> {
  return parse(
    await fetcher(`/api/account/reports/${reportId}/share`, {
      ...common,
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({ expires_in_days: expiresInDays }),
    }),
    isAccountReportShareResponse,
  );
}

export async function revokeAccountReportShare(
  reportId: string,
  fetcher: Fetcher = fetch,
): Promise<AccountReportDetailResponse> {
  return parse(
    await fetcher(`/api/account/reports/${reportId}/share`, {
      ...common,
      method: "DELETE",
      headers: { accept: "application/json" },
    }),
    isAccountReportDetailResponse,
  );
}

export async function getPublicReport(
  shareToken: string,
  fetcher: Fetcher = fetch,
): Promise<PublicReportResponse> {
  return parse(
    await fetcher(`/api/reports/share/${shareToken}`, {
      cache: "no-store",
      credentials: "omit",
      method: "GET",
      headers: { accept: "application/json" },
    }),
    isPublicReportResponse,
  );
}
