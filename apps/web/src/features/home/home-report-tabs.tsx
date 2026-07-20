"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  CheckCircle2,
  Download,
  FileDown,
  Files,
  Flag,
  Gauge,
  Globe2,
  Info,
  Keyboard,
  LayoutGrid,
  Link2,
  ListFilter,
  Search,
  ShieldCheck,
  Table2,
  Target,
  TrendingUp,
  TriangleAlert,
  CircleAlert,
  ChevronRight,
  Map,
  FileCode2,
  type LucideIcon,
} from "lucide-react";
import type { Locale } from "@webdiag/tool-registry";

type TabId = "summary" | "priority" | "index" | "seo" | "speed" | "security" | "a11y" | "export";

const tabs: readonly { id: TabId; icon: LucideIcon; ru: string; en: string }[] = [
  { id: "summary", icon: LayoutGrid, ru: "Сводка", en: "Summary" },
  { id: "priority", icon: Flag, ru: "Приоритеты", en: "Priorities" },
  { id: "index", icon: Search, ru: "Индексация", en: "Indexing" },
  { id: "seo", icon: TrendingUp, ru: "SEO", en: "SEO" },
  { id: "speed", icon: Gauge, ru: "Скорость", en: "Performance" },
  { id: "security", icon: ShieldCheck, ru: "Безопасность", en: "Security" },
  { id: "a11y", icon: Keyboard, ru: "Доступность", en: "Accessibility" },
  { id: "export", icon: Download, ru: "Экспорт", en: "Export" },
];

const copy = {
  ru: {
    reportLabel: "/report/site-ru · демо технического отчёта",
    site: "site.ru",
    checked: "Демо-страниц",
    next: "Повторная проверка",
    repeat: "Будет доступно после audit engine",
    summaryTitle: "Сводка проверки",
    summaryText: "Демонстрация будущего отчёта: оценка, приоритеты, затронутые URL и проверки, которые уже проходят.",
    read: "Методика будет описана в базе знаний",
    score: "Сводная оценка",
    scoreDelta: "пример изменения после повторной проверки",
    metrics: [
      ["128", "демо-страниц"],
      ["7", "требует внимания"],
      ["24", "рекомендуем исправить"],
      ["66", "всё в порядке"],
    ] as const,
    issuesTitle: "Ключевые проблемы",
    allIssues: "Полный список появится в рабочем отчёте",
    issues: [
      ["Критично", "robots.txt закрывает важные URL", "Поисковые роботы не могут получить доступ к важным страницам.", "12 URL", "red"],
      ["Предупр.", "Description отсутствует на посадочных страницах", "Мета-описание помогает в поиске и повышает CTR.", "14 URL", "amber"],
      ["Предупр.", "LCP выше нормы на ключевых шаблонах", "Медленная загрузка снижает пользовательский опыт.", "9 шабл.", "amber"],
      ["Настроено", "SSL, sitemap и canonical проходят проверку", "Критически важные настройки корректны.", "OK", "cyan"],
    ] as const,
    priorityTitle: "Приоритеты",
    priorityText: "Что исправить первым, почему это важно и какие страницы затронуты.",
    indexTitle: "Индексация",
    indexText: "Доступность страниц для поисковых роботов, sitemap, robots.txt, canonical и noindex.",
    seoTitle: "SEO",
    seoText: "Title, description, H1, canonical, Open Graph и базовая структура страницы.",
    speedTitle: "Скорость",
    speedText: "Core Web Vitals, LCP, CLS, TTFB, изображения и вес ресурсов.",
    securityTitle: "Безопасность",
    securityText: "SSL, HSTS, CSP, mixed content и базовые security headers.",
    a11yTitle: "Доступность",
    a11yText: "Контраст, alt, labels, ARIA, focus states и навигация с клавиатуры.",
    exportTitle: "Экспорт",
    exportText: "Экспорт PDF, CSV и публичная ссылка показаны как будущая часть рабочего отчёта.",
    sidePriority: "Приоритеты исправлений",
    sidePriorityText: "Что исправить первым, почему это важно и какие страницы затронуты.",
    sideUrls: "Затронутые URL",
    sideUrlsText: "Конкретные страницы с проблемой, без абстрактных «где-то на сайте».",
    sideGood: "Что уже настроено",
    sideGoodText: "Проверенные базовые настройки, которые не требуют вмешательства.",
    previewOnly: "Демо без действия",
  },
  en: {
    reportLabel: "/report/site-example · technical report demo",
    site: "site.com",
    checked: "Demo pages",
    next: "Re-check",
    repeat: "Available after the audit engine",
    summaryTitle: "Audit summary",
    summaryText: "A preview of the future report: score, priorities, affected URLs, and checks that already pass.",
    read: "Methodology will live in the knowledge base",
    score: "Overall score",
    scoreDelta: "sample delta after a re-check",
    metrics: [
      ["128", "demo pages"],
      ["7", "needs attention"],
      ["24", "recommended fixes"],
      ["66", "checks passed"],
    ] as const,
    issuesTitle: "Key issues",
    allIssues: "The full list will appear in the working report",
    issues: [
      ["Critical", "robots.txt blocks important URLs", "Search crawlers cannot access important pages.", "12 URLs", "red"],
      ["Warning", "Landing pages miss descriptions", "Meta descriptions improve clarity in search results.", "14 URLs", "amber"],
      ["Warning", "LCP is high on key templates", "Slow loading weakens the user experience.", "9 templates", "amber"],
      ["Configured", "SSL, sitemap, and canonical checks pass", "Core technical settings are correct.", "OK", "cyan"],
    ] as const,
    priorityTitle: "Priorities",
    priorityText: "What to fix first, why it matters, and which pages are affected.",
    indexTitle: "Indexing",
    indexText: "Crawler access, sitemap, robots.txt, canonical, and noindex signals.",
    seoTitle: "SEO",
    seoText: "Title, description, H1, canonical, Open Graph, and page structure.",
    speedTitle: "Performance",
    speedText: "Core Web Vitals, LCP, CLS, TTFB, images, and resource weight.",
    securityTitle: "Security",
    securityText: "SSL, HSTS, CSP, mixed content, and baseline security headers.",
    a11yTitle: "Accessibility",
    a11yText: "Contrast, alt text, labels, ARIA, focus states, and keyboard navigation.",
    exportTitle: "Export",
    exportText: "PDF, CSV, and a public report link are shown as a future part of the working report.",
    sidePriority: "Fix priorities",
    sidePriorityText: "What to fix first, why it matters, and which pages are affected.",
    sideUrls: "Affected URLs",
    sideUrlsText: "Concrete pages with the issue, not an abstract site-wide warning.",
    sideGood: "Already configured",
    sideGoodText: "Verified baseline settings that do not require intervention.",
    previewOnly: "Demo only",
  },
} as const;

