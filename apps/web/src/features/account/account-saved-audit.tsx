"use client";

import Link from "next/link";
import { Gauge, Smartphone } from "lucide-react";
import { useEffect, useState, type ChangeEvent, type CSSProperties } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { accountErrorMessage } from "./account-messages";
import { createAccountReport } from "./account-report-client";
import { getAccountSavedAudit } from "./account-workspace-client";
import type { SavedAuditDetailResponse } from "./account-workspace-contract";
import { projectPath, reportPath, savedAuditIssuesPath, toolsPath } from "../../lib/routes";
import { AccountAIAuditCopilot } from "./account-ai-audit-copilot";
import { AccountReportSnapshotView } from "./account-report-view";
import type { ReportSnapshot } from "./account-report-contract";


const pageSpeedMetricLabels: Readonly<Record<string, readonly [string, string]>> = {
  "largest-contentful-paint": ["LCP", "LCP"],
  "cumulative-layout-shift": ["CLS", "CLS"],
  "interaction_to_next_paint": ["INP", "INP"],
  "first-contentful-paint": ["FCP", "FCP"],
  "total-blocking-time": ["TBT", "TBT"],
  "speed-index": ["Speed Index", "Speed Index"],
};

const pageSpeedCategoryLabels: Readonly<Record<string, readonly [string, string]>> = {
  performance: ["Производительность", "Performance"],
  accessibility: ["Доступность", "Accessibility"],
  "best-practices": ["Практики", "Best practices"],
  seo: ["SEO", "SEO"],
};

function pageSpeedScoreTone(score: number | null): "good" | "warning" | "bad" | "unknown" {
  if (score === null) return "unknown";
  if (score >= 90) return "good";
  if (score >= 50) return "warning";
  return "bad";
}

