from __future__ import annotations

import hashlib
import hmac
import sqlite3
import threading
import time
import uuid
from dataclasses import dataclass, replace
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from pydantic import ValidationError

from webdiag_api.accounts.models import utc_datetime
from webdiag_api.accounts.monitoring_models import (
    CADENCE_SECONDS,
    AccountMonitor,
    MonitorChange,
    MonitorRun,
)
from webdiag_api.accounts.workspace_models import SavedAuditPayload
from webdiag_api.accounts.workspace_storage import SqliteWorkspaceStore

MAX_MONITOR_RUNS = 100
MONITOR_LEASE_SECONDS = 900


class MonitorRunIntegrityError(RuntimeError):
    """Persisted monitoring baseline failed its schema or digest check."""


def _payload_digest(payload_json: str) -> str:
    return hashlib.sha256(payload_json.encode("utf-8")).hexdigest()


def _lease_digest(lease_token: str | None) -> str:
    if lease_token is None:
        return ""
    return hashlib.sha256(lease_token.encode("utf-8")).hexdigest()


def _next_scheduled_run(
    cadence: str,
    timezone: str,
    *,
    after: int,
    previous: int | None = None,
) -> int:
    if previous is not None and previous > after:
        return previous
    interval = CADENCE_SECONDS[cadence]
    if cadence not in {"daily", "weekly"}:
        anchor = previous if previous is not None else after
        return anchor + (((after - anchor) // interval) + 1) * interval

    zone = ZoneInfo(timezone)
    anchor = datetime.fromtimestamp(previous if previous is not None else after, tz=zone)
    step = timedelta(days=1 if cadence == "daily" else 7)
    candidate = anchor + step
    while candidate.timestamp() <= after:
        candidate += step
    return int(candidate.timestamp())


def _validated_payload(
    payload_json: str,
    payload_sha256: str | None,
    *,
    score: int | None,
    issue_count: int,
) -> SavedAuditPayload:
    actual = _payload_digest(payload_json)
    if not payload_sha256 or not hmac.compare_digest(actual, payload_sha256):
        raise MonitorRunIntegrityError("persisted monitoring payload digest does not match")
    try:
        payload = SavedAuditPayload.model_validate_json(payload_json, strict=True)
    except (ValidationError, ValueError) as error:
        raise MonitorRunIntegrityError("persisted monitoring payload is invalid") from error
    if payload.score != score or len(payload.issues) != issue_count:
        raise MonitorRunIntegrityError(
            "persisted monitoring summary does not match its payload"
        )
    return payload


class MonitorLeaseLostError(RuntimeError):
    def __init__(self) -> None:
        super().__init__("account_monitor_lease_lost")


class MonitorProjectInactiveError(RuntimeError):
    def __init__(self) -> None:
        super().__init__("account_project_not_found")


@dataclass(frozen=True, slots=True)
class StoredMonitor:
    id: str
    user_id: str
    project_id: str
    cadence: str
    timezone: str
    enabled: bool
    status: str
    next_run_at: int | None
    last_run_at: int | None
    consecutive_failures: int
    lease_token: str | None
    lease_expires_at: int | None
    created_at: int
    updated_at: int

    def public(self) -> AccountMonitor:
        return AccountMonitor(
            id=self.id,
            project_id=self.project_id,
            cadence=self.cadence,
            timezone=self.timezone,
            enabled=self.enabled,
            status=self.status,
            next_run_at=utc_datetime(self.next_run_at) if self.next_run_at else None,
            last_run_at=utc_datetime(self.last_run_at) if self.last_run_at else None,
            consecutive_failures=self.consecutive_failures,
            created_at=utc_datetime(self.created_at),
            updated_at=utc_datetime(self.updated_at),
        )


@dataclass(frozen=True, slots=True)
class StoredMonitorRun:
    id: str
    monitor_id: str
    project_id: str
    user_id: str
    status: str
    score: int | None
    issue_count: int
    started_at: int
    completed_at: int
    change_json: str
    payload_json: str | None
    payload_sha256: str | None
    error_code: str | None

    def change(self) -> MonitorChange:
        return MonitorChange.model_validate_json(self.change_json)

    def payload(self) -> SavedAuditPayload | None:
        if self.payload_json is None:
            return None
        return _validated_payload(
            self.payload_json,
            self.payload_sha256,
            score=self.score,
            issue_count=self.issue_count,
        )

    def public(self) -> MonitorRun:
        return MonitorRun(
            id=self.id,
            monitor_id=self.monitor_id,
            project_id=self.project_id,
            status=self.status,
            score=self.score,
            issue_count=self.issue_count,
            started_at=utc_datetime(self.started_at),
            completed_at=utc_datetime(self.completed_at),
            change=self.change(),
            error_code=self.error_code,
        )


class SqliteMonitoringStore:
    def __init__(self, database_path: str) -> None:
        self._path = Path(database_path)
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
            SqliteWorkspaceStore(str(self._path)).ensure_schema()
            with self._connect() as connection:
                connection.executescript(
                    """
                    CREATE TABLE IF NOT EXISTS account_workspace_monitors (
                        id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        project_id TEXT NOT NULL,
                        cadence TEXT NOT NULL,
                        timezone TEXT NOT NULL,
                        enabled INTEGER NOT NULL,
                        status TEXT NOT NULL,
                        next_run_at INTEGER,
                        last_run_at INTEGER,
                        consecutive_failures INTEGER NOT NULL,
                        lease_token TEXT,
                        lease_token_hash TEXT CHECK(
                            lease_token_hash IS NULL OR length(lease_token_hash) = 64
                        ),
                        lease_expires_at INTEGER,
                        created_at INTEGER NOT NULL,
                        updated_at INTEGER NOT NULL,
                        UNIQUE(user_id, project_id),
                        FOREIGN KEY(project_id) REFERENCES account_workspace_projects(id)
                            ON DELETE CASCADE,
                        FOREIGN KEY(user_id) REFERENCES account_users(id) ON DELETE CASCADE
                    );
                    CREATE INDEX IF NOT EXISTS account_workspace_monitors_due_idx
                        ON account_workspace_monitors(enabled, next_run_at, id);
                    CREATE TABLE IF NOT EXISTS account_workspace_monitor_runs (
                        id TEXT PRIMARY KEY,
                        monitor_id TEXT NOT NULL,
                        project_id TEXT NOT NULL,
                        user_id TEXT NOT NULL,
                        status TEXT NOT NULL,
                        score INTEGER,
                        issue_count INTEGER NOT NULL,
                        started_at INTEGER NOT NULL,
                        completed_at INTEGER NOT NULL,
                        change_json TEXT NOT NULL,
                        payload_json TEXT,
                        payload_sha256 TEXT CHECK(length(payload_sha256) = 64),
                        error_code TEXT,
                        FOREIGN KEY(monitor_id) REFERENCES account_workspace_monitors(id)
                            ON DELETE CASCADE,
                        FOREIGN KEY(project_id) REFERENCES account_workspace_projects(id)
                            ON DELETE CASCADE,
                        FOREIGN KEY(user_id) REFERENCES account_users(id) ON DELETE CASCADE
                    );
                    CREATE INDEX IF NOT EXISTS account_workspace_monitor_runs_idx
                        ON account_workspace_monitor_runs(
                            user_id, monitor_id, completed_at DESC, id DESC
                        );
                    """
                )
                connection.execute("BEGIN IMMEDIATE")
                try:
                    monitor_columns = {
                        str(row[1])
                        for row in connection.execute(
                            "PRAGMA table_info(account_workspace_monitors)"
                        ).fetchall()
                    }
                    if "lease_token_hash" not in monitor_columns:
                        connection.execute(
                            """
                            ALTER TABLE account_workspace_monitors
                            ADD COLUMN lease_token_hash TEXT CHECK(
                                lease_token_hash IS NULL OR length(lease_token_hash) = 64
                            )
                            """
                        )
                    legacy_leases = connection.execute(
                        """
                        SELECT id, lease_token FROM account_workspace_monitors
                        WHERE lease_token IS NOT NULL
                        """
                    ).fetchall()
                    for row in legacy_leases:
                        connection.execute(
                            """
                            UPDATE account_workspace_monitors
                            SET lease_token = NULL, lease_token_hash = ?
                            WHERE id = ?
                            """,
                            (_lease_digest(str(row["lease_token"])), str(row["id"])),
                        )
                    columns = {
                        str(row[1])
                        for row in connection.execute(
                            "PRAGMA table_info(account_workspace_monitor_runs)"
                        ).fetchall()
                    }
                    if "payload_sha256" not in columns:
                        connection.execute(
                            """
                            ALTER TABLE account_workspace_monitor_runs
                            ADD COLUMN payload_sha256 TEXT CHECK(length(payload_sha256) = 64)
                            """
                        )
                        rows = connection.execute(
                            """
                            SELECT id, score, issue_count, payload_json
                            FROM account_workspace_monitor_runs
                            WHERE payload_json IS NOT NULL
                            """
                        ).fetchall()
                        for row in rows:
                            payload_json = str(row["payload_json"])
                            payload = SavedAuditPayload.model_validate_json(
                                payload_json, strict=True
                            )
                            if (
                                payload.score != row["score"]
                                or len(payload.issues) != int(row["issue_count"])
                            ):
                                raise MonitorRunIntegrityError(
                                    "legacy monitoring summary does not match its payload"
                                )
                            connection.execute(
                                """
                                UPDATE account_workspace_monitor_runs
                                SET payload_sha256 = ? WHERE id = ?
                                """,
                                (_payload_digest(payload_json), str(row["id"])),
                            )
                    connection.execute("COMMIT")
                except Exception:
                    connection.execute("ROLLBACK")
                    raise
            self._schema_ready = True

    def create_monitor(
        self,
        *,
        user_id: str,
        project_id: str,
        cadence: str,
        timezone: str,
    ) -> StoredMonitor:
        self.ensure_schema()
        now = int(time.time())
        monitor = StoredMonitor(
            id=str(uuid.uuid4()),
            user_id=user_id,
            project_id=project_id,
            cadence=cadence,
            timezone=timezone,
            enabled=True,
            status="pending",
            next_run_at=_next_scheduled_run(cadence, timezone, after=now),
            last_run_at=None,
            consecutive_failures=0,
            lease_token=None,
            lease_expires_at=None,
            created_at=now,
            updated_at=now,
        )
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            active_project = connection.execute(
                """
                SELECT 1 FROM account_workspace_projects
                WHERE id = ? AND user_id = ? AND archived_at IS NULL
                """,
                (project_id, user_id),
            ).fetchone()
            if active_project is None:
                connection.execute("ROLLBACK")
                raise MonitorProjectInactiveError
            try:
                connection.execute(
                    """
                    INSERT INTO account_workspace_monitors(
                        id, user_id, project_id, cadence, timezone, enabled, status,
                        next_run_at, last_run_at, consecutive_failures, lease_token,
                        lease_expires_at, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        monitor.id,
                        user_id,
                        project_id,
                        cadence,
                        timezone,
                        1,
                        monitor.status,
                        monitor.next_run_at,
                        None,
                        0,
                        None,
                        None,
                        now,
                        now,
                    ),
                )
            except sqlite3.IntegrityError as error:
                connection.execute("ROLLBACK")
                raise ValueError("account_monitor_exists") from error
            connection.execute("COMMIT")
        return monitor

    def get_monitor(self, *, user_id: str, project_id: str) -> StoredMonitor | None:
        self.ensure_schema()
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT * FROM account_workspace_monitors
                WHERE user_id = ? AND project_id = ?
                """,
                (user_id, project_id),
            ).fetchone()
        return self._monitor(row) if row else None

    def list_monitors(self, *, user_id: str) -> tuple[StoredMonitor, ...]:
        self.ensure_schema()
        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT * FROM account_workspace_monitors
                WHERE user_id = ? ORDER BY updated_at DESC, id DESC LIMIT 100
                """,
                (user_id,),
            ).fetchall()
        return tuple(self._monitor(row) for row in rows)

    def update_monitor(
        self,
        *,
        user_id: str,
        project_id: str,
        cadence: str | None,
        timezone: str | None,
        enabled: bool | None,
    ) -> StoredMonitor | None:
        self.ensure_schema()
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                """
                SELECT monitor.*
                FROM account_workspace_monitors AS monitor
                JOIN account_workspace_projects AS project
                  ON project.id = monitor.project_id
                 AND project.user_id = monitor.user_id
                WHERE monitor.user_id = ? AND monitor.project_id = ?
                  AND project.archived_at IS NULL
                """,
                (user_id, project_id),
            ).fetchone()
            if row is None:
                active_project = connection.execute(
                    """
                    SELECT 1 FROM account_workspace_projects
                    WHERE id = ? AND user_id = ? AND archived_at IS NULL
                    """,
                    (project_id, user_id),
                ).fetchone()
                connection.execute("ROLLBACK")
                if active_project is None:
                    raise MonitorProjectInactiveError
                return None
            current = self._monitor(row)
            new_cadence = cadence or current.cadence
            new_timezone = timezone or current.timezone
            new_enabled = current.enabled if enabled is None else enabled
            now = int(time.time())
            schedule_changed = cadence is not None or timezone is not None
            if not new_enabled:
                next_run = None
            elif not current.enabled or schedule_changed or current.next_run_at is None:
                next_run = _next_scheduled_run(new_cadence, new_timezone, after=now)
            else:
                next_run = current.next_run_at
            status = (
                "pending"
                if current.status == "running" or not new_enabled
                else current.status
            )
            connection.execute(
                """
                UPDATE account_workspace_monitors
                SET cadence = ?, timezone = ?, enabled = ?, status = ?, next_run_at = ?,
                    updated_at = ?, lease_token = NULL, lease_token_hash = NULL,
                    lease_expires_at = NULL
                WHERE user_id = ? AND project_id = ?
                """,
                (
                    new_cadence,
                    new_timezone,
                    1 if new_enabled else 0,
                    status,
                    next_run,
                    now,
                    user_id,
                    project_id,
                ),
            )
            updated = connection.execute(
                """
                SELECT * FROM account_workspace_monitors
                WHERE user_id = ? AND project_id = ?
                """,
                (user_id, project_id),
            ).fetchone()
            connection.execute("COMMIT")
        return self._monitor(updated)

    def latest_successful_payload(
        self, *, user_id: str, monitor_id: str
    ) -> SavedAuditPayload | None:
        self.ensure_schema()
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT score, issue_count, payload_json, payload_sha256
                FROM account_workspace_monitor_runs
                WHERE user_id = ? AND monitor_id = ? AND status IN ('passed', 'changed')
                    AND payload_json IS NOT NULL
                ORDER BY completed_at DESC, rowid DESC LIMIT 1
                """,
                (user_id, monitor_id),
            ).fetchone()
        if row is None:
            return None
        return _validated_payload(
            str(row["payload_json"]),
            str(row["payload_sha256"]) if row["payload_sha256"] is not None else None,
            score=int(row["score"]) if row["score"] is not None else None,
            issue_count=int(row["issue_count"]),
        )

    def save_run(
        self,
        *,
        monitor: StoredMonitor,
        status: str,
        score: int | None,
        issue_count: int,
        started_at: int,
        completed_at: int,
        change: MonitorChange,
        payload: SavedAuditPayload | None,
        error_code: str | None = None,
    ) -> StoredMonitorRun:
        self.ensure_schema()
        lease_token_hash = _lease_digest(monitor.lease_token)
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                """
                SELECT * FROM account_workspace_monitors
                WHERE id = ? AND user_id = ? AND status = 'running'
                    AND lease_token_hash = ? AND lease_expires_at > ?
                """,
                (monitor.id, monitor.user_id, lease_token_hash, int(time.time())),
            ).fetchone()
            if row is None:
                connection.execute("ROLLBACK")
                raise MonitorLeaseLostError
            current = self._monitor(row)
            run = StoredMonitorRun(
                id=str(uuid.uuid4()),
                monitor_id=current.id,
                project_id=current.project_id,
                user_id=current.user_id,
                status=status,
                score=score,
                issue_count=issue_count,
                started_at=started_at,
                completed_at=completed_at,
                change_json=change.model_dump_json(),
                payload_json=payload.model_dump_json() if payload else None,
                payload_sha256=(
                    _payload_digest(payload.model_dump_json()) if payload else None
                ),
                error_code=error_code,
            )
            failures = current.consecutive_failures + 1 if status == "failed" else 0
            if status == "failed":
                retry_delay = min(
                    CADENCE_SECONDS[current.cadence],
                    (5, 15, 60, 360)[min(failures - 1, 3)] * 60,
                )
                next_run_at = completed_at + retry_delay
            else:
                next_run_at = _next_scheduled_run(
                    current.cadence,
                    current.timezone,
                    after=completed_at,
                    previous=current.next_run_at,
                )
            connection.execute(
                """
                INSERT INTO account_workspace_monitor_runs(
                    id, monitor_id, project_id, user_id, status, score, issue_count,
                    started_at, completed_at, change_json, payload_json,
                    payload_sha256, error_code
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    run.id,
                    run.monitor_id,
                    run.project_id,
                    run.user_id,
                    run.status,
                    run.score,
                    run.issue_count,
                    run.started_at,
                    run.completed_at,
                    run.change_json,
                    run.payload_json,
                    run.payload_sha256,
                    run.error_code,
                ),
            )
            cursor = connection.execute(
                """
                UPDATE account_workspace_monitors
                SET status = ?, last_run_at = ?, next_run_at = ?,
                    consecutive_failures = ?, updated_at = ?,
                    lease_token = NULL, lease_token_hash = NULL, lease_expires_at = NULL
                WHERE id = ? AND user_id = ? AND status = 'running'
                    AND lease_token_hash = ? AND lease_expires_at > ?
                """,
                (
                    status,
                    completed_at,
                    next_run_at if current.enabled else None,
                    failures,
                    completed_at,
                    current.id,
                    current.user_id,
                    lease_token_hash,
                    int(time.time()),
                ),
            )
            if cursor.rowcount != 1:
                connection.execute("ROLLBACK")
                raise MonitorLeaseLostError
            connection.execute(
                """
                DELETE FROM account_workspace_monitor_runs
                WHERE monitor_id = ? AND id NOT IN (
                    SELECT id FROM account_workspace_monitor_runs
                    WHERE monitor_id = ?
                    ORDER BY completed_at DESC, rowid DESC LIMIT ?
                )
                """,
                (current.id, current.id, MAX_MONITOR_RUNS),
            )
            connection.execute("COMMIT")
        return run

    def list_runs(
        self, *, user_id: str, monitor_id: str
    ) -> tuple[StoredMonitorRun, ...]:
        self.ensure_schema()
        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT * FROM account_workspace_monitor_runs
                WHERE user_id = ? AND monitor_id = ?
                ORDER BY completed_at DESC, rowid DESC LIMIT ?
                """,
                (user_id, monitor_id, MAX_MONITOR_RUNS),
            ).fetchall()
        return tuple(self._run(row) for row in rows)

    def claim_due(self, *, now: int | None = None) -> StoredMonitor | None:
        self.ensure_schema()
        current = int(time.time()) if now is None else now
        token = str(uuid.uuid4())
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                """
                SELECT monitor.*
                FROM account_workspace_monitors AS monitor
                JOIN account_workspace_projects AS project
                  ON project.id = monitor.project_id
                 AND project.user_id = monitor.user_id
                WHERE monitor.enabled = 1
                  AND monitor.next_run_at IS NOT NULL
                  AND monitor.next_run_at <= ?
                  AND (monitor.lease_expires_at IS NULL OR monitor.lease_expires_at <= ?)
                  AND project.archived_at IS NULL
                ORDER BY monitor.next_run_at ASC, monitor.id ASC LIMIT 1
                """,
                (current, current),
            ).fetchone()
            if row is None:
                connection.execute("ROLLBACK")
                return None
            connection.execute(
                """
                UPDATE account_workspace_monitors
                SET status = 'running', lease_token = NULL, lease_token_hash = ?,
                    lease_expires_at = ?, updated_at = ?
                WHERE id = ?
                """,
                (
                    _lease_digest(token),
                    current + MONITOR_LEASE_SECONDS,
                    current,
                    row["id"],
                ),
            )
            claimed = connection.execute(
                "SELECT * FROM account_workspace_monitors WHERE id = ?",
                (row["id"],),
            ).fetchone()
            connection.execute("COMMIT")
        return replace(self._monitor(claimed), lease_token=token)

    def claim_manual(
        self,
        *,
        user_id: str,
        project_id: str,
        now: int | None = None,
    ) -> StoredMonitor | None:
        self.ensure_schema()
        current = int(time.time()) if now is None else now
        token = str(uuid.uuid4())
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            active_project = connection.execute(
                """
                SELECT 1 FROM account_workspace_projects
                WHERE id = ? AND user_id = ? AND archived_at IS NULL
                """,
                (project_id, user_id),
            ).fetchone()
            if active_project is None:
                connection.execute("ROLLBACK")
                raise MonitorProjectInactiveError
            row = connection.execute(
                """
                SELECT monitor.*
                FROM account_workspace_monitors AS monitor
                JOIN account_workspace_projects AS project
                  ON project.id = monitor.project_id
                 AND project.user_id = monitor.user_id
                WHERE monitor.user_id = ? AND monitor.project_id = ?
                  AND (monitor.lease_expires_at IS NULL OR monitor.lease_expires_at <= ?)
                  AND project.archived_at IS NULL
                """,
                (user_id, project_id, current),
            ).fetchone()
            if row is None:
                connection.execute("ROLLBACK")
                return None
            connection.execute(
                """
                UPDATE account_workspace_monitors
                SET status = 'running', lease_token = NULL, lease_token_hash = ?,
                    lease_expires_at = ?, updated_at = ?
                WHERE id = ?
                """,
                (
                    _lease_digest(token),
                    current + MONITOR_LEASE_SECONDS,
                    current,
                    row["id"],
                ),
            )
            claimed = connection.execute(
                "SELECT * FROM account_workspace_monitors WHERE id = ?",
                (row["id"],),
            ).fetchone()
            connection.execute("COMMIT")
        return replace(self._monitor(claimed), lease_token=token)

    def renew_lease(
        self,
        monitor: StoredMonitor,
        *,
        now: int | None = None,
    ) -> StoredMonitor:
        self.ensure_schema()
        current = int(time.time()) if now is None else now
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            cursor = connection.execute(
                """
                UPDATE account_workspace_monitors
                SET lease_expires_at = ?, updated_at = ?
                WHERE id = ? AND user_id = ? AND status = 'running'
                    AND lease_token_hash = ? AND lease_expires_at > ?
                """,
                (
                    current + MONITOR_LEASE_SECONDS,
                    current,
                    monitor.id,
                    monitor.user_id,
                    _lease_digest(monitor.lease_token),
                    current,
                ),
            )
            if cursor.rowcount != 1:
                connection.execute("ROLLBACK")
                raise MonitorLeaseLostError
            row = connection.execute(
                "SELECT * FROM account_workspace_monitors WHERE id = ?",
                (monitor.id,),
            ).fetchone()
            connection.execute("COMMIT")
        return replace(self._monitor(row), lease_token=monitor.lease_token)

    @staticmethod
    def _monitor(row: sqlite3.Row) -> StoredMonitor:
        return StoredMonitor(
            id=row["id"],
            user_id=row["user_id"],
            project_id=row["project_id"],
            cadence=row["cadence"],
            timezone=row["timezone"],
            enabled=bool(row["enabled"]),
            status=row["status"],
            next_run_at=row["next_run_at"],
            last_run_at=row["last_run_at"],
            consecutive_failures=row["consecutive_failures"],
            lease_token=None,
            lease_expires_at=row["lease_expires_at"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

    @staticmethod
    def _run(row: sqlite3.Row) -> StoredMonitorRun:
        return StoredMonitorRun(
            id=row["id"],
            monitor_id=row["monitor_id"],
            project_id=row["project_id"],
            user_id=row["user_id"],
            status=row["status"],
            score=row["score"],
            issue_count=row["issue_count"],
            started_at=row["started_at"],
            completed_at=row["completed_at"],
            change_json=row["change_json"],
            payload_json=row["payload_json"],
            payload_sha256=row["payload_sha256"],
            error_code=row["error_code"],
        )
