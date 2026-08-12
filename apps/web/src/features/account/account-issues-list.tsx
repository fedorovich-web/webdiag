"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { accountErrorMessage } from "./account-messages";
import {
  listAccountIssues,
  type AccountIssueCategory,
  type AccountIssueFilters,
  type AccountIssueListResponse,
  type AccountIssueOrder,
  type AccountIssuePriority,
  type AccountIssueSort,
} from "./account-issues-contract";
import { savedAuditIssuePath, savedAuditPath } from "../../lib/routes";

const categoryOptions: readonly AccountIssueCategory[] = [
  "seo", "performance", "accessibility", "security", "content", "technical",
];
const priorityOptions: readonly AccountIssuePriority[] = ["p0", "p1", "p2", "p3"];

const categoryLabels: Record<Locale, Record<AccountIssueCategory, string>> = {
  ru: {
    seo: "SEO",
    performance: "Производительность",
    accessibility: "Доступность",
    security: "Безопасность",
    content: "Контент",
    technical: "Технические",
  },
  en: {
    seo: "SEO",
    performance: "Performance",
    accessibility: "Accessibility",
    security: "Security",
    content: "Content",
    technical: "Technical",
  },
};

export function AccountIssuesList({
  locale,
  projectId,
  auditId,
}: {
  readonly locale: Locale;
  readonly projectId: string;
  readonly auditId: string;
}) {
  const ru = locale === "ru";
  const [filters, setFilters] = useState<AccountIssueFilters>({
    sort: "priority",
    order: "asc",
  });
  const [result, setResult] = useState<AccountIssueListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    listAccountIssues(projectId, auditId, filters)
      .then((value) => { if (active) setResult(value); })
      .catch((caught) => { if (active) setError(accountErrorMessage(locale, caught)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [auditId, filters, locale, projectId]);

  const category = filters.category ?? "";
  const priority = filters.priority ?? "";
  const sort = filters.sort ?? "priority";
  const order = filters.order ?? "asc";

  return (
    <section className="wd-account-dashboard wd-account-issues-page">
      <nav className="wd-account-breadcrumb" aria-label={ru ? "Навигация кабинета" : "Account navigation"}>
        <Link href={savedAuditPath(locale, projectId, auditId)}>
          {ru ? "Сохранённый аудит" : "Saved audit"}
        </Link>
        <span aria-hidden="true">/</span>
        <span>{ru ? "Проблемы и приоритеты" : "Issues and priorities"}</span>
      </nav>

      <header className="wd-account-section-head">
        <div>
          <span className="eyebrow">{ru ? "Детерминированный порядок" : "Deterministic order"}</span>
          <h1>{ru ? "Проблемы и приоритеты" : "Issues and priorities"}</h1>
          <p>{ru
            ? "Порядок рассчитан из сохранённых приоритета и критичности, без псевдо-AI выводов."
            : "Order is derived from persisted priority and severity without pseudo-AI conclusions."}</p>
        </div>
        {result && <strong>{result.total}</strong>}
      </header>

      <div className="wd-issue-filters" aria-label={ru ? "Фильтры проблем" : "Issue filters"}>
        <label>
          <span>{ru ? "Категория" : "Category"}</span>
          <select
            value={category}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setFilters((current) => ({
              ...current,
              category: event.target.value
                ? event.target.value as AccountIssueCategory
                : undefined,
            }))}
          >
            <option value="">{ru ? "Все категории" : "All categories"}</option>
            {categoryOptions.map((value) => (
              <option key={value} value={value}>{categoryLabels[locale][value]}</option>
            ))}
          </select>
        </label>
        <label>
          <span>{ru ? "Приоритет" : "Priority"}</span>
          <select
            value={priority}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setFilters((current) => ({
              ...current,
              priority: event.target.value
                ? event.target.value as AccountIssuePriority
                : undefined,
            }))}
          >
            <option value="">{ru ? "Все приоритеты" : "All priorities"}</option>
            {priorityOptions.map((value) => (
              <option key={value} value={value}>{value.toUpperCase()}</option>
            ))}
          </select>
        </label>
        <label>
          <span>{ru ? "Сортировка" : "Sort"}</span>
          <select
            value={sort}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setFilters((current) => ({
              ...current,
              sort: event.target.value as AccountIssueSort,
            }))}
          >
            <option value="priority">{ru ? "Что исправить сначала" : "Fix first"}</option>
            <option value="category">{ru ? "Категория" : "Category"}</option>
            <option value="title">{ru ? "Название" : "Title"}</option>
          </select>
        </label>
        <label>
          <span>{ru ? "Направление" : "Direction"}</span>
          <select
            value={order}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setFilters((current) => ({
              ...current,
              order: event.target.value as AccountIssueOrder,
            }))}
          >
            <option value="asc">{ru ? "По возрастанию" : "Ascending"}</option>
            <option value="desc">{ru ? "По убыванию" : "Descending"}</option>
          </select>
        </label>
      </div>

      {loading && <div className="wd-account-card" aria-busy="true"><p>{ru ? "Загружаем проблемы…" : "Loading issues…"}</p></div>}
      {error && <p className="wd-account-error" role="alert">{error}</p>}
      {!loading && result?.items.length === 0 && (
        <div className="wd-account-card wd-account-empty">
          <h2>{ru ? "По выбранным фильтрам проблем нет" : "No issues match these filters"}</h2>
        </div>
      )}
      {!loading && result && result.items.length > 0 && (
        <div className="wd-priority-issue-list">
          {result.items.map((issue) => (
            <article key={issue.issue_id}>
              <div className="wd-priority-order" aria-label={ru ? "Порядок исправления" : "Fix order"}>
                {issue.fix_order}
              </div>
              <div>
                <div className="wd-priority-meta">
                  <span>{issue.priority.toUpperCase()}</span>
                  <span>{categoryLabels[locale][issue.category]}</span>
                  <span>{issue.severity}</span>
                </div>
                <h2>
                  <Link href={savedAuditIssuePath(locale, projectId, auditId, issue.issue_id)}>
                    {issue.title}
                  </Link>
                </h2>
                <p>{issue.description}</p>
                <strong>{issue.recommendation.summary}</strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
