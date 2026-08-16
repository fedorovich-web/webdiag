# Factual Availability Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove fabricated pricing/payment claims from public RU/EN surfaces while preserving stable routes and the incumbent design system.

**Architecture:** Treat pricing as a current-availability explanation until approved commercial data exists. Keep home and pricing route layouts, replace price-specific data with factual state cards, and add a source-level release regression.

**Tech Stack:** Next.js 16, React 19, TypeScript, Node test runner, Playwright, Impeccable.

## Global Constraints

- Stay on `feature/backend-production-readiness`; do not merge, release, deploy, tag, or modify `main`.
- Do not add prices, payment providers, activation dates, invented limits, customer metrics, or unavailable AI actions.
- Preserve RU/EN parity, existing routes, tokens, breakpoints, dark theme, and keyboard behavior.
- Use tests before implementation and run each unchanged gate only once.

---

### Task 1: Add the factual-copy release regression

**Files:**
- Modify: `scripts/tests-ui-foundation.test.mjs`
- Test: `scripts/tests-ui-foundation.test.mjs`

**Interfaces:**
- Consumes: public home and pricing page source files.
- Produces: a release regression that rejects unapproved commercial claims and requires factual availability copy.

- [x] **Step 1: Write the failing source test**

Read `apps/web/src/features/home/home-page.tsx` and both pricing pages. Reject
`99 ₽`, `490 ₽`, `299 ₽`, `/мес`, `/mo`, `paid per run`, `оплачиваются`, and
the previous preliminary-price text. Require “Что доступно сейчас”, “What is
available now”, “Оплата не подключена”, and “Payments are not connected”.

- [x] **Step 2: Run RED**

```powershell
node --test scripts/tests-ui-foundation.test.mjs
```

Expected: FAIL on the current fabricated pricing source.

### Task 2: Replace home price cards with availability cards

**Files:**
- Modify: `apps/web/src/features/home/home-page.tsx`
- Modify only if geometry requires it: `apps/web/app/home-v11.css`
- Test: `apps/web/e2e/home-design.spec.ts`

**Interfaces:**
- Consumes: the existing `content.ru/en` object and pricing grid renderer.
- Produces: four RU/EN availability cards with working actions only.

- [x] **Step 1: Replace price-specific content and render fields**

Change the card shape to `icon`, `title`, `status`, `description`, `items`, and
optional `action`/`href`. Remove all amount, currency, prefix, suffix, and
price-line markup. Keep the existing grid and card classes.

- [x] **Step 2: Add browser assertions**

Assert the home renders the current-availability heading, contains no ruble
amount, exposes working tools/register links, and labels AI/payments as
unavailable without clickable activation controls.

### Task 3: Replace RU/EN pricing route claims

**Files:**
- Modify: `apps/web/app/(ru)/pricing/page.tsx`
- Modify: `apps/web/app/(en)/en/pricing/page.tsx`
- Test: `scripts/tests-ui-foundation.test.mjs`

**Interfaces:**
- Consumes: stable `/pricing` and `/en/pricing` routes.
- Produces: localized availability pages with tools and registration actions.

- [x] **Step 1: Rewrite metadata and page content**

Use one H1 per locale, four factual availability articles, and an explicit
no-prices/no-payment note. Keep existing shell and internal-page classes.

- [x] **Step 2: Run focused GREEN**

```powershell
node --test scripts/tests-ui-foundation.test.mjs
npm --workspace @webdiag/web run test -- home
```

Expected: PASS with no fabricated commercial terms.

### Task 4: Visual, regression, and publication gate

**Files:**
- Modify: `docs/VERIFICATION.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: the completed factual-copy patch.
- Produces: verified browser evidence, one thematic commit, and an updated Draft PR.

- [x] **Step 1: Run affected checks once**

```powershell
npm run test:workspace
npm --workspace @webdiag/web run typecheck
npm --workspace @webdiag/web run build
npm --workspace @webdiag/web run test:browser -- --grep "home information architecture|pricing availability"
node C:\Users\Roman\.agents\skills\impeccable\scripts\detect.mjs --json apps/web/src/features/home/home-page.tsx apps/web/app/(ru)/pricing/page.tsx apps/web/app/(en)/en/pricing/page.tsx
git diff --check
```

- [ ] **Step 2: Review, document, commit, and push**

Record only observed results, request independent review, resolve every
Critical/Important finding, commit `fix(marketing): remove unapproved pricing
claims`, push the existing branch, and update Draft PR #3 without merge or
deployment.
