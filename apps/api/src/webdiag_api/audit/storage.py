from __future__ import annotations

import hashlib
import hmac
import sqlite3
import threading
from pathlib import Path
from typing import TYPE_CHECKING
from uuid import UUID

from pydantic import ValidationError

from webdiag_api.audit.models import AuditJob, AuditRun

if TYPE_CHECKING:
    from webdiag_api.audit.service import AuditSnapshot


class AuditStoreIntegrityError(RuntimeError):
    """Persisted audit data failed its schema or digest check."""


def _payload(model: AuditJob | AuditRun) -> tuple[str, str]:
    payload = model.model_dump_json()
    return payload, hashlib.sha256(payload.encode("utf-8")).hexdigest()


class SqliteAuditStore:
    def __init__(self, database_path: str, *, history_limit: int = 1_000) -> None:
        if not 1 <= history_limit <= 100_000:
            raise ValueError("audit history limit is outside the allowed range")
        self._path = Path(database_path)
        self._history_limit = history_limit
        self._schema_lock = threading.Lock()
        self._schema_ready = False

    def _connect(self) -> sqlite3.Connection:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self._path, timeout=10, isolation_level=None)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA journal_mode = WAL")
        connection.execute("PRAGMA busy_timeout = 10000")
        return connection

    def ensure_schema(self) -> None:
        if self._schema_ready:
            return
        with self._schema_lock:
            if self._schema_ready:
                return
            with self._connect() as connection:
                connection.executescript(
                    """
                    CREATE TABLE IF NOT EXISTS audit_jobs (
                        job_id TEXT PRIMARY KEY,
                        created_at TEXT NOT NULL,
                        payload_json TEXT NOT NULL,
                        payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256) = 64)
                    );
                    CREATE INDEX IF NOT EXISTS audit_jobs_created_at_idx
                        ON audit_jobs(created_at DESC, job_id DESC);
                    CREATE TABLE IF NOT EXISTS audit_runs (
                        run_id TEXT PRIMARY KEY,
                        job_id TEXT NOT NULL UNIQUE,
                        payload_json TEXT NOT NULL,
                        payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256) = 64),
                        FOREIGN KEY(job_id) REFERENCES audit_jobs(job_id) ON DELETE CASCADE
                    );
                    """
                )
            self._schema_ready = True

    def save_job(self, job: AuditJob) -> AuditJob:
        self.ensure_schema()
        payload, digest = _payload(job)
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            self._upsert_job(connection, job, payload, digest)
            self._prune(connection)
            connection.execute("COMMIT")
        return job

    def save_run(self, run: AuditRun) -> AuditRun:
        self.ensure_schema()
        payload, digest = _payload(run)
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            self._upsert_run(connection, run, payload, digest)
            connection.execute("COMMIT")
        return run

    def save_snapshot(self, job: AuditJob, run: AuditRun) -> None:
        self.ensure_schema()
        job_payload, job_digest = _payload(job)
        run_payload, run_digest = _payload(run)
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            self._upsert_job(connection, job, job_payload, job_digest)
            self._upsert_run(connection, run, run_payload, run_digest)
            self._prune(connection)
            connection.execute("COMMIT")

    def get_snapshot(self, job_id: UUID) -> AuditSnapshot | None:
        from webdiag_api.audit.service import AuditSnapshot

        self.ensure_schema()
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT j.payload_json AS job_payload, j.payload_sha256 AS job_digest,
                       r.payload_json AS run_payload, r.payload_sha256 AS run_digest
                FROM audit_jobs AS j
                LEFT JOIN audit_runs AS r ON r.job_id = j.job_id
                WHERE j.job_id = ?
                """,
                (str(job_id),),
            ).fetchone()
        if row is None:
            return None
        try:
            self._verify(str(row["job_payload"]), str(row["job_digest"]))
            job = AuditJob.model_validate_json(str(row["job_payload"]), strict=True)
            run = None
            if row["run_payload"] is not None:
                self._verify(str(row["run_payload"]), str(row["run_digest"]))
                run = AuditRun.model_validate_json(str(row["run_payload"]), strict=True)
        except (ValidationError, ValueError) as error:
            raise AuditStoreIntegrityError("persisted audit data is invalid") from error
        return AuditSnapshot(job=job, run=run)

    @staticmethod
    def _verify(payload: str, expected: str) -> None:
        actual = hashlib.sha256(payload.encode("utf-8")).hexdigest()
        if not hmac.compare_digest(actual, expected):
            raise AuditStoreIntegrityError("persisted audit digest does not match")

    @staticmethod
    def _upsert_job(
        connection: sqlite3.Connection, job: AuditJob, payload: str, digest: str
    ) -> None:
        connection.execute(
            """
            INSERT INTO audit_jobs(job_id, created_at, payload_json, payload_sha256)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(job_id) DO UPDATE SET
                created_at = excluded.created_at,
                payload_json = excluded.payload_json,
                payload_sha256 = excluded.payload_sha256
            """,
            (str(job.job_id), job.created_at.isoformat(), payload, digest),
        )

    @staticmethod
    def _upsert_run(
        connection: sqlite3.Connection, run: AuditRun, payload: str, digest: str
    ) -> None:
        connection.execute(
            """
            INSERT INTO audit_runs(run_id, job_id, payload_json, payload_sha256)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(job_id) DO UPDATE SET
                run_id = excluded.run_id,
                payload_json = excluded.payload_json,
                payload_sha256 = excluded.payload_sha256
            """,
            (str(run.run_id), str(run.job_id), payload, digest),
        )

    def _prune(self, connection: sqlite3.Connection) -> None:
        connection.execute(
            """
            DELETE FROM audit_jobs
            WHERE job_id IN (
                SELECT job_id FROM audit_jobs
                ORDER BY created_at DESC, job_id DESC
                LIMIT -1 OFFSET ?
            )
            """,
            (self._history_limit,),
        )
