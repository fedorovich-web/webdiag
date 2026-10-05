import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../../../app/api/account/yandex/callback/route";

describe("Yandex OAuth callback route", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.WEBDIAG_API_INTERNAL_URL = "http://127.0.0.1:8000";
    process.env.WEBDIAG_YANDEX_CLIENT_ID = "test-client-id";
    process.env.WEBDIAG_YANDEX_CLIENT_SECRET = "test-client-secret";
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("redirects to login with error when error parameter is present", async () => {
    const request = new NextRequest("https://app.webdiag.ru/api/account/yandex/callback?error=access_denied");
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("https://app.webdiag.ru/login?error=yandex_access_denied");
  });

  it("redirects to login when code or state is missing", async () => {
    const request = new NextRequest("https://app.webdiag.ru/api/account/yandex/callback?code=some-code");
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("https://app.webdiag.ru/login?error=yandex_missing_code");
  });

  it("redirects to login when state does not match stored cookie", async () => {
    const request = new NextRequest("https://app.webdiag.ru/api/account/yandex/callback?code=123&state=state-a", {
      headers: {
        cookie: "yandex_oauth_state=state-b",
      },
    });
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("https://app.webdiag.ru/login?error=yandex_state_mismatch");
  });

  it("successfully exchanges token, sets webdiag_session cookie and clears state cookie", async () => {
    const state = "valid-state-123";
    const request = new NextRequest(`https://app.webdiag.ru/api/account/yandex/callback?code=good-code&state=${state}`, {
      headers: {
        cookie: `yandex_oauth_state=${state}`,
        "x-forwarded-host": "app.webdiag.ru",
        "x-forwarded-proto": "https",
      },
    });

    const mockFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "https://oauth.yandex.ru/token") {
        return new Response(JSON.stringify({ access_token: "mock-yandex-token" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      if (url === "https://login.yandex.ru/info?format=json") {
        return new Response(
          JSON.stringify({
            default_email: "testuser@yandex.ru",
            display_name: "Test User",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      }
      if (url.includes("/v1/account/oauth")) {
        const headers = new Headers();
        headers.set("content-type", "application/json");
        headers.set(
          "set-cookie",
          "webdiag_session=mock-session-token-abc; Max-Age=2592000; Path=/; SameSite=lax; HttpOnly",
        );
        return new Response(
          JSON.stringify({
            authenticated: true,
            user: { id: "u-123", email: "testuser@yandex.ru", display_name: "Test User" },
          }),
          {
            status: 200,
            headers,
          },
        );
      }
      return new Response("Not found", { status: 404 });
    });
    vi.stubGlobal("fetch", mockFetch);

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://app.webdiag.ru/account?auth=yandex");

    // Verify session cookie was set
    const sessionCookie = response.cookies.get("webdiag_session");
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.value).toBe("mock-session-token-abc");

    // Verify state cookie was deleted
    const stateCookie = response.cookies.get("yandex_oauth_state");
    expect(stateCookie?.value).toBe("");
  });

  it("successfully falls back to backend exchange when web credentials are empty", async () => {
    delete process.env.WEBDIAG_YANDEX_CLIENT_ID;
    delete process.env.WEBDIAG_YANDEX_CLIENT_SECRET;
    delete process.env.YANDEX_CLIENT_ID;
    delete process.env.YANDEX_CLIENT_SECRET;

    const state = "valid-state-fallback";
    const request = new NextRequest(`https://app.webdiag.ru/api/account/yandex/callback?code=good-code&state=${state}`, {
      headers: {
        cookie: `yandex_oauth_state=${state}`,
        "x-forwarded-host": "app.webdiag.ru",
        "x-forwarded-proto": "https",
      },
    });

    const mockFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/v1/account/oauth/yandex/exchange")) {
        const headers = new Headers();
        headers.set("content-type", "application/json");
        headers.set(
          "set-cookie",
          "webdiag_session=mock-backend-session-xyz; Max-Age=2592000; Path=/; SameSite=lax; HttpOnly",
        );
        return new Response(
          JSON.stringify({
            authenticated: true,
            user: { id: "u-456", email: "backend@yandex.ru", display_name: "Backend User" },
          }),
          {
            status: 200,
            headers,
          },
        );
      }
      return new Response("Not found", { status: 404 });
    });
    vi.stubGlobal("fetch", mockFetch);

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://app.webdiag.ru/account?auth=yandex");

    // Verify session cookie was set from backend exchange
    const sessionCookie = response.cookies.get("webdiag_session");
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.value).toBe("mock-backend-session-xyz");

    // Verify state cookie was deleted
    const stateCookie = response.cookies.get("yandex_oauth_state");
    expect(stateCookie?.value).toBe("");
  });
});

