# Account Production Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the WebDiag account shell, overview, report, and responsive hierarchy without changing account data or security contracts.

**Architecture:** Add an inert account slot to the shared header and portal the existing drawer trigger into it, preserving the drawer state machine. Refine account markup only where semantic status information is missing, then replace repeated card elevation with a compact operations canvas and one coherent report document surface.

**Tech Stack:** Next.js 16.3, React 19.2, TypeScript 5.9, Lucide React 0.468, Vitest 3.2, Playwright 1.61, existing WebDiag CSS tokens.

## Global Constraints

- Work only on `feature/backend-production-readiness`; do not merge, release, tag, deploy, or modify `main`.
- Do not change backend/API contracts in this patch.
- Display only persisted WebDiag data; do not invent health, uptime, incidents, trends, notifications, AI conclusions, or historical values.
- Preserve auth, session, ownership, IDOR, SSRF, XSS, injection, no-store, noindex, report-token, export, and print protections.
- RU and EN must retain equivalent information architecture and accessible names.
- Use existing design tokens first; declare every account-local alias before use.
- Do not add dependencies.
- Follow TDD: observe the focused RED before implementation, then run one targeted GREEN after the grouped change.
- Browser screenshots must use controlled fixture data and must not be described as real product metrics.

---

## File map

- `apps/web/src/components/site-header.tsx`: inert account action slot in the shared header.
- `apps/web/src/features/account/account-workspace-shell.tsx`: portal trigger and existing accessible drawer orchestration.
- `apps/web/src/features/account/account-report-presentation.ts`: localized severity presentation with an honest unknown-value fallback.
- `apps/web/src/features/account/account-report-presentation.test.ts`: severity label unit regressions.
- `apps/web/src/features/account/account-report-view.tsx`: semantic priority/severity attributes and compact report reading structure.
- `apps/web/app/account.css`: shell, overview, report, project, settings, theme, print, and responsive hierarchy.
- `apps/web/e2e/account.spec.ts`: header placement, focus/scroll lock, report semantics, dark/RU/EN, and viewport regressions.

### Task 1: Move the mobile account trigger into the shared header

**Files:**
- Modify: `apps/web/src/components/site-header.tsx`
- Modify: `apps/web/src/features/account/account-workspace-shell.tsx`
- Modify: `apps/web/e2e/account.spec.ts`

**Interfaces:**
- Consumes: existing `drawerOpen`, `drawerTriggerRef`, `closeDrawer()`, and `#account-workspace-drawer` behavior.
- Produces: `#account-workspace-menu-slot` and a localized header icon button whose accessible name remains “Меню кабинета” / “Workspace menu”.

- [ ] **Step 1: Add the failing browser regression**

Extend the mobile drawer test to assert that the trigger is inside `.wd-site-header`, the legacy `.wd-workspace-mobile-bar` is absent, opening sets `document.body.style.overflow` to `hidden`, and Escape restores both focus and the previous overflow value.

```ts
const trigger = page.getByRole("button", { name: "Меню кабинета" });
await expect(page.locator(".wd-site-header").getByRole("button", { name: "Меню кабинета" })).toBeVisible();
await expect(page.locator(".wd-workspace-mobile-bar")).toHaveCount(0);
await trigger.click();
await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("hidden");
await page.keyboard.press("Escape");
await expect(trigger).toBeFocused();
await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("");
```

- [ ] **Step 2: Run the focused RED**

Run: `npm --workspace @webdiag/web run test:browser -- --grep "mobile drawer traps focus"`

Expected: FAIL because the trigger is still rendered in `.wd-workspace-mobile-bar` below the header.

- [ ] **Step 3: Implement the header slot and portal trigger**

Add `<div id="account-workspace-menu-slot" className="wd-account-menu-slot" />` inside `.wd-header-actions`. In the client shell, resolve the slot after mount and use `createPortal` to render a 44-pixel icon button with a decorative Lucide `Menu` icon, localized `aria-label`, `aria-expanded`, and `aria-controls`. Remove `.wd-workspace-mobile-bar`; keep the existing drawer functions unchanged.

