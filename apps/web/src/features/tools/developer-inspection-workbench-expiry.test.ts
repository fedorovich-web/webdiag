import { describe, expect, it } from "vitest";
import { inspectJwt } from "./developer-inspection-workbench";

function base64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/gu, "-").replace(/\//gu, "_").replace(/=+$/u, "");
}

function token(header: unknown, payload: unknown, signature = "signature"): string {
  return `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}.${base64Url(signature)}`;
}

describe("JWT expiration boundary", () => {
  it("treats exp equal to the current time as expired", () => {
    const result = inspectJwt(token({ alg: "RS256" }, { exp: 100 }), { nowSeconds: 100 });

    expect(result.temporalClaims).toContainEqual(expect.objectContaining({ claim: "exp", status: "expired" }));
    expect(result.warnings.map((item) => item.code)).toContain("token_expired_by_browser_clock");
  });
});
