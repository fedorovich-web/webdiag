import { describe, expect, it } from "vitest";
import {
  overrideSecurityHeaders,
  siteSecurityHeaders,
} from "./site-security";

function headerMap(headers: readonly { readonly key: string; readonly value: string }[]) {
  return Object.fromEntries(
    headers.map(({ key, value }) => [key.toLowerCase(), value]),
  );
}

describe("site security headers", () => {
  it("keeps a script-compatible baseline on every build", () => {
    expect(headerMap(siteSecurityHeaders(false))).toEqual({
      "content-security-policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https:; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
      "referrer-policy": "strict-origin-when-cross-origin",
      "permissions-policy": "camera=(), microphone=(), geolocation=()",
      "cross-origin-opener-policy": "same-origin",
    });
  });

  it("adds HSTS only to a public release build", () => {
    expect(headerMap(siteSecurityHeaders(false))).not.toHaveProperty(
      "strict-transport-security",
    );
    expect(headerMap(siteSecurityHeaders(true))).toMatchObject({
      "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
    });
  });

  it("allows stricter route-specific privacy headers to replace the baseline", () => {
    const merged = overrideSecurityHeaders(siteSecurityHeaders(false), [
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "Cache-Control", value: "no-store" },
    ]);
    expect(headerMap(merged)).toMatchObject({
      "referrer-policy": "no-referrer",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    });
  });
});
