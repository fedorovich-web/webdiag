import { AccountClientError } from "./account-client";
import { isAccountErrorPayload } from "./account-contract";
import {
  isAccountOverviewResponse,
  type AccountOverviewResponse,
} from "./account-overview-contract";

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

export async function getAccountOverview(
  fetcher: Fetcher = fetch,
): Promise<AccountOverviewResponse> {
  const response = await fetcher("/api/account/overview", {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store",
    credentials: "same-origin",
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (isAccountErrorPayload(payload)) {
      throw new AccountClientError(payload.detail.message, {
        status: response.status,
        code: payload.detail.code,
      });
    }
    throw new AccountClientError("Account overview request failed.", {
      status: response.status,
      code: "account_overview_request_failed",
    });
  }
  if (!isAccountOverviewResponse(payload)) {
    throw new AccountClientError("Account overview returned an invalid response.", {
      status: response.status,
      code: "account_invalid_response",
    });
  }
  return payload;
}
