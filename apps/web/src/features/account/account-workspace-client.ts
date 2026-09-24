import { AccountClientError } from "./account-client";
import type { Locale } from "@webdiag/tool-registry";
import { isAccountErrorPayload } from "./account-contract";
import {
  isArchivedAccountProject,
  isArchivedAccountProjectListResponse,
  isAccountProject,
  isAccountProjectDetailResponse,
  isAccountProjectListResponse,
  isSavedAuditDetailResponse,
  isAccountCrawlDetail,
  isAccountCrawlList,
  type AccountProject,
  type AccountProjectDetailResponse,
  type AccountProjectListResponse,
  type ArchivedAccountProject,
  type ArchivedAccountProjectListResponse,
  type SavedAuditDetailResponse,
  type AccountCrawlDetail,
  type AccountCrawlList,
} from "./account-workspace-contract";

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
    throw new AccountClientError("Account workspace request failed.", {
      status: response.status,
      code: "account_workspace_request_failed",
    });
  }
  if (!validator(payload)) {
    throw new AccountClientError("Account workspace returned an invalid response.", {
      status: response.status,
      code: "account_invalid_response",
    });
  }
  return payload;
}


export async function listAccountProjects(fetcher: Fetcher = fetch): Promise<AccountProjectListResponse> {
  return parse(
    await fetcher("/api/account/projects", {
      ...common,
      method: "GET",
      headers: { accept: "application/json" },
    }),
    isAccountProjectListResponse,
  );
}

export async function createAccountProject(
  input: { readonly name: string; readonly origin: string },
  fetcher: Fetcher = fetch,
): Promise<AccountProject> {
  return parse(
    await fetcher("/api/account/projects", {
      ...common,
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify(input),
    }),
    isAccountProject,
  );
}

export async function renameAccountProject(
  projectId: string,
  name: string,
  fetcher: Fetcher = fetch,
): Promise<AccountProject> {
  return parse(
    await fetcher(`/api/account/projects/${projectId}`, {
      ...common,
      method: "PATCH",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({ name }),
    }),
    isAccountProject,
  );
}

export async function archiveAccountProject(
  projectId: string,
  fetcher: Fetcher = fetch,
): Promise<ArchivedAccountProject> {
  return parse(
    await fetcher(`/api/account/projects/${projectId}/archive`, {
      ...common,
      method: "POST",
      headers: { accept: "application/json" },
    }),
    isArchivedAccountProject,
  );
}

export async function listArchivedAccountProjects(
  fetcher: Fetcher = fetch,
): Promise<ArchivedAccountProjectListResponse> {
  return parse(
    await fetcher("/api/account/projects/archived", {
      ...common,
      method: "GET",
      headers: { accept: "application/json" },
    }),
    isArchivedAccountProjectListResponse,
  );
}

export async function restoreAccountProject(
  projectId: string,
  fetcher: Fetcher = fetch,
): Promise<AccountProject> {
  return parse(
    await fetcher(`/api/account/projects/${projectId}/restore`, {
      ...common,
      method: "POST",
      headers: { accept: "application/json" },
    }),
    isAccountProject,
  );
}

export async function getAccountProject(
  projectId: string,
  fetcher: Fetcher = fetch,
): Promise<AccountProjectDetailResponse> {
  return parse(
    await fetcher(`/api/account/projects/${projectId}`, {
      ...common,
      method: "GET",
      headers: { accept: "application/json" },
    }),
    isAccountProjectDetailResponse,
  );
}

export async function runAccountProjectAudit(
  projectId: string,
  locale: Locale,
  fetcher: Fetcher = fetch,
): Promise<SavedAuditDetailResponse> {
  return parse(
    await fetcher(`/api/account/projects/${projectId}/audits?locale=${locale}`, {
      ...common,
      method: "POST",
      headers: { accept: "application/json" },
    }),
    isSavedAuditDetailResponse,
  );
}

export async function getAccountSavedAudit(
  projectId: string,
  auditId: string,
  locale: Locale,
  fetcher: Fetcher = fetch,
): Promise<SavedAuditDetailResponse> {
  return parse(
    await fetcher(`/api/account/projects/${projectId}/audits/${auditId}?locale=${locale}`, {
      ...common,
      method: "GET",
      headers: { accept: "application/json" },
    }),
    isSavedAuditDetailResponse,
  );
}

export async function startAccountCrawl(
  projectId: string,
  fetcher: Fetcher = fetch,
): Promise<AccountCrawlDetail> {
  return parse(
    await fetcher(`/api/account/projects/${projectId}/crawls`, {
      ...common,
      method: "POST",
      headers: { accept: "application/json" },
    }),
    isAccountCrawlDetail,
  );
}

export async function listAccountCrawls(
  projectId: string,
  fetcher: Fetcher = fetch,
): Promise<AccountCrawlList> {
  return parse(
    await fetcher(`/api/account/projects/${projectId}/crawls`, {
      ...common,
      method: "GET",
      headers: { accept: "application/json" },
    }),
    isAccountCrawlList,
  );
}

export async function getAccountCrawl(
  projectId: string,
  jobId: string,
  fetcher: Fetcher = fetch,
): Promise<AccountCrawlDetail> {
  return parse(
    await fetcher(`/api/account/projects/${projectId}/crawls/${jobId}`, {
      ...common,
      method: "GET",
      headers: { accept: "application/json" },
    }),
    isAccountCrawlDetail,
  );
}
