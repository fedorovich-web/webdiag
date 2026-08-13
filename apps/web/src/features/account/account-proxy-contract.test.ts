import { describe, expect, it } from "vitest";
import {
  AccountProxyConfigurationError,
  resolveAccountApiBaseUrl,
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
});
