import { afterEach, describe, expect, test, vi } from "vitest";

describe("public sitemap", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  test("publishes both localized contact routes", async () => {
    vi.stubEnv("PUBLIC_RELEASE", "true");
    vi.resetModules();

    const { default: sitemap } = await import("../../app/sitemap");
    const paths = sitemap().map((entry) => new URL(entry.url).pathname);

    expect(paths).toContain("/contacts");
    expect(paths).toContain("/en/contacts");
  });

  test("does not publish retired blog routes", async () => {
    vi.stubEnv("PUBLIC_RELEASE", "true");
    vi.resetModules();

    const { default: sitemap } = await import("../../app/sitemap");
    const blogPath = /^\/(?:en\/)?blog(?:\/|$)/;
    const paths = sitemap().map((entry) => new URL(entry.url).pathname);

    expect(paths.filter((path) => blogPath.test(path))).toEqual([]);
  });
});
