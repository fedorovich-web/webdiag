import Link from "next/link";
import {
  Keyboard,
  Braces,
  Code2,
  Gauge,
  Grid3X3,
  Image as ImageIcon,
  SearchCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { publicTools, type Locale } from "@webdiag/tool-registry";
import { LanguageSwitcher } from "./language-switcher";
import { SiteBrand } from "./site-brand";
import { ThemeSwitcher } from "./theme-switcher";
import { ToolsMenuShell } from "./tools-menu-shell";
import { loginPath, toolsPath } from "../lib/routes";

interface SiteHeaderProps {
  locale: Locale;
}

const readyCategories = new Set(publicTools.map((tool) => tool.category));

const toolCategories = [
  { icon: SearchCheck, ru: "SEO и аудит сайта", en: "SEO and site audit", descriptionRu: "Индексация, robots.txt, sitemap, canonical", descriptionEn: "Indexing, robots.txt, sitemap, canonical", category: "seo-audit" },
  { icon: Gauge, ru: "Производительность", en: "Performance", descriptionRu: "Core Web Vitals, вес ресурсов, загрузка", descriptionEn: "Core Web Vitals, resource weight, loading", category: "performance" },
  { icon: ShieldCheck, ru: "Безопасность и сеть", en: "Security and network", descriptionRu: "SSL, заголовки, DNS, CORS", descriptionEn: "SSL, HTTP headers, DNS, and CORS", category: "security-network" },
  { icon: Keyboard, ru: "Доступность", en: "Accessibility", descriptionRu: "Контраст, формы, ARIA, focus", descriptionEn: "Contrast, forms, ARIA, and keyboard", category: "css-design" },
  { icon: Braces, ru: "Разметка и сниппеты", en: "Markup and snippets", descriptionRu: "Schema.org, JSON-LD, FAQ, OG", descriptionEn: "Schema.org, JSON-LD, and Open Graph", category: "development-data" },
  { icon: ImageIcon, ru: "Изображения и медиа", en: "Images and media", descriptionRu: "Размеры, вес, форматы, alt", descriptionEn: "Optimization, dimensions, and formats", category: "media-utilities" },
  { icon: Code2, ru: "Разработка и данные", en: "Development and data", descriptionRu: "JSON, Base64, hash, UUID, URL", descriptionEn: "JSON, Base64, hash, UUID, and URL", category: "development-data" },
  { icon: Sparkles, ru: "Контент и Schema.org", en: "Content and Schema.org", descriptionRu: "Мета-теги, FAQ, читаемость и разметка", descriptionEn: "Metadata, FAQ, readability, and markup", category: "seo-audit" },
] as const;

function NavigationLinks({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  const tools = toolsPath(locale);
  const pages = locale === "ru"
    ? { audit: "/audit", pricing: "/pricing", materials: "/knowledge", account: "/login" }
    : { audit: "/en/audit", pricing: "/en/pricing", materials: "/en/knowledge", account: "/en/login" };
  const text = locale === "ru"
    ? {
        audit: "SEO-аудит",
        tools: "Инструменты",
        pricing: "Тарифы",
        materials: "Материалы",
        account: "Личный кабинет",
        categories: "Категории инструментов",
        all: "Все инструменты",
        unavailable: "недоступно",
      }
    : {
        audit: "SEO audit",
        tools: "Tools",
        pricing: "Pricing",
        materials: "Resources",
        account: "Account",
        categories: "Tool categories",
        all: "All tools",
        unavailable: "unavailable",
      };

  if (compact) {
    return (
      <nav className="mobile-nav wd-mobile-nav" aria-label={locale === "ru" ? "Основная навигация" : "Main navigation"}>
        <Link href={tools}>{text.tools}</Link>
        <Link href={pages.audit}>{text.audit}</Link>
        <Link href={pages.pricing}>{text.pricing}</Link>
        <Link href={pages.materials}>{text.materials}</Link>
        <Link href={pages.account}>{text.account}</Link>
      </nav>
    );
  }

  return (
    <nav className="main-nav wd-main-nav" aria-label={locale === "ru" ? "Основная навигация" : "Main navigation"}>
      <ToolsMenuShell className="wd-tools-menu">
        <summary><Grid3X3 aria-hidden="true" />{text.tools}</summary>
        <div className="wd-tools-dropdown">
          <strong>{text.categories}</strong>
          <div>
            {toolCategories.map(({ icon: Icon, ru, en, descriptionRu, descriptionEn, category }) => {
              const title = locale === "ru" ? ru : en;
              const description = locale === "ru" ? descriptionRu : descriptionEn;
              const available = readyCategories.has(category);
              const content = (
                <>
                  <span><Icon aria-hidden="true" /></span>
                  <span><b>{title}</b><small>{description}</small>{!available && <em>{text.unavailable}</em>}</span>
                </>
              );
              return available
                ? <Link href={`${tools}?category=${category}`} key={`${category}-${ru}`}>{content}</Link>
                : <span className="wd-tools-category is-disabled" aria-disabled="true" key={`${category}-${ru}`}>{content}</span>;
            })}
          </div>
          <footer><Link href={tools}>{text.all}<span aria-hidden="true">→</span></Link></footer>
        </div>
      </ToolsMenuShell>
      <Link href={pages.audit}>{text.audit}</Link>
      <Link href={pages.pricing}>{text.pricing}</Link>
      <Link href={pages.materials}>{text.materials}</Link>
    </nav>
  );
}

export function SiteHeader({ locale }: SiteHeaderProps) {
  const createAccount = locale === "ru" ? "Создать аккаунт" : "Create account";
  const login = locale === "ru" ? "Войти" : "Sign in";
  const menu = locale === "ru" ? "Открыть меню" : "Open menu";
  const registerHref = locale === "ru" ? "/register" : "/en/register";

  return (
    <header className="site-header wd-site-header">
      <div className="shell header-inner wd-header-inner">
        <SiteBrand locale={locale} className="brand wd-brand" variant="header" />

        <NavigationLinks locale={locale} />

        <div className="header-actions wd-header-actions">
          <div id="account-workspace-menu-slot" className="wd-account-menu-slot" />
          <LanguageSwitcher locale={locale} className="language-switcher-desktop" />
          <ThemeSwitcher locale={locale} />
          <Link className="wd-header-login" href={loginPath(locale)}>{login}</Link>
          <Link className="wd-header-cta" href={registerHref}>{createAccount}</Link>
          <details className="mobile-menu">
            <summary aria-label={menu}>
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </summary>
            <div className="mobile-menu-panel">
              <LanguageSwitcher locale={locale} className="language-switcher-mobile" />
              <NavigationLinks locale={locale} compact />
              <Link className="wd-header-cta" href={registerHref}>{createAccount}</Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
