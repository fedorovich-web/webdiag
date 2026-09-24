import type { CSSProperties } from "react";
import type { Locale } from "@webdiag/tool-registry";
import type { ReportSnapshot } from "./account-report-contract";
import {
  formatReportDate,
  orderedReportIssues,
  reportPriorityDistribution,
  reportCategoryLabel,
  reportPriorityLabel,
  reportSummary,
} from "./account-report-presentation";

function categoryCounts(snapshot: ReportSnapshot) {
  const counts = new Map<string, number>();
  for (const issue of snapshot.issues) {
    counts.set(issue.category, (counts.get(issue.category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

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
  const categories = categoryCounts(snapshot);
  const affectedPageCount = new Set(snapshot.issues.flatMap((issue) => issue.affected_urls)).size;
  const passedChecks = Math.max(0, summary.checkCount - summary.nonPassingCheckCount);
  const totalPriority = Math.max(1, priorities.reduce((sum, item) => sum + item.count, 0));
  const p0 = priorities.find((item) => item.priority === "p0")?.count ?? 0;
  const p1 = priorities.find((item) => item.priority === "p1")?.count ?? 0;
  const p2 = priorities.find((item) => item.priority === "p2")?.count ?? 0;
  const p3 = priorities.find((item) => item.priority === "p3")?.count ?? 0;
  const p0End = (p0 / totalPriority) * 100;
  const p1End = p0End + (p1 / totalPriority) * 100;
  const p2End = p1End + (p2 / totalPriority) * 100;
  const donutStyle: CSSProperties = {
    background: "conic-gradient(#ef4058 0 " + p0End + "%, #ff9d35 " + p0End + "% " + p1End + "%, #f6c544 " + p1End + "% " + p2End + "%, #2e8df7 " + p2End + "% 100%)",
  };

  return (
    <article className="wd-report-snapshot wd-report-render">
      <header className="wd-report-render-head">
        <div>
          <span className="eyebrow">{ru ? "SEO-аудит сайта" : "Website SEO audit"}</span>
          <h1>{ru ? "Отчёт по проверке сайта" : "Website audit report"}</h1>
          <p>{snapshot.project_name}</p>
          <a href={snapshot.target_origin} target="_blank" rel="noreferrer">{snapshot.target_origin}</a>
        </div>
        <div className="wd-report-render-score">
          <span>{ru ? "Оценка" : "Score"}</span>
          <strong>{snapshot.score ?? "—"}</strong>
          <small>{snapshot.score === null ? (ru ? "Нет оценки" : "No score") : snapshot.score >= 80 ? (ru ? "Хорошо" : "Good") : snapshot.score >= 60 ? (ru ? "Нужно улучшить" : "Needs work") : (ru ? "Требует внимания" : "Needs attention")}</small>
        </div>
      </header>

      <section className="wd-report-render-kpis" aria-label={ru ? "Сводка отчёта" : "Report summary"}>
        <article className="is-score"><span>{ru ? "Оценка сайта" : "Site score"}</span><strong>{snapshot.score ?? "—"}</strong><small>{ru ? "из 100" : "out of 100"}</small></article>
        <article className="is-danger"><span>{ru ? "Проблемы" : "Issues"}</span><strong>{summary.issueCount}</strong><small>{ru ? "найдено" : "detected"}</small></article>
        <article><span>{ru ? "Проверки" : "Checks"}</span><strong>{summary.checkCount}</strong><small>{ru ? "выполнено" : "completed"}</small></article>
        <article><span>{ru ? "Страницы" : "Pages"}</span><strong>{affectedPageCount}</strong><small>{ru ? "затронуто" : "affected"}</small></article>
      </section>

      <section className="wd-report-render-visual-grid">
        <article className="wd-report-render-panel wd-report-check-health">
          <header><div><span className="eyebrow">{ru ? "Состояние аудита" : "Audit status"}</span><h2>{ru ? "Результаты проверок" : "Check results"}</h2></div><small>{formatReportDate(locale, snapshot.audit_completed_at)}</small></header>
          <div className="wd-report-health-bars">
            <div><span>{ru ? "Пройдено" : "Passed"}</span><i><b style={{ width: summary.checkCount ? Math.round((passedChecks / summary.checkCount) * 100) + "%" : "0%" }} /></i><strong>{passedChecks}</strong></div>
            <div><span>{ru ? "Требуют внимания" : "Need attention"}</span><i><b className="is-warning" style={{ width: summary.checkCount ? Math.round((summary.nonPassingCheckCount / summary.checkCount) * 100) + "%" : "0%" }} /></i><strong>{summary.nonPassingCheckCount}</strong></div>
          </div>
          <div className="wd-report-health-note">
            <strong>{snapshot.score ?? "—"}</strong>
            <span>{ru ? "Итоговая оценка сохранённого аудита" : "Saved audit score"}</span>
          </div>
        </article>

        <article className="wd-report-render-panel wd-report-priority-donut-panel">
          <header><div><span className="eyebrow">{ru ? "Проблемы" : "Issues"}</span><h2>{ru ? "Распределение проблем" : "Issue distribution"}</h2></div></header>
          <div className="wd-report-priority-donut-wrap">
            <div className="wd-report-priority-donut" style={donutStyle}><span><strong>{summary.issueCount}</strong><small>{ru ? "проблем" : "issues"}</small></span></div>
            <ul>
              {priorities.map((item) => <li key={item.priority} data-priority={item.priority}><i aria-hidden="true" /><span>{reportPriorityLabel(locale, item.priority)}</span><strong>{item.count}</strong></li>)}
            </ul>
          </div>
        </article>
      </section>

      <section className="wd-report-render-parameters" aria-labelledby="report-parameters-title">
        <div className="wd-report-render-section-head"><div><span className="eyebrow">{ru ? "Разделы" : "Sections"}</span><h2 id="report-parameters-title">{ru ? "Основные параметры" : "Key areas"}</h2></div></div>
        <div className="wd-report-render-parameter-grid">
          {categories.length ? categories.slice(0, 4).map((item) => {
            const ratio = summary.issueCount ? Math.round((item.count / summary.issueCount) * 100) : 0;
            return <article key={item.category}><span>{reportCategoryLabel(locale, item.category)}</span><strong>{item.count}</strong><small>{ru ? "проблем" : "issues"}</small><i><b style={{ width: ratio + "%" }} /></i></article>;
          }) : <article><span>{ru ? "Проверки" : "Checks"}</span><strong>{summary.checkCount}</strong><small>{ru ? "проблем не найдено" : "no issues detected"}</small><i><b style={{ width: "100%" }} /></i></article>}
        </div>
      </section>

      <section className="wd-report-render-problem-grid">
        <article className="wd-report-render-panel wd-report-render-priority-table">
          <div className="wd-report-render-section-head"><div><span className="eyebrow">{ru ? "Приоритет" : "Priority"}</span><h2>{ru ? "Приоритетные проблемы" : "Priority issues"}</h2></div><strong>{issues.length}</strong></div>
          {issues.length === 0 ? <p>{ru ? "В этом отчёте проблемы не зафиксированы." : "No issues are recorded in this report."}</p> : (
            <div className="wd-report-render-issue-table">
              {issues.slice(0, 7).map((issue, index) => (
                <article key={issue.issue_id}>
                  <span className={"wd-report-render-order is-" + issue.priority}>{index + 1}</span>
                  <div><strong>{issue.title}</strong><small>{reportCategoryLabel(locale, issue.category)} · {issue.affected_urls.length} {ru ? "стр." : "pages"}</small></div>
                  <span className={"wd-issues-priority is-" + issue.priority}>{reportPriorityLabel(locale, issue.priority)}</span>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="wd-report-render-panel wd-report-category-panel">
          <div className="wd-report-render-section-head"><div><span className="eyebrow">{ru ? "Разделы" : "Areas"}</span><h2>{ru ? "Проблемы по разделам" : "Issues by area"}</h2></div></div>
          <div className="wd-report-category-list">
            {categories.slice(0, 7).map((item) => (
              <div key={item.category}><span>{reportCategoryLabel(locale, item.category)}</span><i><b style={{ width: summary.issueCount ? Math.round((item.count / summary.issueCount) * 100) + "%" : "0%" }} /></i><strong>{item.count}</strong></div>
            ))}
          </div>
        </article>
      </section>

      {summary.firstActions.length > 0 && (
        <section className="wd-report-render-recommendation">
          <div>
            <span className="eyebrow">{ru ? "Рекомендации" : "Recommendations"}</span>
            <h2>{ru ? "Персональные рекомендации" : "Recommended next steps"}</h2>
            <p>{ru ? "Начните с проблем с максимальным приоритетом, затем перепроверьте сайт." : "Start with the highest-priority issues, then run the audit again."}</p>
          </div>
          <ol>{summary.firstActions.slice(0, 4).map((action, index) => <li key={index + ":" + action}>{action}</li>)}</ol>
        </section>
      )}

      <section className="wd-report-checks" aria-labelledby="report-checks-title">
        <div className="wd-report-section-heading"><div><span className="eyebrow">{ru ? "Состав аудита" : "Audit scope"}</span><h2 id="report-checks-title">{ru ? "Все проверки" : "All checks"}</h2></div><strong>{snapshot.checks.length}</strong></div>
        <div className="wd-report-check-compact">
          {snapshot.checks.map((check) => <div key={check.check_id}><span>{check.name}</span><strong>{check.status}</strong></div>)}
        </div>
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
