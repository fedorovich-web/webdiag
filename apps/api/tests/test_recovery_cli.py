from __future__ import annotations

import hashlib
import json
import os
import sqlite3
import stat
from pathlib import Path

import pytest

import webdiag_api.recovery as recovery
from webdiag_api.recovery import (
    CONTRACT_VERSION,
    RecoveryError,
    create_backup,
    verify_bundle,
)


def _wal_database(path: Path, value: str) -> sqlite3.Connection:
    connection = sqlite3.connect(path)
    connection.execute("PRAGMA journal_mode = WAL")
    connection.execute("PRAGMA wal_autocheckpoint = 0")
    connection.execute(
        "CREATE TABLE records(id INTEGER PRIMARY KEY, value TEXT NOT NULL)"
    )
    connection.execute("INSERT INTO records(value) VALUES (?)", (value,))
    connection.commit()
    return connection


def _digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _plain_database(path: Path, value: str) -> Path:
    with sqlite3.connect(path) as connection:
        connection.execute(
            "CREATE TABLE records(id INTEGER PRIMARY KEY, value TEXT NOT NULL)"
        )
        connection.execute("INSERT INTO records(value) VALUES (?)", (value,))
    return path


def _create_bundle(tmp_path: Path) -> Path:
    account = _plain_database(
        tmp_path / "source-accounts.sqlite3", "account-row"
    )
    audit = _plain_database(tmp_path / "source-audits.sqlite3", "audit-row")
    bundle = tmp_path / "bundle"
    create_backup(
        account_database=account,
        audit_database=audit,
        output_dir=bundle,
    )
    return bundle


def _refresh_manifest_entry(bundle: Path, logical_name: str) -> None:
    manifest_path = bundle / "manifest.json"
    raw = json.loads(manifest_path.read_text(encoding="utf-8"))
    database_path = bundle / raw["databases"][logical_name]["filename"]
    raw["databases"][logical_name]["byte_size"] = database_path.stat().st_size
    raw["databases"][logical_name]["sha256"] = _digest(database_path)
    manifest_path.write_text(json.dumps(raw), encoding="utf-8")


def test_backup_uses_online_snapshots_and_writes_fixed_manifest(
    tmp_path: Path,
) -> None:
    account = tmp_path / "live-accounts.sqlite3"
    audit = tmp_path / "live-audits.sqlite3"
    account_connection = _wal_database(account, "account-row")
    audit_connection = _wal_database(audit, "audit-row")
    output = tmp_path / "backup"
    try:
        manifest = create_backup(
            account_database=account,
            audit_database=audit,
            output_dir=output,
        )
    finally:
        account_connection.close()
        audit_connection.close()

    assert {item.name for item in output.iterdir()} == {
        "accounts.sqlite3",
        "audits.sqlite3",
        "manifest.json",
    }
    with sqlite3.connect(output / "accounts.sqlite3") as connection:
        assert connection.execute("SELECT value FROM records").fetchall() == [
            ("account-row",)
        ]
    with sqlite3.connect(output / "audits.sqlite3") as connection:
        assert connection.execute("SELECT value FROM records").fetchall() == [
            ("audit-row",)
        ]

    manifest_text = (output / "manifest.json").read_text(encoding="utf-8")
    raw = json.loads(manifest_text)
    assert set(raw) == {"contract_version", "created_at", "databases"}
    assert raw["contract_version"] == CONTRACT_VERSION
    assert set(raw["databases"]) == {"account", "audit"}
    assert raw["databases"]["account"] == {
        "filename": "accounts.sqlite3",
        "byte_size": (output / "accounts.sqlite3").stat().st_size,
        "sha256": _digest(output / "accounts.sqlite3"),
    }
    assert raw["databases"]["audit"] == {
        "filename": "audits.sqlite3",
        "byte_size": (output / "audits.sqlite3").stat().st_size,
        "sha256": _digest(output / "audits.sqlite3"),
    }
    assert str(account) not in manifest_text
    assert str(audit) not in manifest_text
    assert manifest.contract_version == CONTRACT_VERSION


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
    with pytest.raises(
        RecoveryError, match="backup bundle contains unexpected files"
    ):
        verify_bundle(bundle)


def test_verify_rejects_corrupt_sqlite_with_matching_digest(
    tmp_path: Path,
) -> None:
    bundle = _create_bundle(tmp_path)
    database = bundle / "accounts.sqlite3"
    database.write_bytes(b"not a SQLite database")
    _refresh_manifest_entry(bundle, "account")

    with pytest.raises(RecoveryError, match="SQLite integrity verification failed"):
        verify_bundle(bundle)


