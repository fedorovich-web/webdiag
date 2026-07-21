import type { Locale } from "@webdiag/tool-registry";
import type { AuditFrontendIssue, AuditFrontendResult, AuditFrontendSummary } from "./audit-contract";

export type AuditResultPanelStatus = "idle" | "loading" | "success" | "error";

export interface AuditResultPanelState {
  readonly status: AuditResultPanelStatus;
  readonly snapshot: AuditFrontendResult | null;
  readonly message: string;
  readonly submittedUrl: string;
}

interface MetricItem {
  readonly label: string;
  readonly value: string;
  readonly hint: string;
}

interface IssueItem {
  readonly id: string;
  readonly meta: string;
  readonly title: string;
  readonly description: string;
}

interface BreakdownItem {
  readonly label: string;
  readonly value: number;
}

export interface AuditResultViewModel {
  readonly eyebrow: string;
  readonly title: string;
  readonly subtitle: string;
  readonly statusLabel: string;
  readonly statusTone: "neutral" | "success" | "error";
  readonly metrics: readonly MetricItem[];
  readonly issues: readonly IssueItem[];
  readonly checksBreakdown: readonly BreakdownItem[];
  readonly priorityBreakdown: readonly BreakdownItem[];
  readonly emptyIssuesText: string;
  readonly demoReportLink: string;
  readonly retryHint: string;
}

const copy = {
  ru: {
    eyebrow: "Быстрая проверка URL",
    idleTitle: "Здесь появится результат проверки",
    loadingTitle: "Проверяем страницу",
    successTitle: "Результат проверки готов",
    errorTitle: "Проверка не запущена",
    idleSubtitle: "Введите URL в форме выше. Демо-отчёт ниже остаётся доступен как пример полного интерфейса.",
    loadingSubtitle: "Получаем страницу, проверяем доступность, метаданные, canonical, robots.txt, sitemap и базовые security-сигналы.",
    successSubtitle: "Это компактный live-result по одному URL. Демо-отчёт ниже показывает расширенный формат будущего полного аудита.",
    errorSubtitle: "Проверьте URL или доступность backend API. Демо-отчёт ниже остаётся доступен.",
    statusIdle: "ожидает URL",
    statusLoading: "идёт проверка",
    statusSuccess: "готово",
    statusError: "ошибка",
    target: "URL",
    score: "Оценка",
    issues: "Проблемы",
    checks: "Проверки",
    risk: "Риск",
    topIssues: "Приоритетные проблемы",
    checkBreakdown: "Статусы проверок",
    priorityBreakdown: "Приоритеты",
    noIssues: "Проблем в быстрой проверке не найдено.",
    reportLink: "Открыть демо полного отчёта",
    retryHint: "Повторите проверку после исправления URL или перезапуска backend API.",
    unknown: "—",
    noData: "нет данных",
  },
  en: {
    eyebrow: "Quick URL check",
    idleTitle: "The check result will appear here",
    loadingTitle: "Checking the page",
    successTitle: "Check result is ready",
    errorTitle: "Check was not started",
    idleSubtitle: "Enter a URL in the form above. The demo report below remains available as a full-interface example.",
    loadingSubtitle: "Fetching the page and checking availability, metadata, canonical, robots.txt, sitemap, and basic security signals.",
    successSubtitle: "This is a compact live result for one URL. The demo report below shows the future full-audit format.",
    errorSubtitle: "Check the URL or backend API availability. The demo report below remains available.",
    statusIdle: "waiting for URL",
    statusLoading: "checking",
    statusSuccess: "ready",
    statusError: "error",
    target: "URL",
    score: "Score",
    issues: "Issues",
    checks: "Checks",
    risk: "Risk",
    topIssues: "Priority issues",
    checkBreakdown: "Check statuses",
    priorityBreakdown: "Priorities",
    noIssues: "No issues were found in the quick check.",
    reportLink: "Open full report demo",
    retryHint: "Run the check again after correcting the URL or restarting the backend API.",
    unknown: "—",
    noData: "no data",
  },
} as const;

const severityLabels = {
  ru: {
    critical: "критично",
    high: "высокий",
    medium: "средний",
    low: "низкий",
    info: "инфо",
  },
  en: {
    critical: "critical",
    high: "high",
    medium: "medium",
    low: "low",
    info: "info",
  },
} as const;

const priorityLabels = {
  ru: { p0: "P0", p1: "P1", p2: "P2", p3: "P3" },
  en: { p0: "P0", p1: "P1", p2: "P2", p3: "P3" },
} as const;

const checkStatusLabels = {
  ru: { passed: "пройдено", warning: "предупр.", failed: "ошибка", skipped: "пропущено" },
  en: { passed: "passed", warning: "warning", failed: "failed", skipped: "skipped" },
} as const;

function labelFromMap<T extends Record<string, string>>(labels: T, value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  return labels[value.toLowerCase()] ?? value;
}

function formatScore(score: number | null | undefined, fallback: string): string {
  return typeof score === "number" ? `${Math.round(score)}/100` : fallback;
}

function summaryFromSnapshot(snapshot: AuditFrontendResult | null): AuditFrontendSummary | null {
  return snapshot?.summary ?? null;
}

function entriesFromRecord(record: Record<string, number> | null | undefined, labels: Record<string, string>): readonly BreakdownItem[] {
  if (!record) return [];
  return Object.entries(record)
    .filter(([, value]) => value > 0)
    .sort((left, right) => right[1] - left[1])
    .map(([key, value]) => ({ label: labels[key.toLowerCase()] ?? key, value }));
}

