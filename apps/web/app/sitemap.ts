import type { MetadataRoute } from "next";
import { publicTools } from "@webdiag/tool-registry";
import { publicReleaseEnabled } from "../src/lib/release";

const base = "https://webdiag.ru";

function entry(ruPath: string, enPath: string, locale: "ru" | "en", priority: number): MetadataRoute.Sitemap[number] {
  const path = locale === "ru" ? ruPath : enPath;
  return {
    url: `${base}${path}`,
    changeFrequency: "weekly",
    priority,
    alternates: {
      languages: {
        ru: `${base}${ruPath}`,
        en: `${base}${enPath}`,
        "x-default": `${base}${ruPath}`,
      },
    },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  if (!publicReleaseEnabled) return [];
  const pagePairs = [
    ["", "/en", 1, 0.9],
    ["/audit", "/en/audit", 0.9, 0.8],
    ["/monitoring", "/en/monitoring", 0.85, 0.75],
    ["/pricing", "/en/pricing", 0.85, 0.75],
    ["/tools", "/en/tools", 0.9, 0.8],
    ["/blog", "/en/blog", 0.65, 0.55],
    ["/knowledge", "/en/knowledge", 0.7, 0.6],
    ["/privacy", "/en/privacy", 0.35, 0.3],
  ] as const;

  const values: MetadataRoute.Sitemap = pagePairs.flatMap(([ruPath, enPath, ruPriority, enPriority]) => [
    entry(ruPath, enPath, "ru", ruPriority),
    entry(ruPath, enPath, "en", enPriority),
  ]);
  for (const tool of publicTools) {
    const ruPath = `/tools/${tool.slug}`;
    const enPath = `/en/tools/${tool.slug}`;
    values.push(entry(ruPath, enPath, "ru", 0.8), entry(ruPath, enPath, "en", 0.7));
  }
  return values;
}
