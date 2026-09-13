from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import re
import shutil
import sqlite3
import sys
import tempfile
from collections.abc import Iterator, Sequence
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


def _immutable_connection(path: Path) -> sqlite3.Connection:
    uri = f"{path.resolve(strict=True).as_uri()}?mode=ro&immutable=1"
    return sqlite3.connect(uri, uri=True)


def _verify_sqlite(path: Path) -> None:
    try:
        with closing(_immutable_connection(path)) as connection:
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


def _require_bundle_directory(path: Path) -> Path:
    try:
        if path.is_symlink() or not path.is_dir():
            raise RecoveryError("backup directory is unavailable")
        return path.resolve(strict=True)
    except (OSError, RuntimeError) as error:
        raise RecoveryError("backup directory is unavailable") from error


def _require_regular_non_symlink(path: Path, *, label: str) -> Path:
    try:
        if path.is_symlink() or not path.is_file():
            raise RecoveryError(f"{label} is unavailable")
        return path
    except OSError as error:
        raise RecoveryError(f"{label} is unavailable") from error


def _load_manifest(path: Path) -> RecoveryManifest:
    try:
        _require_regular_non_symlink(path, label="backup manifest")
        raw = json.loads(path.read_text(encoding="utf-8"))
        if type(raw) is not dict or set(raw) != {
            "contract_version",
            "created_at",
            "databases",
        }:
            raise RecoveryError("backup manifest is invalid")
        if raw["contract_version"] != CONTRACT_VERSION:
            raise RecoveryError("backup manifest is invalid")
        created_at = raw["created_at"]
        if type(created_at) is not str or not created_at.endswith("Z"):
            raise RecoveryError("backup manifest is invalid")
        parsed_timestamp = datetime.fromisoformat(f"{created_at[:-1]}+00:00")
        if "T" not in created_at or parsed_timestamp.utcoffset() != UTC.utcoffset(None):
            raise RecoveryError("backup manifest is invalid")
        databases = raw["databases"]
        if type(databases) is not dict or set(databases) != set(DATABASE_FILENAMES):
            raise RecoveryError("backup manifest is invalid")
        entries: dict[str, DatabaseManifest] = {}
        for logical_name, expected_filename in DATABASE_FILENAMES.items():
            entry = databases[logical_name]
            if type(entry) is not dict or set(entry) != {
                "filename",
                "byte_size",
                "sha256",
            }:
                raise RecoveryError("backup manifest is invalid")
            filename = entry["filename"]
            byte_size = entry["byte_size"]
            sha256 = entry["sha256"]
            if (
                filename != expected_filename
                or type(byte_size) is not int
                or byte_size < 0
                or type(sha256) is not str
                or re.fullmatch(r"[0-9a-f]{64}", sha256) is None
            ):
                raise RecoveryError("backup manifest is invalid")
            entries[logical_name] = DatabaseManifest(
                filename=filename,
                byte_size=byte_size,
                sha256=sha256,
            )
        return RecoveryManifest(
            contract_version=CONTRACT_VERSION,
            created_at=created_at,
            databases=entries,
        )
    except RecoveryError:
        raise
    except (KeyError, OSError, TypeError, ValueError, json.JSONDecodeError) as error:
        raise RecoveryError("backup manifest is invalid") from error


def verify_bundle(backup_dir: Path) -> RecoveryManifest:
    directory = _require_bundle_directory(Path(backup_dir))
    expected_files = {*DATABASE_FILENAMES.values(), "manifest.json"}
    try:
        if {item.name for item in directory.iterdir()} != expected_files:
            raise RecoveryError("backup bundle contains unexpected files")
    except OSError as error:
        raise RecoveryError("backup directory is unavailable") from error
    manifest = _load_manifest(directory / "manifest.json")
    for logical_name, expected_filename in DATABASE_FILENAMES.items():
        entry = manifest.databases[logical_name]
        if entry.filename != expected_filename:
            raise RecoveryError("backup manifest is invalid")
        path = _require_regular_non_symlink(
            directory / expected_filename,
            label="backup file",
        )
        try:
            digest_matches = hmac.compare_digest(_sha256(path), entry.sha256)
            size_matches = path.stat().st_size == entry.byte_size
        except OSError as error:
            raise RecoveryError("backup file is unavailable") from error
        if not size_matches or not digest_matches:
            raise RecoveryError("backup file digest does not match")
        _verify_sqlite(path)
    return manifest


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


def _copy_recovery_file(source: Path, destination: Path) -> None:
    try:
        with source.open("rb") as source_stream, destination.open(
            "xb"
        ) as destination_stream:
            while chunk := source_stream.read(1024 * 1024):
                destination_stream.write(chunk)
        os.chmod(destination, 0o600)
    except OSError as error:
        raise RecoveryError("restore copy failed") from error


def restore_bundle(
    *,
    backup_dir: Path,
    output_dir: Path,
) -> RecoveryManifest:
    source = _require_bundle_directory(Path(backup_dir))
    verify_bundle(source)
    output = Path(output_dir)
    with _private_staging_directory(output) as staging:
        for filename in DATABASE_FILENAMES.values():
            destination = staging / filename
            _copy_recovery_file(source / filename, destination)
            _verify_sqlite(destination)
        _copy_recovery_file(source / "manifest.json", staging / "manifest.json")
        manifest = verify_bundle(staging)
        try:
            staging.rename(output)
        except OSError as error:
            raise RecoveryError("restore candidate could not be published") from error
    return manifest


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Create and verify staged WebDiag SQLite recovery bundles."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    backup = subparsers.add_parser("backup", help="create a verified backup")
    backup.add_argument("--account-database", required=True)
    backup.add_argument("--audit-database", required=True)
    backup.add_argument("--output-dir", required=True)

    verify = subparsers.add_parser("verify", help="verify a backup bundle")
    verify.add_argument("--backup-dir", required=True)

    restore = subparsers.add_parser(
        "restore", help="prepare a verified restore candidate"
    )
    restore.add_argument("--backup-dir", required=True)
    restore.add_argument("--output-dir", required=True)
    return parser


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
        print(
            "recovery_failed=unexpected recovery failure",
            file=sys.stderr,
        )
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
