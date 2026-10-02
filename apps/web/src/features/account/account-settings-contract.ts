export interface AccountSessionsResponse {
  readonly contract_version: "webdiag.account.sessions.v1";
  readonly active_session_count: number;
}

export interface AccountSessionsRevokedResponse {
  readonly contract_version: "webdiag.account.sessions_revoked.v1";
  readonly active_session_count: 1;
  readonly revoked_session_count: number;
}

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function only(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}

function boundedInteger(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === "number"
    && Number.isInteger(value)
    && value >= minimum
    && value <= maximum;
}

export function isAccountSessionsResponse(value: unknown): value is AccountSessionsResponse {
  return record(value)
    && only(value, ["contract_version", "active_session_count"])
    && value.contract_version === "webdiag.account.sessions.v1"
    && boundedInteger(value.active_session_count, 1, 20);
}

export function isAccountSessionsRevokedResponse(
  value: unknown,
): value is AccountSessionsRevokedResponse {
  return record(value)
    && only(value, ["contract_version", "active_session_count", "revoked_session_count"])
    && value.contract_version === "webdiag.account.sessions_revoked.v1"
    && value.active_session_count === 1
    && boundedInteger(value.revoked_session_count, 0, 19);
}
