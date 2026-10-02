import type { NextConfig } from "next";
import { publicReportSecurityHeaders } from "./src/lib/public-report-security";
import {
  overrideSecurityHeaders,
  siteSecurityHeaders,
} from "./src/lib/site-security";

const globalSecurityHeaders = siteSecurityHeaders(process.env.PUBLIC_RELEASE === "true");
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
    ];
  },
};

export default nextConfig;
