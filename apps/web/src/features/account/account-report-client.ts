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

function invalidBoundResponse(): AccountClientError {
  return new AccountClientError("Report API returned an invalid response.", {
    status: 200,
    code: "account_invalid_response",
  });
}

export async function createAccountReport(
  projectId: string,
  auditId: string,
  input: { readonly title: string; readonly locale: ReportLocale },
  fetcher: Fetcher = fetch,
): Promise<AccountReportDetailResponse> {
  const detail = await parse(
    await fetcher(`/api/account/projects/${projectId}/audits/${auditId}/reports`, {
      ...common,
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify(input),
    }),
    isAccountReportDetailResponse,
  );
  if (detail.report.project_id !== projectId || detail.report.audit_id !== auditId) {
    throw invalidBoundResponse();
  }
  return detail;
}

export async function listAccountReports(
  options: { readonly projectId?: string } = {},
  fetcher: Fetcher = fetch,
): Promise<AccountReportListResponse> {
  const query = options.projectId
    ? `?project_id=${encodeURIComponent(options.projectId)}`
    : "";
  return parse(
    await fetcher(`/api/account/reports${query}`, {
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
  const detail = await parse(
    await fetcher(`/api/account/reports/${reportId}`, {
      ...common,
      method: "GET",
      headers: { accept: "application/json" },
    }),
    isAccountReportDetailResponse,
  );
  if (detail.report.id !== reportId) throw invalidBoundResponse();
  return detail;
}

export async function enableAccountReportShare(
  reportId: string,
  expiresInDays: number,
  fetcher: Fetcher = fetch,
): Promise<AccountReportShareResponse> {
  const share = await parse(
    await fetcher(`/api/account/reports/${reportId}/share`, {
      ...common,
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({ expires_in_days: expiresInDays }),
    }),
    isAccountReportShareResponse,
  );
  if (share.report_id !== reportId) {
    throw invalidBoundResponse();
  }
  return share;
}

export async function revokeAccountReportShare(
  reportId: string,
  fetcher: Fetcher = fetch,
): Promise<AccountReportDetailResponse> {
  const detail = await parse(
    await fetcher(`/api/account/reports/${reportId}/share`, {
      ...common,
      method: "DELETE",
      headers: { accept: "application/json" },
    }),
    isAccountReportDetailResponse,
  );
  if (detail.report.id !== reportId) throw invalidBoundResponse();
  return detail;
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
