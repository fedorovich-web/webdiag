"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  CheckCircle2,
  Download,
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
  Target,
  TrendingUp,
  TriangleAlert,
  CircleAlert,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import type { Locale } from "@webdiag/tool-registry";

type TabId = "summary" | "priority" | "index" | "seo" | "speed" | "security" | "a11y" | "export";
type DemoIssue = readonly [string, string, string, string, string];
type DemoMetric = readonly [string, string];
type TabDetail = {
  readonly metrics: readonly DemoMetric[];
  readonly actions: readonly string[];
  readonly urls: readonly string[];
  readonly note: string;
};

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
    nextDate: "25 мая 2025",
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
    tabLabels: {
      signals: "Сигналы",
      actions: "Что делать",
      urls: "Примеры URL",
      note: "Как использовать",
    },
    tabDetails: {
      priority: {
        metrics: [["P0", "блокирует индексацию"], ["P1", "ухудшает сниппет/CTR"], ["P2", "технический долг"], ["OK", "контролировать после релиза"]],
        actions: ["Сначала открыть важные URL для поисковых роботов.", "Затем восстановить description на посадочных страницах.", "После этого разбирать скорость шаблонов с высокой посещаемостью."],
        urls: ["/catalog/", "/services/seo-audit/", "/blog/technical-seo-checklist/"],
        note: "Приоритизация нужна, чтобы не тратить бюджет на косметику до исправления ошибок, которые режут SEO-трафик и лиды.",
      },
      index: {
        metrics: [["robots.txt", "12 URL закрыто"], ["sitemap", "128 URL найдено"], ["canonical", "проходит"], ["noindex", "проверить шаблоны"]],
        actions: ["Сверить закрытые URL с коммерческими страницами.", "Убедиться, что sitemap содержит только индексируемые страницы.", "Проверить canonical после редиректов и UTM-параметров."],
        urls: ["/catalog/", "/catalog/product-1/", "/landing/context-ads/"],
        note: "Этот блок показывает, может ли поисковик вообще увидеть нужные страницы. Без этого title, тексты и маркетинг не дадут эффекта.",
      },
      seo: {
        metrics: [["Title", "проверка дублей"], ["Description", "14 отсутствует"], ["H1", "структура страницы"], ["OG", "превью ссылок"]],
        actions: ["Написать description для страниц с коммерческим спросом.", "Сверить title и H1 с интентом запроса.", "Добавить OG-данные для корректного превью в мессенджерах и соцсетях."],
        urls: ["/services/", "/prices/", "/cases/"],
        note: "SEO-вкладка помогает маркетингу понять, где страница плохо объясняет оффер в поиске и теряет клики ещё до захода на сайт.",
      },
      speed: {
        metrics: [["LCP", "9 шаблонов"], ["TTFB", "проверить API/CMS"], ["Images", "сжать hero/media"], ["Scripts", "убрать лишнее"]],
        actions: ["Начать с шаблонов, которые получают SEO-трафик или ведут на заявку.", "Оптимизировать изображения первого экрана.", "Отложить тяжёлые скрипты, не влияющие на первый экран."],
        urls: ["/", "/catalog/", "/landing/seo/"],
        note: "Скорость важна не как абстрактный балл, а как фактор отказов, конверсии и качества посадочных страниц.",
      },
      security: {
        metrics: [["SSL", "OK"], ["HSTS", "проверить"], ["CSP", "усилить"], ["Mixed content", "OK"]],
        actions: ["Сохранить корректный HTTPS-редирект.", "Добавить или проверить HSTS после теста всех поддоменов.", "Настроить CSP без поломки аналитики и форм."],
        urls: ["https://site.ru/", "https://site.ru/form/", "https://static.site.ru/"],
        note: "Базовая безопасность влияет на доверие пользователей, корректную работу браузера, форм и рекламных посадочных.",
      },
      a11y: {
        metrics: [["Alt", "проверить медиа"], ["Labels", "формы"], ["Focus", "клавиатура"], ["ARIA", "без лишнего"]],
        actions: ["Проверить формы заявки и поиска с клавиатуры.", "Добавить понятные labels для полей.", "Исправить alt у смысловых изображений, не дублируя декоративные."],
        urls: ["/contact/", "/order/", "/catalog/"],
        note: "Доступность снижает потери в формах, помогает пользователям с разными сценариями и делает интерфейс понятнее для сканирования.",
      },
      export: {
        metrics: [["PDF", "для клиента"], ["CSV", "для разработчика"], ["URL", "публичная ссылка"], ["History", "после повтора"]],
        actions: ["Отдать PDF как управленческую сводку.", "Передать CSV разработчику как список задач по URL.", "После исправлений запускать повторную проверку и сравнивать изменения."],
        urls: ["/report/site-ru.pdf", "/export/issues.csv", "/share/report/site-ru"],
        note: "Экспорт показан как формат будущего рабочего отчёта: менеджеру — выводы, SEO-специалисту — приоритеты, разработчику — конкретные URL и задачи.",
      },
    } satisfies Record<Exclude<TabId, "summary">, TabDetail>,
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
    nextDate: "25 May 2025",
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
    tabLabels: {
      signals: "Signals",
      actions: "What to do",
      urls: "Example URLs",
      note: "How to use it",
    },
    tabDetails: {
      priority: {
        metrics: [["P0", "blocks indexing"], ["P1", "hurts snippets/CTR"], ["P2", "technical debt"], ["OK", "watch after releases"]],
        actions: ["Open important URLs to search crawlers first.", "Restore descriptions on landing pages next.", "Then handle slow templates with traffic or lead impact."],
        urls: ["/catalog/", "/services/seo-audit/", "/blog/technical-seo-checklist/"],
        note: "Prioritization prevents budget waste on cosmetic work before fixing issues that cut traffic and leads.",
      },
      index: {
        metrics: [["robots.txt", "12 URLs blocked"], ["sitemap", "128 URLs found"], ["canonical", "passes"], ["noindex", "check templates"]],
        actions: ["Compare blocked URLs with commercial pages.", "Keep only indexable URLs in sitemap.", "Check canonical after redirects and tracking parameters."],
        urls: ["/catalog/", "/catalog/product-1/", "/landing/context-ads/"],
        note: "This tab answers whether search engines can see the required pages at all.",
      },
      seo: {
        metrics: [["Title", "duplicate check"], ["Description", "14 missing"], ["H1", "page structure"], ["OG", "link previews"]],
        actions: ["Write descriptions for pages with commercial demand.", "Align title and H1 with search intent.", "Add OG data for clean previews in messengers and social channels."],
        urls: ["/services/", "/prices/", "/cases/"],
        note: "The SEO tab helps marketing find pages that explain the offer poorly in search and lose clicks before the visit.",
      },
      speed: {
        metrics: [["LCP", "9 templates"], ["TTFB", "check API/CMS"], ["Images", "compress hero/media"], ["Scripts", "remove noncritical"]],
        actions: ["Start with templates that receive traffic or lead to forms.", "Optimize above-the-fold images.", "Defer heavy scripts that do not affect the first screen."],
        urls: ["/", "/catalog/", "/landing/seo/"],
        note: "Performance matters as a bounce, conversion, and landing-page quality issue, not just as a score.",
      },
      security: {
        metrics: [["SSL", "OK"], ["HSTS", "check"], ["CSP", "strengthen"], ["Mixed content", "OK"]],
        actions: ["Keep HTTPS redirects correct.", "Add or verify HSTS after checking subdomains.", "Configure CSP without breaking analytics and forms."],
        urls: ["https://site.com/", "https://site.com/form/", "https://static.site.com/"],
        note: "Baseline security affects trust, browser behavior, forms, and ad landing pages.",
      },
      a11y: {
        metrics: [["Alt", "check media"], ["Labels", "forms"], ["Focus", "keyboard"], ["ARIA", "avoid noise"]],
        actions: ["Check search and lead forms by keyboard.", "Add clear labels to fields.", "Fix alt text for meaningful images without duplicating decorative ones."],
        urls: ["/contact/", "/order/", "/catalog/"],
        note: "Accessibility reduces form losses, supports more user scenarios, and makes the interface easier to scan.",
      },
      export: {
        metrics: [["PDF", "for client"], ["CSV", "for developer"], ["URL", "public link"], ["History", "after re-check"]],
        actions: ["Use PDF as the management summary.", "Send CSV to developers as a URL-level task list.", "Run a re-check after fixes and compare changes."],
        urls: ["/report/site-example.pdf", "/export/issues.csv", "/share/report/site-example"],
        note: "Export is shown as the future working-report format: conclusions for managers, priorities for SEO, and concrete URL tasks for developers.",
      },
    } satisfies Record<Exclude<TabId, "summary">, TabDetail>,
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

