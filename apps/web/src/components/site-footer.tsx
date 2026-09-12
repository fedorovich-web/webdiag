import Link from "next/link";
import type { Locale } from "@webdiag/tool-registry";
import { homeContent } from "../content/home";
import { localizeValue } from "../content/types";
import { SiteBrand } from "./site-brand";
import { toolsPath } from "../lib/routes";

export function SiteFooter({ locale }: { locale: Locale }) {
  const prefix = locale === "ru" ? "" : "/en";
  const t = <T extends { readonly ru: string; readonly en: string }>(value: T) => localizeValue(value, locale);
  const text = locale === "ru"
    ? {
        summary: "WebDiag помогает находить технические и SEO-ошибки, расставлять приоритеты исправлений и контролировать состояние сайта после изменений.",
        product: "Продукт",
        categories: "Категории",
        materials: "Материалы",
        company: "Компания",
        legal: "Правовая информация",
        audit: "SEO-аудит",
        monitoring: "Мониторинг",
        tools: "Инструменты",
        pricing: "Тарифы",
        knowledge: "База знаний",
        blog: "Блог",
        home: "О WebDiag",
        register: "Создать аккаунт",
        login: "Войти",
        privacy: "Политика конфиденциальности",
      }
    : {
        summary: "WebDiag helps you find technical and SEO issues, prioritize fixes and monitor website health after changes.",
        product: "Product",
        categories: "Categories",
        materials: "Resources",
        company: "Company",
        legal: "Legal",
        audit: "SEO audit",
        monitoring: "Monitoring",
        tools: "Tools",
        pricing: "Pricing",
        knowledge: "Knowledge base",
        blog: "Blog",
        home: "About WebDiag",
        register: "Create account",
        login: "Sign in",
        privacy: "Privacy policy",
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
          <Link href={`${prefix}/audit`}>{text.audit}</Link>
          <Link href={`${prefix}/monitoring`}>{text.monitoring}</Link>
          <Link href={toolsPath(locale)}>{text.tools}</Link>
          <Link href={`${prefix}/pricing`}>{text.pricing}</Link>
        </div>

        <div className="footer-column">
          <strong>{text.categories}</strong>
          {homeContent.categories.map((category) => (
            <Link href={`${toolsPath(locale)}?category=${category.id}`} key={category.id}>{t(category.title)}</Link>
          ))}
        </div>

        <div className="footer-column">
          <strong>{text.materials}</strong>
          <Link href={`${prefix}/knowledge`}>{text.knowledge}</Link>
          <Link href={`${prefix}/blog`}>{text.blog}</Link>
        </div>

        <div className="footer-column">
          <strong>{text.company}</strong>
          <Link href={prefix || "/"}>{text.home}</Link>
          <Link href={`${prefix}/register`}>{text.register}</Link>
          <Link href={`${prefix}/login`}>{text.login}</Link>
        </div>

        <div className="footer-column">
          <strong>{text.legal}</strong>
          <Link href={`${prefix}/privacy`}>{text.privacy}</Link>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© 2026 WebDiag</span>
        <span>{locale === "ru" ? "Техническая диагностика и SEO-инструменты" : "Technical diagnostics and SEO tools"}</span>
      </div>
    </footer>
  );
}
