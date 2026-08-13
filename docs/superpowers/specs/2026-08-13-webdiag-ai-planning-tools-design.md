# WebDiag AI Planning Tools Design

Date: 2026-08-13
Status: approved for internal implementation

## Scope

This batch makes `ai_competitor_gap_report` and `ai_internal_linking_planner`
executable through the existing internal GPT-5.6/OpenRouter runtime. Neither tool becomes
public or receives a fixed credit price in this batch.

## Competitor Gap Report

The caller supplies one owned-page snapshot and one to three comparison-page snapshots. Each
snapshot contains a canonical public URL plus optional title/H1 and bounded content. WebDiag
does not crawl the URLs. Query strings and fragments are removed before persistence/provider
submission.

The output contains a summary and bounded gaps. Every gap has competitor evidence expressed as
an exact excerpt plus a zero-based comparison-page index. Own-page evidence is optional because
a genuine gap can be an absence; when present, it must be an exact own-page excerpt. The API
rejects unknown indexes, non-source excerpts, duplicate evidence, and duplicate normalized
page URLs.

The report is a comparison of supplied snapshots, not live competitor research. It contains no
search volume, difficulty, ranking, traffic, backlink, authority, or result guarantee.

## Internal Linking Planner

The caller supplies two to 50 page snapshots and an optional bounded list of existing directed
links represented by source/target indexes. WebDiag does not crawl or mutate the site.

Each proposed link references a valid source and target page index, exact source and target
excerpts, a suggested anchor, and rationale. The API rejects self-links, duplicate proposals,
unknown indexes, existing directed pairs, and excerpts absent from their referenced pages.

The result is a reviewable plan only. It does not claim that a link exists, was deployed, changes
rankings, or has measured traffic impact.

## Shared safety

- Inputs and provider outputs use strict Pydantic v2 models with bounded collections and
  `extra="forbid"`.
- URLs use the existing public-network policy and content-page query/fragment redaction.
- User content is untrusted data and cannot override system instructions.
- Provider output uses strict JSON Schema, fixed `openai/gpt-5.6-luna`, no fallback, ZDR-required
  routing, denied data collection, and no automatic retry.
- Automated tests make no network request.
