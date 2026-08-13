# WebDiag AI Content Workbench Design

Date: 2026-08-13
Status: approved for internal implementation

## Scope

This batch makes three existing internal catalog entries executable with the shared
OpenRouter `openai/gpt-5.6-luna` runtime:

- `ai_content_brief`;
- `ai_content_optimizer`;
- `ai_search_intent_page_fit`.

They remain internal and consume no user credits until provider smoke testing, quality
evaluation, pricing, and product review are complete. No frontend or visual work is part of
this batch.

## Evidence boundary

All three tools operate only on caller-supplied content. They do not fetch a search engine,
estimate keyword volume or difficulty, observe rankings, inspect competitors, or predict
results. Provider instructions prohibit those claims, and API output validation requires
source references or exact source excerpts where a factual statement is returned.

## Content brief contract

Input contains locale, audience, objective, optional working title, and between one and 50
verified source facts. Output contains a suggested title, a bounded section outline, and
warnings. Every section contains exact coverage excerpts copied from the supplied facts plus
the zero-based fact indexes that support those excerpts. The API rejects missing, invalid, or
mismatched references.

This contract permits editorial structure while keeping factual coverage machine-checkable.

## Content optimizer contract

Input contains locale, a canonical public page URL, the original content, an optional target
query and objective, and zero to 30 verified factual constraints. Output contains revised
content, a bounded change ledger, preserved fact indexes, and warnings. Each change must point
to an exact excerpt in the original and an exact excerpt in the revision. Every supplied
factual constraint must be preserved verbatim in the revision and referenced exactly once.

The tool does not promise ranking improvement. A request without factual constraints is valid,
but the output must then return an empty preserved-index list.

## Search intent/page fit contract

Input contains locale, canonical public page URL, primary query, declared intended page type,
optional title and H1, and page content. Output contains inferred intent, categorical
confidence, categorical fit, exact evidence excerpts, gaps, recommendations, and warnings.
Every evidence excerpt must exist in the supplied query, title, H1, or content. A non-unknown
intent requires evidence. This is an analysis of declared query-to-page fit, not a live SERP
classification.

## Validation and safety

- Pydantic v2 strict models reject coercion and extra fields.
- All strings, lists, URLs, and output collections are bounded.
- Page URLs use the existing public HTTP(S) URL policy, including private-network rejection.
- Output validators reject unknown fact indexes, ungrounded excerpts, duplicate references,
  and unsupported enum values.
- The worker requests strict JSON Schema output and performs no automatic provider retry.
- Provider errors keep the existing known-safe versus unknown-outcome classification.
- No real provider request is required by automated tests.

## Verification boundary

Development uses one RED and one GREEN run per changed layer. The full Python suite, Ruff, lock
verification, and diff check run once after the complete batch.
