import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CircleHelp,
  Crown,
  Grid3X3,
  Home,
  Search,
  SearchCheck,
} from "lucide-react";
import { getPublicTool, localize, type Locale } from "@webdiag/tool-registry";
import { homePath, toolsPath } from "../../lib/routes";

const popularToolSlugs = [
  "single-page-audit",
  "robots-txt-tester",
  "sitemap-validator",
  "redirect-chain-checker",
] as const;

export function NotFoundPage({ locale }: { locale: Locale }) {
  const ru = locale === "ru";
  const copy = ru
    ? {
        eyebrow: "Ошибка 404",
        title: "Страница не найдена",
        lead: "Похоже, этой страницы больше нет или она была перемещена. Возможно, вы перешли по устаревшей ссылке или допустили опечатку в адресе.",
        home: "На главную",
        tools: "Все инструменты",
        searchTitle: "Найдите нужную страницу",
        searchLead: "Введите название проверки или тему — каталог WebDiag отфильтрует подходящие инструменты.",
        searchPlaceholder: "Например: robots.txt, карта сайта, редиректы...",
        searchAction: "Найти",
        maybe: "Возможно, вы искали",
        maybeLead: "Основные разделы WebDiag, которые могут быть полезны.",
        popular: "Популярные инструменты",
        popularLead: "Быстрый доступ к часто используемым проверкам.",
        supportTitle: "Всё ещё не нашли, что искали?",
        supportLead: "Напишите нам — поможем найти нужный раздел или разобраться с работой WebDiag.",
        supportAction: "Связаться с поддержкой",
      }
    : {
        eyebrow: "Error 404",
        title: "Page not found",
        lead: "This page may no longer exist or may have moved. You may have followed an outdated link or mistyped the address.",
        home: "Go home",
        tools: "All tools",
        searchTitle: "Find the page you need",
        searchLead: "Enter a check name or topic and the WebDiag catalog will filter the relevant tools.",
        searchPlaceholder: "For example: robots.txt, sitemap, redirects...",
        searchAction: "Find",
        maybe: "You may be looking for",
        maybeLead: "Main WebDiag sections that may help.",
        popular: "Popular tools",
        popularLead: "Quick access to commonly used checks.",
        supportTitle: "Still can't find what you need?",
        supportLead: "Contact us and we will help you find the right section or resolve a WebDiag question.",
        supportAction: "Contact support",
      };
  const prefix = ru ? "" : "/en";
  const sections = [
    { href: homePath(locale), icon: Home, title: ru ? "Главная страница" : "Homepage", text: ru ? "Обзор возможностей WebDiag и запуск быстрой проверки." : "WebDiag overview and a quick website check." },
    { href: toolsPath(locale), icon: Grid3X3, title: ru ? "Все инструменты" : "All tools", text: ru ? "Каталог технических, SEO- и web-инструментов." : "Technical, SEO, and web-tool catalog." },
    { href: `${prefix}/knowledge`, icon: BookOpen, title: ru ? "База знаний" : "Knowledge base", text: ru ? "Руководства и объяснения по техническому аудиту." : "Guides and explanations for technical audits." },
    { href: `${prefix}/audit`, icon: SearchCheck, title: ru ? "SEO-аудит сайта" : "SEO website audit", text: ru ? "Проверка технических и SEO-сигналов сайта." : "Check technical and SEO website signals." },
    { href: `${prefix}/pricing`, icon: Crown, title: ru ? "Тарифы" : "Pricing", text: ru ? "Условия доступа к функциям WebDiag." : "WebDiag feature access terms." },
    { href: `${prefix}/contacts`, icon: CircleHelp, title: ru ? "Поддержка" : "Support", text: ru ? "Контакты для вопросов о сервисе и аккаунте." : "Contact options for product and account questions." },
  ] as const;
  const popularTools = popularToolSlugs
    .map((slug) => getPublicTool(slug))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool));

  return (
    <main className="wd-not-found">
      <section className="shell wd-not-found-grid">
        <div className="wd-not-found-copy">
          <span className="wd-eyebrow">{copy.eyebrow}</span>
          <strong className="wd-not-found-code" aria-hidden="true">404</strong>
          <h1>{copy.title}</h1>
          <p>{copy.lead}</p>
          <div className="wd-not-found-actions">
            <Link href={homePath(locale)}><Home aria-hidden="true" />{copy.home}<ArrowRight aria-hidden="true" /></Link>
            <Link className="is-secondary" href={toolsPath(locale)}><Grid3X3 aria-hidden="true" />{copy.tools}</Link>
          </div>
        </div>
        <div className="wd-not-found-art" aria-hidden="true">
          <img src="/design/hero/404.webp" alt="" width="900" height="900" loading="lazy" decoding="async" />
        </div>
      </section>

      <section className="shell wd-not-found-search" aria-labelledby="not-found-search-title">
        <div>
          <h2 id="not-found-search-title">{copy.searchTitle}</h2>
          <p>{copy.searchLead}</p>
        </div>
        <form action={toolsPath(locale)} method="get">
          <Search aria-hidden="true" />
          <input name="q" type="search" placeholder={copy.searchPlaceholder} maxLength={120} />
          <button type="submit">{copy.searchAction}<ArrowRight aria-hidden="true" /></button>
        </form>
      </section>

      <section className="shell wd-not-found-section" aria-labelledby="not-found-sections-title">
        <header>
          <h2 id="not-found-sections-title">{copy.maybe}</h2>
          <p>{copy.maybeLead}</p>
        </header>
        <div className="wd-not-found-card-grid">
          {sections.map(({ href, icon: Icon, title, text }) => (
            <Link href={href} key={href}>
              <span><Icon aria-hidden="true" /></span>
              <div><strong>{title}</strong><small>{text}</small></div>
              <ArrowRight aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <section className="shell wd-not-found-section wd-not-found-popular" aria-labelledby="not-found-popular-title">
        <header>
          <h2 id="not-found-popular-title">{copy.popular}</h2>
          <p>{copy.popularLead}</p>
        </header>
        <div className="wd-not-found-tool-grid">
          {popularTools.map((tool) => (
            <Link href={`${toolsPath(locale)}/${tool.slug}`} key={tool.slug}>
              <SearchCheck aria-hidden="true" />
              <div>
                <strong>{localize(tool.title, locale)}</strong>
                <small>{tool.description ? localize(tool.description, locale) : ""}</small>
              </div>
              <ArrowRight aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <section className="wd-not-found-support">
        <div className="shell">
          <div><h2>{copy.supportTitle}</h2><p>{copy.supportLead}</p></div>
          <Link href={`${prefix}/contacts`}><CircleHelp aria-hidden="true" />{copy.supportAction}<ArrowRight aria-hidden="true" /></Link>
        </div>
      </section>
    </main>
  );
}
