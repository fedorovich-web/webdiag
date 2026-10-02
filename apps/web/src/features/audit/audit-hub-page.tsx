"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SearchCheck,
  ShieldCheck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  ChevronDown,
  Layers,
  Globe2,
  Gauge,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import type { Locale } from "@webdiag/tool-registry";
import { toolsPath } from "../../lib/routes";

interface AuditHubPageProps {
  readonly locale: Locale;
}

export function AuditHubPage({ locale }: AuditHubPageProps) {
  const router = useRouter();
  const ru = locale === "ru";
  const [url, setUrl] = useState("");
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const homeHref = ru ? "/" : "/en";
  const allToolsHref = toolsPath(locale);

  function handleStartAudit(e: FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    const targetUrl = trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;
    const singleAuditPath = ru
      ? `/tools/single-page-audit?url=${encodeURIComponent(targetUrl)}`
      : `/en/tools/single-page-audit?url=${encodeURIComponent(targetUrl)}`;
    router.push(singleAuditPath);
  }

  const t = ru
    ? {
        breadcrumbs: { home: "Главная", audit: "SEO-аудит" },
        hero: {
          eyebrow: "Комплексный технический аудит",
          title: "Глубокий SEO-аудит сайта с пошаговыми рекомендациями",
          lead: "Мгновенно найдите технические ошибки, проблемы индексации, уязвимости безопасности и слабые места Core Web Vitals, мешающие вашему сайту расти в поиске Яндекс и Google.",
          placeholder: "Введите адрес сайта, например: example.com",
          ctaBtn: "Запустить аудит",
          hint: "Проверка выполняется бесплатно и безопасно в режиме реального времени.",
        },
        stats: [
          { value: "65+", label: "Факторов проверки", desc: "Все критичные SEO-сигналы" },
          { value: "< 3 сек", label: "Время экспресс-сканирования", desc: "Быстрый ответ без ожидания" },
          { value: "0 ₽", label: "Бесплатный запуск", desc: "Без обязательной регистрации" },
          { value: "Chromium", label: "Реалистичный рендеринг", desc: "Точно как у поисковых ботов" },
        ],
        dimensionsTitle: "Что проверяет SEO-аудит WebDiag",
        dimensionsLead: "Шесть ключевых направлений всесторонней технической и поисковой диагностики вашего сайта.",
        dimensions: [
          {
            icon: SearchCheck,
            title: "Индексация и доступность для ботов",
            desc: "Корректность robots.txt, карты сайта sitemap.xml, канонических тегов canonical, директив meta noindex, follow и заголовков X-Robots-Tag.",
            badge: "Критично",
          },
          {
            icon: Gauge,
            title: "Скорость и Core Web Vitals",
            desc: "Точный расчет показателей LCP (скорость загрузки основного контента), INP (отзывчивость на клики), CLS (стабильность верстки) и TTFB.",
            badge: "Ранжирование",
          },
          {
            icon: ShieldCheck,
            title: "Безопасность и HTTP-заголовки",
            desc: "Срок действия SSL/TLS сертификатов, протокол TLS 1.3, политика HSTS, заголовки CSP, X-Frame-Options и предотвращение mixed content.",
            badge: "Безопасность",
          },
          {
            icon: FileText,
            title: "Метаданные и структура контента",
            desc: "Оптимальность Title и Description по длине и кликабельности, иерархия заголовков H1-H6, дубликаты текстов и плотность ключевых вхождений.",
            badge: "On-Page",
          },
          {
            icon: Layers,
            title: "Микроразметка Schema.org",
            desc: "Валидация JSON-LD и Microdata структур (Organization, Article, Product, FAQPage, Breadcrumbs) для расширенных сниппетов в выдаче.",
            badge: "Сниппеты",
          },
          {
            icon: Smartphone,
            title: "Мобильная адаптивность и UX",
            desc: "Настройка Viewport, размер шрифтов и элементов управления для тач-экранов, горизонтальная прокрутка и читаемость без зума.",
            badge: "Mobile-First",
          },
        ],
        previewTitle: "Пример отчета аудита WebDiag",
        previewLead: "Понятная приоритизация: от критических проблем, блокирующих трафик, до точечных рекомендаций по улучшению.",
        levelsTitle: "Уровни глубины диагностики",
        levelsLead: "Выберите оптимальный формат под масштаб вашего проекта.",
        levels: [
          {
            name: "Экспресс-аудит страницы",
            subtitle: "Быстрый анализ URL",
            price: "Бесплатно",
            features: [
              "Анализ конкретной страницы за 3 секунды",
              "Проверка 40+ технических параметров",
              "Оценка скорости и Core Web Vitals",
              "Базовый чеклист исправлений",
            ],
            btn: "Запустить бесплатно",
            action: () => window.scrollTo({ top: 0, behavior: "smooth" }),
          },
          {
            name: "Глубокий аудит сайта",
            subtitle: "Краулинг до 500 страниц",
            price: "В тарифе Pro",
            badge: "Популярный",
            features: [
              "Полный обход внутренней структуры сайта",
              "Поиск битых ссылок (404) и цепочек редиректов",
              "Анализ дублей Title, H1 и мета-тегов",
              "Выгрузка отчетов в PDF и CSV",
              "Доступ к AI-плану исправлений",
            ],
            btn: "Подробнее о Pro",
            href: "/pricing",
          },
          {
            name: "Мониторинг и Enterprise",
            subtitle: "Регулярный авто-аудит",
            price: "В тарифе Team",
            features: [
              "Регулярное сканирование по расписанию",
              "Уведомления в Telegram и на Email об ошибках",
              "Сравнение снимков сайта до и после релизов",
              "Приоритетная очередь выполнения задач",
              "Доступ для всей команды разработчиков",
            ],
            btn: "Подробнее о Team",
            href: "/pricing",
          },
        ],
        faqTitle: "Часто задаваемые вопросы по SEO-аудиту",
        faqLead: "Ответы на популярные вопросы о сканировании сайтов, интерпретации результатов и устранении ошибок.",
        faqs: [
          {
            q: "Как часто необходимо проводить технический аудит сайта?",
            a: "Рекомендуется выполнять экспресс-проверку ключевых посадочных страниц после каждого значимого релиза или обновления контента, а полный аудит всего сайта проводить не реже 1-2 раз в месяц. Это позволяет вовремя заметить случайно закрытые от индексации разделы, появление битых ссылок или падение скорости.",
          },
          {
            q: "Влияет ли технический аудит на позиции сайта в поиске?",
            a: "Сам по себе запуск аудита безопасен и не влияет на позиции. Однако исправление найденных ошибок (устранение дублей, ускорение загрузки по Core Web Vitals, корректная настройка canonical и robots.txt) напрямую улучшает ранжирование и краулинговый бюджет в Google и Яндекс.",
          },
          {
            q: "Поддерживает ли WebDiag сайты на JavaScript (React, Next.js, Vue)?",
            a: "Да, наш сканер использует реальный движок Chromium. Это гарантирует, что клиентский JavaScript полностью исполняется точно так же, как его видит современный бот Googlebot, позволяя обнаружить проблемы гидратации, рендеринга и скрытого контента.",
          },
          {
            q: "Что делать после завершения аудита?",
            a: "WebDiag автоматически группирует ошибки по приоритетам: критические (High), предупреждения (Medium) и уведомления (Low). Вы можете сразу передать список разработчикам или воспользоваться нашими AI-инструментами для составления пошагового плана исправлений.",
          },
          {
            q: "Безопасно ли сканирование для сервера сайта?",
            a: "Абсолютно безопасно. Наш краулер соблюдает паузы между запросами, имитирует стандартные заголовки браузера и не перегружает сервер избыточным трафиком.",
          },
        ],
        finalCta: {
          title: "Проверьте здоровье вашего сайта прямо сейчас",
          lead: "Получите детальный отчет с оценкой всех технических сигналов менее чем за минуту.",
          btn: "Проверить сайт",
        },
      }
    : {
        breadcrumbs: { home: "Home", audit: "SEO Audit" },
        hero: {
          eyebrow: "Comprehensive Technical Audit",
          title: "In-Depth Website SEO Audit with Actionable Remediation Steps",
          lead: "Instantly detect technical bottlenecks, indexation hurdles, security gaps, and Core Web Vitals penalties preventing your site from ranking higher in Google and search engines.",
          placeholder: "Enter website URL, e.g.: example.com",
          ctaBtn: "Run Audit",
          hint: "Safe, instant real-time diagnostic scan with zero obligation.",
        },
        stats: [
          { value: "65+", label: "Audit Signals", desc: "All critical SEO checkpoints" },
          { value: "< 3s", label: "Express Scan Time", desc: "Instant feedback without queues" },
          { value: "$0", label: "Free Express Audit", desc: "No registration required" },
          { value: "Chromium", label: "Real Browser Engine", desc: "Exact Googlebot rendering parity" },
        ],
        dimensionsTitle: "What WebDiag SEO Audit Covers",
        dimensionsLead: "Six core pillars of thorough technical and on-page search engine diagnostics.",
        dimensions: [
          {
            icon: SearchCheck,
            title: "Crawlability & Indexation",
            desc: "Robots.txt syntax, XML sitemap validation, canonical tags, meta robots (noindex, follow), and X-Robots-Tag response headers.",
            badge: "Critical",
          },
          {
            icon: Gauge,
            title: "Speed & Core Web Vitals",
            desc: "Precise evaluation of LCP (Largest Contentful Paint), INP (Interaction to Next Paint), CLS (Layout Shift), and TTFB server latency.",
            badge: "Ranking",
          },
          {
            icon: ShieldCheck,
            title: "Security & Transport Security",
            desc: "SSL/TLS certificate expiration, TLS 1.3 protocol, HSTS preloading, CSP headers, X-Frame-Options, and mixed content detection.",
            badge: "Security",
          },
          {
            icon: FileText,
            title: "Metadata & Content Hierarchy",
            desc: "Title and description length, CTR optimization, H1-H6 heading hierarchy, duplicate meta tags, and content density.",
            badge: "On-Page",
          },
          {
            icon: Layers,
            title: "Schema.org Structured Data",
            desc: "Validation of JSON-LD and Microdata schemas (Organization, Article, Product, FAQPage, BreadcrumbList) for rich snippet eligibility.",
            badge: "Snippets",
          },
          {
            icon: Smartphone,
            title: "Mobile Usability & UX",
            desc: "Viewport configuration, touch target sizing, mobile typography readability, responsive layout integrity, and tap accessibility.",
            badge: "Mobile-First",
          },
        ],
        previewTitle: "WebDiag Sample Audit Report",
        previewLead: "Actionable issue categorization: from critical blockers destroying organic visibility to fine-grained improvements.",
        levelsTitle: "Audit Depth Tiers",
        levelsLead: "Pick the depth tier tailored to your website size and workflow.",
        levels: [
          {
            name: "Express Page Audit",
            subtitle: "Single URL instant inspection",
            price: "Free",
            features: [
              "Complete single page analysis in under 3 seconds",
              "Check 40+ technical on-page parameters",
              "Core Web Vitals and speed evaluation",
              "Immediate actionable fix checklist",
            ],
            btn: "Start Free",
            action: () => window.scrollTo({ top: 0, behavior: "smooth" }),
          },
          {
            name: "Deep Site Crawl",
            subtitle: "Crawl up to 500 pages",
            price: "In Pro Plan",
            badge: "Most Popular",
            features: [
              "Comprehensive internal link graph traversal",
              "Detect 404 broken links and redirect chains",
              "Duplicate title, H1, and meta tag finder",
              "Exportable PDF and CSV reports",
              "Full access to AI Fix Action Plan",
            ],
            btn: "Explore Pro Plan",
            href: "/en/pricing",
          },
          {
            name: "Continuous Monitoring",
            subtitle: "Scheduled recurring audits",
            price: "In Team Plan",
            features: [
              "Automated weekly & monthly crawls",
              "Telegram and Email alerts on critical regressions",
              "Pre-release and post-release snapshot diffs",
              "High-priority worker processing queue",
              "Multi-seat team collaboration",
            ],
            btn: "Explore Team Plan",
            href: "/en/pricing",
          },
        ],
        faqTitle: "Frequently Asked Questions About SEO Audits",
        faqLead: "Everything you need to know about website crawling, report interpretation, and issue resolution.",
        faqs: [
          {
            q: "How often should I run an SEO audit on my website?",
            a: "We recommend running an express audit on critical landing pages after every deployment or major content update. For full site-wide crawls, once or twice a month is best practice to catch accidental noindex directives, broken redirects, or performance drops early.",
          },
          {
            q: "Does running an SEO audit affect my live website speed or ranking?",
            a: "No, running an audit is completely safe and read-only. Our crawler adheres to request rate limits and does not degrade production server performance.",
          },
          {
            q: "Does WebDiag support JavaScript-heavy single-page applications (React, Next.js, Vue)?",
            a: "Yes. WebDiag renders pages using headless Chromium. This ensures that client-rendered markup, hydration, and lazy-loaded assets are evaluated exactly as Googlebot interprets them.",
          },
          {
            q: "What should I do after receiving my audit report?",
            a: "WebDiag sorts issues by impact: High (Critical), Medium (Warnings), and Low (Notices). You can forward the checklist directly to your engineering team or use our AI Fix Action Plan to prioritize the quickest wins.",
          },
          {
            q: "Are audit reports shareable with clients or team members?",
            a: "Yes. Pro and Team plans allow generating public read-only report links and downloading branded PDF and CSV summaries.",
          },
        ],
        finalCta: {
          title: "Audit Your Website Health in 3 Seconds",
          lead: "Get an exhaustive diagnostic report with technical recommendations right now.",
          btn: "Start Audit",
        },
      };

  return (
    <div className="wd-audit-hub-page">
      {/* Breadcrumbs (strictly 12px) */}
      <nav className="shell breadcrumbs wd-audit-breadcrumbs" aria-label="Breadcrumbs">
        <Link href={homeHref}>{t.breadcrumbs.home}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{t.breadcrumbs.audit}</span>
      </nav>

      {/* Hero with URL Form */}
      <section className="wd-audit-hero">
        <div className="shell wd-audit-hero-inner">
          <span className="wd-eyebrow">{t.hero.eyebrow}</span>
          <h1 className="wd-audit-h1">{t.hero.title}</h1>
          <p className="wd-audit-hero-lead">{t.hero.lead}</p>

          <form className="wd-audit-url-form" onSubmit={handleStartAudit}>
            <div className="wd-audit-input-wrap">
              <Globe2 size={20} aria-hidden="true" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t.hero.placeholder}
                aria-label={t.hero.placeholder}
                required
              />
            </div>
            <button type="submit" className="wd-audit-submit-btn">
              <SearchCheck size={18} aria-hidden="true" />
              <span>{t.hero.ctaBtn}</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </form>
          <small className="wd-audit-form-hint">{t.hero.hint}</small>

          {/* Stats Bar */}
          <div className="wd-audit-stats-grid">
            {t.stats.map((stat, idx) => (
              <div className="wd-audit-stat-card" key={idx}>
                <span className="wd-audit-stat-val">{stat.value}</span>
                <strong className="wd-audit-stat-label">{stat.label}</strong>
                <small className="wd-audit-stat-desc">{stat.desc}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dimensions Section */}
      <section className="wd-audit-section wd-audit-dimensions">
        <div className="shell">
          <div className="wd-audit-section-header">
            <span className="wd-eyebrow">{ru ? "Направления проверки" : "Audit Scope"}</span>
            <h2>{t.dimensionsTitle}</h2>
            <p className="wd-audit-sub-h2">{t.dimensionsLead}</p>
          </div>

          <div className="wd-audit-dimensions-grid">
            {t.dimensions.map((dim, idx) => {
              const Icon = dim.icon;
              return (
                <div className="wd-audit-dim-card" key={idx}>
                  <div className="wd-audit-dim-head">
                    <div className="wd-audit-dim-icon">
                      <Icon size={24} aria-hidden="true" />
                    </div>
                    <span className="wd-audit-dim-badge">{dim.badge}</span>
                  </div>
                  <h3>{dim.title}</h3>
                  <p>{dim.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Sample Report Preview */}
      <section className="wd-audit-section wd-audit-preview-section">
        <div className="shell">
          <div className="wd-audit-section-header">
            <span className="wd-eyebrow">{ru ? "Интерфейс отчета" : "Report Preview"}</span>
            <h2>{t.previewTitle}</h2>
            <p className="wd-audit-sub-h2">{t.previewLead}</p>
          </div>

          <div className="wd-audit-preview-card">
            <div className="wd-audit-preview-header">
              <div className="wd-audit-preview-url-row">
                <span className="wd-audit-preview-dot is-green" />
                <span className="wd-audit-preview-url">https://example.com/</span>
                <span className="wd-audit-preview-time">2.1s</span>
              </div>
              <div className="wd-audit-preview-score-badge">
                <span className="wd-audit-preview-score-num">88</span>
                <span className="wd-audit-preview-score-max">/ 100</span>
              </div>
            </div>

            <div className="wd-audit-preview-metrics-row">
              <div className="wd-audit-preview-metric">
                <span className="wd-audit-metric-tag is-danger">
                  <XCircle size={14} aria-hidden="true" />
                  {ru ? "2 Критические ошибки" : "2 Critical Errors"}
                </span>
                <p>{ru ? "Отсутствует тег Canonical, медленный LCP (3.8s)" : "Missing canonical tag, slow LCP (3.8s)"}</p>
              </div>
              <div className="wd-audit-preview-metric">
                <span className="wd-audit-metric-tag is-warning">
                  <AlertTriangle size={14} aria-hidden="true" />
                  {ru ? "4 Предупреждения" : "4 Warnings"}
                </span>
                <p>{ru ? "Title длиннее 65 символов, 2 картинки без alt" : "Title exceeds 65 chars, 2 images missing alt"}</p>
              </div>
              <div className="wd-audit-preview-metric">
                <span className="wd-audit-metric-tag is-success">
                  <CheckCircle2 size={14} aria-hidden="true" />
                  {ru ? "42 Проверки пройдено" : "42 Checks Passed"}
                </span>
                <p>{ru ? "HTTPS, robots.txt, sitemap.xml, Schema.org валидны" : "HTTPS, robots.txt, sitemap.xml, Schema valid"}</p>
              </div>
            </div>

            <div className="wd-audit-preview-action-row">
              <div className="wd-audit-preview-ai-callout">
                <Sparkles size={18} aria-hidden="true" />
                <span>{ru ? "AI-план сформировал 3 приоритетных задачи для разработчиков." : "AI Fix Plan generated 3 prioritized tasks for your engineers."}</span>
              </div>
              <Link href={allToolsHref} className="wd-audit-preview-explore-btn">
                <span>{ru ? "Посмотреть все инструменты" : "Explore All Tools"}</span>
                <ExternalLink size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Audit Depth Levels */}
      <section className="wd-audit-section wd-audit-levels">
        <div className="shell">
          <div className="wd-audit-section-header">
            <span className="wd-eyebrow">{ru ? "Форматы аудита" : "Depth Options"}</span>
            <h2>{t.levelsTitle}</h2>
            <p className="wd-audit-sub-h2">{t.levelsLead}</p>
          </div>

          <div className="wd-audit-levels-grid">
            {t.levels.map((lvl, idx) => (
              <div className={`wd-audit-level-card ${lvl.badge ? "is-popular" : ""}`} key={idx}>
                {lvl.badge && <span className="wd-audit-level-badge">{lvl.badge}</span>}
                <h3>{lvl.name}</h3>
                <p className="wd-audit-level-sub">{lvl.subtitle}</p>
                <div className="wd-audit-level-price">{lvl.price}</div>

                <ul className="wd-audit-level-features">
                  {lvl.features.map((feat, fIdx) => (
                    <li key={fIdx}>
                      <CheckCircle2 size={16} aria-hidden="true" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {lvl.href ? (
                  <Link href={lvl.href} className="wd-audit-level-btn">
                    <span>{lvl.btn}</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                ) : (
                  <button type="button" className="wd-audit-level-btn is-primary" onClick={lvl.action}>
                    <span>{lvl.btn}</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="wd-audit-section wd-audit-faq">
        <div className="shell">
          <div className="wd-audit-section-header">
            <span className="wd-eyebrow">{ru ? "Вопросы и ответы" : "FAQ"}</span>
            <h2>{t.faqTitle}</h2>
            <p className="wd-audit-sub-h2">{t.faqLead}</p>
          </div>

          <div className="wd-audit-faq-list">
            {t.faqs.map((item, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div className={`wd-audit-faq-item ${isOpen ? "is-open" : ""}`} key={idx}>
                  <button
                    type="button"
                    className="wd-audit-faq-btn"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                  >
                    <span>{item.q}</span>
                    <ChevronDown size={20} className="wd-audit-faq-arrow" aria-hidden="true" />
                  </button>
                  {isOpen && (
                    <div className="wd-audit-faq-content">
                      <p>{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="wd-audit-section wd-audit-final-cta-section">
        <div className="shell">
          <div className="wd-audit-final-cta-card">
            <h2>{t.finalCta.title}</h2>
            <p className="wd-audit-sub-h2">{t.finalCta.lead}</p>
            <form className="wd-audit-url-form wd-audit-url-form-bottom" onSubmit={handleStartAudit}>
              <div className="wd-audit-input-wrap">
                <Globe2 size={20} aria-hidden="true" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={t.hero.placeholder}
                  aria-label={t.hero.placeholder}
                  required
                />
              </div>
              <button type="submit" className="wd-audit-submit-btn">
                <SearchCheck size={18} aria-hidden="true" />
                <span>{t.finalCta.btn}</span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
