# OpenRouter provider cost evidence design

Date: 2026-08-16

## Context

WebDiag already persists bounded provider input and output units for every AI
attempt. The OpenRouter adapter currently ignores `usage.cost`, so the approved
AI activation gate cannot calculate observed per-tool cost or p95 cost without
manual estimates. AI tools must remain internal until real provider evaluation
and fixed credit pricing are approved.

OpenRouter's documented non-streaming response includes `usage.cost` as the
request cost in USD. The generation metadata endpoint can later be used as an
independent certification cross-check through the saved generation ID. Normal
runtime completion must not add that second provider request.

## Decision

Parse the documented numeric `usage.cost` and convert it with decimal arithmetic
to a bounded integer number of nano-USD. Fractional nano-USD values round upward,
so cost evidence never understates the provider response. Boolean, missing,
negative, non-finite, malformed, and implausibly large values fail closed.

The worker completion envelope carries `provider_cost_nano_usd`. FastAPI
validates it independently and persists it on the matching leased attempt in the
same completion transaction as output and token usage. The field is internal and
does not enter account or public API responses.

The SQLite migration is additive. Historical attempts receive `NULL`, which
means "not measured" and is distinct from a measured zero-cost response. New
successful completions always persist an integer, including zero.

An operator-only read command reports one catalog tool at a time over a bounded
latest-success sample. It emits deterministic JSON with sample size,
measured/unmeasured counts, input/output units, and min/max/nearest-rank p95
cost. It never emits user IDs, run IDs, prompts, outputs, provider bodies, or
artifact keys.

## Boundaries

- Currency is USD because this is the documented OpenRouter billing unit.
- One USD equals 1,000,000,000 nano-USD.
- A single attempt is capped at 1,000 USD. Exceeding the cap is treated as an
  invalid/unknown provider response, not silently truncated.
- No API key, prompt, provider response body, account identifier, or artifact
  bytes are written to cost evidence.
- No AI catalog state or credit price changes in this stage.
- Ordinary tests use MockTransport and make no provider request.

## Verification

Worker tests cover exact conversion, conservative sub-nano rounding, missing and
invalid costs, and image/text responses. API tests cover request validation,
transactional persistence, idempotent replay, and the historical `NULL`
migration state. CLI tests cover bounded p95 aggregation and empty evidence.
Targeted worker/API tests run once after the implementation
group, followed by the relevant complete Python suite before handoff.
