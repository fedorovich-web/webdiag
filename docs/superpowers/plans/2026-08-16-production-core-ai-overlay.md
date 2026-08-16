# Production Core and AI Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the currently available non-AI product launchable without optional AI infrastructure while retaining a separately verifiable fail-closed AI overlay.

**Architecture:** Default production settings and Compose render a three-service web/API/scheduler core with AI runtime disabled. An additive overlay enables RabbitMQ, worker, S3, OpenRouter, and AI secrets. Separate privacy-safe preflights validate both rendered models.

**Tech Stack:** Pydantic Settings, Docker Compose v2, Node.js 24, GitHub Actions, pytest.

## Global Constraints

- AI remains publicly unavailable and operationally disabled by default.
- Core production must not receive RabbitMQ, OpenRouter, S3, or AI secrets.
- AI overlay must fail closed without every required secret and private artifact setting.
- Keep one API writer and current SQLite durability boundaries.
- Do not contact providers, start production services, deploy, or store real credentials.

---

### Task 1: Make AI production validation conditional

**Files:**
- Modify: `apps/api/tests/test_config.py`
- Modify: `apps/api/src/webdiag_api/config.py`
- Modify: `.env.example`

- [ ] Add failing tests proving production core accepts absent AI secrets when disabled and requires distinct AI/safety secrets when enabled.
- [ ] Run `apps/api/tests/test_config.py` once and confirm RED.
- [ ] Add `WEBDIAG_AI_RUNTIME_ENABLED=false` and conditional production validation.
- [ ] Run the config test file once and require GREEN.

### Task 2: Split and preflight the Compose topology

**Files:**
- Modify: `docker-compose.production.yml`
- Create: `docker-compose.production.ai.yml`
- Modify: `.env.production.example`
- Create: `.env.production.ai.example`
- Modify: `scripts/verify-production-compose.mjs`
- Create: `scripts/verify-production-ai-compose.mjs`
- Modify: `scripts/tests-workspace-integrity.test.mjs`
- Modify: `package.json`

- [ ] Add failing static and rendered-model tests for exact core services, absent AI settings, complete combined services, secret allowlists, S3 parity, and public-release policy.
- [ ] Run workspace-integrity and both preflights once; confirm expected RED without printing synthetic values.
- [ ] Implement the core reset and AI overlay, verifying actual Compose merge semantics with synthetic credentials before relying on them.
- [ ] Implement separate privacy-safe preflights and package scripts.
- [ ] Run workspace-integrity plus both preflights once and require GREEN.

### Task 3: Update CI and operator truth

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/INSTALLATION.md`
- Modify: `docs/RELEASE_POLICY.md`
- Modify: `docs/VERIFICATION.md`
- Modify: `CHANGELOG.md`

- [ ] Add CI checks for both synthetic core and AI-overlay renders while preserving existing image builds/smokes.
- [ ] Replace stale adapter/actor claims with the factual OpenRouter, actor, disabled-catalog, and activation-gate boundaries.
- [ ] Document exact core and optional AI invocations, external blockers, and that preflight is not deployment certification.
- [ ] Run affected workspace/config checks and both preflights once.
- [ ] Commit the subsystem as `feat(ops): split production core and ai overlay`.

### Task 4: Fresh release-candidate gate and Draft PR update

**Files:**
- Modify only for factual results: `docs/VERIFICATION.md`, `CHANGELOG.md`, Draft PR 3 body.

- [ ] Run one fresh relevant full frontend/backend verification, both production preflights, build/type/lint gates, and `git diff --check`.
- [ ] Inspect real desktop/mobile/dark screenshots for all changed account/public surfaces and run the Impeccable detector once on changed UI files.
- [ ] Review the complete branch diff for secrets, injection, IDOR, SSRF, XSS, stale claims, fixtures presented as real data, and unapproved provider/payment/deploy behavior.
- [ ] Create only small thematic commits, push `feature/backend-production-readiness`, and update Draft PR 3 with exact observed evidence and remaining external launch blockers.
- [ ] Do not merge, release, deploy, enable AI, or change `main`.
