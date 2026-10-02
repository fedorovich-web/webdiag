# Recoverable Project Lifecycle Implementation Plan

> **For agentic workers:** Use Superpowers test-driven development and execute each task with review checkpoints.

**Goal:** Add real project rename/archive/restore behavior without deletion, unbounded storage, cross-account access, or fake UI.

**Architecture:** Extend `SqliteWorkspaceStore` with an additive archived timestamp and atomic lifecycle mutations. Existing reads become active-only; a separate archived list preserves strict v1 active-project clients. Archive disables monitor scheduling and invalidates a running lease in the same SQLite transaction.

### Task 1: Storage lifecycle and migration

- Add failing migration, rename, archive, restore, ownership, total-limit, duplicate-origin, and monitor-lease tests in `apps/api/tests/test_account_api.py`.
- Add `archived_at`, active-only reads, bounded archived reads, and immediate-transaction lifecycle methods in `workspace_storage.py`.
- Keep all SQL parameterized and make archive/restore idempotent.
- Run only targeted lifecycle tests and Ruff.
- Commit `feat(projects): add recoverable lifecycle storage`.

### Task 2: Versioned API and operation blocking

- Add strict rename and archived response models.
- Add service methods and no-store routes for rename, archived list, archive, and restore.
- Verify cross-account not-found behavior, malformed UUID, extra keys, and SQL metacharacters.
- Ensure audit, monitoring, and report creation cannot operate on archived projects.
- Run targeted API/security tests and Ruff.
- Commit `feat(projects): expose recoverable lifecycle API`.

### Task 3: Next boundary and workspace UX

- Add method-allowlisted Next proxy routes and exact frontend contracts/clients.
- Add rename, confirmed archive, archived list, and restore controls to RU/EN project workspace.
- Keep permanent deletion and payment controls absent.
- Add unit contract tests and one focused desktop/mobile browser scenario.
- Run the affected web gate once and request independent review.
- Commit `feat(account): add project lifecycle controls`.

### Task 4: Documentation and final verification

- Update `docs/ACCOUNT_WORKSPACE.md` with exact retention and share semantics.
- Run one fresh relevant backend/frontend verification and `git diff --check`.
- Record remaining risk: archive retains immutable data and live shares until separately revoked; permanent deletion still requires an approved retention design.
