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

interface Props {
  readonly locale: Locale;
  readonly projectId: string;
}

const cadenceOptions: readonly MonitorCadence[] = [
  "hourly", "six_hours", "twelve_hours", "daily", "weekly",
];

function cadenceLabel(locale: Locale, cadence: MonitorCadence): string {
  const ru = locale === "ru";
  const labels: Record<MonitorCadence, readonly [string, string]> = {
    hourly: ["Каждый час", "Every hour"],
    six_hours: ["Каждые 6 часов", "Every 6 hours"],
    twelve_hours: ["Каждые 12 часов", "Every 12 hours"],
    daily: ["Раз в день", "Daily"],
    weekly: ["Раз в неделю", "Weekly"],
  };
  return labels[cadence][ru ? 0 : 1];
}

export function AccountMonitoring({ locale, projectId }: Props) {
  const ru = locale === "ru";
  const [history, setHistory] = useState<MonitorHistoryResponse | null>(null);
  const [missing, setMissing] = useState(false);
  const [cadence, setCadence] = useState<MonitorCadence>("daily");
  const [timezone, setTimezone] = useState("Europe/Berlin");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      const value = await getAccountMonitorHistory(projectId);
      setError("");
      setHistory(value);
      setCadence(value.monitor.cadence);
      setTimezone(value.monitor.timezone);
      setMissing(false);
    } catch (caught) {
      if (caught instanceof Error && "status" in caught && caught.status === 404) {
        setError("");
        setMissing(true);
        setHistory(null);
      } else {
        setError(accountErrorMessage(locale, caught));
      }
    }
  }

  useEffect(() => {
    let active = true;
    getAccountMonitorHistory(projectId)
      .then((value) => {
        if (!active) return;
        setError("");
        setHistory(value);
        setCadence(value.monitor.cadence);
        setTimezone(value.monitor.timezone);
        setMissing(false);
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
      });
    return () => { active = false; };
  }, [locale, projectId]);

  async function configure(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      if (missing) await createAccountMonitor(projectId, { cadence, timezone });
      else await updateAccountMonitor(projectId, { cadence, timezone });
      await refresh();
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
      await updateAccountMonitor(projectId, { enabled: !monitor.enabled });
      await refresh();
    } catch (caught) {
      setError(accountErrorMessage(locale, caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="wd-monitoring-page">
      <header className="wd-account-dashboard-head">
        <div>
          <span className="eyebrow">WebDiag Monitoring</span>
          <h1>{ru ? "Мониторинг проекта" : "Project monitoring"}</h1>
          <p>{ru ? "Плановые проверки и история фактических изменений без фиктивного uptime." : "Scheduled audits and persisted change history without synthetic uptime."}</p>
        </div>
        {history && <button className="wd-button wd-button-primary" type="button" onClick={runNow} disabled={pending} aria-busy={pending}>{ru ? "Проверить сейчас" : "Run now"}</button>}
      </header>

      {error && <p className="wd-account-error" role="alert">{error}</p>}

      <form className="wd-monitoring-config" onSubmit={configure} aria-busy={pending}>
        <label>{ru ? "Частота" : "Cadence"}<select value={cadence} onChange={(event: ChangeEvent<HTMLSelectElement>) => setCadence(event.target.value as MonitorCadence)} disabled={pending}>{cadenceOptions.map((value) => <option key={value} value={value}>{cadenceLabel(locale, value)}</option>)}</select></label>
        <label>{ru ? "Часовой пояс IANA" : "IANA timezone"}<input value={timezone} onChange={(event: ChangeEvent<HTMLInputElement>) => setTimezone(event.target.value)} required maxLength={64} disabled={pending} placeholder="Europe/Berlin" /></label>
        <button className="wd-button wd-button-secondary" type="submit" disabled={pending}>{missing ? (ru ? "Включить мониторинг" : "Enable monitoring") : (ru ? "Сохранить настройки" : "Save settings")}</button>
        {history && <button className="wd-button wd-button-secondary" type="button" onClick={() => toggle(history.monitor)} disabled={pending}>{history.monitor.enabled ? (ru ? "Приостановить" : "Pause") : (ru ? "Возобновить" : "Resume")}</button>}
      </form>

      {history && (
        <section className="wd-monitoring-history" aria-labelledby="monitor-history-title">
          <div className="wd-project-list-head"><div><span className="eyebrow">{ru ? "Реальные запуски" : "Persisted runs"}</span><h2 id="monitor-history-title">{ru ? "История проверок" : "Check history"}</h2></div><strong>{history.runs.length}</strong></div>
          {history.runs.length === 0 ? <div className="wd-account-empty"><p>{ru ? "Запусков пока нет." : "No runs yet."}</p></div> : (
            <div className="wd-audit-list">
              {history.runs.map((run) => (
                <article key={run.id} className="wd-audit-row">
                  <div><strong>{run.status}</strong><p>{new Intl.DateTimeFormat(ru ? "ru-RU" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(run.completed_at))}</p></div>
                  <p>{ru ? `Оценка: ${run.score ?? "—"} · Проблем: ${run.issue_count}` : `Score: ${run.score ?? "—"} · Issues: ${run.issue_count}`}</p>
                  <p>{run.change.kind}{run.change.score_delta === null ? "" : ` (${run.change.score_delta > 0 ? "+" : ""}${run.change.score_delta})`}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </section>
  );
}
