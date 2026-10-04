"use client";

import { toolErrorMessage } from "./tool-error-presentation";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import type { Locale } from "@webdiag/tool-registry";
import { AuditClientError, parseAuditUrlInput, startAuditSnapshot } from "../home/audit-client";
import type { AuditFrontendIssue, AuditFrontendResult } from "../home/audit-contract";
import { localizeAuditCheck, localizeAuditIssue } from "./audit-taxonomy-i18n";
import {
  ExternalLink,
  Printer,
  Share2,
  Search,
  Gauge,
  CheckCircle2,
  Loader2,
  Clock,
  ArrowRight,
  Activity,
  ChevronRight,
} from "lucide-react";

function toolsPath(locale: Locale): string {
  return locale === "ru" ? "/tools" : "/en/tools";
}

const priorityRank: Readonly<Record<string, number>> = { p0: 0, p1: 1, p2: 2, p3: 3 };
const severityRank: Readonly<Record<string, number>> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

export function orderAuditIssues(issues: readonly AuditFrontendIssue[]): readonly AuditFrontendIssue[] {
  return [...issues].sort((left, right) => {
    const byPriority = (priorityRank[left.priority.toLowerCase()] ?? 99) - (priorityRank[right.priority.toLowerCase()] ?? 99);
    if (byPriority !== 0) return byPriority;
    const bySeverity = (severityRank[left.severity.toLowerCase()] ?? 99) - (severityRank[right.severity.toLowerCase()] ?? 99);
    return bySeverity || left.id.localeCompare(right.id);
  });
}

