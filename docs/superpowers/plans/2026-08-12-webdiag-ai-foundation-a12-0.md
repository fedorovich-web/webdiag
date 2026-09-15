# WebDiag AI foundation A12.0 implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the account-owned AI catalog, immutable credit ledger, run state machine, protected worker contracts, and closed-beta grant path without enabling any public AI tool or making paid provider calls.

**Architecture:** FastAPI remains the only writer to the account SQLite database. Account routes authenticate through the existing session service, while Dramatiq workers use a distinct bearer-protected internal API and hashed expiring lease tokens. The 15 real tool definitions are present but remain `internal` with no public execution price until their own evaluated delivery waves.

**Tech Stack:** Python 3.13, FastAPI 0.139.1, Pydantic 2, SQLite WAL transactions, Dramatiq 2.2.0, pytest 9.1.1, Ruff 0.15.21.

## Global constraints

- Do not add a new runtime dependency in A12.0.
- Do not call OpenAI or Lava.top from ordinary tests or application startup.
- Do not mark any AI tool `ready` in A12.0.
- Credits are non-expiring integers; floating-point values are rejected.
- Ledger corrections are append-only compensating entries; existing ledger rows are never updated or deleted.
- FastAPI is the only account-database writer; the worker has no SQLite path or account session.
- Every account object is selected with `user_id`; absent and foreign objects both produce `404`.
- Every private response and error uses `Cache-Control: no-store` and the existing `{detail:{code,message}}` envelope.
- Lease secrets and provider secrets are never stored or logged in plaintext.
- Execute one RED and one GREEN targeted run per behavior batch, one relevant Python suite before each task commit, and one full repository verification at final handoff. Do not rerun unchanged checks.
- The approved design is `docs/superpowers/specs/2026-08-12-webdiag-ai-tools-credits-design.md`.

## File structure

- `apps/api/src/webdiag_api/ai/catalog.py`: immutable 15-tool registry and readiness filtering.
- `apps/api/src/webdiag_api/ai/models.py`: strict public and internal Pydantic contracts.
- `apps/api/src/webdiag_api/ai/storage.py`: SQLite schema, ledger, runs, attempts, and lease transactions.
- `apps/api/src/webdiag_api/ai/service.py`: account authorization, catalog, credit, and run state rules.
- `apps/api/src/webdiag_api/ai/api.py`: account and internal HTTP routes.
- `apps/api/src/webdiag_api/ai/artifacts.py`: artifact storage protocol only; no binary tool is enabled.
- `apps/api/src/webdiag_api/ai/cli.py`: operator-only closed-beta credit grants.
- `apps/worker/src/webdiag_worker/ai.py`: bounded internal HTTP client and provider protocol.
- `apps/api/tests/test_ai_catalog.py`: catalog and model-policy tests.
- `apps/api/tests/test_ai_credits.py`: ledger, concurrency, reconciliation, and CLI tests.
- `apps/api/tests/test_account_ai_api.py`: session, ownership, errors, idempotency, and run API tests.
- `apps/api/tests/test_internal_ai_api.py`: internal authentication and lease-state tests.
- `apps/worker/tests/test_ai.py`: worker contract, redirect, size, and secret-boundary tests.

---

### Task 1: Strict catalog, contracts, and production configuration

**Files:**
- Create: `apps/api/src/webdiag_api/ai/__init__.py`
- Create: `apps/api/src/webdiag_api/ai/catalog.py`
- Create: `apps/api/src/webdiag_api/ai/models.py`
- Create: `apps/api/src/webdiag_api/ai/artifacts.py`
- Modify: `apps/api/src/webdiag_api/config.py`
- Test: `apps/api/tests/test_ai_catalog.py`
- Modify: `apps/api/tests/test_account_api.py`

**Interfaces:**
- Produces: `AIToolDefinition`, `AIToolState`, `AIToolCatalog`, `DEFAULT_AI_CATALOG`.
- Produces: `ArtifactStorage.put(run_id: str, data: bytes, media_type: str) -> StoredArtifact`, `read(object_key: str, max_bytes: int) -> bytes`, and `delete(object_key: str) -> None`; no implementation exposes a public object URL.
- Produces settings `ai_internal_token`, `ai_lease_seconds`, `ai_lease_renew_interval_seconds`, `ai_input_max_bytes`, and `ai_output_max_bytes`.

