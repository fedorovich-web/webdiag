import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { accountReturnPath } from "./account-navigation";
import { resolveAccountApiBaseUrl, selectAccountSessionCookie } from "./account-proxy-contract";

export async function redirectExistingAccountSession(locale: "ru" | "en", returnTo?: string) {
  const requestHeaders = await headers();
  const session = selectAccountSessionCookie(requestHeaders.get("cookie"));
  if (!session) return;

  let signedIn = false;
  try {
    const response = await fetch(resolveAccountApiBaseUrl() + "/v1/account/me", {
      headers: { accept: "application/json", cookie: session },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(2_000),
    });
    signedIn = response.status === 200;
    await response.body?.cancel().catch(() => {});
  } catch {
    return;
  }

  if (signedIn) redirect(accountReturnPath(returnTo, locale));
}
