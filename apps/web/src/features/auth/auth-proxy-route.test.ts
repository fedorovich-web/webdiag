import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { GET, POST } from "../../../app/api/auth/[action]/route";

type RouteContext = { params: Promise<{ action: string }> };
type NextRequestInit = NonNullable<ConstructorParameters<typeof NextRequest>[1]>;

function context(action: string): RouteContext {
  return { params: Promise.resolve({ action }) };
}

function request(
  action: string,
  init: NextRequestInit = {},
): NextRequest {
  return new NextRequest(`https://webdiag.ru/api/auth/${action}`, init);
}

describe("auth BFF route", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("forwards an allowlisted JSON action and preserves the session cookie", async () => {
    vi.stubEnv("WEBDIAG_API_INTERNAL_URL", "http://api:8000/");
    const upstreamFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("http://api:8000/api/auth/login");
      expect(init?.method).toBe("POST");
      expect(init?.redirect).toBe("manual");
      expect(init?.body).toBe('{"email":"user@example.com","password":"correct password","locale":"en"}');
      return new Response(
        JSON.stringify({
          id: "00000000-0000-4000-8000-000000000000",
          email: "user@example.com",
          status: "active",
          email_verified_at: "2026-09-11T12:00:00Z",
          created_at: "2026-09-11T11:00:00Z",
          updated_at: "2026-09-11T12:00:00Z",
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
            "set-cookie": "webdiag_session=opaque; Path=/; HttpOnly; Secure; SameSite=Lax",
          },
        },
      );
    });
    vi.stubGlobal("fetch", upstreamFetch);

    const response = await POST(
      request("login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://webdiag.ru",
          "sec-fetch-site": "same-origin",
        },
        body: JSON.stringify({
          email: "user@example.com",
          password: "correct password",
          locale: "en",
        }),
      }),
      context("login"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("webdiag_session=opaque");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(upstreamFetch).toHaveBeenCalledOnce();
  });

  it("forwards the current session only to the fixed me endpoint", async () => {
    const upstreamFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("http://127.0.0.1:8000/api/auth/me");
      expect(new Headers(init?.headers).get("cookie")).toBe("webdiag_session=opaque");
      return Response.json({ detail: "Authentication failed" }, { status: 401 });
    });
    vi.stubGlobal("fetch", upstreamFetch);

    const response = await GET(
      request("me", {
        method: "GET",
        headers: { cookie: "webdiag_session=opaque" },
      }),
      context("me"),
    );

    expect(response.status).toBe(401);
    expect(upstreamFetch).toHaveBeenCalledOnce();
  });

  it.each(["oauth", "../me", "verify-email/extra"])(
    "rejects non-allowlisted action %s before the network",
    async (action) => {
      const upstreamFetch = vi.fn();
      vi.stubGlobal("fetch", upstreamFetch);

      const response = await POST(
        request("unknown", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        }),
        context(action),
      );

      expect(response.status).toBe(404);
      expect(upstreamFetch).not.toHaveBeenCalled();
    },
  );

  it("rejects cross-site mutations before the network", async () => {
    const upstreamFetch = vi.fn();
    vi.stubGlobal("fetch", upstreamFetch);

    const response = await POST(
      request("logout", {
        method: "POST",
        headers: {
          origin: "https://attacker.example",
          "sec-fetch-site": "cross-site",
        },
      }),
      context("logout"),
    );

    expect(response.status).toBe(403);
    expect(upstreamFetch).not.toHaveBeenCalled();
  });

  it("rejects oversized auth bodies before the network", async () => {
    const upstreamFetch = vi.fn();
    vi.stubGlobal("fetch", upstreamFetch);

    const response = await POST(
      request("register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "a".repeat(20_000) }),
      }),
      context("register"),
    );

    expect(response.status).toBe(413);
    expect(upstreamFetch).not.toHaveBeenCalled();
  });

  it("fails closed for redirects and non-JSON upstream responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: "https://attacker.example" } }))
        .mockResolvedValueOnce(new Response("upstream failure", { status: 500 })),
    );

    const first = await POST(
      request("logout", { method: "POST" }),
      context("logout"),
    );
    const second = await POST(
      request("logout", { method: "POST" }),
      context("logout"),
    );

    expect(first.status).toBe(502);
    expect(second.status).toBe(502);
    await expect(first.json()).resolves.toEqual({ detail: "Authentication service is unavailable" });
  });
});
