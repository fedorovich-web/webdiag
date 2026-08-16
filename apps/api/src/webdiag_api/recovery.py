from __future__ import annotations

import hashlib
import json
import os
import shutil
import sqlite3
import tempfile
from collections.abc import Iterator
from contextlib import closing, contextmanager
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from pathlib import Path

CONTRACT_VERSION = "webdiag.sqlite-recovery.v1"
DATABASE_FILENAMES = {
    "account": "accounts.sqlite3",
    "audit": "audits.sqlite3",
}


class RecoveryError(RuntimeError):
    """A recovery operation failed without exposing persisted content."""


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


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        while chunk := stream.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def _read_only_connection(path: Path) -> sqlite3.Connection:
    uri = f"{path.resolve(strict=True).as_uri()}?mode=ro"
    return sqlite3.connect(uri, uri=True)


def _verify_sqlite(path: Path) -> None:
    try:
        with closing(_read_only_connection(path)) as connection:
            integrity = connection.execute("PRAGMA integrity_check").fetchall()
            if integrity != [("ok",)]:
                raise RecoveryError("SQLite integrity verification failed")
            if connection.execute("PRAGMA foreign_key_check").fetchall():
                raise RecoveryError("SQLite foreign-key verification failed")
    except RecoveryError:
        raise
    except (OSError, sqlite3.Error, ValueError) as error:
        raise RecoveryError("SQLite integrity verification failed") from error


def _require_source(path: Path) -> Path:
    try:
        if path.is_symlink() or not path.is_file():
            raise RecoveryError("source database is unavailable")
        return path.resolve(strict=True)
    except (OSError, RuntimeError) as error:
        raise RecoveryError("source database is unavailable") from error


def _validate_sources(sources: dict[str, Path]) -> dict[str, Path]:
    resolved = {name: _require_source(path) for name, path in sources.items()}
    if resolved["account"] == resolved["audit"]:
        raise RecoveryError("source databases must be distinct")
    return resolved


def _validate_output(output_dir: Path) -> None:
    if output_dir.exists() or output_dir.is_symlink():
        raise RecoveryError("output directory must not exist")
    parent = output_dir.absolute().parent
    if not parent.is_dir():
        raise RecoveryError("output parent is invalid")
    if any(candidate.is_symlink() for candidate in (parent, *parent.parents)):
        raise RecoveryError("output parent is invalid")


@contextmanager
def _private_staging_directory(output_dir: Path) -> Iterator[Path]:
    _validate_output(output_dir)
    try:
        staging = Path(
            tempfile.mkdtemp(
                prefix=f".{output_dir.name}.recovery-",
                dir=output_dir.absolute().parent,
            )
        )
        os.chmod(staging, 0o700)
    except OSError as error:
        raise RecoveryError("recovery staging directory is unavailable") from error
    try:
        yield staging
    finally:
        if staging.exists():
            shutil.rmtree(staging)


def _sqlite_backup(source: Path, destination: Path) -> None:
    try:
        with closing(_read_only_connection(source)) as source_connection, closing(
            sqlite3.connect(destination)
        ) as destination_connection:
            source_connection.backup(destination_connection)
            journal_mode = destination_connection.execute(
                "PRAGMA journal_mode = DELETE"
            ).fetchone()
            if journal_mode != ("delete",):
                raise RecoveryError("SQLite backup failed")
        os.chmod(destination, 0o600)
        _verify_sqlite(destination)
    except RecoveryError:
        raise
    except (OSError, sqlite3.Error, ValueError) as error:
        raise RecoveryError("SQLite backup failed") from error


def _write_manifest(directory: Path, manifest: RecoveryManifest) -> None:
    path = directory / "manifest.json"
    try:
        path.write_text(
            json.dumps(
                asdict(manifest),
                ensure_ascii=True,
                separators=(",", ":"),
                sort_keys=True,
            ),
            encoding="utf-8",
        )
        os.chmod(path, 0o600)
    except OSError as error:
        raise RecoveryError("backup manifest could not be written") from error


def create_backup(
    *,
    account_database: Path,
    audit_database: Path,
    output_dir: Path,
) -> RecoveryManifest:
    sources = _validate_sources(
        {
            "account": Path(account_database),
            "audit": Path(audit_database),
        }
    )
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
        try:
            staging.rename(output)
        except OSError as error:
            raise RecoveryError("backup bundle could not be published") from error
    return manifest
