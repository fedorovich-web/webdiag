import { describe, expect, it } from "vitest";
import { getAccountOverview } from "./account-overview-client";

const overview = {
  contract_version: "webdiag.account.overview.v1",
  projects: [],
};

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("account overview client", () => {
  it("uses the same-origin no-store endpoint", async () => {
    const calls: Array<{ input: string; init?: RequestInit }> = [];
    const fetcher = async (input: string, init?: RequestInit) => {
      calls.push({ input, init });
      return jsonResponse(overview);
    };

    await expect(getAccountOverview(fetcher)).resolves.toEqual(overview);
    expect(calls).toEqual([{
      input: "/api/account/overview",
      init: {
        method: "GET",
        headers: { accept: "application/json" },
        cache: "no-store",
        credentials: "same-origin",
      },
    }]);
  });

  it("rejects invalid success payloads and preserves stable API errors", async () => {
    await expect(
      getAccountOverview(async () => jsonResponse({ ...overview, health: 92 })),
    ).rejects.toMatchObject({ code: "account_invalid_response" });
    await expect(
      getAccountOverview(async () => jsonResponse({
        detail: { code: "account_session_expired", message: "Session expired." },
      }, 401)),
    ).rejects.toMatchObject({ code: "account_session_expired", status: 401 });
  });
});
