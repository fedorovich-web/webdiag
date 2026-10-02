import type { Locale } from "@webdiag/tool-registry";
import type {
  MonitorCadence,
  MonitorChange,
  MonitorStatus,
} from "./account-monitoring-contract";

const cadenceLabels: Record<Locale, Record<MonitorCadence, string>> = {
  ru: {
    hourly: "Каждый час",
    six_hours: "Каждые 6 часов",
    twelve_hours: "Каждые 12 часов",
    daily: "Раз в день",
    weekly: "Раз в неделю",
  },
  en: {
    hourly: "Every hour",
    six_hours: "Every 6 hours",
    twelve_hours: "Every 12 hours",
    daily: "Daily",
    weekly: "Weekly",
  },
};

const statusLabels: Record<Locale, Record<MonitorStatus, string>> = {
  ru: {
    pending: "Ожидает запуска",
    running: "Проверка выполняется",
    passed: "Последняя проверка завершена",
    changed: "Обнаружены изменения",
    failed: "Последняя проверка не выполнена",
  },
  en: {
    pending: "Waiting to run",
    running: "Check in progress",
    passed: "Last run completed",
    changed: "Changes detected",
    failed: "Last run failed",
  },
};

const changeLabels: Record<Locale, Record<MonitorChange["kind"], string>> = {
  ru: {
    baseline: "Базовый результат",
    unchanged: "Без изменений",
    changed: "Есть изменения",
    failed: "Проверка не выполнена",
  },
  en: {
    baseline: "Baseline result",
    unchanged: "No changes",
    changed: "Changes detected",
    failed: "Check failed",
  },
};

export function monitorCadenceLabel(locale: Locale, cadence: MonitorCadence): string {
  return cadenceLabels[locale][cadence];
}

export function monitorStatusLabel(locale: Locale, status: MonitorStatus): string {
  return statusLabels[locale][status];
}

export function monitorChangeLabel(locale: Locale, kind: MonitorChange["kind"]): string {
  return changeLabels[locale][kind];
}

export function suppliedMonitorDeltas(locale: Locale, change: MonitorChange): readonly string[] {
  const ru = locale === "ru";
  const values: string[] = [];
  if (change.score_delta !== null) {
    const signed = change.score_delta > 0 ? `+${change.score_delta}` : String(change.score_delta);
    values.push(`${ru ? "Оценка" : "Score"}: ${signed}`);
  }
  if (change.added_issue_ids.length > 0) {
    values.push(`${ru ? "Добавлено проблем" : "Issues added"}: ${change.added_issue_ids.length}`);
  }
  if (change.resolved_issue_ids.length > 0) {
    values.push(`${ru ? "Исправлено проблем" : "Issues resolved"}: ${change.resolved_issue_ids.length}`);
  }
  return values;
}

export function formatMonitorDate(locale: Locale, value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
