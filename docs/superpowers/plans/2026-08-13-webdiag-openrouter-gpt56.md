# WebDiag OpenRouter GPT-5.6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the OpenAI SDK provider with a no-retry, privacy-constrained OpenRouter adapter pinned to `openai/gpt-5.6-luna`, then add explicit SQL-injection integration evidence.

**Architecture:** The Dramatiq worker owns a focused HTTPX adapter for one fixed OpenRouter Chat Completions endpoint. FastAPI remains the only SQLite writer and revalidates every provider output; no model selection or provider detail crosses an account API boundary.

**Tech Stack:** Python 3.13/3.14, HTTPX 0.28.1, Pydantic 2.13.4, FastAPI 0.139.1, SQLite, pytest 9.1.1, Ruff 0.15.21.

## Global Constraints

- The only executable model is `openai/gpt-5.6-luna`; image generation/editing remains disabled with model policy `none`.
- The only endpoint is `https://openrouter.ai/api/v1/chat/completions`.
- No automatic retry, fallback, provider/model input, referer, secret logging, or real provider call in tests.
- Requests require ZDR, denied data collection, required structured-output parameters, and disabled fallbacks.
- No handwritten HTML, JavaScript, or backend comments are added.
- Public credit prices and tool activation remain deferred.

---

### Task 1: Replace provider transport and model policies

**Files:**
- Rename: `apps/worker/tests/test_openai_provider.py` to `apps/worker/tests/test_openrouter_provider.py`
- Rename: `apps/worker/src/webdiag_worker/openai_provider.py` to `apps/worker/src/webdiag_worker/openrouter_provider.py`
- Modify: `apps/worker/src/webdiag_worker/actors.py`
- Modify: `apps/worker/tests/test_actor.py`
- Modify: `apps/api/src/webdiag_api/ai/catalog.py`
- Modify: `apps/api/tests/test_ai_catalog.py`

**Interfaces:**
- Produces: `OpenRouterProvider(client: httpx.Client)` and `OpenRouterProvider.from_env()`.
- Consumes: `ProviderRequest`; returns `ProviderResult`.

- [ ] **Step 1: Write the failing transport and catalog tests**

```python
def test_provider_sends_private_strict_openrouter_request() -> None:
    result = _provider(handler).execute(_request())
    sent = json.loads(requests[0].content)
    assert str(requests[0].url) == "https://openrouter.ai/api/v1/chat/completions"
    assert sent["model"] == "openai/gpt-5.6-luna"
    assert sent["provider"] == {
        "allow_fallbacks": False,
        "data_collection": "deny",
        "require_parameters": True,
        "zdr": True,
    }
    assert sent["response_format"]["json_schema"]["strict"] is True
    assert result.provider_request_id == "gen_test"
```

- [ ] **Step 2: Run the targeted RED**

Run: `node scripts/run-python.mjs -m pytest apps/worker/tests/test_openrouter_provider.py apps/worker/tests/test_actor.py apps/api/tests/test_ai_catalog.py -q`

Expected: FAIL because `OpenRouterProvider` and the OpenRouter model policy do not exist.

- [ ] **Step 3: Implement the minimal adapter**

```python
class OpenRouterProvider:
    def __init__(self, client: httpx.Client) -> None:
        self._client = client

    def execute(self, request: ProviderRequest) -> ProviderResult:
        response = self._client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json=_request_body(request),
        )
        return _provider_result(response, request)
```

Use one `_ToolPolicy` model value, `openai/gpt-5.6-luna`, for all four implemented tools. Keep `ai_image_studio` and `ai_image_edit_studio` disabled with model policy `none`. Parse exactly one `choices[0].message.content`, `usage.prompt_tokens`, `usage.completion_tokens`, and the body `id`. Map 400/401/402/403/404/413/422 to `KnownSafeProviderError`; map all ambiguous transport/status/200-shape failures to `ProviderOutcomeUnknownError`.

- [ ] **Step 4: Run the targeted GREEN**

Run: `node scripts/run-python.mjs -m pytest apps/worker/tests/test_openrouter_provider.py apps/worker/tests/test_actor.py apps/api/tests/test_ai_catalog.py -q`

Expected: PASS.

- [ ] **Step 5: Commit**

```text
git add apps/worker/src/webdiag_worker/openrouter_provider.py apps/worker/src/webdiag_worker/actors.py apps/worker/tests/test_openrouter_provider.py apps/worker/tests/test_actor.py apps/api/src/webdiag_api/ai/catalog.py apps/api/tests/test_ai_catalog.py
git commit -m "feat(ai): route fixed GPT-5.6 through OpenRouter"
```

