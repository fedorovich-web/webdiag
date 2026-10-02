"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  Clock,
  CheckCircle2,
  SearchCheck,
} from "lucide-react";
import type { Locale } from "@webdiag/tool-registry";
import { toolsPath } from "../../lib/routes";

interface KnowledgeHubPageProps {
  readonly locale: Locale;
}

export function KnowledgeHubPage({ locale }: KnowledgeHubPageProps) {
  const ru = locale === "ru";
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const homeHref = ru ? "/" : "/en";
  const auditHref = ru ? "/audit" : "/en/audit";
  const allToolsHref = toolsPath(locale);

  const t = ru
    ? {
        breadcrumbs: { home: "Главная", knowledge: "Материалы" },
        hero: {
          eyebrow: "База знаний WebDiag",
          title: "Руководства, стандарты и экспертные материалы по техническому SEO",
          lead: "Практические статьи, пошаговые инструкции по устранению ошибок аудита и техническая документация по оптимизации скорости, безопасности и структуры сайта.",
          searchPlaceholder: "Поиск по базе знаний... например: canonical, LCP, robots.txt",
        },
        categories: [
          { id: "all", name: "Все материалы" },
          { id: "indexing", name: "Индексация и сканирование" },
          { id: "performance", name: "Скорость и Web Vitals" },
          { id: "security", name: "Безопасность и SSL" },
          { id: "markup", name: "Микроразметка Schema.org" },
        ],
        articles: [
          {
            id: "robots-txt-guide",
            category: "indexing",
            categoryName: "Индексация",
            title: "Полное руководство по настройке robots.txt для Яндекс и Google",
            desc: "Разбор директив User-agent, Disallow, Allow, Sitemap и Clean-param. Типичные ошибки, из-за которых сайты теряют трафик или блокируют CSS/JS ресурсы.",
            readTime: "8 мин",
            toolLink: "/tools/robots-txt-tester",
            toolName: "Тестер robots.txt",
          },
          {
            id: "core-web-vitals-guide",
            category: "performance",
            categoryName: "Скорость",
            title: "Оптимизация Core Web Vitals в 2026: как вывести LCP, INP и CLS в зелёную зону",
            desc: "Практические методы ускорения первой отрисовки контента, устранения задержек клика (Interaction to Next Paint) и стабилизации макета от сдвигов.",
            readTime: "11 мин",
            toolLink: "/tools/core-web-vitals-checker",
            toolName: "Проверка Core Web Vitals",
          },
          {
            id: "canonical-guide",
            category: "indexing",
            categoryName: "Индексация",
            title: "Канонические адреса (rel=canonical): как избежать дублей страниц",
            desc: "Правила настройки самоссылающихся и перекрестных каноникалов, решение проблем с параметрами фильтрации, пагинацией и мобильными версиями.",
            readTime: "7 мин",
            toolLink: "/tools/canonical-checker",
            toolName: "Проверка Canonical",
          },
          {
            id: "redirects-architecture",
            category: "indexing",
            categoryName: "Индексация",
            title: "Архитектура редиректов: отличия 301, 302, 307 и 308 для поисковых систем",
            desc: "Как перенаправлять пользователей без потери ссылочного веса, устранять цепочки перенаправлений и циклические редиректы.",
            readTime: "6 мин",
            toolLink: "/tools/redirect-chain-checker",
            toolName: "Проверка цепочек редиректов",
          },
          {
            id: "ssl-security-headers",
            category: "security",
            categoryName: "Безопасность",
            title: "SSL/TLS и заголовки безопасности: HSTS, CSP и защита от атак",
            desc: "Настройка безопасного соединения, защита сайта от подмены контента (Clickjacking, XSS), предотвращение Mixed Content и проверка срока сертификата.",
            readTime: "9 мин",
            toolLink: "/tools/ssl-certificate-checker",
            toolName: "Проверка SSL сертификата",
          },
          {
            id: "schema-org-json-ld",
            category: "markup",
            categoryName: "Микроразметка",
            title: "Микроразметка Schema.org в формате JSON-LD для расширенных сниппетов",
            desc: "Пошаговое внедрение разметки Organization, Product, Article, FAQPage и BreadcrumbList. Валидация кода и получение звезд рейтинга в выдаче.",
            readTime: "10 мин",
            toolLink: "/tools/schema-markup-generator",
            toolName: "Генератор Schema.org",
          },
        ],
        glossaryTitle: "Глоссарий технических терминов",
        glossaryLead: "Краткие и точные определения ключевых понятий технического SEO и веб-диагностики.",
        glossaryTerms: [
          {
            term: "LCP (Largest Contentful Paint)",
            def: "Метрика Core Web Vitals, измеряющая время отрисовки самого крупного видимого контентного элемента на первом экране (обычно заголовок, баннер или картинка). Идеальное значение — менее 2.5 секунд.",
          },
          {
            term: "INP (Interaction to Next Paint)",
            def: "Метрика отзывчивости интерфейса, фиксирующая задержку между действием пользователя (кликом, тапом, нажатием клавиши) и обновлением кадра на экране. Хорошим считается показатель до 200 миллисекунд.",
          },
          {
            term: "CLS (Cumulative Layout Shift)",
            def: "Показатель визуальной стабильности верстки, оценивающий неожиданные сдвиги элементов страницы во время загрузки (например, из-за подгружающейся рекламы или картинок без width/height). Норма — менее 0.1.",
          },
          {
            term: "Краулинговый бюджет (Crawl Budget)",
            def: "Количество страниц вашего сайта, которое поисковые роботы (Googlebot, Yandex bot) готовы просканировать за определенный промежуток времени. Зависит от скорости ответа сервера и авторитетности ресурса.",
          },
          {
            term: "Канонический URL (Canonical)",
            def: "HTML-тег <link rel='canonical' href='...'>, указывающий поисковой системе основную, приоритетную версию страницы среди множества ее дубликатов с параметрами UTM, сортировками или протоколами.",
          },
          {
            term: "HSTS (HTTP Strict Transport Security)",
            def: "Заголовок ответа веб-сервера, предписывающий браузеру всегда открывать сайт исключительно по защищенному протоколу HTTPS, блокируя любые попытки небезопасного соединения.",
          },
        ],
        checklistTitle: "Чеклист проверки перед релизом",
        checklistLead: "Проверьте ключевые параметры сайта перед открытием для индексации.",
        checkpoints: [
          "Файл robots.txt не блокирует важные страницы и статические ресурсы (CSS, JS, WebP)",
          "Все страницы отдают корректный HTTP-статус 200 OK без циклических 301 редиректов",
          "Теги Title и Meta Description заполнены уникально и соответствуют контенту",
          "SSL-сертификат валиден, настроен редирект с HTTP на HTTPS и включен HSTS",
          "Изображения оптимизированы, указаны размеры width/height и атрибуты alt",
          "Метрики Core Web Vitals проверены на реальных мобильных устройствах",
        ],
        ctaTitle: "Проверьте ваш сайт на практике",
        ctaLead: "Примените полученные знания и запустите полный технический аудит сайта за пару секунд.",
        ctaBtn: "Запустить SEO-аудит",
        catalogBtn: "Все 125+ инструментов",
      }
    : {
        breadcrumbs: { home: "Home", knowledge: "Knowledge Base" },
        hero: {
          eyebrow: "WebDiag Knowledge Base",
          title: "Technical SEO Guides, Web Standards, and Remediation Walkthroughs",
          lead: "Actionable articles, diagnostic walkthroughs, and technical documentation on site performance, security headers, structured data, and search engine crawlability.",
          searchPlaceholder: "Search knowledge base... e.g.: canonical, LCP, robots.txt",
        },
        categories: [
          { id: "all", name: "All resources" },
          { id: "indexing", name: "Crawlability & Indexation" },
          { id: "performance", name: "Speed & Web Vitals" },
          { id: "security", name: "Security & Transport" },
          { id: "markup", name: "Schema.org Markup" },
        ],
        articles: [
          {
            id: "robots-txt-guide",
            category: "indexing",
            categoryName: "Indexation",
            title: "Complete Guide to Configuring robots.txt for Search Engines",
            desc: "Deep dive into User-agent, Disallow, Allow, Sitemap, and Crawl-delay directives. Common traps where websites inadvertently block CSS and JS assets.",
            readTime: "8 min",
            toolLink: "/en/tools/robots-txt-tester",
            toolName: "robots.txt Tester",
          },
          {
            id: "core-web-vitals-guide",
            category: "performance",
            categoryName: "Performance",
            title: "Core Web Vitals Optimization in 2026: Green LCP, INP, and CLS",
            desc: "Actionable techniques to minimize main-thread execution, slash Largest Contentful Paint delays, improve Interaction to Next Paint, and eliminate layout shifts.",
            readTime: "11 min",
            toolLink: "/en/tools/core-web-vitals-checker",
            toolName: "Core Web Vitals Checker",
          },
          {
            id: "canonical-guide",
            category: "indexing",
            categoryName: "Indexation",
            title: "Canonical URLs (rel=canonical): Solving Duplicate Content at Scale",
            desc: "Best practices for self-referential and cross-domain canonicals, URL parameters, facet navigation, pagination, and mobile redirects.",
            readTime: "7 min",
            toolLink: "/en/tools/canonical-checker",
            toolName: "Canonical Tag Checker",
          },
          {
            id: "redirects-architecture",
            category: "indexing",
            categoryName: "Indexation",
            title: "Redirect Architecture: Comparing 301, 302, 307, and 308 Responses",
            desc: "How to preserve link equity, prevent infinite redirect loops, and dismantle legacy redirect chains that waste Googlebot crawl budget.",
            readTime: "6 min",
            toolLink: "/en/tools/redirect-chain-checker",
            toolName: "Redirect Chain Checker",
          },
          {
            id: "ssl-security-headers",
            category: "security",
            categoryName: "Security",
            title: "SSL/TLS & HTTP Security Headers: HSTS, CSP, and Protocol Hardening",
            desc: "Hardening server responses against Clickjacking and XSS, eliminating mixed content warnings, and maintaining valid certificate chains.",
            readTime: "9 min",
            toolLink: "/en/tools/ssl-certificate-checker",
            toolName: "SSL Certificate Checker",
          },
          {
            id: "schema-org-json-ld",
            category: "markup",
            categoryName: "Structured Data",
            title: "Schema.org JSON-LD Structured Data for Search Snippet Rich Results",
            desc: "Step-by-step implementation of Organization, Product, Article, FAQPage, and BreadcrumbList schemas. Syntax validation without errors.",
            readTime: "10 min",
            toolLink: "/en/tools/schema-markup-generator",
            toolName: "Schema.org Generator",
          },
        ],
        glossaryTitle: "Technical Glossary",
        glossaryLead: "Crisp, authoritative definitions of foundational technical SEO and diagnostic concepts.",
        glossaryTerms: [
          {
            term: "LCP (Largest Contentful Paint)",
            def: "A Core Web Vitals metric reporting the render time of the largest visible image or text block within the viewport. Recommended threshold is under 2.5 seconds.",
          },
          {
            term: "INP (Interaction to Next Paint)",
            def: "A responsiveness metric observing all user interactions (clicks, taps, keypresses) on a page and logging the worst-case interaction latency. Ideal is under 200ms.",
          },
          {
            term: "CLS (Cumulative Layout Shift)",
            def: "Measures visual layout stability by quantifying unexpected element shifts during rendering. Target threshold is below 0.1.",
          },
          {
            term: "Crawl Budget",
            def: "The number of pages search engine crawlers can and want to inspect on your website within a specific time window, governed by server response speed and site authority.",
          },
          {
            term: "Canonical URL",
            def: "An HTML tag <link rel='canonical' href='...'> signaling the master copy of a page to search engines, preventing duplicate content dilution.",
          },
          {
            term: "HSTS (Strict-Transport-Security)",
            def: "An HTTP response header informing browsers to interact with the host solely over encrypted HTTPS connections.",
          },
        ],
        checklistTitle: "Pre-Launch SEO Checklist",
        checklistLead: "Verify essential technical signals before pushing website updates to production.",
        checkpoints: [
          "robots.txt permits crawling of key routes and static assets (CSS, JS, WebP)",
          "All live URLs return clean 200 OK statuses without multi-hop redirect chains",
          "Title and meta description tags are unique, relevant, and within length limits",
          "SSL certificate is active, HTTP permanently redirects to HTTPS, and HSTS is set",
          "All images specify explicit width/height dimensions and descriptive alt attributes",
          "Core Web Vitals scores pass on real mobile browser devices",
        ],
        ctaTitle: "Put These Principles into Practice",
        ctaLead: "Run a comprehensive technical SEO inspection of your website in just a few seconds.",
        ctaBtn: "Run SEO Audit",
        catalogBtn: "Browse 125+ Tools",
      };

  const filteredArticles = t.articles.filter((art) => {
    const matchesCategory = selectedCategory === "all" || art.category === selectedCategory;
    const matchesQuery = !searchQuery.trim()
      || art.title.toLowerCase().includes(searchQuery.toLowerCase())
      || art.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="wd-knowledge-page">
      {/* Breadcrumbs (strictly 12px) */}
      <nav className="shell breadcrumbs wd-knowledge-breadcrumbs" aria-label="Breadcrumbs">
        <Link href={homeHref}>{t.breadcrumbs.home}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{t.breadcrumbs.knowledge}</span>
      </nav>

      {/* Hero */}
      <section className="wd-knowledge-hero">
        <div className="shell wd-knowledge-hero-inner">
          <span className="wd-eyebrow">{t.hero.eyebrow}</span>
          <h1 className="wd-knowledge-h1">{t.hero.title}</h1>
          <p className="wd-knowledge-hero-lead">{t.hero.lead}</p>

          {/* Search bar */}
          <div className="wd-knowledge-search-wrap">
            <Search size={20} aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.hero.searchPlaceholder}
              aria-label={t.hero.searchPlaceholder}
            />
          </div>
        </div>
      </section>

      {/* Categories & Articles Section */}
      <section className="wd-knowledge-section wd-knowledge-articles-section">
        <div className="shell">
          {/* Category Tabs */}
          <div className="wd-knowledge-tabs">
            {t.categories.map((cat) => (
              <button
                type="button"
                className={`wd-knowledge-tab-btn ${selectedCategory === cat.id ? "is-active" : ""}`}
                onClick={() => setSelectedCategory(cat.id)}
                key={cat.id}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Articles Grid */}
          <div className="wd-knowledge-articles-grid">
            {filteredArticles.map((art) => (
              <article className="wd-article-card" key={art.id}>
                <div className="wd-article-card-head">
                  <span className="wd-article-badge">{art.categoryName}</span>
                  <span className="wd-article-time">
                    <Clock size={14} aria-hidden="true" />
                    {art.readTime}
                  </span>
                </div>
                <h3>{art.title}</h3>
                <p>{art.desc}</p>
                <div className="wd-article-card-footer">
                  <Link href={art.toolLink} className="wd-article-tool-link">
                    <span>{art.toolName}</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Glossary Section */}
      <section className="wd-knowledge-section wd-glossary-section">
        <div className="shell">
          <div className="wd-knowledge-section-header">
            <span className="wd-eyebrow">{ru ? "Терминология" : "Terminology"}</span>
            <h2>{t.glossaryTitle}</h2>
            <p className="wd-knowledge-sub-h2">{t.glossaryLead}</p>
          </div>

          <div className="wd-glossary-grid">
            {t.glossaryTerms.map((item, idx) => (
              <div className="wd-glossary-card" key={idx}>
                <h3>{item.term}</h3>
                <p>{item.def}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pre-launch Checklist Section */}
      <section className="wd-knowledge-section wd-checklist-section">
        <div className="shell">
          <div className="wd-checklist-card">
            <div className="wd-checklist-header">
              <span className="wd-eyebrow">{ru ? "Чеклист" : "Checklist"}</span>
              <h2>{t.checklistTitle}</h2>
              <p className="wd-knowledge-sub-h2">{t.checklistLead}</p>
            </div>

            <ul className="wd-checklist-items">
              {t.checkpoints.map((cp, idx) => (
                <li key={idx}>
                  <CheckCircle2 size={20} aria-hidden="true" />
                  <span>{cp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Final Action CTA */}
      <section className="wd-knowledge-section wd-knowledge-cta-section">
        <div className="shell">
          <div className="wd-knowledge-cta-card">
            <h2>{t.ctaTitle}</h2>
            <p className="wd-knowledge-sub-h2">{t.ctaLead}</p>
            <div className="wd-knowledge-cta-buttons">
              <Link href={auditHref} className="wd-button-primary">
                <SearchCheck size={18} aria-hidden="true" />
                <span>{t.ctaBtn}</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href={allToolsHref} className="wd-button-secondary">
                <span>{t.catalogBtn}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
