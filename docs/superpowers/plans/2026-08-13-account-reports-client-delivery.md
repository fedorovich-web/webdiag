# Account Reports and Client Delivery Plan

**Goal:** Make saved reports usable in portfolio and project context, readable by clients from summary to evidence, and safe to export or share without exposing private identifiers or inventing conclusions.

**Architecture:** Version the private list response to `webdiag.account.report_list.v2`. Each list item keeps the existing report summary and adds `project_name`, `target_origin`, and `audit_completed_at`, derived from the already hash-verified immutable snapshot. Add an optional owner-scoped `project_id` filter to the same endpoint. Detail/public snapshot contracts remain unchanged.

**Constraints:** No N+1 detail loading, no mutable report content, no AI interpretation, no invented business impact, no raw share token persistence, no public account/project/audit identifiers, and no hidden payment integration.

## Task 1: Backend report index v2

- Add regression tests for list metadata, project filtering, cross-account empty results, ordering, no-store, and tampered snapshot fail-closed behavior.
- Add a report list item model and bump only the list contract to v2.
- Validate the immutable snapshot/hash before deriving list metadata.
- Filter in SQLite with `user_id` and optional `project_id`; retain the existing bounded limit/order.
- Expose `project_id` as an optional UUID query parameter.

## Task 2: Strict Next.js boundary and project context

- Validate exact v2 list items and cross-field consistency.
- Add an optional validated project filter to the browser client and Next proxy route.
- Reject unknown, duplicate, or malformed query parameters with a stable no-store 400 response.
- Activate project-report navigation only when a current project exists.

## Task 3: Deterministic report presentation

- Add unit-tested selectors for dates, share state, priority distribution, fix order, check groups, and deterministic summary counts.
- Portfolio/project report cards show project, origin, audit date, report locale, creation date, share state, and expiry when active.
- Detail/public reading order: identity, deterministic executive summary, priority distribution and first actions, ordered issue groups, passed/non-passing checks, methodology/scope, export/share actions.
- Stored diagnostic text remains unchanged; only interface labels are localized.

## Task 4: Share lifecycle UX

- Show newly issued URL once with an immediate copy action and explicit success/failure feedback.
- Require confirmation before replacement or revoke and explain that the existing link stops working.
- Preserve current detail on mutation failure.
- Keep public failure neutral and retain noindex/no-store behavior.

## Task 5: Verification

- Run backend RED/GREEN targeted tests, then affected Python tests/Ruff once.
- Run new web unit tests RED/GREEN, then one web test/lint/typecheck/build gate.
- Run report browser scenarios once and inspect desktop/mobile public and private report views.
- Run the Impeccable detector once over changed UI targets, followed by `git diff --check` and a focused source review.
