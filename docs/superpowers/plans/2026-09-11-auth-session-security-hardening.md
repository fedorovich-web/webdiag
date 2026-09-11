# Auth Session Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep WebDiag users signed in with a secure 30-day server-side session and add regression coverage for common auth and SQL-injection attacks.

**Architecture:** WebDiag keeps opaque random session tokens in an HttpOnly cookie while PostgreSQL stores only SHA-256 token digests. Session validity is enforced server-side and password reset/change revokes all outstanding sessions. Auth queries remain SQLAlchemy ORM/bind-expression only; security tests send hostile email/token payloads and prove they are treated as data.

**Tech Stack:** FastAPI, SQLAlchemy async ORM, PostgreSQL, Redis rate limiting, Pydantic Settings, pwdlib/Argon2, pytest.

**Spec:** Current draft PR #4 plus user requirement from 2026-09-11: persistent cookies/sessions, no short forced logout, security regression checks, SQL-injection resistance.

## Global Constraints

- Work only on `feat/auth-email-resend`; do not modify `main`.
- Production session cookie: HttpOnly, Secure, SameSite=Lax, Path=/, 30-day Max-Age.
- Persist only session-token digests in PostgreSQL; never raw session tokens.
- Reset/change password revokes every active session.
- All database lookups use SQLAlchemy expressions/bound parameters; no string-built SQL.
- Production auth remains fail-closed when secure cookies or rate limiting are disabled.
- Verification must run on the exact final PR-head SHA.

---

### Task 1: Cookie-backed auth API

**Files:**
- Create: `apps/api/src/webdiag_api/auth/api.py`
- Create: `apps/api/src/webdiag_api/auth/dependencies.py`
- Modify: `apps/api/src/webdiag_api/main.py`
- Test: `apps/api/tests/test_auth_api.py`

**Interfaces:**
- Consumes: `AuthService.login`, `AuthService.authenticate_session`, `AuthService.logout`, password reset/change methods.
- Produces: `/v1/auth/login`, `/v1/auth/logout`, `/v1/auth/me`, verification/reset endpoints and a `webdiag_session` HttpOnly cookie.

- [ ] Write failing API tests for cookie flags, login persistence, logout invalidation, and 30-day Max-Age.
- [ ] Run focused auth API tests and confirm RED.
- [ ] Implement minimal API/dependency code using the existing opaque session service.
- [ ] Run focused tests until GREEN.
- [ ] Commit the independently working auth API slice.

### Task 2: Security regression suite

**Files:**
- Create: `apps/api/tests/test_auth_security.py`
- Modify only if a failing test exposes a real defect in auth/session code.

**Interfaces:**
- Consumes: public auth API and persisted SQLAlchemy models.
- Produces: executable regression coverage for SQL injection, token replay, session revocation, malformed cookies, and account-enumeration resistance.

- [ ] Add hostile payload tests such as `' OR 1=1 --`, quoted Unicode/input-boundary values, replayed one-time tokens, stale session cookies, and unknown-account reset requests.
- [ ] Run focused security tests and record expected failures only for genuine missing behavior.
- [ ] Fix defects with ORM/bound-parameter code; never sanitize SQL syntax manually.
- [ ] Run security tests and complete API tests to GREEN.
- [ ] Commit security regression coverage.

### Task 3: Final exact-SHA verification

**Files:**
- Modify only CI configuration if an existing quality gate does not run the new tests.

**Interfaces:**
- Consumes: final PR head.
- Produces: evidence that API tests, Ruff, frontend checks and auth security regressions all pass on one SHA.

- [ ] Fetch the current PR head SHA.
- [ ] Run/observe the full PR quality gate for that exact SHA.
- [ ] Inspect failures rather than weakening tests or linters.
- [ ] Re-run after any fix and verify the final head is unchanged from the verified SHA.
