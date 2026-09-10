import { describe, expect, it } from "vitest";
import {
  aiRunStateLabel,
  aiToolDescriptor,
  aiToolDescriptors,
  aiWorkspaceEmptyCopy,
} from "./account-ai-presentation";

describe("AI workspace presentation", () => {
  it("describes the approved six-tool workflow in both locales", () => {
    expect(aiToolDescriptors("ru").map((tool) => tool.id)).toEqual([
      "ai_audit_action_plan",
      "ai_competitor_gap_report",
      "ai_content_brief",
      "ai_content_optimizer",
      "ai_search_intent_page_fit",
      "ai_internal_linking_planner",
    ]);
    expect(aiToolDescriptor("ru", "ai_audit_action_plan")).toMatchObject({
      title: "AI-план исправлений",
      workflowOrder: 1,
    });
    expect(aiToolDescriptor("en", "ai_internal_linking_planner")).toMatchObject({
      title: "AI internal linking plan",
      workflowOrder: 6,
    });
  });

  it("localizes every persisted run state without implying success", () => {
    expect(aiRunStateLabel("ru", "pending")).toBe("В очереди");
    expect(aiRunStateLabel("en", "running")).toBe("Processing");
    expect(aiRunStateLabel("en", "provider_unknown")).toBe("Outcome needs review");
    expect(aiRunStateLabel("ru", "deleted")).toBe("Удалён");
  });

  it("uses factual unavailable copy for an empty real catalog", () => {
    expect(aiWorkspaceEmptyCopy("ru")).toMatch(/проверки качества|недоступны/u);
    expect(aiWorkspaceEmptyCopy("en")).toMatch(/evaluation|not available/u);
    expect(aiWorkspaceEmptyCopy("ru")).not.toMatch(/скоро появится|готов/u);
  });
});