function issueMeta(locale: Locale, issue: AuditFrontendIssue): string {
  const priority = labelFromMap(priorityLabels[locale], issue.priority, issue.priority);
  const severity = labelFromMap(severityLabels[locale], issue.severity, issue.severity);
  return `${priority} · ${severity}`;
}

export function getAuditResultViewModel(locale: Locale, state: AuditResultPanelState): AuditResultViewModel {
  const t = copy[locale];
  const snapshot = state.snapshot;
  const summary = summaryFromSnapshot(snapshot);
  const score = summary?.score ?? snapshot?.run?.score ?? null;
  const issueCount = summary?.issueCount ?? snapshot?.run?.issues.length ?? null;
  const checkCount = summary?.checkCount ?? snapshot?.run?.checks.length ?? null;
  const highestSeverity = labelFromMap(severityLabels[locale], summary?.highestSeverity, t.noData);
  const target = (snapshot?.job.target.hostname ?? state.submittedUrl) || t.unknown;

  const titleByStatus = {
    idle: t.idleTitle,
    loading: t.loadingTitle,
    success: t.successTitle,
    error: t.errorTitle,
  } as const;
  const subtitleByStatus = {
    idle: t.idleSubtitle,
    loading: t.loadingSubtitle,
    success: t.successSubtitle,
    error: state.message || t.errorSubtitle,
  } as const;
  const statusByStatus = {
    idle: t.statusIdle,
    loading: t.statusLoading,
    success: t.statusSuccess,
    error: t.statusError,
  } as const;

  const statusTone = state.status === "success" ? "success" : state.status === "error" ? "error" : "neutral";

  return {
    eyebrow: t.eyebrow,
    title: titleByStatus[state.status],
    subtitle: subtitleByStatus[state.status],
    statusLabel: statusByStatus[state.status],
    statusTone,
    metrics: [
      { label: t.target, value: target, hint: snapshot?.job.target.scope ?? "single_url" },
      { label: t.score, value: state.status === "loading" ? "…" : formatScore(score, t.unknown), hint: "health" },
      { label: t.issues, value: state.status === "loading" ? "…" : String(issueCount ?? t.unknown), hint: t.priorityBreakdown },
      { label: t.checks, value: state.status === "loading" ? "…" : String(checkCount ?? t.unknown), hint: highestSeverity },
    ],
    issues: (snapshot?.run?.issues ?? []).slice(0, 5).map((issue) => ({
      id: issue.id,
      meta: issueMeta(locale, issue),
      title: issue.title,
      description: issue.description,
    })),
    checksBreakdown: entriesFromRecord(summary?.checksByStatus, checkStatusLabels[locale]),
    priorityBreakdown: entriesFromRecord(summary?.issuesByPriority, priorityLabels[locale]),
    emptyIssuesText: t.noIssues,
    demoReportLink: t.reportLink,
    retryHint: t.retryHint,
  };
}

export function HomeAuditResultSection({ locale, state }: { locale: Locale; state: AuditResultPanelState }) {
  const view = getAuditResultViewModel(locale, state);
  const showDetails = state.status === "success";
  const showLoading = state.status === "loading";
  const showError = state.status === "error";

  return (
    <section className="wd-section wd-audit-result-section" id="audit-result" aria-labelledby="wd-audit-result-title" aria-live="polite">
      <div className="shell">
        <div className={`wd-audit-result-card is-${view.statusTone}`}>
          <header className="wd-audit-result-header">
            <div>
              <span className="wd-eyebrow">{view.eyebrow}</span>
              <h2 id="wd-audit-result-title">{view.title}</h2>
              <p>{view.subtitle}</p>
            </div>
            <b>{view.statusLabel}</b>
          </header>

          <div className="wd-audit-result-metrics">
            {view.metrics.map((metric) => (
              <article key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <em>{metric.hint}</em>
              </article>
            ))}
          </div>

          {showLoading ? <div className="wd-audit-result-loading" aria-hidden="true"><i /><i /><i /></div> : null}

          {showDetails ? (
            <div className="wd-audit-result-grid">
              <article>
                <h3>{copy[locale].topIssues}</h3>
                {view.issues.length ? (
                  <ul className="wd-audit-result-issues">
                    {view.issues.map((issue) => (
                      <li key={issue.id}>
                        <span>{issue.meta}</span>
                        <strong>{issue.title}</strong>
                        <p>{issue.description}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="wd-audit-result-empty">{view.emptyIssuesText}</p>
                )}
              </article>

              <aside>
                <h3>{copy[locale].checkBreakdown}</h3>
                <div className="wd-audit-result-breakdown">
                  {view.checksBreakdown.map((item) => <span key={item.label}><b>{item.value}</b>{item.label}</span>)}
                </div>
                <h3>{copy[locale].priorityBreakdown}</h3>
                <div className="wd-audit-result-breakdown">
                  {view.priorityBreakdown.length ? view.priorityBreakdown.map((item) => <span key={item.label}><b>{item.value}</b>{item.label}</span>) : <span><b>0</b>{copy[locale].noData}</span>}
                </div>
              </aside>
            </div>
          ) : null}

          {showError ? <p className="wd-audit-result-retry">{view.retryHint}</p> : null}
          <a className="wd-audit-result-link" href="#report">{view.demoReportLink}<span aria-hidden="true">→</span></a>
        </div>
      </div>
    </section>
  );
}