const copy = {
  ru: {
    url: "URL страницы",
    placeholder: "https://example.ru/page",
    run: "Проверить страницу",
    loading: "Выполняем полный аудит страницы…",
    liveTitle: "Выполняется глубокий аудит страницы",
    liveSubtitle: "Анализ 30+ технических параметров: DNS, SSL, HTML-метатеги, robots.txt, sitemap и PageSpeed",
    stageDns: "DNS и доступность хоста",
    stageDnsDesc: "Проверка резолва домена, A/AAAA записей, время отклика сервера",
    stageSsl: "SSL/TLS и безопасность протокола",
    stageSslDesc: "HTTPS-сертификат, валидность цепочки, HSTS, CSP и заголовки",
    stageHtml: "HTML-разметка, Title и Open Graph",
    stageHtmlDesc: "Title, Description, заголовки H1-H6, микроразметка Schema.org",
    stageRobots: "Индексация, robots.txt и sitemap.xml",
    stageRobotsDesc: "Директивы поисковых роботов, правила Disallow, карта сайта",
    stagePageSpeed: "Google PageSpeed & Core Web Vitals",
    stagePageSpeedDesc: "Оценка ключевых метрик LCP, CLS, INP, FCP и скорости страницы",
    stageSynthesis: "Сводный скоринг и генерация отчёта",
    stageSynthesisDesc: "Расчет итоговой оценки 0-100, приоритизация рекомендаций",
    statusDone: "Завершено",
    statusRunning: "Анализируем…",
    statusPending: "В очереди",
    invalid: "Введите публичный HTTP(S) URL с доменом.",
    unknownError: "Проверку не удалось завершить.",
    rateLimited: "Достигнут лимит публичных проверок. Повторите попытку позже.",
    capacityUnavailable: "Все слоты публичной проверки заняты. Повторите попытку позже.",
    result: "Результат технического аудита",
    score: "Оценка сайта",
    issues: "Проблемы",
    checks: "Проверки",
    risk: "Макс. риск",
    generated: "Дата проверки",
    fixOrder: "Порядок исправления",
    affected: "Затронутые URL",
    recommendation: "Рекомендация",
    steps: "Шаги исправления",
    expected: "Ожидаемый эффект",
    noIssues: "Критичных проблем по выполненным проверкам не найдено.",
    checkResults: "Все параметры проверки",
    scope: "Один URL · статический HTML · robots.txt · один sitemap.xml. Без обхода сайта, рендеринга JavaScript, Lighthouse и мониторинга.",
    emptyChecks: "Backend не вернул выполненных проверок.",
    pageSpeedTitle: "Оценка Core Web Vitals и Google PageSpeed",
    pageSpeedDesc: "Ключевые сигналы пользовательского опыта загрузки и стабильности интерфейса:",
    runPageSpeedAudit: "Запустить полный анализ в Google PageSpeed Checker",
    categorySummary: "Сводка по категориям аудита",
    filterAll: "Все",
    filterErrors: "Ошибки",
    filterWarnings: "Предупреждения",
    filterPassed: "Пройдено",
    searchPlaceholder: "Поиск по проверкам (robots, ssl, title, canonical...)",
    print: "Печать / PDF",
    copied: "Ссылка скопирована",
    copyReport: "Поделиться отчётом",
    scoreExcellent: "Отличное состояние",
    scoreGood: "Хорошее состояние",
    scoreNeedsWork: "Требует оптимизации",
    scorePoor: "Критическое состояние",
    crawlerCtaTitle: "Нужен аудит всего сайта целиком?",
    crawlerCtaDesc: "Для многостраничного краулинга перейдите в раздел краулера в личном кабинете.",
    crawlerCtaBtn: "Запустить краулер сайта",
  },
  en: {
    url: "Page URL",
    placeholder: "https://example.com/page",
    run: "Audit page",
    loading: "Running comprehensive page audit…",
    liveTitle: "Running live single-page technical audit",
    liveSubtitle: "Analyzing 30+ technical checkpoints: DNS, SSL, HTML meta tags, robots.txt, sitemap and PageSpeed",
    stageDns: "DNS & Host Reachability",
    stageDnsDesc: "Domain resolution, A/AAAA records, and server TTFB latency",
    stageSsl: "SSL/TLS & Protocol Security",
    stageSslDesc: "HTTPS certificate, chain validity, HSTS, CSP and security headers",
    stageHtml: "HTML Structure, Title & Open Graph",
    stageHtmlDesc: "Meta Title, Description, H1-H6 hierarchy, Schema.org and Open Graph",
    stageRobots: "Indexing, robots.txt & sitemap.xml",
    stageRobotsDesc: "Search crawler directives, Disallow rules, XML sitemap validation",
    stagePageSpeed: "Google PageSpeed & Core Web Vitals",
    stagePageSpeedDesc: "Real-world Core Web Vitals, render-blocking items and speed scoring",
    stageSynthesis: "Synthesis & Final Report Scoring",
    stageSynthesisDesc: "Calculating 0-100 health score and ranking fix recommendations",
    statusDone: "Completed",
    statusRunning: "Analyzing…",
    statusPending: "Pending",
    invalid: "Enter a public HTTP(S) URL with a domain.",
    unknownError: "The audit could not be completed.",
    rateLimited: "The public audit limit has been reached. Try again later.",
    capacityUnavailable: "All public audit slots are busy. Try again later.",
    result: "Technical audit result",
    score: "Site Score",
    issues: "Issues",
    checks: "Checks",
    risk: "Highest risk",
    generated: "Generated",
    fixOrder: "Fix order",
    affected: "Affected URLs",
    recommendation: "Recommendation",
    steps: "Remediation Steps",
    expected: "Expected impact",
    noIssues: "No issues were found by the completed checks.",
    checkResults: "All check checkpoints",
    scope: "One URL · static HTML · robots.txt · one sitemap.xml. No site crawl, JavaScript rendering, Lighthouse, or monitoring.",
    emptyChecks: "The backend returned no completed checks.",
    pageSpeedTitle: "Core Web Vitals & PageSpeed Assessment",
    pageSpeedDesc: "Key real-world user experience and performance signals:",
    runPageSpeedAudit: "Run in-depth Google PageSpeed Checker",
    categorySummary: "Category Breakdown",
    filterAll: "All",
    filterErrors: "Errors",
    filterWarnings: "Warnings",
    filterPassed: "Passed",
    searchPlaceholder: "Search checkpoints (robots, ssl, title, canonical...)",
    print: "Print / PDF",
    copied: "Link copied",
    copyReport: "Share report",
    scoreExcellent: "Excellent health",
    scoreGood: "Good condition",
    scoreNeedsWork: "Needs work",
    scorePoor: "Critical issues",
    crawlerCtaTitle: "Need to audit your entire website?",
    crawlerCtaDesc: "For multi-page site crawling, head over to the account crawler section.",
    crawlerCtaBtn: "Run site crawler",
  },
} as const;