- [ ] **Step 4: Defer GREEN until the grouped account build**

The browser suite runs against the production build. Complete Tasks 2–3 before the single grouped build and browser GREEN in Task 4.

### Task 2: Expose stored severity in the report hierarchy

**Files:**
- Modify: `apps/web/src/features/account/account-report-presentation.test.ts`
- Modify: `apps/web/src/features/account/account-report-presentation.ts`
- Modify: `apps/web/src/features/account/account-report-view.tsx`
- Modify: `apps/web/e2e/account.spec.ts`

**Interfaces:**
- Consumes: `SavedAuditIssue.severity: string` from the strict immutable report snapshot.
- Produces: `reportSeverityLabel(locale, severity): string`, `data-priority`, and `data-severity` attributes using the stored values.

- [ ] **Step 1: Write the failing unit tests**

```ts
expect(reportSeverityLabel("ru", "critical")).toBe("Критическая");
expect(reportSeverityLabel("en", "high")).toBe("High");
expect(reportSeverityLabel("ru", "provider-specific")).toBe("provider-specific");
```

- [ ] **Step 2: Run the unit RED**

Run: `npm --workspace @webdiag/web run test -- account-report-presentation.test.ts`

Expected: FAIL because `reportSeverityLabel` is not exported.

- [ ] **Step 3: Implement the minimal label selector**

Map only the observed taxonomy values `critical`, `high`, `medium`, `low`, `info`, and `warning`. Return the stored non-empty value unchanged for an unknown taxonomy value; do not infer a severity.

- [ ] **Step 4: Add semantic issue signals**

Render separate stored priority and localized severity spans. Add `data-priority={issue.priority}` to issue groups and `data-severity={issue.severity}` to issue articles. Keep title, description, recommendations, affected URLs, and ordering unchanged.

- [ ] **Step 5: Add browser assertions**

Assert that the report fixture exposes “Высокая” separately from “P0 — исправить первым” and that no percentage, uptime, notification, incident, or AI conclusion appears.

- [ ] **Step 6: Run targeted unit GREEN**

Run: `npm --workspace @webdiag/web run test -- account-report-presentation.test.ts`

Expected: PASS.

### Task 3: Apply the compact operations and report visual hierarchy

**Files:**
- Modify: `apps/web/app/account.css`
- Modify: `apps/web/e2e/account.spec.ts`

**Interfaces:**
- Consumes: existing account class names and global semantic tokens.
- Produces: compact desktop/mobile hierarchy, one report document surface, full-width mobile next actions, dark-theme parity, and print-safe output.

- [ ] **Step 1: Add failing geometry and state assertions**

At 390 by 844, assert the first next-action link is wider than 300 pixels, every visible account action is at least 44 pixels high, and `scrollWidth <= innerWidth`. At 1440 by 900, assert the report document is narrower than its workspace content and the delivery area follows it. Switch to dark theme and EN account routes and assert the same navigation and report landmarks remain visible.

- [ ] **Step 2: Run the focused browser RED**

Run: `npm --workspace @webdiag/web run test:browser -- --grep "operations overview|creates an immutable report|mobile drawer traps focus"`

Expected: FAIL on header placement, narrow next-action geometry, or new report severity assertions.

- [ ] **Step 3: Load the Impeccable craft floor**

Read `C:/Users/Roman/.agents/skills/impeccable/reference/craft-floor.md` immediately before editing the UI and obey its bans and quality checks.

- [ ] **Step 4: Refine the account CSS**

Use existing semantic tokens and current account aliases. Remove the obsolete mobile bar styles, add the account header slot and icon-button states, compact section spacing, reduce repeated shadows, give next actions the full mobile measure, unify the report snapshot into one bordered document, distinguish priority/severity with semantic tokens plus text, and preserve 44-pixel controls. Add only narrow account-route brand-mark behavior required to avoid header overflow.

