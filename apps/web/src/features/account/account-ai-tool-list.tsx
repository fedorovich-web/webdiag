"use client";

import { isActiveAIToolId } from "../tools/ai-tools-data";

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
  if (options.loading) return ru ? "Проверяем…" : "Checking…";
  if (!options.enabled) return ru ? "Недоступен" : "Not available";
  if (toolId === "ai_audit_action_plan") {
    return ru ? "Запустить план исправлений" : "Run action plan";
  }
  return ru ? "Запустить инструмент" : "Run tool";
}

export function AccountAIToolList({ locale, catalog, loading, onSelect }: AccountAIToolListProps) {
  const ru = locale === "ru";
  const descriptors = aiToolDescriptors(locale)
    .filter((tool) => isActiveAIToolId(tool.id))
    .map((tool, index) => ({ ...tool, workflowOrder: index + 1 }));

  return (
    <section className="wd-ai-tool-section" aria-labelledby="account-ai-tools-heading">
      <div className="wd-ai-section-heading">
        <div>
          <span className="eyebrow">{ru ? "AI WORKSPACE" : "AI WORKSPACE"}</span>
          <h2 id="account-ai-tools-heading">{ru ? "Инструменты по рабочему процессу" : "Workflow tools"}</h2>
        </div>
        <p>{ru ? `${descriptors.length} инструментов для работы с данными проекта, текстом и изображениями.` : `${descriptors.length} tools for working with project evidence, text and images.`}</p>
      </div>
      <div className="wd-ai-tool-grid">
        {descriptors.map((descriptor) => {
          const tool = catalogTool(catalog, descriptor.id);
          const enabled = Boolean(tool) && !loading;
          const selectable = enabled && Boolean(onSelect);
          return (
            <article
              className="wd-ai-tool-card wd-ai-tool-card-interactive"
              key={descriptor.id}
              data-enabled={enabled}
              tabIndex={selectable ? 0 : -1}
              onClick={() => {
                if (selectable) onSelect?.(descriptor.id);
              }}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && selectable) {
                  e.preventDefault();
                  onSelect?.(descriptor.id);
                }
              }}
            >
              <div className="wd-ai-tool-card-head">
                <span className="wd-ai-tool-order">{String(descriptor.workflowOrder).padStart(2, "0")}</span>
                <span className="wd-ai-tool-cost">{tool ? `${tool.credit_price} ${ru ? "AI-кредит" : "AI credit"}` : "—"}</span>
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
              <button
                className="wd-button wd-button-primary"
                type="button"
                disabled={!selectable}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.(descriptor.id);
                }}
              >
                {toolActionLabel(locale, descriptor.id, { enabled, loading })}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
