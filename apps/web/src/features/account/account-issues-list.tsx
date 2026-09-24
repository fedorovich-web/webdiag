"use client";

import Link from "next/link";
import { AlertTriangle, CalendarDays, CheckCircle2, ChevronRight, RefreshCw, Search } from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { accountErrorMessage } from "./account-messages";
import { formatAccountDate } from "./account-dashboard-contract";
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
import { accountPath, projectPath, savedAuditIssuePath, savedAuditPath } from "../../lib/routes";

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
  const [query, setQuery] = useState("");
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
  const sortOrder = `${sort}:${order}`;
  const normalizedQuery = query.trim().toLowerCase();
  const visibleItems = result?.items.filter((issue) => {
    if (!normalizedQuery) return true;
    return [
      issue.title,
      issue.description,
      issue.category,
      issue.recommendation.summary,
      ...issue.affected_urls,
    ].some((value) => value.toLowerCase().includes(normalizedQuery));
  }) ?? [];
  const filtersActive = hasActiveAccountIssueFilters(filters) || Boolean(normalizedQuery);
  const selectedIssue = visibleItems.find((issue) => issue.issue_id === selectedIssueId)
    ?? visibleItems[0]
    ?? null;
  const p0Count = result?.items.filter((issue) => issue.priority === "p0").length ?? 0;
  const p1Count = result?.items.filter((issue) => issue.priority === "p1").length ?? 0;
  const p2Count = result?.items.filter((issue) => issue.priority === "p2").length ?? 0;
  const p3Count = result?.items.filter((issue) => issue.priority === "p3").length ?? 0;
  const score = result?.audit.score ?? null;

  function resetFilters() {
    setFilters(defaultAccountIssueFilters);
    setQuery("");
  }

  return (
    <section className="wd-account-dashboard wd-account-issues-page wd-account-issues-render">
      <nav className="wd-account-breadcrumb wd-issues-breadcrumb" aria-label={ru ? "Навигация кабинета" : "Account navigation"}>
        <Link href={`${accountPath(locale)}#projects`}>{ru ? "Проекты" : "Projects"}</Link>
        <span aria-hidden="true">›</span>
        <Link href={projectPath(locale, projectId)}>{result?.project.name ?? (ru ? "Проект" : "Project")}</Link>
        <span aria-hidden="true">›</span>
        <span>{ru ? "Проблемы" : "Issues"}</span>
      </nav>

      <header className="wd-account-section-head wd-issues-render-head">
        <div>
          <h1>{ru ? "Проблемы проекта" : "Project issues"}</h1>
          <p>{ru
            ? "Найдены технические и SEO-проблемы, которые могут снижать видимость сайта в поиске."
            : "Review technical and SEO issues that can reduce the site's search visibility."}</p>
        </div>
        <div className="wd-issues-head-actions">
          {result && (
            <div className="wd-issues-last-check">
              <CalendarDays aria-hidden="true" />
              <span><small>{ru ? "Последняя проверка" : "Last check"}</small><strong>{formatAccountDate(result.audit.completed_at, locale)}</strong></span>
            </div>
          )}
          <Link className="wd-button wd-button-primary" href={projectPath(locale, projectId)}>
            <RefreshCw aria-hidden="true" />
            {ru ? "Запустить проверку" : "Run check"}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </header>

      {result && (
        <section className="wd-issues-overview-grid" aria-label={ru ? "Сводка аудита" : "Audit summary"}>
          <article className="wd-issues-health-card">
            <div className="wd-issues-score-wrap">
              <div
                className="wd-issues-score-ring"
                style={{ background: `conic-gradient(#22c7a6 0 ${Math.max(0, Math.min(100, score ?? 0))}%, #e4eff0 0 100%)` }}
              >
                <span><strong>{score ?? "—"}</strong><small>{ru ? "из 100" : "of 100"}</small></span>
              </div>
              <div className="wd-issues-score-copy">
                <h2>{ru ? "Общее состояние сайта" : "Overall site health"}</h2>
                <span className="wd-issues-health-badge" data-tone={score !== null && score >= 80 ? "good" : "attention"}>
                  {score === null ? (ru ? "Нет оценки" : "No score") : score >= 80 ? (ru ? "Хорошо" : "Good") : (ru ? "Требует внимания" : "Needs attention")}
                </span>
                <p>{ru ? "Используйте список ниже, чтобы разбирать проблемы по приоритету." : "Use the list below to work through issues by priority."}</p>
                <Link href={savedAuditPath(locale, projectId, auditId)}>{ru ? "Открыть полный отчёт" : "Open full report"} <span aria-hidden="true">→</span></Link>
              </div>
            </div>
            <div className="wd-issues-health-metrics">
              <div className="is-critical"><span><AlertTriangle aria-hidden="true" /></span><strong>{p0Count}</strong><small>{ru ? "Критические" : "Critical"}</small></div>
              <div className="is-high"><span><AlertTriangle aria-hidden="true" /></span><strong>{p1Count}</strong><small>{ru ? "Высокий приоритет" : "High priority"}</small></div>
              <div className="is-medium"><span><AlertTriangle aria-hidden="true" /></span><strong>{p2Count}</strong><small>{ru ? "Средний приоритет" : "Medium priority"}</small></div>
              <div className="is-low"><span><CheckCircle2 aria-hidden="true" /></span><strong>{p3Count}</strong><small>{ru ? "Низкий приоритет" : "Low priority"}</small></div>
            </div>
          </article>

          <article className="wd-issues-audit-context">
            <header><h2>{ru ? "Последний аудит" : "Latest audit"}</h2></header>
            <div className="wd-issues-audit-context-main">
              <strong>{result.total}</strong>
              <span>{ru ? "проблем найдено" : "issues found"}</span>
            </div>
            <dl>
              <div><dt>{ru ? "Проверок" : "Checks"}</dt><dd>{result.audit.check_count}</dd></div>
              <div><dt>{ru ? "Дата" : "Date"}</dt><dd>{formatAccountDate(result.audit.completed_at, locale)}</dd></div>
            </dl>
          </article>
        </section>
      )}

      <div className="wd-issue-filter-panel wd-issues-render-filters">
        <label className="wd-issues-search">
          <span className="sr-only">{ru ? "Поиск проблем" : "Search issues"}</span>
          <Search aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
            placeholder={ru ? "Поиск проблем..." : "Search issues..."}
          />
        </label>
        <div className="wd-issue-filters" aria-label={ru ? "Фильтры проблем" : "Issue filters"}>
          <label><span>{ru ? "Тип проблемы" : "Issue type"}</span><select value={category} onChange={(event: ChangeEvent<HTMLSelectElement>) => setFilters((current) => ({ ...current, category: event.target.value ? event.target.value as AccountIssueCategory : undefined }))}><option value="">{ru ? "Все типы" : "All types"}</option>{categoryOptions.map((value) => <option key={value} value={value}>{issueCategoryLabel(locale, value)}</option>)}</select></label>
          <label><span>{ru ? "Приоритет" : "Priority"}</span><select value={priority} onChange={(event: ChangeEvent<HTMLSelectElement>) => setFilters((current) => ({ ...current, priority: event.target.value ? event.target.value as AccountIssuePriority : undefined }))}><option value="">{ru ? "Все приоритеты" : "All priorities"}</option>{priorityOptions.map((value) => <option key={value} value={value}>{issuePriorityLabel(locale, value)}</option>)}</select></label>
          <label><span>{ru ? "Сортировка" : "Sort"}</span><select value={sortOrder} onChange={(event: ChangeEvent<HTMLSelectElement>) => { const [nextSort, nextOrder] = event.target.value.split(":") as [AccountIssueSort, AccountIssueOrder]; setFilters((current) => ({ ...current, sort: nextSort, order: nextOrder })); }}><option value="priority:asc">{ru ? "Сначала важные" : "Highest priority first"}</option><option value="priority:desc">{ru ? "Сначала низкий приоритет" : "Lowest priority first"}</option><option value="category:asc">{ru ? "По категории" : "By category"}</option><option value="title:asc">{ru ? "По названию" : "By title"}</option></select></label>
        </div>
        <button className="wd-issue-reset" type="button" onClick={resetFilters} disabled={!filtersActive}>
          <RefreshCw aria-hidden="true" />{ru ? "Сбросить" : "Reset"}
        </button>
      </div>

      {loading && !result && <div className="wd-account-card" aria-busy="true"><p>{ru ? "Загружаем проблемы…" : "Loading issues…"}</p></div>}
      {loading && result && <p className="wd-issue-refreshing" role="status">{ru ? "Обновляем список…" : "Updating list…"}</p>}
      {error && <p className="wd-account-error" role="alert">{error}</p>}

      {result && (
        <div className="wd-issues-results-heading">
          <h2>{ru ? `Найдено проблем: ${visibleItems.length}` : `Issues found: ${visibleItems.length}`}</h2>
          <span>{ru ? "Выберите проблему, чтобы увидеть подробности" : "Select an issue to review details"}</span>
        </div>
      )}

      {!loading && result && visibleItems.length === 0 && (
        <div className="wd-account-card wd-account-empty">
          <h2>{ru ? "По выбранным фильтрам проблем нет" : "No issues match these filters"}</h2>
          {filtersActive && <button className="wd-button wd-button-secondary" type="button" onClick={resetFilters}>{ru ? "Сбросить фильтры" : "Reset filters"}</button>}
        </div>
      )}

      {result && visibleItems.length > 0 && (
        <div className="wd-issues-render-layout" aria-busy={loading}>
          <section className="wd-issues-render-table" aria-label={ru ? "Список проблем" : "Issue list"}>
            <div className="wd-issues-render-table-head" aria-hidden="true">
              <span />
              <span>{ru ? "Проблема" : "Issue"}</span>
              <span>{ru ? "Страницы" : "Pages"}</span>
              <span>{ru ? "Приоритет" : "Priority"}</span>
              <span />
            </div>
            {visibleItems.map((issue) => {
              const active = selectedIssue?.issue_id === issue.issue_id;
              return (
                <button
                  type="button"
                  className={active ? "wd-issues-render-row is-active" : "wd-issues-render-row"}
                  key={issue.issue_id}
                  onClick={() => setSelectedIssueId(issue.issue_id)}
                  aria-pressed={active}
                >
                  <span className="wd-issues-row-check" aria-hidden="true">{active ? "✓" : ""}</span>
                  <span className="wd-issues-render-title">
                    <i data-priority={issue.priority} aria-hidden="true"><AlertTriangle /></i>
                    <span><strong>{issue.title}</strong><small>{issueCategoryLabel(locale, issue.category)}</small></span>
                  </span>
                  <span className="wd-issues-pages">{issue.affected_urls.length}</span>
                  <span className={"wd-issues-priority is-" + issue.priority}>{issuePriorityLabel(locale, issue.priority)}</span>
                  <ChevronRight className="wd-issues-row-arrow" aria-hidden="true" />
                </button>
              );
            })}
          </section>

          {selectedIssue && (
            <aside className="wd-issues-render-detail" aria-label={ru ? "Детали проблемы" : "Issue details"}>
              <div className="wd-issues-render-detail-head">
                <div className="wd-issues-detail-title-row">
                  <span className={"wd-issues-detail-icon is-" + selectedIssue.priority}><AlertTriangle aria-hidden="true" /></span>
                  <div><h2>{selectedIssue.title}</h2><span className={"wd-issues-priority is-" + selectedIssue.priority}>{issuePriorityLabel(locale, selectedIssue.priority)}</span></div>
                </div>
                <p>{selectedIssue.description}</p>
              </div>

              <div className="wd-issues-detail-metrics">
                <div><span>{ru ? "Затронутые страницы" : "Affected pages"}</span><strong>{selectedIssue.affected_urls.length}</strong></div>
                <div><span>{ru ? "Приоритет" : "Priority"}</span><strong>{issuePriorityLabel(locale, selectedIssue.priority)}</strong></div>
                <div><span>{ru ? "Категория" : "Category"}</span><strong>{issueCategoryLabel(locale, selectedIssue.category)}</strong></div>
              </div>

              <div className="wd-issues-render-detail-tabs">
                <span className="is-active">{ru ? `Страницы (${selectedIssue.affected_urls.length})` : `Pages (${selectedIssue.affected_urls.length})`}</span>
                <span>{ru ? "Как исправить" : "How to fix"}</span>
                <span>{ru ? "Влияние" : "Impact"}</span>
              </div>

              <section className="wd-issues-affected-panel">
                <div className="wd-issues-detail-section-head">
                  <h3>{ru ? "Затронутые страницы" : "Affected pages"}</h3>
                  <Link href={savedAuditIssuePath(locale, projectId, auditId, selectedIssue.issue_id)}>
                    {ru ? "Открыть полностью" : "Open full detail"} <span aria-hidden="true">→</span>
                  </Link>
                </div>
                {selectedIssue.affected_urls.length > 0 ? (
                  <div className="wd-issues-affected-list">
                    {selectedIssue.affected_urls.slice(0, 8).map((url) => (
                      <div key={url}><code>{url}</code></div>
                    ))}
                  </div>
                ) : <p>{ru ? "Затронутые страницы не указаны." : "No affected pages are listed."}</p>}
              </section>

              <section className="wd-issues-render-recommendation">
                <span>{ru ? "Рекомендации по исправлению" : "Fix recommendations"}</span>
                <strong>{selectedIssue.recommendation.summary}</strong>
                {selectedIssue.recommendation.steps.length > 0 && (
                  <ol>{selectedIssue.recommendation.steps.map((step, index) => <li key={step}><b>{index + 1}</b><span>{step}</span></li>)}</ol>
                )}
                {selectedIssue.recommendation.expected_impact && <p>{selectedIssue.recommendation.expected_impact}</p>}
              </section>
            </aside>
          )}
        </div>
      )}
    </section>
  );
}
