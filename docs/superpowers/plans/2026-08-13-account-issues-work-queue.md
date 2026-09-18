# Account Issues Work Queue Implementation Plan

> Execution follows the approved Operations Workspace specification and uses the existing persisted issue API. No backend contract expansion is required.

**Goal:** Turn saved-audit issues into a clear project work queue with localized priorities, deterministic fix order, useful filters, and progressive disclosure of technical evidence.

**Architecture:** Keep `webdiag.account.issue_list.v1` and `webdiag.account.issue_detail.v1` unchanged. Add pure presentation selectors for labels and counts, then render them through the existing client components. All routes continue to read persisted audits and never trigger a new audit.

**Constraints:** No inferred business impact, SLA, uptime, AI analysis, translated diagnostic content, or client-side ownership identifiers. Source category, severity, check ID, and issue ID remain available only in the expert disclosure.

---

## Task 1: Lock the presentation rules with unit tests

**Files:**

- Create: `apps/web/src/features/account/account-issues-presentation.ts`
- Create: `apps/web/src/features/account/account-issues-presentation.test.ts`

Cover:

- RU/EN labels for the defined `p0` through `p3` contract values;
- RU/EN category labels for every defined category;
- affected URL count grammar;
- active-filter detection;
- deterministic default filters (`priority`, `asc`);
- no derived severity or impact claims.

Run the new unit test once red, implement the pure module, then run it once green.

## Task 2: Rebuild the issue list as a work queue

**Files:**

- Modify: `apps/web/src/features/account/account-issues-list.tsx`
- Modify: `apps/web/app/account.css`
- Modify: `apps/web/e2e/account.spec.ts`

Required behavior:

- heading and copy explain that the list is a saved-audit fix order;
- result count remains visible and has an accessible status;
- category and priority filters remain server-backed;
- default sort stays fix order;
- a reset control appears only while filters or non-default ordering are active;
- each row shows localized priority, localized category, affected URL count, stored description, and stored recommendation summary;
- loading does not erase the previous valid result;
- filtered empty state offers reset without claiming the site has no issues.

## Task 3: Add progressive disclosure to issue detail

**Files:**

- Modify: `apps/web/src/features/account/account-issue-detail.tsx`
- Modify: `apps/web/app/account.css`
- Modify: `apps/web/e2e/account.spec.ts`

Required reading order:

1. stored issue title and description;
2. stored recommendation summary and ordered steps;
3. stored expected impact only when present;
4. affected URLs with a factual count;
5. native `details` expert block containing category, source category, severity, check ID, and issue ID.

Raw enum values must not be the primary customer-facing labels.

## Task 4: Verify the affected package once

Run after all code changes:

```powershell
npm --workspace @webdiag/web run test
npm --workspace @webdiag/web run lint
npm --workspace @webdiag/web run typecheck
npm --workspace @webdiag/web run build
npm --workspace @webdiag/web run test:browser -- account.spec.ts
git diff --check
```

Inspect desktop and mobile screenshots during the browser pass. Commit the issue work queue as one coherent implementation patch after the gate is green.
