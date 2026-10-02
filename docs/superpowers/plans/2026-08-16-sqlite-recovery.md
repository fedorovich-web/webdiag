# WebDiag Staged SQLite Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an operator-only, fail-closed CLI that creates, verifies, and safely prepares restored copies of both WebDiag SQLite databases without overwriting live state.

**Architecture:** A focused `webdiag_api.recovery` standard-library module owns strict manifest parsing, SQLite online backups, integrity verification, and atomic publication through private sibling directories. Backup and restore bundles use fixed filenames; restore creates a cutover candidate only, while production S3 artifact recovery remains an explicitly open release gate.

**Tech Stack:** Python 3.13/3.14 standard library (`argparse`, `dataclasses`, `datetime`, `hashlib`, `hmac`, `json`, `pathlib`, `sqlite3`, `tempfile`), pytest 9.1.1, Ruff 0.15.21, Node.js built-in test runner.

## Global Constraints

- Work only on `feature/backend-production-readiness`; do not create another branch or worktree, merge, release, deploy, tag, or change `main`.
- Add no dependency and no HTTP route.
- The recovery contract is exactly `webdiag.sqlite-recovery.v1`.
- A bundle contains exactly `accounts.sqlite3`, `audits.sqlite3`, and `manifest.json`.
- Sources are distinct existing regular non-symlink files; destinations are absent and have existing non-symlink parents.
- Never overwrite, truncate, delete, or rename a live database.
- Use SQLite's online backup API and require `PRAGMA integrity_check` plus `PRAGMA foreign_key_check`.
- Never put source paths, credentials, environment values, SQL contents, row data, or artifact keys in manifests or errors.
- The two snapshots are independently consistent, not cross-database atomic.
- Production S3 recovery remains unverified until provider-specific backup and restore evidence exists.
- Follow red-green TDD and run one fresh affected-package verification before final commit/push.

---

## File Structure

- Create `apps/api/src/webdiag_api/recovery.py`: recovery domain, v1 parser, SQLite checks, atomic publication, CLI.
- Create `apps/api/tests/test_recovery_cli.py`: real-file backup, verify, restore, path safety, corruption, CLI tests.
- Modify `docs/INSTALLATION.md`: operator runbook and offline cutover.
- Modify `docs/VERIFICATION.md`: freshly observed evidence only.

---

### Task 1: Online backup bundle and fixed manifest

**Files:**
- Create: `apps/api/src/webdiag_api/recovery.py`
- Create: `apps/api/tests/test_recovery_cli.py`

**Interfaces:**
- Produces `RecoveryError`, `DatabaseManifest`, `RecoveryManifest`.
- Produces `create_backup(*, account_database: Path, audit_database: Path, output_dir: Path) -> RecoveryManifest`.
- Produces helpers `_sha256(Path) -> str`, `_verify_sqlite(Path) -> None`, and `_private_staging_directory(Path)` for later tasks.

- [ ] **Step 1: Write the failing WAL-backed backup test**

Create `apps/api/tests/test_recovery_cli.py` with real WAL sources:

```python
import hashlib
import json
import sqlite3
from pathlib import Path

from webdiag_api.recovery import CONTRACT_VERSION, create_backup


def _wal_database(path: Path, value: str) -> sqlite3.Connection:
    connection = sqlite3.connect(path)
    connection.execute("PRAGMA journal_mode = WAL")
    connection.execute("PRAGMA wal_autocheckpoint = 0")
    connection.execute("CREATE TABLE records(id INTEGER PRIMARY KEY, value TEXT NOT NULL)")
    connection.execute("INSERT INTO records(value) VALUES (?)", (value,))
    connection.commit()
    return connection


def _digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def test_backup_uses_online_snapshots_and_writes_fixed_manifest(tmp_path: Path) -> None:
    account = tmp_path / "live-accounts.sqlite3"
    audit = tmp_path / "live-audits.sqlite3"
    account_connection = _wal_database(account, "account-row")
    audit_connection = _wal_database(audit, "audit-row")
    output = tmp_path / "backup"
    try:
        manifest = create_backup(
            account_database=account, audit_database=audit, output_dir=output
        )
    finally:
        account_connection.close()
        audit_connection.close()

    assert {item.name for item in output.iterdir()} == {
        "accounts.sqlite3", "audits.sqlite3", "manifest.json"
    }
    with sqlite3.connect(output / "accounts.sqlite3") as connection:
        assert connection.execute("SELECT value FROM records").fetchall() == [("account-row",)]
    raw = json.loads((output / "manifest.json").read_text(encoding="utf-8"))
    assert set(raw) == {"contract_version", "created_at", "databases"}
    assert raw["contract_version"] == CONTRACT_VERSION
    assert set(raw["databases"]) == {"account", "audit"}
    assert raw["databases"]["account"] == {
        "filename": "accounts.sqlite3",
        "byte_size": (output / "accounts.sqlite3").stat().st_size,
        "sha256": _digest(output / "accounts.sqlite3"),
    }
    assert str(account) not in (output / "manifest.json").read_text(encoding="utf-8")
    assert manifest.contract_version == CONTRACT_VERSION
```

