import type { Locale } from "@webdiag/tool-registry";
import type { ReportSnapshot } from "./account-report-contract";

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
  return (
    <div className="wd-report-snapshot">
      <header className="wd-report-snapshot-head">
        <div>
          <span className="eyebrow">{ru ? "Сохранённый отчёт" : "Saved report"}</span>
          <h1>{snapshot.title}</h1>
          <p>{snapshot.project_name} · {snapshot.target_origin}</p>
        </div>
        <strong>{snapshot.score === null ? "—" : `${snapshot.score}/100`}</strong>
      </header>

      <dl className="wd-report-meta">
        <div><dt>{ru ? "Аудит завершён" : "Audit completed"}</dt><dd>{new Date(snapshot.audit_completed_at).toLocaleString(ru ? "ru-RU" : "en-US")}</dd></div>
        <div><dt>{ru ? "Отчёт создан" : "Report generated"}</dt><dd>{new Date(snapshot.generated_at).toLocaleString(ru ? "ru-RU" : "en-US")}</dd></div>
        <div><dt>{ru ? "Проверок" : "Checks"}</dt><dd>{snapshot.checks.length}</dd></div>
      </dl>

      <section className="wd-saved-checks" aria-labelledby="report-checks-title">
        <h2 id="report-checks-title">{ru ? "Проверки" : "Checks"}</h2>
        <div className="wd-check-grid">
          {snapshot.checks.map((check) => (
            <article key={check.check_id}>
              <h3>{ru ? (ruChecks[check.check_id] ?? check.name) : check.name}</h3>
              <p>{check.status}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="wd-saved-issues" aria-labelledby="report-issues-title">
        <h2 id="report-issues-title">{ru ? "Проблемы и рекомендации" : "Issues and recommendations"}</h2>
        {snapshot.issues.length === 0 ? (
          <p>{ru ? "Проблем не найдено." : "No issues found."}</p>
        ) : (
          <div className="wd-issue-list">
            {snapshot.issues.map((issue) => (
              <article key={issue.issue_id}>
                <header><span>{issue.priority.toUpperCase()}</span><h3>{issue.title}</h3></header>
                <p>{issue.description}</p>
                <strong>{issue.recommendation.summary}</strong>
                {issue.recommendation.steps.length > 0 && <ol>{issue.recommendation.steps.map((step) => <li key={step}>{step}</li>)}</ol>}
                {issue.affected_urls.length > 0 && <ul>{issue.affected_urls.map((url) => <li key={url}>{url}</li>)}</ul>}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
