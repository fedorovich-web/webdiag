import { AccountClientError } from "./account-client";

export const ACCOUNT_AUTHENTICATION_LOST_EVENT = "webdiag:account-authentication-lost";

export function accountAuthenticationWasLost(caught: unknown): boolean {
  return caught instanceof AccountClientError
    && (caught.code === "account_unauthenticated" || caught.code === "account_credentials_changed");
}

export function announceAccountAuthenticationLost(caught: unknown): boolean {
  if (!accountAuthenticationWasLost(caught)) return false;
  window.dispatchEvent(new Event(ACCOUNT_AUTHENTICATION_LOST_EVENT));
  return true;
}
