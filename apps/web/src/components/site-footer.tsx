import Link from "next/link";
import { getPublicTool, localize, type Locale } from "@webdiag/tool-registry";
import { homeContent } from "../content/home";
import { localizeValue } from "../content/types";
import { SiteBrand } from "./site-brand";
import { toolsPath } from "../lib/routes";

const featured = ["json-formatter-validator", "image-optimizer", "color-contrast-checker", "hash-generator"] as const;

export function SiteFooter({ locale }: { locale: Locale }) {
  const prefix = locale === "ru" ? "" : "/en";
  const pages = locale === "ru" ? { audit: "/audit", monitoring: "/monitoring", pricing: "/pricing", blog: "/blog", knowledge: "/knowledge" } : { audit: "/en/audit", monitoring: "/en/monitoring", pricing: "/en/pricing", blog: "/en/blog", knowledge: "/en/knowledge" };
  const t = <T extends { readonly ru: string; readonly en: string }>(value: T) => localizeValue(value, locale);
  const text = locale === "ru"
    ? {
        summary: "WebDiag развивает сценарий технического SEO-аудита сайта. Сейчас доступны рабочие инструменты и демонстрация будущего отчёта с приоритетами исправлений.",
        navigation: "Навигация",
        checks: "Проверки сайта",
        report: "Отчёт и приоритеты",
        support: "Дополнительные инструменты",
        categories: "Разделы исправлений",
        recommended: "Вспомогательные инструменты",
        privacy: "Политика конфиденциальности",
      }
    : {
        summary: "WebDiag is developing a technical SEO audit flow. Today, the ready surface is the supporting tool catalog and a preview of the future prioritized report.",
        navigation: "Navigation",
        checks: "Site checks",
        report: "Report and priorities",
        support: "Supporting tools",
        categories: "Fix sections",
        recommended: "Supporting tools",
        privacy: "Privacy policy",
      };

  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div className="footer-brand">
          <SiteBrand locale={locale} className="brand" variant="footer" />
          <p>{text.summary}</p>
          <span className="footer-ready">{locale === "ru" ? "аудит сайта" : "site audit"}</span>
        </div>
        <div className="footer-column">
          <strong>{text.navigation}</strong>
          <Link href={pages.audit}>{text.checks}</Link>
          <Link href={pages.pricing}>{locale === "ru" ? "Цены" : "Pricing"}</Link>
          <Link href={toolsPath(locale)}>{text.support}</Link>
        </div>
        <div className="footer-column">
          <strong>{text.categories}</strong>
          {homeContent.categories.map((category) => <Link href={`${toolsPath(locale)}?category=${category.id}`} key={category.id}>{t(category.title)}</Link>)}
        </div>
        <div className="footer-column footer-recommended">
          <strong>{text.recommended}</strong>
          {featured.map((slug) => {
            const tool = getPublicTool(slug);
            return tool ? <Link href={`${prefix}/tools/${slug}`} key={slug}>{localize(tool.title, locale)}</Link> : null;
          })}
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© 2026 WebDiag</span>
        <Link className="footer-privacy-link" href={`${prefix}/privacy`}>{text.privacy}</Link>
      </div>
    </footer>
  );
}