- [ ] **Step 1: Write catalog and settings tests that fail because the AI package and settings do not exist**

```python
def test_initial_catalog_contains_15_unique_internal_tools() -> None:
    assert len(DEFAULT_AI_CATALOG.all()) == 15
    assert len({tool.id for tool in DEFAULT_AI_CATALOG.all()}) == 15
    assert DEFAULT_AI_CATALOG.available() == ()
    assert all(tool.state is AIToolState.INTERNAL for tool in DEFAULT_AI_CATALOG.all())
    assert all(tool.credit_price is None for tool in DEFAULT_AI_CATALOG.all())

def test_production_requires_distinct_ai_internal_token() -> None:
    with pytest.raises(ValueError, match="production AI internal token is required"):
        Settings(
            environment="production",
            account_cookie_secure=True,
            monitoring_internal_token="m" * 32,
        )
    with pytest.raises(ValueError, match="must be distinct"):
        Settings(
            environment="production",
            account_cookie_secure=True,
            monitoring_internal_token="x" * 32,
            ai_internal_token="x" * 32,
        )
```

- [ ] **Step 2: Run the focused RED once**

Run: `node scripts/run-python.mjs -m pytest apps/api/tests/test_ai_catalog.py apps/api/tests/test_account_api.py -q`

Expected: collection or assertion failure naming the missing AI contracts/settings.

- [ ] **Step 3: Implement strict immutable definitions and validators**

```python
class AIToolState(StrEnum):
    INTERNAL = "internal"
    READY = "ready"
    DISABLED = "disabled"

@dataclass(frozen=True, slots=True)
class AIToolDefinition:
    id: str
    contract_version: str
    state: AIToolState
    credit_price: int | None
    model_policy: str

    def __post_init__(self) -> None:
        if self.state is AIToolState.READY and (
            self.credit_price is None or self.credit_price <= 0
        ):
            raise ValueError("ready AI tool requires a positive integer credit price")
```

Create exactly these IDs, each with `contract_version="v1"`, `state=INTERNAL`, and `credit_price=None`: `ai_audit_action_plan`, `ai_meta_serp_studio`, `ai_schema_studio`, `ai_faq_studio`, `ai_alt_text_studio`, `ai_content_brief`, `ai_content_optimizer`, `ai_search_intent_page_fit`, `ai_competitor_gap_report`, `ai_internal_linking_planner`, `ai_redirect_migration_mapper`, `ai_localization_workbench`, `ai_regex_workbench`, `ai_image_studio`, `ai_image_edit_studio`.

Use bounded settings: lease `60..3600` seconds default `900`; renewal interval `10..1200` default `300` and strictly less than lease; input/output `1024..2_000_000` bytes default `262_144`/`1_000_000`. Reuse the monitoring visible-ASCII, minimum-32-character, placeholder-rejection policy and require distinct monitoring/AI tokens in production.

- [ ] **Step 4: Run focused GREEN and relevant API suite once**

Run: `node scripts/run-python.mjs -m pytest apps/api/tests/test_ai_catalog.py apps/api/tests/test_account_api.py -q`

Run: `node scripts/run-python.mjs -m pytest apps/api/tests -q`

- [ ] **Step 5: Commit only Task 1 files**

```text
feat(ai): define internal tool catalog and contracts
```

### Task 2: Immutable credit ledger and operator grant CLI

**Files:**
- Create: `apps/api/src/webdiag_api/ai/storage.py`
- Create: `apps/api/src/webdiag_api/ai/service.py`
- Create: `apps/api/src/webdiag_api/ai/cli.py`
- Test: `apps/api/tests/test_ai_credits.py`

**Interfaces:**
- Produces: `SqliteAIStore.grant_credits`, `get_credit_account`, `list_ledger`, and `reconcile_credits`.
- Produces: `AIService.get_credits(user_id)` and `grant_beta_credits(user_id, quantity, reason, correlation_id)`.
- Consumes: existing `account_users(id)` in the shared account database.

