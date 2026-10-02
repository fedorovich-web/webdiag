# PostgreSQL Numeric and Parameter Token Boundary Implementation Plan

**Goal:** Prevent the SQL formatter from converting PostgreSQL lexical junk after numeric literals or positional parameters into separate valid tokens.

**Architecture:** Keep the existing tokenizer and numeric regex. Add small standard-dialect boundary predicates around matched numeric and `$N` placeholder tokens, reusing the existing PostgreSQL identifier-start helper.

**Tech Stack:** TypeScript, Vitest, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-17-postgresql-token-boundaries.md`

## Global Constraints

- Standard/PostgreSQL-like mode only.
- No parser or semantic validator.
- No number-tokenizer rewrite.
- No MySQL behavior changes.
- Reuse existing Unicode identifier boundary logic.

### Task 1: Lock the boundary contract with failing tests

**Create:** `apps/web/src/features/tools/query-code-workbench-sql-postgresql-token-boundary.test.ts`

- Add invalid integer/numeric/real tails: `123abc`, `1.5value`, `1e2foo`.
- Add malformed/incomplete forms: `1e`, `1e+`, `0x`, `0x1g`, `0b102`, `0o78`.
- Add positional parameter junk: `$1foo`, `$2_name`.
- Add a Unicode identifier boundary case.
- Add valid controls for separated aliases, casts, complete exponent/radix literals, and MySQL unchanged behavior.
- Commit tests only and verify RED in CI.

### Task 2: Implement minimal lexical boundary checks

**Modify:** `apps/web/src/features/tools/query-code-workbench.ts`

- After a numeric match in standard mode, reject an attached PostgreSQL identifier start.
- For radix-prefixed input, also reject an immediately attached decimal digit that the selected radix cannot consume.
- The identifier-start rule naturally catches incomplete exponent markers (`e`/`E`) and malformed radix prefixes (`x`/`o`/`b`).
- After a `$N` placeholder match in standard mode, reject an attached PostgreSQL identifier start.
- Keep MySQL path unchanged.
- Run full CI and verify GREEN.

### Task 3: Review and integrate

- Compare the complete branch against the exact integration base.
- Verify no scope creep beyond docs, focused tests, and local boundary checks.
- Open PR to `feature/backend-production-readiness`.
- Require exact-head GREEN CI and unchanged integration base.
- Merge with `expected_head_sha`.
- Verify exact integration merge SHA and post-merge CI.
