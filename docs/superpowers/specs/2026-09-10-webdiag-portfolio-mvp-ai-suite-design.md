# WebDiag portfolio MVP AI suite design

Date: 2026-09-10

Status: approved for planning

## 1. Decision

The public WebDiag portfolio MVP will expose six text-only AI tools as one
project-centred website improvement workflow:

1. `ai_audit_action_plan` — AI Audit Copilot;
2. `ai_competitor_gap_report` — AI Competitor Gap;
3. `ai_content_brief` — AI Content Strategy;
4. `ai_content_optimizer` — AI Content Optimizer;
5. `ai_search_intent_page_fit` — AI Search Intent & Page Fit;
6. `ai_internal_linking_planner` — AI Internal Linking Planner.

Image generation, image editing, alt-text generation, audio, transcription, and
other binary-artifact workflows are outside this MVP. The decision keeps the
runtime compatible with a modest application server: model inference remains
remote, while WebDiag handles bounded JSON requests, asynchronous job state,
validated results, and account-owned history.

The remaining internal AI contracts are not removed. They remain unavailable
until a later evidence-backed activation decision.

## 2. Product goal

The MVP must demonstrate an AI-native product rather than a catalog of unrelated
prompt wrappers. A user should be able to move from observed website evidence to
a reviewable improvement plan without leaving the project context:

```text
saved project and audit
  -> prioritized correction plan
  -> comparison-page gaps
  -> content strategy
  -> query-to-page fit
  -> controlled content revision
  -> internal-linking plan
  -> report or export
```

The workflow is portfolio-ready when an evaluator can see the product decision,
the deterministic/AI boundary, the grounding rules, the asynchronous backend,
and the operational safeguards in one coherent demonstration.

## 3. User and access boundary

The initial user is an authenticated site owner, developer, or SEO specialist
working with an owned WebDiag project. Anonymous AI execution is forbidden.

Every run belongs to the authenticated account. Project, audit, run, and result
lookups preserve ownership-safe not-found behavior so callers cannot distinguish
missing resources from foreign resources. AI results never mutate a website,
publish content, or change an audit automatically.

The MVP uses administrator-granted evaluation credits. Payment processing and
Lava.top remain out of scope. A missing positive credit balance fails before any
provider submission.

## 4. Tool contracts

### 4.1 AI Audit Copilot

The user starts from an owned immutable saved audit. FastAPI resolves a bounded
provider snapshot rather than accepting issue details from the browser. The
result contains a concise summary and an ordered correction plan. Every action
must reference issue identifiers and URLs that exist in the saved audit, include
concrete steps, and include a verification instruction.

The tool must not invent an audit finding, rerun an audit, fetch a URL, or claim
that a proposed fix has been applied.

### 4.2 AI Competitor Gap

The user selects one owned project page and supplies one to three public
comparison-page URLs. WebDiag captures bounded page snapshots before provider
submission by reusing the shared `SafeHttpFetcher` policy: public HTTP(S) only,
DNS/IP validation, pinned resolved targets, redirect revalidation, timeouts, and
hard response-size limits. The browser must not submit authoritative extracted
content.

The provider receives normalized page snapshots with query strings and fragments
removed from persisted URLs. Each returned gap must contain an exact excerpt and
the comparison-page index that supports it. The result is a comparison of
captured pages, not live SERP research, and contains no traffic, search-volume,
ranking, backlink, authority, or outcome claims.

### 4.3 AI Content Strategy

The user supplies an audience, objective, optional working title, and verified
source facts. Project and audit facts may be selected through the UI, but the API
constructs the authoritative provider input. The result contains a suggested
title, a bounded ordered outline, coverage notes, and warnings. Every factual
coverage statement references an exact source excerpt and source index.

The tool does not claim current trends, seasonality, keyword demand, or competitor
evidence unless a future contract adds an explicit trusted source for that data.

### 4.4 AI Content Optimizer

The user submits existing page content, an optional target query and objective,
and zero to 30 factual constraints. The result contains revised content, a
bounded change ledger, preserved fact references, and warnings. Every ledger
entry identifies exact before and after excerpts. Supplied factual constraints
must be preserved and machine-validated.

The interface presents the result as a reviewable draft. It provides copy and
export actions but no automatic publication and no ranking promise.

### 4.5 AI Search Intent & Page Fit

The user supplies a primary query, intended page type, and page content. The
result classifies intent and fit using bounded categorical values, exact source
excerpts, gaps, recommendations, and warnings. A non-unknown intent requires
evidence from the submitted query, title, H1, or content.

