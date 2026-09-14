# WebDiag Product Readiness Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove that every public WebDiag tool is mapped to a real implementation, renders cleanly, has appropriate behavioral coverage, and does not rely on obvious production code smells, placeholders, dead routing entries, or unsafe shortcuts.

**Architecture:** Treat `packages/tool-registry/registry/tools.json` as the public capability source of truth. Cross-check it against `apps/web/src/features/tools/tool-renderer.tsx`, family-level engines/contracts/routes, unit tests, and Playwright coverage. Use an isolated audit branch first; only concrete fixes and durable regression gates may be transferred to `feature/backend-production-readiness` after targeted tests and full CI are green.

**Tech Stack:** TypeScript, React, Next.js 16, Vitest 4, Playwright, Node.js 24, Python 3.13/3.14, GitHub Actions.

**Spec:** User requirement in the active WebDiag production-readiness review: the repository must withstand strict employer code review and every public tool must provide real user value rather than merely render.

## Global Constraints

- Do not change the approved homepage visually or compositionally.
- Do not weaken lint, typecheck, unit, browser, Python, lock, production-image, or visual QA gates.
- No broad suppressions, placeholder implementations, fake results, or capability claims unsupported by code.
- Keep fixes small and independently testable; use regression-first tests for discovered defects.
- Re-check the target branch HEAD before every GitHub write; reconcile any unexpected movement.
- Only transfer changes with evidence from the isolated audit branch and final target CI.

---

### Task 1: Registry-to-renderer integrity

**Files:**
- Read: `packages/tool-registry/registry/tools.json`
- Read: `apps/web/src/features/tools/tool-renderer.tsx`
- Read: `apps/web/src/features/tools/tool-renderer.test.ts`
- Audit-only create: `.github/workflows/tmp-product-readiness-audit.yml`

**Interfaces:**
- Consumes: ready tool definitions (`state === "ready"`).
- Produces: exact equality between ready slugs, supported slugs, and renderer switch cases; coverage report by executor class.

- [ ] **Step 1: Add an audit assertion that extracts every `case "<slug>"` from `ToolRenderer`.**

```js
const ready = tools.filter((tool) => tool.state === "ready").map((tool) => tool.slug).sort();
const cases = [...renderer.matchAll(/case\s+"([^"]+)"\s*:/g)].map((match) => match[1]).sort();
assert.deepEqual(cases, ready);
```

- [ ] **Step 2: Run the audit and require zero missing, extra, or duplicate slugs.**

```bash
node scripts/generated-product-readiness-audit.mjs
```

Expected: exact equality and executor-class counts printed.

- [ ] **Step 3: Keep findings on the audit branch only.**

### Task 2: Production-code smell scan

**Files:**
- Read: `apps/web/src/**`, `apps/web/app/**`, `packages/**/src/**`, `services/**`
- Exclude: tests, fixtures, docs, generated output.

**Interfaces:**
- Consumes: production source files.
- Produces: review list for TODO/FIXME/HACK/XXX, debug logging, TypeScript suppressions, lint suppressions, placeholders/mocks/fakes, empty catches, and suspicious commented-out code.

- [ ] **Step 1: Scan production sources with explicit patterns and print file/line evidence.**

```bash
rg -n --hidden --glob '!**/*.test.*' --glob '!**/e2e/**' --glob '!docs/**' '(TODO|FIXME|HACK|XXX|@ts-ignore|eslint-disable|console\.(log|debug)|placeholder|mock|fake)' apps packages services || true
```

- [ ] **Step 2: Classify each hit as legitimate domain wording, test infrastructure, or actionable debt; do not auto-delete based on grep alone.**

### Task 3: Every-ready-page browser smoke

**Files:**
- Audit-only create at runtime: `apps/web/e2e/product-readiness-audit.spec.ts`
- Reuse: `apps/web/e2e/browser-guard.ts`

**Interfaces:**
- Consumes: all ready slugs from `tools.json`.
- Produces: one clean production-browser navigation check per public tool.

- [ ] **Step 1: Generate a Playwright spec from the ready slug list.**

```ts
for (const slug of READY_SLUGS) {
  test(`/tools/${slug} renders cleanly`, async ({ page }) => {
    const response = await page.goto(`/tools/${slug}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator(".tool-workspace")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
```

- [ ] **Step 2: Reuse `installBrowserGuard` so console warnings/errors, page errors, failed requests, and HTTP >=400 fail the route.**

- [ ] **Step 3: Run against the production Next.js build with Chromium.**

```bash
npm run build
npx playwright install chromium
npm --workspace @webdiag/web exec playwright test e2e/product-readiness-audit.spec.ts
```

Expected: every ready route passes.

### Task 4: Behavioral coverage matrix

**Files:**
- Read: `apps/web/src/features/tools/**/*.test.{ts,tsx}`
- Read: `apps/web/e2e/**/*.spec.ts`
- Read: family implementations and API routes referenced by `tool-renderer.tsx`.

**Interfaces:**
- Consumes: ready slug, executor class, renderer component/family, unit/contract tests, E2E tests.
- Produces: coverage gaps grouped by browser-local, safe-fetch/network, composite, and crawler/account tools.

- [ ] **Step 1: Report literal slug coverage in unit/contract/E2E tests as a first-pass signal, not as a correctness verdict.**

- [ ] **Step 2: For family-driven tools, verify the shared engine/contract covers each exposed variant rather than adding duplicate shallow tests.**

- [ ] **Step 3: Prioritize network/crawler/composite tools for boundary, timeout, redirect, SSRF, size, parse, and error-state tests.**

### Task 5: Fix proven defects with regression tests

**Files:**
- Modify only files implicated by a concrete failing audit or verified code-review defect.
- Test beside the affected engine/route/component.

**Interfaces:**
- Consumes: one proven defect at a time.
- Produces: failing regression test, minimal implementation fix, green targeted verification.

- [ ] **Step 1: Add the smallest failing test that reproduces the defect.**
- [ ] **Step 2: Run it and confirm failure for the expected reason.**
- [ ] **Step 3: Implement the minimal production fix without unrelated cleanup.**
- [ ] **Step 4: Run targeted unit/contract/browser checks and `git diff --check`.**
- [ ] **Step 5: Commit atomically on the audit branch; transfer only after review.**

### Task 6: Final target verification

**Files:**
- No new scope.

**Interfaces:**
- Consumes: reviewed atomic fixes and durable gates.
- Produces: target branch with full CI green and no known unresolved high-confidence product defects.

- [ ] **Step 1: Re-check target HEAD and transfer only reviewed changes.**
- [ ] **Step 2: Run full target CI: JS tests, lint, typecheck, production build, Playwright, Python 3.13/3.14 locks/tests, production image smokes, homepage visual QA.**
- [ ] **Step 3: Re-run security audit evidence and document any intentionally deferred non-bug warning separately.**