- [ ] **Step 2: Verify RED**

Run:

```powershell
.\.venv\Scripts\python.exe -m pytest apps/api/tests/test_recovery_cli.py::test_backup_uses_online_snapshots_and_writes_fixed_manifest -q
```

Expected: collection fails with `ModuleNotFoundError: No module named 'webdiag_api.recovery'`.

- [ ] **Step 3: Implement the minimal backup domain**

Create `apps/api/src/webdiag_api/recovery.py` with these exact public shapes:

```python
CONTRACT_VERSION = "webdiag.sqlite-recovery.v1"
DATABASE_FILENAMES = {"account": "accounts.sqlite3", "audit": "audits.sqlite3"}


class RecoveryError(RuntimeError):
    pass


@dataclass(frozen=True, slots=True)
class DatabaseManifest:
    filename: str
    byte_size: int
    sha256: str


@dataclass(frozen=True, slots=True)
class RecoveryManifest:
    contract_version: str
    created_at: str
    databases: dict[str, DatabaseManifest]


def create_backup(
    *, account_database: Path, audit_database: Path, output_dir: Path
) -> RecoveryManifest:
    sources = {"account": Path(account_database), "audit": Path(audit_database)}
    _validate_sources(sources)
    output = Path(output_dir)
    with _private_staging_directory(output) as staging:
        for logical_name, source in sources.items():
            _sqlite_backup(source, staging / DATABASE_FILENAMES[logical_name])
        manifest = RecoveryManifest(
            contract_version=CONTRACT_VERSION,
            created_at=datetime.now(UTC).isoformat().replace("+00:00", "Z"),
            databases={
                logical_name: DatabaseManifest(
                    filename=filename,
                    byte_size=(staging / filename).stat().st_size,
                    sha256=_sha256(staging / filename),
                )
                for logical_name, filename in DATABASE_FILENAMES.items()
            },
        )
        _write_manifest(staging, manifest)
        staging.rename(output)
    return manifest
```

Implement `create_backup` as follows:

1. `_validate_sources` requires distinct resolved paths, regular files, and no symlink.
2. `_private_staging_directory` requires an absent output path and existing directory parent, walks the parent and every ancestor to reject symlink components, creates a unique sibling with mode `0o700`, and removes only that generated path on failure.
3. `_sqlite_backup` opens the source through `source.resolve().as_uri() + "?mode=ro"`, calls `source_connection.backup(destination_connection)`, applies mode `0o600`, then calls `_verify_sqlite`.
4. `_verify_sqlite` requires exactly `[("ok",)]` from `PRAGMA integrity_check` and no rows from `PRAGMA foreign_key_check`; failures use safe `RecoveryError` messages.
5. Write a compact sorted UTF-8 `manifest.json` with one UTC `Z` timestamp and file size/SHA-256, mode `0o600`.
6. Rename the staging directory to `output_dir` only after every check succeeds.

- [ ] **Step 4: Verify GREEN and commit**

```powershell
.\.venv\Scripts\python.exe -m pytest apps/api/tests/test_recovery_cli.py::test_backup_uses_online_snapshots_and_writes_fixed_manifest -q
.\.venv\Scripts\python.exe -m ruff check apps/api/src/webdiag_api/recovery.py apps/api/tests/test_recovery_cli.py
git add -- apps/api/src/webdiag_api/recovery.py apps/api/tests/test_recovery_cli.py
git diff --cached --check
git commit -m "feat(recovery): create verified SQLite bundles"
```

