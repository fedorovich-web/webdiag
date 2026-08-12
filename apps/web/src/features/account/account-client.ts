import {
  isAccountErrorPayload,
  isAccountLogoutResponse,
  isAccountSessionResponse,
  type AccountLogoutResponse,
  type AccountSessionResponse,
} from "./account-contract";

export class AccountClientError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, options: { status: number; code: string }) {
    super(message);
    this.name = "AccountClientError";
    this.status = options.status;
    this.code = options.code;
  }
}

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

async function parseResponse<T>(
  response: Response,
  validator: (value: unknown) => value is T,
): Promise<T> {
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (isAccountErrorPayload(payload)) {
      throw new AccountClientError(payload.detail.message, {
        status: response.status,
        code: payload.detail.code,
      });
    }
    throw new AccountClientError("Account service request failed.", {
      status: response.status,
      code: "account_request_failed",
    });
  }
  if (!validator(payload)) {
    throw new AccountClientError("Account service returned an invalid response.", {
      status: response.status,
      code: "account_invalid_response",
    });
  }
  return payload;
}

const commonRequest: Pick<RequestInit, "cache" | "credentials"> = {
  cache: "no-store",
  credentials: "same-origin",
};

export async function registerAccount(
  input: { email: string; displayName: string; password: string },
  fetcher: Fetcher = fetch,
): Promise<AccountSessionResponse> {
  const response = await fetcher("/api/account/register", {
    ...commonRequest,
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({
      email: input.email,
      display_name: input.displayName,
      password: input.password,
    }),
  });
  return parseResponse(response, isAccountSessionResponse);
}

export async function loginAccount(
  input: { email: string; password: string },
  fetcher: Fetcher = fetch,
): Promise<AccountSessionResponse> {
  const response = await fetcher("/api/account/login", {
    ...commonRequest,
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseResponse(response, isAccountSessionResponse);
}

export async function getAccountSession(fetcher: Fetcher = fetch): Promise<AccountSessionResponse> {
  const response = await fetcher("/api/account/me", {
    ...commonRequest,
    method: "GET",
    headers: { accept: "application/json" },
  });
  return parseResponse(response, isAccountSessionResponse);
}

export async function logoutAccount(fetcher: Fetcher = fetch): Promise<AccountLogoutResponse> {
  const response = await fetcher("/api/account/logout", {
    ...commonRequest,
    method: "POST",
    headers: { accept: "application/json" },
  });
  return parseResponse(response, isAccountLogoutResponse);
}
