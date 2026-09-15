# Audit and Report Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Present existing audit and report evidence correctly in RU and EN without mutating stored snapshots or digests.

**Architecture:** Add a typed API presentation catalog keyed by the canonical audit taxonomy, derive localized response copies after integrity/ownership checks, forward bounded locale queries through web proxies, and localize public loading/error shells from a non-authoritative URL hint.

**Tech Stack:** Python 3.13/3.14, FastAPI, Pydantic, TypeScript, Next.js 15, React, Node test runner, Playwright.

## Global Constraints

- Preserve stored audit/report JSON and digest inputs byte-for-byte.
- Localize only after ownership, token, and integrity validation.
- Unknown identifiers fall back to stored safe text; never invent evidence.
- Keep machine status/category values stable and escape all HTML output.
- Keep RU-first defaults and complete EN behavior.

---

### Task 1: Lock the API presentation contract

**Files:**
- Create: `apps/api/tests/test_account_audit_presentation.py`
- Modify: `apps/api/tests/test_account_workspace_api.py`
- Modify: `apps/api/tests/test_account_reports_api.py`
- Create: `apps/api/src/webdiag_api/accounts/audit_presentation.py`
- Modify: `apps/api/src/webdiag_api/accounts/workspace_api.py`
- Modify: `apps/api/src/webdiag_api/accounts/report_service.py`

- [ ] Add failing tests for complete taxonomy coverage, RU presentation, EN preservation, unknown-ID fallback, and unchanged stored digest/snapshot.
- [ ] Run the three focused test files once and confirm failures are caused by the missing presentation layer.
- [ ] Implement immutable localized copies and bounded `locale=ru|en` endpoint inputs after authorization/integrity checks.
- [ ] Run the same three files once and require GREEN.

### Task 2: Carry locale through web account and public-share boundaries

**Files:**
- Modify: `apps/web/app/api/account/projects/[projectId]/audits/[auditId]/route.ts`
- Modify: `apps/web/app/api/account/projects/[projectId]/audits/[auditId]/issues/route.ts`
- Modify: `apps/web/app/api/account/projects/[projectId]/audits/[auditId]/issues/[issueId]/route.ts`
- Modify: `apps/web/src/features/account/account-workspace-client.tsx`
- Modify: `apps/web/src/features/account/account-report-client.tsx`
- Modify: `apps/web/src/features/account/account-report-view.tsx`
- Modify: `apps/web/src/features/account/public-report.tsx`
- Modify: `apps/web/app/reports/share/[shareToken]/page.tsx`
- Modify: account proxy, client, presentation, and contract tests beside these files.

- [ ] Add failing tests for locale forwarding, localized status/category labels, RU public loading/error shells, EN shells, and share-locale hints that cannot override a valid snapshot.
- [ ] Run the focused account test set once and confirm RED for missing behavior.
- [ ] Implement locale propagation and presentation-only labels without changing API machine fields.
- [ ] Run the focused account set once and require GREEN.

### Task 3: Verify browser and export behavior

**Files:**
- Modify: `apps/web/tests/account-workspace.spec.ts`
- Modify only if required: `apps/api/src/webdiag_api/accounts/report_artifact.py`

- [ ] Add regression coverage for RU issue/report copy, EN preservation, safe HTML escaping, and a localized public error shell.
- [ ] Run the affected API HTML test and account browser spec once.
- [ ] Capture and inspect RU/EN report desktop/mobile plus dark report/settings screenshots; reject overflow, untranslated known evidence, or unsafe HTML.
- [ ] Commit the subsystem as `feat(account): localize audit report presentation`.
