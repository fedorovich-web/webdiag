import { NextRequest, NextResponse } from "next/server";
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

function extractSessionToken(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|[;,]\s*)webdiag_session=([^;,\s]+)/);
  return match?.[1] ? match[1].trim() : null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const publicOrigin = resolvePublicOrigin(request);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const loginRedirect = (errorCode: string) => {
    const target = new URL("/login", publicOrigin);
    target.searchParams.set("error", errorCode);
    const res = NextResponse.redirect(target);
    res.cookies.delete(STATE_COOKIE_NAME);
    return res;
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

  const redirectUri = `${publicOrigin}/api/account/yandex/callback`;
  const apiBaseUrl = resolveAccountApiBaseUrl();

  const clientId = (process.env.WEBDIAG_YANDEX_CLIENT_ID || process.env.YANDEX_CLIENT_ID || "").trim();
  const clientSecret = (process.env.WEBDIAG_YANDEX_CLIENT_SECRET || process.env.YANDEX_CLIENT_SECRET || "").trim();

  try {
    let sessionToken: string | null = null;

    if (clientId && clientSecret) {
      // Direct exchange from Next.js if credentials are in web container
      const tokenResponse = await fetch("https://oauth.yandex.ru/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
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

      const profileResponse = await fetch("https://login.yandex.ru/info?format=json", {
        headers: { authorization: `OAuth ${accessToken}` },
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

      const rawSetCookie =
        (typeof backendResponse.headers.getSetCookie === "function"
          ? backendResponse.headers.getSetCookie().join("; ")
          : null) || backendResponse.headers.get("set-cookie");
      sessionToken = extractSessionToken(rawSetCookie);
    } else {
      // Fallback to backend exchange (when credentials are in the api container)
      const backendExchangeResponse = await fetch(`${apiBaseUrl}/v1/account/oauth/yandex/exchange`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          code,
          redirect_uri: redirectUri,
        }),
        cache: "no-store",
      });

      if (!backendExchangeResponse.ok) {
        if (backendExchangeResponse.status === 503) {
          return loginRedirect("yandex_not_configured");
        }
        return loginRedirect("yandex_exchange_failed");
      }

      const rawSetCookie =
        (typeof backendExchangeResponse.headers.getSetCookie === "function"
          ? backendExchangeResponse.headers.getSetCookie().join("; ")
          : null) || backendExchangeResponse.headers.get("set-cookie");
      sessionToken = extractSessionToken(rawSetCookie);
    }

    if (!sessionToken) {
      return loginRedirect("yandex_session_missing");
    }

    const targetUrl = new URL("/account?auth=yandex", publicOrigin);
    const response = NextResponse.redirect(targetUrl);

    // 1. Delete temporary state cookie
    response.cookies.delete(STATE_COOKIE_NAME);

    const isHttps =
      publicOrigin.startsWith("https") ||
      request.headers.get("x-forwarded-proto") === "https" ||
      request.nextUrl.protocol === "https:";

    // 2. Set authenticated session cookie on the response
    response.cookies.set("webdiag_session", sessionToken, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err) {
    return loginRedirect("yandex_internal_error");
  }
}