- [ ] **Step 1: Write failing conservation, idempotency, concurrent-grant, and CLI tests**

```python
def test_duplicate_grant_correlation_is_idempotent(store, user_id) -> None:
    first = store.grant_credits(
        user_id=user_id, quantity=100, reason="closed beta", correlation_id="beta-001"
    )
    second = store.grant_credits(
        user_id=user_id, quantity=100, reason="closed beta", correlation_id="beta-001"
    )
    assert second == first
    assert store.get_credit_account(user_id=user_id).available == 100

def test_concurrent_unique_grants_are_not_lost(store, user_id) -> None:
    run_concurrently(
        lambda correlation: store.grant_credits(
            user_id=user_id, quantity=7, reason="test", correlation_id=correlation
        ),
        ("g-a", "g-b"),
    )
    assert store.get_credit_account(user_id=user_id).available == 14
    assert store.get_credit_account(user_id=user_id).reserved == 0

def test_reconciliation_detects_materialized_balance_tampering(store, user_id) -> None:
    store.grant_credits(user_id=user_id, quantity=25, reason="test", correlation_id="g-2")
    tamper_materialized_available(store, user_id, 26)
    with pytest.raises(CreditIntegrityError):
        store.reconcile_credits(user_id=user_id)
```

CLI tests execute `python -m webdiag_api.ai.cli grant-credits` with an explicit database path, user ID, matching `--confirm-user-id`, positive quantity, reason, and unique correlation ID. Missing confirmation, unknown accounts, non-integers, zero/negative quantities, or reused correlation with different content must fail without mutation.

- [ ] **Step 2: Run the focused RED once**

Run: `node scripts/run-python.mjs -m pytest apps/api/tests/test_ai_credits.py -q`

Expected: import failure for `webdiag_api.ai.storage`.

- [ ] **Step 3: Implement the schema and transactional ledger operations**

Create the full empty A12.0 schema: `credit_accounts`, append-only `credit_ledger`, `ai_runs`, `ai_run_attempts`, and `ai_artifacts`. This lets all foreign keys exist from the first schema version and avoids destructive SQLite table replacement. Apply `CHECK` constraints for operation/state, integer deltas, non-negative materialized totals, 64-character digests, non-empty reason/correlation, foreign keys, and indexes on account/time, run/state/created-time, attempt/run, and artifact/run. Task 2 exposes only grant/read/reconcile behavior; Tasks 3 and 4 add run and lease mutations over the already-created schema.

Use `BEGIN IMMEDIATE` for every balance mutation. Each grant inserts the ledger row and updates `credit_accounts` in the same transaction. Treat the exact same correlation and payload as idempotent; reject correlation reuse with different content.

Reserve/capture/release rows are schema-allowed here and become reachable only through the run transactions in Tasks 3 and 4. Their exact balance movements are:

```python
admin_grant = (available_delta=quantity, reserved_delta=0)
reserve = (available_delta=-quantity, reserved_delta=quantity)
capture = (available_delta=0, reserved_delta=-quantity)
release = (available_delta=quantity, reserved_delta=-quantity)
```

`reconcile_credits` sums both deltas from genesis and compares them with the materialized row. It raises `CreditIntegrityError` without repairing data. The CLI calls the same store method and prints only the ledger ID, target user ID, and resulting integer totals.

- [ ] **Step 4: Run focused GREEN and relevant API suite once**

Run: `node scripts/run-python.mjs -m pytest apps/api/tests/test_ai_credits.py -q`

Run: `node scripts/run-python.mjs -m pytest apps/api/tests -q`

- [ ] **Step 5: Commit only Task 2 files**

```text
feat(ai): add immutable credit ledger
```

### Task 3: Account-owned run state machine and account APIs

**Files:**
- Modify: `apps/api/src/webdiag_api/ai/models.py`
- Modify: `apps/api/src/webdiag_api/ai/storage.py`
- Modify: `apps/api/src/webdiag_api/ai/service.py`
- Create: `apps/api/src/webdiag_api/ai/api.py`
- Modify: `apps/api/src/webdiag_api/main.py`
- Test: `apps/api/tests/test_account_ai_api.py`

