import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(relativeUrl: string): string {
  return readFileSync(new URL(relativeUrl, import.meta.url), "utf8");
}

describe("WebDiag auth UI contract", () => {
  it("publishes login, registration and password recovery in RU and EN", () => {
    const routes = [
      "../../../app/(ru)/auth/login/page.tsx",
      "../../../app/(ru)/auth/register/page.tsx",
      "../../../app/(ru)/auth/forgot-password/page.tsx",
      "../../../app/(en)/en/auth/login/page.tsx",
      "../../../app/(en)/en/auth/register/page.tsx",
      "../../../app/(en)/en/auth/forgot-password/page.tsx",
    ];

    for (const route of routes) {
      expect(existsSync(new URL(route, import.meta.url)), route).toBe(true);
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
});
