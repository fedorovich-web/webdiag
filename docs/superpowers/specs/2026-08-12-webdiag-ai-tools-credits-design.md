# WebDiag AI tools, credits, and Lava.top design

Date: 2026-08-12

Status: approved design; implementation is not started by this document

Target program: A12.0-A12.5

## 1. Objective

Add 15 substantial AI tools to WebDiag without presenting deterministic or fabricated output as AI, exposing provider secrets, requiring a server GPU, or weakening the existing account and ownership boundaries.

The first provider is OpenAI. All AI tools are account-only and paid from an internal prepaid credit balance. Closed beta uses administrator-granted credits. Real payment acceptance uses Lava.top after its product moderation and an end-to-end payment test.

This document defines the program architecture and the boundaries of its implementation waves. A12.0 is the first implementation unit. Each later tool wave receives its own focused implementation plan and, where a tool contract needs additional product decisions, a focused addendum before code is written.

## 2. Approved product decisions

- Use one OpenAI project and API key at launch.
- Keep a provider-neutral `AIProvider` boundary; OpenAI is the only initial implementation.
- Use OpenAI-hosted models. WebDiag requires no local GPU.
- AI tools require an authenticated WebDiag account. Anonymous AI execution is forbidden.
- Add exactly 15 initial AI tools, listed in section 8.
- Do not claim a dedicated super-resolution tool in the initial release.
- Charge a fixed, visible credit price for each tool run before execution.
- Credits do not expire.
- Successful results are retained until the owner deletes them.
- User deletion removes access to result content but does not remove the financial record.
- Closed beta credits are issued by an operator-only CLI, not by a public admin API.
- The first real payment provider is Lava.top.
- The first payment currency is RUB. RU and EN change presentation language, not prices or ledger currency.
- Real payments remain disabled until the Lava.top product is moderated and the integration passes a real end-to-end test.

## 3. Existing-system alignment

WebDiag currently uses FastAPI for account APIs, file-backed SQLite for account-scoped persistence, and Dramatiq with RabbitMQ for worker scheduling. The worker already calls protected internal FastAPI endpoints rather than directly owning the account database.

The AI architecture preserves that ownership boundary:

- FastAPI is the only writer of the account SQLite database.
- Dramatiq workers claim and complete work through protected internal HTTP contracts.
- Workers hold OpenAI and artifact-storage credentials, but not account sessions or direct account-database access.
- Public API identity always comes from the existing server session; client-supplied user identifiers are never trusted.

SQLite supports the first production topology only as a single API writer. Multiple API replicas sharing SQLite are explicitly unsupported. Horizontal API scaling requires a later PostgreSQL storage implementation behind the same repository interfaces.

## 4. Component boundaries

### 4.1 AI catalog

The catalog owns stable tool IDs, contract versions, input and output schemas, prompt versions, enabled state, model policy, limits, and integer credit prices. A catalog update never changes the price or contract stored on an existing run.

Model IDs are internal operational configuration, not part of the public API contract. Only allowlisted model IDs may be configured.

### 4.2 AI runs

The run service owns validation, authorization, state transitions, idempotency, leases, attempts, result persistence, and retention. It never performs hidden audits or fetches arbitrary URLs on behalf of an AI prompt.

### 4.3 Credits

The credit service owns the non-expiring balance, reservations, captures, releases, purchases, refunds, and compensating adjustments. Credit values are integers; floating-point arithmetic is forbidden.

### 4.4 Providers

`AIProvider` accepts a normalized, versioned execution request and returns a typed provider result or a classified provider error. The first implementation uses OpenAI. Tests use an in-memory fake provider and must not require a real API key.

`PaymentProvider` creates and retrieves provider invoices and normalizes provider events. The first implementation uses Lava.top.

### 4.5 Artifact storage

`ArtifactStorage` stores binary results outside SQLite. Production uses private S3-compatible object storage. Development and tests use a bounded local-filesystem adapter. Objects are never public. In A12, downloads are streamed only through the authenticated account API after ownership and integrity checks; direct object-store and presigned URLs are not exposed.

### 4.6 Worker integration

Workers claim jobs from FastAPI with a one-time lease token, call OpenAI, validate the result, write binary artifacts when required, and complete or fail the claim through an internal API. Lease tokens are random, stored hashed, bounded by expiry, and compared safely.

## 5. Credit ledger and persistence

### 5.1 Required records

- `credit_accounts`: materialized `available` and `reserved` totals plus an update version.
- `credit_ledger`: append-only balance movements.
- `ai_runs`: owner, tool and contract version, input snapshot, price snapshot, state, output metadata, and deletion state.
- `ai_run_attempts`: claim, attempt number, bounded timestamps, provider identifiers, usage metadata, and classified errors.
- `ai_artifacts`: owner, run, object key, MIME type, byte size, SHA-256, and deletion state.
- `payment_orders`: owner, selected credit package, expected amount and currency, provider identity, provider invoice ID, and state.
- `payment_events`: deduplicated provider-event receipt and processing outcome.

