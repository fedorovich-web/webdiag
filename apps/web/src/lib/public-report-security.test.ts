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
    const reportRule = rules.find((rule) => rule.source === "/reports/share/:path*");
    expect(reportRule).toBeDefined();
    const headers = Object.fromEntries(
      (reportRule?.headers ?? []).map(({ key, value }) => [key.toLowerCase(), value]),
    );
    expect(headers).toMatchObject({
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow, noarchive",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
    });
  });
});
