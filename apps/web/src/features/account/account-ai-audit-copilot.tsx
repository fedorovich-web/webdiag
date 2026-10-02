"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { accountErrorMessage } from "./account-messages";
import { createAuditActionPlan, getAIRun } from "./account-ai-client";
import type { AIRun } from "./account-ai-contract";
import { aiRunStateLabel } from "./account-ai-presentation";
import { aiPollDelayMs, isAIRunTerminal, newAIIdempotencyKey, shouldPollAIRun } from "./account-ai-query";
import { AccountAIActionPlanResult } from "./account-ai-action-plan-result";

interface AccountAIAuditCopilotProps {
  readonly locale: Locale;
  readonly projectId: string;
  readonly auditId: string;
}

export function AccountAIAuditCopilot({ locale, projectId, auditId }: AccountAIAuditCopilotProps) {
  const ru = locale === "ru";
  const [run, setRun] = useState<AIRun | null>(null);
  const [pollAttempt, setPollAttempt] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!run || isAIRunTerminal(run.state) || !shouldPollAIRun(run.state, pollAttempt)) return;
    let active = true;
    const timer = window.setTimeout(() => {
      getAIRun(run.id)
        .then((detail) => {
          if (!active) return;
          setRun(detail.run);
          setPollAttempt((attempt) => attempt + 1);
        })
        .catch((caught) => {
          if (!active) return;
          setError(accountErrorMessage(locale, caught));
          setPollAttempt((attempt) => attempt + 1);
        });
    }, aiPollDelayMs(pollAttempt));
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [locale, pollAttempt, run]);

  async function startRun() {
    setPending(true);
    setError("");
    setPollAttempt(0);
    try {
      const detail = await createAuditActionPlan(
        { locale, projectId, auditId },
        newAIIdempotencyKey(),
      );
      setRun(detail.run);
    } catch (caught) {
      setError(accountErrorMessage(locale, caught));
    } finally {
      setPending(false);
    }
  }

  const state = run?.state;
  const showResult = run?.state === "succeeded" && run.output;
  return (
    <section className="wd-ai-copilot-card" aria-labelledby="ai-copilot-title">
      <div>
        <span className="eyebrow">{ru ? "AI COPILOT" : "AI COPILOT"}</span>
        <h2 id="ai-copilot-title">{ru ? "Собрать план исправлений" : "Build a fix plan"}</h2>
        <p>{ru ? "AI расставит подтверждённые проблемы по порядку работ. Запуск использует только этот сохранённый аудит." : "AI orders confirmed issues into a practical work sequence. The run uses this saved audit only."}</p>
      </div>
      <div className="wd-ai-copilot-actions">
        <button className="wd-button wd-button-primary" type="button" onClick={startRun} disabled={pending || (state === "pending" || state === "running")} aria-busy={pending}>
          {pending ? (ru ? "Ставим в очередь…" : "Queuing…") : (ru ? "Запустить AI-план" : "Run AI plan")}
        </button>
        {run && <span className="wd-ai-run-state" data-state={run.state}>{aiRunStateLabel(locale, run.state)}</span>}
      </div>
      {state === "pending" || state === "running" ? (
        <p className="wd-ai-copilot-status" aria-live="polite">{ru ? "Проверяем состояние запуска…" : "Checking run status…"}</p>
      ) : null}
      {run && !isAIRunTerminal(run.state) && !shouldPollAIRun(run.state, pollAttempt) && (
        <p className="wd-ai-copilot-status" role="status">{ru ? "Статус не подтвердился за отведённое время. Обновите страницу позже." : "The status was not confirmed within the polling window. Check again later."}</p>
      )}
      {state === "provider_unknown" && <p className="wd-ai-copilot-status" role="status">{ru ? "Провайдер не подтвердил результат. Не используйте его без ручной проверки." : "The provider did not confirm the outcome. Do not use it without manual review."}</p>}
      {error && <p className="wd-account-error" role="alert">{error}</p>}
      {showResult && <AccountAIActionPlanResult locale={locale} output={run.output} />}
    </section>
  );
}
