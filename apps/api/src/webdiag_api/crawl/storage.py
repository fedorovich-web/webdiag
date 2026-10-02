from __future__ import annotations

import hashlib
import hmac
import json
import secrets
import sqlite3
import threading
import time
import uuid
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

from pydantic import ValidationError

from webdiag_api.crawl.models import CrawlResult, SiteAuditResult, StoredCrawlResult

CRAWL_STATES = ("queued", "running", "succeeded", "failed")


class CrawlIntegrityError(RuntimeError):
    pass


class CrawlLeaseLostError(RuntimeError):
    pass


class CrawlUserLimitError(RuntimeError):
    """The account already has the maximum active crawl jobs."""


class CrawlQueueCapacityError(RuntimeError):
    """The bounded global crawl queue has no capacity for another job."""


class CrawlResultTooLargeError(RuntimeError):
    """A crawl result exceeded the persisted result boundary."""


@dataclass(frozen=True, slots=True)
class StoredCrawlJob:
    id: str
    user_id: str
    project_id: str
    origin: str
    state: str
    result_json: str | None
    result_sha256: str | None
    public_error_code: str | None
    created_at: int
    updated_at: int

    def result(self) -> StoredCrawlResult | None:
        if self.result_json is None:
            return None
        if self.result_sha256 is None:
            raise CrawlIntegrityError("crawl result digest is missing")
        actual = hashlib.sha256(self.result_json.encode()).hexdigest()
        if not hmac.compare_digest(actual, self.result_sha256):
            raise CrawlIntegrityError("crawl result digest does not match")
        try:
            envelope = json.loads(self.result_json)
            if not isinstance(envelope, dict):
                raise ValueError("crawl result envelope is invalid")
            contract_version = envelope.get("contract_version")
            if contract_version == "webdiag.crawl.result.v1":
                result: StoredCrawlResult = CrawlResult.model_validate_json(
                    self.result_json, strict=True
                )
            elif contract_version == "webdiag.site_audit.result.v1":
                result = SiteAuditResult.model_validate_json(self.result_json, strict=True)
            else:
                raise ValueError("crawl result contract is unsupported")
        except (json.JSONDecodeError, ValidationError, ValueError) as error:
            raise CrawlIntegrityError("persisted crawl result is invalid") from error
        if result.origin != self.origin:
            raise CrawlIntegrityError("crawl result origin does not match job")
        return result


@dataclass(frozen=True, slots=True)
class StoredCrawlClaim:
    job: StoredCrawlJob
    attempt_number: int
    lease_token: str
    lease_expires_at: int


