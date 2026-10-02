import Link from "next/link";
import { Gauge, Smartphone } from "lucide-react";
import type { CSSProperties } from "react";
import type { Locale } from "@webdiag/tool-registry";
import type { SavedAuditPageSpeed } from "./account-workspace-contract";
import { toolsPath } from "../../lib/routes";

const metricLabels: Readonly<Record<string, string>> = {
  "largest-contentful-paint": "LCP",
  "cumulative-layout-shift": "CLS",
  "interaction_to_next_paint": "INP",
  "first-contentful-paint": "FCP",
  "total-blocking-time": "TBT",
  "speed-index": "Speed Index",
};

const categoryLabels: Readonly<Record<string, readonly [string, string]>> = {
  performance: ["Производительность", "Performance"],
  accessibility: ["Доступность", "Accessibility"],
  "best-practices": ["Практики", "Best practices"],
  seo: ["SEO", "SEO"],
};

function scoreTone(score: number | null): "good" | "warning" | "bad" | "unknown" {
  if (score === null) return "unknown";
  if (score >= 90) return "good";
  if (score >= 50) return "warning";
  return "bad";
}

export function AccountPageSpeedSnapshot({
  locale,
  pageSpeed,
}: {
  readonly locale: Locale;
  readonly pageSpeed: SavedAuditPageSpeed;
}) {
  const ru = locale === "ru";
  const categories = ["performance", "accessibility", "best-practices", "seo"]
    .map((id) => ({ id, score: pageSpeed.category_scores[id] ?? null }))
    .filter((item) => item.score !== null);
  const order = [
    "largest-contentful-paint",
    "cumulative-layout-shift",
    "interaction_to_next_paint",
    "first-contentful-paint",
    "total-blocking-time",
    "speed-index",
  ];
  const metrics = [...pageSpeed.metrics].sort((left, right) => {
    const leftIndex = order.indexOf(left.id);
    const rightIndex = order.indexOf(right.id);
    return (leftIndex < 0 ? 99 : leftIndex) - (rightIndex < 0 ? 99 : rightIndex);
  });

  return (
    <section className="wd-saved-pagespeed" aria-labelledby="saved-pagespeed-title">
      <header className="wd-saved-pagespeed-head">
        <div>
          <span className="wd-saved-pagespeed-kicker">
            <Smartphone aria-hidden="true" /> PageSpeed · Mobile
          </span>
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
                data-tone={scoreTone(pageSpeed.performance_score)}
                style={{
                  "--wd-pagespeed-score": `${Math.max(
                    0,
                    Math.min(100, pageSpeed.performance_score ?? 0),
                  )}%`,
                } as CSSProperties}
              >
                <Gauge aria-hidden="true" />
                <strong>{pageSpeed.performance_score ?? "—"}</strong>
              </span>
              <div>
                <span>Performance</span>
                <strong data-tone={scoreTone(pageSpeed.performance_score)}>
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
              {categories.map(({ id, score }) => (
                <div key={id}>
                  <span>{categoryLabels[id]?.[ru ? 0 : 1] ?? id}</span>
                  <strong data-tone={scoreTone(score)}>{score ?? "—"}</strong>
                </div>
              ))}
            </div>
          </div>

          {metrics.length > 0 && (
            <div className="wd-saved-pagespeed-metrics">
              {metrics.map((metric) => (
                <article key={metric.id} data-status={metric.status}>
                  <div>
                    <strong>{metricLabels[metric.id] ?? metric.title}</strong>
                    <small>
                      {metric.source === "field"
                        ? (ru ? "Полевые данные" : "Field")
                        : (ru ? "Лаборатория" : "Lab")}
                    </small>
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
                {pageSpeed.opportunities.slice(0, 5).map((opportunity) => (
                  <li key={opportunity}>{opportunity}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <div className="wd-saved-pagespeed-unavailable">
          <span aria-hidden="true">—</span>
          <p>
            {ru
              ? "Метрики LCP, CLS, INP и Lighthouse score для этого запуска не записаны."
              : "LCP, CLS, INP, and Lighthouse scores were not recorded for this run."}
          </p>
        </div>
      )}
    </section>
  );
}
