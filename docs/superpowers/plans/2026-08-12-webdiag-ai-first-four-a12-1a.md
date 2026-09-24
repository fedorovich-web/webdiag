# WebDiag A12.1a First Four AI Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a production-bounded OpenAI Responses adapter and validated contracts for the first four A12.1 text tools without publicly activating unevaluated tools.

**Architecture:** FastAPI validates and snapshots account-owned inputs, the Dramatiq worker calls OpenAI through one provider adapter, and FastAPI revalidates output before atomically completing a run. Server-owned prompts and provider-facing schemas live in the worker; API-side contracts remain the authoritative persistence and credit boundary.

**Tech Stack:** Python 3.13/3.14, FastAPI, Pydantic v2, Dramatiq, SQLite, official OpenAI Python SDK, pytest, Ruff.

## Global Constraints

- Lava.top, invoices, webhooks, checkout, release, tag, deployment, and visual redesign are excluded.
- No ordinary test performs a paid OpenAI request or requires an API key.
- All new behavior follows RED -> GREEN -> refactor; unchanged suites are not rerun.
- The production catalog remains `internal` until real RU/EN eval, cost, and price gates pass.
- Provider secrets, prompts, raw responses, account IDs, emails, and exception text never enter ordinary logs or public errors.
- The worker never fetches a user-supplied URL.

---

### Task 1: Pin and verify the official provider dependency

**Files:**
- Modify: `apps/worker/pyproject.toml`
- Modify: `requirements-dev.lock.txt`

**Interfaces:**
- Consumes: official OpenAI Python SDK documentation verified through Context7.
- Produces: a pinned `openai` dependency importable by `webdiag-worker`.

- [ ] **Step 1: Resolve the current stable OpenAI SDK release and dependency tree**

Run `python -m pip index versions openai` and record the selected exact version.

- [ ] **Step 2: Check the selected dependency set for known vulnerabilities**

Install into the project venv through the existing constraints workflow, run the available dependency audit, and stop if a relevant unresolved vulnerability is reported.

- [ ] **Step 3: Pin the dependency and regenerate the complete frozen lock**

Add `openai==2.54.0` to worker dependencies, update `requirements-dev.lock.txt` from the actual environment, and run `npm run verify:python-lock` once. Version 3.0.0 is intentionally not adopted in this batch because it is a new major release and the checked Context7 SDK material covers the stable 2.x interface used by this plan.

- [ ] **Step 4: Commit the dependency change**

Stage only the worker project and lock file. Commit `build(worker): pin OpenAI SDK`.

### Task 2: Add strict API tool contracts and grounded output validation

**Files:**
- Create: `apps/api/src/webdiag_api/ai/tool_contracts.py`
- Modify: `apps/api/src/webdiag_api/ai/catalog.py`
- Modify: `apps/api/src/webdiag_api/ai/service.py`
- Test: `apps/api/tests/test_ai_tool_contracts.py`

**Interfaces:**
- Produces: `validate_public_input(tool_id, value) -> dict[str, object]` and `validate_output(tool_id, input_value, output_value) -> dict[str, object]`.
- Produces: bounded Pydantic V1 input/output models for the four text tools.
- Consumes: catalog tool ID and contract version.

- [ ] **Step 1: Write failing tests for strict bounded inputs**

Cover RU/EN locale, boolean-as-integer rejection, unknown fields, byte/item bounds, canonical public page URLs, exact FAQ count, and the five Schema Studio types.

- [ ] **Step 2: Run only the new contract tests and observe the missing-contract RED**

Run `python -m pytest apps/api/tests/test_ai_tool_contracts.py -q`.

- [ ] **Step 3: Implement the minimal strict input models and dispatcher**

Use `ConfigDict(extra="forbid", strict=True)`, `Literal["ru", "en"]`, bounded strings/tuples, and existing URL canonicalization helpers where the contract contains a URL.

- [ ] **Step 4: Add failing grounded-output tests**

Assert that action-plan issue/URL references exist in input, Meta emits exactly three bounded variants with server-derived counts, Schema uses allowlisted keys and fact indexes, and FAQ evidence is an exact normalized substring.