class SqliteCrawlStore:
    def __init__(
        self,
        database_path: str,
        *,
        lease_seconds: int = 120,
        active_job_limit_per_user: int = 2,
        active_job_limit_global: int = 25,
        clock: Callable[[], int] = lambda: int(time.time()),
    ) -> None:
        if not 30 <= lease_seconds <= 300:
            raise ValueError("crawl lease seconds must be between 30 and 300")
        if not 1 <= active_job_limit_per_user <= 20:
            raise ValueError("crawl active job limit per user must be between 1 and 20")
        if not active_job_limit_per_user <= active_job_limit_global <= 1_000:
            raise ValueError(
                "crawl global active job limit must be between the per-user limit and 1000"
            )
        self._path = Path(database_path)
        self._lease_seconds = lease_seconds
        self._active_job_limit_per_user = active_job_limit_per_user
        self._active_job_limit_global = active_job_limit_global
        self._clock = clock
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
                    f"""
                    CREATE TABLE IF NOT EXISTS crawl_jobs (
                        id TEXT PRIMARY KEY CHECK(length(id) = 36),
                        user_id TEXT NOT NULL,
                        project_id TEXT NOT NULL,
                        origin TEXT NOT NULL,
                        state TEXT NOT NULL CHECK(state IN {CRAWL_STATES}),
                        result_json TEXT,
                        result_sha256 TEXT CHECK(
                            result_sha256 IS NULL OR length(result_sha256) = 64
                        ),
                        public_error_code TEXT,
                        created_at INTEGER NOT NULL,
                        updated_at INTEGER NOT NULL,
                        FOREIGN KEY(user_id) REFERENCES account_users(id) ON DELETE CASCADE,
                        FOREIGN KEY(project_id) REFERENCES account_workspace_projects(id)
                            ON DELETE CASCADE,
                        CHECK((result_json IS NULL) = (result_sha256 IS NULL))
                    );
                    CREATE UNIQUE INDEX IF NOT EXISTS crawl_jobs_one_active_project_idx
                        ON crawl_jobs(project_id) WHERE state IN ('queued', 'running');
                    CREATE INDEX IF NOT EXISTS crawl_jobs_owner_created_idx
                        ON crawl_jobs(user_id, project_id, created_at DESC, id DESC);
                    CREATE TABLE IF NOT EXISTS crawl_job_attempts (
                        job_id TEXT NOT NULL,
                        attempt_number INTEGER NOT NULL CHECK(attempt_number > 0),
                        lease_token_hash TEXT NOT NULL CHECK(length(lease_token_hash) = 64),
                        lease_expires_at INTEGER NOT NULL,
                        created_at INTEGER NOT NULL,
                        completed_at INTEGER,
                        PRIMARY KEY(job_id, attempt_number),
                        FOREIGN KEY(job_id) REFERENCES crawl_jobs(id) ON DELETE CASCADE
                    );
                    CREATE INDEX IF NOT EXISTS crawl_job_attempts_lease_idx
                        ON crawl_job_attempts(lease_expires_at, job_id);
                    """
                )
            self._schema_ready = True

    def create_job(self, *, user_id: str, project_id: str) -> StoredCrawlJob:
        self.ensure_schema()
        now = self._clock()
        job_id = str(uuid.uuid4())
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            owned = connection.execute(
                """
                SELECT origin FROM account_workspace_projects
                WHERE id = ? AND user_id = ? AND archived_at IS NULL
                """,
                (project_id, user_id),
            ).fetchone()
            if owned is None:
                connection.execute("ROLLBACK")
                raise ValueError("account_project_not_found")
            origin = str(owned["origin"])
            project_active = connection.execute(
                """
                SELECT 1 FROM crawl_jobs
                WHERE project_id = ? AND state IN ('queued', 'running')
                """,
                (project_id,),
            ).fetchone()
            if project_active is not None:
                connection.execute("ROLLBACK")
                raise ValueError("crawl_job_active_exists")
            user_active = int(
                connection.execute(
                    """
                    SELECT COUNT(*) FROM crawl_jobs
                    WHERE user_id = ? AND state IN ('queued', 'running')
                    """,
                    (user_id,),
                ).fetchone()[0]
            )
            if user_active >= self._active_job_limit_per_user:
                connection.execute("ROLLBACK")
                raise CrawlUserLimitError
            global_active = int(
                connection.execute(
                    "SELECT COUNT(*) FROM crawl_jobs WHERE state IN ('queued', 'running')"
                ).fetchone()[0]
            )
            if global_active >= self._active_job_limit_global:
                connection.execute("ROLLBACK")
                raise CrawlQueueCapacityError
            try:
                connection.execute(
                    """
                    INSERT INTO crawl_jobs(
                        id, user_id, project_id, origin, state, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, 'queued', ?, ?)
                    """,
                    (job_id, user_id, project_id, origin, now, now),
                )
            except sqlite3.IntegrityError as error:
                connection.execute("ROLLBACK")
                raise ValueError("crawl_job_active_exists") from error
            row = connection.execute("SELECT * FROM crawl_jobs WHERE id = ?", (job_id,)).fetchone()
            connection.execute("COMMIT")
        return self._job(row)

    def list_jobs(
        self, *, user_id: str, project_id: str, limit: int = 20
    ) -> tuple[StoredCrawlJob, ...]:
        if not 1 <= limit <= 50:
            raise ValueError("crawl job list limit must be between 1 and 50")
        self.ensure_schema()
        with self._connect() as connection:
            owned = connection.execute(
                """
                SELECT 1 FROM account_workspace_projects
                WHERE id = ? AND user_id = ? AND archived_at IS NULL
                """,
                (project_id, user_id),
            ).fetchone()
            if owned is None:
                raise ValueError("account_project_not_found")
            rows = connection.execute(
                """
                SELECT * FROM crawl_jobs
                WHERE user_id = ? AND project_id = ?
                ORDER BY created_at DESC, rowid DESC LIMIT ?
                """,
                (user_id, project_id, limit),
            ).fetchall()
        jobs = tuple(self._job(row) for row in rows)
        for job in jobs:
            job.result()
        return jobs

    def claim_pending(self, *, now: int | None = None) -> StoredCrawlClaim | None:
        self.ensure_schema()
        current = self._clock() if now is None else now
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                """
                SELECT j.* FROM crawl_jobs AS j
                LEFT JOIN crawl_job_attempts AS a
                    ON a.job_id = j.id AND a.attempt_number = (
                        SELECT MAX(latest.attempt_number)
                        FROM crawl_job_attempts AS latest WHERE latest.job_id = j.id
                    )
                WHERE j.state = 'queued'
                    OR (j.state = 'running' AND a.lease_expires_at <= ?)
                ORDER BY j.created_at ASC, j.id ASC LIMIT 1
                """,
                (current,),
            ).fetchone()
            if row is None:
                connection.execute("ROLLBACK")
                return None
            attempt = int(
                connection.execute(
                    """
                    SELECT COALESCE(MAX(attempt_number), 0) + 1
                    FROM crawl_job_attempts WHERE job_id = ?
                    """,
                    (row["id"],),
                ).fetchone()[0]
            )
            expires = current + self._lease_seconds
            connection.execute(
                """
                INSERT INTO crawl_job_attempts(
                    job_id, attempt_number, lease_token_hash, lease_expires_at, created_at
                ) VALUES (?, ?, ?, ?, ?)
                """,
                (row["id"], attempt, token_hash, expires, current),
            )
            connection.execute(
                "UPDATE crawl_jobs SET state = 'running', updated_at = ? WHERE id = ?",
                (current, row["id"]),
            )
            claimed = connection.execute(
                "SELECT * FROM crawl_jobs WHERE id = ?", (row["id"],)
            ).fetchone()
            connection.execute("COMMIT")
        return StoredCrawlClaim(self._job(claimed), attempt, token, expires)

    def complete_job(
        self,
        *,
        job_id: str,
        lease_token: str,
        result: StoredCrawlResult,
        now: int | None = None,
    ) -> StoredCrawlJob:
        current = self._clock() if now is None else now
        payload = result.model_dump_json()
        if len(payload.encode()) > 2_000_000:
            raise CrawlResultTooLargeError
        digest = hashlib.sha256(payload.encode()).hexdigest()
        token_hash = hashlib.sha256(lease_token.encode()).hexdigest()
        self.ensure_schema()
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            attempt = self._current_attempt(connection, job_id, token_hash, current)
            job = connection.execute("SELECT * FROM crawl_jobs WHERE id = ?", (job_id,)).fetchone()
            if job is None or result.origin != str(job["origin"]):
                connection.execute("ROLLBACK")
                raise CrawlIntegrityError("crawl result origin does not match job")
            connection.execute(
                """
                UPDATE crawl_jobs SET state = 'succeeded', result_json = ?,
                    result_sha256 = ?, public_error_code = NULL, updated_at = ?
                WHERE id = ? AND state = 'running'
                """,
                (payload, digest, current, job_id),
            )
            connection.execute(
                """
                UPDATE crawl_job_attempts SET completed_at = ?
                WHERE job_id = ? AND attempt_number = ?
                """,
                (current, job_id, attempt["attempt_number"]),
            )
            completed = connection.execute(
                "SELECT * FROM crawl_jobs WHERE id = ?", (job_id,)
            ).fetchone()
            connection.execute("COMMIT")
        return self._job(completed)

    def fail_job(
        self, *, job_id: str, lease_token: str, error_code: str, now: int | None = None
    ) -> StoredCrawlJob:
        if not error_code or len(error_code) > 120:
            raise ValueError("crawl error code is invalid")
        current = self._clock() if now is None else now
        token_hash = hashlib.sha256(lease_token.encode()).hexdigest()
        self.ensure_schema()
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            attempt = self._current_attempt(connection, job_id, token_hash, current)
            connection.execute(
                """
                UPDATE crawl_jobs SET state = 'failed', public_error_code = ?, updated_at = ?
                WHERE id = ? AND state = 'running'
                """,
                (error_code, current, job_id),
            )
            connection.execute(
                """
                UPDATE crawl_job_attempts SET completed_at = ?
                WHERE job_id = ? AND attempt_number = ?
                """,
                (current, job_id, attempt["attempt_number"]),
            )
            row = connection.execute("SELECT * FROM crawl_jobs WHERE id = ?", (job_id,)).fetchone()
            connection.execute("COMMIT")
        return self._job(row)

    def get_job(
        self, *, user_id: str, project_id: str, job_id: str
    ) -> StoredCrawlJob | None:
        self.ensure_schema()
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM crawl_jobs WHERE id = ? AND user_id = ? AND project_id = ?",
                (job_id, user_id, project_id),
            ).fetchone()
        if row is None:
            return None
        job = self._job(row)
        job.result()
        return job

    @staticmethod
    def _current_attempt(
        connection: sqlite3.Connection, job_id: str, token_hash: str, now: int
    ) -> sqlite3.Row:
        attempt = connection.execute(
            """
            SELECT * FROM crawl_job_attempts WHERE job_id = ?
            ORDER BY attempt_number DESC LIMIT 1
            """,
            (job_id,),
        ).fetchone()
        if (
            attempt is None
            or attempt["completed_at"] is not None
            or int(attempt["lease_expires_at"]) <= now
            or not hmac.compare_digest(str(attempt["lease_token_hash"]), token_hash)
        ):
            connection.execute("ROLLBACK")
            raise CrawlLeaseLostError
        return attempt

    @staticmethod
    def _job(row: sqlite3.Row) -> StoredCrawlJob:
        return StoredCrawlJob(
            id=str(row["id"]), user_id=str(row["user_id"]),
            project_id=str(row["project_id"]), origin=str(row["origin"]),
            state=str(row["state"]), result_json=row["result_json"],
            result_sha256=row["result_sha256"], public_error_code=row["public_error_code"],
            created_at=int(row["created_at"]), updated_at=int(row["updated_at"]),
        )
