"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { filterCatalogTools, safeInitialCategory, type CatalogTool } from "./catalog-utils";

interface CategoryOption {
  readonly id: string;
  readonly title: string;
  readonly count: number;
}

function CatalogGlyph({ category }: { category: string }) {
  if (category === "development-data") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 8-4 4 4 4m8-8 4 4-4 4M14 4l-4 16" /></svg>;
  if (category === "css-design") return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 3v9l6 3" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m7 15 3-3 2 2 3-4 2 3" /></svg>;
}

function subscribeToLocation(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

function getUrlCategory(): string {
  return new URLSearchParams(window.location.search).get("category") ?? "";
}

function getServerUrlCategory(): string {
  return "";
}

export function ToolCatalog({ locale, tools, categories }: { locale: Locale; tools: readonly CatalogTool[]; categories: readonly CategoryOption[] }) {
  const categoryIds = categories.map((item) => item.id);
  const urlCategory = useSyncExternalStore(subscribeToLocation, getUrlCategory, getServerUrlCategory);
  const [query, setQuery] = useState("");
  const [categoryOverride, setCategoryOverride] = useState<string | null>(null);
  const category = categoryOverride ?? safeInitialCategory(urlCategory, categoryIds);
  const filtered = useMemo(() => filterCatalogTools(tools, query, category), [tools, query, category]);
  const prefix = locale === "ru" ? "" : "/en";
  const text = locale === "ru"
    ? {
        search: "Поиск по инструментам",
        placeholder: "Например, JSON, изображение или UUID",
        all: "Все",
        found: "Найдено",
        local: "В браузере",
        open: "Открыть",
        emptyTitle: "Ничего не найдено",
        emptyText: "Измените запрос или выберите другую категорию.",
        reset: "Сбросить фильтры",
        categoryLabel: "Категория инструментов",
      }
    : {
        search: "Search tools",
        placeholder: "Try JSON, image, or UUID",
        all: "All",
        found: "Found",
        local: "In browser",
        open: "Open",
        emptyTitle: "No tools found",
        emptyText: "Change the query or select another category.",
        reset: "Reset filters",
        categoryLabel: "Tool category",
      };

  function chooseCategory(next: string) {
    setCategoryOverride(next);
    const url = new URL(window.location.href);
    if (next === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", next);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function reset() {
    setQuery("");
    chooseCategory("all");
  }

  const visibleGroups = categories
    .map((item) => ({ ...item, tools: filtered.filter((tool) => tool.category === item.id) }))
    .filter((item) => item.tools.length > 0);

  return (
    <div className="catalog-shell">
      <div className="catalog-controls">
        <label className="catalog-search">
          <span className="sr-only">{text.search}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text.placeholder} autoComplete="off" />
          {query && <button type="button" onClick={() => setQuery("")} aria-label={locale === "ru" ? "Очистить поиск" : "Clear search"}>×</button>}
        </label>
        <div className="category-tabs" role="group" aria-label={locale === "ru" ? "Категории инструментов" : "Tool categories"}>
          <button type="button" className={category === "all" ? "is-active" : ""} aria-pressed={category === "all"} onClick={() => chooseCategory("all")}>{text.all}<span>{tools.length}</span></button>
          {categories.map((item) => <button type="button" className={category === item.id ? "is-active" : ""} aria-pressed={category === item.id} onClick={() => chooseCategory(item.id)} key={item.id}>{item.title}<span>{item.count}</span></button>)}
        </div>
      </div>

      <div className="catalog-summary" aria-live="polite"><span>{text.found}: <strong>{filtered.length}</strong></span></div>

      {visibleGroups.length ? (
        <div className="catalog-groups">
          {visibleGroups.map((group) => (
            <section className="catalog-group" id={group.id} key={group.id} aria-labelledby={`catalog-${group.id}`}>
              <header className="catalog-group-heading">
                <span className="category-symbol"><CatalogGlyph category={group.id} /></span>
                <div><span>{text.categoryLabel}</span><h2 id={`catalog-${group.id}`}>{group.title}</h2></div>
                <strong>{group.tools.length}</strong>
              </header>
              <div className="compact-tool-grid">
                {group.tools.map((tool) => (
                  <Link className="compact-tool-card" href={`${prefix}/tools/${tool.slug}`} key={tool.slug}>
                    <div className="compact-tool-card-main"><span className="compact-tool-icon"><CatalogGlyph category={tool.category} /></span><div><h3>{tool.title}</h3><p>{tool.description}</p></div></div>
                    <footer>{tool.local ? <span className="local-badge"><i aria-hidden="true" />{text.local}</span> : <span />}<span className="tool-open">{text.open}<span aria-hidden="true">↗</span></span></footer>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="empty-state"><span aria-hidden="true">⌕</span><h2>{text.emptyTitle}</h2><p>{text.emptyText}</p><button className="button button-secondary" type="button" onClick={reset}>{text.reset}</button></div>
      )}
    </div>
  );
}
