"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState, useSyncExternalStore } from "react";
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  FileText,
  Gauge,
  Image as ImageIcon,
  Link2,
  Map,
  MonitorCheck,
  Network,
  Route,
  Search,
  SearchCheck,
  Send,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { Locale } from "@webdiag/tool-registry";
import { filterCatalogTools, safeInitialCategory, type CatalogTool } from "./catalog-utils";

interface CategoryOption {
  readonly id: string;
  readonly title: string;
  readonly count: number;
}

const PAGE_SIZE = 20;

const categoryIcons: Record<string, LucideIcon> = {
  "seo-audit": SearchCheck,
  performance: Gauge,
  "security-network": ShieldCheck,
  "css-design": MonitorCheck,
  "media-utilities": ImageIcon,
  "development-data": FileText,
};

const toolIcons: Record<string, LucideIcon> = {
  "single-page-audit": SearchCheck,
  "core-web-vitals-checker": Gauge,
  "robots-txt-tester": Bot,
  "sitemap-validator": Map,
  "redirect-chain-checker": Route,
  "ssl-certificate-checker": ShieldCheck,
  "meta-tags-checker": FileText,
  "image-seo-audit": ImageIcon,
  "canonical-checker": Link2,
  "hreflang-checker": Network,
  "structured-data-validator": FileText,
  "color-contrast-checker": MonitorCheck,
  "broken-link-checker": Link2,
  "heading-structure-checker": FileText,
  "indexability-checker": SearchCheck,
};

