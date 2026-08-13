import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import { publicReportSecurityHeaders } from "./public-report-security";

describe("public report document security", () => {
  it("prevents caching, indexing, and share-token referrer leakage", async () => {
    expect(Object.fromEntries(publicReportSecurityHeaders.map(({ key, value }) => [key.toLowerCase(), value]))).toEqual({
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow, noarchive",
      "referrer-policy": "no-referrer",
    });
    const rules = typeof nextConfig.headers === "function" ? await nextConfig.headers() : [];
    expect(rules).toContainEqual({
      source: "/reports/share/:path*",
      headers: [...publicReportSecurityHeaders],
    });
  });
});