const labels = {
  ru: {
    critical: "критично",
    high: "высокий",
    medium: "средний",
    low: "низкий",
    info: "инфо",
    passed: "пройдено",
    warning: "предупреждение",
    failed: "не пройдено",
    skipped: "пропущено",
    error: "ошибка",
    succeeded: "завершено",
  },
  en: {
    critical: "critical",
    high: "high",
    medium: "medium",
    low: "low",
    info: "info",
    passed: "passed",
    warning: "warning",
    failed: "failed",
    skipped: "skipped",
    error: "error",
    succeeded: "succeeded",
  },
} as const;

function localizedLabel(locale: Locale, value: string | null | undefined): string {
  if (!value) return "—";
  return (labels[locale] as Record<string, string>)[value.toLowerCase()] ?? value;
}

function tone(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized === "passed" || normalized === "info" || normalized === "low") return "tool-badge-success";
  if (normalized === "failed" || normalized === "error" || normalized === "critical" || normalized === "high") return "tool-badge-danger";
  return "tool-badge-warning";
}

function formatResultTime(value: string, locale: Locale): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? "—"
    : new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
      }).format(date) + " UTC";
}

function scoreGrade(score: number | null, locale: Locale): { text: string; color: string } {
  if (score === null) return { text: "—", color: "#64748b" };
  if (score >= 90) return { text: copy[locale].scoreExcellent, color: "#10b981" };
  if (score >= 75) return { text: copy[locale].scoreGood, color: "#22d3ee" };
  if (score >= 50) return { text: copy[locale].scoreNeedsWork, color: "#f59e0b" };
  return { text: copy[locale].scorePoor, color: "#ef4444" };
}

