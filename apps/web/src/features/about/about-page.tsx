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
import { PUBLIC_CATALOG_TOOL_COUNT } from "../tools/public-catalog-data";
import { ACTIVE_AI_CATALOG_TOOLS } from "../tools/ai-tools-data";

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
        lead: `WebDiag объединяет ${PUBLIC_CATALOG_TOOL_COUNT} инструментов диагностики, включая AI-сценарии, для веб-мастеров, SEO-специалистов и разработчиков.`,
        stats: [
          { value: PUBLIC_CATALOG_TOOL_COUNT, label: "Инструментов анализа", sub: "От HTTP-заголовков до Core Web Vitals и AI" },
          { value: ACTIVE_AI_CATALOG_TOOLS.length, label: "AI-сценариев", sub: "Готовые планы, брифы и перелинковка" },
          { value: "Данные", label: "Основа проверок", sub: "Введённые данные и ответы источников" },
          { value: "По задаче", label: "Время проверки", sub: "Зависит от инструмента и ответа источника" },
        ],
        missionTitle: "Задача WebDiag",
        missionLead: "Помочь разобраться в технических проблемах сайта и выбрать, что исправлять дальше.",
        missionP1:
          "WebDiag объединяет проверки HTTP-ответов, DNS, TLS, разметки и содержимого страниц. Можно проверить отдельный URL или запустить обход доступных HTML-страниц, затем сохранить результаты в личном кабинете.",
        missionP2:
          "Базовые диагностические инструменты доступны бесплатно. В отчетах собраны найденные проблемы и рекомендации, а AI-сценарии помогают подготовить план исправлений, текст или разметку на основе данных выбранной задачи.",
        pillarsTitle: "Как устроена работа с WebDiag",
        pillarsLead: "От исходных данных к проверке, отчету и следующему действию.",
        pillars: [
          {
            icon: Zap,
            title: "Проверки HTML и сети",
            text: "Серверные проверки анализируют HTTP-ответы, заголовки, перенаправления и полученный HTML. JavaScript при обходе страниц не выполняется.",
          },
          {
            icon: Sparkles,
            title: "AI для конкретных задач",
            text: "AI-сценарии используют данные аудита, загруженные материалы или введенные вами сведения — в зависимости от задачи. Из этих данных формируются планы, брифы, тексты и разметка.",
          },
          {
            icon: ShieldCheck,
            title: "Проверка входных данных и результатов",
            text: "Запросы проверяются по формату и ограничениям инструмента. Структурированные результаты AI проходят проверку по контракту перед сохранением.",
          },
          {
            icon: Layers,
            title: "Инструменты в одном каталоге",
            text: "В каталоге собраны проверки DNS, HTTP и разметки, анализ скорости и AI-сценарии для работы с контентом. Для каждой задачи можно выбрать отдельный инструмент.",
          },
        ],
        techTitle: "Технологический стек",
        techLead: "Компоненты интерфейса, серверных проверок и хранения результатов.",
        techCards: [
          {
            icon: Code2,
            title: "Интерфейс",
            desc: "Next.js, React и TypeScript: страницы инструментов, формы ввода, результаты проверок и личный кабинет.",
          },
          {
            icon: Cpu,
            title: "Серверная часть",
            desc: "Python и FastAPI обрабатывают запросы к API, проверяют входные данные и управляют заданиями аудита и обхода страниц.",
          },
          {
            icon: Layers,
            title: "Источники измерений",
            desc: "HTML и сетевые ответы используются в серверных проверках. Данные о скорости можно получить из Google PageSpeed, когда источник доступен.",
          },
          {
            icon: Users,
            title: "Задания и отчеты",
            desc: "Статусы заданий, результаты аудитов и отчеты сохраняются. Личный кабинет показывает историю проверок и настройки мониторинга.",
          },
        ],
        ctaTitle: "Готовы проверить ваш сайт прямо сейчас?",
        ctaLead: "Запустите бесплатный экспресс-аудит главной страницы или выберите нужный инструмент из каталога.",
        ctaAuditBtn: "Запустить SEO-аудит",
        ctaToolsBtn: "Каталог инструментов",
        supportTitle: "Есть вопросы или предложения?",
        supportText: "Напишите на почту поддержки или воспользуйтесь формой обратной связи. Можно задать вопрос об инструменте или предложить улучшение.",
        contactBtn: "Контакты и поддержка",
      }
    : {
        breadcrumbs: { home: "Home", about: "About" },
        eyebrow: "About WebDiag Platform",
        title: "Modern Platform for Comprehensive Website Diagnostics and SEO Auditing",
        lead: `WebDiag brings together ${PUBLIC_CATALOG_TOOL_COUNT} diagnostic tools, including AI workflows, for webmasters, SEO professionals, and developers.`,
        stats: [
          { value: PUBLIC_CATALOG_TOOL_COUNT, label: "Diagnostic tools", sub: "From HTTP headers to Core Web Vitals and AI" },
          { value: ACTIVE_AI_CATALOG_TOOLS.length, label: "AI workflows", sub: "Fix plans, briefs, and internal linking" },
          { value: "Data", label: "Diagnostic inputs", sub: "Submitted data and source responses" },
          { value: "Varies", label: "Check duration", sub: "Depends on the tool and source response" },
        ],
        missionTitle: "What WebDiag Helps With",
        missionLead: "Understand technical website issues and decide what to fix next.",
        missionP1:
          "WebDiag brings together checks for HTTP responses, DNS, TLS, markup, and page content. Check a single URL or crawl accessible HTML pages, then save the results in your account.",
        missionP2:
          "Basic diagnostic tools are free to use. Reports collect the issues found and suggested fixes. AI workflows help prepare a fix plan, text, or markup using the inputs for the selected task.",
        pillarsTitle: "Working with WebDiag",
        pillarsLead: "From source data to a check, a report, and a next step.",
        pillars: [
          {
            icon: Zap,
            title: "HTML and network checks",
            text: "Server checks analyze HTTP responses, headers, redirects, and the returned HTML. Page crawls do not execute JavaScript.",
          },
          {
            icon: Sparkles,
            title: "AI for specific tasks",
            text: "AI workflows use audit data, uploaded materials, or facts you enter, depending on the task. These inputs are used to prepare plans, briefs, text, and markup.",
          },
          {
            icon: ShieldCheck,
            title: "Input and result validation",
            text: "Requests are checked against the tool's input format and limits. Structured AI results are validated against the tool contract before they are saved.",
          },
          {
            icon: Layers,
            title: "Tools in one catalog",
            text: "The catalog includes DNS, HTTP, and markup checks, speed analysis, and AI content workflows. Choose an individual tool for the task you need.",
          },
        ],
        techTitle: "Technology Stack",
        techLead: "Components for the interface, server checks, and stored results.",
        techCards: [
          {
            icon: Code2,
            title: "Interface",
            desc: "Next.js, React, and TypeScript provide tool pages, input forms, check results, and the account interface.",
          },
          {
            icon: Cpu,
            title: "Server application",
            desc: "Python and FastAPI handle API requests, validate inputs, and manage audit and crawl jobs.",
          },
          {
            icon: Layers,
            title: "Measurement sources",
            desc: "Server checks use HTML and network responses. Speed data can be obtained from Google PageSpeed when that source is available.",
          },
          {
            icon: Users,
            title: "Jobs and reports",
            desc: "Job statuses, audit results, and reports are stored. Your account shows check history and monitoring settings.",
          },
        ],
        ctaTitle: "Ready to inspect your website today?",
        ctaLead: "Run a free single-page SEO audit or choose an exact utility from our comprehensive tools catalog.",
        ctaAuditBtn: "Run SEO Audit",
        ctaToolsBtn: "Browse Tools Catalog",
        supportTitle: "Have questions or ideas?",
        supportText: "Email support or use the contact form to ask about a tool or suggest an improvement.",
        contactBtn: "Contacts & Support",
      };

  return (
    <div className="wd-about-page">
      <nav className="shell breadcrumbs wd-about-breadcrumbs" aria-label="Breadcrumbs">
        <Link href={homeHref}>{t.breadcrumbs.home}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{t.breadcrumbs.about}</span>
      </nav>

      <section className="wd-about-hero">
        <div className="shell wd-about-hero-inner">
          <span className="wd-eyebrow">{t.eyebrow}</span>
          <h1 className="wd-about-title">{t.title}</h1>
          <p className="wd-about-lead">{t.lead}</p>

          <div className="wd-about-stats-grid">
            {t.stats.map((item, idx) => (
              <div className="wd-about-stat-card" key={idx}>
                <span className="wd-summary-value">
                  {item.value}
                </span>
                <strong className="wd-about-stat-label">{item.label}</strong>
                <small className="wd-about-stat-sub">{item.sub}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

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
                <span>{ru ? "Проверки HTML и сетевых ответов без выполнения JavaScript" : "HTML and network response checks without JavaScript execution"}</span>
              </li>
              <li>
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>{ru ? "Метрики Google PageSpeed с указанием доступности данных" : "Google PageSpeed metrics with data availability shown"}</span>
              </li>
              <li>
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>{ru ? "Проверка формата входных данных и структурированных результатов" : "Validation of input formats and structured results"}</span>
              </li>
              <li>
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>{ru ? "Сохраненные аудиты, отчеты и история проверок в личном кабинете" : "Saved audits, reports, and check history in your account"}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

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
