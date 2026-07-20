import { getCategoryTitle, getPublicTool, localize, publicTools, type Locale } from "@webdiag/tool-registry";
import { getToolPageContent, localizeContent } from "../content/tool-pages";
import { siteUrl } from "./seo";

export function websiteJsonLd(locale: Locale) {
  const path = locale === "ru" ? "" : "/en";
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}${path}#website`,
    url: `${siteUrl}${path}`,
    name: "WebDiag",
    inLanguage: locale,
    description: locale === "ru"
      ? "Технический SEO-аудит сайта: индексация, мета-теги, редиректы, скорость, безопасность, accessibility и AI-visibility."
      : "Technical website SEO audit: indexability, meta tags, redirects, speed, security, accessibility, and AI visibility.",
  };
}

export function toolItemListJsonLd(locale: Locale) {
  const prefix = locale === "ru" ? "" : "/en";
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: locale === "ru" ? "Дополнительные инструменты WebDiag для исправлений" : "WebDiag supporting tools for fixes",
    numberOfItems: publicTools.length,
    itemListElement: publicTools.map((tool, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteUrl}${prefix}/tools/${tool.slug}`,
      name: localize(tool.title, locale),
    })),
  };
}

export function toolBreadcrumbJsonLd(slug: string, locale: Locale) {
  const tool = getPublicTool(slug);
  const content = getToolPageContent(slug);
  if (!tool || !content) return null;
  const prefix = locale === "ru" ? "" : "/en";
  const homeName = locale === "ru" ? "Главная" : "Home";
  const toolsName = locale === "ru" ? "Инструменты" : "Tools";
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: homeName, item: `${siteUrl}${prefix || "/"}` },
      { "@type": "ListItem", position: 2, name: toolsName, item: `${siteUrl}${prefix}/tools` },
      {
        "@type": "ListItem",
        position: 3,
        name: localizeContent(content.h1, locale),
        item: `${siteUrl}${prefix}/tools/${slug}`,
      },
    ],
    about: {
      "@type": "Thing",
      name: getCategoryTitle(tool.category, locale),
    },
  };
}