This tool evaluates declared query-to-page fit. It does not query a search engine
or represent its output as observed SERP intent.

### 4.6 AI Internal Linking Planner

The user selects two to 50 project pages and may include their existing directed
links. The API creates bounded page snapshots. Each proposal identifies source
and target page indexes, exact source and target excerpts, a suggested anchor,
and rationale. Validation rejects self-links, duplicate proposals, invalid
indexes, missing excerpts, and links already present in the submitted graph.

The result is an exportable implementation plan. WebDiag does not insert links
into the customer website.

## 5. Product experience

### 5.1 Entry points

The account navigation receives one project-aware AI workspace. Tools are also
reachable from relevant context:

- saved audit and issue views open AI Audit Copilot;
- a project page opens Competitor Gap, Content Strategy, Intent & Page Fit, and
  Content Optimizer;
- the project page inventory opens Internal Linking Planner.

Contextual entry points preselect owned resources but never pass authoritative
ownership or evidence data solely through the client.

### 5.2 Run form

Each tool has a task-specific form rather than a generic chat box. The form shows:

- what input is used;
- which data is sent to the provider;
- factual capability limits;
- the exact credit cost before confirmation;
- input bounds and validation errors;
- a single primary run action.

RU and EN forms must have equivalent fields and capability statements.

### 5.3 Asynchronous states

Submission returns an owned run identifier. The UI supports queued, processing,
completed, known-safe failed, unknown-provider-outcome, expired, and deleted
states. Closing the page does not cancel or lose the run. Reopening history shows
the latest persisted state without repeating a provider request.

An unknown provider outcome is never retried automatically because doing so could
duplicate a billable request. User-facing errors are localized and must not
expose provider messages, internal codes, prompts, secrets, or stack traces.

### 5.4 Result presentation

Results use tool-specific structured views, not raw JSON and not a chat transcript.
Evidence is visually distinguishable from AI recommendations. Primary actions are
copy, export, open related project data, and start a deliberate new run. Results
are readable on mobile, in dark theme, and with keyboard navigation.

The AI workspace includes empty, loading, insufficient-credit, unavailable,
expired, deleted, and recoverable-error states. Touch targets, focus order, live
status announcements, and long-content overflow are covered by component and
browser tests.

## 6. Runtime architecture

The existing FastAPI AI service remains authoritative for public contracts,
ownership, idempotency, credit reservation, completion validation, and persisted
state. The existing worker/OpenRouter boundary performs provider requests. The
web application uses same-origin account API routes and does not receive provider
credentials.

The production AI overlay consists of the API, RabbitMQ, and a bounded-concurrency
worker. Text inference runs at the remote provider. Initial worker concurrency is
kept deliberately low and must be configurable. Request bodies, output tokens,
queue leases, provider timeouts, and stored result sizes remain bounded.

The exact text model is selected only after the operator evaluation suite passes
for RU and EN. Catalog model policies are allowlisted server-side. OpenRouter
fallbacks and provider data collection remain disabled; zero-data-retention
routing is required where supported by the approved provider policy.

## 7. Security and data handling

All public input and provider output use strict versioned schemas with unknown
fields rejected. The API validates output again before credits are captured and
before results become visible.

Required controls include:

- session authentication and ownership checks on every account route;
- idempotency keys bound to the authenticated user, tool, and normalized input;
- credit reservation before queue publication and exactly-once ledger effects;
- prompt-injection resistance by treating page and user content as untrusted data;
- no secrets, raw prompts, raw responses, or provider error bodies in logs;
- privacy-preserving provider safety identifiers;
- bounded input, output, pagination, retention, and deletion;
- SSRF-safe server-side capture for competitor and project page snapshots;
- HTML escaping and structured rendering for every result and export;
- rate limits for run creation, status polling, and snapshot capture;
- no automatic provider retry after an ambiguous submission outcome.

Injection tests cover extra JSON fields, oversized strings and collections,
hostile page content, HTML/script payloads, malformed structured output, invalid
indexes and excerpts, URL normalization, foreign resource identifiers, and
provider error redaction.

## 8. Cost and activation policy

An internal implementation is not public availability. Each tool remains
`internal` until all of the following evidence exists:

