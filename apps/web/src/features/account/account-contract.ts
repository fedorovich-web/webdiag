export interface AccountUser {
  readonly id: string;
  readonly email: string;
  readonly display_name: string;
  readonly created_at: string;
}

export interface AccountSessionResponse {
  readonly contract_version: "webdiag.account.session.v1";
  readonly authenticated: true;
  readonly user: AccountUser;
}

export interface AccountLogoutResponse {
  readonly contract_version: "webdiag.account.logout.v1";
  readonly authenticated: false;
}

export interface AccountErrorPayload {
  readonly detail: {
    readonly code: string;
    readonly message: string;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const allowed = new Set(keys);
  return Object.keys(value).every((key) => allowed.has(key)) && Object.keys(value).length === keys.length;
}

export function isAccountSessionResponse(value: unknown): value is AccountSessionResponse {
  if (!isRecord(value) || !hasOnlyKeys(value, ["contract_version", "authenticated", "user"])) {
    return false;
  }
  if (value.contract_version !== "webdiag.account.session.v1" || value.authenticated !== true) {
    return false;
  }
  if (!isRecord(value.user) || !hasOnlyKeys(value.user, ["id", "email", "display_name", "created_at"])) {
    return false;
  }
  return (
    typeof value.user.id === "string" &&
    typeof value.user.email === "string" &&
    typeof value.user.display_name === "string" &&
    typeof value.user.created_at === "string"
  );
}

export function isAccountLogoutResponse(value: unknown): value is AccountLogoutResponse {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["contract_version", "authenticated"]) &&
    value.contract_version === "webdiag.account.logout.v1" &&
    value.authenticated === false
  );
}

export function isAccountErrorPayload(value: unknown): value is AccountErrorPayload {
  return (
    isRecord(value) &&
    isRecord(value.detail) &&
    typeof value.detail.code === "string" &&
    typeof value.detail.message === "string"
  );
}
