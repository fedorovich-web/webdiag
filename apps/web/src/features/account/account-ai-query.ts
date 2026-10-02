import type { AIRunState } from "./account-ai-contract";

const MAX_POLL_ATTEMPTS = 12;
const MAX_POLL_DELAY_MS = 5_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export function isAIRunTerminal(state: AIRunState): boolean {
  return state === "succeeded"
    || state === "failed"
    || state === "provider_unknown"
    || state === "deleted";
}

export function shouldPollAIRun(state: AIRunState, attempt: number): boolean {
  return !isAIRunTerminal(state)
    && Number.isInteger(attempt)
    && attempt >= 0
    && attempt < MAX_POLL_ATTEMPTS;
}

export function aiPollDelayMs(attempt: number): number {
  if (!Number.isFinite(attempt) || attempt < 0) return 1_000;
  return Math.min(MAX_POLL_DELAY_MS, 1_000 * (2 ** Math.floor(attempt)));
}

export function newAIIdempotencyKey(randomUUID: () => string = () => crypto.randomUUID()): string {
  const key = randomUUID();
  if (!UUID.test(key)) throw new Error("Invalid idempotency key");
  return key;
}
