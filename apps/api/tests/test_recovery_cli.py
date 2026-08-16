from __future__ import annotations

import hashlib
import json
import sqlite3
from pathlib import Path

from webdiag_api.recovery import CONTRACT_VERSION, create_backup


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
