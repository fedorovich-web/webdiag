import type { NextConfig } from "next";
import { publicReportSecurityHeaders } from "./src/lib/public-report-security";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@webdiag/tool-core", "@webdiag/tool-registry"],
  async headers() {
    return [{ source: "/reports/share/:path*", headers: [...publicReportSecurityHeaders] }];
  },
};

export default nextConfig;
