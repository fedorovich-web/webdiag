# WebDiag Backend Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close confirmed security, integrity, concurrency, release-gate, and dependency defects without changing visual design or inventing product capabilities.

**Architecture:** Preserve the recovered FastAPI/SQLite contracts. Add narrowly scoped canonicalization, lease ownership, additive report integrity migration, and a registry-derived release gate; keep frontend changes limited to dependency security and API integration.

**Tech Stack:** Python 3.14, FastAPI, Pydantic, SQLite WAL, Dramatiq, Node 24, Next.js, Vitest, Playwright.

## Global Constraints

- Work only on `feature/backend-production-readiness` from recovery SHA `3bb8b36`.
- Do not modify `main`, merge, release, tag, deploy, or rebaseline visual snapshots.
- Do not add fake monitoring, notification, incident, AI, or historical data.
- Use red-green-refactor for every behavior change and explicit-path staging for commits.

---

### Task 1: Registry-derived release gate

**Files:** `scripts/verify-release.mjs`, `scripts/tests-release-gate.test.mjs`, `package.json`, `README.md`, `docs/PROJECT_RULES.md`, `docs/RELEASE_POLICY.md`, `docs/ARCHITECTURE.md`.

- [ ] Add a failing behavioral test proving a 125-entry all-ready registry is accepted and duplicate/not-ready entries are rejected.
- [ ] Run the targeted Node test and observe the expected failure.
- [ ] Extract a pure registry gate and remove the 110 hardcode from executable policy.
- [ ] Update current policy prose; retain historical changelog facts.
- [ ] Run workspace/registry/release targeted verification and commit `fix(release): derive gate from registry`.

### Task 2: Canonical public origins

**Files:** `apps/api/tests/test_url_policy.py`, `apps/api/tests/test_account_workspace_api.py`, `apps/api/src/webdiag_api/security/url_policy.py`.

- [ ] Add failing tests for scheme-default ports, IDNA equivalence, invalid host labels, and public IPv6 authority formatting.
- [ ] Run targeted tests and observe canonicalization/duplicate failures.
- [ ] Implement one canonical authority path used by audits and projects.
- [ ] Run URL/workspace tests and commit `fix(security): canonicalize public origins`.

### Task 3: Lease-owned monitoring execution

**Files:** `apps/api/tests/test_account_monitoring_api.py`, `apps/api/src/webdiag_api/accounts/monitoring_storage.py`, `apps/api/src/webdiag_api/accounts/monitoring_service.py`, `apps/api/src/webdiag_api/accounts/monitoring_models.py`.

- [ ] Add failing storage/service tests proving stale completion is rejected, manual overlap is rejected, pause invalidates completion, and invalid IANA names fail validation.
- [ ] Run targeted tests and observe failures for the intended branches.
- [ ] Add atomic manual claim and lease-token-checked completion; keep lease tokens private.
- [ ] Preserve disabled state during completion and validate available IANA zones.
- [ ] Run monitoring/worker tests and commit `fix(monitoring): bind runs to claim leases`.

### Task 4: Persisted report artifact integrity

**Files:** `apps/api/tests/test_account_reports_api.py`, `apps/api/src/webdiag_api/accounts/report_storage.py`, `apps/api/src/webdiag_api/accounts/report_artifact.py`.

- [ ] Add failing tests for hash persistence, legacy-row backfill, and tampered snapshot rejection.
- [ ] Run targeted tests and observe missing-column/integrity failures.
- [ ] Add an additive column migration and deterministic SHA-256 verification on snapshot materialization.
- [ ] Run report tests and commit `fix(reports): verify persisted artifact hashes`.

### Task 5: Existing dependency advisories

**Files:** `apps/web/package.json`, `package.json`, `package-lock.json`.

- [ ] Record the advisory-resolver versions for Next.js and affected overrides.
- [ ] Update only existing dependencies and regenerate the lockfile.
- [ ] Run `npm audit`, web tests, lint, typecheck, and build.
- [ ] Commit `fix(deps): update vulnerable web runtime`.

### Task 6: Final verification and publication

**Files:** `docs/VERIFICATION.md` and the intentional code/docs diff only.

- [ ] Run targeted backend/security tests once after the final code batch.
- [ ] Run fresh `npm run verify:local`, `npm audit`, `docker compose config`, and `git diff --check`.
- [ ] Document exact results and remaining public-audit durability risk.
- [ ] Review/stage explicit files, make the final documentation commit, and push the feature branch.
- [ ] Open a Draft PR into `recovery/a11.5-github-baseline` with the required baseline, architecture, security, database, auth/session, monitoring, reports, tests, verification, risks, and deferred-design sections.