function subscribeToLocation(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

function getUrlCategory(): string {
  return new URLSearchParams(window.location.search).get("category") ?? "";
}

function getUrlQuery(): string {
  return new URLSearchParams(window.location.search).get("q") ?? "";
}

function getServerUrlCategory(): string {
  return "";
}

function getServerUrlQuery(): string {
  return "";
}

function categoryLabel(id: string, locale: Locale): string {
  const ru: Record<string, string> = {
    all: "Все инструменты",
    "seo-audit": "SEO-аудит",
    performance: "Скорость",
    "security-network": "Безопасность",
    "css-design": "Доступность",
    "media-utilities": "Изображения",
    "development-data": "Разработка",
  };
  const en: Record<string, string> = {
    all: "All tools",
    "seo-audit": "SEO audit",
    performance: "Speed",
    "security-network": "Security",
    "css-design": "Accessibility",
    "media-utilities": "Images",
    "development-data": "Development",
  };
  return (locale === "ru" ? ru : en)[id] ?? id;
}

function CategoryIcon({ id }: { id: string }) {
  const Icon = id === "all" ? SearchCheck : categoryIcons[id] ?? SearchCheck;
  return <Icon aria-hidden="true" />;
}

function ToolGlyph({ tool }: { tool: CatalogTool }) {
  const Icon = toolIcons[tool.slug] ?? categoryIcons[tool.category] ?? SearchCheck;
  return <Icon aria-hidden="true" />;
}

export function ToolCatalog({
  locale,
  tools,
  categories,
}: {
  locale: Locale;
  tools: readonly CatalogTool[];
  categories: readonly CategoryOption[];
}) {
  const categoryIds = categories.map((item) => item.id);
  const urlCategory = useSyncExternalStore(subscribeToLocation, getUrlCategory, getServerUrlCategory);
  const urlQuery = useSyncExternalStore(subscribeToLocation, getUrlQuery, getServerUrlQuery);
  const [draftQueryOverride, setDraftQueryOverride] = useState<string | null>(null);
  const [queryOverride, setQueryOverride] = useState<string | null>(null);
  const [categoryOverride, setCategoryOverride] = useState<string | null>(null);
  const [sort, setSort] = useState<"popular" | "az">("popular");
  const [page, setPage] = useState(1);
  const [suggestion, setSuggestion] = useState("");

  const category = categoryOverride ?? safeInitialCategory(urlCategory, categoryIds);
  const draftQuery = draftQueryOverride ?? urlQuery;
  const query = queryOverride ?? urlQuery.trim();

  const filtered = useMemo(() => {
    const result = filterCatalogTools(tools, query, category);
    return sort === "az"
      ? [...result].sort((a, b) => a.title.localeCompare(b.title, locale === "ru" ? "ru" : "en"))
      : result;
  }, [tools, query, category, sort, locale]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageTools = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const prefix = locale === "ru" ? "" : "/en";

  const copy = locale === "ru"
    ? {
        eyebrow: "Инструменты WebDiag",
        title: "Все инструменты",
        lead: "Более 140+ бесплатных инструментов для анализа, диагностики и улучшения вашего сайта. Выберите нужный инструмент или найдите его через поиск.",
        placeholder: "Найдите инструмент... например «robots.txt» или «скорость сайта»",
        find: "Найти",
        hint: "Например: robots.txt, sitemap, редиректы, скорость, HTTPS, изображения",
        sort: "Сортировка:",
        popular: "По популярности",
        alphabet: "По названию",
        results: "Найденные инструменты",
        emptyTitle: "Ничего не найдено",
        emptyText: "Измените запрос или выберите другую категорию.",
        reset: "Сбросить фильтры",
        prev: "Предыдущая страница",
        next: "Следующая страница",
        perPage: "Показывать по:",
        suggestionTitle: "Не нашли нужный инструмент?",
        suggestionText: "Расскажите, какой инструмент вам нужен, и мы рассмотрим возможность его добавления в WebDiag.",
        suggestionPlaceholder: "Опишите нужный инструмент...",
        suggestionButton: "Предложить инструмент",
      }
    : {
        eyebrow: "WebDiag tools",
        title: "All tools",
        lead: "More than 140 free tools for analyzing, diagnosing and improving your website. Choose a tool or find it through search.",
        placeholder: "Find a tool... for example “robots.txt” or “site speed”",
        find: "Find",
        hint: "For example: robots.txt, sitemap, redirects, speed, HTTPS, images",
        sort: "Sort:",
        popular: "Most popular",
        alphabet: "By name",
        results: "Matching tools",
        emptyTitle: "No tools found",
        emptyText: "Change the query or select another category.",
        reset: "Reset filters",
        prev: "Previous page",
        next: "Next page",
        perPage: "Show:",
        suggestionTitle: "Can't find the tool you need?",
        suggestionText: "Tell us what you need and we will consider adding it to WebDiag.",
        suggestionPlaceholder: "Describe the tool you need...",
        suggestionButton: "Suggest a tool",
      };

  function chooseCategory(next: string) {
    setCategoryOverride(next);
    setPage(1);
    const url = new URL(window.location.href);
    if (next === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", next);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQueryOverride(draftQuery.trim());
    setPage(1);
  }

  function reset() {
    setDraftQueryOverride("");
    setQueryOverride("");
    setSort("popular");
    chooseCategory("all");
  }

  function submitSuggestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = suggestion.trim();
    if (!value) return;
    const subject = locale === "ru" ? "Предложение инструмента для WebDiag" : "WebDiag tool suggestion";
    window.location.href = `mailto:support@webdiag.ru?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(value)}`;
  }

  const heading = category === "all" && !query ? copy.title : copy.results;
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <>
      <section className="wd-tools-hero" aria-labelledby="tools-title">
        <div className="shell wd-tools-hero-grid">
          <div className="wd-tools-hero-copy">
            <span className="wd-eyebrow">{copy.eyebrow}</span>
            <h1 id="tools-title">{copy.title}</h1>
            <p>{copy.lead}</p>
            <form className="wd-tools-search" onSubmit={submitSearch}>
              <Search aria-hidden="true" />
              <input
                type="search"
                value={draftQuery}
                onChange={(event) => setDraftQueryOverride(event.target.value)}
                placeholder={copy.placeholder}
                aria-label={copy.placeholder}
                autoComplete="off"
              />
              <button type="submit">{copy.find}<span aria-hidden="true">→</span></button>
            </form>
            <small className="wd-tools-search-hint">{copy.hint}</small>
          </div>
          <div className="wd-tools-hero-art" aria-hidden="true">
            <img src={locale === "ru" ? "/design/hero/tools.webp" : "/design/icons/analytics.webp"} alt="" width="900" height="900" loading="lazy" decoding="async" />
          </div>
        </div>
      </section>

      <section className="wd-tools-catalog-section">
        <div className="shell">
          <div className="wd-tools-tabs" role="group" aria-label={locale === "ru" ? "Категории инструментов" : "Tool categories"}>
            <button type="button" className={category === "all" ? "is-active" : ""} aria-pressed={category === "all"} onClick={() => chooseCategory("all")}>
              <CategoryIcon id="all" />{categoryLabel("all", locale)}
            </button>
            {categories.map((item) => (
              <button type="button" className={category === item.id ? "is-active" : ""} aria-pressed={category === item.id} onClick={() => chooseCategory(item.id)} key={item.id}>
                <CategoryIcon id={item.id} />{categoryLabel(item.id, locale)}
              </button>
            ))}
          </div>

          <div className="wd-tools-list-head">
            <h2>{heading} <span>({filtered.length})</span></h2>
            <label>
              <span>{copy.sort}</span>
              <select value={sort} onChange={(event) => { setSort(event.target.value as "popular" | "az"); setPage(1); }}>
                <option value="popular">{copy.popular}</option>
                <option value="az">{copy.alphabet}</option>
              </select>
            </label>
          </div>

          {pageTools.length ? (
            <div className="wd-tools-grid">
              {pageTools.map((tool) => (
                <Link className="wd-tool-card" prefetch={false} href={`${prefix}/tools/${tool.slug}`} key={tool.slug}>
                  <span className={`wd-tool-card-icon is-${tool.category}`}><ToolGlyph tool={tool} /></span>
                  <span className="wd-tool-card-copy"><strong>{tool.title}</strong><small>{tool.description}</small></span>
                  <ChevronRight className="wd-tool-card-arrow" aria-hidden="true" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="wd-tools-empty">
              <Search aria-hidden="true" />
              <h2>{copy.emptyTitle}</h2>
              <p>{copy.emptyText}</p>
              <button type="button" onClick={reset}>{copy.reset}</button>
            </div>
          )}

          {filtered.length > PAGE_SIZE && (
            <div className="wd-tools-pagination" aria-label={locale === "ru" ? "Навигация по страницам" : "Pagination"}>
              <button type="button" aria-label={copy.prev} disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft aria-hidden="true" /></button>
              <div>
                {pageNumbers.map((value) => (
                  <button type="button" className={value === safePage ? "is-active" : ""} aria-current={value === safePage ? "page" : undefined} onClick={() => setPage(value)} key={value}>{value}</button>
                ))}
              </div>
              <button type="button" aria-label={copy.next} disabled={safePage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><ChevronRight aria-hidden="true" /></button>
              <span className="wd-tools-per-page">{copy.perPage}<b>{PAGE_SIZE}</b></span>
            </div>
          )}

          <section className="wd-tools-suggest">
            <div>
              <h2>{copy.suggestionTitle}</h2>
              <p>{copy.suggestionText}</p>
            </div>
            <form onSubmit={submitSuggestion}>
              <span><Send aria-hidden="true" /><input value={suggestion} onChange={(event) => setSuggestion(event.target.value)} placeholder={copy.suggestionPlaceholder} aria-label={copy.suggestionPlaceholder} /></span>
              <button type="submit">{copy.suggestionButton}<span aria-hidden="true">→</span></button>
            </form>
          </section>
        </div>
      </section>
    </>
  );
}
