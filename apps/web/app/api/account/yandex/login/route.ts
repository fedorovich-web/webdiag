import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { resolveAccountApiBaseUrl } from "../../../../../src/features/account/account-proxy-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_COOKIE_NAME = "yandex_oauth_state";

function resolvePublicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  if (host && !host.startsWith("0.0.0.0")) {
    if (host.includes("webdiag.ru")) {
      return `https://${host}`;
    }
    const proto =
      request.headers.get("x-forwarded-proto") ||
      (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return "https://app.webdiag.ru";
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const publicOrigin = resolvePublicOrigin(request);
  let clientId = (process.env.WEBDIAG_YANDEX_CLIENT_ID || process.env.YANDEX_CLIENT_ID || "").trim();

  if (!clientId) {
    try {
      const apiBaseUrl = resolveAccountApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/v1/account/oauth/config`, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { yandex_client_id?: string };
        clientId = (data.yandex_client_id || "").trim();
      }
    } catch {
      // Backend unavailable or error
    }
  }

  if (!clientId) {
    const errorUrl = new URL("/login?error=yandex_not_configured", publicOrigin);
    return NextResponse.redirect(errorUrl);
  }

  const state = crypto.randomUUID();
  const redirectUri = `${publicOrigin}/api/account/yandex/callback`;

  const authUrl = new URL("https://oauth.yandex.ru/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set(STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || publicOrigin.startsWith("https"),
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  return response;
}
