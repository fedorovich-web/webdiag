import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@webdiag/tool-core", "@webdiag/tool-registry"],
};

export default nextConfig;
