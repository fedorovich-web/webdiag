import type { NextConfig } from "next";
import { ADMIN_HEADERS } from "./src/features/admin/admin-routing";
import { publicReportSecurityHeaders } from "./src/lib/public-report-security";
import {
  overrideSecurityHeaders,
  siteSecurityHeaders,
} from "./src/lib/site-security";

const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.PUBLIC_RELEASE === "true" ||
  process.env.WEBDIAG_ENVIRONMENT === "production";
const globalSecurityHeaders = siteSecurityHeaders(isProduction);
const sharedReportHeaders = overrideSecurityHeaders(
  globalSecurityHeaders,
  publicReportSecurityHeaders,
);

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@webdiag/tool-core", "@webdiag/tool-registry"],
  async headers() {
    return [
      { source: "/:path*", headers: [...globalSecurityHeaders] },
      { source: "/reports/share/:path*", headers: [...sharedReportHeaders] },
      ...["/admin/:path*", "/en/admin/:path*", "/api/admin/:path*"].map((source) => ({
        source,
        headers: Object.entries(ADMIN_HEADERS).map(([key, value]) => ({ key, value })),
      })),
    ];
  },
};

export default nextConfig;