1. RU and EN contract fixtures pass;
2. representative RU and EN semantic evaluation meets approved thresholds;
3. one authorized real-provider smoke run succeeds without data leakage;
4. cost is measured across the evaluation corpus;
5. maximum request cost and a positive fixed integer credit price are approved;
6. timeout, refusal, invalid output, 4xx, 5xx, connection loss, and ambiguous
   outcome paths are verified;
7. production secrets and worker configuration pass fail-closed preflight;
8. account UI and browser accessibility checks pass;
9. the tool is activated by an explicit catalog state change.

Activation occurs tool by tool. One failed tool does not require weakening the
gates for the others. The public catalog shows only `ready` tools and does not
advertise internal contracts as available.

## 9. Performance and modest-server constraints

The MVP accepts no image or audio uploads and stores no binary AI artifacts. Page
capture is bounded and performed only when required by a submitted run. Parsed
snapshots retain only contract-required text and metadata.

The API does not hold an HTTP request open for model completion. Queue depth,
processing latency, known failures, unknown outcomes, and provider cost are
observable without logging private content. Backpressure rejects excess work
with a stable localized response rather than exhausting API memory or worker
capacity.

No GPU is required. A resource-constrained deployment may run a single worker
process with concurrency one, while the public API and deterministic tools remain
available if the AI overlay is disabled or unhealthy.

## 10. MVP exclusions

The following are explicitly outside this milestone:

- image generation, image editing, alt-text image analysis, audio, and video;
- automatic CMS publication or customer-site mutation;
- payment acceptance and subscription billing;
- live SERP scraping, invented search metrics, or ranking predictions;
- multi-provider AI visibility monitoring;
- exposing all 15 internal tools merely to increase the public count;
- Payload CMS activation while its production dependency tree fails the clean
  audit gate;
- local model inference or a self-hosted GPU runtime.

## 11. Delivery sequence

Implementation is divided into reversible, independently verifiable increments:

1. audit current contracts, API routes, worker behavior, web account patterns,
   evaluation fixtures, and production overlay configuration;
2. add public contract and browser regression tests for the six-tool workspace;
3. implement the project-aware AI workspace and structured result renderers;
4. add server-owned page snapshot resolution where project context is required;
5. run the operator evaluation corpus and select an approved text model;
6. measure cost, approve fixed credit prices, and activate tools individually;
7. verify production AI preflight and modest-server backpressure behavior;
8. complete desktop/mobile, RU/EN, dark-theme, accessibility, and real-browser
   screenshot review;
9. run one fresh relevant full verification and record truthful release evidence.

## 12. Definition of done

## Implementation evidence (2026-09-10)

- `4cc0da2` added the localized account AI navigation entry and active-state
  contract coverage.
- `c7cdee6` added strict RU/EN catalog, credit, run, and grounded Audit Copilot
  response validators.
- `90b2b0f` added a bounded same-origin AI proxy with selected-cookie,
  idempotency-key, body-size, timeout, and no-store controls.
- `e14eab1` added the typed account AI client and localized safe error mapping.
- `dcdc939` added the RU/EN AI workspace shell, six-tool workflow catalog,
  run history, responsive states, and account routes.
- `0081788` added the saved-audit Audit Copilot, finite polling, grounded action
  plan rendering, and manual review messaging for unknown provider outcomes.
- `2f3a158` added five evidence-first text-tool forms and strict output shapes
  for content briefs, content optimization, search-intent fit, competitor gap,
  and internal linking proposals.
- `b7a0af2` and `def0657` added browser coverage for the AI workspace, five form
  entry points, the saved-audit run flow, mobile overflow, and touch targets.

The six tools remain `internal` in the production catalog until the provider,
cost, safety, and release gates in section 8 are evidenced. The implementation
therefore demonstrates the complete authenticated UI and contracts without
claiming live model availability.

The AI portfolio MVP is complete only when:

- all six tools are publicly `ready` and usable through authenticated RU/EN UI;
- the complete project workflow can be demonstrated with controlled non-sensitive
  fixture data;
- every factual result is grounded according to its tool contract;
- provider and security failure paths are visible and safe;
- no binary AI storage or GPU dependency is required;
- targeted tests, Python and web suites, typecheck, lint, production build,
  dependency audits, production Compose preflights, and browser checks pass;
- fresh desktop and mobile screenshots have been reviewed;
- deployment documentation distinguishes verified implementation from remaining
  external hosting, secret, backup, domain, and provider gates;
- the Draft PR contains the implementation, verification evidence, and an honest
  portfolio-facing summary without invented product metrics.
