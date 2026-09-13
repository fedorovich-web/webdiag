"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { accountErrorMessage } from "./account-messages";
import {
  getAccountIssue,
  type AccountIssueDetailResponse,
} from "./account-issues-contract";
import {
  formatAffectedUrlCount,
  issueCategoryLabel,
  issuePriorityLabel,
} from "./account-issues-presentation";
import { savedAuditIssuesPath } from "../../lib/routes";

export function AccountIssueDetail({
  locale,
  projectId,
  auditId,
  issueId,
}: {
  readonly locale: Locale;
  readonly projectId: string;
  readonly auditId: string;
  readonly issueId: string;
}) {
  const ru = locale === "ru";
  const [detail, setDetail] = useState<AccountIssueDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getAccountIssue(projectId, auditId, issueId, locale)
      .then((value) => { if (active) setDetail(value); })
      .catch((caught) => { if (active) setError(accountErrorMessage(locale, caught)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [auditId, issueId, locale, projectId]);

  if (loading) {
    return <section className="wd-account-card" aria-busy="true"><p>{ru ? "Загружаем проблему…" : "Loading issue…"}</p></section>;
  }
  if (!detail) {
    return <section className="wd-account-card wd-account-empty"><h1>{ru ? "Проблема недоступна" : "Issue unavailable"}</h1>{error && <p className="wd-account-error" role="alert">{error}</p>}</section>;
  }

  const { issue } = detail;
  return (
    <article className="wd-account-dashboard wd-issue-detail-page">
      <nav className="wd-account-breadcrumb" aria-label={ru ? "Навигация кабинета" : "Account navigation"}>
        <Link href={savedAuditIssuesPath(locale, projectId, auditId)}>
          {ru ? "Проблемы и приоритеты" : "Issues and priorities"}
        </Link>
        <span aria-hidden="true">/</span>
        <span>{issue.title}</span>
      </nav>
      <header className="wd-account-section-head">
        <div>
          <span className="eyebrow">#{issue.fix_order} · {issuePriorityLabel(locale, issue.priority)}</span>
          <h1>{issue.title}</h1>
          <p>{issueCategoryLabel(locale, issue.category)} · {formatAffectedUrlCount(locale, issue.affected_urls.length)}</p>
        </div>
      </header>
      <section className="wd-account-card wd-issue-impact">
        <span className="eyebrow">{ru ? "Почему это важно" : "Why this matters"}</span>
        <h2>{ru ? "Что обнаружено" : "What was found"}</h2>
        <p>{issue.description}</p>
      </section>
      <section className="wd-account-card wd-issue-recommendation">
        <span className="eyebrow">{ru ? "Рекомендация из аудита" : "Recommendation from the audit"}</span>
        <h2>{ru ? "Что исправить" : "What to fix"}</h2>
        <p><strong>{issue.recommendation.summary}</strong></p>
        {issue.recommendation.steps.length > 0 && (
          <ol>{issue.recommendation.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        )}
        {issue.recommendation.expected_impact && (
          <p><strong>{ru ? "Ожидаемый эффект:" : "Expected impact:"}</strong> {issue.recommendation.expected_impact}</p>
        )}
      </section>
      <section className="wd-account-card wd-issue-affected">
        <div className="wd-issue-card-heading">
          <h2>{ru ? "Затронутые страницы" : "Affected pages"}</h2>
          <strong>{formatAffectedUrlCount(locale, issue.affected_urls.length)}</strong>
        </div>
        {issue.affected_urls.length > 0 ? (
          <ul className="wd-affected-url-list">
            {issue.affected_urls.map((url) => <li key={url}><code>{url}</code></li>)}
          </ul>
        ) : <p>{ru ? "В сохранённом результате страницы не указаны." : "No pages are listed in the saved result."}</p>}
      </section>
      <details className="wd-account-card wd-issue-expert">
        <summary>{ru ? "Технические данные" : "Technical details"}</summary>
        <dl className="wd-issue-facts">
          <div><dt>{ru ? "Категория" : "Category"}</dt><dd>{issueCategoryLabel(locale, issue.category)}</dd></div>
          <div><dt>{ru ? "Исходная категория" : "Source category"}</dt><dd><code>{issue.source_category}</code></dd></div>
          <div><dt>{ru ? "Критичность" : "Severity"}</dt><dd><code>{issue.severity}</code></dd></div>
          <div><dt>{ru ? "ID проверки" : "Check ID"}</dt><dd><code>{issue.check_id ?? (ru ? "не указан" : "not provided")}</code></dd></div>
          <div><dt>{ru ? "ID проблемы" : "Issue ID"}</dt><dd><code>{issue.issue_id}</code></dd></div>
        </dl>
      </details>
    </article>
  );
}