def test_verify_rejects_foreign_key_violation_with_matching_digest(
    tmp_path: Path,
) -> None:
    bundle = _create_bundle(tmp_path)
    database = bundle / "accounts.sqlite3"
    with sqlite3.connect(database) as connection:
        connection.execute("CREATE TABLE parents(id INTEGER PRIMARY KEY)")
        connection.execute(
            "CREATE TABLE children("
            "id INTEGER PRIMARY KEY, "
            "parent_id INTEGER REFERENCES parents(id)"
            ")"
        )
        connection.execute("INSERT INTO children(parent_id) VALUES (404)")
    _refresh_manifest_entry(bundle, "account")

    with pytest.raises(
        RecoveryError, match="SQLite foreign-key verification failed"
    ):
        verify_bundle(bundle)


def test_failed_backup_removes_private_staging_and_output(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    account = _plain_database(tmp_path / "accounts.sqlite3", "account")
    audit = _plain_database(tmp_path / "audits.sqlite3", "audit")
    output = tmp_path / "failed-backup"

    def fail_backup(source: Path, destination: Path) -> None:
        del source, destination
        raise RecoveryError("SQLite backup failed")

    monkeypatch.setattr(recovery, "_sqlite_backup", fail_backup)

    with pytest.raises(RecoveryError, match="SQLite backup failed"):
        create_backup(
            account_database=account,
            audit_database=audit,
            output_dir=output,
        )

    assert not output.exists()
    assert not list(tmp_path.glob(".failed-backup.recovery-*"))


def test_backup_rejects_existing_output_without_changing_it(tmp_path: Path) -> None:
    account = _plain_database(tmp_path / "accounts.sqlite3", "account")
    audit = _plain_database(tmp_path / "audits.sqlite3", "audit")
    output = tmp_path / "existing"
    output.mkdir()
    sentinel = output / "keep.txt"
    sentinel.write_text("keep", encoding="utf-8")

    with pytest.raises(RecoveryError, match="output directory must not exist"):
        create_backup(
            account_database=account,
            audit_database=audit,
            output_dir=output,
        )

    assert sentinel.read_text(encoding="utf-8") == "keep"


def test_backup_rejects_identical_sources(tmp_path: Path) -> None:
    database = _plain_database(tmp_path / "database.sqlite3", "row")

    with pytest.raises(RecoveryError, match="source databases must be distinct"):
        create_backup(
            account_database=database,
            audit_database=database,
            output_dir=tmp_path / "backup",
        )


@pytest.mark.parametrize("invalid_kind", ["missing", "directory"])
def test_backup_rejects_missing_or_non_file_source(
    tmp_path: Path,
    invalid_kind: str,
) -> None:
    invalid = tmp_path / "invalid"
    if invalid_kind == "directory":
        invalid.mkdir()
    audit = _plain_database(tmp_path / "audits.sqlite3", "audit")

    with pytest.raises(RecoveryError, match="source database is unavailable"):
        create_backup(
            account_database=invalid,
            audit_database=audit,
            output_dir=tmp_path / "backup",
        )


def test_verify_rejects_symlinked_bundle_file(tmp_path: Path) -> None:
    bundle = _create_bundle(tmp_path)
    database = bundle / "accounts.sqlite3"
    external = tmp_path / "external.sqlite3"
    database.replace(external)
    try:
        database.symlink_to(external)
    except OSError as error:
        pytest.skip(f"file symlinks are unavailable: {error}")

    with pytest.raises(RecoveryError, match="backup file is unavailable"):
        verify_bundle(bundle)


def test_backup_rejects_symlinked_output_parent(tmp_path: Path) -> None:
    account = _plain_database(tmp_path / "accounts.sqlite3", "account")
    audit = _plain_database(tmp_path / "audits.sqlite3", "audit")
    real_parent = tmp_path / "real-parent"
    real_parent.mkdir()
    linked_parent = tmp_path / "linked-parent"
    try:
        linked_parent.symlink_to(real_parent, target_is_directory=True)
    except OSError as error:
        pytest.skip(f"directory symlinks are unavailable: {error}")

    with pytest.raises(RecoveryError, match="output parent is invalid"):
        create_backup(
            account_database=account,
            audit_database=audit,
            output_dir=linked_parent / "backup",
        )


@pytest.mark.skipif(os.name == "nt", reason="POSIX permission bits are unavailable")
def test_backup_uses_private_permissions(tmp_path: Path) -> None:
    bundle = _create_bundle(tmp_path)

    assert stat.S_IMODE(bundle.stat().st_mode) == 0o700
    for filename in ("accounts.sqlite3", "audits.sqlite3", "manifest.json"):
        assert stat.S_IMODE((bundle / filename).stat().st_mode) == 0o600
