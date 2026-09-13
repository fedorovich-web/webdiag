from __future__ import annotations

import sqlite3
import threading
import time
import uuid
from collections.abc import Callable
from pathlib import Path


class AuditAdmissionError(RuntimeError):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        retry_after: int,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.retry_after = max(1, retry_after)


class AuditAdmissionController:
    def __init__(
        self,
        database_path: str,
        *,
        request_limit: int,
        window_seconds: int,
        concurrency_limit: int,
        lease_seconds: int,
        clock: Callable[[], int | float] | None = None,
    ) -> None:
        if request_limit < 1 or window_seconds < 1:
            raise ValueError("audit request budget must be positive")
        if concurrency_limit < 1 or lease_seconds < 1:
            raise ValueError("audit concurrency budget must be positive")
        self._path = Path(database_path)
        self._request_limit = request_limit
        self._window_seconds = window_seconds
        self._concurrency_limit = concurrency_limit
        self._lease_seconds = lease_seconds
        self._clock = clock or time.time
        self._schema_lock = threading.Lock()
        self._schema_ready = False

    def _connect(self) -> sqlite3.Connection:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self._path, timeout=10, isolation_level=None)
        connection.row_factory = sqlite3.Row
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
                    CREATE TABLE IF NOT EXISTS audit_public_rate_limit (
                        singleton INTEGER PRIMARY KEY CHECK(singleton = 1),
                        window_started_at INTEGER NOT NULL,
                        request_count INTEGER NOT NULL CHECK(request_count >= 0)
                    );
                    CREATE TABLE IF NOT EXISTS audit_public_leases (
                        lease_id TEXT PRIMARY KEY,
                        expires_at INTEGER NOT NULL
                    );
                    CREATE INDEX IF NOT EXISTS audit_public_leases_expires_idx
                        ON audit_public_leases(expires_at);
                    """
                )
            self._schema_ready = True

    def acquire(self) -> str:
        try:
            return self._acquire()
        except AuditAdmissionError:
            raise
        except sqlite3.Error as error:
            raise AuditAdmissionError(
                503,
                "audit_capacity_unavailable",
                "Public audit capacity is temporarily unavailable.",
                5,
            ) from error

    def _acquire(self) -> str:
        self.ensure_schema()
        now = int(self._clock())
        lease_id = str(uuid.uuid4())
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            try:
                connection.execute(
                    "DELETE FROM audit_public_leases WHERE expires_at <= ?", (now,)
                )
                lease_rows = connection.execute(
                    "SELECT expires_at FROM audit_public_leases ORDER BY expires_at"
                ).fetchall()
                if len(lease_rows) >= self._concurrency_limit:
                    retry_after = max(1, int(lease_rows[0]["expires_at"]) - now)
                    raise AuditAdmissionError(
                        503,
                        "audit_capacity_unavailable",
                        "Public audit capacity is temporarily unavailable.",
                        retry_after,
                    )

                row = connection.execute(
                    "SELECT window_started_at, request_count "
                    "FROM audit_public_rate_limit WHERE singleton = 1"
                ).fetchone()
                window_started_at = now
                request_count = 0
                if row is not None and now < int(row["window_started_at"]) + self._window_seconds:
                    window_started_at = int(row["window_started_at"])
                    request_count = int(row["request_count"])
                if request_count >= self._request_limit:
                    raise AuditAdmissionError(
                        429,
                        "audit_rate_limited",
                        "Public audit rate limit reached.",
                        window_started_at + self._window_seconds - now,
                    )

                connection.execute(
                    """
                    INSERT INTO audit_public_rate_limit(singleton, window_started_at, request_count)
                    VALUES (1, ?, ?)
                    ON CONFLICT(singleton) DO UPDATE SET
                        window_started_at = excluded.window_started_at,
                        request_count = excluded.request_count
                    """,
                    (window_started_at, request_count + 1),
                )
                connection.execute(
                    "INSERT INTO audit_public_leases(lease_id, expires_at) VALUES (?, ?)",
                    (lease_id, now + self._lease_seconds),
                )
                connection.execute("COMMIT")
            except Exception:
                connection.execute("ROLLBACK")
                raise
        return lease_id

    def release(self, lease_id: str) -> None:
        self.ensure_schema()
        with self._connect() as connection:
            connection.execute(
                "DELETE FROM audit_public_leases WHERE lease_id = ?", (lease_id,)
            )
