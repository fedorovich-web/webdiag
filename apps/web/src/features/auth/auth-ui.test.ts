import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(relativeUrl: string): string {
  return readFileSync(new URL(relativeUrl, import.meta.url), "utf8");
}

describe("WebDiag auth UI contract", () => {
  it("publishes complete account auth flows in RU and EN", () => {
    const routes = [
      "../../../app/(auth-ru)/auth/login/page.tsx",
      "../../../app/(auth-ru)/auth/register/page.tsx",
      "../../../app/(auth-ru)/auth/forgot-password/page.tsx",
      "../../../app/(auth-ru)/auth/verify-email/page.tsx",
      "../../../app/(auth-ru)/auth/reset-password/page.tsx",
      "../../../app/(auth-en)/en/auth/login/page.tsx",
      "../../../app/(auth-en)/en/auth/register/page.tsx",
      "../../../app/(auth-en)/en/auth/forgot-password/page.tsx",
      "../../../app/(auth-en)/en/auth/verify-email/page.tsx",
      "../../../app/(auth-en)/en/auth/reset-password/page.tsx",
    ];

    for (const route of routes) {
      expect(existsSync(new URL(route, import.meta.url)), route).toBe(true);
    }
  });

  it("keeps auth pages out of the public header and footer layouts", () => {
    const ruLayout = source("../../../app/(auth-ru)/layout.tsx");
    const enLayout = source("../../../app/(auth-en)/layout.tsx");

    for (const layout of [ruLayout, enLayout]) {
      expect(layout).not.toContain("SiteHeader");
      expect(layout).not.toContain("SiteFooter");
    }
  });

  it("uses a product-specific split auth shell with a mobile-safe preview", () => {
    const shell = source("./auth-shell.tsx");
    const styles = source("./auth-shell.module.css");

    expect(shell).toContain("Website health");
    expect(shell).toContain("SEO");
    expect(shell).toContain("Performance");
    expect(shell).toContain("Security");
    expect(shell).toContain("3 issues found");
    expect(styles).toContain("grid-template-columns");
    expect(styles).toContain("@media");
    expect(styles).toContain("display: none");
  });

  it("offers Yandex ID as the only planned social login provider", () => {
    const form = source("./auth-form.tsx");

    expect(form).toContain("Продолжить с Яндекс ID");
    expect(form).not.toMatch(/Google/i);
    expect(form).toContain('type="email"');
    expect(form).toContain('type="password"');
  });

  it("consumes verification and reset tokens through the auth API", () => {
    const tokenFormPath = new URL("./auth-token-form.tsx", import.meta.url);
    expect(existsSync(tokenFormPath)).toBe(true);

    const tokenForm = readFileSync(tokenFormPath, "utf8");
    expect(tokenForm).toContain("/api/auth/verify-email");
    expect(tokenForm).toContain("/api/auth/reset-password");
    expect(tokenForm).toContain("new_password");
    expect(tokenForm).toContain("token");
    expect(tokenForm).toContain('minLength={10}');
  });

  it("fails closed for missing tokens and shares sanitized API error parsing", () => {
    const tokenForm = source("./auth-token-form.tsx");
    const form = source("./auth-form.tsx");
    const responseParser = source("./auth-api-response.ts");

    expect(tokenForm).toContain("missingToken");
    expect(tokenForm).toContain("readAuthMessage");
    expect(form).toContain("readAuthMessage");
    expect(responseParser).toContain("detail");
    expect(responseParser).toContain("message");
  });
});
