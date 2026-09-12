"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { accountErrorMessage } from "./account-messages";
import {
  getAccountIssue,
  type AccountIssueDetailResponse,
} from "./account-issues-contract";
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
    getAccountIssue(projectId, auditId, issueId)
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
          <span className="eyebrow">#{issue.fix_order} · {issue.priority.toUpperCase()}</span>
          <h1>{issue.title}</h1>
          <p>{issue.description}</p>
        </div>
      </header>
      <dl className="wd-issue-facts">
        <div><dt>{ru ? "Категория" : "Category"}</dt><dd>{issue.category}</dd></div>
        <div><dt>{ru ? "Критичность" : "Severity"}</dt><dd>{issue.severity}</dd></div>
        <div><dt>{ru ? "Источник" : "Source"}</dt><dd>{issue.source_category}</dd></div>
      </dl>
      <section className="wd-account-card">
        <h2>{ru ? "Что исправить" : "What to fix"}</h2>
        <p><strong>{issue.recommendation.summary}</strong></p>
        {issue.recommendation.steps.length > 0 && (
          <ol>{issue.recommendation.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        )}
        {issue.recommendation.expected_impact && (
          <p><strong>{ru ? "Ожидаемый эффект:" : "Expected impact:"}</strong> {issue.recommendation.expected_impact}</p>
        )}
      </section>
      {issue.affected_urls.length > 0 && (
        <section className="wd-account-card">
          <h2>{ru ? "Затронутые страницы" : "Affected pages"}</h2>
          <ul className="wd-affected-url-list">
            {issue.affected_urls.map((url) => <li key={url}><code>{url}</code></li>)}
          </ul>
        </section>
      )}
    </article>
  );
}