Expected: one test passes, Ruff and diff check are clean, and only the two listed files are committed.

---

### Task 2: Strict verification and path safety

**Files:**
- Modify: `apps/api/src/webdiag_api/recovery.py`
- Modify: `apps/api/tests/test_recovery_cli.py`

**Interfaces:**
- Produces `verify_bundle(backup_dir: Path) -> RecoveryManifest`.
- Manifest filenames are validated against `DATABASE_FILENAMES`; they never select arbitrary paths.

- [ ] **Step 1: Write failing strict-verification tests**

Add a `_create_bundle(tmp_path)` helper using `create_backup`, then add:

```python
import pytest
from webdiag_api.recovery import RecoveryError, verify_bundle


def _plain_database(path: Path, value: str) -> Path:
    with sqlite3.connect(path) as connection:
        connection.execute("CREATE TABLE records(id INTEGER PRIMARY KEY, value TEXT NOT NULL)")
        connection.execute("INSERT INTO records(value) VALUES (?)", (value,))
    return path


def _create_bundle(tmp_path: Path) -> Path:
    account = _plain_database(tmp_path / "source-accounts.sqlite3", "account-row")
    audit = _plain_database(tmp_path / "source-audits.sqlite3", "audit-row")
    bundle = tmp_path / "bundle"
    create_backup(account_database=account, audit_database=audit, output_dir=bundle)
    return bundle


def test_verify_rejects_changed_bytes(tmp_path: Path) -> None:
    bundle = _create_bundle(tmp_path)
    with (bundle / "accounts.sqlite3").open("ab") as stream:
        stream.write(b"changed")
    with pytest.raises(RecoveryError, match="backup file digest does not match"):
        verify_bundle(bundle)


def test_verify_rejects_manifest_traversal(tmp_path: Path) -> None:
    bundle = _create_bundle(tmp_path)
    manifest_path = bundle / "manifest.json"
    raw = json.loads(manifest_path.read_text(encoding="utf-8"))
    raw["databases"]["account"]["filename"] = "../outside.sqlite3"
    manifest_path.write_text(json.dumps(raw), encoding="utf-8")
    with pytest.raises(RecoveryError, match="backup manifest is invalid"):
        verify_bundle(bundle)


def test_verify_rejects_unknown_keys_and_extra_files(tmp_path: Path) -> None:
    bundle = _create_bundle(tmp_path)
    manifest_path = bundle / "manifest.json"
    raw = json.loads(manifest_path.read_text(encoding="utf-8"))
    raw["unexpected"] = True
    manifest_path.write_text(json.dumps(raw), encoding="utf-8")
    with pytest.raises(RecoveryError, match="backup manifest is invalid"):
        verify_bundle(bundle)
    raw.pop("unexpected")
    manifest_path.write_text(json.dumps(raw), encoding="utf-8")
    (bundle / "extra.txt").write_text("unexpected", encoding="utf-8")
    with pytest.raises(RecoveryError, match="backup bundle contains unexpected files"):
        verify_bundle(bundle)
```

- [ ] **Step 2: Verify RED**

```powershell
.\.venv\Scripts\python.exe -m pytest apps/api/tests/test_recovery_cli.py -k "verify_rejects" -q
```

Expected: collection fails because `verify_bundle` does not exist.

- [ ] **Step 3: Implement exact v1 parsing and verification**

Implement:

```python
def verify_bundle(backup_dir: Path) -> RecoveryManifest:
    directory = _require_bundle_directory(Path(backup_dir))
    expected = {*DATABASE_FILENAMES.values(), "manifest.json"}
    if {item.name for item in directory.iterdir()} != expected:
        raise RecoveryError("backup bundle contains unexpected files")
    manifest = _load_manifest(directory / "manifest.json")
    for logical_name, filename in DATABASE_FILENAMES.items():
        entry = manifest.databases[logical_name]
        if entry.filename != filename:
            raise RecoveryError("backup manifest is invalid")
        path = directory / filename
        _require_regular_non_symlink(path, label="backup file")
        if path.stat().st_size != entry.byte_size or not hmac.compare_digest(
            _sha256(path), entry.sha256
        ):
            raise RecoveryError("backup file digest does not match")
        _verify_sqlite(path)
    return manifest
```

