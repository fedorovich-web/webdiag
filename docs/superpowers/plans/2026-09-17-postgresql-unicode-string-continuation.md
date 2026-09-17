# PostgreSQL Unicode String Continuation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve PostgreSQL newline continuation semantics for `U&'...'` Unicode escape strings without changing other dialect behavior.

**Architecture:** Extend the existing lexical continuation predicate used by the SQL tokenizer/formatter. Keep tokenization and formatting architecture unchanged; regression coverage defines the exact supported boundary.

**Tech Stack:** TypeScript, Vitest, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-17-postgresql-unicode-string-continuation.md`

## Global Constraints

- No new SQL dialect option.
- No SQL parser or semantic validator.
- No changes to Unicode escape decoding or validation.
- No changes to existing MySQL string behavior.
- No comment-mediated continuation handling in this batch.
- Keep the production change local to the existing continuation predicate unless tests prove a broader change is required.

---

### Task 1: Lock the Unicode continuation contract with failing tests

**Files:**
- Create: `apps/web/src/features/tools/query-code-workbench-sql-postgresql-unicode-string-continuation.test.ts`

**Interfaces:**
- Consumes: `formatSql(input: string, options?: FormatOptions): FormatResult`
- Produces: regression coverage for Unicode escape string continuation and negative controls.

- [ ] **Step 1: Write the failing regression tests**

Cover ordinary LF continuation, lowercase `u&`, CRLF with horizontal whitespace, `UESCAPE`, same-line adjacency, Unicode quoted identifier control, and MySQL control.

- [ ] **Step 2: Run the focused test and verify RED**

Run through repository CI for the test-only commit. Expected: the Unicode string continuation cases fail because the formatter collapses the source newline; negative controls remain green.

- [ ] **Step 3: Commit the test-only change**

Commit message: `test(sql): cover PostgreSQL Unicode string continuation`.

### Task 2: Implement the minimal lexical fix

**Files:**
- Modify: `apps/web/src/features/tools/query-code-workbench.ts`
- Test: `apps/web/src/features/tools/query-code-workbench-sql-postgresql-unicode-string-continuation.test.ts`

**Interfaces:**
- Consumes: `isPostgresqlContinuationString(token: Token | null): boolean`
- Produces: the same predicate, extended only to recognize `U&'...'` / `u&'...'` string tokens.

- [ ] **Step 1: Extend the predicate minimally**

Change the recognition expression so the function returns true for existing ordinary/E/B/X strings and for `U&'...'` / `u&'...'`, while continuing to exclude `U&"..."` identifiers.

- [ ] **Step 2: Run focused tests and verify GREEN**

Expected: the new regression suite passes.

- [ ] **Step 3: Run full repository CI**

Expected: JS tests, lint, typecheck, production build, browser tests, Python tests/lint/locks, and homepage visual QA all pass.

- [ ] **Step 4: Commit the production fix**

Commit message: `fix(sql): preserve PostgreSQL Unicode string continuation`.

### Task 3: Review and integrate

**Files:**
- Review all changes against the spec; no new files expected beyond Task 1 and documentation.

**Interfaces:**
- Produces: merge-ready PR into `feature/backend-production-readiness`.

- [ ] **Step 1: Self-review the branch diff**

Verify no scope creep, no MySQL behavior change, and no accidental identifier continuation.

- [ ] **Step 2: Open a PR**

Base: `feature/backend-production-readiness`.

- [ ] **Step 3: Require exact-head green CI before merge**

Verify the PR head SHA and all required jobs are successful.

- [ ] **Step 4: Merge using the expected head SHA**

Use a merge commit and reject stale-head integration.

- [ ] **Step 5: Verify post-merge integration**

Confirm the exact merge SHA is the integration branch HEAD and the push-triggered CI for that SHA is fully green.
