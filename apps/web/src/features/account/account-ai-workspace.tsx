"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  AIToolId,
  AIRun,
} from "./account-ai-contract";
import { aiWorkspaceEmptyCopy } from "./account-ai-presentation";
import { AccountAIToolList } from "./account-ai-tool-list";
import { AccountAIRunHistory } from "./account-ai-run-history";
import { AccountAITextToolRunner } from "./account-ai-text-tool-runner";
import { ToolCatalog } from "../tools/tool-catalog";
import { getPublicCatalogCategories, getPublicCatalogTools } from "../tools/public-catalog-data";
import { Sparkles, Wrench } from "lucide-react";

interface AccountAIWorkspaceProps {
  readonly locale: Locale;
}

export function AccountAIWorkspace({ locale }: AccountAIWorkspaceProps) {
  const ru = locale === "ru";
  const [activeTab, setActiveTab] = useState<"diagnostic" | "ai">(() => {
    if (typeof window !== "undefined") {
      const param = new URLSearchParams(window.location.search).get("tab");
      if (param === "diagnostic") return "diagnostic";
    }
    return "ai";
  });
  const [catalog, setCatalog] = useState<AICatalogResponse | null>(null);
  const [credits, setCredits] = useState<AICreditBalanceResponse | null>(null);
  const [runs, setRuns] = useState<readonly AIRun[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "unavailable">("loading");
  const [error, setError] = useState("");
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<Exclude<AIToolId, "ai_audit_action_plan"> | null>(null);

  const diagnosticTools = useMemo(() => getPublicCatalogTools(locale), [locale]);
  const diagnosticCategories = useMemo(
    () => getPublicCatalogCategories(locale, diagnosticTools),
    [locale, diagnosticTools],
  );

  const loadWorkspace = useCallback(() => {
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
          setError(ru ? "AI-инструменты временно недоступны." : "AI tools are temporarily unavailable.");
          return;
        }
        setCatalog(catalogResult.value);
        setCredits(creditsResult.value);
        setRuns(runsResult.value.runs);
        setLoadState("ready");
      },
    );
  }, [locale, ru]);

  useEffect(() => {
    const timer = window.setTimeout(loadWorkspace, 0);
    return () => window.clearTimeout(timer);
  }, [loadWorkspace]);

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

  const availableTools = catalog?.tools.length ? catalog.tools.length : 6;
  const balance = credits?.account.available ?? null;

  return (
    <div className="wd-ai-workspace">
      <div className="wd-tools-tabs" role="tablist" aria-label={ru ? "Вкладки инструментов" : "Tool tabs"}>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "diagnostic"}
          className={`wd-tools-tab-btn${activeTab === "diagnostic" ? " is-active" : ""}`}
          onClick={() => setActiveTab("diagnostic")}
        >
          <Wrench aria-hidden="true" style={{ width: 16, height: 16 }} />
          <span>{ru ? "Все 140+ инструментов диагностики" : "All 140+ Diagnostic Tools"}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "ai"}
          className={`wd-tools-tab-btn${activeTab === "ai" ? " is-active" : ""}`}
          onClick={() => setActiveTab("ai")}
        >
          <Sparkles aria-hidden="true" style={{ width: 16, height: 16 }} />
          <span>{ru ? "AI-помощники и генераторы" : "AI Assistants & Generators"}</span>
        </button>
      </div>

      {activeTab === "diagnostic" ? (
        <div className="wd-account-tools-catalog">
          <div className="wd-account-tools-head">
            <span className="eyebrow">{ru ? "КАТАЛОГ ИНСТРУМЕНТОВ" : "TOOL CATALOG"}</span>
            <h1>{ru ? "Все 140+ инструментов WebDiag" : "All 140+ WebDiag Diagnostic Tools"}</h1>
            <p>{ru ? "Проверки SEO, производительности, безопасности, DNS, разметки и доступности для вашего сайта." : "SEO, performance, security, DNS, schema, and accessibility audits for your website."}</p>
          </div>
          <ToolCatalog locale={locale} tools={diagnosticTools} categories={diagnosticCategories} />
        </div>
      ) : (
        <>
          <header className="wd-ai-workspace-hero">
        <div>
          <span className="eyebrow">{ru ? "AI-помощники" : "AI assistants"}</span>
          <h1>{ru ? "AI-инструменты WebDiag" : "WebDiag AI tools"}</h1>
          <p>{ru ? "Помощники для приоритизации задач и работы с подтверждёнными данными проверок." : "Assistants for prioritizing work and using confirmed audit data."}</p>
        </div>
        <div className="wd-ai-workspace-hero-note">
          <strong>{ru ? "Проверяйте рекомендации" : "Review recommendations"}</strong>
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
          <small>{ru ? "доступно для запуска" : "available to run"}</small>
        </article>
        <article className="wd-ai-credits-summary-article">
          <div className="wd-ai-credits-summary-info">
            <span>{ru ? "Кредиты" : "Credits"}</span>
            <strong>{balance === null ? "—" : balance}</strong>
            <small>{ru ? "доступно аккаунту" : "available to this account"}</small>
          </div>
          <Link
            href={ru ? "/account/checkout?pack=pack-50" : "/en/account/checkout?pack=pack-50"}
            className="wd-button wd-button-primary wd-ai-topup-btn"
          >
            {ru ? "+ Пополнить" : "+ Top up"}
          </Link>
        </article>
        <article>
          <span>{ru ? "История" : "History"}</span>
          <strong>{loadState === "loading" ? "—" : runs.length}</strong>
          <small>{ru ? "сохранённых запусков" : "saved runs"}</small>
        </article>
      </section>

      {loadState === "loading" ? (
        <div className="wd-ai-empty-state" aria-busy="true">
          <strong>{ru ? "Загружаем AI-инструменты…" : "Loading AI tools…"}</strong>
        </div>
      ) : loadState === "unavailable" ? (
        <div className="wd-ai-empty-state">
          <strong>{ru ? "AI-инструменты временно недоступны" : "AI tools are temporarily unavailable"}</strong>
          <p>{aiWorkspaceEmptyCopy(locale)}</p>
        </div>
      ) : (
        <>
          {balance === 0 && (
            <div className="wd-ai-credits-exhausted-banner" role="status">
              <div className="wd-ai-credits-exhausted-info">
                <strong>{ru ? "AI-кредиты израсходованы" : "AI credits exhausted"}</strong>
                <p>
                  {ru
                    ? "Для продолжения работы выберите разовый пакет кредитов от 390 ₽ (без подписки, кредиты не сгорают) или оформите тариф Pro."
                    : "To continue using AI tools, choose an on-demand credit pack from $5 (no recurring fees, credits never expire) or upgrade to Pro."}
                </p>
              </div>
              <Link
                href={ru ? "/account/checkout?pack=pack-50" : "/en/account/checkout?pack=pack-50"}
                className="wd-button wd-button-primary"
              >
                {ru ? "Купить кредиты" : "Buy credits"}
              </Link>
            </div>
          )}
          <AccountAIToolList locale={locale} catalog={catalog} loading={false} onSelect={(toolId) => setSelectedTool(toolId === "ai_audit_action_plan" ? null : toolId)} />
          {selectedTool && <AccountAITextToolRunner locale={locale} toolId={selectedTool} onClose={() => setSelectedTool(null)} />}
          <AccountAIRunHistory
            locale={locale}
            runs={runs}
            deletingRunId={deletingRunId}
            onDelete={handleDelete}
          />
        </>
      )}
    </>
  )}
</div>
  );
}