`_load_manifest` requires exact top-level keys, exact `account`/`audit` keys,
exact entry keys, fixed filenames, `type(byte_size) is int`, non-negative sizes,
lowercase 64-character hexadecimal digests, matching contract version, and a
parseable UTC timestamp ending in `Z`. Normalize JSON/type/SQLite exceptions to
safe `RecoveryError` categories without raw values. Reject symlink bundle dirs,
manifest files, and database files.

- [ ] **Step 4: Add corruption, foreign-key, symlink, and publication-failure tests**

Add this helper to recompute manifest size/hash after controlled test mutation:

```python
def _refresh_entry(bundle: Path, logical_name: str) -> None:
    manifest_path = bundle / "manifest.json"
    raw = json.loads(manifest_path.read_text(encoding="utf-8"))
    database = bundle / raw["databases"][logical_name]["filename"]
    raw["databases"][logical_name]["byte_size"] = database.stat().st_size
    raw["databases"][logical_name]["sha256"] = _digest(database)
    manifest_path.write_text(json.dumps(raw), encoding="utf-8")
```

Cover:

```python
def test_verify_rejects_sqlite_corruption_with_refreshed_digest(tmp_path: Path) -> None:
    bundle = _create_bundle(tmp_path)
    database = bundle / "audits.sqlite3"
    data = bytearray(database.read_bytes())
    data[:16] = b"not-a-sqlite-db!"
    database.write_bytes(data)
    _refresh_entry(bundle, "audit")
    with pytest.raises(RecoveryError, match="SQLite integrity verification failed"):
        verify_bundle(bundle)


def test_failed_backup_publishes_no_output(tmp_path: Path) -> None:
    account = _plain_database(tmp_path / "accounts.sqlite3", "account")
    audit = tmp_path / "not-sqlite.sqlite3"
    audit.write_text("not a database", encoding="utf-8")
    output = tmp_path / "backup"
    with pytest.raises(RecoveryError):
        create_backup(account_database=account, audit_database=audit, output_dir=output)
    assert not output.exists()
```

Also test an orphan inserted with `PRAGMA foreign_keys = OFF`, an existing output
directory, identical source paths, missing/non-file sources, a symlink bundle
file, and an output parent whose path contains a symlink component. Skip only
individual symlink cases when the operating system denies test symlink creation.
On non-Windows platforms, assert `stat.S_IMODE(path.stat().st_mode) & 0o077 == 0`
for every published file and directory.

- [ ] **Step 5: Verify and commit**

```powershell
.\.venv\Scripts\python.exe -m pytest apps/api/tests/test_recovery_cli.py -q
.\.venv\Scripts\python.exe -m ruff check apps/api/src/webdiag_api/recovery.py apps/api/tests/test_recovery_cli.py
git add -- apps/api/src/webdiag_api/recovery.py apps/api/tests/test_recovery_cli.py
git diff --cached --check
git commit -m "security(recovery): verify SQLite bundles strictly"
```

Expected: all recovery tests pass; Ruff and diff check are clean.

---

### Task 3: Restore candidate and operator CLI

**Files:**
- Modify: `apps/api/src/webdiag_api/recovery.py`
- Modify: `apps/api/tests/test_recovery_cli.py`

**Interfaces:**
- Produces `restore_bundle(*, backup_dir: Path, output_dir: Path) -> RecoveryManifest`.
- Produces `main(argv: Sequence[str] | None = None) -> int` with `backup`, `verify`, and `restore` subcommands.

- [ ] **Step 1: Write failing restore tests**

```python
from webdiag_api.recovery import restore_bundle


def test_restore_creates_independent_verified_candidate(tmp_path: Path) -> None:
    bundle = _create_bundle(tmp_path)
    original = {name: _digest(bundle / name) for name in (
        "accounts.sqlite3", "audits.sqlite3", "manifest.json"
    )}
    output = tmp_path / "restored"
    manifest = restore_bundle(backup_dir=bundle, output_dir=output)
    assert {item.name for item in output.iterdir()} == set(original)
    assert {name: _digest(bundle / name) for name in original} == original
    with sqlite3.connect(output / "accounts.sqlite3") as connection:
        assert connection.execute("SELECT value FROM records").fetchall() == [("account-row",)]
    assert manifest.contract_version == CONTRACT_VERSION


def test_invalid_restore_publishes_nothing(tmp_path: Path) -> None:
    bundle = _create_bundle(tmp_path)
    (bundle / "accounts.sqlite3").write_bytes(b"corrupt")
    output = tmp_path / "not-published"
    with pytest.raises(RecoveryError):
        restore_bundle(backup_dir=bundle, output_dir=output)
    assert not output.exists()
```

