"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { accountErrorMessage } from "./account-messages";
import {
  deleteAIRun,
  getAICatalog,
  getAICredits,
  listAIRuns,
} from "./account-ai-client";
import type {
  AICatalogResponse,
  AICreditBalanceResponse,
  AIRun,
} from "./account-ai-contract";
import { aiWorkspaceEmptyCopy } from "./account-ai-presentation";
import { AccountAIToolList } from "./account-ai-tool-list";
import { AccountAIRunHistory } from "./account-ai-run-history";

interface AccountAIWorkspaceProps {
  readonly locale: Locale;
}

export function AccountAIWorkspace({ locale }: AccountAIWorkspaceProps) {
  const ru = locale === "ru";
  const [catalog, setCatalog] = useState<AICatalogResponse | null>(null);
  const [credits, setCredits] = useState<AICreditBalanceResponse | null>(null);
  const [runs, setRuns] = useState<readonly AIRun[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "unavailable">("loading");
  const [error, setError] = useState("");
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null);

  function loadWorkspace() {
    setLoadState("loading");
    setError("");
    Promise.allSettled([getAICatalog(), getAICredits(), listAIRuns()]).then(
      ([catalogResult, creditsResult, runsResult]) => {
        const failed = [catalogResult, creditsResult, runsResult].find(
          (result) => result.status === "rejected",
        );
        if (failed?.status === "rejected") {
          setLoadState("unavailable");
          setError(accountErrorMessage(locale, failed.reason));
          return;
        }
        if (
          catalogResult.status !== "fulfilled"
          || creditsResult.status !== "fulfilled"
          || runsResult.status !== "fulfilled"
        ) {
          setLoadState("unavailable");
          setError(ru ? "AI-рабочая область недоступна." : "The AI workspace is unavailable.");
          return;
        }
        setCatalog(catalogResult.value);
        setCredits(creditsResult.value);
        setRuns(runsResult.value.runs);
        setLoadState("ready");
      },
    );
  }

  useEffect(() => {
    loadWorkspace();
  }, [locale]);

  async function handleDelete(runId: string) {
    setDeletingRunId(runId);
    setError("");
    try {
      await deleteAIRun(runId);
      setRuns((current) => current.filter((run) => run.id !== runId));
    } catch (caught) {
      setError(accountErrorMessage(locale, caught));
    } finally {
      setDeletingRunId(null);
    }
  }

  const availableTools = catalog?.tools.length ?? 0;
  const balance = credits?.account.available ?? null;

  return (
    <div className="wd-ai-workspace">
      <header className="wd-ai-workspace-hero">
        <div>
          <span className="eyebrow">{ru ? "AI ДЛЯ WEB-ОПЕРАЦИЙ" : "AI FOR WEB OPERATIONS"}</span>
          <h1>{ru ? "AI-инструменты кабинета" : "Account AI tools"}</h1>
          <p>{ru ? "Текстовые помощники, которые превращают подтверждённые сигналы аудита в следующий понятный шаг." : "Text assistants that turn confirmed audit signals into a clear next step."}</p>
        </div>
        <div className="wd-ai-workspace-hero-note">
          <strong>{ru ? "Контроль результата" : "Outcome control"}</strong>
          <span>{ru ? "AI не публикует изменения и не заменяет проверку специалиста." : "AI never publishes changes and does not replace expert review."}</span>
        </div>
      </header>

      {error && (
        <div className="wd-account-error" role="alert">
          <span>{error}</span>
          <button className="wd-button wd-button-ghost" type="button" onClick={loadWorkspace}>
            {ru ? "Повторить" : "Retry"}
          </button>
        </div>
      )}

      <section className="wd-ai-workspace-summary" aria-label={ru ? "Сводка AI" : "AI summary"}>
        <article>
          <span>{ru ? "Инструменты" : "Tools"}</span>
          <strong>{loadState === "loading" ? "—" : `${availableTools}/6`}</strong>
          <small>{ru ? "доступны для внутренней оценки" : "available for internal evaluation"}</small>
        </article>
        <article>
          <span>{ru ? "Кредиты" : "Credits"}</span>
          <strong>{balance === null ? "—" : balance}</strong>
          <small>{ru ? "доступно аккаунту" : "available to this account"}</small>
        </article>
        <article>
          <span>{ru ? "История" : "History"}</span>
          <strong>{loadState === "loading" ? "—" : runs.length}</strong>
          <small>{ru ? "сохранённых запусков" : "saved runs"}</small>
        </article>
      </section>

      {loadState === "loading" ? (
        <div className="wd-ai-empty-state" aria-busy="true">
          <strong>{ru ? "Проверяем доступность AI-инструментов…" : "Checking AI tool availability…"}</strong>
        </div>
      ) : loadState === "unavailable" ? (
        <div className="wd-ai-empty-state">
          <strong>{ru ? "AI-рабочая область временно недоступна" : "AI workspace is temporarily unavailable"}</strong>
          <p>{aiWorkspaceEmptyCopy(locale)}</p>
        </div>
      ) : (
        <>
          <AccountAIToolList locale={locale} catalog={catalog} loading={false} />
          <AccountAIRunHistory
            locale={locale}
            runs={runs}
            deletingRunId={deletingRunId}
            onDelete={handleDelete}
          />
        </>
      )}
    </div>
  );
}
