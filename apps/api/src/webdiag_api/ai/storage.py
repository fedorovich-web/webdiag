from __future__ import annotations

import sqlite3
import threading
import time
import uuid
from dataclasses import dataclass
from pathlib import Path

LEDGER_OPERATIONS = (
    "admin_grant",
    "purchase",
    "reserve",
    "capture",
    "release",
    "refund",
    "adjustment",
)
RUN_STATES = (
    "pending",
    "running",
    "succeeded",
    "failed",
    "provider_unknown",
    "deleted",
)


class CreditConflictError(RuntimeError):
    pass


class CreditIntegrityError(RuntimeError):
    pass


@dataclass(frozen=True, slots=True)
class CreditAccount:
    user_id: str
    available: int
    reserved: int
    version: int


@dataclass(frozen=True, slots=True)
class CreditLedgerEntry:
    id: str
    user_id: str
    operation_type: str
    available_delta: int
    reserved_delta: int
    run_id: str | None
    correlation_id: str
    reason: str
    created_at: int


class SqliteAIStore:
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
            with self._connect() as connection:
                connection.executescript(
                    f"""
                    CREATE TABLE IF NOT EXISTS credit_accounts (
                        user_id TEXT PRIMARY KEY,
                        available INTEGER NOT NULL DEFAULT 0 CHECK(available >= 0),
                        reserved INTEGER NOT NULL DEFAULT 0 CHECK(reserved >= 0),
                        version INTEGER NOT NULL DEFAULT 0 CHECK(version >= 0),
                        FOREIGN KEY(user_id) REFERENCES account_users(id) ON DELETE CASCADE
                    );
                    CREATE TABLE IF NOT EXISTS ai_runs (
                        id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        tool_id TEXT NOT NULL,
                        contract_version TEXT NOT NULL,
                        model_policy TEXT NOT NULL,
                        credit_price INTEGER NOT NULL CHECK(credit_price > 0),
                        idempotency_key TEXT NOT NULL,
                        input_json TEXT NOT NULL,
                        input_sha256 TEXT NOT NULL CHECK(length(input_sha256) = 64),
                        state TEXT NOT NULL CHECK(state IN {RUN_STATES}),
                        output_json TEXT,
                        output_sha256 TEXT
                            CHECK(output_sha256 IS NULL OR length(output_sha256) = 64),
                        public_error_code TEXT,
                        created_at INTEGER NOT NULL,
                        updated_at INTEGER NOT NULL,
                        deleted_at INTEGER,
                        UNIQUE(user_id, idempotency_key),
                        FOREIGN KEY(user_id) REFERENCES account_users(id) ON DELETE CASCADE
                    );
                    CREATE INDEX IF NOT EXISTS ai_runs_user_created_idx
                        ON ai_runs(user_id, created_at DESC, id DESC);
                    CREATE INDEX IF NOT EXISTS ai_runs_state_created_idx
                        ON ai_runs(state, created_at, id);
                    CREATE TABLE IF NOT EXISTS ai_run_attempts (
                        run_id TEXT NOT NULL,
                        attempt_number INTEGER NOT NULL CHECK(attempt_number > 0),
                        lease_token_hash TEXT NOT NULL CHECK(length(lease_token_hash) = 64),
                        lease_expires_at INTEGER NOT NULL,
                        submitted_at INTEGER,
                        provider_request_id TEXT,
                        created_at INTEGER NOT NULL,
                        completed_at INTEGER,
                        PRIMARY KEY(run_id, attempt_number),
                        FOREIGN KEY(run_id) REFERENCES ai_runs(id) ON DELETE CASCADE
                    );
                    CREATE INDEX IF NOT EXISTS ai_run_attempts_lease_idx
                        ON ai_run_attempts(lease_expires_at, run_id);
                    CREATE TABLE IF NOT EXISTS ai_artifacts (
                        id TEXT PRIMARY KEY,
                        run_id TEXT NOT NULL,
                        user_id TEXT NOT NULL,
                        object_key TEXT NOT NULL UNIQUE,
                        media_type TEXT NOT NULL,
                        byte_size INTEGER NOT NULL CHECK(byte_size >= 0),
                        sha256 TEXT NOT NULL CHECK(length(sha256) = 64),
                        created_at INTEGER NOT NULL,
                        deletion_state TEXT NOT NULL DEFAULT 'available'
                            CHECK(deletion_state IN ('available', 'pending', 'deleted')),
                        FOREIGN KEY(run_id) REFERENCES ai_runs(id) ON DELETE CASCADE,
                        FOREIGN KEY(user_id) REFERENCES account_users(id) ON DELETE CASCADE
                    );
                    CREATE INDEX IF NOT EXISTS ai_artifacts_run_idx ON ai_artifacts(run_id, id);
                    CREATE TABLE IF NOT EXISTS credit_ledger (
                        id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        operation_type TEXT NOT NULL CHECK(operation_type IN {LEDGER_OPERATIONS}),
                        available_delta INTEGER NOT NULL,
                        reserved_delta INTEGER NOT NULL,
                        run_id TEXT,
                        correlation_id TEXT NOT NULL,
                        reason TEXT NOT NULL,
                        created_at INTEGER NOT NULL,
                        UNIQUE(user_id, correlation_id),
                        FOREIGN KEY(user_id) REFERENCES account_users(id) ON DELETE CASCADE,
                        FOREIGN KEY(run_id) REFERENCES ai_runs(id) ON DELETE RESTRICT
                    );
                    CREATE INDEX IF NOT EXISTS credit_ledger_user_created_idx
                        ON credit_ledger(user_id, created_at DESC, id DESC);
                    CREATE INDEX IF NOT EXISTS credit_ledger_run_idx ON credit_ledger(run_id);
                    CREATE TRIGGER IF NOT EXISTS credit_ledger_no_update
                    BEFORE UPDATE ON credit_ledger
                    BEGIN
                        SELECT RAISE(ABORT, 'credit ledger is append-only');
                    END;
                    CREATE TRIGGER IF NOT EXISTS credit_ledger_no_delete
                    BEFORE DELETE ON credit_ledger
                    BEGIN
                        SELECT RAISE(ABORT, 'credit ledger is append-only');
                    END;
                    """
                )
            self._schema_ready = True

    def grant_credits(
        self,
        *,
        user_id: str,
        quantity: int,
        reason: str,
        correlation_id: str,
    ) -> CreditLedgerEntry:
        if isinstance(quantity, bool) or not isinstance(quantity, int) or quantity <= 0:
            raise ValueError("credit quantity must be a positive integer")
        normalized_reason = self._bounded_text(reason, name="reason", maximum=200)
        normalized_correlation = self._bounded_text(
            correlation_id,
            name="correlation ID",
            maximum=128,
        )
        self.ensure_schema()
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            existing = connection.execute(
                """
                SELECT * FROM credit_ledger
                WHERE user_id = ? AND correlation_id = ?
                """,
                (user_id, normalized_correlation),
            ).fetchone()
            if existing is not None:
                entry = self._ledger_entry(existing)
                if (
                    entry.operation_type != "admin_grant"
                    or entry.available_delta != quantity
                    or entry.reserved_delta != 0
                    or entry.reason != normalized_reason
                ):
                    connection.execute("ROLLBACK")
                    raise CreditConflictError("credit correlation already has different content")
                connection.execute("COMMIT")
                return entry
            user = connection.execute(
                "SELECT id FROM account_users WHERE id = ?",
                (user_id,),
            ).fetchone()
            if user is None:
                connection.execute("ROLLBACK")
                raise ValueError("account not found")
            connection.execute(
                """
                INSERT INTO credit_accounts(user_id, available, reserved, version)
                VALUES (?, 0, 0, 0)
                ON CONFLICT(user_id) DO NOTHING
                """,
                (user_id,),
            )
            entry = CreditLedgerEntry(
                id=str(uuid.uuid4()),
                user_id=user_id,
                operation_type="admin_grant",
                available_delta=quantity,
                reserved_delta=0,
                run_id=None,
                correlation_id=normalized_correlation,
                reason=normalized_reason,
                created_at=time.time_ns(),
            )
            connection.execute(
                """
                INSERT INTO credit_ledger(
                    id, user_id, operation_type, available_delta, reserved_delta,
                    run_id, correlation_id, reason, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    entry.id,
                    entry.user_id,
                    entry.operation_type,
                    entry.available_delta,
                    entry.reserved_delta,
                    entry.run_id,
                    entry.correlation_id,
                    entry.reason,
                    entry.created_at,
                ),
            )
            connection.execute(
                """
                UPDATE credit_accounts
                SET available = available + ?, version = version + 1
                WHERE user_id = ?
                """,
                (quantity, user_id),
            )
            connection.execute("COMMIT")
        return entry

    def get_credit_account(self, *, user_id: str) -> CreditAccount:
        self.ensure_schema()
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT user_id, available, reserved, version
                FROM credit_accounts WHERE user_id = ?
                """,
                (user_id,),
            ).fetchone()
        if row is None:
            return CreditAccount(user_id=user_id, available=0, reserved=0, version=0)
        return self._credit_account(row)

    def list_ledger(self, *, user_id: str, limit: int) -> tuple[CreditLedgerEntry, ...]:
        if isinstance(limit, bool) or not isinstance(limit, int) or not 1 <= limit <= 100:
            raise ValueError("ledger limit must be between 1 and 100")
        self.ensure_schema()
        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT * FROM credit_ledger WHERE user_id = ?
                ORDER BY created_at DESC, id DESC LIMIT ?
                """,
                (user_id, limit),
            ).fetchall()
        return tuple(self._ledger_entry(row) for row in rows)

    def reconcile_credits(self, *, user_id: str) -> CreditAccount:
        self.ensure_schema()
        with self._connect() as connection:
            materialized = connection.execute(
                """
                SELECT user_id, available, reserved, version
                FROM credit_accounts WHERE user_id = ?
                """,
                (user_id,),
            ).fetchone()
            totals = connection.execute(
                """
                SELECT COALESCE(SUM(available_delta), 0) AS available,
                       COALESCE(SUM(reserved_delta), 0) AS reserved,
                       COUNT(*) AS version
                FROM credit_ledger WHERE user_id = ?
                """,
                (user_id,),
            ).fetchone()
        expected = CreditAccount(
            user_id=user_id,
            available=int(totals["available"]),
            reserved=int(totals["reserved"]),
            version=int(totals["version"]),
        )
        actual = (
            self._credit_account(materialized)
            if materialized is not None
            else CreditAccount(user_id=user_id, available=0, reserved=0, version=0)
        )
        if actual != expected:
            raise CreditIntegrityError("credit materialized balance does not match ledger")
        return actual

    @staticmethod
    def _bounded_text(value: str, *, name: str, maximum: int) -> str:
        normalized = value.strip()
        if value != normalized or not normalized or len(normalized) > maximum:
            raise ValueError(f"credit {name} is invalid")
        return normalized

    @staticmethod
    def _credit_account(row: sqlite3.Row) -> CreditAccount:
        return CreditAccount(
            user_id=str(row["user_id"]),
            available=int(row["available"]),
            reserved=int(row["reserved"]),
            version=int(row["version"]),
        )

    @staticmethod
    def _ledger_entry(row: sqlite3.Row) -> CreditLedgerEntry:
        return CreditLedgerEntry(
            id=str(row["id"]),
            user_id=str(row["user_id"]),
            operation_type=str(row["operation_type"]),
            available_delta=int(row["available_delta"]),
            reserved_delta=int(row["reserved_delta"]),
            run_id=str(row["run_id"]) if row["run_id"] is not None else None,
            correlation_id=str(row["correlation_id"]),
            reason=str(row["reason"]),
            created_at=int(row["created_at"]),
        )
