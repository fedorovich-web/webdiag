import { describe, expect, it } from "vitest";
import {
  isAICatalogResponse,
  isAICreditBalanceResponse,
  isAIRunDetailResponse,
  isAIRunListResponse,
} from "./account-ai-contract";

const runBase = {
  id: "11111111-1111-4111-8111-111111111111",
  tool_id: "ai_audit_action_plan",
  contract_version: "v1",
  credit_price: 7,
  created_at: "2026-09-10T12:00:00Z",
  updated_at: "2026-09-10T12:01:00Z",
};

const actionPlan = {
  summary: "Fix the verified title issue first.",
  actions: [{
    issue_ids: ["issue-title"],
    title: "Add a descriptive title",
    rationale: "The saved audit found the issue.",
    steps: ["Publish a descriptive title."],
    verification: "Run the deterministic title check again.",
    affected_urls: ["https://example.com/page"],
  }],
};

describe("account AI response contracts", () => {
  it("accepts only the six approved tools with positive fixed prices", () => {
    const catalog = {
      contract_version: "webdiag.ai.catalog.v1",
      tools: [
        "ai_audit_action_plan",
        "ai_competitor_gap_report",
        "ai_content_brief",
        "ai_content_optimizer",
        "ai_search_intent_page_fit",
        "ai_internal_linking_planner",
      ].map((id, index) => ({ id, contract_version: "v1", credit_price: index + 1 })),
    };

    expect(isAICatalogResponse(catalog)).toBe(true);
    expect(isAICatalogResponse({
      ...catalog,
      tools: [{ id: "ai_image_studio", contract_version: "v1", credit_price: 5 }],
    })).toBe(false);
    expect(isAICatalogResponse({
      ...catalog,
      tools: [{ id: "ai_audit_action_plan", contract_version: "v1", credit_price: 0 }],
    })).toBe(false);
    expect(isAICatalogResponse({ ...catalog, internal_count: 15 })).toBe(false);
  });

  it("validates non-negative integer credit balances with exact fields", () => {
    expect(isAICreditBalanceResponse({
      contract_version: "webdiag.credits.balance.v1",
      account: { available: 20, reserved: 7 },
    })).toBe(true);
    expect(isAICreditBalanceResponse({
      contract_version: "webdiag.credits.balance.v1",
      account: { available: -1, reserved: 0 },
    })).toBe(false);
    expect(isAICreditBalanceResponse({
      contract_version: "webdiag.credits.balance.v1",
      account: { available: 20, reserved: 0, provider_cost: 1 },
    })).toBe(false);
  });

  it("accepts a grounded Audit Copilot result and rejects malformed output", () => {
    const succeeded = {
      contract_version: "webdiag.ai.run.v1",
      run: { ...runBase, state: "succeeded", output: actionPlan, error_code: null },
    };

    expect(isAIRunDetailResponse(succeeded)).toBe(true);
    expect(isAIRunDetailResponse({ ...succeeded, debug_prompt: "secret" })).toBe(false);
    expect(isAIRunDetailResponse({
      ...succeeded,
      run: { ...succeeded.run, output: { summary: "x", actions: [] } },
    })).toBe(false);
    expect(isAIRunDetailResponse({
      ...succeeded,
      run: {
        ...succeeded.run,
        output: {
          ...actionPlan,
          actions: [{ ...actionPlan.actions[0], affected_urls: ["javascript:alert(1)"] }],
        },
      },
    })).toBe(false);
  });

  it("enforces output and error invariants for every persisted run state", () => {
    for (const state of ["pending", "running", "deleted"] as const) {
      expect(isAIRunDetailResponse({
        contract_version: "webdiag.ai.run.v1",
        run: { ...runBase, state, output: null, error_code: null },
      })).toBe(true);
    }
    for (const state of ["failed", "provider_unknown"] as const) {
      expect(isAIRunDetailResponse({
        contract_version: "webdiag.ai.run.v1",
        run: { ...runBase, state, output: null, error_code: `ai_${state}` },
      })).toBe(true);
    }
    expect(isAIRunDetailResponse({
      contract_version: "webdiag.ai.run.v1",
      run: { ...runBase, state: "running", output: actionPlan, error_code: null },
    })).toBe(false);
    expect(isAIRunDetailResponse({
      contract_version: "webdiag.ai.run.v1",
      run: { ...runBase, state: "failed", output: null, error_code: null },
    })).toBe(false);
  });

  it("validates bounded run lists and opaque cursor shape", () => {
    const pending = { ...runBase, state: "pending", output: null, error_code: null };
    expect(isAIRunListResponse({
      contract_version: "webdiag.ai.run_list.v1",
      runs: [pending],
      next_cursor: "opaque-cursor_123",
    })).toBe(true);
    expect(isAIRunListResponse({
      contract_version: "webdiag.ai.run_list.v1",
      runs: [pending],
      next_cursor: 123,
    })).toBe(false);
    expect(isAIRunListResponse({
      contract_version: "webdiag.ai.run_list.v1",
      runs: [{ ...pending, id: "not-a-uuid" }],
      next_cursor: null,
    })).toBe(false);
  });
});
