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
    return value.tool_id === "ai_audit_action_plan"
      && isAuditActionPlanOutput(value.output)
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
