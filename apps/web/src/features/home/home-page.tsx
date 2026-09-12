import Link from "next/link";
import {
  Activity,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  FileSearch,
  FileText,
  Gauge,
  Globe2,
  Image as ImageIcon,
  KeyRound,
  Link2,
  ListChecks,
  Map,
  MonitorCheck,
  Network,
  Radar,
  Route,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { getPublicTool, type Locale } from "@webdiag/tool-registry";
import { homeContent } from "../../content/home";
import { localizeValue } from "../../content/types";
import { toolsPath } from "../../lib/routes";
import { HomeFaqAccordion } from "./home-faq-accordion";
import { HomeMonitoringChart } from "./home-monitoring-chart";
import { HomeUrlCheckForm } from "./home-url-check-form";

const popularToolIcons: Record<string, LucideIcon> = {
  "single-page-audit": SearchCheck,
  "core-web-vitals-checker": Gauge,
  "robots-txt-tester": Bot,
  "sitemap-validator": Map,
  "redirect-chain-checker": Route,
  "meta-tags-checker": FileText,
  "canonical-checker": Link2,
  "image-seo-audit": ImageIcon,
};

const checkIcons: Record<string, LucideIcon> = {
  robots: Bot,
  sitemap: Map,
  redirects: Route,
  metadata: FileText,
  performance: Gauge,
  security: ShieldCheck,
  links: Network,
  canonical: Link2,
  accessibility: MonitorCheck,
  content: FileSearch,
  indexing: SearchCheck,
  images: ImageIcon,
};

const processIcons = [Globe2, Activity, ListChecks] as const;
const resourceIcons = [FileText, Bot, Gauge] as const;

function IconBox({ icon: Icon }: { icon: LucideIcon }) {
  return <span className="wd-icon-box"><Icon aria-hidden="true" /></span>;
}

function HeroReportPreview({ locale }: { locale: Locale }) {
  const ru = locale === "ru";
  return (
    <div className="wd-hero-visual">
      <span className="wd-hero-callout wd-hero-callout-top">{ru ? "Понятный отчёт с приоритетами" : "A clear prioritized report"}</span>
      <div className="wd-hero-report" aria-label={ru ? "Демонстрация отчёта WebDiag" : "WebDiag report demonstration"}>
        <header>
          <div><span className="wd-report-dot" /><strong>example.ru</strong></div>
          <span>{ru ? "Демо отчёта" : "Report demo"}</span>
        </header>
        <div className="wd-hero-report-body">
          <div className="wd-hero-summary">
            <article className="wd-hero-score">
              <div className="wd-score-ring"><div className="wd-score-value"><strong>78</strong><span>/100</span></div></div>
              <div><strong>{ru ? "Состояние сайта" : "Site health"}</strong><span>{ru ? "есть задачи для исправления" : "issues need attention"}</span></div>
            </article>
            <div className="wd-hero-metrics">
              <article><Globe2 aria-hidden="true" /><strong>25</strong><span>{ru ? "страниц" : "pages"}</span></article>
              <article><TriangleAlert aria-hidden="true" /><strong>4</strong><span>{ru ? "критично" : "critical"}</span></article>
              <article><CircleAlert aria-hidden="true" /><strong>11</strong><span>{ru ? "предупр." : "warnings"}</span></article>
              <article><CheckCircle2 aria-hidden="true" /><strong>42</strong><span>{ru ? "пройдено" : "passed"}</span></article>
            </div>
          </div>
          <div className="wd-hero-tabs" aria-hidden="true">
            <span className="is-active">{ru ? "Проблемы" : "Issues"}</span>
            <span>{ru ? "Страницы" : "Pages"}</span>
            <span>{ru ? "История" : "History"}</span>
          </div>
          <div className="wd-hero-issues">
            <div><span className="wd-status-pill is-red">P0</span><strong>{ru ? "robots.txt закрывает важные URL" : "robots.txt blocks important URLs"}</strong><b>4 URL</b></div>
            <div><span className="wd-status-pill is-amber">P1</span><strong>{ru ? "Отсутствует description" : "Meta description is missing"}</strong><b>7 URL</b></div>
            <div><span className="wd-status-pill is-amber">P1</span><strong>{ru ? "Найдена цепочка редиректов" : "Redirect chain detected"}</strong><b>3 URL</b></div>
            <div><span className="wd-status-pill is-cyan">OK</span><strong>{ru ? "HTTPS и sitemap проходят проверку" : "HTTPS and sitemap checks pass"}</strong><b>{ru ? "Готово" : "Pass"}</b></div>
          </div>
        </div>
      </div>
      <span className="wd-hero-callout wd-hero-callout-bottom">{ru ? "Сразу видно, что исправлять первым" : "See what to fix first"}</span>
    </div>
  );
}

function ReportExample({ locale }: { locale: Locale }) {
  const ru = locale === "ru";
  return (
    <article className="wd-report-example-card">
      <header className="wd-product-card-header">
        <div><span className="wd-report-dot" /><strong>example.ru</strong></div>
        <span>{ru ? "Последняя проверка" : "Latest check"}</span>
      </header>
      <div className="wd-report-tabs" aria-label={ru ? "Разделы примера отчёта" : "Sample report sections"}>
        <span className="is-active">{ru ? "Приоритеты" : "Priorities"}</span>
        <span>{ru ? "Индексация" : "Indexing"}</span>
        <span>SEO</span>
        <span>{ru ? "Скорость" : "Speed"}</span>
      </div>
      <div className="wd-report-issue-list">
        <div>
          <span className="wd-priority-mark is-critical">P0</span>
          <div><strong>{ru ? "Важные страницы закрыты в robots.txt" : "Important pages are blocked in robots.txt"}</strong><p>{ru ? "4 URL · влияет на обход и индексирование" : "4 URLs · affects crawling and indexing"}</p></div>
          <ChevronRight aria-hidden="true" />
        </div>
        <div>
          <span className="wd-priority-mark is-warning">P1</span>
          <div><strong>{ru ? "На посадочных страницах нет description" : "Landing pages are missing descriptions"}</strong><p>{ru ? "7 URL · перепроверьте после исправления" : "7 URLs · re-check after fixing"}</p></div>
          <ChevronRight aria-hidden="true" />
        </div>
        <div>
          <span className="wd-priority-mark is-warning">P1</span>
          <div><strong>{ru ? "Редирект проходит через лишний переход" : "A redirect contains an extra hop"}</strong><p>{ru ? "3 URL · сократите цепочку" : "3 URLs · shorten the chain"}</p></div>
          <ChevronRight aria-hidden="true" />
        </div>
      </div>
      <div className="wd-report-recommendation">
        <span><Sparkles aria-hidden="true" /></span>
        <div><strong>{ru ? "Как исправить?" : "How to fix it"}</strong><p>{ru ? "Начните с P0: откройте нужные URL для поисковых роботов, затем повторите проверку robots.txt и затронутых страниц." : "Start with P0: restore crawler access to the required URLs, then re-check robots.txt and the affected pages."}</p></div>
      </div>
    </article>
  );
}

function MonitoringPreview({ locale }: { locale: Locale }) {
  const ru = locale === "ru";
  return (
    <article className="wd-monitoring-dashboard">
      <header className="wd-product-card-header">
        <div><Radar aria-hidden="true" /><strong>{ru ? "Мониторинг · example.ru" : "Monitoring · example.com"}</strong></div>
        <span className="wd-online-pill"><i />{ru ? "проверки активны" : "checks active"}</span>
      </header>
      <div className="wd-monitoring-body">
        <div className="wd-monitoring-score-row">
          <div><span>{ru ? "SEO health" : "SEO health"}</span><strong>84</strong><small>+6</small></div>
          <div><span>{ru ? "Новые" : "New"}</span><strong>2</strong></div>
          <div><span>{ru ? "Исправлено" : "Resolved"}</span><strong>9</strong></div>
        </div>
        <div className="wd-monitoring-chart">
          <header><strong>{ru ? "Динамика состояния" : "Health trend"}</strong><span>7 days</span></header>
          <HomeMonitoringChart locale={locale} />
        </div>
        <div className="wd-monitoring-events">
          <div><span className="is-good" /><div><strong>{ru ? "Сегодня" : "Today"}</strong><p>{ru ? "исправлены ошибки мета-тегов" : "metadata issues resolved"}</p></div></div>
          <div><span className="is-warn" /><div><strong>{ru ? "Вчера" : "Yesterday"}</strong><p>{ru ? "обнаружена новая цепочка редиректов" : "new redirect chain detected"}</p></div></div>
        </div>
      </div>
    </article>
  );
}

export function HomePage({ locale }: { locale: Locale }) {
  const t = (value: { readonly ru: string; readonly en: string }) => localizeValue(value, locale);
  const toolsHref = toolsPath(locale);
  const auditHref = locale === "ru" ? "/audit" : "/en/audit";
  const monitoringHref = locale === "ru" ? "/monitoring" : "/en/monitoring";
  const faqItems = homeContent.faq.map((item) => [t(item.question), t(item.answer)] as const);
  const popularTools = homeContent.popularTools.filter((item) => getPublicTool(item.slug));

  return (
    <main className="wd-home">
      <section className="wd-hero" aria-labelledby="home-title">
        <img
          alt=""
          aria-hidden="true"
          className="wd-hero-art"
          decoding="async"
          fetchPriority="high"
          height="360"
          src="/hero/webdiag-hero-aurora.webp"
          width="600"
        />
        <div className="shell wd-hero-grid">
          <div className="wd-hero-copy">
            <span className="wd-eyebrow">{t(homeContent.eyebrow)}</span>
            <h1 id="home-title">{t(homeContent.title)}</h1>
            <p className="wd-hero-lead">{t(homeContent.description)}</p>
            <HomeUrlCheckForm locale={locale} instance="hero" />
            <p className="wd-hero-note">{t(homeContent.heroNote)}</p>
            <a className="wd-inline-link" href="#report">{t(homeContent.secondaryAction)}<span aria-hidden="true">→</span></a>
          </div>
          <HeroReportPreview locale={locale} />
        </div>
        <div className="shell wd-hero-benefits" aria-label={locale === "ru" ? "Преимущества WebDiag" : "WebDiag benefits"}>
          {homeContent.trustFacts.map((fact) => <span key={t(fact)}><CheckCircle2 aria-hidden="true" />{t(fact)}</span>)}
        </div>
      </section>

      <section className="wd-platform-strip" aria-label={t(homeContent.platformsTitle)}>
        <div className="shell">
          <p>{t(homeContent.platformsTitle)}</p>
          <div>{homeContent.platforms.map((platform) => <span key={platform}>{platform}</span>)}</div>
        </div>
      </section>

      <section className="wd-section" id="tools">
        <div className="shell">
          <div className="wd-section-headline">
            <div className="wd-section-intro">
              <h2>{t(homeContent.popularToolsTitle)}</h2>
              <p>{t(homeContent.popularToolsDescription)}</p>
            </div>
            <Link className="wd-section-link" href={toolsHref}>{t(homeContent.popularToolsAction)}<span aria-hidden="true">→</span></Link>
          </div>
          <div className="wd-popular-tools-grid">
            {popularTools.map((item) => {
              const Icon = popularToolIcons[item.slug] ?? SearchCheck;
              return (
                <Link className="wd-popular-tool-card" href={`${toolsHref}/${item.slug}`} key={item.slug}>
                  <IconBox icon={Icon} />
                  <div><h3>{t(item.title)}</h3><p>{t(item.description)}</p></div>
                  <ChevronRight aria-hidden="true" className="wd-card-arrow" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="wd-section wd-process-section">
        <div className="shell">
          <div className="wd-section-intro is-centered">
            <h2>{t(homeContent.processTitle)}</h2>
            <p>{t(homeContent.processDescription)}</p>
          </div>
          <div className="wd-process-panel">
            {homeContent.processSteps.map((step, index) => {
              const Icon = processIcons[index] ?? ListChecks;
              return (
                <article key={t(step.title)}>
                  <span className="wd-step-number">0{index + 1}</span>
                  <IconBox icon={Icon} />
                  <h3>{t(step.title)}</h3>
                  <p>{t(step.description)}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="wd-section wd-section-soft" id="checks">
        <div className="shell">
          <div className="wd-section-intro">
            <h2>{t(homeContent.checksTitle)}</h2>
            <p>{t(homeContent.checksDescription)}</p>
          </div>
          <div className="wd-check-grid">
            {homeContent.auditAreas.map((area) => {
              const Icon = checkIcons[area.id] ?? SearchCheck;
              return (
                <article key={area.id}>
                  <IconBox icon={Icon} />
                  <div><h3>{t(area.title)}</h3><p>{t(area.description)}</p></div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="wd-section" id="report">
        <div className="shell wd-product-split">
          <div className="wd-product-column">
            <div className="wd-section-intro">
              <span className="wd-eyebrow">{locale === "ru" ? "Отчёт" : "Report"}</span>
              <h2>{t(homeContent.reportTitle)}</h2>
              <p>{t(homeContent.reportDescription)}</p>
            </div>
            <ReportExample locale={locale} />
            <Link className="wd-section-link wd-product-link" href={auditHref}>{t(homeContent.reportAction)}<span aria-hidden="true">→</span></Link>
          </div>

          <div className="wd-product-column" id="monitoring">
            <div className="wd-section-intro">
              <span className="wd-eyebrow">{locale === "ru" ? "Контроль" : "Monitoring"}</span>
              <h2>{t(homeContent.monitoringTitle)}</h2>
              <p>{t(homeContent.monitoringDescription)}</p>
            </div>
            <MonitoringPreview locale={locale} />
            <ul className="wd-check-list">
              {homeContent.monitoringBullets.map((item) => <li key={t(item)}><CheckCircle2 aria-hidden="true" />{t(item)}</li>)}
            </ul>
            <Link className="wd-section-link wd-product-link" href={monitoringHref}>{t(homeContent.monitoringAction)}<span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>

      <section className="wd-section wd-section-soft wd-knowledge-faq-section">
        <div className="shell wd-knowledge-faq-grid">
          <div id="knowledge">
            <div className="wd-section-headline">
              <div className="wd-section-intro">
                <h2>{t(homeContent.knowledgeTitle)}</h2>
                <p>{t(homeContent.knowledgeDescription)}</p>
              </div>
              <Link className="wd-section-link" href={locale === "ru" ? "/knowledge" : "/en/knowledge"}>{t(homeContent.knowledgeAction)}<span aria-hidden="true">→</span></Link>
            </div>
            <div className="wd-resource-grid">
              {homeContent.resources.map((resource, index) => {
                const Icon = resourceIcons[index] ?? FileText;
                return (
                  <Link className="wd-resource-card" href={t(resource.href)} key={t(resource.title)}>
                    <div className="wd-resource-visual"><Icon aria-hidden="true" /><span>WebDiag</span></div>
                    <div><h3>{t(resource.title)}</h3><p>{t(resource.description)}</p><span className="wd-card-link">{locale === "ru" ? "Подробнее" : "Read more"}<span aria-hidden="true">→</span></span></div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="wd-faq-column" id="faq">
            <div className="wd-section-intro"><h2>{t(homeContent.faqTitle)}</h2></div>
            <HomeFaqAccordion items={faqItems} />
          </div>
        </div>
      </section>

      <section className="wd-section wd-final-section">
        <div className="shell">
          <div className="wd-final-panel">
            <div className="wd-final-copy">
              <span className="wd-eyebrow">{locale === "ru" ? "Начать проверку" : "Start checking"}</span>
              <h2>{t(homeContent.finalTitle)}</h2>
              <p>{t(homeContent.finalDescription)}</p>
            </div>
            <HomeUrlCheckForm locale={locale} instance="final" />
          </div>
        </div>
      </section>
    </main>
  );
}
