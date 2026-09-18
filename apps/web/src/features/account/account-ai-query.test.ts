import { describe, expect, it } from "vitest";
import { aiPollDelayMs, isAIRunTerminal, newAIIdempotencyKey, shouldPollAIRun } from "./account-ai-query";

describe("AI run polling", () => {
  it("stops polling for every terminal state", () => {
    expect(isAIRunTerminal("succeeded")).toBe(true);
    expect(isAIRunTerminal("failed")).toBe(true);
    expect(isAIRunTerminal("provider_unknown")).toBe(true);
    expect(isAIRunTerminal("deleted")).toBe(true);
    expect(isAIRunTerminal("running")).toBe(false);
  });

  it("uses bounded backoff and a finite attempt budget", () => {
    expect(aiPollDelayMs(0)).toBe(1000);
    expect(aiPollDelayMs(3)).toBe(5000);
    expect(aiPollDelayMs(99)).toBe(5000);
    expect(shouldPollAIRun("running", 0)).toBe(true);
    expect(shouldPollAIRun("pending", 11)).toBe(true);
    expect(shouldPollAIRun("pending", 12)).toBe(false);
    expect(shouldPollAIRun("failed", 0)).toBe(false);
  });

  it("accepts only UUID idempotency keys", () => {
    const key = newAIIdempotencyKey(() => "11111111-1111-4111-8111-111111111111");
    expect(key).toBe("11111111-1111-4111-8111-111111111111");
  });
});
