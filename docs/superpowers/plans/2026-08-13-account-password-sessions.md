# Account Password and Session Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real, security-sensitive account settings for password rotation and revoking other sessions, with RU/EN workspace UI and no payment controls.

**Architecture:** Extend the existing account domain rather than creating a second identity subsystem. Password rotation verifies and rate-limits the current credential, validates the replacement with the existing scrypt policy, atomically replaces the password hash and all sessions with one fresh session, and returns that session through the existing secure-cookie path. Session controls expose only a bounded active-session count and an idempotent revoke-others action; no device history or invented metadata is added.

**Tech Stack:** FastAPI, Pydantic v2, SQLite WAL transactions, scrypt helpers, Next.js 16 App Router, React, TypeScript, Vitest, Pytest, Playwright.

## Global Constraints

- The authenticated user comes only from the hashed `webdiag_session` cookie; no client user ID is accepted.
- Passwords remain `SecretStr`, are never logged or returned, and use the existing 12..128 character validation and configured scrypt parameters.
- Wrong-current-password attempts use the existing persistent bounded login-attempt limiter and stable no-store error envelopes.
- Successful password rotation atomically invalidates every old session and creates exactly one fresh session; a concurrent stale rotation fails closed.
- Session responses contain only counts, never raw token hashes, IP addresses, user agents, or fabricated device names.
- All account GET/mutation responses are `Cache-Control: no-store`; production cookies remain Secure/HttpOnly/SameSite=Lax.
- RU and EN expose equivalent information architecture. Lava.top, billing, account deletion, and project lifecycle controls are absent from this patch.
- No new dependency is allowed.

---

### Task 1: Atomic password and session storage primitives

**Files:**
- Modify: `apps/api/src/webdiag_api/accounts/storage.py`
- Test: `apps/api/tests/test_account_api.py`
- Test: `apps/api/tests/test_sql_injection_security.py`

**Interfaces:**
- Produces: `SqliteAccountStore.active_session_count(user_id: str, now: int | None = None) -> int`
- Produces: `SqliteAccountStore.delete_other_sessions(user_id: str, current_token_hash: str, now: int | None = None) -> int`
- Produces: `SqliteAccountStore.rotate_password_and_session(user_id: str, expected_password_hash: str, password_hash: str, token_hash: str, expires_at: int) -> bool`

- [ ] **Step 1: Add failing storage tests**

Cover expired-session cleanup before counts, idempotent revoke-others preserving the current token, atomic password/session rotation, compare-and-swap failure under a stale password hash, and SQL metacharacters in credential inputs without schema/data corruption.

- [ ] **Step 2: Run the exact RED tests**

Run: `npm run python:run -- -m pytest apps/api/tests/test_account_api.py apps/api/tests/test_sql_injection_security.py -q -k "session_count or revoke_other or rotate_password or account_credential_injection"`

Expected: FAIL because the three store methods do not exist.

- [ ] **Step 3: Implement bounded transactional storage**

Use parameterized SQLite statements only. `rotate_password_and_session` must use `BEGIN IMMEDIATE`, update with `WHERE id = ? AND password_hash = ?`, check `rowcount == 1`, delete all sessions for the user, insert the fresh hashed token, and commit. On CAS failure, roll back without deleting sessions. Count/revoke methods delete expired rows in the same immediate transaction before returning a bounded integer.

