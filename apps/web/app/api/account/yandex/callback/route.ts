import { NextRequest, NextResponse } from "next/server";
import { resolveAccountApiBaseUrl, selectAccountSetCookie } from "../../../../../src/features/account/account-proxy-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_COOKIE_NAME = "yandex_oauth_state";
const REDIRECT_URI = "https://app.webdiag.ru/api/account/yandex/callback";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const loginRedirect = (errorCode: string) => {
    const target = new URL("/login", request.url);
    target.searchParams.set("error", errorCode);
    return NextResponse.redirect(target);
  };

  if (error) {
    return loginRedirect(`yandex_${error}`);
  }

  if (!code || !state) {
    return loginRedirect("yandex_missing_code");
  }

  const storedState = request.cookies.get(STATE_COOKIE_NAME)?.value;
  if (!storedState || storedState !== state) {
    return loginRedirect("yandex_state_mismatch");
  }

  const clientId = (process.env.WEBDIAG_YANDEX_CLIENT_ID || process.env.YANDEX_CLIENT_ID || "").trim();
  const clientSecret = (process.env.WEBDIAG_YANDEX_CLIENT_SECRET || process.env.YANDEX_CLIENT_SECRET || "").trim();

  if (!clientId || !clientSecret) {
    return loginRedirect("yandex_not_configured");
  }

  try {
    // 1. Exchange authorization code for access token
    const tokenResponse = await fetch("https://oauth.yandex.ru/token", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: REDIRECT_URI,
      }),
      cache: "no-store",
    });

    if (!tokenResponse.ok) {
      return loginRedirect("yandex_token_exchange_failed");
    }

    const tokenData = (await tokenResponse.json()) as { access_token?: string };
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return loginRedirect("yandex_no_access_token");
    }

    // 2. Fetch user profile from Yandex
    const profileResponse = await fetch("https://login.yandex.ru/info?format=json", {
      headers: {
        authorization: `OAuth ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!profileResponse.ok) {
      return loginRedirect("yandex_profile_failed");
    }

    const profile = (await profileResponse.json()) as {
      default_email?: string;
      emails?: string[];
      real_name?: string;
      display_name?: string;
      login?: string;
    };

    const email = profile.default_email || (Array.isArray(profile.emails) && profile.emails[0]) || "";
    if (!email) {
      return loginRedirect("yandex_email_not_provided");
    }

    const displayName =
      profile.real_name || profile.display_name || profile.login || "Пользователь Яндекс";

    // 3. Authenticate or register in WebDiag backend
    const apiBaseUrl = resolveAccountApiBaseUrl();
    const backendResponse = await fetch(`${apiBaseUrl}/v1/account/oauth`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        provider: "yandex",
        email,
        display_name: displayName,
      }),
      cache: "no-store",
    });

    if (!backendResponse.ok) {
      return loginRedirect("yandex_backend_auth_failed");
    }

    const targetUrl = new URL("/account?auth=yandex", request.url);
    const response = NextResponse.redirect(targetUrl);

    // Forward the session cookie
    const setCookie = backendResponse.headers.get("set-cookie");
    const sessionCookie = selectAccountSetCookie(setCookie);
    if (sessionCookie) {
      response.headers.set("set-cookie", sessionCookie);
    }

    // Clear OAuth state cookie
    response.cookies.delete(STATE_COOKIE_NAME);

    return response;
  } catch (err) {
    return loginRedirect("yandex_internal_error");
  }
}
