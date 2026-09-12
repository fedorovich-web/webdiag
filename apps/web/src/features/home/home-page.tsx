import Link from "next/link";
import {
  Bot,
  ChevronRight,
  FileSearch,
  FileText,
  Gauge,
  Image as ImageIcon,
  Link2,
  Map,
  MonitorCheck,
  Network,
  Route,
  SearchCheck,
  ShieldCheck,
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

const benefitArtwork = [
  "/home/benefit-tools.webp",
  "/home/benefit-reports.webp",
  "/home/benefit-time.webp",
] as const;

const knowledgeArtwork = [
  "/home/knowledge-technical-seo.webp",
  "/home/knowledge-robots.webp",
  "/home/knowledge-core-web-vitals.webp",
] as const;

const heroAccentStyle = {
  background: "var(--wd-button-bg)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
} as const;

function IconBox({ icon: Icon }: { icon: LucideIcon }) {
  return <span className="wd-icon-box"><Icon aria-hidden="true" /></span>;
}

function ReportExample({ locale }: { locale: Locale }) {
  const ru = locale === "ru";
  return (
    <article className="wd-report-example-card">
      <div className="wd-report-tabs" aria-label={ru ? "Разделы примера отчёта" : "Sample report sections"}>
        <span className="is-active">{ru ? "Проблемы 36" : "Issues 36"}</span>
        <span>{ru ? "Страницы" : "Pages"}</span>
        <span>{ru ? "Параметры" : "Parameters"}</span>
        <span>{ru ? "Сравнение" : "Comparison"}</span>
      </div>
      <div className="wd-report-bottom-row">
        <div>
          <div className="wd-report-table-head" aria-hidden="true">
            <span>{ru ? "Проблема" : "Issue"}</span><span>{ru ? "Страницы" : "Pages"}</span><span>{ru ? "Приоритет" : "Priority"}</span>
          </div>
          <div className="wd-report-issue-list">
            <div><span className="wd-issue-dot is-critical" /><strong>{ru ? "Отсутствует meta description" : "Meta description is missing"}</strong><b>12</b><span className="wd-priority-mark is-critical">{ru ? "Критический" : "Critical"}</span></div>
            <div><span className="wd-issue-dot is-high" /><strong>{ru ? "Битые ссылки" : "Broken links"}</strong><b>4</b><span className="wd-priority-mark is-high">{ru ? "Высокий" : "High"}</span></div>
            <div><span className="wd-issue-dot is-warning" /><strong>{ru ? "Слишком большие изображения" : "Oversized images"}</strong><b>23</b><span className="wd-priority-mark is-warning">{ru ? "Средний" : "Medium"}</span></div>
            <div><span className="wd-issue-dot is-warning" /><strong>{ru ? "Не настроен robots.txt" : "robots.txt needs attention"}</strong><b>1</b><span className="wd-priority-mark is-warning">{ru ? "Средний" : "Medium"}</span></div>
            <div><span className="wd-issue-dot is-warning" /><strong>{ru ? "Отсутствует canonical" : "Canonical is missing"}</strong><b>8</b><span className="wd-priority-mark is-warning">{ru ? "Средний" : "Medium"}</span></div>
          </div>
        </div>
        <div className="wd-report-recommendation">
          <strong>{ru ? "Отсутствует meta description" : "Meta description is missing"}</strong>
          <small>{ru ? "12 страниц (4,8% страниц)" : "12 pages (4.8% of pages)"}</small>
          <p><b>{ru ? "Рекомендация" : "Recommendation"}</b><br />{ru ? "Добавьте уникальные meta description для всех важных страниц сайта." : "Add unique meta descriptions to all important pages."}</p>
          <span>{ru ? "Как исправить?" : "How to fix it"} →</span>
        </div>
        <Link href={ru ? "/audit" : "/en/audit"}>{ru ? "Смотреть полный пример отчёта" : "View full report example"}<span aria-hidden="true">→</span></Link>
      </div>
    </article>
  );
}

function MonitoringPreview({ locale }: { locale: Locale }) {
  const ru = locale === "ru";
  return (
    <article className="wd-monitoring-dashboard">
      <div className="wd-monitoring-chart">
        <header><strong>{ru ? "Динамика SEO-здоровья" : "SEO health trend"}</strong><span className="wd-score-chip"><b>78</b><small>+12%</small></span></header>
        <HomeMonitoringChart locale={locale} />
      </div>
      <div className="wd-monitoring-score-row">
        <div><strong>142</strong><span>{ru ? "Проверено страниц" : "Pages checked"}</span></div>
        <div><strong className="is-critical">36</strong><span>{ru ? "Найдено проблем" : "Issues found"}</span></div>
        <div><strong>28</strong><span>{ru ? "Исправлено" : "Resolved"}</span></div>
      </div>
    </article>
  );
}

export function HomePage({ locale }: { locale: Locale }) {
  const t = (value: { readonly ru: string; readonly en: string }) => localizeValue(value, locale);
  const toolsHref = toolsPath(locale);
  const monitoringHref = locale === "ru" ? "/monitoring" : "/en/monitoring";
  const faqItems = homeContent.faq.map((item) => [t(item.question), t(item.answer)] as const);
  const popularTools = homeContent.popularTools.filter((item) => getPublicTool(item.slug));

  return (
    <main className="wd-home">
      <section className="wd-hero" aria-labelledby="home-title">
        <div className="shell wd-hero-grid">
          <div className="wd-hero-copy">
            <span className="wd-eyebrow">{t(homeContent.eyebrow)}</span>
            <h1 id="home-title">
              {locale === "ru" ? <>Проверка сайта на технические и <span style={heroAccentStyle}>SEO-ошибки</span></> : <>Check Your Website for Technical and <span style={heroAccentStyle}>SEO Issues</span></>}
            </h1>
            <p className="wd-hero-lead">{t(homeContent.description)}</p>
            <HomeUrlCheckForm locale={locale} instance="hero" />
            <p className="wd-hero-note">{t(homeContent.heroNote)}</p>
          </div>
          <div className="wd-hero-visual" aria-hidden="true">
            <img className="wd-hero-dashboard" src="/home/hero-dashboard.webp" alt="" width="1536" height="1024" fetchPriority="high" decoding="async" />
          </div>
        </div>
        <div className="shell wd-hero-benefits" aria-label={locale === "ru" ? "Преимущества WebDiag" : "WebDiag benefits"}>
          {homeContent.trustFacts.map((fact, index) => (
            <div className="wd-hero-benefit" key={t(fact)}>
              <img src={benefitArtwork[index]} alt="" width="192" height="192" loading="eager" decoding="async" />
              <span>{t(fact)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="wd-platform-strip" aria-label={t(homeContent.platformsTitle)}>
        <div className="shell">
          <p>{locale === "ru" ? "Нам доверяют веб-мастера, SEO-специалисты и бизнесы" : "Used by webmasters, SEO specialists and businesses"}</p>
          <div>{homeContent.platforms.map((platform) => <span key={platform}>{platform}</span>)}</div>
          <span className="wd-platform-more">{locale === "ru" ? "и другие" : "and more"}</span>
        </div>
      </section>

      <section className="wd-section" id="tools">
        <div className="shell">
          <div className="wd-section-headline">
            <div className="wd-section-intro"><h2>{t(homeContent.popularToolsTitle)}</h2><p>{t(homeContent.popularToolsDescription)}</p></div>
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
        <div className="shell wd-process-panel">
          <div className="wd-process-heading"><h2>{t(homeContent.processTitle)}</h2><p>{locale === "ru" ? "3 простых шага — от URL до готового отчёта" : "3 simple steps — from URL to a ready report"}</p></div>
          <div className="wd-process-steps">
            {homeContent.processSteps.map((step, index) => (
              <article key={t(step.title)}><span className="wd-step-number">{index + 1}</span><div><h3>{t(step.title)}</h3><p>{t(step.description)}</p></div></article>
            ))}
          </div>
          <img className="wd-process-accent" src="/home/process-accent.webp" alt="" width="512" height="512" loading="lazy" decoding="async" />
        </div>
      </section>

      <section className="wd-section" id="checks">
        <div className="shell">
          <div className="wd-section-intro"><h2>{t(homeContent.checksTitle)}</h2><p>{locale === "ru" ? "Полный технический и SEO-аудит сайта" : "A complete technical and SEO website audit"}</p></div>
          <div className="wd-check-grid">
            {homeContent.auditAreas.map((area) => {
              const Icon = checkIcons[area.id] ?? SearchCheck;
              return <article key={area.id}><IconBox icon={Icon} /><div><h3>{t(area.title)}</h3><p>{t(area.description)}</p></div></article>;
            })}
          </div>
        </div>
      </section>

      <section className="wd-section wd-product-section" id="report">
        <div className="shell wd-product-split">
          <div className="wd-product-column">
            <div className="wd-section-intro"><h2>{t(homeContent.reportTitle)}</h2><p>{locale === "ru" ? "Понятные приоритеты, конкретные страницы и рекомендации" : "Clear priorities, affected pages and recommendations"}</p></div>
            <ReportExample locale={locale} />
          </div>
          <div className="wd-product-column" id="monitoring">
            <div className="wd-section-intro"><h2>{t(homeContent.monitoringTitle)}</h2><p>{locale === "ru" ? "Следите за состоянием сайта в динамике" : "Track website health over time"}</p></div>
            <MonitoringPreview locale={locale} />
            <Link className="wd-section-link wd-product-link" href={monitoringHref}>{t(homeContent.monitoringAction)}<span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>

      <section className="wd-section wd-knowledge-faq-section">
        <div className="shell wd-knowledge-faq-grid">
          <div id="knowledge">
            <div className="wd-section-headline">
              <div className="wd-section-intro"><h2>{t(homeContent.knowledgeTitle)}</h2><p>{locale === "ru" ? "Инструкции, гайды и статьи для веб-мастеров" : "Guides and articles for webmasters"}</p></div>
              <Link className="wd-section-link" href={locale === "ru" ? "/knowledge" : "/en/knowledge"}>{t(homeContent.knowledgeAction)}<span aria-hidden="true">→</span></Link>
            </div>
            <div className="wd-resource-grid">
              {homeContent.resources.map((resource, index) => (
                <Link className="wd-resource-card" href={t(resource.href)} key={t(resource.title)}>
                  <div className="wd-resource-visual"><img src={knowledgeArtwork[index]} alt="" width="512" height="512" loading="lazy" decoding="async" /></div>
                  <div><span className="wd-resource-label">{index === 0 ? "SEO" : index === 1 ? (locale === "ru" ? "Руководство" : "Guide") : (locale === "ru" ? "Аналитика" : "Analytics")}</span><h3>{t(resource.title)}</h3><p>{t(resource.description)}</p></div>
                </Link>
              ))}
            </div>
          </div>
          <div className="wd-faq-column" id="faq"><div className="wd-section-intro"><h2>{t(homeContent.faqTitle)}</h2><p>{locale === "ru" ? "Короткие ответы на популярные вопросы" : "Short answers to common questions"}</p></div><HomeFaqAccordion items={faqItems} /></div>
        </div>
      </section>

      <section className="wd-section wd-final-section">
        <div className="shell wd-final-panel">
          <div className="wd-final-copy"><h2>{t(homeContent.finalTitle)}</h2><p>{t(homeContent.finalDescription)}</p></div>
          <HomeUrlCheckForm locale={locale} instance="final" />
        </div>
      </section>
    </main>
  );
}
