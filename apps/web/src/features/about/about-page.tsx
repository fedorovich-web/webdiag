import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Layers,
  Cpu,
  ArrowRight,
  SearchCheck,
  CheckCircle2,
  Mail,
  Users,
  Code2,
} from "lucide-react";
import type { Locale } from "@webdiag/tool-registry";
import { toolsPath } from "../../lib/routes";

export function AboutPage({ locale }: { locale: Locale }) {
  const ru = locale === "ru";
  const homeHref = ru ? "/" : "/en";
  const auditHref = ru ? "/audit" : "/en/audit";
  const contactHref = ru ? "/contacts" : "/en/contacts";
  const allToolsHref = toolsPath(locale);

  const t = ru
    ? {
        breadcrumbs: { home: "Главная", about: "О проекте" },
        eyebrow: "О платформе WebDiag",
        title: "Современная платформа для комплексной диагностики и SEO-аудита сайтов",
        lead: "WebDiag объединяет более 125 инструментов анализа, глубокий технический аудит и интеллектуальные AI-сценарии в единую экосистему для веб-мастеров, SEO-специалистов и разработчиков.",
        stats: [
          { number: "125+", label: "Инструментов анализа", sub: "От HTTP-заголовков до Core Web Vitals" },
          { number: "10", label: "AI-сценариев", sub: "Готовые планы, брифы и перелинковка" },
          { number: "100%", label: "Прозрачность данных", sub: "Без скрытых оценок и искажений" },
          { number: "< 2.5 с", label: "Скорость проверки", sub: "Мгновенные результаты в реальном времени" },
        ],
        missionTitle: "Наша миссия",
        missionLead: "Сделать профессиональную веб-аналитику и SEO-диагностику доступной, быстрой и понятной каждому владельцу сайта.",
        missionP1:
          "Большинство существующих сервисов либо перегружены сложными непрозрачными метриками, либо требуют дорогостоящих подписок даже для базовой проверки robots.txt или SSL-сертификата. Мы создали WebDiag как единое окно для проверки любых аспектов сайта.",
        missionP2:
          "Мы верим, что качественный сайт — это фундамент успешного бизнеса. Поэтому базовые диагностические утилиты всегда доступны бесплатно, а сложные проверки сопровождаются конкретными практическими рекомендациями по устранению ошибок.",
        pillarsTitle: "Почему выбирают WebDiag",
        pillarsLead: "Четыре фундаментальных принципа, на которых построена наша платформа.",
        pillars: [
          {
            icon: Zap,
            title: "Высокая скорость и глубина",
            text: "Мгновенный анализ HTTP-ответов, заголовков безопасности, цепочек редиректов и полный рендеринг страниц на базе современного Chromium.",
          },
          {
            icon: Sparkles,
            title: "Практичные AI-помощники",
            text: "Наши AI-инструменты не выдумывают абстрактные советы, а работают строго с подтвержденными ошибками вашего аудита, формируя пошаговые планы действий.",
          },
          {
            icon: ShieldCheck,
            title: "Безопасность и конфиденциальность",
            text: "Мы не собираем лишних персональных данных и изолируем результаты проверок. Доступ к вашим отчетам и проектам есть только у вас.",
          },
          {
            icon: Layers,
            title: "Единая экосистема инструментов",
            text: "Вам больше не нужно открывать 10 разных сайтов для валидации Schema.org, проверки Core Web Vitals, теста DNS и генерации мета-тегов — все собрано здесь.",
          },
        ],
        techTitle: "Технологический стек",
        techLead: "Создано на базе передовых стандартов веб-разработки.",
        techCards: [
          {
            icon: Code2,
            title: "Современный Frontend",
            desc: "Next.js 16, React 19 и чистый типизированный TypeScript для молниеносной отзывчивости интерфейса.",
          },
          {
            icon: Cpu,
            title: "Высокопроизводительный Backend",
            desc: "Асинхронный FastAPI (Python 3.14) с очередями задач для параллельной обработки тяжелых сканирований.",
          },
          {
            icon: Layers,
            title: "Реалистичный рендеринг",
            desc: "Headless Chromium для точной оценки того, как ваш сайт видит поисковый бот Googlebot и Яндекс.",
          },
          {
            icon: Users,
            title: "Надежная инфраструктура",
            desc: "Контейнеризация и мониторинг доступности 24/7 с гарантией бесперебойной работы.",
          },
        ],
        ctaTitle: "Готовы проверить ваш сайт прямо сейчас?",
        ctaLead: "Запустите бесплатный экспресс-аудит главной страницы или выберите нужный инструмент из каталога.",
        ctaAuditBtn: "Запустить SEO-аудит",
        ctaToolsBtn: "Каталог инструментов",
        supportTitle: "Есть вопросы или предложения?",
        supportText: "Наша команда всегда открыта к диалогу. Пишите нам на официальную почту или воспользуйтесь формой обратной связи.",
        contactBtn: "Контакты и поддержка",
      }
    : {
        breadcrumbs: { home: "Home", about: "About" },
        eyebrow: "About WebDiag Platform",
        title: "Modern Platform for Comprehensive Website Diagnostics and SEO Auditing",
        lead: "WebDiag brings together over 125 analytical tools, in-depth technical audits, and intelligent AI scenarios into a single ecosystem for webmasters, SEO professionals, and developers.",
        stats: [
          { number: "125+", label: "Diagnostic tools", sub: "From HTTP headers to Core Web Vitals" },
          { number: "10", label: "AI workflows", sub: "Fix plans, briefs, and internal linking" },
          { number: "100%", label: "Data transparency", sub: "No opaque formulas or fabricated metrics" },
          { number: "< 2.5s", label: "Check speed", sub: "Real-time, instantaneous diagnostics" },
        ],
        missionTitle: "Our Mission",
        missionLead: "Making professional web diagnostics and technical SEO accessible, fast, and actionable for every website owner.",
        missionP1:
          "Most legacy SEO suites are weighed down with complex interfaces, opaque grading systems, or expensive paywalls for basic tests like robots.txt or SSL headers. We built WebDiag as a clean, single pane of glass for all technical diagnostics.",
        missionP2:
          "We believe a fast, secure website is the foundation of any digital business. That is why core utilities are always freely accessible, and complex multi-page audits come with actionable, step-by-step remediation advice.",
        pillarsTitle: "Why Choose WebDiag",
        pillarsLead: "Four foundational principles guiding everything we build.",
        pillars: [
          {
            icon: Zap,
            title: "Lightning speed & depth",
            text: "Instant evaluation of HTTP headers, security policies, canonical tags, and full JavaScript client-side rendering via modern Chromium.",
          },
          {
            icon: Sparkles,
            title: "Action-oriented AI tools",
            text: "Our AI assistants do not invent hallucinated recommendations; they work strictly from confirmed audit evidence to structure practical fix plans.",
          },
          {
            icon: ShieldCheck,
            title: "Privacy & security first",
            text: "We collect only what is strictly required to run your checks, never sell user data, and ensure project isolation across all workspaces.",
          },
          {
            icon: Layers,
            title: "All-in-one ecosystem",
            text: "No more switching between a dozen separate websites to validate JSON-LD, test DNS records, verify Core Web Vitals, and generate metadata.",
          },
        ],
        techTitle: "Technology Stack",
        techLead: "Engineered on modern web standards and reliable infrastructure.",
        techCards: [
          {
            icon: Code2,
            title: "Modern Frontend",
            desc: "Next.js 16, React 19, and strictly typed TypeScript for instant navigation and responsive interfaces.",
          },
          {
            icon: Cpu,
            title: "High-Performance Backend",
            desc: "Asynchronous Python 3.14 and FastAPI with worker queues for parallel execution of heavy website crawls.",
          },
          {
            icon: Layers,
            title: "Real Browser Rendering",
            desc: "Headless Chromium accurately mimics Googlebot and modern browser rendering engines.",
          },
          {
            icon: Users,
            title: "Robust Infrastructure",
            desc: "Containerized deployments and continuous uptime monitoring for uninterrupted reliability.",
          },
        ],
        ctaTitle: "Ready to inspect your website today?",
        ctaLead: "Run a free single-page SEO audit or choose an exact utility from our comprehensive tools catalog.",
        ctaAuditBtn: "Run SEO Audit",
        ctaToolsBtn: "Browse Tools Catalog",
        supportTitle: "Have questions or ideas?",
        supportText: "Our team welcomes your feedback. Get in touch via our support email or send us a message through the contact form.",
        contactBtn: "Contacts & Support",
      };

  return (
    <div className="wd-about-page">
      {/* Breadcrumbs (strictly 12px) */}
      <nav className="shell breadcrumbs wd-about-breadcrumbs" aria-label="Breadcrumbs">
        <Link href={homeHref}>{t.breadcrumbs.home}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{t.breadcrumbs.about}</span>
      </nav>

      {/* Hero */}
      <section className="wd-about-hero">
        <div className="shell wd-about-hero-inner">
          <span className="wd-eyebrow">{t.eyebrow}</span>
          <h1 className="wd-about-title">{t.title}</h1>
          <p className="wd-about-lead">{t.lead}</p>

          <div className="wd-about-stats-grid">
            {t.stats.map((item, idx) => (
              <div className="wd-about-stat-card" key={idx}>
                <span className="wd-about-stat-number">{item.number}</span>
                <strong className="wd-about-stat-label">{item.label}</strong>
                <small className="wd-about-stat-sub">{item.sub}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="wd-about-section wd-about-mission">
        <div className="shell wd-about-mission-grid">
          <div className="wd-about-mission-copy">
            <span className="wd-eyebrow">{ru ? "Ценности" : "Core Values"}</span>
            <h2>{t.missionTitle}</h2>
            <p className="wd-about-sub-h2">{t.missionLead}</p>
            <p className="wd-about-body-text">{t.missionP1}</p>
            <p className="wd-about-body-text">{t.missionP2}</p>
          </div>
          <div className="wd-about-mission-card">
            <div className="wd-about-mission-icon">
              <SearchCheck size={36} aria-hidden="true" />
            </div>
            <h3>{ru ? "Стандарты WebDiag" : "WebDiag Standards"}</h3>
            <ul className="wd-about-standards-list">
              <li>
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>{ru ? "Строгое соответствие рекомендациям Google Search Central и Яндекс.Вебмастер" : "Strict adherence to Google Search Central and Yandex Webmaster guidelines"}</span>
              </li>
              <li>
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>{ru ? "Реалистичные метрики Core Web Vitals (LCP, INP, CLS) без симуляций" : "Realistic Core Web Vitals (LCP, INP, CLS) based on actual page loads"}</span>
              </li>
              <li>
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>{ru ? "Соблюдение стандартов W3C, RFC и спецификаций Schema.org" : "Compliance with W3C, RFC, and Schema.org structured data specs"}</span>
              </li>
              <li>
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>{ru ? "Без спама, навязчивой рекламы и скрытых платежей" : "No spam, intrusive ad overlays, or hidden paywalls"}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="wd-about-section wd-about-pillars">
        <div className="shell">
          <div className="wd-about-section-header">
            <span className="wd-eyebrow">{ru ? "Преимущества" : "Key Benefits"}</span>
            <h2>{t.pillarsTitle}</h2>
            <p className="wd-about-sub-h2">{t.pillarsLead}</p>
          </div>

          <div className="wd-about-pillars-grid">
            {t.pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div className="wd-about-pillar-card" key={idx}>
                  <div className="wd-about-pillar-icon">
                    <Icon size={24} aria-hidden="true" />
                  </div>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="wd-about-section wd-about-tech">
        <div className="shell">
          <div className="wd-about-section-header">
            <span className="wd-eyebrow">{ru ? "Архитектура" : "Engineering"}</span>
            <h2>{t.techTitle}</h2>
            <p className="wd-about-sub-h2">{t.techLead}</p>
          </div>

          <div className="wd-about-tech-grid">
            {t.techCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div className="wd-about-tech-card" key={idx}>
                  <div className="wd-about-tech-icon">
                    <Icon size={22} aria-hidden="true" />
                  </div>
                  <h3>{card.title}</h3>
                  <p>{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA & Support Banner */}
      <section className="wd-about-section wd-about-cta-section">
        <div className="shell">
          <div className="wd-about-cta-card">
            <div className="wd-about-cta-copy">
              <h2>{t.ctaTitle}</h2>
              <p className="wd-about-sub-h2">{t.ctaLead}</p>
              <div className="wd-about-cta-buttons">
                <Link href={auditHref} className="wd-button-primary">
                  <SearchCheck size={18} aria-hidden="true" />
                  <span>{t.ctaAuditBtn}</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link href={allToolsHref} className="wd-button-secondary">
                  <span>{t.ctaToolsBtn}</span>
                </Link>
              </div>
            </div>

            <div className="wd-about-support-box">
              <Mail size={24} aria-hidden="true" />
              <h3>{t.supportTitle}</h3>
              <p>{t.supportText}</p>
              <div className="wd-about-support-email-pill">
                <strong>support@webdiag.ru</strong>
              </div>
              <Link href={contactHref} className="wd-about-contact-link">
                <span>{t.contactBtn}</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
