import type { Locale } from "@webdiag/tool-registry";
import type { AccountCrawlDetail, AccountSiteAuditDetail } from "./account-workspace-contract";
import { AccountLegacyCrawlSummary } from "./account-legacy-crawl-summary";
import { getAuditIssueTranslation } from "../tools/audit-taxonomy-i18n";
import { reportSeverityLabel } from "./account-report-presentation";
import styles from "./account-crawl-summary.module.css";

export function AccountCrawlSummary({ locale, detail, historyCount }: {
  readonly locale: Locale;
  readonly detail: AccountSiteAuditDetail | AccountCrawlDetail;
  readonly historyCount: number;
}) {
  if (detail.contract_version === "webdiag.account.crawl_detail.v1") {
    return <AccountLegacyCrawlSummary locale={locale} detail={detail} historyCount={historyCount} />;
  }
  const ru = locale === "ru";
  const { job, result } = detail;
  const nonSuccessPages = result?.pages.filter((page) => page.status_code < 200 || page.status_code >= 300).length ?? 0;
  const partial = result && (result.page_budget_exhausted || !result.sitemap_complete
    || result.page_failures.length > 0 || result.excluded_query_url_count > 0 || nonSuccessPages > 0);
  const state = {
    queued: ru ? "В очереди" : "Queued",
    running: ru ? "Выполняется" : "Running",
    succeeded: partial ? (ru ? "Частичный результат" : "Partial result") : (ru ? "Готово" : "Completed"),
    failed: ru ? "Не завершено" : "Not completed",
  }[job.state];
  const errors: Record<string, string> = ru ? {
    crawl_robots_unavailable: "Не удалось получить robots.txt из-за ошибки сервера или соединения. Обход остановлен.",
    crawl_root_disallowed: "Корневая страница закрыта в robots.txt.",
    crawl_root_fetch_failed: "Не удалось загрузить корневую страницу сайта.",
    crawl_root_not_html: "Корневая страница вернула ответ, отличный от HTML.",
    crawl_project_archived: "Проект архивирован; проверка остановлена.",
    crawl_result_too_large: "Результат превысил допустимый размер и не был сохранён.",
    crawl_deadline_exceeded: "Время проверки истекло до получения первой страницы.",
  } : {
    crawl_robots_unavailable: "robots.txt could not be fetched due to a server or connection error. The crawl stopped.",
    crawl_root_disallowed: "The root page is excluded by robots.txt.",
    crawl_root_fetch_failed: "The website root page could not be fetched.",
    crawl_root_not_html: "The root page returned a non-HTML response.",
    crawl_project_archived: "The project was archived and the check stopped.",
    crawl_result_too_large: "The result exceeded the storage limit and was not saved.",
    crawl_deadline_exceeded: "The audit timed out before the first page could be checked.",
  };
  const failureLabels = ru ? {
    fetch_failed: "Не удалось загрузить",
    not_html: "Ответ не является HTML",
    robots_disallowed: "Закрыто в robots.txt",
  } : {
    fetch_failed: "Fetch failed",
    not_html: "Non-HTML response",
    robots_disallowed: "Excluded by robots.txt",
  };
  if (!result) return (
    <div className="wd-crawl-progress" aria-live="polite">
      <span className="wd-crawl-state" data-state={job.state}>{state}</span>
      {job.state === "failed" && <p>{errors[job.error_code ?? ""] ?? (ru
        ? "Проверка не завершена. Повторите её позже."
        : "The check did not complete. Try again later.")}</p>}
    </div>
  );
  const duplicatePages = new Set([...result.duplicate_titles, ...result.duplicate_descriptions]
    .flatMap((group) => group.urls)).size;
  return (
    <div className={`wd-crawl-result ${styles.result}`}>
      <div className="wd-crawl-result-meta">
        <span className={`wd-crawl-state ${partial ? styles.partial : ""}`} data-state={partial ? "partial" : job.state}>{state}</span>
        <span>{ru ? `История: ${historyCount}` : `History: ${historyCount}`}</span>
        <time dateTime={result.completed_at}>{new Intl.DateTimeFormat(ru ? "ru-RU" : "en-US", {
          dateStyle: "medium", timeStyle: "short",
        }).format(new Date(result.completed_at))}</time>
      </div>
      <dl>
        <div><dt>{ru ? "Проверено страниц" : "Pages checked"}</dt><dd>{result.audit_summary.pages_audited}</dd></div>
        <div><dt>{ru ? "Страниц с замечаниями" : "Pages with findings"}</dt><dd>{result.audit_summary.pages_with_issues}</dd></div>
        <div><dt>{ru ? "Типов замечаний" : "Finding types"}</dt><dd>{result.audit_summary.unique_issue_count}</dd></div>
        <div><dt>{ru ? "Всего замечаний по URL" : "Finding occurrences"}</dt><dd>{result.audit_summary.issue_occurrence_count}</dd></div>
        <div><dt>{ru ? "Страниц с дублями" : "Pages with duplicates"}</dt><dd>{duplicatePages}</dd></div>
        <div><dt>{ru ? "Кандидаты без внутренних ссылок" : "Unlinked candidates"}</dt><dd>{partial ? (ru ? "Не оценено" : "Not assessed") : result.orphan_urls.length}</dd></div>
        <div><dt>{ru ? "Не проверено" : "Not checked"}</dt><dd>{result.page_failures.length}</dd></div>
      </dl>
      <p>{ru ? "Замечания по важности" : "Finding occurrences by severity"}: {Object.entries(result.audit_summary.occurrences_by_severity)
        .map(([severity, count]) => `${reportSeverityLabel(locale, severity)}: ${count}`).join(" · ")}</p>
      {result.sitemap_url && <p>Sitemap: {result.sitemap_url} · {ru ? "URL без query" : "Query-free URLs"}: {result.sitemap_url_count}</p>}
      <p>{ru
        ? "Проверены только обнаруженные общедоступные HTML-страницы. JavaScript не выполняется; охват всего сайта не гарантируется."
        : "Only discovered public HTML pages were audited. JavaScript is not executed; whole-site coverage is not guaranteed."}</p>
      {result.page_budget_exhausted && <p className="wd-crawl-limit-note">{ru
        ? `Обход ограничен бюджетом страниц, ссылок или времени; лимит страниц: ${result.page_limit}.`
        : `The page, link, or time budget limited this crawl; page limit: ${result.page_limit}.`}</p>}
      {!result.sitemap_complete && <p className="wd-crawl-limit-note">{ru
        ? "Sitemap не проверен полностью: отсутствует, недоступен или содержит исключённые URL."
        : "Sitemap coverage is incomplete: missing, unavailable, or contains excluded URLs."}</p>}
      {result.excluded_query_url_count > 0 && <p className="wd-crawl-limit-note">{ru
        ? `URL с query пропущено: ${result.excluded_query_url_count}. Параметры не сохраняются; страницы, зависящие от них, не проверены.`
        : `Query URLs excluded: ${result.excluded_query_url_count}. Parameters are not stored; pages that depend on them were not audited.`}</p>}
      {nonSuccessPages > 0 && <p className="wd-crawl-limit-note">{ru
        ? `Страниц с ответами HTTP вне 2xx: ${nonSuccessPages}. Обход мог пропустить ссылки этих страниц.`
        : `Pages with non-success HTTP responses: ${nonSuccessPages}. Links from these pages may be missing from the crawl.`}</p>}
      {result.page_failures.length > 0 && <details open>
        <summary>{ru ? "Ошибки и исключённые страницы" : "Failures and excluded pages"}</summary>
        <ul>{result.page_failures.map((failure) => <li key={failure.url}>
          {failure.url} — {failureLabels[failure.code]}
        </li>)}</ul>
      </details>}
      <details>
        <summary>{ru ? "Результаты по страницам" : "Results by page"}</summary>
        <ul>{result.pages.map((page) => <li key={page.url}>
          <strong>{page.url}</strong> — HTTP {page.status_code}; {ru ? "оценка" : "score"}: {page.audit_score}/100;
          {" "}{ru ? "замечаний" : "findings"}: {page.issue_count}
        </li>)}</ul>
      </details>
      <div className="wd-crawl-findings">
        {result.issues.map((issue) => {
          const translation = getAuditIssueTranslation(issue.issue_id, locale);
          const recommendation = translation ? {
            summary: translation.summary, steps: translation.steps, expected_impact: translation.expectedImpact,
          } : issue.recommendation;
          return <details key={issue.issue_id}>
          <summary>{issue.priority} · {reportSeverityLabel(locale, issue.severity)} · {translation?.title ?? issue.title}</summary>
          <p>{translation?.description ?? issue.description}</p>
          <p>{ru ? "Затронуто URL" : "Affected URLs"}: {issue.affected_url_count}</p>
          <ul>{issue.affected_urls.map((url) => <li key={url}>{url}</li>)}</ul>
          {issue.affected_url_count > issue.affected_urls.length && <p>{ru
            ? "Показана выборка затронутых URL."
            : "A sample of affected URLs is shown."}</p>}
          <p>{recommendation.summary}</p>
          <ol>{recommendation.steps.map((step) => <li key={step}>{step}</li>)}</ol>
          {recommendation.expected_impact && <p>{recommendation.expected_impact}</p>}
        </details>;
        })}
      </div>
    </div>
  );
}