- [ ] **Step 5: Implement output models and semantic validators**

Return normalized JSON-safe dictionaries only after structural and semantic validation. Raise one internal `AIToolContractError` without embedding provider content.

- [ ] **Step 6: Integrate validation at run creation and completion**

Validate public input before persistence and validate output before `SqliteAIStore.complete_run`. Map public input failures to stable `422 ai_invalid_tool_input`; map invalid worker output to stable internal failure without capturing credits.

- [ ] **Step 7: Run the targeted API contract tests once and commit**

Run the new contract tests plus affected account/internal AI API tests. Commit `feat(ai): enforce first tool contracts`.

### Task 3: Resolve owned saved audits into immutable AI snapshots

**Files:**
- Create: `apps/api/src/webdiag_api/ai/input_resolver.py`
- Modify: `apps/api/src/webdiag_api/ai/api.py`
- Modify: `apps/api/src/webdiag_api/ai/service.py`
- Test: `apps/api/tests/test_ai_audit_action_plan.py`

**Interfaces:**
- Produces: `AIInputResolver.resolve(user_id, tool_id, validated_input) -> dict[str, object]`.
- Consumes: `SqliteWorkspaceStore.get_audit(user_id, project_id, audit_id)` and digest-checked `StoredAudit.payload()`.

- [ ] **Step 1: Write failing ownership and snapshot tests**

Cover owned audit success, foreign project/audit 404, missing audit 404, corrupted persisted audit failure, no hidden audit execution, and a snapshot containing only bounded saved-audit facts.

- [ ] **Step 2: Observe the targeted RED**

Run `python -m pytest apps/api/tests/test_ai_audit_action_plan.py -q`.

- [ ] **Step 3: Implement the resolver and inject it into `AIService`**

Resolve only `ai_audit_action_plan`; pass the other three validated inputs unchanged. Replace public project/audit references with locale, origin, score, checks, and issues from the owned immutable payload before hashing and persistence.

- [ ] **Step 4: Run targeted resolver/API tests and commit**

Commit `feat(ai): snapshot owned audits for action plans`.

### Task 4: Add privacy-preserving provider safety identifiers

**Files:**
- Modify: `apps/api/src/webdiag_api/config.py`
- Modify: `apps/api/src/webdiag_api/ai/models.py`
- Modify: `apps/api/src/webdiag_api/ai/service.py`
- Modify: `apps/api/src/webdiag_api/ai/storage.py`
- Modify: `apps/worker/src/webdiag_worker/ai.py`
- Test: `apps/api/tests/test_config.py`
- Test: `apps/api/tests/test_internal_ai_api.py`
- Test: `apps/worker/tests/test_ai.py`

**Interfaces:**
- Produces: `derive_safety_identifier(secret: str, user_id: str) -> str`.
- Extends: `AIWorkerClaim` and `ProviderRequest` with opaque `safety_identifier`.

- [ ] **Step 1: Write failing configuration and privacy tests**

Require a distinct 32+ character production HMAC secret, stable identifiers for one account, different identifiers for different accounts, and absence of raw user ID/email in the worker claim.

- [ ] **Step 2: Observe the targeted RED**

Run only the named config/internal worker tests.

- [ ] **Step 3: Implement derivation and claim propagation**

Use HMAC-SHA-256 and base64url without padding. Do not persist or expose the secret. Keep the result bounded to 64 visible ASCII characters.

- [ ] **Step 4: Run targeted tests and commit**

Commit `feat(ai): add provider safety identifiers`.

### Task 5: Implement the OpenAI Responses provider

**Files:**
- Create: `apps/worker/src/webdiag_worker/openai_provider.py`
- Create: `apps/worker/src/webdiag_worker/tool_contracts.py`
- Test: `apps/worker/tests/test_openai_provider.py`

