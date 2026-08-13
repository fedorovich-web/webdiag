"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { accountErrorMessage } from "./account-messages";
import {
  createAccountMonitor,
  getAccountMonitorHistory,
  runAccountMonitor,
  updateAccountMonitor,
} from "./account-monitoring-client";
import type {
  AccountMonitor,
  MonitorCadence,
  MonitorHistoryResponse,
} from "./account-monitoring-contract";
import {
  formatMonitorDate,
  monitorCadenceLabel,
  monitorChangeLabel,
  monitorStatusLabel,
  suppliedMonitorDeltas,
} from "./account-monitoring-presentation";

interface Props {
  readonly locale: Locale;
  readonly projectId: string;
}

const cadenceOptions: readonly MonitorCadence[] = [
  "hourly", "six_hours", "twelve_hours", "daily", "weekly",
];

export function AccountMonitoring({ locale, projectId }: Props) {
  const ru = locale === "ru";
  const [history, setHistory] = useState<MonitorHistoryResponse | null>(null);
  const [missing, setMissing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [cadence, setCadence] = useState<MonitorCadence>("daily");
  const [timezone, setTimezone] = useState("Europe/Berlin");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function applyHistory(value: MonitorHistoryResponse) {
    setError("");
    setHistory(value);
    setCadence(value.monitor.cadence);
    setTimezone(value.monitor.timezone);
    setMissing(false);
  }

  async function refresh() {
    try {
      applyHistory(await getAccountMonitorHistory(projectId));
    } catch (caught) {
      setError(accountErrorMessage(locale, caught));
    }
  }

  useEffect(() => {
    let active = true;
    getAccountMonitorHistory(projectId)
      .then((value) => {
        if (!active) return;
        applyHistory(value);
      })
      .catch((caught) => {
        if (!active) return;
        if (caught instanceof Error && "status" in caught && caught.status === 404) {
          setError("");
          setMissing(true);
          setHistory(null);
        } else {
          setError(accountErrorMessage(locale, caught));
        }
      })
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, [locale, projectId]);

  async function configure(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const monitor = missing
        ? await createAccountMonitor(projectId, { cadence, timezone })
        : await updateAccountMonitor(projectId, { cadence, timezone });
      setHistory((current) => ({
        contract_version: "webdiag.account.monitor_history.v1",
        monitor,
        runs: current?.runs ?? [],
      }));
      setMissing(false);
      setCadence(monitor.cadence);
      setTimezone(monitor.timezone);
    } catch (caught) {
      setError(accountErrorMessage(locale, caught));
    } finally {
      setPending(false);
    }
  }

  async function runNow() {
    setPending(true);
    setError("");
    try {
      await runAccountMonitor(projectId);
      await refresh();
    } catch (caught) {
      setError(accountErrorMessage(locale, caught));
    } finally {
      setPending(false);
    }
  }

  async function toggle(monitor: AccountMonitor) {
    setPending(true);
    setError("");
    try {
      const updated = await updateAccountMonitor(projectId, { enabled: !monitor.enabled });
      setHistory((current) => current ? { ...current, monitor: updated } : current);
    } catch (caught) {
      setError(accountErrorMessage(locale, caught));
    } finally {
      setPending(false);
    }
  }

  if (!loaded) {
    return <section className="wd-account-card" aria-busy="true"><p>{ru ? "Загружаем мониторинг…" : "Loading monitoring…"}</p></section>;
  }

  const monitor = history?.monitor ?? null;
  const running = monitor?.status === "running";

  return (
    <section className="wd-monitoring-page">
      <header className="wd-account-dashboard-head wd-monitoring-hero">
        <div>
          <span className="eyebrow">{ru ? "Плановые сравнительные аудиты" : "Scheduled comparative audits"}</span>
          <h1>{ru ? "Мониторинг проекта" : "Project monitoring"}</h1>
          <p>{ru ? "WebDiag сохраняет новый аудит по расписанию и сравнивает его с предыдущим результатом." : "WebDiag saves a new audit on schedule and compares it with the previous result."}</p>
        </div>
        {monitor && (
          <div className="wd-monitoring-hero-actions">
            <span className={`wd-monitor-state is-${monitor.status}`}>{monitorStatusLabel(locale, monitor.status)}</span>
            <button className="wd-button wd-button-primary" type="button" onClick={runNow} disabled={pending || running} aria-busy={pending || running}>{running ? (ru ? "Проверка выполняется" : "Check in progress") : (ru ? "Проверить сейчас" : "Run now")}</button>
          </div>
        )}
      </header>

      {error && <p className="wd-account-error" role="alert">{error}</p>}

      {monitor && (
        <section className="wd-monitoring-facts" aria-label={ru ? "Состояние мониторинга" : "Monitoring status"}>
          <div><span>{ru ? "Расписание" : "Schedule"}</span><strong>{monitorCadenceLabel(locale, monitor.cadence)}</strong></div>
          <div><span>{ru ? "Часовой пояс" : "Timezone"}</span><strong>{monitor.timezone}</strong></div>
          <div><span>{ru ? "Последний запуск" : "Last run"}</span><strong>{formatMonitorDate(locale, monitor.last_run_at)}</strong></div>
          <div><span>{ru ? "Следующий запуск" : "Next run"}</span><strong>{monitor.enabled ? formatMonitorDate(locale, monitor.next_run_at) : (ru ? "Приостановлен" : "Paused")}</strong></div>
          {monitor.consecutive_failures > 0 && <div className="is-failure"><span>{ru ? "Ошибки подряд" : "Consecutive failures"}</span><strong>{monitor.consecutive_failures}</strong></div>}
        </section>
      )}

      <form className="wd-monitoring-config" onSubmit={configure} aria-busy={pending}>
        <div className="wd-monitoring-config-head">
          <div><span className="eyebrow">{missing ? (ru ? "Настройка" : "Setup") : (ru ? "Расписание" : "Schedule")}</span><h2>{missing ? (ru ? "Включить мониторинг" : "Enable monitoring") : (ru ? "Параметры проверок" : "Check settings")}</h2></div>
          {monitor && <span className={`wd-enabled-state ${monitor.enabled ? "is-enabled" : "is-paused"}`}>{monitor.enabled ? (ru ? "Включён" : "Enabled") : (ru ? "Приостановлен" : "Paused")}</span>}
        </div>
        <div className="wd-monitoring-fields">
          <label>{ru ? "Частота" : "Cadence"}<select value={cadence} onChange={(event: ChangeEvent<HTMLSelectElement>) => setCadence(event.target.value as MonitorCadence)} disabled={pending}>{cadenceOptions.map((value) => <option key={value} value={value}>{monitorCadenceLabel(locale, value)}</option>)}</select></label>
          <label>{ru ? "Часовой пояс IANA" : "IANA timezone"}<input value={timezone} onChange={(event: ChangeEvent<HTMLInputElement>) => setTimezone(event.target.value)} required maxLength={64} disabled={pending} placeholder="Europe/Berlin" /></label>
        </div>
        <div className="wd-monitoring-config-actions">
          <button className="wd-button wd-button-secondary" type="submit" disabled={pending}>{missing ? (ru ? "Включить мониторинг" : "Enable monitoring") : (ru ? "Сохранить настройки" : "Save settings")}</button>
          {monitor && <button className="wd-button wd-button-secondary" type="button" onClick={() => toggle(monitor)} disabled={pending || running}>{monitor.enabled ? (ru ? "Приостановить" : "Pause") : (ru ? "Возобновить" : "Resume")}</button>}
        </div>
      </form>

      {history && (
        <section className="wd-monitoring-history" aria-labelledby="monitor-history-title">
          <div className="wd-project-list-head"><div><span className="eyebrow">{ru ? "Сохранённые результаты" : "Persisted results"}</span><h2 id="monitor-history-title">{ru ? "История проверок" : "Check history"}</h2></div><strong>{history.runs.length}</strong></div>
          {history.runs.length === 0 ? <div className="wd-account-empty"><p>{ru ? "Запусков пока нет." : "No runs yet."}</p></div> : (
            <div className="wd-monitor-run-list">
              {history.runs.map((run) => {
                const deltas = suppliedMonitorDeltas(locale, run.change);
                return (
                  <article key={run.id} data-outcome={run.change.kind}>
                    <div className="wd-monitor-run-head"><div><span>{monitorChangeLabel(locale, run.change.kind)}</span><strong>{formatMonitorDate(locale, run.completed_at)}</strong></div><b>{run.score === null ? "—" : `${run.score}/100`}</b></div>
                    <p>{ru ? `Проблем в сохранённом аудите: ${run.issue_count}` : `Issues in the saved audit: ${run.issue_count}`}</p>
                    {deltas.length > 0 && <ul className="wd-monitor-deltas">{deltas.map((delta) => <li key={delta}>{delta}</li>)}</ul>}
                    {run.error_code && <details className="wd-monitor-error"><summary>{ru ? "Техническая диагностика" : "Technical diagnostics"}</summary><code>{run.error_code}</code></details>}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </section>
  );
}
