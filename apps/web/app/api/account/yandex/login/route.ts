import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_COOKIE_NAME = "yandex_oauth_state";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const clientId = (process.env.WEBDIAG_YANDEX_CLIENT_ID || process.env.YANDEX_CLIENT_ID || "").trim();
  if (!clientId) {
    const errorUrl = new URL("/login?error=yandex_not_configured", request.url);
    return NextResponse.redirect(errorUrl);
  }

  const state = crypto.randomUUID();
  const redirectUri = "https://app.webdiag.ru/api/account/yandex/callback";

  const authUrl = new URL("https://oauth.yandex.ru/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set(STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  return response;
}