function ScoreRing() {
  return (
    <div className="wd-score-ring" aria-label="82 out of 100">
      <div className="wd-score-value"><strong>82</strong><span>/100</span></div>
    </div>
  );
}

function IssueRow({ issue }: { issue: readonly [string, string, string, string, string] }) {
  const [label, title, description, count, tone] = issue;
  return (
    <div className="wd-report-issue-row">
      <span className={`wd-status-pill is-${tone}`}>{label}</span>
      <div><strong>{title}</strong><p>{description}</p></div>
      <span className="wd-report-count">{count}</span>
      {tone === "cyan" ? <CheckCircle2 aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
    </div>
  );
}

function PreviewAction({ children }: { children: ReactNode }) {
  return <span className="wd-report-action is-disabled" aria-disabled="true">{children}</span>;
}

function SummaryPanel({ locale, hidden }: { locale: Locale; hidden: boolean }) {
  const t = copy[locale];
  const icons = [Files, TriangleAlert, CircleAlert, CheckCircle2] as const;
  const tones = ["base", "red", "amber", "cyan"] as const;
  return (
    <div className="wd-report-panel is-active" id="wd-report-summary" role="tabpanel" aria-labelledby="wd-report-tab-summary" tabIndex={0} hidden={hidden}>
      <div className="wd-report-heading">
        <div><h3>{t.summaryTitle}</h3><p>{t.summaryText}</p></div>
        <PreviewAction><Info aria-hidden="true" />{t.read}</PreviewAction>
      </div>
      <div className="wd-report-summary-grid">
        <article className="wd-report-score-card">
          <ScoreRing />
          <div><strong>{t.score}</strong><span>{t.scoreDelta}</span></div>
        </article>
        {t.metrics.map(([value, label], index) => {
          const Icon = icons[index]!;
          return <article className={`wd-report-metric is-${tones[index]}`} key={label}><Icon aria-hidden="true" /><strong>{value}</strong><span>{label}</span></article>;
        })}
      </div>
      <div className="wd-report-issues">
        <header><strong>{t.issuesTitle}<span>3</span></strong><PreviewAction>{t.allIssues}<ChevronRight aria-hidden="true" /></PreviewAction></header>
        {t.issues.map((issue) => <IssueRow key={issue[1]} issue={issue} />)}
      </div>
    </div>
  );
}

function SimplePanel({ title, text, children, id, hidden }: { title: string; text: string; children: ReactNode; id: TabId; hidden: boolean }) {
  return (
    <div className="wd-report-panel" id={`wd-report-${id}`} role="tabpanel" aria-labelledby={`wd-report-tab-${id}`} tabIndex={0} hidden={hidden}>
      <div className="wd-report-heading"><div><h3>{title}</h3><p>{text}</p></div></div>
      {children}
    </div>
  );
}

export function HomeReportTabs({ locale }: { locale: Locale }) {
  const [active, setActive] = useState<TabId>("summary");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const t = copy[locale];

  const activateByIndex = (index: number) => {
    const normalized = (index + tabs.length) % tabs.length;
    const next = tabs[normalized]!;
    setActive(next.id);
    tabRefs.current[normalized]?.focus();
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (["ArrowRight", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      activateByIndex(index + 1);
    }
    if (["ArrowLeft", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      activateByIndex(index - 1);
    }
    if (event.key === "Home") {
      event.preventDefault();
      activateByIndex(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      activateByIndex(tabs.length - 1);
    }
  };

  return (
    <div className="wd-report-showcase">
      <div className="wd-report-frame">
        <div className="wd-report-browser-bar"><span>{t.reportLabel}</span></div>
        <div className="wd-report-app">
          <div className="wd-report-tabs">
            <div className="wd-report-tablist" role="tablist" aria-label={locale === "ru" ? "Разделы отчёта" : "Report sections"}>
            {tabs.map(({ id, icon: Icon, ru, en }, index) => (
              <button
                type="button"
                role="tab"
                id={`wd-report-tab-${id}`}
                aria-selected={active === id}
                aria-controls={`wd-report-${id}`}
                tabIndex={active === id ? 0 : -1}
                className={active === id ? "is-active" : ""}
                onClick={() => setActive(id)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
                ref={(node) => { tabRefs.current[index] = node; }}
                key={id}
              ><Icon aria-hidden="true" />{locale === "ru" ? ru : en}</button>
            ))}
            </div>
            <div className="wd-report-site-card">
              <strong><Globe2 aria-hidden="true" />{t.site}</strong>
              <p>{t.checked}<b>128 / 128</b></p>
              <p>{t.next}<b>25 May 2025</b></p>
              <PreviewAction>{t.repeat}</PreviewAction>
            </div>
          </div>
          <div className="wd-report-content">
            <SummaryPanel locale={locale} hidden={active !== "summary"} />
            <SimplePanel id="priority" hidden={active !== "priority"} title={t.priorityTitle} text={t.priorityText}><div className="wd-report-issues"><IssueRow issue={t.issues[0]} /><IssueRow issue={t.issues[1]} /></div></SimplePanel>
            <SimplePanel id="index" hidden={active !== "index"} title={t.indexTitle} text={t.indexText}><div className="wd-report-mini-grid"><article><FileCode2 /><strong>robots.txt</strong><span>12 URL</span></article><article><Map /><strong>Sitemap.xml</strong><span>128 URL</span></article></div></SimplePanel>
            <SimplePanel id="seo" hidden={active !== "seo"} title={t.seoTitle} text={t.seoText}><div className="wd-report-issues"><IssueRow issue={t.issues[1]} /></div></SimplePanel>
            <SimplePanel id="speed" hidden={active !== "speed"} title={t.speedTitle} text={t.speedText}><div className="wd-report-issues"><IssueRow issue={t.issues[2]} /></div></SimplePanel>
            <SimplePanel id="security" hidden={active !== "security"} title={t.securityTitle} text={t.securityText}><ul className="wd-report-checks"><li><CheckCircle2 />SSL</li><li><CheckCircle2 />Mixed content</li><li><CircleAlert />CSP</li></ul></SimplePanel>
            <SimplePanel id="a11y" hidden={active !== "a11y"} title={t.a11yTitle} text={t.a11yText}><div className="wd-report-mini-grid"><article><Keyboard /><strong>{locale === "ru" ? "Клавиатура" : "Keyboard"}</strong><span>focus</span></article><article><Keyboard /><strong>{locale === "ru" ? "Семантика" : "Semantics"}</strong><span>ARIA</span></article></div></SimplePanel>
            <SimplePanel id="export" hidden={active !== "export"} title={t.exportTitle} text={t.exportText}><div className="wd-report-mini-grid"><article><FileDown /><strong>PDF</strong><span>{locale === "ru" ? "план" : "planned"}</span></article><article><Table2 /><strong>CSV</strong><span>{locale === "ru" ? "план" : "planned"}</span></article></div></SimplePanel>
          </div>
        </div>
      </div>
      <aside className="wd-report-rail">
        <article><Target /><h3>{t.sidePriority}</h3><p>{t.sidePriorityText}</p><PreviewAction>{t.previewOnly}</PreviewAction></article>
        <article><Link2 /><h3>{t.sideUrls}</h3><p>{t.sideUrlsText}</p><PreviewAction>{t.previewOnly}</PreviewAction></article>
        <article><ListFilter /><h3>{t.sideGood}</h3><p>{t.sideGoodText}</p><ul><li><CheckCircle2 />SSL</li><li><CheckCircle2 />Sitemap.xml</li><li><CheckCircle2 />Canonical</li><li><CheckCircle2 />HTTP</li></ul></article>
      </aside>
    </div>
  );
}