- [ ] **Step 2: Verify RED**

```powershell
.\.venv\Scripts\python.exe -m pytest apps/api/tests/test_recovery_cli.py -k "restore_" -q
```

Expected: collection fails because `restore_bundle` does not exist.

- [ ] **Step 3: Implement safe restore publication**

Implement `restore_bundle` to call `verify_bundle` first, copy each fixed file in
1 MiB byte chunks into a private staging sibling, apply mode `0o600`, run
`_verify_sqlite` on both copies, copy `manifest.json` bytes, call
`verify_bundle(staging)`, and only then rename staging to the absent output path.
Do not use metadata-preserving copy functions and never modify the source bundle.

- [ ] **Step 4: Write failing CLI boundary tests**

```python
from webdiag_api import recovery


def test_cli_reports_expected_failure_without_traceback(tmp_path: Path, capsys) -> None:
    bundle = _create_bundle(tmp_path)
    assert recovery.main(["verify", "--backup-dir", str(bundle)]) == 0
    assert capsys.readouterr().out == f"backup_verified={bundle}\n"
    (bundle / "accounts.sqlite3").write_bytes(b"private-row-content")
    assert recovery.main(["verify", "--backup-dir", str(bundle)]) == 2
    captured = capsys.readouterr()
    assert captured.out == ""
    assert "recovery_failed=" in captured.err
    assert "Traceback" not in captured.err
    assert "private-row-content" not in captured.err


def test_cli_backup_and_restore_success_messages(tmp_path: Path, capsys) -> None:
    account = _plain_database(tmp_path / "cli-accounts.sqlite3", "account-row")
    audit = _plain_database(tmp_path / "cli-audits.sqlite3", "audit-row")
    bundle = tmp_path / "cli-backup"
    assert recovery.main([
        "backup", "--account-database", str(account),
        "--audit-database", str(audit), "--output-dir", str(bundle),
    ]) == 0
    assert capsys.readouterr().out == f"backup_created={bundle}\n"
    restored = tmp_path / "cli-restored"
    assert recovery.main([
        "restore", "--backup-dir", str(bundle), "--output-dir", str(restored),
    ]) == 0
    assert capsys.readouterr().out == f"restore_created={restored}\n"


def test_cli_hides_unexpected_exception_details(monkeypatch, capsys) -> None:
    def fail(**_kwargs):
        raise RuntimeError("private database row and credentials")
    monkeypatch.setattr(recovery, "create_backup", fail)
    code = recovery.main([
        "backup", "--account-database", "a.sqlite3",
        "--audit-database", "b.sqlite3", "--output-dir", "backup",
    ])
    assert code == 1
    assert capsys.readouterr().err == "recovery_failed=unexpected recovery failure\n"
```

The monkeypatch only forces the otherwise nondeterministic unexpected-exception
boundary; storage behavior remains tested with real files.

- [ ] **Step 5: Implement CLI and error envelopes**

Add `_parser()` with exact design flags and implement:

```python
def main(argv: Sequence[str] | None = None) -> int:
    arguments = _parser().parse_args(argv)
    try:
        if arguments.command == "backup":
            create_backup(
                account_database=Path(arguments.account_database),
                audit_database=Path(arguments.audit_database),
                output_dir=Path(arguments.output_dir),
            )
            print(f"backup_created={arguments.output_dir}")
        elif arguments.command == "verify":
            verify_bundle(Path(arguments.backup_dir))
            print(f"backup_verified={arguments.backup_dir}")
        else:
            restore_bundle(
                backup_dir=Path(arguments.backup_dir),
                output_dir=Path(arguments.output_dir),
            )
            print(f"restore_created={arguments.output_dir}")
    except RecoveryError as error:
        print(f"recovery_failed={error}", file=sys.stderr)
        return 2
    except Exception:
        print("recovery_failed=unexpected recovery failure", file=sys.stderr)
        return 1
    return 0
```

