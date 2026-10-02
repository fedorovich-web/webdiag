# WebDiag Staged SQLite Recovery Design

## Status and scope

This design implements the database-only part of the A12.5 backup and restore
gate. It covers the two file-backed SQLite databases used by the current
single-writer API topology:

- the account database, which also contains projects, monitoring, reports,
  crawl jobs, AI runs, credit balances, and the append-only credit ledger;
- the public audit database, which contains durable public audit jobs and runs.

Private AI artifact disaster recovery is explicitly outside this stage.
Production requires S3-compatible storage, but the provider, object versioning,
replication, retention, and recovery credentials have not been selected. This
stage therefore must not be described as complete production disaster recovery.
Payments, deployment, release, database-engine migration, and S3 configuration
remain out of scope.

## Existing deployment boundary

`docker-compose.account.override.yml` already assigns both SQLite paths to the
persistent `account_data` volume. The persistent account stack is started with:

```text
docker compose -f docker-compose.yml -f docker-compose.account.override.yml up --build
```

The base `docker-compose.yml` alone does not provide persistent account database
paths. Recovery documentation must use the explicit two-file command and must
not imply that the base compose file preserves SQLite data.

## Operator interface

A standard-library Python module exposes three server-side commands:

```text
python -m webdiag_api.recovery backup \
  --account-database <path> \
  --audit-database <path> \
  --output-dir <new-directory>

python -m webdiag_api.recovery verify \
  --backup-dir <backup-directory>

python -m webdiag_api.recovery restore \
  --backup-dir <backup-directory> \
  --output-dir <new-directory>
```

All commands are operator-only CLI operations. No public or internal HTTP route
is added.

`backup` accepts two distinct existing regular files and a destination directory
that does not exist. `restore` also requires a destination directory that does
not exist. Neither operation overwrites, deletes, truncates, or renames a live
database. Repeating a command with the same output path fails closed.

## Backup bundle contract

A successful bundle contains exactly these recovery files:

```text
accounts.sqlite3
audits.sqlite3
manifest.json
```

The manifest uses contract version `webdiag.sqlite-recovery.v1` and contains:

- one UTC creation timestamp;
- the logical database names `account` and `audit`;
- the fixed filename, byte length, and lowercase SHA-256 digest for each file.

Its exact top-level keys are `contract_version`, `created_at`, and `databases`.
`databases` has exactly the keys `account` and `audit`; each entry has exactly
`filename`, `byte_size`, and `sha256`. Unknown keys are rejected so a newer
contract cannot be interpreted silently as v1.

Absolute source paths, user data, environment values, credentials, database
contents, and artifact object keys are never written to the manifest or command
output.

The command builds the bundle in a private temporary sibling directory. It uses
SQLite's online backup API separately for each source database, validates each
copy, writes the manifest, and only then atomically renames the temporary
directory to the requested output path. A failed operation leaves no final
bundle. Because the sources are separate SQLite files, this is two internally
consistent snapshots, not one cross-database atomic point-in-time snapshot.

## Verification contract

`verify` performs all of the following before reporting success:

1. Parse the manifest as the exact v1 shape and reject missing or extra database
   entries, unexpected filenames, non-integer sizes, and malformed digests.
2. Resolve each manifest filename as a direct child of the backup directory;
   absolute paths, traversal, symlinks, non-regular files, and missing files are
   rejected.
3. Recompute file size and SHA-256 and compare them with the manifest.
4. Open each database read-only and require `PRAGMA integrity_check` to return
   exactly `ok`.
5. Require `PRAGMA foreign_key_check` to return no rows.

Validation failures return a non-zero exit status and a short operator-facing
message. SQL contents, exception tracebacks, credentials, and internal row data
are not printed.

The CLI returns `0` on success, `2` for argument, path, manifest, hash, SQLite,
or integrity failures that the operator can correct, and `1` for a safely
reported unexpected failure. No failure path emits a traceback by default.

## Restore contract

`restore` first runs the complete verification contract against the source
bundle. It then copies the two databases into a private temporary sibling of the
new output directory, verifies both copied files again, copies the source
manifest as `manifest.json`, and atomically publishes a restored directory with
the same three fixed filenames as a backup bundle.

The restored directory is a candidate for cutover, not an automatic cutover.
The operator must stop all API writers, point
`WEBDIAG_ACCOUNT_DATABASE_PATH` and `WEBDIAG_AUDIT_DATABASE_PATH` at the restored
files, start the API, and perform authenticated and public-audit smoke checks.
The previous database files are retained until the recovery is accepted. The
CLI never modifies environment configuration and never claims that writers are
stopped.

## Security and failure handling

- Source databases are opened read-only for backup and verification.
- Destination directories must be absent, and their parents must already exist.
- Bundle paths are fixed by the contract; user-controlled manifest paths cannot
  escape the bundle directory.
- Symlinks are rejected for source databases, bundle files, and output parents.
- Newly created database and manifest files use owner-only permissions where the
  platform supports them.
- Temporary cleanup is limited to the unique directory created by the current
  command.
- Hash validation detects accidental or malicious bundle modification but is not
  a digital signature. Backup access control and off-host retention remain
  operator responsibilities.

## Test strategy

Tests use real temporary SQLite databases and the public recovery functions or
CLI entry point. They cover:

- online backup preserves committed WAL-backed rows in both databases;
- the manifest contains only the fixed logical metadata and correct hashes;
- verify accepts an intact bundle;
- verify rejects changed bytes, manifest traversal, symlinks, malformed schema,
  SQLite corruption, and foreign-key violations;
- backup and restore reject missing, identical, or non-file sources and any
  existing output path;
- restore produces readable independent copies and never mutates the backup;
- a failed backup or restore leaves no published output directory;
- CLI failures use stable non-zero exits without tracebacks or database content.

Targeted recovery tests and Ruff run after the implementation group. Before the
stage is committed, the complete affected Python package suite runs once, along
with `git diff --check`. The pushed Draft PR must pass the existing GitHub Full
verification workflow.

## Remaining release gate

This stage proves SQLite bundle creation, integrity verification, and safe
restore preparation. A12.5 backup and restore remains incomplete until the
selected production S3 provider has verified versioning or immutable backups,
off-site retention, least-privilege recovery credentials, database-to-object
reconciliation, and a documented restore drill with measured evidence.
