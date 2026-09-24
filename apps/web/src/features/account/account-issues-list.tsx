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
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
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
  const selectedIssue = result?.items.find((issue) => issue.issue_id === selectedIssueId)
    ?? result?.items[0]
    ?? null;
  const p0Count = result?.items.filter((issue) => issue.priority === "p0").length ?? 0;
  const p1Count = result?.items.filter((issue) => issue.priority === "p1").length ?? 0;
  const p2Count = result?.items.filter((issue) => issue.priority === "p2").length ?? 0;

  function resetFilters() {
    setFilters(defaultAccountIssueFilters);
  }

  return (
    <section className="wd-account-dashboard wd-account-issues-page wd-account-issues-render">
      <nav className="wd-account-breadcrumb" aria-label={ru ? "Навигация кабинета" : "Account navigation"}>
        <Link href={savedAuditPath(locale, projectId, auditId)}>
          {ru ? "Сохранённый аудит" : "Saved audit"}
        </Link>
        <span aria-hidden="true">/</span>
        <span>{ru ? "Проблемы" : "Issues"}</span>
      </nav>

      <header className="wd-account-section-head wd-issues-render-head">
        <div>
          <span className="eyebrow">{ru ? "Аудит проекта" : "Project audit"}</span>
          <h1>{ru ? "Проблемы проекта" : "Project issues"}</h1>
          <p>{result
            ? (ru
              ? "Найденные проблемы, их приоритеты и затронутые страницы. Выберите строку, чтобы увидеть детали и рекомендации."
              : "Detected issues, priorities and affected pages. Select a row to review details and recommendations.")
            : (ru ? "Загружаем сохранённый результат аудита." : "Loading the saved audit result.")}</p>
        </div>
        <Link className="wd-button wd-button-secondary" href={savedAuditPath(locale, projectId, auditId)}>
          {ru ? "Открыть отчёт" : "Open report"}
        </Link>
      </header>

      {result && (
        <section className="wd-issues-summary-grid" aria-label={ru ? "Сводка аудита" : "Audit summary"}>
          <article className="is-score">
            <span>{ru ? "Оценка сайта" : "Site score"}</span>
            <strong>{result.audit.score ?? "—"}</strong>
            <small>{result.audit.score === null ? (ru ? "Нет оценки" : "No score") : (result.audit.score >= 80 ? (ru ? "Хорошо" : "Good") : result.audit.score >= 60 ? (ru ? "Нужно улучшить" : "Needs work") : (ru ? "Требует внимания" : "Needs attention"))}</small>
          </article>
          <article className="is-critical"><span>P0</span><strong>{p0Count}</strong><small>{ru ? "Критические" : "Critical"}</small></article>
          <article className="is-high"><span>P1</span><strong>{p1Count}</strong><small>{ru ? "Высокий приоритет" : "High priority"}</small></article>
          <article><span>P2</span><strong>{p2Count}</strong><small>{ru ? "Рекомендации" : "Recommendations"}</small></article>
          <article><span>{ru ? "Проверок" : "Checks"}</span><strong>{result.audit.check_count}</strong><small>{ru ? "В аудите" : "In audit"}</small></article>
        </section>
      )}

      <div className="wd-issue-filter-panel wd-issues-render-filters">
        <div className="wd-issue-filter-heading">
          <div>
            <h2>{ru ? "Найденные проблемы" : "Detected issues"}</h2>
            <p>{result ? (ru ? "Всего: " + result.total : "Total: " + result.total) : (ru ? "Загрузка…" : "Loading…")}</p>
          </div>
          {filtersActive && <button className="wd-issue-reset" type="button" onClick={resetFilters}>{ru ? "Сбросить" : "Reset"}</button>}
        </div>
        <div className="wd-issue-filters" aria-label={ru ? "Фильтры проблем" : "Issue filters"}>
          <label><span>{ru ? "Категория" : "Category"}</span><select value={category} onChange={(event: ChangeEvent<HTMLSelectElement>) => setFilters((current) => ({ ...current, category: event.target.value ? event.target.value as AccountIssueCategory : undefined }))}><option value="">{ru ? "Все категории" : "All categories"}</option>{categoryOptions.map((value) => <option key={value} value={value}>{issueCategoryLabel(locale, value)}</option>)}</select></label>
          <label><span>{ru ? "Приоритет" : "Priority"}</span><select value={priority} onChange={(event: ChangeEvent<HTMLSelectElement>) => setFilters((current) => ({ ...current, priority: event.target.value ? event.target.value as AccountIssuePriority : undefined }))}><option value="">{ru ? "Все приоритеты" : "All priorities"}</option>{priorityOptions.map((value) => <option key={value} value={value}>{issuePriorityLabel(locale, value)}</option>)}</select></label>
          <label><span>{ru ? "Сортировка" : "Sort"}</span><select value={sort} onChange={(event: ChangeEvent<HTMLSelectElement>) => setFilters((current) => ({ ...current, sort: event.target.value as AccountIssueSort }))}><option value="priority">{ru ? "По приоритету" : "By priority"}</option><option value="category">{ru ? "По категории" : "By category"}</option><option value="title">{ru ? "По названию" : "By title"}</option></select></label>
          <label><span>{ru ? "Порядок" : "Order"}</span><select value={order} onChange={(event: ChangeEvent<HTMLSelectElement>) => setFilters((current) => ({ ...current, order: event.target.value as AccountIssueOrder }))}><option value="asc">{ru ? "Сначала важные" : "Most important first"}</option><option value="desc">{ru ? "В обратном порядке" : "Reverse order"}</option></select></label>
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
        <div className="wd-issues-render-layout" aria-busy={loading}>
          <section className="wd-issues-render-table" aria-label={ru ? "Список проблем" : "Issue list"}>
            <div className="wd-issues-render-table-head" aria-hidden="true">
              <span>{ru ? "Проблема" : "Issue"}</span>
              <span>{ru ? "Приоритет" : "Priority"}</span>
              <span>{ru ? "Страницы" : "Pages"}</span>
            </div>
            {result.items.map((issue) => {
              const active = selectedIssue?.issue_id === issue.issue_id;
              return (
                <button
                  type="button"
                  className={active ? "wd-issues-render-row is-active" : "wd-issues-render-row"}
                  key={issue.issue_id}
                  onClick={() => setSelectedIssueId(issue.issue_id)}
                  aria-pressed={active}
                >
                  <span className="wd-issues-render-title"><i data-priority={issue.priority} aria-hidden="true" /><span><strong>{issue.title}</strong><small>{issueCategoryLabel(locale, issue.category)}</small></span></span>
                  <span className={"wd-issues-priority is-" + issue.priority}>{issuePriorityLabel(locale, issue.priority)}</span>
                  <span className="wd-issues-pages">{issue.affected_urls.length}</span>
                </button>
              );
            })}
          </section>

          {selectedIssue && (
            <aside className="wd-issues-render-detail" aria-label={ru ? "Детали проблемы" : "Issue details"}>
              <div className="wd-issues-render-detail-head">
                <span className={"wd-issues-priority is-" + selectedIssue.priority}>{issuePriorityLabel(locale, selectedIssue.priority)}</span>
                <h2>{selectedIssue.title}</h2>
                <p>{selectedIssue.description}</p>
              </div>

              <div className="wd-issues-render-detail-tabs">
                <span className="is-active">{ru ? "Описание" : "Description"}</span>
                <span>{ru ? "Затронутые URL" : "Affected URLs"} <b>{selectedIssue.affected_urls.length}</b></span>
              </div>

              <section className="wd-issues-render-recommendation">
                <span>{ru ? "Рекомендация" : "Recommendation"}</span>
                <strong>{selectedIssue.recommendation.summary}</strong>
                {selectedIssue.recommendation.expected_impact && <p>{selectedIssue.recommendation.expected_impact}</p>}
              </section>

              {selectedIssue.affected_urls.length > 0 && (
                <div className="wd-issues-render-urls">
                  <strong>{ru ? "Примеры страниц" : "Example pages"}</strong>
                  {selectedIssue.affected_urls.slice(0, 5).map((url) => <code key={url}>{url}</code>)}
                </div>
              )}

              <Link className="wd-button wd-button-primary" href={savedAuditIssuePath(locale, projectId, auditId, selectedIssue.issue_id)}>
                {ru ? "Открыть проблему" : "Open issue"}
              </Link>
            </aside>
          )}
        </div>
      )}
    </section>
  );
}
