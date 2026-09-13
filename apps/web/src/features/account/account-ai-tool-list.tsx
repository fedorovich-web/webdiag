"use client";

import type { Locale } from "@webdiag/tool-registry";
import type { AICatalogResponse, AIToolSummary } from "./account-ai-contract";
import {
  aiToolDescriptors,
  type AIWorkspaceToolDescriptor,
} from "./account-ai-presentation";

interface AccountAIToolListProps {
  readonly locale: Locale;
  readonly catalog: AICatalogResponse | null;
  readonly loading: boolean;
  readonly onSelect?: (toolId: AIWorkspaceToolDescriptor["id"]) => void;
}

function catalogTool(
  catalog: AICatalogResponse | null,
  toolId: AIWorkspaceToolDescriptor["id"],
): AIToolSummary | null {
  return catalog?.tools.find((tool) => tool.id === toolId) ?? null;
}

function toolActionLabel(
  locale: Locale,
  toolId: AIWorkspaceToolDescriptor["id"],
  options: { readonly enabled: boolean; readonly loading: boolean },
): string {
  const ru = locale === "ru";
  if (options.loading) return ru ? "Проверяем" : "Checking";
  if (!options.enabled) return ru ? "Недоступен" : "Not available";
  if (toolId === "ai_audit_action_plan") {
    return ru ? "Запуск из сохранённого аудита" : "Run from a saved audit";
  }
  return ru ? "Открыть форму" : "Open form";
}

export function AccountAIToolList({ locale, catalog, loading, onSelect }: AccountAIToolListProps) {
  const ru = locale === "ru";
  const descriptors = aiToolDescriptors(locale);

  return (
    <section className="wd-ai-tool-section" aria-labelledby="account-ai-tools-heading">
      <div className="wd-ai-section-heading">
        <div>
          <span className="eyebrow">{ru ? "AI WORKSPACE" : "AI WORKSPACE"}</span>
          <h2 id="account-ai-tools-heading">{ru ? "Инструменты по рабочему процессу" : "Workflow tools"}</h2>
        </div>
        <p>{ru ? "Шесть текстовых сценариев для аккуратной работы с подтверждёнными данными проекта." : "Six text-only workflows for careful work with confirmed project evidence."}</p>
      </div>
      <div className="wd-ai-tool-grid">
        {descriptors.map((descriptor) => {
          const tool = catalogTool(catalog, descriptor.id);
          const enabled = Boolean(tool);
          const selectable = enabled && descriptor.id !== "ai_audit_action_plan" && Boolean(onSelect);
          return (
            <article className="wd-ai-tool-card" key={descriptor.id} data-enabled={enabled}>
              <div className="wd-ai-tool-card-head">
                <span className="wd-ai-tool-order">{String(descriptor.workflowOrder).padStart(2, "0")}</span>
                <span className={`wd-ai-tool-status${enabled ? " is-ready" : ""}`}>
                  {loading
                    ? (ru ? "Проверяем" : "Checking")
                    : enabled
                      ? (ru ? "Доступен" : "Available")
                      : (ru ? "Недоступен" : "Not available")}
                </span>
              </div>
              <h3>{descriptor.title}</h3>
              <p>{descriptor.summary}</p>
              <small>{descriptor.limits}</small>
              <button className="wd-button wd-button-secondary" type="button" disabled={!selectable} onClick={() => onSelect?.(descriptor.id)}>
                {toolActionLabel(locale, descriptor.id, { enabled, loading })}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