- [ ] **Step 5: Preserve print and public report readability**

Ensure report section dividers, issue order, priority/severity text, checks, methodology, and target origin remain visible in print. Hide account-only navigation and mutation controls in print using existing print conventions; do not hide report evidence.

### Task 4: Build and run the targeted browser GREEN

**Files:**
- Verify only the files changed by Tasks 1–3.

**Interfaces:**
- Consumes: the production build required by Playwright `webServer.command`.
- Produces: browser-tested account shell and report behavior against current source.

- [ ] **Step 1: Run focused source checks**

Run:

```powershell
npm --workspace @webdiag/web run test -- account-report-presentation.test.ts account-workspace-shell-contract.test.ts account-dashboard-contract.test.ts
npm --workspace @webdiag/web run typecheck
```

Expected: PASS.

- [ ] **Step 2: Build the web package once**

Run: `npm --workspace @webdiag/web run build`

Expected: release precheck and Next.js build pass with no new warning or error.

- [ ] **Step 3: Run the grouped account browser GREEN once**

Run: `npm --workspace @webdiag/web run test:browser -- e2e/account.spec.ts`

Expected: all account tests pass with no unexpected console, page, HTTP, accessibility, or overflow errors.

### Task 5: Perform visual QA and finish the patch

**Files:**
- Inspect: account overview, project, report, and settings routes.
- Create outside Git worktree: controlled fixture screenshots in the Codex visualization directory.

**Interfaces:**
- Consumes: built account application and controlled Playwright fixture data.
- Produces: desktop/mobile/light/dark/RU/EN visual evidence and a clean source diff.

- [ ] **Step 1: Capture real browser screenshots**

Capture at least account overview desktop 1440 by 900, account overview mobile 390 by 844, project desktop, client report desktop, client report mobile, and one dark-theme account screen. Use the controlled fixture and label it as test data.

- [ ] **Step 2: Inspect interaction and visual hierarchy**

Check header placement, drawer focus/scroll lock, first-viewport density, long-content wrapping, touch targets, action hierarchy, report reading order, dark-theme contrast, RU/EN expansion, and absence of horizontal overflow. Fix any observed defect before continuing.

- [ ] **Step 3: Run the Impeccable detector once**

Run:

```powershell
node C:/Users/Roman/.agents/skills/impeccable/scripts/detect.mjs --json apps/web/src/components/site-header.tsx apps/web/src/features/account/account-workspace-shell.tsx apps/web/src/features/account/account-report-view.tsx apps/web/app/account.css
```

Expected: no unresolved material finding. Detector output is evidence, not a substitute for browser inspection.

- [ ] **Step 4: Run the affected web package gate once**

Run:

```powershell
npm --workspace @webdiag/web run test
npm --workspace @webdiag/web run lint
npm --workspace @webdiag/web run typecheck
npm --workspace @webdiag/web run build
npm --workspace @webdiag/web run test:browser -- e2e/account.spec.ts
git diff --check
```

Run the second build/browser pass only if visual QA required source edits after Task 4; otherwise reuse Task 4 build/browser evidence and run only the remaining unchanged gates once.

- [ ] **Step 5: Commit and push the thematic patch**

Stage only the intended web, test, spec, and plan files. Commit with a focused account-polish message, push `feature/backend-production-readiness`, and confirm Draft PR 3 still targets `recovery/a11.5-github-baseline`. Do not merge or mark the PR ready.

## Self-review

- The plan covers header placement, existing drawer accessibility, overview density, report priority/severity, export/share separation, mobile overflow, dark theme, RU/EN, states, print, visual screenshots, detector, and affected-package verification.
- Every new function and DOM contract is named before use.
- Unknown severity is not reclassified.
- No backend/API, dependency, payment, release, merge, deployment, or `main` change is included.
- The only allowed repeated build/browser run has an explicit reason: source edits discovered during visual QA.

