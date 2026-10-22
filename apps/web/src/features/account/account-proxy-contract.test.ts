import { describe, expect, it } from "vitest";
import {
  AccountProxyConfigurationError,
  formatAccountSetCookie,
  resolveAccountApiBaseUrl,
  resolveRequestSessionCookie,
  selectAccountRetryAfter,
  selectAccountSessionCookie,
  selectAccountSetCookie,
} from "./account-proxy-contract";

describe("account proxy contract", () => {
  it("requires a private internal origin in production and ignores public URLs", () => {
    expect(() => resolveAccountApiBaseUrl({ NODE_ENV: "production" })).toThrow(
      AccountProxyConfigurationError,
    );
    expect(
      resolveAccountApiBaseUrl({
        NODE_ENV: "production",
        WEBDIAG_API_INTERNAL_URL: "http://api:8000",
        NEXT_PUBLIC_WEBDIAG_API_BASE_URL: "https://public.example",
      }),
    ).toBe("http://api:8000");
    expect(() =>
      resolveAccountApiBaseUrl({
        NODE_ENV: "production",
        WEBDIAG_API_INTERNAL_URL: "https://user:pass@api.example/path",
      }),
    ).toThrow(AccountProxyConfigurationError);
  });

  it("forwards only the account session cookie", () => {
    expect(
      selectAccountSessionCookie("analytics=1; webdiag_session=secret-token; theme=dark"),
    ).toBe("webdiag_session=secret-token");
    expect(selectAccountSessionCookie("analytics=1; theme=dark")).toBeNull();
    expect(selectAccountSetCookie("theme=dark; Path=/")).toBeNull();
    expect(selectAccountSetCookie("webdiag_session=token; Path=/; HttpOnly")).toContain(
      "webdiag_session=token",
    );
  });

  it("forwards only bounded decimal Retry-After values from rate limits", () => {
    expect(selectAccountRetryAfter(429, "60")).toBe("60");
    expect(selectAccountRetryAfter(401, "60")).toBeNull();
    expect(selectAccountRetryAfter(429, "Wed, 21 Oct 2015 07:28:00 GMT")).toBeNull();
    expect(selectAccountRetryAfter(429, "9".repeat(11))).toBeNull();
  });

  it("resolves session cookie from either NextRequest cookie store or raw header", () => {
    const fromCookies = resolveRequestSessionCookie({
      cookies: { get: (name: string) => (name === "webdiag_session" ? { value: "token-from-store" } : undefined) },
      headers: { get: () => null },
    });
    expect(fromCookies).toBe("webdiag_session=token-from-store");

    const fromHeader = resolveRequestSessionCookie({
      cookies: { get: () => undefined },
      headers: { get: () => "webdiag_session=token-from-header" },
    });
    expect(fromHeader).toBe("webdiag_session=token-from-header");
  });

  it("formats Set-Cookie with or without Secure flag depending on HTTPS connection", () => {
    const raw = "webdiag_session=token; Path=/; Max-Age=2592000; Secure; HttpOnly; SameSite=lax";
    expect(formatAccountSetCookie(raw, false)).toBe(
      "webdiag_session=token; Path=/; Max-Age=2592000; HttpOnly; SameSite=lax",
    );
    expect(formatAccountSetCookie(raw, true)).toContain("Secure");
    const rawNoSec = "webdiag_session=token; Path=/; HttpOnly";
    expect(formatAccountSetCookie(rawNoSec, true)).toBe("webdiag_session=token; Path=/; HttpOnly; Secure");
  });
});
