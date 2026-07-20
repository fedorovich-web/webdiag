import type { Metadata } from "next";
import type { Locale } from "@webdiag/tool-registry";
import type { ToolPageContent } from "../content/types";
import { localizeContent } from "../content/tool-pages";

export const siteUrl = "https://webdiag.ru";

const socialImage = {
  url: `${siteUrl}/og/webdiag.png`,
  width: 1200,
  height: 630,
  alt: "WebDiag technical website audit and SEO report preview",
};

function localeCode(locale: Locale): "ru_RU" | "en_US" {
  return locale === "ru" ? "ru_RU" : "en_US";
}

export function localizedAlternates(ruPath: string, enPath: string): Metadata["alternates"] {
  return {
    canonical: ruPath,
    languages: { ru: ruPath, en: enPath, "x-default": ruPath },
  };
}

export function pageMetadata({
  locale,
  title,
  description,
  canonical,
  ruPath,
  enPath,
}: {
  locale: Locale;
  title: string;
  description: string;
  canonical: string;
  ruPath: string;
  enPath: string;
}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: { ru: ruPath, en: enPath, "x-default": ruPath },
    },
    openGraph: {
      type: "website",
      siteName: "WebDiag",
      title,
      description,
      url: canonical,
      locale: localeCode(locale),
      alternateLocale: locale === "ru" ? ["en_US"] : ["ru_RU"],
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage.url],
    },
  };
}

export function toolMetadata(content: ToolPageContent, locale: Locale): Metadata {
  const ruPath = `/tools/${content.slug}`;
  const enPath = `/en/tools/${content.slug}`;
  return pageMetadata({
    locale,
    title: localizeContent(content.seoTitle, locale),
    description: localizeContent(content.metaDescription, locale),
    canonical: locale === "ru" ? ruPath : enPath,
    ruPath,
    enPath,
  });
}
