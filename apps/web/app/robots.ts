import type { MetadataRoute } from "next";
import { publicReleaseEnabled } from "../src/lib/release";
export default function robots(): MetadataRoute.Robots {
  return publicReleaseEnabled
    ? {
        rules: {
          userAgent: "*",
          allow: "/",
          disallow: [
            "/api/",
            "/account",
            "/account/",
            "/en/account",
            "/en/account/",
            "/login",
            "/en/login",
            "/register",
            "/en/register",
            "/reports/share/",
            "/en/reports/share/",
          ],
        },
        sitemap: "https://webdiag.ru/sitemap.xml",
      }
    : {
        rules: {
          userAgent: "*",
          disallow: "/",
        },
      };
}