- [ ] **Step 4: Run the same targeted tests GREEN**

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/webdiag_api/accounts/storage.py apps/api/tests/test_account_api.py apps/api/tests/test_sql_injection_security.py
git commit -m "feat(auth): add atomic credential session storage"
```

### Task 2: Versioned password and session API

**Files:**
- Modify: `apps/api/src/webdiag_api/accounts/models.py`
- Modify: `apps/api/src/webdiag_api/accounts/service.py`
- Modify: `apps/api/src/webdiag_api/accounts/api.py`
- Test: `apps/api/tests/test_account_api.py`

**Interfaces:**
- Consumes: the three Task 1 storage methods.
- Produces: `PasswordChangeRequest(current_password: SecretStr, new_password: SecretStr)`.
- Produces: `AccountSessionSummaryResponse` with contract `webdiag.account.sessions.v1` and `active_session_count: int`.
- Produces: `AccountSessionsRevokedResponse` with contract `webdiag.account.sessions_revoked.v1`, `active_session_count: Literal[1]`, and `revoked_session_count: int`.
- Produces endpoints: `POST /v1/account/password`, `GET /v1/account/sessions`, `POST /v1/account/sessions/revoke-others`.

- [ ] **Step 1: Add failing service/API tests**

Cover missing/expired cookie, exact request keys, wrong current password with persistent 429/Retry-After behavior, weak/same replacement password, successful rotation changing the cookie and invalidating all old tokens, concurrent stale rotation, session count, idempotent revoke-others, exact contracts, no-store headers, cookie flags, and no password/token material in responses.

- [ ] **Step 2: Run the exact RED tests**

Run: `npm run python:run -- -m pytest apps/api/tests/test_account_api.py -q -k "change_password or account_sessions"`

Expected: FAIL because models, service methods, and routes do not exist.

- [ ] **Step 3: Implement service behavior**

Resolve the current user and stored user from the current session token. Verify the current password with constant-time scrypt verification; record failures using `hash_login_identity(user.email)` and the existing attempt window/block settings. Validate the new password with `validate_password(..., email=user.email)`, reject a replacement matching the current password with `account_password_unchanged`, create one new session secret, and call the atomic Task 1 rotation. Map a CAS miss to `409 account_credentials_changed` without revealing hashes.

- [ ] **Step 4: Implement API routes and cookie rotation**

Reuse `_set_session_cookie` for successful password change. Every route uses `_http_error`, emits no-store, and resolves identity only from `SessionCookie`. `revoke-others` hashes the current token before passing it to storage and remains idempotent.

- [ ] **Step 5: Run targeted tests and Ruff**

Run: `npm run python:run -- -m pytest apps/api/tests/test_account_api.py -q -k "change_password or account_sessions"`

Run: `npm run lint:python`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/webdiag_api/accounts/models.py apps/api/src/webdiag_api/accounts/service.py apps/api/src/webdiag_api/accounts/api.py apps/api/tests/test_account_api.py
git commit -m "feat(auth): rotate passwords and revoke sessions"
```

### Task 3: Strict Next account lifecycle boundary

**Files:**
- Create: `apps/web/app/api/account/password/route.ts`
- Create: `apps/web/app/api/account/sessions/route.ts`
- Create: `apps/web/app/api/account/sessions/revoke-others/route.ts`
- Create: `apps/web/src/features/account/account-settings-contract.ts`
- Create: `apps/web/src/features/account/account-settings-contract.test.ts`
- Create: `apps/web/src/features/account/account-settings-client.ts`
- Create: `apps/web/src/features/account/account-settings-client.test.ts`
- Modify: `apps/web/src/features/account/account-messages.ts`

**Interfaces:**
- Produces strict exact-key parsers for `webdiag.account.sessions.v1` and `webdiag.account.sessions_revoked.v1`.
- Produces `getAccountSessions()`, `changeAccountPassword({currentPassword, newPassword})`, and `revokeOtherAccountSessions()` using same-origin credentials and no-store.

- [ ] **Step 1: Add failing contract/client tests**

Reject negative/fractional/unbounded counts, extra keys, wrong contract versions, malformed session responses, and successful responses with secret-like extra fields. Assert exact methods, paths, JSON bodies, same-origin credentials, and stable backend error preservation.

- [ ] **Step 2: Run RED tests**

Run: `npm --workspace @webdiag/web exec vitest run src/features/account/account-settings-contract.test.ts src/features/account/account-settings-client.test.ts --pool=forks --maxWorkers=1`

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement contracts, client, and transparent proxies**

Proxy only POST for password/revoke and GET for sessions using the existing account proxy helper. Never forward a caller-provided cookie/header other than the trusted session-cookie flow. Add localized stable messages for wrong current password, unchanged password, credential concurrency conflict, and rate limiting.