The exact schema is designed in the A12.0 implementation plan and follows existing SQLite migration and integrity patterns.

### 5.2 Ledger rules

Allowed operation types are `admin_grant`, `purchase`, `reserve`, `capture`, `release`, `refund`, and `adjustment`.

- Ledger rows cannot be updated or deleted.
- Corrections use compensating rows with an operator reason and correlation ID.
- `credit_accounts` and `credit_ledger` update in the same SQLite transaction.
- Reconciliation must prove that materialized totals equal the sum of ledger movements.
- A reservation cannot make `available` negative.
- Capture cannot exceed the associated reservation.
- Every reserve, capture, and release references exactly one run.
- Every purchase and refund references exactly one payment order.

### 5.3 Pricing activation

Prices are not guessed. A tool remains `internal` until representative real-provider evaluations record request bounds, output bounds, p95 provider cost, storage cost when applicable, and the approved integer credit price.

Credit package quantities and RUB prices are operational catalog records, not hardcoded into frontend components. A payment package cannot be enabled unless its Lava.top mapping and expected RUB amount are present in validated server configuration.

## 6. Run lifecycle and transaction semantics

The ordinary successful lifecycle is:

`pending -> running -> succeeded`

Failure states are:

- `failed`: a classified, final failure with no saved result;
- `provider_unknown`: an external request may have been accepted, but WebDiag cannot prove its outcome;
- `deleted`: the owner has removed access to the saved content while billing metadata remains.

Creation is atomic:

1. Authenticate the account.
2. Validate the tool input, limits, enabled state, and fixed price.
3. Enforce the unique `(user_id, idempotency_key)` constraint.
4. Insert the run and reserve credits in one transaction.

Claiming is atomic and lease-based. While an external provider call is active, the worker renews its lease through the internal API at a bounded interval shorter than the lease lifetime. Only the current unexpired lease holder may renew, complete, or fail an attempt. A stale worker cannot overwrite a later attempt.

Completion is atomic: validated result metadata is persisted and the reservation is captured in the same transaction. A run cannot become `succeeded` without a readable, integrity-checked result.

Known-safe failures release the reservation. An expired lease returns to `pending` only when the provider request is known not to have been submitted.

The checked OpenAI documentation did not establish an idempotency guarantee for creating a response. After an ambiguous transport outcome, WebDiag does not automatically submit a second provider request. It records `provider_unknown`, releases the user's reservation, and exposes the event for operator reconciliation. This prevents duplicate user charges; it cannot eliminate every rare duplicate provider cost.

## 7. Public and internal API contracts

### 7.1 Account APIs

- `GET /v1/account/ai/catalog`
- `POST /v1/account/ai/runs`
- `GET /v1/account/ai/runs`
- `GET /v1/account/ai/runs/{run_id}`
- `DELETE /v1/account/ai/runs/{run_id}`
- `GET /v1/account/ai/artifacts/{artifact_id}`
- `GET /v1/account/credits`
- `GET /v1/account/credits/ledger`
- `POST /v1/account/payments/lava-top/invoices`

All account responses use `Cache-Control: no-store`. Lists use bounded cursor pagination. The run-creation endpoint requires an `Idempotency-Key` header.

Errors preserve the existing shape:

```json
{"detail":{"code":"ai_insufficient_credits","message":"Insufficient credits."}}
```

Status mapping:

- `401`: no valid account session;
- `402`: insufficient credits;
- `404`: missing or foreign owned object;
- `409`: idempotency or state conflict;
- `413`: body or artifact limit;
- `429`: rate or concurrency limit;
- `503`: configured provider unavailable or disabled.

### 7.2 Webhook API

Lava.top sends payment-result events to a dedicated public endpoint. The handler:

- accepts HTTPS production traffic only;
- has a small route-specific body limit;
- validates the configured `X-Api-Key` shared secret in constant time;
- treats the documented source IP as defense in depth, not primary authentication;
- accepts only allowlisted event types and schema versions;
- deduplicates provider events and provider invoice IDs;
- looks up the locally created payment order;
- retrieves/reconciles provider invoice data before fulfillment;
- verifies product, amount, currency, state, and account binding;
- inserts the purchase ledger row and closes the order in one transaction;
- returns success for an already-processed valid event.

Browser success redirects never grant credits.

The Lava.top documentation states that failed deliveries can be attempted up to 20 times and that refund webhooks are not sent. The implementation therefore requires idempotent delivery handling plus a separate refund/reconciliation workflow.

### 7.3 Internal worker APIs

