import { after, NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { sendWelcomeEmail } from "../../../../../src/lib/email-service";
import { resolveAccountApiBaseUrl, selectAccountSetCookie } from "../../../../../src/features/account/account-proxy-contract";
import { accountPublicOrigin, clearOAuthCookies, oauthCookie, oauthDestination, readOAuthJson, OAUTH_STATE, OAUTH_VERIFIER, OAUTH_LINK } from "../../../../../src/features/account/yandex-flow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const origin = accountPublicOrigin();
  const destination = oauthDestination(request);
  const loginPath = destination.startsWith("/en/") ? "/en/login" : "/login";
  const fail = (code: string) => {
    const target = new URL(loginPath, origin);
    target.searchParams.set("error", code);
    target.searchParams.set("return_to", destination);
    const response = NextResponse.redirect(target);
    clearOAuthCookies(response);
    return response;
  };
  if (request.nextUrl.searchParams.has("error")) return fail("yandex_access_denied");
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!code || !state) return fail("yandex_missing_code");
  const storedState = request.cookies.get(OAUTH_STATE)?.value;
  const verifier = request.cookies.get(OAUTH_VERIFIER)?.value;
  if (!storedState || state.length > 128 || Buffer.byteLength(state) !== Buffer.byteLength(storedState) ||
      !timingSafeEqual(Buffer.from(state), Buffer.from(storedState))) return fail("yandex_state_mismatch");
  if (!verifier || !/^[A-Za-z0-9._~-]{43,128}$/u.test(verifier)) return fail("yandex_state_mismatch");
  try {
    const upstream = await fetch(`${resolveAccountApiBaseUrl()}/v1/account/oauth/yandex/exchange`, {
      method: "POST", headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ code, code_verifier: verifier, redirect_uri: `${origin}/api/account/yandex/callback` }),
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(25000),
    });
    if (!upstream.ok) {
      const data = await readOAuthJson(upstream);
      const detail = data.detail as { code?: unknown } | undefined;
      if (upstream.status === 409 && detail?.code === "account_link_required" && typeof data.link_token === "string" && /^[A-Za-z0-9_-]{43,128}$/u.test(data.link_token)) {
        const response = fail("yandex_account_link_required");
        oauthCookie(response, OAUTH_LINK, data.link_token);
        return response;
      }
      return fail(upstream.status === 503 ? "yandex_not_configured" : "yandex_exchange_failed");
    }
    const sessionCookie = selectAccountSetCookie(upstream.headers.get("set-cookie"));
    if (!sessionCookie || !sessionCookie.toLowerCase().includes("httponly")) return fail("yandex_session_missing");
    const account = await readOAuthJson(upstream);
    const user = account.user as { email?: unknown } | undefined;
    if (account.created === true && typeof user?.email === "string") {
      const email = user.email;
      after(() => sendWelcomeEmail(email, destination.startsWith("/en/") ? "en" : "ru"));
    }
    const response = NextResponse.redirect(new URL(destination, origin));
    clearOAuthCookies(response);
    response.cookies.delete(OAUTH_LINK);
    response.headers.append("set-cookie", sessionCookie);
    return response;
  } catch { return fail("yandex_internal_error"); }
}