Add `if __name__ == "__main__": raise SystemExit(main())`. Normalize expected
JSON, filesystem, and SQLite failures inside helpers; never print raw exceptions.
Add one test calling `main(["verify"])` and assert argparse raises
`SystemExit` with code `2`, which is the process exit for invalid arguments.
Add a separate restore test where the output directory already exists and assert
`RecoveryError("output directory must not exist")` without changing that directory.

- [ ] **Step 6: Verify and commit**

```powershell
.\.venv\Scripts\python.exe -m pytest apps/api/tests/test_recovery_cli.py -q
.\.venv\Scripts\python.exe -m ruff check apps/api/src/webdiag_api/recovery.py apps/api/tests/test_recovery_cli.py
git diff --check
git add -- apps/api/src/webdiag_api/recovery.py apps/api/tests/test_recovery_cli.py
git commit -m "feat(recovery): prepare safe SQLite restores"
```

Expected: the complete targeted recovery suite passes with clean Ruff/diff output.

---

### Task 4: Runbook and release evidence

**Files:**
- Modify: `docs/INSTALLATION.md`
- Modify: `docs/VERIFICATION.md`

**Interfaces:**
- Consumes the CLI and existing `docker-compose.account.override.yml`.
- Produces operator documentation backed by the real CLI tests; no runtime API changes.

- [ ] **Step 1: Write the operator runbook**

Change the full-stack command in `docs/INSTALLATION.md` to:

```text
docker compose -f docker-compose.yml -f docker-compose.account.override.yml up --build
```

Add exact backup/verify/restore commands and this sequence: online backup;
off-host copy; verify after transfer; restore to a new directory; stop API and
scheduler; switch both `WEBDIAG_*_DATABASE_PATH` values; start API; smoke-test
authentication, ownership, credits, monitoring, and one public audit read;
retain old databases until acceptance. State that the pair is not
cross-database atomic and `production S3 recovery: непроверено`. Do not invent a
provider, retention duration, RPO, RTO, deployment result, or live restore.
State that SHA-256 detects bundle changes but is not a signature, so backup
access control and off-host retention remain operator responsibilities.

- [ ] **Step 2: Review the runbook against verified behavior**

Compare every documented flag, filename, output line, exit code, and safety claim
with `apps/api/src/webdiag_api/recovery.py` and the already-green real CLI tests.
Human-facing prose does not receive a source-text assertion: such a test would
detect wording changes rather than recovery defects.

- [ ] **Step 3: Run one fresh affected-package verification**

```powershell
npm run test:python
npm run lint:python
git diff --check
```

Expected: full Python suite passes, Ruff is clean, and diff check is clean. Do
not rerun unchanged local Node/browser suites; the pushed GitHub Full
verification is the fresh repository-wide gate.

- [ ] **Step 4: Record observed evidence and commit**

Append `A12.5 staged SQLite recovery` to `docs/VERIFICATION.md` using the exact
counts and outputs observed in Step 5. State that no live/production restore ran
and production S3 recovery remains unverified. Do not pre-fill results.

```powershell
git add -- docs/INSTALLATION.md docs/VERIFICATION.md
git diff --cached --check
git commit -m "docs(recovery): add SQLite operator runbook"
```

- [ ] **Step 5: Push and verify Draft PR #3**

```powershell
git status --short --branch
git push origin feature/backend-production-readiness
gh pr view 3 --json isDraft,state,headRefName,baseRefName,headRefOid,url,statusCheckRollup
```

Require open Draft PR, head `feature/backend-production-readiness`, base
`recovery/a11.5-github-baseline`, and successful GitHub `Full verification` for
the new head SHA. Do not merge, release, deploy, tag, or change `main`.

---

## Final Acceptance Checklist

- [ ] Online backups preserve committed WAL-backed data from both sources.
- [ ] Bundle and restore publication are atomic at directory level.
- [ ] Manifest parsing is exact, versioned, traversal-safe, and content-free.
- [ ] Hash, SQLite integrity, and foreign-key checks fail closed.
- [ ] Symlinks and existing destinations are rejected.
- [ ] Restore creates a new candidate and never mutates backup or live files.
- [ ] CLI exits `0`, `2`, or `1` without traceback or sensitive details.
- [ ] Persistent compose invocation and offline cutover are documented against tested CLI behavior.
- [ ] Production S3 recovery remains explicitly unverified.
- [ ] Targeted tests, full Python, Ruff, diff check, and GitHub Full verification pass.
