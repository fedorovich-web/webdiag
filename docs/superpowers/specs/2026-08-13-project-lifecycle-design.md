# Recoverable Project Lifecycle Design

## Scope

WebDiag adds ownership-scoped project rename, archive, archived-project listing, and restore. Permanent deletion remains absent. The change extends the existing SQLite account workspace and does not create a second project subsystem.

## Contracts

- `PATCH /v1/account/projects/{project_id}` accepts exactly `name` and returns the existing `AccountProject` contract.
- `GET /v1/account/projects/archived` returns `webdiag.account.archived_project_list.v1`.
- `POST /v1/account/projects/{project_id}/archive` returns `webdiag.account.archived_project.v1`.
- `POST /v1/account/projects/{project_id}/restore` returns the existing active `AccountProject` contract.
- Every route resolves ownership only from the session cookie, uses UUID path validation, rejects extra request keys, and emits `Cache-Control: no-store`.

An archived-project item contains the normal immutable identity fields plus a non-null `archived_at`. Active project contracts do not gain an extra field, so existing strict clients remain compatible.

## Persistence and bounded growth

`account_workspace_projects` gains nullable `archived_at INTEGER`. Schema initialization performs an additive migration under `BEGIN IMMEDIATE` and creates an index for bounded active and archived listings.

The account limit remains 100 total project rows, including archived rows. Archiving therefore cannot bypass the storage bound. The existing `(user_id, origin)` uniqueness remains across active and archived projects. A user must restore the archived project instead of creating a duplicate origin.

Rename, archive, and restore use parameterized statements in immediate transactions. Archive and restore are idempotent. Cross-account identifiers return the same not-found contract as missing identifiers.

## Archive boundary

Archived projects are excluded from the normal project list, detail route, account overview, audit execution, monitor creation or execution, and new report creation. Existing saved audits, monitor history, immutable reports, and share records are retained.

Archiving atomically disables an existing monitor, clears `next_run_at`, `lease_token`, and `lease_expires_at`, and changes a running status to `pending`. A worker that held the cleared lease cannot persist a late result. Restoring a project never re-enables its monitor automatically.

Existing public report shares remain valid because archive is recoverable organization, not deletion or revocation. Owners can still revoke a share through the report contract. This behavior is explicit and must not be described as data deletion.

## Workspace UX

Project rename is an inline secondary action on the owned project page. Archive requires confirmation and returns the user to the active project list. An archived-project section exposes only persisted archived items with restore actions. No permanent-delete, billing, Lava.top, fake history, or fake status control is shown.

RU and EN routes expose equivalent information architecture. Errors are associated with their controls and mutations prevent duplicate submission.

## Verification

Regression coverage must include additive migration, ownership isolation, idempotency, total-row limits, origin reservation, monitor lease cancellation, archived-operation blocking, strict request/response contracts, no-store headers, SQL metacharacters in names, Next proxy behavior, RU/EN controls, and mobile overflow.
