import { describe, expect, it } from "vitest";
import {
  AccountClientError,
  getAccountSession,
  loginAccount,
  logoutAccount,
  registerAccount,
} from "./account-client";
import { accountAuthenticationWasLost } from "./account-authentication-state";

const session = {
  contract_version: "webdiag.account.session.v1",
  authenticated: true,
  user: {
    id: "user-1",
    email: "user@example.com",
    display_name: "Roman User",
    created_at: "2026-07-24T12:00:00Z",
  },
} as const;

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("account client", () => {
  it("recognizes only account-wide authentication loss", () => {
    expect(accountAuthenticationWasLost(new AccountClientError("Expired", {
      status: 401,
      code: "account_unauthenticated",
    }))).toBe(true);
    expect(accountAuthenticationWasLost(new AccountClientError("Wrong password", {
      status: 401,
      code: "account_invalid_current_password",
    }))).toBe(false);
  });
  it("sends same-origin bounded register and login contracts", async () => {
    const calls: Array<{ input: string; init?: RequestInit }> = [];
    const fetcher = async (input: string, init?: RequestInit) => {
      calls.push({ input, init });
      return jsonResponse(session, input.includes("register") ? 201 : 200);
    };

    await registerAccount(
      { email: "user@example.com", displayName: "Roman User", password: "long password value" },
      fetcher,
    );
    await loginAccount({ email: "user@example.com", password: "long password value" }, fetcher);

    expect(calls.map((call) => call.input)).toEqual(["/api/account/register", "/api/account/login"]);
    expect(calls.every((call) => call.init?.credentials === "same-origin")).toBe(true);
    expect(JSON.parse(String(calls[0]?.init?.body))).toEqual({
      email: "user@example.com",
      display_name: "Roman User",
      password: "long password value",
    });
  });

  it("validates foundation-only session and logout responses", async () => {
    await expect(getAccountSession(async () => jsonResponse(session))).resolves.toEqual(session);
    await expect(
      getAccountSession(async () => jsonResponse({ ...session, usage: { projects: 0 } })),
    ).rejects.toMatchObject({ code: "account_invalid_response" });
    await expect(
      logoutAccount(async () =>
        jsonResponse({ contract_version: "webdiag.account.logout.v1", authenticated: false }),
      ),
    ).resolves.toEqual({ contract_version: "webdiag.account.logout.v1", authenticated: false });
  });

  it("preserves API error code and status", async () => {
    await expect(
      loginAccount(
        { email: "user@example.com", password: "wrong" },
        async () => jsonResponse({ detail: { code: "account_invalid_credentials", message: "Invalid email or password." } }, 401),
      ),
    ).rejects.toMatchObject({
      status: 401,
      code: "account_invalid_credentials",
    });
  });
});