**Interfaces:**
- Produces account routes `GET /v1/account/ai/catalog`, `POST/GET /v1/account/ai/runs`, `GET/DELETE /v1/account/ai/runs/{run_id}`, `GET /v1/account/credits`, and `GET /v1/account/credits/ledger`.
- Produces `AIService.create_run`, `list_runs`, `get_run`, and `delete_run`.
- Produces `SqliteAIStore.reserve_credits`, `capture_credits`, and `release_credits`, callable only inside a store-owned run transaction.
- Consumes: `AIToolCatalog`, `SqliteAIStore`, and the existing session-cookie dependency.

- [ ] **Step 1: Write failing real HTTP tests**

Cover: unauthenticated `401`; no-store on success and failure; internal tools omitted from catalog; disabled/internal tool creation `503`; insufficient credits `402`; body validation; mandatory bounded `Idempotency-Key`; identical replay returns the original run and does not reserve twice; same key with different payload returns `409`; foreign run returns `404`; stable `(created_at DESC, id DESC)` cursor pagination; deletion makes content unavailable while ledger rows remain.

Inject this test-only ready definition rather than changing the production catalog:

```python
AIToolDefinition(
    id="test_text_tool",
    contract_version="v1",
    state=AIToolState.READY,
    credit_price=7,
    model_policy="test-only",
)
```

- [ ] **Step 2: Run the focused RED once**

Run: `node scripts/run-python.mjs -m pytest apps/api/tests/test_account_ai_api.py -q`

Expected: missing route or dependency failure.

- [ ] **Step 3: Implement strict models, schema, service, and routes**

`ai_runs` stores UUID ID, `user_id`, tool/contract/model/price snapshots, canonical JSON input, SHA-256, state constrained to `pending|running|succeeded|failed|provider_unknown|deleted`, timestamps, output JSON/SHA-256, stable public error code, and unique `(user_id, idempotency_key)`. Input serialization uses sorted compact UTF-8 JSON and rejects serialized payloads over `ai_input_max_bytes`.

Creation performs these actions in one `BEGIN IMMEDIATE`: validate ready tool, insert pending run, insert the `reserve` ledger movement, update materialized totals, commit. The reservation predicate proves sufficient available balance, so two concurrent requests cannot overdraw it. An existing idempotency key returns the original only when tool ID and input digest match. Account retrieval always filters both run ID and `user_id`. Deletion replaces content fields with `NULL`, writes `deleted_at`, preserves price/state audit metadata and ledger rows, and cannot resurrect a run.

Use strict Pydantic models with `extra="forbid"`; UUID path parameters; opaque cursor encoding over `(created_at,id)`; maximum page size `50`; and the existing error envelope. Return no internal model ID, lease information, raw provider error, or ledger correlation intended only for operators.

- [ ] **Step 4: Run focused GREEN and relevant API suite once**

Run: `node scripts/run-python.mjs -m pytest apps/api/tests/test_account_ai_api.py -q`

Run: `node scripts/run-python.mjs -m pytest apps/api/tests -q`

- [ ] **Step 5: Commit only Task 3 files**

```text
feat(ai): add account run and credit APIs
```

### Task 4: Protected lease-owned internal execution contracts

**Files:**
- Modify: `apps/api/src/webdiag_api/ai/models.py`
- Modify: `apps/api/src/webdiag_api/ai/storage.py`
- Modify: `apps/api/src/webdiag_api/ai/service.py`
- Modify: `apps/api/src/webdiag_api/ai/api.py`
- Test: `apps/api/tests/test_internal_ai_api.py`

**Interfaces:**
- Produces `POST /v1/internal/ai/runs/claim`, `/runs/{run_id}/renew`, `/mark-submitted`, `/complete`, and `/fail`.
- Produces `SqliteAIStore.claim_pending`, `renew_lease`, `complete_run`, `fail_run`, and `record_provider_unknown`.
- Lease bearer authenticates the worker; a separate one-time lease token proves ownership of a specific attempt.

