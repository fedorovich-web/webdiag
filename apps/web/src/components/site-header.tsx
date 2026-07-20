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
import { toolsPath } from "../lib/routes";

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
  { icon: Sparkles, ru: "AI / GEO / контент", en: "AI / GEO / content", descriptionRu: "Мета-теги, FAQ, структура текста", descriptionEn: "Metadata, FAQ, and content structure", category: "ai-geo-content" },
] as const;

function NavigationLinks({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  const tools = toolsPath(locale);
  const pages = locale === "ru"
    ? { audit: "/audit", monitoring: "/monitoring", pricing: "/pricing", blog: "/blog", knowledge: "/knowledge" }
    : { audit: "/en/audit", monitoring: "/en/monitoring", pricing: "/en/pricing", blog: "/en/blog", knowledge: "/en/knowledge" };
  const text = locale === "ru"
    ? {
        audit: "Аудит сайта",
        tools: "Инструменты",
        monitoring: "Мониторинг",
        pricing: "Цены",
        blog: "Блог",
        knowledge: "База знаний",
        categories: "Категории инструментов",
        all: "Все инструменты",
        planned: "планируется",
        blogPlanned: "Блог — планируется",
        knowledgePlanned: "База знаний — планируется",
      }
    : {
        audit: "Site audit",
        tools: "Tools",
        monitoring: "Monitoring",
        pricing: "Pricing",
        blog: "Blog",
        knowledge: "Knowledge base",
        categories: "Tool categories",
        all: "All tools",
        planned: "planned",
        blogPlanned: "Blog — planned",
        knowledgePlanned: "Knowledge base — planned",
      };

  if (compact) {
    return (
      <nav className="mobile-nav wd-mobile-nav" aria-label={locale === "ru" ? "Основная навигация" : "Main navigation"}>
        <Link href={pages.audit}>{text.audit}</Link>
        <Link href={tools}>{text.tools}</Link>
        <Link href={pages.monitoring}>{text.monitoring}</Link>
        <Link href={pages.pricing}>{text.pricing}</Link>
        <Link href={pages.blog}>{text.blog}</Link>
        <Link href={pages.knowledge}>{text.knowledge}</Link>
      </nav>
    );
  }

  return (
    <nav className="main-nav wd-main-nav" aria-label={locale === "ru" ? "Основная навигация" : "Main navigation"}>
      <Link href={pages.audit}>{text.audit}</Link>
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
                  <span><b>{title}</b><small>{description}</small>{!available && <em>{text.planned}</em>}</span>
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
      <Link href={pages.monitoring}>{text.monitoring}</Link>
      <Link href={pages.pricing}>{text.pricing}</Link>
      <Link href={pages.blog}>{text.blog}</Link>
      <Link href={pages.knowledge}>{text.knowledge}</Link>
    </nav>
  );
}

export function SiteHeader({ locale }: SiteHeaderProps) {
  const openAudit = locale === "ru" ? "Попробовать бесплатно" : "Try for free";
  const login = locale === "ru" ? "Войти" : "Sign in";
  const menu = locale === "ru" ? "Открыть меню" : "Open menu";

  return (
    <header className="site-header wd-site-header">
      <div className="shell header-inner wd-header-inner">
        <SiteBrand locale={locale} className="brand wd-brand" variant="header" />

        <NavigationLinks locale={locale} />

        <div className="header-actions wd-header-actions">
          <LanguageSwitcher locale={locale} className="language-switcher-desktop" />
          <ThemeSwitcher locale={locale} />
          <span className="wd-header-login is-disabled" aria-disabled="true" title={locale === "ru" ? "Авторизация появится позже" : "Sign-in is planned"}>{login}</span>
          <Link className="wd-header-cta" href={locale === "ru" ? "/audit" : "/en/audit"}>{openAudit}</Link>
          <details className="mobile-menu">
            <summary aria-label={menu}>
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </summary>
            <div className="mobile-menu-panel">
              <LanguageSwitcher locale={locale} className="language-switcher-mobile" />
              <NavigationLinks locale={locale} compact />
              <Link className="wd-header-cta" href={locale === "ru" ? "/audit" : "/en/audit"}>{openAudit}</Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
