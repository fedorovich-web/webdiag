import { AccountClientError } from "./account-client";
import {
  isAccountErrorPayload,
  isAccountSessionResponse,
  type AccountSessionResponse,
} from "./account-contract";
import {
  isAccountSessionsResponse,
  isAccountSessionsRevokedResponse,
  type AccountSessionsResponse,
  type AccountSessionsRevokedResponse,
} from "./account-settings-contract";

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
    throw new AccountClientError("Account settings request failed.", {
      status: response.status,
      code: "account_request_failed",
    });
  }
  if (!validator(payload)) {
    throw new AccountClientError("Account settings API returned an invalid response.", {
      status: response.status,
      code: "account_invalid_response",
    });
  }
  return payload;
}

export async function getAccountSessions(
  fetcher: Fetcher = fetch,
): Promise<AccountSessionsResponse> {
  return parse(await fetcher("/api/account/sessions", {
    ...common,
    method: "GET",
    headers: { accept: "application/json" },
  }), isAccountSessionsResponse);
}

export async function changeAccountPassword(
  input: { readonly currentPassword: string; readonly newPassword: string },
  fetcher: Fetcher = fetch,
): Promise<AccountSessionResponse> {
  return parse(await fetcher("/api/account/password", {
    ...common,
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({
      current_password: input.currentPassword,
      new_password: input.newPassword,
    }),
  }), isAccountSessionResponse);
}

export async function revokeOtherAccountSessions(
  fetcher: Fetcher = fetch,
): Promise<AccountSessionsRevokedResponse> {
  return parse(await fetcher("/api/account/sessions/revoke-others", {
    ...common,
    method: "POST",
    headers: { accept: "application/json" },
  }), isAccountSessionsRevokedResponse);
}
