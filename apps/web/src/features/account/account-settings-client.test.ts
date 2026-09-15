import { describe, expect, it } from "vitest";
import {
  changeAccountPassword,
  getAccountSessions,
  revokeOtherAccountSessions,
} from "./account-settings-client";

describe("account settings client", () => {
  it("uses exact same-origin no-store lifecycle requests", async () => {
    const calls: Array<{ input: string; init?: RequestInit }> = [];
    const fetcher = async (input: string, init?: RequestInit): Promise<Response> => {
      calls.push({ input, init });
      if (input.endsWith("/password")) {
        return Response.json({
          contract_version: "webdiag.account.session.v1",
          authenticated: true,
          user: {
            id: "11111111-1111-4111-8111-111111111111",
            email: "user@example.com",
            display_name: "User",
            created_at: "2026-08-01T10:00:00Z",
          },
        });
      }
      if (input.endsWith("/revoke-others")) {
        return Response.json({
          contract_version: "webdiag.account.sessions_revoked.v1",
          active_session_count: 1,
          revoked_session_count: 2,
        });
      }
      return Response.json({
        contract_version: "webdiag.account.sessions.v1",
        active_session_count: 3,
      });
    };

    await getAccountSessions(fetcher);
    await changeAccountPassword({
      currentPassword: "current password value",
      newPassword: "replacement password value",
    }, fetcher);
    await revokeOtherAccountSessions(fetcher);

    expect(calls).toEqual([
      {
        input: "/api/account/sessions",
        init: {
          cache: "no-store",
          credentials: "same-origin",
          method: "GET",
          headers: { accept: "application/json" },
        },
      },
      {
        input: "/api/account/password",
        init: {
          cache: "no-store",
          credentials: "same-origin",
          method: "POST",
          headers: { accept: "application/json", "content-type": "application/json" },
          body: JSON.stringify({
            current_password: "current password value",
            new_password: "replacement password value",
          }),
        },
      },
      {
        input: "/api/account/sessions/revoke-others",
        init: {
          cache: "no-store",
          credentials: "same-origin",
          method: "POST",
          headers: { accept: "application/json" },
        },
      },
    ]);
  });

  it("rejects malformed success and preserves stable API errors", async () => {
    await expect(getAccountSessions(async () => Response.json({
      contract_version: "webdiag.account.sessions.v1",
      active_session_count: 1,
      token: "secret",
    }))).rejects.toMatchObject({ code: "account_invalid_response" });
    await expect(revokeOtherAccountSessions(async () => Response.json({
      detail: { code: "account_unauthenticated", message: "Session expired." },
    }, { status: 401 }))).rejects.toMatchObject({
      code: "account_unauthenticated",
      status: 401,
    });
  });
});