- [ ] **Step 4: Run the same two test files GREEN**

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/api/account/password apps/web/app/api/account/sessions apps/web/src/features/account/account-settings-contract.ts apps/web/src/features/account/account-settings-contract.test.ts apps/web/src/features/account/account-settings-client.ts apps/web/src/features/account/account-settings-client.test.ts apps/web/src/features/account/account-messages.ts
git commit -m "feat(account): add credential session API boundary"
```

### Task 4: RU/EN account settings workspace

**Files:**
- Create: `apps/web/app/(ru)/account/settings/page.tsx`
- Create: `apps/web/app/(en)/en/account/settings/page.tsx`
- Create: `apps/web/src/features/account/account-settings.tsx`
- Modify: `apps/web/src/features/account/account-workspace-shell-contract.ts`
- Modify: `apps/web/src/features/account/account-workspace-shell-contract.test.ts`
- Modify: `apps/web/src/features/account/account-workspace-shell.tsx`
- Modify: `apps/web/app/account.css`
- Modify: `apps/web/e2e/account.spec.ts`

**Interfaces:**
- Consumes: Task 3 lifecycle client.
- Produces: portfolio-level Account navigation and `/account/settings` plus `/en/account/settings` routes.

- [ ] **Step 1: Add failing navigation/presentation tests**

Assert a low-prominence Account nav entry, RU/EN route parity, visible identity fields, active-session count, current/new/confirm password labels with correct autocomplete values, mismatch prevention before network, duplicate-submit protection, successful password form clearing, and revoke-others success/error states.

- [ ] **Step 2: Run RED unit tests**

Run: `npm --workspace @webdiag/web exec vitest run src/features/account/account-settings-contract.test.ts src/features/account/account-settings-client.test.ts src/features/account/account-workspace-shell-contract.test.ts --pool=forks --maxWorkers=1`

Expected: FAIL on the missing Account navigation item and settings surface.

- [ ] **Step 3: Implement the settings surface**

Render persisted email/display name/account creation date, active session count, password rotation, and revoke-others only. Keep labels visible, use `autocomplete=current-password/new-password`, require local confirmation equality, announce mutation results with status/alert semantics, preserve only the current password after a server failure, and clear every password field after success. Do not add payment, delete-account, fake device, or project controls.

- [ ] **Step 4: Add a single focused browser scenario**

Mock exact lifecycle contracts and assert navigation, mismatch no-request behavior, successful rotation, fresh session count `1`, idempotent revoke-others, mobile no-overflow, and absence of Lava/payment/deletion controls.

- [ ] **Step 5: Run affected web gate once**

Run: `npm --workspace @webdiag/web run test`

Run: `npm --workspace @webdiag/web run lint`

Run: `npm --workspace @webdiag/web run build`

Run: `npm --workspace @webdiag/web run test:browser -- account.spec.ts --grep "account settings"`

Expected: all pass; the existing unrelated `site-brand.tsx` image warning may remain, but no new warning/error is allowed.

- [ ] **Step 6: Commit**

```bash
git add apps/web/app apps/web/src/features/account apps/web/e2e/account.spec.ts
git commit -m "feat(account): add secure account settings"
```

### Task 5: Patch verification and review

**Files:**
- Modify only files required by concrete review findings.

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: reviewed account lifecycle patch ready for later repository-wide verification.

- [ ] **Step 1: Run backend lifecycle and injection tests once**

Run: `npm run python:run -- -m pytest apps/api/tests/test_account_api.py apps/api/tests/test_sql_injection_security.py -q`

Run: `npm run lint:python`

Run: `npm run verify:python-lock`

- [ ] **Step 2: Run frontend lifecycle tests once**

Run: `npm --workspace @webdiag/web exec vitest run src/features/account/account-settings-contract.test.ts src/features/account/account-settings-client.test.ts src/features/account/account-workspace-shell-contract.test.ts --pool=forks --maxWorkers=1`

Run: `npm --workspace @webdiag/web run test:browser -- account.spec.ts --grep "account settings"`

- [ ] **Step 3: Review the exact commit range**

Review ownership, brute-force resistance, scrypt use, atomic session rotation, cookie flags, no-store envelopes, injection boundaries, secret leakage, strict TypeScript contracts, RU/EN parity, accessibility, and mobile overflow. Fix only concrete Critical/Important findings and rerun only affected checks.

- [ ] **Step 4: Confirm scope hygiene**

Run: `git diff --check`

Confirm no generated files, test results, secrets, visible code comments, billing/Lava controls, project deletion, or unrelated design changes are staged.