### Task 2: Remove the OpenAI SDK dependency

**Files:**
- Modify: `apps/worker/pyproject.toml`
- Modify: `requirements-dev.lock.txt`
- Test: `scripts/tests-python-lock.test.mjs`

**Interfaces:**
- Produces: an installed environment and lock with no `openai` runtime package.

- [ ] **Step 1: Prove the source no longer imports OpenAI**

Run: `rg -n "from openai|import openai|OpenAIProvider|WEBDIAG_OPENAI" apps/worker apps/api`

Expected after Task 1: no production matches.

- [ ] **Step 2: Remove `openai==2.54.0` and reinstall through the project constraint**

Run: `npm run python:install`

Freeze the exact installed non-editable packages into `requirements-dev.lock.txt`; remove only packages no longer installed.

- [ ] **Step 3: Verify the lock once**

Run: `npm run verify:python-lock`

Expected: PASS with the installed package count matching the lock.

- [ ] **Step 4: Commit**

```text
git add apps/worker/pyproject.toml requirements-dev.lock.txt
git commit -m "build(ai): remove direct OpenAI SDK"
```

### Task 3: Add explicit SQL-injection integration evidence

**Files:**
- Create: `apps/api/tests/test_sql_injection_security.py`

**Interfaces:**
- Consumes: the real FastAPI app and SQLite repositories.
- Produces: behavior-level proof that SQL metacharacters remain bound data.

- [ ] **Step 1: Add account and owned-resource payload tests**

```python
SQL_PAYLOAD = "x'); DROP TABLE account_users; --"

def test_sql_metacharacters_remain_bound_project_data(tmp_path: Path) -> None:
    accounts = SqliteAccountStore(str(tmp_path / "accounts.sqlite3"))
    owner = accounts.create_user(
        email="owner@example.com",
        display_name="Owner",
        password_hash="scrypt$test",
    )
    store = SqliteWorkspaceStore(str(tmp_path / "accounts.sqlite3"))
    project = store.create_project(
        user_id=owner.id,
        name=SQL_PAYLOAD,
        origin="https://example.com",
    )
    stored = store.get_project(user_id=owner.id, project_id=project.id)
    assert stored is not None and stored.name == SQL_PAYLOAD
    assert accounts.get_user_by_email("owner@example.com") is not None
```

Also cover login email, AI pagination cursor/run ID, and report/share token payloads using literal malicious strings. Assert stable 4xx envelopes, no 500 response, intact sessions, and intact ownership.

- [ ] **Step 2: Run the targeted security test**

Run: `node scripts/run-python.mjs -m pytest apps/api/tests/test_sql_injection_security.py -q`

Expected: PASS if all current SQL sites correctly bind parameters; any failure becomes a regression-first defect before changing production code.

- [ ] **Step 3: Commit**

```text
git add apps/api/tests/test_sql_injection_security.py
git commit -m "test(security): exercise SQL injection payloads"
```

### Task 4: Targeted aggregate and documentation

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `docs/superpowers/specs/2026-08-13-webdiag-openrouter-gpt56-design.md`

**Interfaces:**
- Produces: fresh focused verification evidence before A12.1b resumes.

- [ ] **Step 1: Run the affected aggregate once**

Run: `node scripts/run-python.mjs -m pytest apps/worker/tests/test_openrouter_provider.py apps/worker/tests/test_ai.py apps/worker/tests/test_actor.py apps/api/tests/test_ai_catalog.py apps/api/tests/test_ai_tool_contracts.py apps/api/tests/test_internal_ai_api.py apps/api/tests/test_sql_injection_security.py -q`

- [ ] **Step 2: Run static checks once**

Run: `npm run lint:python`

Run: `npm run verify:python-lock`

Run: `git diff --check`

- [ ] **Step 3: Record exact results and commit**

```text
git add CHANGELOG.md docs/superpowers/specs/2026-08-13-webdiag-openrouter-gpt56-design.md docs/superpowers/plans/2026-08-13-webdiag-openrouter-gpt56.md docs/superpowers/specs/2026-08-13-webdiag-ai-alt-text-design.md docs/superpowers/plans/2026-08-13-webdiag-ai-alt-text-a12-1b.md
git commit -m "docs(ai): record OpenRouter verification"
```

Push the feature branch and update Draft PR #3. Do not merge, release, tag, deploy, or mark the PR ready.