- [ ] **Step 1: Write failing authentication, race, and transition tests**

Cover: missing/wrong internal bearer `401`; bearer compared without logging; claim ordering; only one concurrent claimant; only SHA-256 lease token stored; expired, replaced, or wrong token returns `409` without mutation; renewal extends only a current unexpired lease; completion validates output size and hash before capture; known-safe failure releases; ambiguous-provider failure records `provider_unknown` and releases; duplicate completion is idempotent only for the identical terminal payload; stale completion cannot capture credits.

```python
def test_stale_completion_cannot_capture_reserved_credits(store, seeded_pending_run) -> None:
    first = store.claim_pending(now=100)
    second = store.claim_pending(now=100 + AI_LEASE_SECONDS)
    with pytest.raises(AILeaseLostError):
        store.complete_run(
            run_id=first.run_id,
            lease_token=first.lease_token,
            output={"text": "stale"},
            now=100 + AI_LEASE_SECONDS + 1,
        )
    assert store.get_run_for_user(
        user_id=seeded_pending_run.user_id, run_id=seeded_pending_run.id
    ).state == "running"
    assert store.get_credit_account(user_id=seeded_pending_run.user_id).reserved == 7
```

- [ ] **Step 2: Run the focused RED once**

Run: `node scripts/run-python.mjs -m pytest apps/api/tests/test_internal_ai_api.py -q`

Expected: missing internal routes or lease methods.

- [ ] **Step 3: Implement atomic lease transitions**

Claim uses `BEGIN IMMEDIATE`, selects the oldest pending or safely reclaimable pre-submit attempt, creates an attempt row, generates at least 256 bits with `secrets.token_urlsafe(32)`, stores only `sha256(token)`, and returns plaintext once. Renewal, completion, and failure update with predicates over run ID, `running`, attempt number, token hash, and `lease_expires_at > now`.

Before provider submission, the worker calls a versioned `mark-submitted` transition. An expired lease may return to `pending` only if that attempt was never marked submitted. Any ambiguous outcome after submission becomes `provider_unknown` and is never auto-reclaimed. Completion validates canonical output JSON and its size, persists its SHA-256, changes state, and captures the exact price in one transaction. Known-safe failure and provider-unknown release the exact reservation in the same transaction.

Every internal model uses `contract_version="webdiag.ai.worker.v1"`, strict bounds, and stable codes. Internal responses also use `no-store`.

- [ ] **Step 4: Run focused GREEN and relevant API suite once**

Run: `node scripts/run-python.mjs -m pytest apps/api/tests/test_internal_ai_api.py -q`

Run: `node scripts/run-python.mjs -m pytest apps/api/tests -q`

- [ ] **Step 5: Commit only Task 4 files**

```text
feat(ai): enforce lease-owned worker execution
```

### Task 5: Dramatiq worker bridge with a fake provider boundary

**Files:**
- Create: `apps/worker/src/webdiag_worker/ai.py`
- Modify: `apps/worker/src/webdiag_worker/actors.py`
- Test: `apps/worker/tests/test_ai.py`
- Modify: `apps/worker/tests/test_actor.py`

**Interfaces:**
- Produces `AIProvider.execute(request: ProviderRequest) -> ProviderResult` protocol.
- Produces `run_one_ai_job(provider: AIProvider) -> bool` and actor `run_pending_ai` on queue `ai`.
- Consumes only the internal `webdiag.ai.worker.v1` HTTP contracts; it does not import API storage classes.

`ProviderRequest` contains only `run_id`, `tool_id`, `contract_version`, `model_policy`, and validated `input: dict[str, object]`. `ProviderResult` contains `output: dict[str, object]`, optional bounded `provider_request_id`, and integer usage counters. Neither type contains account email, session, balance, raw internal bearer, or database path.

- [ ] **Step 1: Write failing worker boundary tests**

Use an in-memory provider. Assert clean HTTP(S) origin validation, no redirects, required visible-ASCII bearer, bounded response reads, strict contract versions, mark-submitted before provider execution, periodic lease renewal during a blocking provider, completion on typed success, known-safe failure mapping, provider-unknown mapping after ambiguous transport, stop-on-renewal-failure, and absence of database-path/session environment access.

