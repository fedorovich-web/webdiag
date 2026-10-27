"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import type { Locale } from "@webdiag/tool-registry";
import { CheckCircle2, AlertCircle, Sparkles, X, ExternalLink } from "lucide-react";
import { accountErrorMessage } from "./account-messages";
import { createAIRun, getAIRun } from "./account-ai-client";
import type { AIRun, AuditActionPlanOutput } from "./account-ai-contract";
import { aiRunStateLabel, aiToolDescriptor } from "./account-ai-presentation";
import { aiPollDelayMs, isAIRunTerminal, newAIIdempotencyKey, shouldPollAIRun } from "./account-ai-query";
import { listAccountProjects, getAccountProject } from "./account-workspace-client";
import type { AccountProject, SavedAuditSummary } from "./account-workspace-contract";

interface AccountAIAuditPlanRunnerProps {
  readonly locale: Locale;
  readonly creditPrice: number;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

export function AccountAIAuditPlanRunner({ locale, creditPrice, onClose, onSuccess }: AccountAIAuditPlanRunnerProps) {
  const ru = locale === "ru";
  const descriptor = aiToolDescriptor(locale, "ai_audit_action_plan");

  const [projects, setProjects] = useState<readonly AccountProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [auditData, setAuditData] = useState<{ projectId: string; audits: readonly SavedAuditSummary[] }>({ projectId: "", audits: [] });
  const audits = auditData.projectId === selectedProjectId ? auditData.audits : [];
  const [selectedAuditId, setSelectedAuditId] = useState<string>("");
  const [manualProjectId, setManualProjectId] = useState<string>("");
  const [manualAuditId, setManualAuditId] = useState<string>("");
  const [useManualInput, setUseManualInput] = useState<boolean>(false);

  const [loadingData, setLoadingData] = useState<boolean>(true);
  const loadingAudits = Boolean(selectedProjectId && auditData.projectId !== selectedProjectId);
  const [run, setRun] = useState<AIRun | null>(null);
  const [attempt, setAttempt] = useState<number>(0);
  const [pending, setPending] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const prepared = useRef<{ fingerprint: string; key: string } | null>(null);

  useEffect(() => {
    let active = true;
    listAccountProjects()
      .then((res) => {
        if (!active) return;
        const list = res.projects;
        setProjects(list);
        if (list.length > 0 && list[0]) {
          setSelectedProjectId(list[0].id);
        } else {
          setUseManualInput(true);
        }
      })
      .catch(() => {
        if (!active) return;
        setUseManualInput(true);
      })
      .finally(() => {
        if (active) setLoadingData(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    let active = true;
    getAccountProject(selectedProjectId)
      .then((detail) => {
        if (!active) return;
        const projectAudits = detail.saved_audits ?? [];
        setAuditData({ projectId: selectedProjectId, audits: projectAudits });
        if (projectAudits.length > 0 && projectAudits[0]) {
          setSelectedAuditId(projectAudits[0].id);
        } else {
          setSelectedAuditId("");
        }
      })
      .catch(() => {
        if (!active) return;
        setAuditData({ projectId: selectedProjectId, audits: [] });
        setSelectedAuditId("");
      });
    return () => {
      active = false;
    };
  }, [selectedProjectId]);

  useEffect(() => {
    if (!run || isAIRunTerminal(run.state) || !shouldPollAIRun(run.state, attempt)) return;
    let active = true;
    const timer = window.setTimeout(() => {
      getAIRun(run.id)
        .then((detail) => {
          if (!active) return;
          setRun(detail.run);
          if (isAIRunTerminal(detail.run.state) && detail.run.state !== "provider_unknown") prepared.current = null;
          setAttempt((curr) => curr + 1);
          if (detail.run.state === "succeeded") {
            onSuccess?.();
          }
        })
        .catch((caught) => {
          if (!active) return;
          setError(accountErrorMessage(locale, caught));
          setAttempt((curr) => curr + 1);
        });
    }, aiPollDelayMs(attempt));
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [attempt, locale, run, onSuccess]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const effectiveProjectId = useManualInput ? manualProjectId.trim() : selectedProjectId;
    const effectiveAuditId = useManualInput ? manualAuditId.trim() : selectedAuditId;

    if (!effectiveProjectId || !effectiveAuditId) {
      setError(
        ru
          ? "Необходимо выбрать проект и аудит или указать их идентификаторы."
          : "Please select a project and audit, or specify their IDs."
      );
      return;
    }

    setPending(true);
    setError("");
    setRun(null);
    setAttempt(0);

    try {
      const input = { locale, project_id: effectiveProjectId, audit_id: effectiveAuditId };
      const fingerprint = JSON.stringify(input);
      if (prepared.current?.fingerprint !== fingerprint) {
        prepared.current = { fingerprint, key: newAIIdempotencyKey() };
      }
      const detail = await createAIRun(
        "ai_audit_action_plan",
        input,
        prepared.current.key,
      );
      setRun(detail.run);
      if (isAIRunTerminal(detail.run.state) && detail.run.state !== "provider_unknown") prepared.current = null;
      if (detail.run.state === "succeeded") {
        onSuccess?.();
      }
    } catch (caught) {
      setError(accountErrorMessage(locale, caught));
    } finally {
      setPending(false);
    }
  }

  const output = (run?.state === "succeeded" ? run.output : null) as AuditActionPlanOutput | null;

  return (
    <section className="wd-ai-text-runner" aria-labelledby="ai-audit-runner-title" style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="wd-ai-section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <span className="eyebrow" style={{ color: "var(--brand, #4f46e5)", fontWeight: 700, fontSize: "11px", letterSpacing: "0.06em" }}>
            {ru ? "AI АУДИТ САЙТА" : "AI SITE AUDIT"}
          </span>
          <h2 id="ai-audit-runner-title" style={{ margin: "4px 0 0 0", fontSize: "20px", fontWeight: 800 }}>
            {descriptor.title}
          </h2>
        </div>
        <button
          className="wd-button wd-button-ghost"
          type="button"
          onClick={onClose}
          style={{ padding: "6px 12px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <X style={{ width: 16, height: 16 }} />
          <span>{ru ? "Закрыть" : "Close"}</span>
        </button>
      </div>

      <p className="wd-ai-text-runner-note" style={{ fontSize: "13px", color: "var(--muted, #64748b)", margin: "8px 0 16px 0", lineHeight: 1.5 }}>
        {ru
          ? "Формирует пошаговый приоритизированный план устранения ошибок сайта на основе проведённого аудита. Каждый шаг содержит обоснование, инструкции и способы проверки."
          : "Generates a prioritized step-by-step fix plan based on audit findings. Each action includes rationale, instructions, and verification steps."}
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {!useManualInput && projects.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: 700, color: "var(--text-soft, #475569)" }}>
              <span>{ru ? "Проект:" : "Project:"}</span>
              <select
                value={selectedProjectId}
                onChange={(e) => { setSelectedProjectId(e.target.value); setSelectedAuditId(""); }}
                disabled={loadingData || pending || Boolean(run && !isAIRunTerminal(run.state))}
                style={{ height: "42px", borderRadius: "10px", border: "1px solid var(--line, #cbd5e1)", padding: "0 10px", background: "var(--surface, #fff)", font: "inherit" }}
              >
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name} ({proj.origin})
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: 700, color: "var(--text-soft, #475569)" }}>
              <span>{ru ? "Аудит:" : "Audit:"}</span>
              <select
                value={selectedAuditId}
                onChange={(e) => setSelectedAuditId(e.target.value)}
                disabled={loadingAudits || audits.length === 0 || pending || Boolean(run && !isAIRunTerminal(run.state))}
                style={{ height: "42px", borderRadius: "10px", border: "1px solid var(--line, #cbd5e1)", padding: "0 10px", background: "var(--surface, #fff)", font: "inherit" }}
              >
                {loadingAudits ? (
                  <option value="">{ru ? "Загружаем аудиты…" : "Loading audits…"}</option>
                ) : audits.length === 0 ? (
                  <option value="">{ru ? "Нет проведённых аудитов" : "No completed audits"}</option>
                ) : (
                  audits.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.score !== null ? `Score: ${a.score}` : "Audit"} — {new Date(a.completed_at).toLocaleDateString(ru ? "ru-RU" : "en-US")} ({a.issue_count} {ru ? "проблем" : "issues"})
                    </option>
                  ))
                )}
              </select>
            </label>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: 700, color: "var(--text-soft, #475569)" }}>
              <span>{ru ? "ID проекта (UUID):" : "Project ID (UUID):"}</span>
              <input
                type="text"
                placeholder="00000000-0000-0000-0000-000000000000"
                value={manualProjectId}
                onChange={(e) => setManualProjectId(e.target.value)}
                required
                style={{ height: "42px", borderRadius: "10px", border: "1px solid var(--line, #cbd5e1)", padding: "0 10px", background: "var(--surface, #fff)", font: "inherit", fontSize: "12px" }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: 700, color: "var(--text-soft, #475569)" }}>
              <span>{ru ? "ID аудита (UUID):" : "Audit ID (UUID):"}</span>
              <input
                type="text"
                placeholder="00000000-0000-0000-0000-000000000000"
                value={manualAuditId}
                onChange={(e) => setManualAuditId(e.target.value)}
                required
                style={{ height: "42px", borderRadius: "10px", border: "1px solid var(--line, #cbd5e1)", padding: "0 10px", background: "var(--surface, #fff)", font: "inherit", fontSize: "12px" }}
              />
            </label>
          </div>
        )}

        {projects.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
            <button
              type="button"
              onClick={() => setUseManualInput(!useManualInput)}
              className="wd-button wd-button-ghost"
              style={{ padding: "4px 8px", fontSize: "12px", color: "var(--brand, #4f46e5)" }}
            >
              {useManualInput
                ? (ru ? "← Выбрать из сохранённых проектов" : "← Select from saved projects")
                : (ru ? "Указать ID проекта и аудита вручную" : "Specify project and audit ID manually")}
            </button>
            {!useManualInput && audits.length === 0 && !loadingAudits && (
              <Link
                href={selectedProjectId ? `/account?project=${selectedProjectId}` : "/account"}
                className="wd-button wd-button-secondary"
                style={{ padding: "4px 10px", fontSize: "12px", textDecoration: "none" }}
              >
                {ru ? "Запустить аудит для этого проекта" : "Run audit for this project"}
              </Link>
            )}
          </div>
        )}

        {projects.length === 0 && !loadingData && (
          <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.2)", fontSize: "13px" }}>
            <p style={{ margin: "0 0 8px 0", color: "#3730a3", fontWeight: 600 }}>
              {ru ? "У вас пока нет созданных проектов с аудитами." : "You do not have any projects with audits yet."}
            </p>
            <Link
              href="/account"
              className="wd-button wd-button-primary"
              style={{ fontSize: "12px", padding: "6px 12px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <span>{ru ? "Перейти в панель и добавить сайт" : "Go to dashboard and add a site"}</span>
              <ExternalLink style={{ width: 14, height: 14 }} />
            </Link>
          </div>
        )}

        <button
          className="wd-button wd-button-primary"
          type="submit"
          disabled={pending || creditPrice <= 0 || Boolean(run && !isAIRunTerminal(run.state)) || (!useManualInput && (!selectedProjectId || !selectedAuditId))}
          aria-busy={pending}
          style={{ minHeight: "44px", fontSize: "14px", fontWeight: 700 }}
        >
          {pending
            ? (ru ? "Ставим в очередь…" : "Queuing…")
            : `${ru ? "Сгенерировать план исправлений" : "Generate action plan"} (${creditPrice} ${ru ? "AI-кредитов" : "AI credits"})`}
        </button>
      </form>

      {run && (
        <div style={{ marginTop: "16px", padding: "12px 14px", borderRadius: "10px", background: "var(--surface-muted, #f8fafc)", border: "1px solid var(--line, #e2e8f0)", display: "flex", alignItems: "center", gap: "10px" }}>
          <Sparkles style={{ width: 18, height: 18, color: "var(--brand, #4f46e5)", flexShrink: 0 }} />
          <div>
            <strong style={{ fontSize: "13px", display: "block" }}>{aiRunStateLabel(locale, run.state)}</strong>
            {!isAIRunTerminal(run.state) && (
              <small style={{ color: "var(--muted, #64748b)" }}>
                {ru ? "AI анализирует проблемы и формирует план исправлений…" : "AI is analyzing issues and building the action plan…"}
              </small>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="wd-account-error" role="alert" style={{ marginTop: "12px" }}>
          <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {output && (
        <div className="wd-ai-text-output" style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ padding: "14px 16px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <CheckCircle2 style={{ width: 18, height: 18, color: "#059669" }} />
              <strong style={{ color: "#065f46", fontSize: "14px" }}>
                {ru ? "План исправлений успешно сформирован" : "Action plan successfully generated"}
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: "13px", color: "#1f2937", lineHeight: 1.5 }}>
              {output.summary}
            </p>
          </div>

          {output.actions && output.actions.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 800, margin: "0 0 4px 0", color: "var(--text, #0f172a)" }}>
                {ru ? `Задачи по исправлению (${output.actions.length}):` : `Fix actions (${output.actions.length}):`}
              </h3>
              {output.actions.map((act, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    border: "1px solid var(--line, #e2e8f0)",
                    background: "var(--surface, #fff)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                    <strong style={{ fontSize: "14px", color: "var(--brand, #4f46e5)" }}>
                      #{idx + 1}. {act.title}
                    </strong>
                    {act.issue_ids && act.issue_ids.length > 0 && (
                      <span style={{ fontSize: "11px", padding: "2px 6px", borderRadius: "6px", background: "var(--surface-muted, #f1f5f9)", color: "var(--muted, #64748b)" }}>
                        {act.issue_ids.join(", ")}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--text-soft, #475569)" }}>
                    {act.rationale}
                  </p>
                  {act.steps && act.steps.length > 0 && (
                    <div style={{ marginTop: "4px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text, #0f172a)", display: "block", marginBottom: "4px" }}>
                        {ru ? "Шаги выполнения:" : "Steps:"}
                      </span>
                      <ol style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "var(--text, #1e293b)", lineHeight: 1.6 }}>
                        {act.steps.map((st, sidx) => (
                          <li key={sidx}>{st}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {act.verification && (
                    <div style={{ fontSize: "12px", padding: "8px 10px", borderRadius: "8px", background: "var(--surface-muted, #f8fafc)", borderLeft: "3px solid #10b981", marginTop: "4px" }}>
                      <strong>{ru ? "Проверка: " : "Verification: "}</strong>
                      <span style={{ color: "var(--text-soft, #475569)" }}>{act.verification}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
