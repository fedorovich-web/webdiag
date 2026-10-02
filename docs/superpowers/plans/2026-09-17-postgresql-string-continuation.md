# PostgreSQL Multiline String Continuation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve PostgreSQL-significant newline boundaries between adjacent ordinary, escape, bit, and hex string literal segments without preserving arbitrary SQL whitespace.

**Architecture:** Extend the internal SQL token metadata with a `lineBreakBefore` lexical fact populated by `tokenizeSql` while whitespace is discarded. `formatSql` will emit a newline only when that fact separates two continuation-compatible PostgreSQL single-quoted literal tokens in the `standard` dialect.

**Tech Stack:** TypeScript, Vitest, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-17-postgresql-string-continuation.md`

## Global Constraints

- Keep `SqlDialect = "standard" | "mysql"` unchanged.
- Do not add dependencies or UI changes.
- Do not preserve arbitrary SQL source whitespace.
- Do not fold literal values.
- Do not alter MySQL formatting behavior.
- Keep dollar-quoted, `U&''`, and comment-mediated continuation outside this batch.

---

### Task 1: Regression coverage

**Files:**
- Create: `apps/web/src/features/tools/query-code-workbench-sql-postgresql-string-continuation.test.ts`

**Interfaces:**
- Consumes: `formatSql(input: string, options?: FormatOptions): FormatResult`
- Produces: regression coverage for newline-sensitive PostgreSQL literal continuation.

- [ ] **Step 1: Write failing tests**

Cover ordinary LF, CRLF plus horizontal whitespace, `E`, `B`, and `X` continuation, plus same-line, unrelated-line-break, and MySQL controls.

- [ ] **Step 2: Verify RED**

Run the repository CI against the test-only commit. Expected: JavaScript tests fail because the formatter currently collapses the significant literal boundary.

- [ ] **Step 3: Commit test-only RED**

Commit message: `test(sql): cover PostgreSQL string continuation`.

### Task 2: Minimal lexical preservation

**Files:**
- Modify: `apps/web/src/features/tools/query-code-workbench.ts`

**Interfaces:**
- Consumes: existing internal `Token`, `tokenizeSql`, and `LineWriter`.
- Produces: optional `lineBreakBefore` token metadata and a narrow continuation predicate used by `formatSql`.

- [ ] **Step 1: Track discarded line breaks**

Add optional `lineBreakBefore` metadata to internal tokens. In `tokenizeSql`, set a pending flag when discarded whitespace contains `\n` or `\r`; attach that flag to the next emitted SQL token, then reset it.

- [ ] **Step 2: Recognize only supported continuation literals**

Add a small internal predicate that returns true for ordinary single-quoted strings and `E`, `B`, or `X` prefixed single-quoted strings. It must exclude dollar quotes, `U&''`, `N''`, identifiers, and non-string tokens.

- [ ] **Step 3: Preserve only the semantic boundary**

In `formatSql`, when `sqlDialect === "standard"`, the current token has `lineBreakBefore`, and both adjacent tokens are continuation-compatible strings, call `writer.newline(indent)` before writing the current token. Do not change other spacing rules.

- [ ] **Step 4: Verify GREEN**

Run full CI. Expected: regression tests pass and all existing JavaScript, lint, typecheck, build, browser, Python, image-smoke, and visual-QA jobs remain green.

- [ ] **Step 5: Commit implementation**

Commit message: `fix(sql): preserve PostgreSQL string continuation`.

### Task 3: Review and integration

**Files:**
- Review only: feature diff against exact base SHA `48593490b5c9d77e0666c25d9eb83fad5e4e7653`.

**Interfaces:**
- Consumes: green feature branch.
- Produces: reviewed PR merged into `feature/backend-production-readiness` with exact SHA verification.

- [ ] **Step 1: Review feature diff for scope and compatibility**

Confirm only the spec, plan, regression test, and localized SQL formatter changes are present.

- [ ] **Step 2: Create PR**

Base: `feature/backend-production-readiness`. Head: `feature/sql-postgresql-string-continuation`.

- [ ] **Step 3: Re-check exact head/base and mergeability**

Do not merge if the integration base moved or CI is not fully green.

- [ ] **Step 4: Merge with exact-head guard**

Use a merge commit and the exact reviewed feature head SHA.

- [ ] **Step 5: Verify post-merge state**

Confirm integration branch HEAD equals the returned merge SHA and post-merge CI succeeds on that exact SHA.
