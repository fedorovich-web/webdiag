# WebDiag A12.1 first five AI tools design

Date: 2026-08-12

Status: A12.1a implemented for internal evaluation; A12.1b remains next

Parent design: `2026-08-12-webdiag-ai-tools-credits-design.md`

## 1. Scope and delivery split

A12.1 delivers the first five real AI tool contracts without enabling Lava.top or
inventing provider results. The work is split at the binary-input boundary:

- A12.1a: one OpenAI Responses API adapter plus Audit Action Plan, Meta & SERP
  Studio, Schema Studio, and FAQ Studio;
- A12.1b: private bounded image intake plus Alt Text Studio.

The split prevents image bytes from being stored in SQLite and prevents the
worker from fetching client-provided URLs. It does not remove or replace the
fifth tool.

No tool becomes publicly `ready` merely because its code exists. Activation
still requires RU/EN evaluations, a real-provider smoke run, measured cost, and
an approved fixed credit price. Until then the production catalog remains
honestly unavailable.

## 2. Provider architecture

The first adapter uses the official OpenAI Python SDK and the Responses API.
It uses strict Structured Outputs, a server-owned prompt, an allowlisted model
from the catalog, `store=false`, bounded output tokens, explicit timeouts, and
SDK retries disabled. WebDiag owns retries because an ambiguous response-create
outcome must not silently create a second billable provider request.

The adapter handles four outcomes:

- completed structured output: validate and return it;
- refusal or incomplete response: known-safe final failure;
- rejected request before execution: known-safe final failure;
- timeout, connection loss, 5xx, or any response whose provider outcome cannot
  be proven: `provider_unknown`.

Provider request IDs and token usage are returned through the existing bounded
worker contract. Raw prompts, raw responses, API keys, and provider exception
messages are not logged or persisted.

For individual-user abuse controls, FastAPI derives a stable
privacy-preserving `safety_identifier` from the authenticated account ID using
HMAC-SHA-256 and a production-required secret. The worker receives only that
opaque value, never the account ID or email.

## 3. Contract boundary

FastAPI is authoritative for public input and persisted output validation.
The worker keeps matching provider-facing Pydantic schemas so OpenAI can enforce
the same bounded shape during generation. Contract parity is checked with
versioned fixtures and schema tests; a mismatch blocks activation.

Every public input uses `extra="forbid"`, strict primitive types, explicit byte
and item bounds, and locale `ru` or `en`. Every output is validated twice:
inside the provider adapter and again by FastAPI before completion captures
reserved credits.

## 4. A12.1a tool contracts

### 4.1 Audit Action Plan

Public input contains only `locale`, `project_id`, and `audit_id`. FastAPI loads
the immutable owned saved-audit payload and stores a bounded provider snapshot.
A missing and a foreign project/audit both produce the existing ownership-safe
404 behavior. No new audit runs and no network fetches occur.

Output contains a bounded summary and ordered actions. Every action references
one or more issue IDs present in the saved audit, gives concrete steps and a
verification instruction, and may repeat only URLs already present in those
issues. Server validation rejects unknown issue IDs or URLs.

### 4.2 Meta & SERP Studio

Input contains locale, one canonical public HTTP(S) page URL, bounded current
title/description/H1/content, and optional primary query and brand. It never
fetches the URL and never claims live SERP evidence.

Output contains exactly three title/description variants. Titles and
descriptions have hard character limits; WebDiag calculates displayed character
counts rather than trusting model-supplied numbers. Ranking promises and claims
of live SERP observation are forbidden by prompt and evaluation fixtures.

### 4.3 Schema Studio

V1 accepts one of `WebPage`, `Article`, `Organization`, `LocalBusiness`, or
`Product`, plus a canonical public page URL and a bounded list of explicit source
facts. Product offers, prices, aggregate ratings, and reviews are excluded from
V1. Output contains one JSON-LD object and a source-fact index for every factual
leaf value.

FastAPI validates the allowlisted `@context`, `@type`, property names, URL
schemes, source-fact indexes, and factual leaf values. A value that cannot be
traced to supplied facts or deterministic contract constants is rejected.

### 4.4 FAQ Studio

