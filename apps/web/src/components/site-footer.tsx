import Link from "next/link";
import type { Locale } from "@webdiag/tool-registry";
import { SiteBrand } from "./site-brand";
import { toolsPath } from "../lib/routes";

const SUPPORT_EMAIL = "support@webdiag.ru";

export function SiteFooter({ locale }: { locale: Locale }) {
  const prefix = locale === "ru" ? "" : "/en";
  const text = locale === "ru"
    ? {
        summary: "Инструменты для диагностики и SEO-аудита сайтов.",
        product: "Продукт",
        materials: "Материалы",
        company: "Компания",
        network: "Мы в сети",
        audit: "SEO-аудит",
        monitoring: "Мониторинг",
        tools: "Все инструменты",
        pricing: "Тарифы",
        knowledge: "Руководства",
        home: "О проекте",
        privacy: "Политика конфиденциальности",
        contacts: "Контакты",
        copyright: "© 2026 WebDiag. Все права защищены.",
      }
    : {
        summary: "Tools for website diagnostics and technical SEO audits.",
        product: "Product",
        materials: "Resources",
        company: "Company",
        network: "Contact",
        audit: "SEO audit",
        monitoring: "Monitoring",
        tools: "All tools",
        pricing: "Pricing",
        knowledge: "Guides",
        home: "About WebDiag",
        privacy: "Privacy policy",
        contacts: "Contact",
        copyright: "© 2026 WebDiag. All rights reserved.",
      };

  return (
    <footer className="site-footer">
      <div className="shell footer-grid wd-footer-grid">
        <div className="footer-brand wd-footer-brand">
          <SiteBrand locale={locale} className="brand" variant="footer" />
          <p>{text.summary}</p>
        </div>

        <div className="footer-column">
          <strong>{text.product}</strong>
          <Link prefetch={false} href={toolsPath(locale)}>{text.tools}</Link>
          <Link prefetch={false} href={`${prefix}/audit`}>{text.audit}</Link>
          <Link prefetch={false} href={`${prefix}/pricing`}>{text.pricing}</Link>
          <Link prefetch={false} href={`${prefix}/monitoring`}>{text.monitoring}</Link>
        </div>

        <div className="footer-column">
          <strong>{text.materials}</strong>
          <Link prefetch={false} href={`${prefix}/knowledge`}>{text.knowledge}</Link>
        </div>

        <div className="footer-column">
          <strong>{text.company}</strong>
          <Link prefetch={false} href={prefix || "/"}>{text.home}</Link>
          <Link prefetch={false} href={`${prefix}/contacts`}>{text.contacts}</Link>
        </div>

        <div className="footer-column">
          <strong>{text.network}</strong>
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>{text.copyright}</span>
        <Link className="footer-privacy-link" prefetch={false} href={`${prefix}/privacy`}>{text.privacy}</Link>
      </div>
    </footer>
  );
}