Internal endpoints claim, renew the lease, complete, and fail AI work. They use a dedicated production-required bearer secret distinct from the monitoring and Lava.top secrets. Their request and response schemas are versioned and bounded. Lease renewal is mandatory while a provider call is active; a worker that cannot renew stops further processing and cannot commit a result with the expired lease.

## 8. Initial tool catalog

### 8.1 Audit and SEO

1. `ai_audit_action_plan`: turn an owned saved audit into a prioritized correction plan.
2. `ai_meta_serp_studio`: produce bounded title and description variants without ranking promises.
3. `ai_schema_studio`: generate JSON-LD only from supplied facts; never invent prices, ratings, reviews, or identities.
4. `ai_faq_studio`: generate questions and answers grounded only in supplied content.
5. `ai_alt_text_studio`: use image and page context without identifying unknown people.
6. `ai_content_brief`: produce a page structure, entities, questions, and evidence requirements.
7. `ai_content_optimizer`: propose edits while preserving source facts and showing changed passages.
8. `ai_search_intent_page_fit`: compare a query with supplied page content without claiming live SERP evidence.
9. `ai_competitor_gap_report`: compare only pages actually acquired through approved intake and link findings to sources.
10. `ai_internal_linking_planner`: recommend links only among owned project pages and explain each candidate.
11. `ai_redirect_migration_mapper`: map supplied old and new URLs with confidence and explicit unresolved cases.

### 8.2 Workbenches

12. `ai_localization_workbench`: RU/EN localization preserving terminology, links, markup, and protected tokens.
13. `ai_regex_workbench`: generate and explain a regex and evaluate it against bounded supplied examples without executing arbitrary code.

### 8.3 Images

14. `ai_image_studio`: generate a new image from a validated prompt.
15. `ai_image_edit_studio`: edit an owned/uploaded image, including bounded object or background changes.

A dedicated true super-resolution claim is excluded from this catalog.

## 9. Model policy

All initial providers use one OpenAI project and API key:

- `gpt-5.6-luna` for cost-sensitive bounded transformations;
- `gpt-5.6-terra` for multi-source analysis and higher-reasoning workflows;
- `text-embedding-3-large` for candidate retrieval in competitor, linking, and redirect workflows;
- `gpt-image-2` for image generation and editing;
- `omni-moderation-latest` for supported moderation inputs.

The server catalog maps tools to allowlisted model policies. Public clients cannot select arbitrary provider models, token limits, reasoning effort, image sizes, or quality settings.

Model snapshots and prompts are evaluated before a tool becomes public. A model change requires tool-contract tests, eval comparison, and cost revalidation, but does not require a public API version change when the output contract remains compatible.

## 10. Security and privacy

- Ownership is checked on every run, artifact, audit, project, payment, balance, and ledger access.
- Foreign and absent private resources both return `404`.
- Site-aware tools accept an owned saved-audit reference or bounded uploaded input. Workers do not freely fetch client-provided URLs.
- Any required page acquisition reuses WebDiag's public-origin and SSRF protections.
- File validation uses content signatures, decoded dimensions, MIME allowlists, and byte/pixel limits rather than filename extensions.
- System prompts are server-owned and versioned. User content is delimited as data.
- Structured outputs must validate against the tool's Pydantic/JSON Schema contract before persistence and charging.
- OpenAI receives no email, session token, balance, or raw internal account identifier.
- Provider keys exist only in worker/server secret configuration and never enter frontend bundles, database rows, or logs.
- Prompts, full inputs, raw provider responses, and internal exception messages are excluded from ordinary logs.
- Errors exposed to users are stable and do not contain stack traces or provider internals.
- Request rate, concurrent-run, input, output, artifact, history, and retry limits are finite and configurable within hard safety bounds.
- AI output is labeled as generated. Deterministic WebDiag facts and AI recommendations remain distinguishable.
- No fake uptime, incidents, traffic, rankings, availability, or live SERP evidence may be generated.

## 11. Retention and deletion

Successful results remain available until the owner deletes them, subject to finite account quotas.

Deletion immediately marks content unavailable. Binary deletion is asynchronous and idempotent: the record moves to deletion-pending, the object is removed, and the tombstone is finalized. A failed object-store deletion is retried without restoring user access.

Financial ledger rows, provider transaction IDs, price snapshots, and the minimum audit trail required for reconciliation remain after content deletion. They contain no prompt or generated content.

## 12. Lava.top integration policy

Lava.top is selected because its current FAQ allows selling digital products and access to closed external resources, and its public API explicitly supports integrations for an author's own site, CRM, or bot.

WebDiag uses a moderated hidden digital product representing access to paid AI functionality. The server creates invoices from an allowlisted credit-package catalog. The client cannot supply an amount, currency, product ID, or credit quantity that the server accepts as authoritative.

Initial payment support is RUB only. Lava.top's RU/EN checkout localization may be used, but the WebDiag ledger remains locale-independent.

