import type { Locale } from "@webdiag/tool-registry";
import type { AuditActionPlanOutput } from "./account-ai-contract";

export function AccountAIActionPlanResult({
  locale,
  output,
}: {
  readonly locale: Locale;
  readonly output: AuditActionPlanOutput;
}) {
  const ru = locale === "ru";
  return (
    <section className="wd-ai-action-plan-result" aria-labelledby="ai-action-plan-result-title">
      <div className="wd-ai-section-heading">
        <div>
          <span className="eyebrow">{ru ? "РЕЗУЛЬТАТ AI" : "AI RESULT"}</span>
          <h2 id="ai-action-plan-result-title">{ru ? "Порядок исправлений" : "Fix order"}</h2>
        </div>
        <p>{ru ? "Сверьте каждое действие с исходной проверкой перед внесением изменений." : "Check every action against the source audit before making changes."}</p>
      </div>
      <p className="wd-ai-action-plan-summary">{output.summary}</p>
      <ol className="wd-ai-action-list">
        {output.actions.map((action) => (
          <li key={`${action.issue_ids.join("-")}:${action.title}`}>
            <div className="wd-ai-action-head">
              <div>
                <span>{action.issue_ids.join(", ")}</span>
                <h3>{action.title}</h3>
              </div>
              <span className="wd-ai-action-count">{action.steps.length} {ru ? "шагов" : "steps"}</span>
            </div>
            <p>{action.rationale}</p>
            <ol>
              {action.steps.map((step) => <li key={step}>{step}</li>)}
            </ol>
            <div className="wd-ai-action-verification">
              <strong>{ru ? "Проверка результата" : "Verification"}</strong>
              <span>{action.verification}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
