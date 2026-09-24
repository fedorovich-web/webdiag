export const AI_TOOL_IDS = [
  "ai_audit_action_plan",
  "ai_competitor_gap_report",
  "ai_content_brief",
  "ai_content_optimizer",
  "ai_search_intent_page_fit",
  "ai_internal_linking_planner",
] as const;

export type AIToolId = (typeof AI_TOOL_IDS)[number];
export type AIRunState =
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "provider_unknown"
  | "deleted";

export interface AIToolSummary {
  readonly id: AIToolId;
  readonly contract_version: string;
  readonly credit_price: number;
}

export interface AICatalogResponse {
  readonly contract_version: "webdiag.ai.catalog.v1";
  readonly tools: readonly AIToolSummary[];
}

export interface AICreditBalanceResponse {
  readonly contract_version: "webdiag.credits.balance.v1";
  readonly account: {
    readonly available: number;
    readonly reserved: number;
  };
}

export interface AuditActionPlanAction {
  readonly issue_ids: readonly string[];
  readonly title: string;
  readonly rationale: string;
  readonly steps: readonly string[];
  readonly verification: string;
  readonly affected_urls: readonly string[];
}

export interface AuditActionPlanOutput {
  readonly summary: string;
  readonly actions: readonly AuditActionPlanAction[];
}

export interface ContentBriefOutput {
  readonly suggested_title: string;
  readonly sections: readonly {
    readonly heading: string;
    readonly purpose: string;
    readonly coverage: readonly { readonly source_fact_index: number; readonly excerpt: string }[];
  }[];
  readonly warnings: readonly string[];
}

export interface ContentOptimizerOutput {
  readonly revised_content: string;
  readonly changes: readonly {
    readonly kind: "clarity" | "structure" | "relevance" | "style";
    readonly before_excerpt: string;
    readonly after_excerpt: string;
    readonly rationale: string;
  }[];
  readonly preserved_fact_indexes: readonly number[];
  readonly warnings: readonly string[];
}

export interface SearchIntentPageFitOutput {
  readonly inferred_intent: "informational" | "commercial" | "transactional" | "navigational" | "local" | "unknown";
  readonly confidence: "low" | "medium" | "high";
  readonly fit: "aligned" | "partial" | "misaligned" | "insufficient_evidence";
  readonly evidence: readonly string[];
  readonly gaps: readonly string[];
  readonly recommendations: readonly string[];
  readonly warnings: readonly string[];
}

export interface CompetitorGapOutput {
  readonly summary: string;
  readonly gaps: readonly {
    readonly topic: string;
    readonly own_evidence: readonly string[];
    readonly competitor_evidence: readonly { readonly page_index: number; readonly excerpt: string }[];
    readonly recommendation: string;
  }[];
  readonly warnings: readonly string[];
}

export interface InternalLinkingOutput {
  readonly summary: string;
  readonly proposals: readonly {
    readonly source_page_index: number;
    readonly target_page_index: number;
    readonly suggested_anchor: string;
    readonly source_evidence: string;
    readonly target_evidence: string;
    readonly rationale: string;
  }[];
  readonly warnings: readonly string[];
}

export type AIOutput =
  | AuditActionPlanOutput
  | ContentBriefOutput
  | ContentOptimizerOutput
  | SearchIntentPageFitOutput
  | CompetitorGapOutput
  | InternalLinkingOutput;

