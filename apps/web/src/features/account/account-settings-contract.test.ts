import { describe, expect, it } from "vitest";
import {
  isAccountSessionsResponse,
  isAccountSessionsRevokedResponse,
} from "./account-settings-contract";

describe("account settings contracts", () => {
  it("accepts exact bounded session contracts", () => {
    expect(isAccountSessionsResponse({
      contract_version: "webdiag.account.sessions.v1",
      active_session_count: 2,
    })).toBe(true);
    expect(isAccountSessionsRevokedResponse({
      contract_version: "webdiag.account.sessions_revoked.v1",
      active_session_count: 1,
      revoked_session_count: 2,
    })).toBe(true);
  });

  it("rejects wrong versions, invalid counts, and secret-like extra fields", () => {
    for (const active_session_count of [-1, 0, 1.5, 21, "2"]) {
      expect(isAccountSessionsResponse({
        contract_version: "webdiag.account.sessions.v1",
        active_session_count,
      })).toBe(false);
    }
    expect(isAccountSessionsResponse({
      contract_version: "webdiag.account.sessions.v0",
      active_session_count: 1,
    })).toBe(false);
    expect(isAccountSessionsResponse({
      contract_version: "webdiag.account.sessions.v1",
      active_session_count: 1,
      token_hash: "secret",
    })).toBe(false);
    expect(isAccountSessionsRevokedResponse({
      contract_version: "webdiag.account.sessions_revoked.v1",
      active_session_count: 2,
      revoked_session_count: 0,
    })).toBe(false);
    expect(isAccountSessionsRevokedResponse({
      contract_version: "webdiag.account.sessions_revoked.v1",
      active_session_count: 1,
      revoked_session_count: 20,
    })).toBe(false);
  });
});