```python
class FakeProvider:
    def execute(self, request: ProviderRequest) -> ProviderResult:
        assert request.tool_id == "test_text_tool"
        return ProviderResult(output={"text": "grounded"}, provider_request_id="req_test")
```

- [ ] **Step 2: Run the focused RED once**

Run: `node scripts/run-python.mjs -m pytest apps/worker/tests/test_ai.py apps/worker/tests/test_actor.py -q`

Expected: import failure for `webdiag_worker.ai` or missing actor.

- [ ] **Step 3: Implement the bounded bridge without an OpenAI adapter**

Read `WEBDIAG_AI_API_INTERNAL_URL`, `WEBDIAG_AI_INTERNAL_TOKEN`, and bounded timeouts. Reuse a redirect-rejecting opener pattern. Accept no credentials, path, query, or fragment in the base origin. Keep response bodies at or below `1_000_000` bytes. Never print request input, output, lease token, bearer, or provider identifiers.

`run_one_ai_job` returns `False` when claim returns no work. For a claim it starts renewal at the configured interval, marks the attempt submitted immediately before `provider.execute`, validates `ProviderResult`, and calls one terminal endpoint. If renewal ownership is lost it does not submit a terminal result. A12.0 wires no real provider into the actor: the actor reports a controlled disabled configuration until the first provider adapter is delivered, so no fake AI result can appear.

- [ ] **Step 4: Run focused GREEN and full worker suite once**

Run: `node scripts/run-python.mjs -m pytest apps/worker/tests/test_ai.py apps/worker/tests/test_actor.py -q`

Run: `node scripts/run-python.mjs -m pytest apps/worker/tests -q`

- [ ] **Step 5: Commit only Task 5 files**

```text
feat(worker): add protected AI execution bridge
```

### Task 6: Documentation, integrity review, and final verification

**Files:**
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/INSTALLATION.md`
- Modify: `docs/VERIFICATION.md`
- Modify: `CHANGELOG.md`
- Review: all A12.0 files from Tasks 1-5

**Interfaces:**
- Documents the single-writer SQLite boundary, closed-beta CLI, secret separation, disabled real provider, and exact verification evidence.

- [ ] **Step 1: Run static security searches and inspect each match**

Run: `rg -n "ai_internal_token|lease_token|OPENAI|LAVA|print\(|logger|account_database_path" apps/api/src/webdiag_api/ai apps/worker/src/webdiag_worker/ai.py`

Confirm no plaintext secret persistence/logging, no worker database access, no public admin endpoint, no ready production tool, and no paid network call.

- [ ] **Step 2: Run targeted final A12.0 tests once**

Run: `node scripts/run-python.mjs -m pytest apps/api/tests/test_ai_catalog.py apps/api/tests/test_ai_credits.py apps/api/tests/test_account_ai_api.py apps/api/tests/test_internal_ai_api.py apps/worker/tests/test_ai.py -q`

- [ ] **Step 3: Run the complete repository verification once**

Run: `npm run verify:local`

Record exact results. Existing visual snapshot failures are reported accurately and are not changed or accepted as part of A12.0.

- [ ] **Step 4: Update documentation with observed facts only**

Document exact commands/results, `python -m webdiag_api.ai.cli grant-credits` usage, required environment variables, disabled-provider behavior, SQLite single-writer limitation, and that Lava.top plus all real OpenAI executions remain outside A12.0.

- [ ] **Step 5: Check the final diff and commit documentation**

Run: `git diff --check`

```text
docs(ai): document closed beta foundation
```

- [ ] **Step 6: Push the feature branch and update existing Draft PR #3**

Keep the PR target `recovery/a11.5-github-baseline`, append A12.0 architecture/security/database/test evidence and remaining A12.1-A13.0 risks, and do not mark ready, merge, tag, release, or deploy. Lava.top remains deferred until all 15 tools, RU/EN product polish, security/privacy/cost/load review, and production-domain verification are complete.
