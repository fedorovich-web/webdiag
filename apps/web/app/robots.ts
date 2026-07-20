import type { MetadataRoute } from "next";
import { publicReleaseEnabled } from "../src/lib/release";
export default function robots(): MetadataRoute.Robots { return publicReleaseEnabled ? { rules: { userAgent: "*", allow: "/" }, sitemap: "https://webdiag.ru/sitemap.xml" } : { rules: { userAgent: "*", disallow: "/" } }; }