export interface AIRun {
  readonly id: string;
  readonly tool_id: AIToolId;
  readonly contract_version: string;
  readonly credit_price: number;
  readonly state: AIRunState;
  readonly output: AuditActionPlanOutput | null;
  readonly error_code: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface AIRunDetailResponse {
  readonly contract_version: "webdiag.ai.run.v1";
  readonly run: AIRun;
}

export interface AIRunListResponse {
  readonly contract_version: "webdiag.ai.run_list.v1";
  readonly runs: readonly AIRun[];
  readonly next_cursor: string | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const ERROR_CODE = /^[a-z0-9_]{1,120}$/u;

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function only(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}

function boundedString(value: unknown, min: number, max: number): value is string {
  return typeof value === "string" && value.length >= min && value.length <= max;
}

function boundedStrings(
  value: unknown,
  bounds: { readonly minItems: number; readonly maxItems: number; readonly maxLength: number },
): value is readonly string[] {
  return Array.isArray(value)
    && value.length >= bounds.minItems
    && value.length <= bounds.maxItems
    && value.every((item) => boundedString(item, 1, bounds.maxLength));
}

function nonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function positiveInteger(value: unknown): value is number {
  return nonNegativeInteger(value) && value > 0;
}

function boundedIndex(value: unknown, maxExclusive: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value < maxExclusive;
}

function timestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/u.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  if (hour > 23 || minute > 59 || second > 59 || !Number.isFinite(Date.parse(value))) {
    return false;
  }
  const calendar = new Date(Date.UTC(year, month - 1, day));
  return calendar.getUTCFullYear() === year
    && calendar.getUTCMonth() === month - 1
    && calendar.getUTCDate() === day;
}

function httpUrl(value: unknown): value is string {
  if (!boundedString(value, 8, 2_048)) return false;
  try {
    const parsed = new URL(value);
    return (parsed.protocol === "http:" || parsed.protocol === "https:")
      && parsed.username === ""
      && parsed.password === "";
  } catch {
    return false;
  }
}

function isAIToolId(value: unknown): value is AIToolId {
  return typeof value === "string" && AI_TOOL_IDS.some((toolId) => toolId === value);
}

function isAIToolSummary(value: unknown): value is AIToolSummary {
  return record(value)
    && only(value, ["id", "contract_version", "credit_price"])
    && isAIToolId(value.id)
    && boundedString(value.contract_version, 1, 32)
    && positiveInteger(value.credit_price);
}

function isAuditActionPlanAction(value: unknown): value is AuditActionPlanAction {
  return record(value)
    && only(value, [
      "issue_ids",
      "title",
      "rationale",
      "steps",
      "verification",
      "affected_urls",
    ])
    && boundedStrings(value.issue_ids, { minItems: 1, maxItems: 20, maxLength: 200 })
    && new Set(value.issue_ids).size === value.issue_ids.length
    && boundedString(value.title, 1, 300)
    && boundedString(value.rationale, 1, 2_000)
    && boundedStrings(value.steps, { minItems: 1, maxItems: 12, maxLength: 2_000 })
    && boundedString(value.verification, 1, 2_000)
    && Array.isArray(value.affected_urls)
    && value.affected_urls.length <= 100
    && value.affected_urls.every(httpUrl);
}

function isAuditActionPlanOutput(value: unknown): value is AuditActionPlanOutput {
  return record(value)
    && only(value, ["summary", "actions"])
    && boundedString(value.summary, 1, 4_000)
    && Array.isArray(value.actions)
    && value.actions.length >= 1
    && value.actions.length <= 50
    && value.actions.every(isAuditActionPlanAction);
}

function isWarnings(value: unknown): value is readonly string[] {
  return boundedStrings(value, { minItems: 0, maxItems: 20, maxLength: 1_000 });
}

function isContentBriefOutput(value: unknown): value is ContentBriefOutput {
  return record(value)
    && only(value, ["suggested_title", "sections", "warnings"])
    && boundedString(value.suggested_title, 1, 300)
    && Array.isArray(value.sections)
    && value.sections.length >= 1
    && value.sections.length <= 20
    && value.sections.every((section) => record(section)
      && only(section, ["heading", "purpose", "coverage"])
      && boundedString(section.heading, 1, 300)
      && boundedString(section.purpose, 1, 1_000)
      && Array.isArray(section.coverage)
      && section.coverage.length >= 1
      && section.coverage.length <= 10
      && section.coverage.every((coverage) => record(coverage)
        && only(coverage, ["source_fact_index", "excerpt"])
        && boundedIndex(coverage.source_fact_index, 50)
        && boundedString(coverage.excerpt, 1, 1_000)))
    && isWarnings(value.warnings);
}

function isContentOptimizerOutput(value: unknown): value is ContentOptimizerOutput {
  return record(value)
    && only(value, ["revised_content", "changes", "preserved_fact_indexes", "warnings"])
    && boundedString(value.revised_content, 20, 50_000)
    && Array.isArray(value.changes)
    && value.changes.length <= 30
    && value.changes.every((change) => record(change)
      && only(change, ["kind", "before_excerpt", "after_excerpt", "rationale"])
      && (change.kind === "clarity" || change.kind === "structure" || change.kind === "relevance" || change.kind === "style")
      && boundedString(change.before_excerpt, 1, 2_000)
      && boundedString(change.after_excerpt, 1, 2_000)
      && boundedString(change.rationale, 1, 1_000))
    && Array.isArray(value.preserved_fact_indexes)
    && value.preserved_fact_indexes.length <= 30
    && value.preserved_fact_indexes.every((index) => Number.isInteger(index) && index >= 0 && index < 30)
    && isWarnings(value.warnings);
}

function isSearchIntentPageFitOutput(value: unknown): value is SearchIntentPageFitOutput {
  return record(value)
    && only(value, ["inferred_intent", "confidence", "fit", "evidence", "gaps", "recommendations", "warnings"])
    && ["informational", "commercial", "transactional", "navigational", "local", "unknown"].includes(String(value.inferred_intent))
    && ["low", "medium", "high"].includes(String(value.confidence))
    && ["aligned", "partial", "misaligned", "insufficient_evidence"].includes(String(value.fit))
    && boundedStrings(value.evidence, { minItems: 0, maxItems: 10, maxLength: 1_000 })
    && boundedStrings(value.gaps, { minItems: 0, maxItems: 20, maxLength: 1_000 })
    && boundedStrings(value.recommendations, { minItems: 0, maxItems: 20, maxLength: 1_000 })
    && isWarnings(value.warnings);
}

function isCompetitorGapOutput(value: unknown): value is CompetitorGapOutput {
  return record(value)
    && only(value, ["summary", "gaps", "warnings"])
    && boundedString(value.summary, 1, 4_000)
    && Array.isArray(value.gaps)
    && value.gaps.length >= 1
    && value.gaps.length <= 30
    && value.gaps.every((gap) => record(gap)
      && only(gap, ["topic", "own_evidence", "competitor_evidence", "recommendation"])
      && boundedString(gap.topic, 1, 300)
      && boundedStrings(gap.own_evidence, { minItems: 0, maxItems: 10, maxLength: 1_000 })
      && Array.isArray(gap.competitor_evidence)
      && gap.competitor_evidence.length >= 1
      && gap.competitor_evidence.length <= 10
      && gap.competitor_evidence.every((evidence) => record(evidence)
        && only(evidence, ["page_index", "excerpt"])
        && boundedIndex(evidence.page_index, 3)
        && boundedString(evidence.excerpt, 1, 1_000))
      && boundedString(gap.recommendation, 1, 2_000))
    && isWarnings(value.warnings);
}

function isInternalLinkingOutput(value: unknown): value is InternalLinkingOutput {
  return record(value)
    && only(value, ["summary", "proposals", "warnings"])
    && boundedString(value.summary, 1, 4_000)
    && Array.isArray(value.proposals)
    && value.proposals.length <= 100
    && value.proposals.every((proposal) => record(proposal)
      && only(proposal, ["source_page_index", "target_page_index", "suggested_anchor", "source_evidence", "target_evidence", "rationale"])
      && boundedIndex(proposal.source_page_index, 50)
      && boundedIndex(proposal.target_page_index, 50)
      && proposal.source_page_index !== proposal.target_page_index
      && boundedString(proposal.suggested_anchor, 1, 200)
      && boundedString(proposal.source_evidence, 1, 1_000)
      && boundedString(proposal.target_evidence, 1, 1_000)
      && boundedString(proposal.rationale, 1, 1_000))
    && isWarnings(value.warnings);
}

function isAIOutput(toolId: AIToolId, value: unknown): value is AIOutput {
  if (toolId === "ai_audit_action_plan") return isAuditActionPlanOutput(value);
  if (toolId === "ai_content_brief") return isContentBriefOutput(value);
  if (toolId === "ai_content_optimizer") return isContentOptimizerOutput(value);
  if (toolId === "ai_search_intent_page_fit") return isSearchIntentPageFitOutput(value);
  if (toolId === "ai_competitor_gap_report") return isCompetitorGapOutput(value);
  if (toolId === "ai_internal_linking_planner") return isInternalLinkingOutput(value);
  return false;
}

function isAIRunState(value: unknown): value is AIRunState {
  return value === "pending"
    || value === "running"
    || value === "succeeded"
    || value === "failed"
    || value === "provider_unknown"
    || value === "deleted";
}

function isAIRun(value: unknown): value is AIRun {
  if (!record(value) || !only(value, [
    "id",
    "tool_id",
    "contract_version",
    "credit_price",
    "state",
    "output",
    "error_code",
    "created_at",
    "updated_at",
  ])) return false;
  if (!boundedString(value.id, 1, 36) || !UUID.test(value.id)) return false;
  if (!isAIToolId(value.tool_id) || !boundedString(value.contract_version, 1, 32)) return false;
  if (!positiveInteger(value.credit_price) || !isAIRunState(value.state)) return false;
  if (!timestamp(value.created_at) || !timestamp(value.updated_at)) return false;

  if (value.state === "succeeded") {
    return isAIOutput(value.tool_id, value.output)
      && value.error_code === null;
  }
  if (value.output !== null) return false;
  if (value.state === "failed" || value.state === "provider_unknown") {
    return typeof value.error_code === "string" && ERROR_CODE.test(value.error_code);
  }
  return value.error_code === null;
}

export function isAICatalogResponse(value: unknown): value is AICatalogResponse {
  if (!record(value)
    || !only(value, ["contract_version", "tools"])
    || value.contract_version !== "webdiag.ai.catalog.v1"
    || !Array.isArray(value.tools)
    || value.tools.length > AI_TOOL_IDS.length
    || !value.tools.every(isAIToolSummary)) return false;
  return new Set(value.tools.map((tool) => tool.id)).size === value.tools.length;
}

export function isAICreditBalanceResponse(value: unknown): value is AICreditBalanceResponse {
  return record(value)
    && only(value, ["contract_version", "account"])
    && value.contract_version === "webdiag.credits.balance.v1"
    && record(value.account)
    && only(value.account, ["available", "reserved"])
    && nonNegativeInteger(value.account.available)
    && nonNegativeInteger(value.account.reserved);
}

export function isAIRunDetailResponse(value: unknown): value is AIRunDetailResponse {
  return record(value)
    && only(value, ["contract_version", "run"])
    && value.contract_version === "webdiag.ai.run.v1"
    && isAIRun(value.run);
}

export function isAIRunListResponse(value: unknown): value is AIRunListResponse {
  return record(value)
    && only(value, ["contract_version", "runs", "next_cursor"])
    && value.contract_version === "webdiag.ai.run_list.v1"
    && Array.isArray(value.runs)
    && value.runs.length <= 50
    && value.runs.every(isAIRun)
    && (value.next_cursor === null || boundedString(value.next_cursor, 1, 256));
}