function IssueRow({ issue }: { issue: DemoIssue }) {
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

function DetailPanel({ locale, id, hidden, title, text, detail }: { locale: Locale; id: Exclude<TabId, "summary">; hidden: boolean; title: string; text: string; detail: TabDetail }) {
  const labels = copy[locale].tabLabels;
  return (
    <div className="wd-report-panel" id={`wd-report-${id}`} role="tabpanel" aria-labelledby={`wd-report-tab-${id}`} tabIndex={0} hidden={hidden}>
      <div className="wd-report-heading"><div><h3>{title}</h3><p>{text}</p></div></div>
      <div className="wd-report-detail-grid">
        <section className="wd-report-detail-main" aria-label={labels.signals}>
          <h4>{labels.signals}</h4>
          <div className="wd-report-signal-grid">
            {detail.metrics.map(([value, label]) => <article key={`${value}-${label}`}><strong>{value}</strong><span>{label}</span></article>)}
          </div>
        </section>
        <section className="wd-report-detail-main" aria-label={labels.actions}>
          <h4>{labels.actions}</h4>
          <ol className="wd-report-action-list">
            {detail.actions.map((item) => <li key={item}>{item}</li>)}
          </ol>
        </section>
        <aside className="wd-report-detail-side" aria-label={labels.urls}>
          <h4>{labels.urls}</h4>
          <ul>
            {detail.urls.map((url) => <li key={url}><Link2 aria-hidden="true" />{url}</li>)}
          </ul>
        </aside>
        <aside className="wd-report-detail-side is-note" aria-label={labels.note}>
          <h4>{labels.note}</h4>
          <p>{detail.note}</p>
        </aside>
      </div>
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
              <p><span>{t.checked}</span><b>128 / 128</b></p>
              <p><span>{t.next}</span><b>{t.nextDate}</b></p>
              <PreviewAction>{t.repeat}</PreviewAction>
            </div>
          </div>
          <div className="wd-report-content">
            <SummaryPanel locale={locale} hidden={active !== "summary"} />
            <DetailPanel locale={locale} id="priority" hidden={active !== "priority"} title={t.priorityTitle} text={t.priorityText} detail={t.tabDetails.priority} />
            <DetailPanel locale={locale} id="index" hidden={active !== "index"} title={t.indexTitle} text={t.indexText} detail={t.tabDetails.index} />
            <DetailPanel locale={locale} id="seo" hidden={active !== "seo"} title={t.seoTitle} text={t.seoText} detail={t.tabDetails.seo} />
            <DetailPanel locale={locale} id="speed" hidden={active !== "speed"} title={t.speedTitle} text={t.speedText} detail={t.tabDetails.speed} />
            <DetailPanel locale={locale} id="security" hidden={active !== "security"} title={t.securityTitle} text={t.securityText} detail={t.tabDetails.security} />
            <DetailPanel locale={locale} id="a11y" hidden={active !== "a11y"} title={t.a11yTitle} text={t.a11yText} detail={t.tabDetails.a11y} />
            <DetailPanel locale={locale} id="export" hidden={active !== "export"} title={t.exportTitle} text={t.exportText} detail={t.tabDetails.export} />
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