Input contains locale, bounded source content, an optional audience, and a
question count from 3 through 10. Output contains exactly that many unique
question/answer items. Every item includes a short evidence excerpt that must be
an exact substring of the supplied content after newline normalization.

The tool does not claim search-volume, People Also Ask, ranking, or live-SERP
evidence.

## 5. A12.1b image boundary

Alt Text Studio accepts an authenticated private upload reference, not a remote
URL and not base64 inside the run JSON. The upload path validates magic bytes,
decoded format, dimensions, pixel count, media type, and byte size before writing
to private artifact storage. Only JPEG, PNG, and WebP are accepted initially.

The worker reads the owned object through the storage boundary and sends a
bounded data URL as `input_image`. Output contains concise alt text and an
explicit decorative-image recommendation. It must not identify an unknown
person, infer protected traits, or claim facts absent from the image and supplied
page context.

A12.1b receives its own implementation plan because object storage, upload
lifecycle, and image decoding are independent security-sensitive subsystems.

## 6. Configuration and dependencies

Worker configuration adds an OpenAI API key, explicit connect/read/write/pool
timeouts, and allowlisted model IDs. The API adds the safety-identifier HMAC
secret. Production refuses to activate the provider without required secrets.
Ordinary test and startup paths do not call OpenAI.

The OpenAI SDK version is pinned in the Python lock. Before adding it, the exact
release and transitive dependency set are checked for known vulnerabilities.

## 7. Tests and activation gates

A12.1a uses TDD with one observed RED and one targeted GREEN per behavior group.
Ordinary CI uses a local HTTP transport or fake provider and makes no paid call.
Coverage includes:

- strict RU/EN input contracts and unknown-field rejection;
- saved-audit ownership and immutable snapshot resolution;
- output grounding invariants for all four tools;
- strict Responses API payload, `store=false`, model allowlist, and safety ID;
- refusal, incomplete, 4xx, timeout, connection, 5xx, invalid JSON, and invalid
  schema classification;
- provider request ID and usage propagation without secret/error leakage;
- completion-side output validation before credit capture;
- disabled provider behavior when secrets are absent.

Only after targeted tests pass is the affected Python suite run once. A real
OpenAI smoke run is opt-in and cannot be called by ordinary CI. Catalog
activation remains a separate evidence-backed change.

## 8. Verified references

- OpenAI Responses and Structured Outputs:
  https://developers.openai.com/api/docs/guides/structured-outputs
- OpenAI model catalog:
  https://developers.openai.com/api/docs/models
- OpenAI model guidance and safety identifiers:
  https://developers.openai.com/api/docs/guides/latest-model
- OpenAI vision inputs:
  https://developers.openai.com/api/docs/guides/images-vision
- OpenAI Python SDK:
  https://github.com/openai/openai-python

These references were checked against current official documentation and
Context7 on 2026-08-12. Provider behavior not established by those sources is
treated as unverified rather than assumed.

## 9. A12.1a implementation evidence

Implementation completed on 2026-08-13 without public catalog activation.

- Official SDK pinned: `openai==2.54.0`; the newly published 3.0.0 major was not
  adopted without matching interface evidence and regression coverage.
- OSV queries for `openai==2.54.0`, `distro==1.9.0`, `jiter==0.16.0`,
  `sniffio==1.3.1`, and `tqdm==4.70.0` returned zero known vulnerabilities at
  the time checked.
- Targeted provider tests: 18 passed.
- Targeted worker/actor tests: 31 passed.
- Targeted API contract and ownership groups passed before the final package
  run; RU/EN fixture gate: 1 passed.
- Full Python suite: 364 passed in 13.35 seconds.
- Ruff: passed after one import-only autofix; the passing Python suite was not
  repeated because runtime behavior did not change.
- Python lock: 36 locked packages matched the Windows environment.
- `git diff --check`: passed.

Ordinary verification made no OpenAI request and required no API key. A real
provider smoke run, semantic/cost evaluation, fixed credit-price approval, and
catalog activation remain explicit blockers. Lava.top remains excluded until
after all 15 tools, product polish, A12.5 hardening, and production-domain
verification.
