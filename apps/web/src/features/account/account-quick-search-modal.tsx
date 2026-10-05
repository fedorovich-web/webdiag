"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, FileBarChart2, FolderKanban, Search, Settings, Sparkles, Wrench, X } from "lucide-react";
import type { Locale } from "@webdiag/tool-registry";
import { accountAIPath, accountSettingsPath, reportsPath } from "../../lib/routes";
import { getPublicCatalogTools } from "../tools/public-catalog-data";

interface AccountQuickSearchModalProps {
  readonly locale: Locale;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function AccountQuickSearchModal({ locale, isOpen, onClose }: AccountQuickSearchModalProps) {
  const ru = locale === "ru";
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = window.setTimeout(() => {
        setQuery("");
        inputRef.current?.focus();
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const quickLinks = useMemo(() => [
    {
      title: ru ? "Все 140+ инструментов" : "All 140+ tools",
      category: ru ? "Каталог" : "Catalog",
      href: ru ? "/tools" : "/en/tools",
      icon: Wrench,
    },
    {
      title: ru ? "AI-инструменты и генераторы" : "AI tools and generators",
      category: "AI",
      href: accountAIPath(locale),
      icon: Sparkles,
    },
    {
      title: ru ? "Мои проекты" : "My projects",
      category: ru ? "Кабинет" : "Account",
      href: ru ? "/account#projects" : "/en/account#projects",
      icon: FolderKanban,
    },
    {
      title: ru ? "Отчёты и аудиты" : "Reports and audits",
      category: ru ? "Кабинет" : "Account",
      href: reportsPath(locale),
      icon: FileBarChart2,
    },
    {
      title: ru ? "Настройки аккаунта" : "Account settings",
      category: ru ? "Кабинет" : "Account",
      href: accountSettingsPath(locale),
      icon: Settings,
    },
  ], [locale, ru]);

  const allTools = useMemo(() => getPublicCatalogTools(locale), [locale]);

  const filteredTools = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allTools
      .filter((tool) => {
        const title = tool.title.toLowerCase();
        const desc = tool.description.toLowerCase();
        const cat = tool.categoryTitle.toLowerCase();
        return title.includes(q) || desc.includes(q) || cat.includes(q) || tool.slug.includes(q);
      })
      .slice(0, 15);
  }, [allTools, query]);

  if (!isOpen) return null;

  return (
    <div
      className="wd-quick-search-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={ru ? "Быстрый поиск по инструментам" : "Quick search tools"}
    >
      <div
        className="wd-quick-search-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="wd-quick-search-header">
          <Search className="wd-quick-search-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            className="wd-quick-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ru ? "Поиск по всем 140+ инструментам и разделам…" : "Search all 140+ tools and sections…"}
            aria-label={ru ? "Поиск" : "Search"}
          />
          {query && (
            <button
              type="button"
              className="wd-quick-search-clear"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label={ru ? "Очистить" : "Clear"}
            >
              <X aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            className="wd-quick-search-close"
            onClick={onClose}
            aria-label={ru ? "Закрыть" : "Close"}
          >
            <span className="wd-quick-search-key">ESC</span>
          </button>
        </div>

        <div className="wd-quick-search-body">
          {query.trim().length === 0 ? (
            <div className="wd-quick-search-section">
              <span className="wd-quick-search-section-title">
                {ru ? "Быстрые разделы" : "Quick navigation"}
              </span>
              <div className="wd-quick-search-list">
                {quickLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="wd-quick-search-item"
                      onClick={onClose}
                    >
                      <span className="wd-quick-search-item-icon">
                        <Icon aria-hidden="true" />
                      </span>
                      <div className="wd-quick-search-item-copy">
                        <strong>{item.title}</strong>
                        <small>{item.category}</small>
                      </div>
                      <ArrowRight className="wd-quick-search-item-arrow" aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : filteredTools.length > 0 ? (
            <div className="wd-quick-search-section">
              <span className="wd-quick-search-section-title">
                {ru ? `Найдено инструментов (${filteredTools.length})` : `Tools found (${filteredTools.length})`}
              </span>
              <div className="wd-quick-search-list">
                {filteredTools.map((tool) => {
                  const toolHref = ru ? `/tools/${tool.slug}` : `/en/tools/${tool.slug}`;
                  return (
                    <Link
                      key={tool.slug}
                      href={tool.href || toolHref}
                      className="wd-quick-search-item"
                      onClick={onClose}
                    >
                      <span className="wd-quick-search-item-icon">
                        <Wrench aria-hidden="true" />
                      </span>
                      <div className="wd-quick-search-item-copy">
                        <strong>{tool.title}</strong>
                        <small>{tool.categoryTitle}</small>
                      </div>
                      <ArrowRight className="wd-quick-search-item-arrow" aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="wd-quick-search-empty">
              <p>{ru ? "Ничего не найдено по запросу" : "No tools found matching your query"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
