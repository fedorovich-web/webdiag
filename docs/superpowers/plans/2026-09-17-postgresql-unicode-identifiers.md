# PostgreSQL Unicode Identifiers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the conservative SQL tokenizer preserve PostgreSQL Unicode bare identifiers and Unicode dollar-quote tags in standard mode while keeping MySQL behavior unchanged.

**Architecture:** Keep the change inside `query-code-workbench.ts`. Add a tiny code-point-aware identifier scanner using Unicode letter properties, reuse it for PostgreSQL bare identifiers and tagged dollar-quote delimiters, and leave all formatter structure and dialect interfaces untouched. Prove the behavior through a dedicated regression file before production code is changed.

**Tech Stack:** TypeScript, Vitest, npm workspaces, GitHub Actions on Node.js 24.

**Spec:** `docs/superpowers/specs/2026-09-17-postgresql-unicode-identifiers.md`

## Global Constraints

- Base branch: `feature/backend-production-readiness` at `6cb10c13c4c920146401c5dcab6fb46b870c9aa7`.
- Work branch: `feature/sql-postgresql-unicode-identifiers`.
- TDD is mandatory: commit and observe RED before production-code changes.
- No new SQL dialect option.
- No MySQL lexical expansion.
- No parser rewrite, normalization change, dependency addition, or UI change.

---

### Task 1: Add focused RED regressions

**Files:**
- Create: `apps/web/src/features/tools/query-code-workbench-sql-postgresql-unicode-identifier.test.ts`

**Interfaces:**
- Consumes: `formatSql(input: string, options?: FormatOptions): FormatResult` from `./query-code-workbench`.
- Produces: regression coverage only; no production API changes.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from "vitest";
import { formatSql, type FormatOptions } from "./query-code-workbench";

const MYSQL_OPTIONS: FormatOptions = { sqlDialect: "mysql" };

describe("PostgreSQL Unicode identifier preservation", () => {
  it.each([
    ["Cyrillic", "пользователь"],
    ["Latin with diacritic", "café"],
    ["non-BMP letter", "𐐀value"],
  ])("preserves %s bare identifiers", (_label, identifier) => {
    expect(formatSql(`select ${identifier} from data;`).output)
      .toBe(`SELECT ${identifier}\nFROM data;`);
  });

  it("preserves Unicode tagged dollar-quoted strings", () => {
    const literal = "$тег$from where$тег$";
    expect(formatSql(`select ${literal} as value;`).output)
      .toBe(`SELECT ${literal} AS value;`);
  });

  it.each(["alpha_2$value", "_alpha2$value"])(
    "preserves PostgreSQL identifier continuation characters in %s",
    (identifier) => {
      expect(formatSql(`select ${identifier} from data;`).output)
        .toBe(`SELECT ${identifier}\nFROM data;`);
    },
  );

  it("keeps ASCII tagged dollar quotes unchanged", () => {
    const literal = "$tag$from where$tag$";
    expect(formatSql(`select ${literal} as value;`).output)
      .toBe(`SELECT ${literal} AS value;`);
  });

  it("does not treat a digit as a bare-identifier start", () => {
    expect(formatSql("select 1alpha from data;").output)
      .toBe("SELECT 1 alpha\nFROM data;");
  });

  it("does not reinterpret an attached dollar delimiter after an identifier", () => {
    expect(formatSql("select foo$tag$body$tag$ from data;").output)
      .toBe("SELECT foo$tag$body$tag$\nFROM data;");
  });

  it.each(["$1", ":value", "@value"])("keeps placeholder %s tokenization", (placeholder) => {
    expect(formatSql(`select ${placeholder} as value;`).output)
      .toBe(`SELECT ${placeholder} AS value;`);
  });

  it.each(["@>", "<@", "?|", "?&", "#-", "@?", "@@"])(
    "keeps PostgreSQL compound operator %s tokenization",
    (operator) => {
      expect(formatSql(`select a ${operator} b;`).output).toContain(`a ${operator} b`);
    },
  );

  it("does not broaden MySQL bare identifiers", () => {
    expect(() => formatSql("select café from data;", MYSQL_OPTIONS))
      .toThrow(/Unsupported SQL character/u);
  });
});
```

- [ ] **Step 2: Push the test-only commit and verify RED in GitHub Actions**

Expected failure: JavaScript tests fail because the current tokenizer rejects the first unsupported Unicode character in a bare identifier or Unicode dollar tag. No production file is changed in this commit.

- [ ] **Step 3: Confirm controls are not the source of the failure**

The CI failure must point to the new Unicode cases, not existing MySQL/operator/placeholder controls or setup failures.

---

### Task 2: Implement the minimal Unicode-aware scanner

**Files:**
- Modify: `apps/web/src/features/tools/query-code-workbench.ts`
- Test: `apps/web/src/features/tools/query-code-workbench-sql-postgresql-unicode-identifier.test.ts`

**Interfaces:**
- Consumes: existing `tokenizeSql(input, sqlDialect)` flow.
- Produces: tokenizer-local helpers only; exported API remains unchanged.

- [ ] **Step 1: Add code-point-safe helper functions**

```ts
function readCodePoint(input: string, index: number): { readonly value: string; readonly next: number } {
  const codePoint = input.codePointAt(index);
  if (codePoint === undefined) return { value: "", next: index };
  const value = String.fromCodePoint(codePoint);
  return { value, next: index + value.length };
}

