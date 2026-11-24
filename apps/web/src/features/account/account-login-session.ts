import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { accountReturnPath } from "./account-navigation";
import { selectAccountSessionCookie } from "./account-proxy-contract";
import { accountSessionStatus } from "./account-session-status";

export async function redirectExistingAccountSession(locale: "ru" | "en", returnTo?: string) {
  const requestHeaders = await headers();
  const session = selectAccountSessionCookie(requestHeaders.get("cookie"));
  if (await accountSessionStatus(session) === 204) redirect(accountReturnPath(returnTo, locale));
}