**Interfaces:**
- Produces: `OpenAIProvider.execute(request: ProviderRequest) -> ProviderResult`.
- Produces: `OpenAIProvider.from_env() -> OpenAIProvider` with required API key, hard timeout bounds, zero SDK retries, and allowlisted models.
- Consumes: `ProviderRequest` including validated input and opaque safety identifier.

- [ ] **Step 1: Write failing request-shape tests with an injected local HTTP client**

Assert `/v1/responses`, bearer handling inside the SDK, allowlisted model equality, `store=false`, strict JSON schema, bounded `max_output_tokens`, `safety_identifier`, server-owned prompt version, and no raw account identity.

- [ ] **Step 2: Observe the targeted RED**

Run `python -m pytest apps/worker/tests/test_openai_provider.py -q`.

- [ ] **Step 3: Implement provider-facing strict schemas and prompts**

Define one handler per tool ID. Delimit user data as serialized JSON, never concatenate it into system instructions, and reject unknown tool IDs, versions, or model policies before any HTTP request.

- [ ] **Step 4: Implement Responses execution and typed success mapping**

Use the SDK's Responses parse/Structured Outputs path with `store=False`, explicit output token limits, zero retries, and injected client support for tests. Return validated output, `_request_id`, and bounded usage counters.

- [ ] **Step 5: Add failing outcome-classification tests**

Cover refusal, incomplete output, 400/401/403/404/422, 408/409/429/5xx, timeout, connection error, malformed SDK response, and invalid structured output.

- [ ] **Step 6: Implement conservative known-safe versus unknown mapping**

Rejected deterministic 4xx responses are `KnownSafeProviderError`; ambiguous transport, retryable status, or malformed successful responses are `ProviderOutcomeUnknownError`. Do not include provider text in exception messages.

- [ ] **Step 7: Run targeted provider tests and commit**

Commit `feat(worker): add bounded OpenAI provider`.

### Task 6: Wire the actor without startup network access

**Files:**
- Modify: `apps/worker/src/webdiag_worker/actors.py`
- Test: `apps/worker/tests/test_actors.py`

**Interfaces:**
- Consumes: `OpenAIProvider.from_env()` and `run_one_ai_job(provider)`.
- Produces: real `run_pending_ai` execution only when configuration is present.

- [ ] **Step 1: Write failing lazy-configuration tests**

Importing the actor must not call OpenAI or require an API key. Invoking it without configuration must fail closed; invoking it with an injected provider must call the existing worker bridge exactly once.

- [ ] **Step 2: Observe the targeted RED**

Run only `apps/worker/tests/test_actors.py`.

- [ ] **Step 3: Implement lazy provider creation and actor execution**

No fake result and no silent exception swallowing are permitted.

- [ ] **Step 4: Run targeted actor/worker tests and commit**

Commit `feat(worker): execute configured AI provider`.

### Task 7: Add RU/EN semantic fixtures and close A12.1a verification

**Files:**
- Create: `apps/api/tests/fixtures/ai/a12_1a_contract_cases.json`
- Create: `apps/api/tests/test_ai_contract_fixtures.py`
- Modify: `docs/superpowers/specs/2026-08-12-webdiag-ai-first-five-design.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: public input/output contract validators for all four tools.
- Produces: deterministic RU/EN schema and grounding regression fixtures.

- [ ] **Step 1: Add representative RU/EN fixture tests**

Fixtures contain only synthetic test facts and assert invariants, not exact generated prose. Include prohibited invention and evidence/reference failures.

- [ ] **Step 2: Run the A12.1a targeted tests once**

Run only AI API, AI worker, configuration, and contract fixture tests.

- [ ] **Step 3: Run one affected Python package verification**

Run `npm run test:python`, `npm run lint:python`, `npm run verify:python-lock`, and `git diff --check` once after all A12.1a changes are stable.

- [ ] **Step 4: Record exact evidence and remaining activation blockers**

Document pass counts, selected SDK version, dependency-audit result, absence of paid calls, and that the four tools remain internal pending real smoke/cost/price approval.

- [ ] **Step 5: Commit documentation**

Commit `docs(ai): record A12.1a verification` and push the feature branch. Do not merge, release, deploy, or enable payments.