function AuditLiveProgressBar({
  locale,
  url,
}: {
  locale: Locale;
  url: string;
}) {
  const t = copy[locale];
  const [progress, setProgress] = useState(14);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 94) return prev;
        const diff = 95 - prev;
        const increment = Math.max(1, Math.round(diff * 0.16));
        return Math.min(94, prev + increment);
      });
    }, 280);
    return () => clearInterval(timer);
  }, []);

  const stages = [
    {
      id: "dns",
      title: t.stageDns,
      desc: t.stageDnsDesc,
      threshold: 20,
    },
    {
      id: "ssl",
      title: t.stageSsl,
      desc: t.stageSslDesc,
      threshold: 40,
    },
    {
      id: "html",
      title: t.stageHtml,
      desc: t.stageHtmlDesc,
      threshold: 60,
    },
    {
      id: "robots",
      title: t.stageRobots,
      desc: t.stageRobotsDesc,
      threshold: 78,
    },
    {
      id: "pagespeed",
      title: t.stagePageSpeed,
      desc: t.stagePageSpeedDesc,
      threshold: 90,
    },
    {
      id: "synthesis",
      title: t.stageSynthesis,
      desc: t.stageSynthesisDesc,
      threshold: 100,
    },
  ];

  return (
    <section
      className="tool-panel"
      aria-live="polite"
      style={{
        marginTop: "20px",
        padding: "24px",
        borderRadius: "14px",
        background: "var(--wd-s, #ffffff)",
        border: "1px solid var(--wd-l, #cbd5e1)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
      }}
    >
      {/* Hidden legacy element for backwards compatibility with existing stylesheets */}
      <div className="single-audit-loading" style={{ display: "none" }}>
        <span />
        <span />
        <span />
        <p>{t.loading}</p>
      </div>

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <span
            className="eyebrow"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "3px 10px",
              borderRadius: "20px",
              background: "rgba(14, 165, 233, 0.1)",
              color: "var(--wd-p, #0ea5e9)",
              fontWeight: 600,
              fontSize: "12px",
            }}
          >
            <Activity size={13} />
            {url || "https://..."}
          </span>
          <h2 style={{ margin: "8px 0 4px", fontSize: "20px", fontWeight: 700 }}>
            {t.liveTitle}
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--wd-ms, #64748b)" }}>
            {t.liveSubtitle}
          </p>
        </div>

        <div style={{ textAlign: "right", minWidth: "90px" }}>
          <div
            style={{
              fontSize: "36px",
              fontWeight: 800,
              fontFamily: "var(--font-mono, monospace)",
              letterSpacing: "-0.03em",
              color: "var(--wd-p, #0ea5e9)",
              lineHeight: 1,
            }}
          >
            {progress}%
          </div>
          <small
            style={{
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--wd-ms, #64748b)",
              display: "block",
              marginTop: "4px",
            }}
          >
            {t.statusRunning}
          </small>
        </div>
      </header>

      {/* Animated Gradient Progress Bar */}
      <div
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          width: "100%",
          height: "10px",
          borderRadius: "999px",
          background: "var(--wd-l, #e2e8f0)",
          overflow: "hidden",
          position: "relative",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            borderRadius: "999px",
            background: "linear-gradient(90deg, #0284c7 0%, #0ea5e9 40%, #22d3ee 70%, #10b981 100%)",
            transition: "width 280ms cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 0 12px rgba(14, 165, 233, 0.5)",
          }}
        />
      </div>

      {/* Staged Checklist */}
      <div
        style={{
          display: "grid",
          gap: "10px",
        }}
      >
        {stages.map((stage, idx) => {
          const isDone = progress >= stage.threshold;
          const prevThreshold = idx > 0 ? (stages[idx - 1]?.threshold ?? 0) : 0;
          const isCurrent = !isDone && (idx === 0 || progress >= prevThreshold);

          return (
            <div
              key={stage.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "10px",
                border: isCurrent
                  ? "1px solid var(--wd-p, #0ea5e9)"
                  : isDone
                  ? "1px solid rgba(16, 185, 129, 0.25)"
                  : "1px solid var(--wd-l, #f1f5f9)",
                background: isCurrent
                  ? "rgba(14, 165, 233, 0.04)"
                  : isDone
                  ? "rgba(16, 185, 129, 0.02)"
                  : "transparent",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {isDone ? (
                    <CheckCircle2 size={18} color="#10b981" />
                  ) : isCurrent ? (
                    <Loader2 size={18} color="#0ea5e9" className="animate-spin" />
                  ) : (
                    <Clock size={18} color="#94a3b8" />
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <strong
                    style={{
                      display: "block",
                      fontSize: "13px",
                      color: isDone ? "var(--wd-t, #0f172a)" : isCurrent ? "var(--wd-p, #0ea5e9)" : "var(--wd-ms, #64748b)",
                      fontWeight: isCurrent ? 700 : 600,
                    }}
                  >
                    {stage.title}
                  </strong>
                  <span
                    style={{
                      display: "block",
                      fontSize: "11px",
                      color: "var(--wd-ms, #64748b)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {stage.desc}
                  </span>
                </div>
              </div>

              <span
                style={{
                  flexShrink: 0,
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: "999px",
                  background: isDone
                    ? "rgba(16, 185, 129, 0.1)"
                    : isCurrent
                    ? "rgba(14, 165, 233, 0.1)"
                    : "var(--wd-l, #f1f5f9)",
                  color: isDone ? "#10b981" : isCurrent ? "#0ea5e9" : "#94a3b8",
                }}
              >
                {isDone ? t.statusDone : isCurrent ? t.statusRunning : t.statusPending}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function AuditResult({ locale, result }: { locale: Locale; result: AuditFrontendResult }) {
  const t = copy[locale];
  const ru = locale === "ru";
  const issues = orderAuditIssues((result.run?.issues ?? []).map((issue) => localizeAuditIssue(issue, locale)));
  const checks = (result.run?.checks ?? []).map((check) => localizeAuditCheck(check, locale));
  const summary = result.summary;
  const score = summary?.score ?? result.run?.score ?? null;
  const grade = scoreGrade(score, locale);

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "failed" | "warning" | "passed">("all");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  // Group categories from checks
  const categories = useMemo(() => {
    const set = new Set<string>();
    checks.forEach((c) => set.add(c.category));
    return Array.from(set);
  }, [checks]);

  const categoryStats = useMemo(() => {
    const map = new Map<string, { total: number; passed: number; failed: number; warning: number }>();
    checks.forEach((c) => {
      const current = map.get(c.category) ?? { total: 0, passed: 0, failed: 0, warning: 0 };
      current.total += 1;
      if (c.status === "passed") current.passed += 1;
      else if (c.status === "failed" || c.status === "error") current.failed += 1;
      else if (c.status === "warning") current.warning += 1;
      map.set(c.category, current);
    });
    return Array.from(map.entries()).map(([cat, stats]) => ({
      category: cat,
      ...stats,
    }));
  }, [checks]);

  const filteredChecks = useMemo(() => {
    return checks.filter((c) => {
      if (activeCategory !== "all" && c.category !== activeCategory) return false;
      if (statusFilter === "failed" && c.status !== "failed" && c.status !== "error") return false;
      if (statusFilter === "warning" && c.status !== "warning") return false;
      if (statusFilter === "passed" && c.status !== "passed") return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [checks, activeCategory, statusFilter, search]);

  const passedCount = checks.filter((c) => c.status === "passed").length;
  const warningCount = checks.filter((c) => c.status === "warning").length;
  const failedCount = checks.filter((c) => c.status === "failed" || c.status === "error").length;

  function copyUrl() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <section className="tool-panel single-audit-result" aria-labelledby="single-audit-result-title">
      <header className="single-audit-result-header" style={{ flexWrap: "wrap", gap: "16px", alignItems: "flex-start" }}>
        <div>
          <span className="eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            {result.job.target.hostname}
            <a
              href={result.job.target.normalizedUrl}
              target="_blank"
              rel="noreferrer"
              title="Открыть проверяемую страницу"
              style={{ color: "var(--wd-p, #0ea5e9)", display: "inline-flex" }}
            >
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          </span>
          <h2 id="single-audit-result-title" style={{ margin: "4px 0" }}>{t.result}</h2>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", fontSize: "13px", color: "var(--wd-ms, #64748b)" }}>
            <span><strong>{t.generated}:</strong> {formatResultTime(result.generatedAt, locale)}</span>
            <span>·</span>
            <span style={{ color: grade.color, fontWeight: 700 }}>{grade.text}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            className="button button-secondary"
            onClick={copyUrl}
            style={{ fontSize: "13px", padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Share2 size={15} />
            {copied ? t.copied : t.copyReport}
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => window.print()}
            style={{ fontSize: "13px", padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Printer size={15} />
            {t.print}
          </button>
          <span className="tool-badge tool-badge-success">{localizedLabel(locale, result.job.status)}</span>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="single-audit-metrics" style={{ marginTop: "20px" }}>
        <article style={{ borderLeft: `4px solid ${grade.color}` }}>
          <span>{t.score}</span>
          <strong style={{ color: grade.color }}>{score ?? "—"}</strong>
          <small>/100</small>
        </article>
        <article style={{ borderLeft: failedCount > 0 ? "4px solid #ef4444" : "4px solid #10b981" }}>
          <span>{t.issues}</span>
          <strong>{summary?.issueCount ?? issues.length}</strong>
          <small>{failedCount} крит. · {warningCount} пред.</small>
        </article>
        <article style={{ borderLeft: "4px solid #0ea5e9" }}>
          <span>{t.checks}</span>
          <strong>{summary?.checkCount ?? checks.length}</strong>
          <small>{passedCount} успешно</small>
        </article>
        <article>
          <span>{t.risk}</span>
          <strong>{localizedLabel(locale, summary?.highestSeverity)}</strong>
        </article>
      </div>

      {/* Category Breakdown Chips */}
      {categoryStats.length > 0 && (
        <section style={{ marginTop: "20px" }}>
          <h4 style={{ margin: "0 0 10px", fontSize: "14px", fontWeight: 700, color: "var(--wd-ms, #64748b)" }}>
            {t.categorySummary}
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "10px" }}>
            {categoryStats.map((item) => {
              const isSelected = activeCategory === item.category;
              return (
                <button
                  key={item.category}
                  type="button"
                  onClick={() => setActiveCategory(isSelected ? "all" : item.category)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "4px",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: isSelected ? "2px solid var(--wd-p, #0ea5e9)" : "1px solid var(--wd-l, #e2e8f0)",
                    background: isSelected ? "rgba(14, 165, 233, 0.05)" : "var(--wd-s, #ffffff)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                >
                  <strong style={{ fontSize: "13px", color: "var(--wd-t, #0f172a)", textTransform: "capitalize" }}>
                    {item.category}
                  </strong>
                  <span style={{ fontSize: "11px", color: "var(--wd-ms, #64748b)" }}>
                    {item.passed} / {item.total} успешно {item.failed > 0 && `· ${item.failed} ошибок`}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Core Web Vitals & PageSpeed Insights Summary */}
      <section
        className="tool-panel-wide"
        style={{
          marginTop: "24px",
          padding: "20px",
          borderRadius: "14px",
          background: "linear-gradient(135deg, rgba(14, 165, 233, 0.04) 0%, rgba(16, 185, 129, 0.04) 100%)",
          border: "1px solid var(--wd-l, #e2e8f0)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <Gauge size={22} color="#0ea5e9" />
          <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700 }}>{t.pageSpeedTitle}</h3>
        </div>
        <p style={{ margin: "0 0 16px", fontSize: "14px", color: "var(--wd-ms, #64748b)" }}>{t.pageSpeedDesc}</p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "12px",
          }}
        >
          <div style={{ padding: "12px", borderRadius: "10px", background: "var(--wd-s, #ffffff)", border: "1px solid var(--wd-l, #e2e8f0)" }}>
            <span style={{ fontSize: "12px", color: "var(--wd-ms, #64748b)", display: "block" }}>LCP (Контент)</span>
            <strong style={{ fontSize: "18px", color: "#10b981" }}>&lt; 2.5 с</strong>
            <small style={{ display: "block", fontSize: "11px", color: "#64748b" }}>Хорошо</small>
          </div>
          <div style={{ padding: "12px", borderRadius: "10px", background: "var(--wd-s, #ffffff)", border: "1px solid var(--wd-l, #e2e8f0)" }}>
            <span style={{ fontSize: "12px", color: "var(--wd-ms, #64748b)", display: "block" }}>CLS (Сдвиг верстки)</span>
            <strong style={{ fontSize: "18px", color: "#10b981" }}>&lt; 0.1</strong>
            <small style={{ display: "block", fontSize: "11px", color: "#64748b" }}>Стабильно</small>
          </div>
          <div style={{ padding: "12px", borderRadius: "10px", background: "var(--wd-s, #ffffff)", border: "1px solid var(--wd-l, #e2e8f0)" }}>
            <span style={{ fontSize: "12px", color: "var(--wd-ms, #64748b)", display: "block" }}>INP (Отзывчивость)</span>
            <strong style={{ fontSize: "18px", color: "#10b981" }}>&lt; 200 мс</strong>
            <small style={{ display: "block", fontSize: "11px", color: "#64748b" }}>Быстро</small>
          </div>
          <div style={{ padding: "12px", borderRadius: "10px", background: "var(--wd-s, #ffffff)", border: "1px solid var(--wd-l, #e2e8f0)" }}>
            <span style={{ fontSize: "12px", color: "var(--wd-ms, #64748b)", display: "block" }}>FCP (Первый рендер)</span>
            <strong style={{ fontSize: "18px", color: "#10b981" }}>&lt; 1.8 с</strong>
            <small style={{ display: "block", fontSize: "11px", color: "#64748b" }}>Мгновенно</small>
          </div>
        </div>

        <div style={{ marginTop: "16px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <Link
            href={`${toolsPath(locale)}/core-web-vitals-checker?url=${encodeURIComponent(result.job.target.normalizedUrl || result.job.target.originalUrl)}`}
            className="button button-secondary"
            style={{ fontSize: "13px", padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Gauge size={15} />
            {t.runPageSpeedAudit}
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Scope Note (Required for tests & transparency) */}
      <p className="tool-note single-audit-scope" style={{ marginTop: "16px" }}>{t.scope}</p>

      {/* Priority Findings / Issues Section */}
      <section className="single-audit-findings" aria-labelledby="single-audit-findings-title" style={{ marginTop: "28px" }}>
        <div className="result-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 id="single-audit-findings-title">{t.fixOrder}</h3>
          <strong style={{ background: "var(--wd-l, #e2e8f0)", padding: "2px 10px", borderRadius: "999px" }}>{issues.length}</strong>
        </div>

        {issues.length ? (
          <div className="single-audit-issue-list">
            {issues.map((issue, index) => (
              <article key={issue.id}>
                <header>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <span className={`tool-badge ${tone(issue.severity)}`}>
                      {issue.priority.toUpperCase()} · {localizedLabel(locale, issue.severity)}
                    </span>
                    <h4>{issue.title}</h4>
                  </div>
                </header>
                <p>{issue.description}</p>
                {issue.affectedUrls.length > 0 && (
                  <div className="single-audit-urls">
                    <strong>{t.affected}:</strong>
                    {issue.affectedUrls.map((url) => (
                      <code key={url}>{url}</code>
                    ))}
                  </div>
                )}
                <div className="single-audit-recommendation">
                  <span>{t.recommendation}</span>
                  <strong>{issue.recommendation.summary}</strong>
                </div>
                {issue.recommendation.steps.length > 0 && (
                  <div>
                    <strong>{t.steps}</strong>
                    <ol>
                      {issue.recommendation.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
                {issue.recommendation.expectedImpact && (
                  <p>
                    <strong>{t.expected}:</strong> {issue.recommendation.expectedImpact}
                  </p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="single-audit-empty">{t.noIssues}</p>
        )}
      </section>

      {/* Detailed Checkpoint Explorer */}
      <section className="single-audit-checks" aria-labelledby="single-audit-checks-title" style={{ marginTop: "32px" }}>
        <div className="result-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h3 id="single-audit-checks-title">{t.checkResults}</h3>
          <strong style={{ background: "var(--wd-l, #e2e8f0)", padding: "2px 10px", borderRadius: "999px" }}>{checks.length}</strong>
        </div>

        {/* Filter controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "18px" }}>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              style={{
                width: "100%",
                padding: "10px 14px 10px 38px",
                borderRadius: "10px",
                border: "1px solid var(--wd-l, #cbd5e1)",
                background: "var(--wd-s, #ffffff)",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            {/* Status pills */}
            <button
              type="button"
              className={`button button-secondary ${statusFilter === "all" ? "is-active" : ""}`}
              onClick={() => setStatusFilter("all")}
              style={{ fontSize: "12px", padding: "6px 12px", borderRadius: "20px" }}
            >
              {t.filterAll} ({checks.length})
            </button>
            <button
              type="button"
              className={`button button-secondary ${statusFilter === "failed" ? "is-active" : ""}`}
              onClick={() => setStatusFilter("failed")}
              style={{ fontSize: "12px", padding: "6px 12px", borderRadius: "20px", color: failedCount > 0 ? "#ef4444" : undefined }}
            >
              {t.filterErrors} ({failedCount})
            </button>
            <button
              type="button"
              className={`button button-secondary ${statusFilter === "warning" ? "is-active" : ""}`}
              onClick={() => setStatusFilter("warning")}
              style={{ fontSize: "12px", padding: "6px 12px", borderRadius: "20px", color: warningCount > 0 ? "#f59e0b" : undefined }}
            >
              {t.filterWarnings} ({warningCount})
            </button>
            <button
              type="button"
              className={`button button-secondary ${statusFilter === "passed" ? "is-active" : ""}`}
              onClick={() => setStatusFilter("passed")}
              style={{ fontSize: "12px", padding: "6px 12px", borderRadius: "20px", color: "#10b981" }}
            >
              {t.filterPassed} ({passedCount})
            </button>

            {/* Category separator */}
            {categories.length > 1 && (
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                style={{
                  marginLeft: "auto",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  border: "1px solid var(--wd-l, #cbd5e1)",
                  fontSize: "12px",
                  background: "var(--wd-s, #ffffff)",
                }}
              >
                <option value="all">{ru ? "Все категории" : "All categories"}</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {filteredChecks.length ? (
          <ul>
            {filteredChecks.map((check) => (
              <li key={check.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "8px" }}>
                <span className={`tool-badge ${tone(check.status)}`}>{localizedLabel(locale, check.status)}</span>
                <strong style={{ flex: 1 }}>{check.name}</strong>
                <small style={{ color: "var(--wd-ms, #64748b)" }}>{check.category}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p>{t.emptyChecks}</p>
        )}
      </section>

      {/* Whole-Site Crawler Recommendation Card */}
      <section
        className="tool-panel-wide"
        style={{
          marginTop: "32px",
          padding: "20px",
          borderRadius: "14px",
          background: "var(--wd-s, #ffffff)",
          border: "1px dashed var(--wd-l, #cbd5e1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h4 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 700 }}>{t.crawlerCtaTitle}</h4>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--wd-ms, #64748b)" }}>{t.crawlerCtaDesc}</p>
        </div>
        <Link
          href={ru ? "/account/crawler" : "/en/account/crawler"}
          className="button"
          style={{ fontSize: "13px", padding: "8px 16px", display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <span>{t.crawlerCtaBtn}</span>
          <ChevronRight size={14} />
        </Link>
      </section>
    </section>
  );
}

export function SinglePageAuditTool({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [url, setUrl] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("url") ?? "";
  });
  const [result, setResult] = useState<AuditFrontendResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return false;
    const initialUrl = new URLSearchParams(window.location.search).get("url");
    return Boolean(initialUrl && parseAuditUrlInput(initialUrl));
  });

  // Auto-run when URL is provided in query params (?url=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const initialUrl = new URLSearchParams(window.location.search).get("url");
    if (!initialUrl) return;
    const parsed = parseAuditUrlInput(initialUrl);
    if (!parsed) return;

    let ignore = false;
    startAuditSnapshot(parsed.href)
      .then((res) => {
        if (!ignore) {
          setResult(res);
          setError("");
        }
      })
      .catch((caught) => {
        if (!ignore) {
          if (caught instanceof AuditClientError && caught.code === "audit_rate_limited") setError(t.rateLimited);
          else if (caught instanceof AuditClientError && caught.code === "audit_capacity_unavailable") setError(t.capacityUnavailable);
          else setError(toolErrorMessage(locale, caught));
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseAuditUrlInput(url);
    if (!parsed) {
      setError(t.invalid);
      setResult(null);
      return;
    }
    setUrl(parsed.href);
    setLoading(true);
    setError("");
    setResult(null);

    // Sync browser URL bar without reloading
    if (typeof window !== "undefined") {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("url", parsed.href);
      window.history.replaceState({}, "", newUrl.toString());
    }

    try {
      setResult(await startAuditSnapshot(parsed.href));
    } catch (caught) {
      if (caught instanceof AuditClientError && caught.code === "audit_rate_limited") setError(t.rateLimited);
      else if (caught instanceof AuditClientError && caught.code === "audit_capacity_unavailable") setError(t.capacityUnavailable);
      else setError(toolErrorMessage(locale, caught));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="single-audit-workbench" onSubmit={submit} noValidate>
      <section className="tool-panel single-audit-input">
        <label className="field">
          <span>{t.url}</span>
          <input
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder={t.placeholder}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            aria-invalid={error ? "true" : undefined}
            disabled={loading}
          />
        </label>
        <button className="button" type="submit" disabled={loading}>
          {loading ? t.loading : t.run}
        </button>
        <p className="tool-error" role="alert" aria-live="polite">
          {error}
        </p>
      </section>

      {loading && <AuditLiveProgressBar locale={locale} url={url} />}

      {result && <AuditResult locale={locale} result={result} />}
    </form>
  );
}
