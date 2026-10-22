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
import { parseAuditUrlInput } from "../home/audit-client";

interface AuditHubPageProps {
  readonly locale: Locale;
}

export function AuditHubPage({ locale }: AuditHubPageProps) {
  const router = useRouter();
  const ru = locale === "ru";
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const homeHref = ru ? "/" : "/en";
  const allToolsHref = toolsPath(locale);

  function handleStartAudit(e: FormEvent) {
    e.preventDefault();
    const parsed = parseAuditUrlInput(url);
    if (!parsed) {
      setError(ru ? "Введите публичный HTTP(S) URL с доменом." : "Enter a public HTTP(S) URL with a domain.");
      return;
    }
    const targetUrl = parsed.href;
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
          lead: "Проверьте HTTP-ответ, метатеги, индексацию, заголовки безопасности и статическую структуру страницы. Измерения скорости Google PageSpeed включаются при ответе провайдера.",
          placeholder: "Введите адрес сайта, например: example.com",
          ctaBtn: "Запустить аудит",
          hint: "Проверка выполняется бесплатно и безопасно в режиме реального времени.",
        },
        stats: [
          { value: "22", label: "Группы проверок", desc: "Статические сигналы и PageSpeed" },
          { value: "1 URL", label: "Проверка страницы", desc: "Без обхода всего сайта" },
          { value: "0 ₽", label: "Бесплатный запуск", desc: "Без обязательной регистрации" },
          { value: "HTML", label: "Источник данных", desc: "Фактический ответ сервера" },
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
            desc: "Измерения Google PageSpeed при доступности провайдера. Отдельно показываем лабораторные данные и полевые данные реальных пользователей; отсутствующие метрики не подменяем оценками.",
            badge: "Ранжирование",
          },
          {
            icon: ShieldCheck,
            title: "Безопасность и HTTP-заголовки",
            desc: "HTTPS финального адреса и заголовки HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy и Permissions-Policy.",
            badge: "Безопасность",
          },
          {
            icon: FileText,
            title: "Метаданные и структура контента",
            desc: "Наличие Title и Description, повторяющиеся метатеги, H1, последовательность уровней H1–H6 и Open Graph в HTML страницы.",
            badge: "On-Page",
          },
          {
            icon: Layers,
            title: "Микроразметка Schema.org",
            desc: "Синтаксис JSON-LD, обнаруженные типы Schema.org и ошибки разбора. Это не полная проверка требований поисковых систем к расширенным результатам.",
            badge: "Сниппеты",
          },
          {
            icon: Smartphone,
            title: "Мобильная адаптивность и UX",
            desc: "Наличие viewport и языка документа, alt изображений и размеры изображений в HTML. Визуальная адаптивность требует отдельной проверки в браузере.",
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
              "Анализ одного введённого URL",
              "22 группы проверок с фактическими данными",
              "Измерения Google PageSpeed при доступности",
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
            a: "Основная проверка анализирует HTML, возвращённый сервером, и не выполняет JavaScript сайта. Google PageSpeed запускает свою лабораторную проверку отдельно при доступности провайдера. Контент, появляющийся только после выполнения JavaScript, может отсутствовать в статическом отчёте.",
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
          lead: "Получите отчёт по выполненным проверкам с данными и рекомендациями для исправления.",
          btn: "Проверить сайт",
        },
      }
    : {
        breadcrumbs: { home: "Home", audit: "SEO Audit" },
        hero: {
          eyebrow: "Comprehensive Technical Audit",
          title: "In-Depth Website SEO Audit with Actionable Remediation Steps",
          lead: "Check HTTP responses, metadata, indexing directives, security headers and static page structure. Google PageSpeed measurements are included when the provider responds.",
          placeholder: "Enter website URL, e.g.: example.com",
          ctaBtn: "Run Audit",
          hint: "Safe, instant real-time diagnostic scan with zero obligation.",
        },
        stats: [
          { value: "22", label: "Check groups", desc: "Static signals and PageSpeed" },
          { value: "1 URL", label: "Page audit", desc: "No whole-site crawl" },
          { value: "$0", label: "Free Express Audit", desc: "No registration required" },
          { value: "HTML", label: "Evidence source", desc: "Actual server response" },
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
            desc: "Google PageSpeed measurements when available. Lab data and real user field data are identified separately; missing metrics remain unavailable.",
            badge: "Ranking",
          },
          {
            icon: ShieldCheck,
            title: "Security & Transport Security",
            desc: "HTTPS on the final URL and HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy and Permissions-Policy headers.",
            badge: "Security",
          },
          {
            icon: FileText,
            title: "Metadata & Content Hierarchy",
            desc: "Title and description presence, duplicate metadata declarations, H1, heading level order and Open Graph in the page HTML.",
            badge: "On-Page",
          },
          {
            icon: Layers,
            title: "Schema.org Structured Data",
            desc: "JSON-LD parsing, detected Schema.org types and syntax errors. This does not certify search engine rich result eligibility.",
            badge: "Snippets",
          },
          {
            icon: Smartphone,
            title: "Mobile Usability & UX",
            desc: "Viewport and document language declarations, image alt attributes and HTML image dimensions. Visual responsiveness requires a separate browser check.",
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
              "Analyze one submitted URL",
              "22 check groups with observed evidence",
              "Google PageSpeed measurements when available",
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
            a: "The main audit analyzes server-returned HTML without executing page JavaScript. Google PageSpeed runs its own lab analysis separately when available. Content that only appears after JavaScript execution may be absent from the static report.",
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
      <nav className="shell breadcrumbs wd-audit-breadcrumbs" aria-label="Breadcrumbs">
        <Link href={homeHref}>{t.breadcrumbs.home}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{t.breadcrumbs.audit}</span>
      </nav>

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
                onChange={(e) => { setUrl(e.target.value); setError(""); }}
                aria-invalid={error ? "true" : undefined}
                aria-describedby="audit-hub-error"
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
          <p id="audit-hub-error" className="tool-error" role="alert">{error}</p>
          <small className="wd-audit-form-hint">{t.hero.hint}</small>

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
                  onChange={(e) => { setUrl(e.target.value); setError(""); }}
                aria-invalid={error ? "true" : undefined}
                aria-describedby="audit-hub-error-final"
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
            <p id="audit-hub-error-final" className="tool-error" role="alert">{error}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
