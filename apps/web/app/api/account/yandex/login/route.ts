import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { resolveAccountApiBaseUrl } from "../../../../../src/features/account/account-proxy-contract";
import { accountPublicOrigin, accountReturnPath, oauthCookie, readOAuthJson, OAUTH_STATE, OAUTH_VERIFIER, OAUTH_RETURN } from "../../../../../src/features/account/yandex-flow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const origin = accountPublicOrigin();
  const destination = accountReturnPath(request.nextUrl.searchParams.get("return_to"), request.nextUrl.searchParams.get("locale") === "en" ? "en" : "ru");
  const loginPath = destination.startsWith("/en/") ? "/en/login" : "/login";
  let clientId = (process.env.WEBDIAG_YANDEX_CLIENT_ID || process.env.YANDEX_CLIENT_ID || "").trim();
  if (!clientId) {
    try {
      const response = await fetch(`${resolveAccountApiBaseUrl()}/v1/account/oauth/config`, {
        cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10000),
      });
      if (response.ok) {
        const data = await readOAuthJson(response);
        if (data.configured === true && typeof data.yandex_client_id === "string") clientId = data.yandex_client_id;
      }
    } catch {   }
  }
  if (!clientId) {
    const response = NextResponse.redirect(new URL(`${loginPath}?error=yandex_not_configured`, origin));
    response.headers.set("cache-control", "no-store");
    return response;
  }
  const state = randomBytes(32).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const url = new URL("https://oauth.yandex.ru/authorize");
  url.search = new URLSearchParams({ response_type: "code", client_id: clientId,
    redirect_uri: `${origin}/api/account/yandex/callback`, state,
    scope: "login:email login:info", code_challenge_method: "S256",
    code_challenge: createHash("sha256").update(verifier).digest("base64url"),
  }).toString();
  const response = NextResponse.redirect(url);
  oauthCookie(response, OAUTH_STATE, state);
  oauthCookie(response, OAUTH_VERIFIER, verifier);
  oauthCookie(response, OAUTH_RETURN, destination);
  response.headers.set("cache-control", "no-store");
  response.headers.set("referrer-policy", "no-referrer");
  return response;
}
