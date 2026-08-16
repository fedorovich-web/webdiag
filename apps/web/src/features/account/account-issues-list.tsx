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
import {
  defaultAccountIssueFilters,
  formatAffectedUrlCount,
  hasActiveAccountIssueFilters,
  issueCategoryLabel,
  issuePriorityLabel,
} from "./account-issues-presentation";
import { savedAuditIssuePath, savedAuditPath } from "../../lib/routes";

const categoryOptions: readonly AccountIssueCategory[] = [
  "seo", "performance", "accessibility", "security", "content", "technical",
];
const priorityOptions: readonly AccountIssuePriority[] = ["p0", "p1", "p2", "p3"];

interface AccountIssuesRequestState {
  readonly key: string;
  readonly result: AccountIssueListResponse | null;
  readonly error: string;
}

function accountIssuesRequestKey(
  locale: Locale,
  projectId: string,
  auditId: string,
  filters: AccountIssueFilters,
): string {
  return JSON.stringify([
    locale,
    projectId,
    auditId,
    filters.category ?? null,
    filters.priority ?? null,
    filters.sort ?? "priority",
    filters.order ?? "asc",
  ]);
}

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
  const [filters, setFilters] = useState<AccountIssueFilters>(defaultAccountIssueFilters);
  const [requestState, setRequestState] = useState<AccountIssuesRequestState>({
    key: "",
    result: null,
    error: "",
  });
  const requestKey = accountIssuesRequestKey(locale, projectId, auditId, filters);
  const loading = requestState.key !== requestKey;
  const result = requestState.result;
  const error = requestState.key === requestKey ? requestState.error : "";

  useEffect(() => {
    let active = true;
    listAccountIssues(projectId, auditId, { ...filters, locale })
      .then((value) => {
        if (active) setRequestState({ key: requestKey, result: value, error: "" });
      })
      .catch((caught) => {
        if (!active) return;
        setRequestState({
          key: requestKey,
          result: null,
          error: accountErrorMessage(locale, caught),
        });
      });
    return () => { active = false; };
  }, [auditId, filters, locale, projectId, requestKey]);

  const category = filters.category ?? "";
  const priority = filters.priority ?? "";
  const sort = filters.sort ?? "priority";
  const order = filters.order ?? "asc";
  const filtersActive = hasActiveAccountIssueFilters(filters);

  function resetFilters() {
    setFilters(defaultAccountIssueFilters);
  }

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
          <span className="eyebrow">{ru ? "Сохранённый аудит · порядок исправления" : "Saved audit · fix order"}</span>
          <h1>{ru ? "Очередь исправлений" : "Fix queue"}</h1>
          <p>{ru
            ? "Работайте сверху вниз: порядок рассчитан из сохранённых приоритета и критичности этого аудита."
            : "Work from top to bottom: the order uses the priority and severity stored with this audit."}</p>
        </div>
        {result && (
          <strong className="wd-issue-result-count" aria-live="polite">
            <span>{result.total}</span>
            <small>{ru ? "найдено" : "found"}</small>
          </strong>
        )}
      </header>

      <div className="wd-issue-filter-panel">
        <div className="wd-issue-filter-heading">
          <div>
            <h2>{ru ? "Фильтры" : "Filters"}</h2>
            <p>{ru ? "Меняют представление сохранённого результата." : "Changes the view of the saved result."}</p>
          </div>
          {filtersActive && (
            <button className="wd-issue-reset" type="button" onClick={resetFilters}>
              {ru ? "Сбросить" : "Reset"}
            </button>
          )}
        </div>
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
                <option key={value} value={value}>{issueCategoryLabel(locale, value)}</option>
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
                <option key={value} value={value}>{issuePriorityLabel(locale, value)}</option>
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
              <option value="priority">{ru ? "Порядок исправления" : "Fix order"}</option>
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
              <option value="asc">{ru ? "Сначала первые" : "First to last"}</option>
              <option value="desc">{ru ? "Сначала последние" : "Last to first"}</option>
            </select>
          </label>
        </div>
      </div>

      {loading && !result && <div className="wd-account-card" aria-busy="true"><p>{ru ? "Загружаем проблемы…" : "Loading issues…"}</p></div>}
      {loading && result && <p className="wd-issue-refreshing" role="status">{ru ? "Обновляем список…" : "Updating list…"}</p>}
      {error && <p className="wd-account-error" role="alert">{error}</p>}
      {!loading && result?.items.length === 0 && (
        <div className="wd-account-card wd-account-empty">
          <h2>{ru ? "По выбранным фильтрам проблем нет" : "No issues match these filters"}</h2>
          {filtersActive && <button className="wd-button wd-button-secondary" type="button" onClick={resetFilters}>{ru ? "Сбросить фильтры" : "Reset filters"}</button>}
        </div>
      )}
      {result && result.items.length > 0 && (
        <div className="wd-priority-issue-list" aria-busy={loading}>
          {result.items.map((issue) => (
            <article key={issue.issue_id} data-priority={issue.priority}>
              <div className="wd-priority-order" aria-label={ru ? "Порядок исправления" : "Fix order"}>
                {issue.fix_order}
              </div>
              <div>
                <div className="wd-priority-meta">
                  <span className="wd-priority-label">{issuePriorityLabel(locale, issue.priority)}</span>
                  <span>{issueCategoryLabel(locale, issue.category)}</span>
                  <span>{formatAffectedUrlCount(locale, issue.affected_urls.length)}</span>
                </div>
                <h2>
                  <Link href={savedAuditIssuePath(locale, projectId, auditId, issue.issue_id)}>
                    {issue.title}
                  </Link>
                </h2>
                <p>{issue.description}</p>
                <div className="wd-issue-next-action">
                  <span>{ru ? "Следующее действие" : "Next action"}</span>
                  <strong>{issue.recommendation.summary}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
