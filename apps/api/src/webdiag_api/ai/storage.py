from __future__ import annotations

import hashlib
import secrets
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


class AIInsufficientCreditsError(RuntimeError):
    pass


class AIIdempotencyConflictError(RuntimeError):
    pass


class AIRunStateError(RuntimeError):
    pass


class AILeaseLostError(RuntimeError):
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


@dataclass(frozen=True, slots=True)
class StoredAIRun:
    id: str
    user_id: str
    tool_id: str
    contract_version: str
    model_policy: str
    credit_price: int
    idempotency_key: str
    input_json: str
    input_sha256: str
    state: str
    output_json: str | None
    output_sha256: str | None
    public_error_code: str | None
    created_at: int
    updated_at: int
    deleted_at: int | None


@dataclass(frozen=True, slots=True)
class StoredAIClaim:
    run_id: str
    attempt_number: int
    lease_token: str
    lease_expires_at: int
    tool_id: str
    contract_version: str
    model_policy: str
    input_json: str


class SqliteAIStore:
    def __init__(self, database_path: str, *, lease_seconds: int = 900) -> None:
        if not 60 <= lease_seconds <= 3600:
            raise ValueError("AI lease seconds must be between 60 and 3600")
        self._path = Path(database_path)
        self._lease_seconds = lease_seconds
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
                        input_units INTEGER NOT NULL DEFAULT 0
                            CHECK(input_units BETWEEN 0 AND 1000000000),
                        output_units INTEGER NOT NULL DEFAULT 0
                            CHECK(output_units BETWEEN 0 AND 1000000000),
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
                connection.execute("BEGIN IMMEDIATE")
                columns = {
                    str(row[1])
                    for row in connection.execute("PRAGMA table_info(ai_run_attempts)").fetchall()
                }
                if "input_units" not in columns:
                    connection.execute(
                        """
                        ALTER TABLE ai_run_attempts ADD COLUMN input_units INTEGER NOT NULL
                        DEFAULT 0 CHECK(input_units BETWEEN 0 AND 1000000000)
                        """
                    )
                if "output_units" not in columns:
                    connection.execute(
                        """
                        ALTER TABLE ai_run_attempts ADD COLUMN output_units INTEGER NOT NULL
                        DEFAULT 0 CHECK(output_units BETWEEN 0 AND 1000000000)
                        """
                    )
                connection.execute("COMMIT")
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

    def create_run(
        self,
        *,
        user_id: str,
        tool_id: str,
        contract_version: str,
        model_policy: str,
        credit_price: int,
        idempotency_key: str,
        input_json: str,
        input_sha256: str,
    ) -> tuple[StoredAIRun, bool]:
        self.ensure_schema()
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            existing = connection.execute(
                "SELECT * FROM ai_runs WHERE user_id = ? AND idempotency_key = ?",
                (user_id, idempotency_key),
            ).fetchone()
            if existing is not None:
                run = self._run(existing)
                if run.tool_id != tool_id or run.input_sha256 != input_sha256:
                    connection.execute("ROLLBACK")
                    raise AIIdempotencyConflictError
                connection.execute("COMMIT")
                return run, False
            run_id = str(uuid.uuid4())
            now = time.time_ns()
            connection.execute(
                """
                INSERT INTO ai_runs(
                    id, user_id, tool_id, contract_version, model_policy, credit_price,
                    idempotency_key, input_json, input_sha256, state, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
                """,
                (
                    run_id,
                    user_id,
                    tool_id,
                    contract_version,
                    model_policy,
                    credit_price,
                    idempotency_key,
                    input_json,
                    input_sha256,
                    now,
                    now,
                ),
            )
            updated = connection.execute(
                """
                UPDATE credit_accounts
                SET available = available - ?, reserved = reserved + ?, version = version + 1
                WHERE user_id = ? AND available >= ?
                """,
                (credit_price, credit_price, user_id, credit_price),
            )
            if updated.rowcount != 1:
                connection.execute("ROLLBACK")
                raise AIInsufficientCreditsError
            self._insert_ledger(
                connection,
                user_id=user_id,
                operation_type="reserve",
                available_delta=-credit_price,
                reserved_delta=credit_price,
                run_id=run_id,
                correlation_id=f"run:{run_id}:reserve",
                reason="AI run credit reservation",
                created_at=now,
            )
            row = connection.execute("SELECT * FROM ai_runs WHERE id = ?", (run_id,)).fetchone()
            connection.execute("COMMIT")
        return self._run(row), True

    def get_run_for_user(self, *, user_id: str, run_id: str) -> StoredAIRun | None:
        self.ensure_schema()
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM ai_runs WHERE id = ? AND user_id = ?",
                (run_id, user_id),
            ).fetchone()
        return self._run(row) if row is not None else None

    def list_runs_for_user(
        self,
        *,
        user_id: str,
        limit: int,
        after_created_at: int | None = None,
        after_id: str | None = None,
    ) -> tuple[StoredAIRun, ...]:
        if isinstance(limit, bool) or not isinstance(limit, int) or not 1 <= limit <= 51:
            raise ValueError("run limit must be between 1 and 51")
        if (after_created_at is None) != (after_id is None):
            raise ValueError("run cursor components must be provided together")
        self.ensure_schema()
        with self._connect() as connection:
            if after_created_at is None:
                rows = connection.execute(
                    """
                    SELECT * FROM ai_runs WHERE user_id = ?
                    ORDER BY created_at DESC, id DESC LIMIT ?
                    """,
                    (user_id, limit),
                ).fetchall()
            else:
                rows = connection.execute(
                    """
                    SELECT * FROM ai_runs
                    WHERE user_id = ?
                        AND (created_at < ? OR (created_at = ? AND id < ?))
                    ORDER BY created_at DESC, id DESC LIMIT ?
                    """,
                    (user_id, after_created_at, after_created_at, after_id, limit),
                ).fetchall()
        return tuple(self._run(row) for row in rows)

    def delete_run_for_user(self, *, user_id: str, run_id: str) -> StoredAIRun | None:
        self.ensure_schema()
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                "SELECT * FROM ai_runs WHERE id = ? AND user_id = ?",
                (run_id, user_id),
            ).fetchone()
            if row is None:
                connection.execute("ROLLBACK")
                return None
            run = self._run(row)
            if run.state == "running":
                connection.execute("ROLLBACK")
                raise AIRunStateError
            if run.state == "deleted":
                connection.execute("COMMIT")
                return run
            now = time.time_ns()
            if run.state == "pending":
                updated = connection.execute(
                    """
                    UPDATE credit_accounts
                    SET available = available + ?, reserved = reserved - ?, version = version + 1
                    WHERE user_id = ? AND reserved >= ?
                    """,
                    (run.credit_price, run.credit_price, user_id, run.credit_price),
                )
                if updated.rowcount != 1:
                    connection.execute("ROLLBACK")
                    raise CreditIntegrityError("run reservation is unavailable")
                self._insert_ledger(
                    connection,
                    user_id=user_id,
                    operation_type="release",
                    available_delta=run.credit_price,
                    reserved_delta=-run.credit_price,
                    run_id=run.id,
                    correlation_id=f"run:{run.id}:delete-release",
                    reason="Deleted pending AI run",
                    created_at=now,
                )
            connection.execute(
                """
                UPDATE ai_runs
                SET state = 'deleted', input_json = '{}', output_json = NULL,
                    output_sha256 = NULL, public_error_code = NULL,
                    updated_at = ?, deleted_at = ?
                WHERE id = ? AND user_id = ?
                """,
                (now, now, run_id, user_id),
            )
            deleted = connection.execute("SELECT * FROM ai_runs WHERE id = ?", (run_id,)).fetchone()
            connection.execute("COMMIT")
        return self._run(deleted)

    def claim_pending(self, *, now: int | None = None) -> StoredAIClaim | None:
        self.ensure_schema()
        current = int(time.time()) if now is None else now
        lease_token = secrets.token_urlsafe(32)
        lease_hash = hashlib.sha256(lease_token.encode()).hexdigest()
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                """
                SELECT r.*
                FROM ai_runs AS r
                LEFT JOIN ai_run_attempts AS a
                    ON a.run_id = r.id
                    AND a.attempt_number = (
                        SELECT MAX(latest.attempt_number)
                        FROM ai_run_attempts AS latest WHERE latest.run_id = r.id
                    )
                WHERE r.state = 'pending'
                    OR (
                        r.state = 'running'
                        AND a.lease_expires_at <= ?
                        AND a.submitted_at IS NULL
                    )
                ORDER BY r.created_at ASC, r.id ASC LIMIT 1
                """,
                (current,),
            ).fetchone()
            if row is None:
                connection.execute("ROLLBACK")
                return None
            attempt_number = int(
                connection.execute(
                    """
                    SELECT COALESCE(MAX(attempt_number), 0) + 1
                    FROM ai_run_attempts WHERE run_id = ?
                    """,
                    (row["id"],),
                ).fetchone()[0]
            )
            lease_expires_at = current + self._lease_seconds
            connection.execute(
                """
                INSERT INTO ai_run_attempts(
                    run_id, attempt_number, lease_token_hash, lease_expires_at, created_at
                ) VALUES (?, ?, ?, ?, ?)
                """,
                (row["id"], attempt_number, lease_hash, lease_expires_at, current),
            )
            connection.execute(
                "UPDATE ai_runs SET state = 'running', updated_at = ? WHERE id = ?",
                (time.time_ns(), row["id"]),
            )
            connection.execute("COMMIT")
        return StoredAIClaim(
            run_id=str(row["id"]),
            attempt_number=attempt_number,
            lease_token=lease_token,
            lease_expires_at=lease_expires_at,
            tool_id=str(row["tool_id"]),
            contract_version=str(row["contract_version"]),
            model_policy=str(row["model_policy"]),
            input_json=str(row["input_json"]),
        )

    def renew_lease(
        self,
        *,
        run_id: str,
        lease_token: str,
        now: int | None = None,
    ) -> int:
        current = int(time.time()) if now is None else now
        token_hash = hashlib.sha256(lease_token.encode()).hexdigest()
        self.ensure_schema()
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            attempt = self._current_attempt(
                connection,
                run_id=run_id,
                token_hash=token_hash,
                now=current,
            )
            expires_at = current + self._lease_seconds
            connection.execute(
                """
                UPDATE ai_run_attempts SET lease_expires_at = ?
                WHERE run_id = ? AND attempt_number = ?
                """,
                (expires_at, run_id, attempt["attempt_number"]),
            )
            connection.execute("COMMIT")
        return expires_at

    def mark_submitted(
        self,
        *,
        run_id: str,
        lease_token: str,
        now: int | None = None,
    ) -> None:
        current = int(time.time()) if now is None else now
        token_hash = hashlib.sha256(lease_token.encode()).hexdigest()
        self.ensure_schema()
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            attempt = self._current_attempt(
                connection,
                run_id=run_id,
                token_hash=token_hash,
                now=current,
            )
            connection.execute(
                """
                UPDATE ai_run_attempts SET submitted_at = COALESCE(submitted_at, ?)
                WHERE run_id = ? AND attempt_number = ?
                """,
                (current, run_id, attempt["attempt_number"]),
            )
            connection.execute("COMMIT")

    def complete_run(
        self,
        *,
        run_id: str,
        lease_token: str,
        output_json: str,
        output_sha256: str,
        provider_request_id: str | None = None,
        input_units: int = 0,
        output_units: int = 0,
        now: int | None = None,
    ) -> StoredAIRun:
        self._validate_provider_usage(
            provider_request_id=provider_request_id,
            input_units=input_units,
            output_units=output_units,
        )
        current = int(time.time()) if now is None else now
        token_hash = hashlib.sha256(lease_token.encode()).hexdigest()
        if hashlib.sha256(output_json.encode()).hexdigest() != output_sha256:
            raise CreditIntegrityError("AI output digest does not match content")
        self.ensure_schema()
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            attempt = self._current_attempt(
                connection,
                run_id=run_id,
                token_hash=token_hash,
                now=current,
            )
            run = self._run(
                connection.execute("SELECT * FROM ai_runs WHERE id = ?", (run_id,)).fetchone()
            )
            self._settle_reservation(
                connection,
                run=run,
                operation_type="capture",
                available_delta=0,
                reserved_delta=-run.credit_price,
                reason="Completed AI run",
                created_at=time.time_ns(),
            )
            updated_at = time.time_ns()
            connection.execute(
                """
                UPDATE ai_runs SET state = 'succeeded', output_json = ?, output_sha256 = ?,
                    public_error_code = NULL, updated_at = ? WHERE id = ?
                """,
                (output_json, output_sha256, updated_at, run_id),
            )
            connection.execute(
                """
                UPDATE ai_run_attempts
                SET completed_at = ?, provider_request_id = ?,
                    input_units = ?, output_units = ?
                WHERE run_id = ? AND attempt_number = ?
                """,
                (
                    current,
                    provider_request_id,
                    input_units,
                    output_units,
                    run_id,
                    attempt["attempt_number"],
                ),
            )
            row = connection.execute("SELECT * FROM ai_runs WHERE id = ?", (run_id,)).fetchone()
            connection.execute("COMMIT")
        return self._run(row)

    def fail_run(
        self,
        *,
        run_id: str,
        lease_token: str,
        error_code: str,
        provider_unknown: bool,
        now: int | None = None,
    ) -> StoredAIRun:
        if (
            not error_code
            or len(error_code) > 120
            or any(
                character not in "abcdefghijklmnopqrstuvwxyz0123456789_"
                for character in error_code
            )
        ):
            raise ValueError("AI public error code is invalid")
        current = int(time.time()) if now is None else now
        token_hash = hashlib.sha256(lease_token.encode()).hexdigest()
        self.ensure_schema()
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            attempt = self._current_attempt(
                connection,
                run_id=run_id,
                token_hash=token_hash,
                now=current,
            )
            run = self._run(
                connection.execute("SELECT * FROM ai_runs WHERE id = ?", (run_id,)).fetchone()
            )
            state = "provider_unknown" if provider_unknown else "failed"
            self._settle_reservation(
                connection,
                run=run,
                operation_type="release",
                available_delta=run.credit_price,
                reserved_delta=-run.credit_price,
                reason=f"AI run ended as {state}",
                created_at=time.time_ns(),
            )
            connection.execute(
                """
                UPDATE ai_runs SET state = ?, public_error_code = ?, updated_at = ?
                WHERE id = ?
                """,
                (state, error_code, time.time_ns(), run_id),
            )
            connection.execute(
                """
                UPDATE ai_run_attempts SET completed_at = ?
                WHERE run_id = ? AND attempt_number = ?
                """,
                (current, run_id, attempt["attempt_number"]),
            )
            row = connection.execute("SELECT * FROM ai_runs WHERE id = ?", (run_id,)).fetchone()
            connection.execute("COMMIT")
        return self._run(row)

    def list_ledger(
        self,
        *,
        user_id: str,
        limit: int,
        after_created_at: int | None = None,
        after_id: str | None = None,
    ) -> tuple[CreditLedgerEntry, ...]:
        if isinstance(limit, bool) or not isinstance(limit, int) or not 1 <= limit <= 101:
            raise ValueError("ledger limit must be between 1 and 101")
        if (after_created_at is None) != (after_id is None):
            raise ValueError("ledger cursor components must be provided together")
        self.ensure_schema()
        with self._connect() as connection:
            if after_created_at is None:
                rows = connection.execute(
                    """
                    SELECT * FROM credit_ledger WHERE user_id = ?
                    ORDER BY created_at DESC, id DESC LIMIT ?
                    """,
                    (user_id, limit),
                ).fetchall()
            else:
                rows = connection.execute(
                    """
                    SELECT * FROM credit_ledger
                    WHERE user_id = ?
                        AND (created_at < ? OR (created_at = ? AND id < ?))
                    ORDER BY created_at DESC, id DESC LIMIT ?
                    """,
                    (user_id, after_created_at, after_created_at, after_id, limit),
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
    def _current_attempt(
        connection: sqlite3.Connection,
        *,
        run_id: str,
        token_hash: str,
        now: int,
    ) -> sqlite3.Row:
        attempt = connection.execute(
            """
            SELECT a.* FROM ai_run_attempts AS a
            JOIN ai_runs AS r ON r.id = a.run_id
            WHERE a.run_id = ? AND r.state = 'running'
            ORDER BY a.attempt_number DESC LIMIT 1
            """,
            (run_id,),
        ).fetchone()
        if (
            attempt is None
            or str(attempt["lease_token_hash"]) != token_hash
            or int(attempt["lease_expires_at"]) <= now
            or attempt["completed_at"] is not None
        ):
            connection.execute("ROLLBACK")
            raise AILeaseLostError
        return attempt

    def _settle_reservation(
        self,
        connection: sqlite3.Connection,
        *,
        run: StoredAIRun,
        operation_type: str,
        available_delta: int,
        reserved_delta: int,
        reason: str,
        created_at: int,
    ) -> None:
        updated = connection.execute(
            """
            UPDATE credit_accounts
            SET available = available + ?, reserved = reserved + ?, version = version + 1
            WHERE user_id = ? AND reserved >= ?
                AND available + ? >= 0 AND reserved + ? >= 0
            """,
            (
                available_delta,
                reserved_delta,
                run.user_id,
                run.credit_price,
                available_delta,
                reserved_delta,
            ),
        )
        if updated.rowcount != 1:
            connection.execute("ROLLBACK")
            raise CreditIntegrityError("run reservation is unavailable")
        self._insert_ledger(
            connection,
            user_id=run.user_id,
            operation_type=operation_type,
            available_delta=available_delta,
            reserved_delta=reserved_delta,
            run_id=run.id,
            correlation_id=f"run:{run.id}:{operation_type}",
            reason=reason,
            created_at=created_at,
        )

    @staticmethod
    def _validate_provider_usage(
        *,
        provider_request_id: str | None,
        input_units: int,
        output_units: int,
    ) -> None:
        if provider_request_id is not None and not 1 <= len(provider_request_id) <= 200:
            raise ValueError("provider request ID is invalid")
        for value in (input_units, output_units):
            if (
                isinstance(value, bool)
                or not isinstance(value, int)
                or not 0 <= value <= 1_000_000_000
            ):
                raise ValueError("provider usage must use bounded non-negative integers")

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

    @staticmethod
    def _run(row: sqlite3.Row) -> StoredAIRun:
        return StoredAIRun(
            id=str(row["id"]),
            user_id=str(row["user_id"]),
            tool_id=str(row["tool_id"]),
            contract_version=str(row["contract_version"]),
            model_policy=str(row["model_policy"]),
            credit_price=int(row["credit_price"]),
            idempotency_key=str(row["idempotency_key"]),
            input_json=str(row["input_json"]),
            input_sha256=str(row["input_sha256"]),
            state=str(row["state"]),
            output_json=str(row["output_json"]) if row["output_json"] is not None else None,
            output_sha256=(
                str(row["output_sha256"]) if row["output_sha256"] is not None else None
            ),
            public_error_code=(
                str(row["public_error_code"])
                if row["public_error_code"] is not None
                else None
            ),
            created_at=int(row["created_at"]),
            updated_at=int(row["updated_at"]),
            deleted_at=int(row["deleted_at"]) if row["deleted_at"] is not None else None,
        )

    @staticmethod
    def _insert_ledger(
        connection: sqlite3.Connection,
        *,
        user_id: str,
        operation_type: str,
        available_delta: int,
        reserved_delta: int,
        run_id: str,
        correlation_id: str,
        reason: str,
        created_at: int,
    ) -> None:
        connection.execute(
            """
            INSERT INTO credit_ledger(
                id, user_id, operation_type, available_delta, reserved_delta,
                run_id, correlation_id, reason, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                str(uuid.uuid4()),
                user_id,
                operation_type,
                available_delta,
                reserved_delta,
                run_id,
                correlation_id,
                reason,
                created_at,
            ),
        )
