import type { Locale } from "@webdiag/tool-registry";
import type { ReportSnapshot } from "./account-report-contract";
import {
  formatReportDate,
  groupReportChecks,
  groupReportIssues,
  orderedReportIssues,
  reportPriorityDistribution,
  reportPriorityLabel,
  reportSummary,
} from "./account-report-presentation";

const ruChecks: Readonly<Record<string, string>> = {
  "http.status": "HTTP-статус",
  "redirects.chain": "Цепочка перенаправлений",
  "content_type.html": "HTML-тип содержимого",
  "metadata.title": "Title",
  "metadata.description": "Метаописание",
  "metadata.h1": "H1",
  "metadata.canonical": "Canonical",
  "indexability.robots_meta": "Robots meta",
  "metadata.open_graph": "Open Graph",
  "structured_data.json_ld": "JSON-LD",
  "security.headers": "Заголовки безопасности",
  "crawlability.robots_txt": "robots.txt",
  "crawlability.sitemap_xml": "sitemap.xml",
};

export function AccountReportSnapshotView({
  locale,
  snapshot,
}: {
  readonly locale: Locale;
  readonly snapshot: ReportSnapshot;
}) {
  const ru = locale === "ru";
  const summary = reportSummary(snapshot);
  const priorities = reportPriorityDistribution(snapshot.issues);
  const issues = orderedReportIssues(snapshot.issues);
  const issueGroups = groupReportIssues(snapshot.issues);
  const checks = groupReportChecks(snapshot.checks);

  return (
    <article className="wd-report-snapshot">
      <header className="wd-report-snapshot-head">
        <div>
          <span className="eyebrow">{ru ? "Неизменяемый отчёт" : "Immutable report"}</span>
          <h1>{snapshot.title}</h1>
          <p>{snapshot.project_name}</p>
          <a href={snapshot.target_origin} target="_blank" rel="noreferrer">{snapshot.target_origin}</a>
        </div>
        <strong>{snapshot.score === null ? "—" : `${snapshot.score}/100`}</strong>
      </header>

      <dl className="wd-report-meta">
        <div><dt>{ru ? "Аудит завершён" : "Audit completed"}</dt><dd>{formatReportDate(locale, snapshot.audit_completed_at)}</dd></div>
        <div><dt>{ru ? "Отчёт создан" : "Report generated"}</dt><dd>{formatReportDate(locale, snapshot.generated_at)}</dd></div>
        <div><dt>{ru ? "Проверок" : "Checks"}</dt><dd>{summary.checkCount}</dd></div>
      </dl>

      <section className="wd-report-executive" aria-labelledby="report-summary-title">
        <div>
          <span className="eyebrow">{ru ? "Краткое резюме" : "Executive summary"}</span>
          <h2 id="report-summary-title">{ru ? "Результат сохранённого аудита" : "Saved audit result"}</h2>
          <p>{summary.issueCount === 0
            ? (ru ? `Проблемы не зафиксированы по результатам ${summary.checkCount} проверок.` : `No issues were recorded across ${summary.checkCount} checks.`)
            : (ru ? `Зафиксировано проблем: ${summary.issueCount}. Проверок, требующих внимания: ${summary.nonPassingCheckCount} из ${summary.checkCount}.` : `${summary.issueCount} issues were recorded. ${summary.nonPassingCheckCount} of ${summary.checkCount} checks require attention.`)}</p>
        </div>
        <div className="wd-report-priority-grid" aria-label={ru ? "Распределение по приоритетам" : "Priority distribution"}>
          {priorities.map((item) => <div key={item.priority}><span>{item.priority.toUpperCase()}</span><strong>{item.count}</strong></div>)}
        </div>
        {summary.firstActions.length > 0 && (
          <div className="wd-report-first-actions">
            <h3>{ru ? "С чего начать" : "Start here"}</h3>
            <ol>{summary.firstActions.map((action, index) => <li key={`${index}:${action}`}>{action}</li>)}</ol>
          </div>
        )}
      </section>

      <section className="wd-report-issues" aria-labelledby="report-issues-title">
        <div className="wd-report-section-heading"><div><span className="eyebrow">{ru ? "Порядок исправления" : "Fix order"}</span><h2 id="report-issues-title">{ru ? "Проблемы и рекомендации" : "Issues and recommendations"}</h2></div><strong>{issues.length}</strong></div>
        {issues.length === 0 ? <p>{ru ? "В этом snapshot проблемы не зафиксированы." : "No issues are recorded in this snapshot."}</p> : (
          <div className="wd-report-issue-groups">
            {issueGroups.map((group) => <section key={group.priority} className="wd-report-issue-group"><h3>{reportPriorityLabel(locale, group.priority)} <span>{group.issues.length}</span></h3><div className="wd-report-issue-list">
            {group.issues.map((issue) => {
              const index = issues.findIndex((item) => item.issue_id === issue.issue_id);
              return (
              <article key={issue.issue_id}>
                <div className="wd-report-issue-order">{index + 1}</div>
                <div>
                  <div className="wd-report-issue-meta"><span>{reportPriorityLabel(locale, issue.priority)}</span><span>{issue.category}</span><span>{issue.affected_urls.length} {ru ? "стр." : "pages"}</span></div>
                  <h3>{issue.title}</h3>
                  <p>{issue.description}</p>
                  <div className="wd-report-recommendation"><span>{ru ? "Рекомендация" : "Recommendation"}</span><strong>{issue.recommendation.summary}</strong></div>
                  {issue.recommendation.steps.length > 0 && <ol>{issue.recommendation.steps.map((step) => <li key={step}>{step}</li>)}</ol>}
                  {issue.recommendation.expected_impact && <p><strong>{ru ? "Ожидаемый эффект:" : "Expected impact:"}</strong> {issue.recommendation.expected_impact}</p>}
                  {issue.affected_urls.length > 0 && <details><summary>{ru ? "Затронутые страницы" : "Affected pages"}</summary><ul>{issue.affected_urls.map((url) => <li key={url}><code>{url}</code></li>)}</ul></details>}
                </div>
              </article>
              );
            })}
            </div></section>)}
          </div>
        )}
      </section>

      <section className="wd-report-checks" aria-labelledby="report-checks-title">
        <div className="wd-report-section-heading"><div><span className="eyebrow">{ru ? "Состав аудита" : "Audit scope"}</span><h2 id="report-checks-title">{ru ? "Результаты проверок" : "Check results"}</h2></div><strong>{snapshot.checks.length}</strong></div>
        {checks.attention.length > 0 && <div className="wd-report-check-group"><h3>{ru ? "Требуют внимания" : "Require attention"}</h3><ul>{checks.attention.map((check) => <li key={check.check_id}><span>{ru ? (ruChecks[check.check_id] ?? check.name) : check.name}</span><strong>{check.status}</strong></li>)}</ul></div>}
        <details className="wd-report-passed-checks" open={checks.attention.length === 0}><summary>{ru ? `Пройдено проверок: ${checks.passed.length}` : `Passed checks: ${checks.passed.length}`}</summary>{checks.passed.length > 0 ? <ul>{checks.passed.map((check) => <li key={check.check_id}><span>{ru ? (ruChecks[check.check_id] ?? check.name) : check.name}</span><strong>{check.status}</strong></li>)}</ul> : <p>{ru ? "Пройденных проверок нет." : "No checks passed."}</p>}</details>
      </section>

      <section className="wd-report-methodology" aria-labelledby="report-methodology-title">
        <span className="eyebrow">{ru ? "Методология и границы" : "Methodology and scope"}</span>
        <h2 id="report-methodology-title">{ru ? "Что содержит этот отчёт" : "What this report contains"}</h2>
        <p>{ru ? "Отчёт создан из одного сохранённого аудита и не изменяется после создания. Он отражает только проверки, проблемы и рекомендации, записанные в снимке на указанную дату." : "This report was created from one saved audit and does not change after creation. It reflects only the checks, issues, and recommendations stored in the snapshot at the stated time."}</p>
        <p>{ru ? "Отчёт не является измерением uptime и не подтверждает непрерывную доступность сайта." : "This report is not an uptime measurement and does not verify continuous site availability."}</p>
      </section>
    </article>
  );
}