Lava.top is a payment agent, not WebDiag's merchant of record. Tax reporting, lawful product operation, refunds, consumer obligations, and delivery remain the owner's responsibility. This fact must be reflected in release documentation; the code must not claim that Lava.top removes those obligations.

Production payment activation requires all of the following:

1. Lava.top account identity verification is complete.
2. The WebDiag product passes Lava.top moderation.
3. API and webhook secrets are configured outside the repository.
4. Invoice creation, failed payment, duplicate webhook, successful payment, reconciliation, and refund paths pass integration verification.
5. A real minimal-value payment and refund are reconciled end to end.
6. The owner has approved the published offer, privacy terms, refund policy, product description, and applicable tax handling.

## 13. Operator beta grants

A12.0 supplies an operator-only CLI for closed beta credits. It requires an explicit account identifier, positive integer quantity, reason, operator correlation ID, and confirmation of the target account. It writes an `admin_grant` ledger entry transactionally.

There is no public admin HTTP endpoint in this scope because WebDiag currently has no operator RBAC model. The CLI must not print session secrets, password data, provider keys, or unrelated account records.

## 14. Testing and evaluation

### 14.1 TDD workflow

For each bounded behavior:

1. Add one focused failing test.
2. Confirm the intended failure once.
3. Implement the minimum behavior.
4. Run the affected package's targeted suite once.
5. Run the relevant full package suite once before completing the batch.
6. Run the full monorepo verification once before final PR handoff.

An unchanged suite is not rerun without a named reason.

### 14.2 Required automated coverage

- ledger conservation, reconciliation, and concurrent reservation;
- insufficient balance and capture/release races;
- idempotent run creation and webhook replay;
- payment amount, currency, product, account, and invoice substitution;
- IDOR for every private endpoint;
- worker crash, lost lease, stale completion, and `provider_unknown`;
- malformed UUIDs, cursor bounds, body limits, and corrupted persisted JSON;
- image type, byte, dimension, pixel, and artifact-hash validation;
- deletion without financial-history deletion;
- secret and exception redaction;
- RU/EN input and output contract validation;
- provider-disabled production startup validation;
- Lava.top fixture contracts derived from its current OpenAPI documentation;
- OpenAI fake-provider contracts for ordinary CI.

Normal CI performs no paid provider calls. Opt-in smoke verification uses separately supplied secrets and must never log them.

### 14.3 AI evaluations

Every tool has representative RU and EN eval cases. Evaluations assert schemas and semantic invariants rather than exact prose. They check grounding, required evidence, preservation of supplied facts, prohibited invention, bounded length, and refusal/failure behavior.

A tool cannot become `ready` until its eval, provider-cost, security, and integration gates pass with fresh evidence.

## 15. Delivery roadmap

### A12.0: foundation

Catalog, ledger, beta grant CLI, run state machine, storage/provider protocols, internal worker claims, migrations, and security tests. No public AI tool is marked ready.

### A12.1: first five tools

Audit Action Plan, Meta & SERP Studio, Schema Studio, FAQ Studio, and Alt Text Studio. This validates saved-audit, structured-text, and vision paths.

### A12.2: next five tools

Content Brief, Content Optimizer, Search Intent & Page Fit, Competitor Gap Report, and Internal Linking Planner. This adds bounded multi-page and embedding-assisted workflows.

### A12.3: final five tools

Redirect Migration Mapper, Localization Workbench, Regex Workbench, Image Studio, and Image Edit Studio. This adds bounded tabular input and private binary artifacts.

### A12.4: Lava.top

Invoice creation, payment event handling, reconciliation, refunds, provider fixtures, and production activation gates.

### A12.5: hardening

Per-tool cost/eval reports, final credit prices, quota tuning, reservation cleanup, backup/restore verification, claim and webhook load tests, OpenAPI checks, and RU/EN integration verification.

## 16. Frontend boundary

Frontend work is limited to authenticated API integration: catalog state, balance, launch confirmation with fixed price, progress/error state, history, artifact access, and Lava.top redirect handling.

Homepage design, typography, color, layout, marketing redesign, animations, and visual baseline approval are excluded.

## 17. References

- OpenAI model catalog: https://developers.openai.com/api/docs/models
- OpenAI GPT Image 2: https://developers.openai.com/api/docs/models/gpt-image-2
- OpenAI embeddings: https://developers.openai.com/api/docs/models/text-embedding-3-large
- OpenAI moderation: https://developers.openai.com/api/docs/models/omni-moderation-latest
- OpenAI webhook reference: https://developers.openai.com/api/reference/resources/webhooks
- Lava.top API: https://developers.lava.top/en
- Lava.top digital products FAQ: https://faq.lava.top/article/53726
- Lava.top API-priced products FAQ: https://faq.lava.top/article/83555
- Lava.top terms: https://lava.top/en/docs/terms