function isPostgresqlIdentifierStart(value: string): boolean {
  return value === "_" || /^\p{L}$/u.test(value);
}

function isPostgresqlIdentifierContinuation(value: string): boolean {
  return isPostgresqlIdentifierStart(value) || /^[0-9$]$/u.test(value);
}

function readPostgresqlIdentifier(input: string, start: number): [string, number] {
  let index = start;
  const first = readCodePoint(input, index);
  if (!isPostgresqlIdentifierStart(first.value)) return ["", start];
  index = first.next;
  while (index < input.length) {
    const current = readCodePoint(input, index);
    if (!isPostgresqlIdentifierContinuation(current.value)) break;
    index = current.next;
  }
  return [input.slice(start, index), index];
}
```

- [ ] **Step 2: Reuse the scanner for tagged dollar-quote delimiters**

When `character === "$"`, scan the tag after the opening `$` using the PostgreSQL start/continuation rule with `$` excluded from tag continuation. Require the closing `$` immediately after the scanned tag; then find the matching full delimiter and emit one `string` token plus the existing `postgres-dollar-quoted-string` warning.

- [ ] **Step 3: Use Unicode-aware bare identifier scanning only in standard mode**

In MySQL mode, retain the existing ASCII bare-word path. In standard mode, if the current code point is a PostgreSQL identifier start, consume the full Unicode-aware identifier and emit a `word` token.

- [ ] **Step 4: Keep attached dollar-delimiter boundaries conservative**

Do not reinterpret `$tag$` embedded inside an already-started identifier as a string delimiter. `$` remains a valid continuation character for the identifier token.

- [ ] **Step 5: Push the production commit and verify GREEN**

Expected: the new regression file passes and existing JavaScript tests remain green.

---

### Task 3: Full verification and PR

**Files:**
- No additional source files expected.

**Interfaces:**
- Produces: reviewable PR targeting `feature/backend-production-readiness`.

- [ ] **Step 1: Verify full GitHub Actions matrix**

Required jobs from `.github/workflows/ci.yml`: `Full verification`, `Homepage visual QA`, and `Python locks (3.14)` all complete successfully.

- [ ] **Step 2: Review the branch diff**

Expected changed files are limited to the spec, plan, one focused regression file, and `query-code-workbench.ts`.

- [ ] **Step 3: Open PR**

Title: `fix(sql): preserve PostgreSQL Unicode identifiers`

Body must document the RED commit, the minimal scanner change, explicit non-goals, and CI evidence.

- [ ] **Step 4: Merge only after CI is green and verify the exact integration SHA**

After merge, fetch `feature/backend-production-readiness` and confirm its HEAD is the PR merge commit (or the exact fast-forward/squash commit produced by GitHub). Do not infer merge success from PR state alone.