export function AccountSavedAudit({ locale, projectId, auditId }: { readonly locale: Locale; readonly projectId: string; readonly auditId: string }) {
  const ru = locale === "ru";
  const [detail, setDetail] = useState<SavedAuditDetailResponse | null>(null);
  const [reportTitle, setReportTitle] = useState(ru ? "Отчёт по аудиту сайта" : "Website audit report");
  const [reportPending, setReportPending] = useState(false);
  const [createdReportId, setCreatedReportId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getAccountSavedAudit(projectId, auditId, locale)
      .then((value) => { if (active) setDetail(value); })
      .catch((caught) => { if (active) setError(accountErrorMessage(locale, caught)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [auditId, locale, projectId]);

  async function createReport() {
    setReportPending(true);
    setError("");
    try {
      const report = await createAccountReport(projectId, auditId, {
        title: reportTitle,
        locale,
      });
      setCreatedReportId(report.report.id);
    } catch (caught) {
      setError(accountErrorMessage(locale, caught));
    } finally {
      setReportPending(false);
    }
  }

  if (loading) return <section className="wd-account-card" aria-busy="true"><p>{ru ? "Загружаем отчёт…" : "Loading report…"}</p></section>;
  if (!detail) return <section className="wd-account-card wd-account-empty"><h1>{ru ? "Отчёт недоступен" : "Report unavailable"}</h1>{error && <p className="wd-account-error" role="alert">{error}</p>}</section>;

  const pageSpeed = detail.payload.pagespeed ?? null;
  const pageSpeedCategories = pageSpeed
    ? ["performance", "accessibility", "best-practices", "seo"]
      .map((id) => ({ id, score: pageSpeed.category_scores[id] ?? null }))
      .filter((item) => item.score !== null)
    : [];
  const pageSpeedMetricOrder = [
    "largest-contentful-paint",
    "cumulative-layout-shift",
    "interaction_to_next_paint",
    "first-contentful-paint",
    "total-blocking-time",
    "speed-index",
  ];
  const pageSpeedMetrics = pageSpeed
    ? [...pageSpeed.metrics].sort((left, right) => {
      const leftIndex = pageSpeedMetricOrder.indexOf(left.id);
      const rightIndex = pageSpeedMetricOrder.indexOf(right.id);
      return (leftIndex < 0 ? 99 : leftIndex) - (rightIndex < 0 ? 99 : rightIndex);
    })
    : [];

  const snapshot: ReportSnapshot = {
    contract_version: "webdiag.account.report_snapshot.v1",
    title: ru ? "Отчёт по проверке сайта" : "Website audit report",
    locale,
    project_name: detail.project.name,
    target_origin: detail.payload.target_origin,
    audit_completed_at: detail.payload.completed_at,
    score: detail.payload.score,
    checks: detail.payload.checks,
    issues: detail.payload.issues,
    generated_at: detail.audit.created_at,
  };

  return (
    <section className="wd-account-dashboard wd-saved-audit-render">
      <nav className="wd-account-breadcrumb" aria-label={ru ? "Навигация кабинета" : "Account navigation"}>
        <Link href={projectPath(locale, projectId)}>{detail.project.name}</Link>
        <span aria-hidden="true">/</span>
        <span>{ru ? "Отчёт" : "Report"}</span>
      </nav>

      <AccountReportSnapshotView locale={locale} snapshot={snapshot} />


      {pageSpeed && (
        <section className="wd-saved-pagespeed" aria-labelledby="saved-pagespeed-title">
          <header className="wd-saved-pagespeed-head">
            <div>
              <span className="wd-saved-pagespeed-kicker"><Smartphone aria-hidden="true" /> PageSpeed · Mobile</span>
              <h2 id="saved-pagespeed-title">{ru ? "Производительность страницы" : "Page performance"}</h2>
              <p>
                {pageSpeed.available
                  ? (ru
                    ? "Данные Google PageSpeed Insights, сохранённые вместе с этим аудитом."
                    : "Google PageSpeed Insights data saved with this audit.")
                  : (ru
                    ? "PageSpeed был недоступен во время этого аудита. Основной аудит сохранён без штрафа за производительность."
                    : "PageSpeed was unavailable during this audit. The main audit was saved without a performance penalty.")}
              </p>
            </div>
            <Link className="wd-dashboard-panel-link" href={`${toolsPath(locale)}/core-web-vitals-checker`}>
              {ru ? "Проверить заново" : "Run again"} <span aria-hidden="true">→</span>
            </Link>
          </header>

          {pageSpeed.available ? (
            <>
              <div className="wd-saved-pagespeed-summary">
                <div className="wd-saved-pagespeed-score-card">
                  <span
                    className="wd-saved-pagespeed-ring"
                    data-tone={pageSpeedScoreTone(pageSpeed.performance_score)}
                    style={{ "--wd-pagespeed-score": `${Math.max(0, Math.min(100, pageSpeed.performance_score ?? 0))}%` } as CSSProperties}
                  >
                    <Gauge aria-hidden="true" />
                    <strong>{pageSpeed.performance_score ?? "—"}</strong>
                  </span>
                  <div>
                    <span>Performance</span>
                    <strong data-tone={pageSpeedScoreTone(pageSpeed.performance_score)}>
                      {pageSpeed.performance_score === null
                        ? (ru ? "Нет оценки" : "No score")
                        : pageSpeed.performance_score >= 90
                          ? (ru ? "Хорошо" : "Good")
                          : pageSpeed.performance_score >= 50
                            ? (ru ? "Нужно улучшить" : "Needs improvement")
                            : (ru ? "Плохо" : "Poor")}
                    </strong>
                    <small>
                      {pageSpeed.field_data_available
                        ? (ru ? "Есть полевые данные CrUX" : "CrUX field data available")
                        : (ru ? "Лабораторные данные Lighthouse" : "Lighthouse lab data")}
                    </small>
                  </div>
                </div>

                <div className="wd-saved-pagespeed-categories">
                  {pageSpeedCategories.map(({ id, score }) => (
                    <div key={id}>
                      <span>{pageSpeedCategoryLabels[id]?.[ru ? 0 : 1] ?? id}</span>
                      <strong data-tone={pageSpeedScoreTone(score)}>{score ?? "—"}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {pageSpeedMetrics.length > 0 && (
                <div className="wd-saved-pagespeed-metrics">
                  {pageSpeedMetrics.map((metric) => (
                    <article key={metric.id} data-status={metric.status}>
                      <div>
                        <strong>{pageSpeedMetricLabels[metric.id]?.[ru ? 0 : 1] ?? metric.title}</strong>
                        <small>{metric.source === "field" ? (ru ? "Полевые данные" : "Field") : (ru ? "Лаборатория" : "Lab")}</small>
                      </div>
                      <b>{metric.display_value ?? (metric.value === null ? "—" : metric.value)}</b>
                      <span>
                        {metric.status === "pass"
                          ? (ru ? "Хорошо" : "Good")
                          : metric.status === "warning"
                            ? (ru ? "Нужно улучшить" : "Needs improvement")
                            : metric.status === "fail"
                              ? (ru ? "Плохо" : "Poor")
                              : (ru ? "Нет данных" : "Unavailable")}
                      </span>
                    </article>
                  ))}
                </div>
              )}

              {pageSpeed.opportunities.length > 0 && (
                <div className="wd-saved-pagespeed-opportunities">
                  <strong>{ru ? "Что улучшить в первую очередь" : "Top opportunities"}</strong>
                  <ul>
                    {pageSpeed.opportunities.slice(0, 5).map((opportunity) => <li key={opportunity}>{opportunity}</li>)}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="wd-saved-pagespeed-unavailable">
              <span aria-hidden="true">—</span>
              <p>{ru ? "Метрики LCP, CLS, INP и Lighthouse score для этого запуска не записаны." : "LCP, CLS, INP, and Lighthouse scores were not recorded for this run."}</p>
            </div>
          )}
        </section>
      )}

      <div className="wd-saved-audit-actions wd-saved-audit-render-actions">
        <Link className="wd-button wd-button-primary" href={savedAuditIssuesPath(locale, projectId, auditId)}>
          {ru ? "Проблемы и приоритеты" : "Issues and priorities"}
        </Link>
      </div>

      <AccountAIAuditCopilot locale={locale} projectId={projectId} auditId={auditId} />

      <section className="wd-account-card wd-create-report-card wd-create-report-render" aria-labelledby="create-report-title">
        <div>
          <span className="eyebrow">{ru ? "Сохранённый отчёт" : "Saved report"}</span>
          <h2 id="create-report-title">{ru ? "Сохранить отдельную версию отчёта" : "Save a standalone report"}</h2>
          <p>{ru ? "Создаётся неизменяемый snapshot, который можно экспортировать или открыть по временной ссылке." : "Creates an immutable snapshot that can be exported or shared through an expiring link."}</p>
        </div>
        <label>
          {ru ? "Название отчёта" : "Report title"}
          <input value={reportTitle} onChange={(event: ChangeEvent<HTMLInputElement>) => setReportTitle(event.target.value)} maxLength={120} disabled={reportPending} />
        </label>
        <button className="wd-button wd-button-secondary" type="button" onClick={createReport} disabled={reportPending || reportTitle.trim().length < 2} aria-busy={reportPending}>
          {reportPending ? (ru ? "Создаём…" : "Creating…") : (ru ? "Создать отчёт" : "Create report")}
        </button>
        {createdReportId && <p role="status"><Link href={reportPath(locale, createdReportId)}>{ru ? "Открыть сохранённый отчёт" : "Open saved report"}</Link></p>}
        {error && <p className="wd-account-error" role="alert">{error}</p>}
      </section>
    </section>
  );
}
