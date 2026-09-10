"use client";

import type { Locale } from "@webdiag/tool-registry";
import type { AIRun } from "./account-ai-contract";
import { aiRunStateLabel, aiToolDescriptor } from "./account-ai-presentation";

interface AccountAIRunHistoryProps {
  readonly locale: Locale;
  readonly runs: readonly AIRun[];
  readonly deletingRunId: string | null;
  readonly onDelete: (runId: string) => void;
}

function formatRunTime(locale: Locale, value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function AccountAIRunHistory({
  locale,
  runs,
  deletingRunId,
  onDelete,
}: AccountAIRunHistoryProps) {
  const ru = locale === "ru";
  return (
    <section className="wd-ai-history-section" aria-labelledby="account-ai-history-heading">
      <div className="wd-ai-section-heading">
        <div>
          <span className="eyebrow">{ru ? "RUN HISTORY" : "RUN HISTORY"}</span>
          <h2 id="account-ai-history-heading">{ru ? "Запуски AI" : "AI runs"}</h2>
        </div>
        <p>{ru ? "Результаты остаются привязанными к аккаунту и доступны для удаления." : "Results stay scoped to your account and can be deleted."}</p>
      </div>
      {runs.length === 0 ? (
        <div className="wd-ai-empty-state">
          <strong>{ru ? "Запусков пока нет" : "No runs yet"}</strong>
          <p>{ru ? "После появления подтверждённых данных проекта здесь будет история запусков." : "Run history will appear after confirmed project evidence is available."}</p>
        </div>
      ) : (
        <div className="wd-ai-run-list">
          {runs.map((run) => (
            <article className="wd-ai-run-row" key={run.id}>
              <div>
                <strong>{aiToolDescriptor(locale, run.tool_id).title}</strong>
                <time dateTime={run.created_at}>{formatRunTime(locale, run.created_at)}</time>
              </div>
              <span className="wd-ai-run-state" data-state={run.state}>{aiRunStateLabel(locale, run.state)}</span>
              <button
                className="wd-button wd-button-ghost"
                type="button"
                onClick={() => onDelete(run.id)}
                disabled={deletingRunId === run.id || run.state === "deleted"}
              >
                {deletingRunId === run.id ? (ru ? "Удаляем…" : "Deleting…") : (ru ? "Удалить" : "Delete")}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
