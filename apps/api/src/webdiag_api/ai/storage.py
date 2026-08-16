from __future__ import annotations

import hashlib
import hmac
import re
import secrets
import sqlite3
import threading
import time
import uuid
from collections.abc import Callable
from contextlib import closing
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
MAX_PROVIDER_EVALUATION_JSON_BYTES = 2_000_000


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


class AIUploadQuotaError(RuntimeError):
    pass


class AIUploadUnavailableError(RuntimeError):
    def __init__(self) -> None:
        super().__init__("AI upload is unavailable")


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
class StoredAIArtifactReservation:
    artifact_id: str
    run_id: str
    user_id: str
    object_key: str
    created_at: int
    deletion_state: str


@dataclass(frozen=True, slots=True)
class StoredAIClaim:
    run_id: str
    attempt_number: int
    lease_token: str
    lease_expires_at: int
    tool_id: str
    contract_version: str
    model_policy: str
    user_id: str
    input_json: str
    artifact_reservation: StoredAIArtifactReservation | None = None


@dataclass(frozen=True, slots=True)
class StoredAIUpload:
    id: str
    user_id: str
    object_key: str
    media_type: str
    byte_size: int
    width: int
    height: int
    sha256: str
    created_at: int
    expires_at: int
    bound_run_id: str | None
    deletion_state: str
    deleted_at: int | None


@dataclass(frozen=True, slots=True)
class StoredAIArtifact:
    id: str
    run_id: str
    user_id: str
    object_key: str
    media_type: str
    byte_size: int
    sha256: str
    created_at: int
    deletion_state: str


@dataclass(frozen=True, slots=True)
class ProviderCostReport:
    tool_id: str
    sample_limit: int
    sampled_attempts: int
    measured_attempts: int
    unmeasured_attempts: int
    input_units_total: int
    output_units_total: int
    minimum_nano_usd: int | None
    maximum_nano_usd: int | None
    p95_nano_usd: int | None
    total_nano_usd: int


@dataclass(frozen=True, slots=True)
class ProviderEvaluationSample:
    contract_version: str
    model_policy: str
    input_json: str | None
    input_bytes: int
    input_sha256: str
    output_json: str | None
    output_bytes: int
    output_sha256: str
    provider_request_id: str | None
    input_units: int
    output_units: int
    provider_cost_nano_usd: int | None


class SqliteAIStore:
    def __init__(
        self,
        database_path: str,
        *,
        lease_seconds: int = 900,
        upload_ttl_seconds: int = 24 * 60 * 60,
        upload_limit: int = 10,
        clock_ns: Callable[[], int] = time.time_ns,
    ) -> None:
        if not 60 <= lease_seconds <= 3600:
            raise ValueError("AI lease seconds must be between 60 and 3600")
        if not 1 <= upload_ttl_seconds <= 7 * 24 * 60 * 60:
            raise ValueError("AI upload TTL must be between 1 second and 7 days")
        if not 1 <= upload_limit <= 100:
            raise ValueError("AI upload limit must be between 1 and 100")
        self._path = Path(database_path)
        self._lease_seconds = lease_seconds
        self._upload_ttl_ns = upload_ttl_seconds * 1_000_000_000
        self._upload_limit = upload_limit
        self._clock_ns = clock_ns
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

    def _connect_read_only(self) -> sqlite3.Connection:
        database_uri = f"{self._path.resolve().as_uri()}?mode=ro&immutable=1"
        connection = sqlite3.connect(database_uri, uri=True, timeout=10)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA query_only = ON")
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
                    CREATE TABLE IF NOT EXISTS ai_uploads (
                        id TEXT PRIMARY KEY CHECK(length(id) = 36),
                        user_id TEXT NOT NULL,
                        object_key TEXT NOT NULL UNIQUE,
                        media_type TEXT NOT NULL
                            CHECK(media_type IN ('image/jpeg', 'image/png', 'image/webp')),
                        byte_size INTEGER NOT NULL CHECK(byte_size BETWEEN 1 AND 4194304),
                        width INTEGER NOT NULL CHECK(width BETWEEN 1 AND 8192),
                        height INTEGER NOT NULL CHECK(height BETWEEN 1 AND 8192),
                        sha256 TEXT NOT NULL CHECK(length(sha256) = 64),
                        created_at INTEGER NOT NULL,
                        expires_at INTEGER NOT NULL CHECK(expires_at > created_at),
                        bound_run_id TEXT UNIQUE,
                        deletion_state TEXT NOT NULL DEFAULT 'available'
                            CHECK(deletion_state IN ('available', 'pending', 'deleted')),
                        deleted_at INTEGER,
                        CHECK(width * height <= 8000000),
                        CHECK((deletion_state = 'deleted') = (deleted_at IS NOT NULL)),
                        FOREIGN KEY(user_id) REFERENCES account_users(id) ON DELETE CASCADE,
                        FOREIGN KEY(bound_run_id) REFERENCES ai_runs(id) ON DELETE CASCADE
                    );
                    CREATE INDEX IF NOT EXISTS ai_uploads_owner_active_idx
                        ON ai_uploads(user_id, deletion_state, bound_run_id, expires_at);
                    CREATE INDEX IF NOT EXISTS ai_uploads_cleanup_idx
                        ON ai_uploads(deletion_state, expires_at, id);
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
                        provider_cost_nano_usd INTEGER
                            CHECK(provider_cost_nano_usd BETWEEN 0 AND 1000000000000),
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
                    CREATE INDEX IF NOT EXISTS ai_artifacts_cleanup_idx
                        ON ai_artifacts(deletion_state, created_at, id);
                    CREATE TABLE IF NOT EXISTS ai_artifact_reservations (
                        artifact_id TEXT PRIMARY KEY,
                        run_id TEXT NOT NULL UNIQUE,
                        user_id TEXT NOT NULL,
                        object_key TEXT NOT NULL UNIQUE,
                        created_at INTEGER NOT NULL,
                        deletion_state TEXT NOT NULL DEFAULT 'reserved'
                            CHECK(deletion_state IN (
                                'reserved', 'pending', 'committed', 'deleted'
                            )),
                        FOREIGN KEY(run_id) REFERENCES ai_runs(id) ON DELETE CASCADE,
                        FOREIGN KEY(user_id) REFERENCES account_users(id) ON DELETE CASCADE
                    );
                    CREATE INDEX IF NOT EXISTS ai_artifact_reservations_cleanup_idx
                        ON ai_artifact_reservations(deletion_state, created_at, artifact_id);
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
                if "provider_cost_nano_usd" not in columns:
                    connection.execute(
                        """
                        ALTER TABLE ai_run_attempts ADD COLUMN provider_cost_nano_usd INTEGER
                        CHECK(provider_cost_nano_usd BETWEEN 0 AND 1000000000000)
                        """
                    )
                connection.execute("COMMIT")
            self._schema_ready = True

    def provider_cost_report(
        self,
        *,
        tool_id: str,
        sample_limit: int = 10_000,
    ) -> ProviderCostReport:
        if not re.fullmatch(r"[a-z][a-z0-9_]{1,119}", tool_id):
            raise ValueError("AI tool ID is invalid")
        if (
            isinstance(sample_limit, bool)
            or not isinstance(sample_limit, int)
            or not 1 <= sample_limit <= 100_000
        ):
            raise ValueError("provider cost sample limit must be between 1 and 100000")
        try:
            with closing(self._connect_read_only()) as connection:
                rows = connection.execute(
                    """
                    SELECT a.input_units, a.output_units, a.provider_cost_nano_usd
                    FROM ai_run_attempts AS a
                    JOIN ai_runs AS r ON r.id = a.run_id
                    WHERE r.tool_id = ? AND r.state = 'succeeded'
                      AND a.completed_at IS NOT NULL
                      AND a.attempt_number = (
                          SELECT MAX(latest.attempt_number)
                          FROM ai_run_attempts AS latest
                          WHERE latest.run_id = a.run_id
                      )
                    ORDER BY a.completed_at DESC, a.run_id DESC
                    LIMIT ?
                    """,
                    (tool_id, sample_limit),
                ).fetchall()
        except sqlite3.Error as error:
            raise ValueError("provider cost evidence is unavailable") from error
        measured = [row for row in rows if row["provider_cost_nano_usd"] is not None]
        costs = sorted(int(row["provider_cost_nano_usd"]) for row in measured)
        p95_index = ((95 * len(costs) + 99) // 100) - 1 if costs else None
        return ProviderCostReport(
            tool_id=tool_id,
            sample_limit=sample_limit,
            sampled_attempts=len(rows),
            measured_attempts=len(measured),
            unmeasured_attempts=len(rows) - len(measured),
            input_units_total=sum(int(row["input_units"]) for row in measured),
            output_units_total=sum(int(row["output_units"]) for row in measured),
            minimum_nano_usd=costs[0] if costs else None,
            maximum_nano_usd=costs[-1] if costs else None,
            p95_nano_usd=costs[p95_index] if p95_index is not None else None,
            total_nano_usd=sum(costs),
        )

    def provider_evaluation_samples(
        self,
        *,
        tool_id: str,
        sample_limit: int = 100,
    ) -> tuple[ProviderEvaluationSample, ...]:
        if not re.fullmatch(r"[a-z][a-z0-9_]{1,119}", tool_id):
            raise ValueError("AI tool ID is invalid")
        if (
            isinstance(sample_limit, bool)
            or not isinstance(sample_limit, int)
            or not 1 <= sample_limit <= 100
        ):
            raise ValueError("provider evaluation sample limit must be between 1 and 100")
        try:
            with closing(self._connect_read_only()) as connection:
                rows = connection.execute(
                    """
                    SELECT r.contract_version, r.model_policy,
                           CASE WHEN length(CAST(r.input_json AS BLOB))
                                BETWEEN 2 AND ? THEN r.input_json END AS input_json,
                           length(CAST(r.input_json AS BLOB)) AS input_bytes,
                           r.input_sha256,
                           CASE WHEN length(CAST(r.output_json AS BLOB))
                                BETWEEN 2 AND ? THEN r.output_json END AS output_json,
                           length(CAST(r.output_json AS BLOB)) AS output_bytes,
                           r.output_sha256,
                           a.provider_request_id, a.input_units, a.output_units,
                           a.provider_cost_nano_usd
                    FROM ai_runs AS r
                    JOIN ai_run_attempts AS a ON a.run_id = r.id
                    WHERE r.tool_id = ? AND r.state = 'succeeded'
                      AND r.output_json IS NOT NULL AND r.output_sha256 IS NOT NULL
                      AND a.completed_at IS NOT NULL
                      AND a.attempt_number = (
                          SELECT MAX(latest.attempt_number)
                          FROM ai_run_attempts AS latest
                          WHERE latest.run_id = r.id
                      )
                    ORDER BY a.completed_at DESC, r.id DESC
                    LIMIT ?
                    """,
                    (
                        MAX_PROVIDER_EVALUATION_JSON_BYTES,
                        MAX_PROVIDER_EVALUATION_JSON_BYTES,
                        tool_id,
                        sample_limit,
                    ),
                ).fetchall()
        except sqlite3.Error as error:
            raise ValueError("provider evaluation evidence is unavailable") from error
        return tuple(
            ProviderEvaluationSample(
                contract_version=str(row["contract_version"]),
                model_policy=str(row["model_policy"]),
                input_json=(
                    str(row["input_json"]) if row["input_json"] is not None else None
                ),
                input_bytes=int(row["input_bytes"]),
                input_sha256=str(row["input_sha256"]),
                output_json=(
                    str(row["output_json"]) if row["output_json"] is not None else None
                ),
                output_bytes=int(row["output_bytes"]),
                output_sha256=str(row["output_sha256"]),
                provider_request_id=(
                    str(row["provider_request_id"])
                    if row["provider_request_id"] is not None
                    else None
                ),
                input_units=int(row["input_units"]),
                output_units=int(row["output_units"]),
                provider_cost_nano_usd=(
                    int(row["provider_cost_nano_usd"])
                    if row["provider_cost_nano_usd"] is not None
                    else None
                ),
            )
            for row in rows
        )

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
                created_at=self._clock_ns(),
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

    def create_upload(
        self,
        *,
        user_id: str,
        upload_id: str,
        object_key: str,
        media_type: str,
        byte_size: int,
        width: int,
        height: int,
        sha256: str,
    ) -> StoredAIUpload:
        self._validate_upload(
            upload_id=upload_id,
            object_key=object_key,
            media_type=media_type,
            byte_size=byte_size,
            width=width,
            height=height,
            sha256=sha256,
        )
        self.ensure_schema()
        now = self._clock_ns()
        expires_at = now + self._upload_ttl_ns
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            user = connection.execute(
                "SELECT id FROM account_users WHERE id = ?",
                (user_id,),
            ).fetchone()
            if user is None:
                connection.execute("ROLLBACK")
                raise ValueError("account not found")
            connection.execute(
                """
                UPDATE ai_uploads SET deletion_state = 'pending'
                WHERE user_id = ? AND deletion_state = 'available'
                    AND bound_run_id IS NULL AND expires_at <= ?
                """,
                (user_id, now),
            )
            active = connection.execute(
                """
                SELECT COUNT(*) FROM ai_uploads
                WHERE user_id = ? AND deletion_state = 'available'
                    AND bound_run_id IS NULL AND expires_at > ?
                """,
                (user_id, now),
            ).fetchone()[0]
            if int(active) >= self._upload_limit:
                connection.execute("ROLLBACK")
                raise AIUploadQuotaError("AI upload quota exceeded")
            connection.execute(
                """
                INSERT INTO ai_uploads(
                    id, user_id, object_key, media_type, byte_size, width, height,
                    sha256, created_at, expires_at, deletion_state
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')
                """,
                (
                    upload_id,
                    user_id,
                    object_key,
                    media_type,
                    byte_size,
                    width,
                    height,
                    sha256,
                    now,
                    expires_at,
                ),
            )
            row = connection.execute(
                "SELECT * FROM ai_uploads WHERE id = ?",
                (upload_id,),
            ).fetchone()
            connection.execute("COMMIT")
        return self._upload(row)

    def get_upload_for_user(self, *, user_id: str, upload_id: str) -> StoredAIUpload | None:
        self.ensure_schema()
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM ai_uploads WHERE id = ? AND user_id = ?",
                (upload_id, user_id),
            ).fetchone()
        return self._upload(row) if row is not None else None

    def get_active_upload_for_user(
        self,
        *,
        user_id: str,
        upload_id: str,
    ) -> StoredAIUpload | None:
        self.ensure_schema()
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT * FROM ai_uploads
                WHERE id = ? AND user_id = ? AND deletion_state = 'available'
                    AND bound_run_id IS NULL AND expires_at > ?
                """,
                (upload_id, user_id, self._clock_ns()),
            ).fetchone()
        return self._upload(row) if row is not None else None

    def resolve_upload_for_run(
        self,
        *,
        user_id: str,
        upload_id: str,
        idempotency_key: str,
    ) -> StoredAIUpload | None:
        self.ensure_schema()
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT u.* FROM ai_uploads AS u
                LEFT JOIN ai_runs AS r ON r.id = u.bound_run_id
                WHERE u.id = ? AND u.user_id = ? AND u.deletion_state = 'available'
                    AND u.expires_at > ?
                    AND (u.bound_run_id IS NULL OR r.idempotency_key = ?)
                """,
                (upload_id, user_id, self._clock_ns(), idempotency_key),
            ).fetchone()
        return self._upload(row) if row is not None else None

    def get_upload(self, *, upload_id: str) -> StoredAIUpload | None:
        self.ensure_schema()
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM ai_uploads WHERE id = ?",
                (upload_id,),
            ).fetchone()
        return self._upload(row) if row is not None else None

    def mark_upload_deletion_pending(self, *, user_id: str, upload_id: str) -> bool:
        self.ensure_schema()
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            updated = connection.execute(
                """
                UPDATE ai_uploads SET deletion_state = 'pending'
                WHERE id = ? AND user_id = ? AND deletion_state = 'available'
                    AND bound_run_id IS NULL
                """,
                (upload_id, user_id),
            )
            if updated.rowcount == 1:
                connection.execute("COMMIT")
                return True
            existing = connection.execute(
                """
                SELECT id FROM ai_uploads
                WHERE id = ? AND user_id = ? AND deletion_state IN ('pending', 'deleted')
                    AND bound_run_id IS NULL
                """,
                (upload_id, user_id),
            ).fetchone()
            connection.execute("COMMIT")
        return existing is not None

    def list_uploads_pending_deletion(self, *, limit: int) -> tuple[StoredAIUpload, ...]:
        if isinstance(limit, bool) or not isinstance(limit, int) or not 1 <= limit <= 100:
            raise ValueError("upload cleanup limit must be between 1 and 100")
        self.ensure_schema()
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            connection.execute(
                """
                UPDATE ai_uploads SET deletion_state = 'pending'
                WHERE deletion_state = 'available' AND bound_run_id IS NULL
                    AND expires_at <= ?
                """,
                (self._clock_ns(),),
            )
            rows = connection.execute(
                """
                SELECT * FROM ai_uploads WHERE deletion_state = 'pending'
                ORDER BY expires_at, id LIMIT ?
                """,
                (limit,),
            ).fetchall()
            connection.execute("COMMIT")
        return tuple(self._upload(row) for row in rows)

    def mark_upload_deleted(self, *, upload_id: str) -> bool:
        self.ensure_schema()
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            updated = connection.execute(
                """
                UPDATE ai_uploads
                SET deletion_state = 'deleted', deleted_at = ?
                WHERE id = ? AND deletion_state = 'pending'
                """,
                (self._clock_ns(), upload_id),
            )
            if updated.rowcount == 1:
                connection.execute("COMMIT")
                return True
            existing = connection.execute(
                "SELECT id FROM ai_uploads WHERE id = ? AND deletion_state = 'deleted'",
                (upload_id,),
            ).fetchone()
            connection.execute("COMMIT")
        return existing is not None

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
        source_upload_id: str | None = None,
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
                bound_upload = connection.execute(
                    "SELECT id FROM ai_uploads WHERE bound_run_id = ? AND user_id = ?",
                    (run.id, user_id),
                ).fetchone()
                bound_upload_id = str(bound_upload["id"]) if bound_upload is not None else None
                if bound_upload_id != source_upload_id:
                    connection.execute("ROLLBACK")
                    raise AIIdempotencyConflictError
                connection.execute("COMMIT")
                return run, False
            run_id = str(uuid.uuid4())
            now = self._clock_ns()
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
            if source_upload_id is not None:
                bound = connection.execute(
                    """
                    UPDATE ai_uploads SET bound_run_id = ?
                    WHERE id = ? AND user_id = ? AND bound_run_id IS NULL
                        AND deletion_state = 'available' AND expires_at > ?
                    """,
                    (run_id, source_upload_id, user_id, now),
                )
                if bound.rowcount != 1:
                    connection.execute("ROLLBACK")
                    raise AIUploadUnavailableError
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

    def get_run(self, *, run_id: str) -> StoredAIRun | None:
        self.ensure_schema()
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM ai_runs WHERE id = ?",
                (run_id,),
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
            now = self._clock_ns()
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
            connection.execute(
                """
                UPDATE ai_artifacts SET deletion_state = 'pending'
                WHERE run_id = ? AND user_id = ? AND deletion_state = 'available'
                """,
                (run_id, user_id),
            )
            connection.execute(
                """
                UPDATE ai_artifact_reservations SET deletion_state = 'pending'
                WHERE run_id = ? AND user_id = ? AND deletion_state = 'reserved'
                """,
                (run_id, user_id),
            )
            deleted = connection.execute("SELECT * FROM ai_runs WHERE id = ?", (run_id,)).fetchone()
            connection.execute("COMMIT")
        return self._run(deleted)

    def claim_pending(
        self,
        *,
        now: int | None = None,
        artifact_prefix: str = "ai-uploads",
    ) -> StoredAIClaim | None:
        if not re.fullmatch(
            r"[A-Za-z0-9_-]+(?:/[A-Za-z0-9_-]+)*",
            artifact_prefix,
        ):
            raise ValueError("AI artifact prefix is invalid")
        self.ensure_schema()
        current = int(time.time()) if now is None else now
        lease_token = secrets.token_urlsafe(32)
        lease_hash = hashlib.sha256(lease_token.encode()).hexdigest()
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            self._expire_stale_submitted_run(connection, now=current)
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
                connection.execute("COMMIT")
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
                (self._clock_ns(), row["id"]),
            )
            reservation_row = None
            if row["tool_id"] in {"ai_image_studio", "ai_image_edit_studio"}:
                reservation_row = connection.execute(
                    "SELECT * FROM ai_artifact_reservations WHERE run_id = ?",
                    (row["id"],),
                ).fetchone()
                if reservation_row is None:
                    artifact_id = str(uuid.uuid4())
                    token = secrets.token_hex(32)
                    object_key = f"{artifact_prefix}/{token[:2]}/{token[2:]}"
                    connection.execute(
                        """
                        INSERT INTO ai_artifact_reservations(
                            artifact_id, run_id, user_id, object_key, created_at,
                            deletion_state
                        ) VALUES (?, ?, ?, ?, ?, 'reserved')
                        """,
                        (artifact_id, row["id"], row["user_id"], object_key, current),
                    )
                    reservation_row = connection.execute(
                        "SELECT * FROM ai_artifact_reservations WHERE run_id = ?",
                        (row["id"],),
                    ).fetchone()
            connection.execute("COMMIT")
        return StoredAIClaim(
            run_id=str(row["id"]),
            attempt_number=attempt_number,
            lease_token=lease_token,
            lease_expires_at=lease_expires_at,
            tool_id=str(row["tool_id"]),
            contract_version=str(row["contract_version"]),
            model_policy=str(row["model_policy"]),
            user_id=str(row["user_id"]),
            input_json=str(row["input_json"]),
            artifact_reservation=(
                self._artifact_reservation(reservation_row)
                if reservation_row is not None
                else None
            ),
        )

    def _expire_stale_submitted_run(
        self,
        connection: sqlite3.Connection,
        *,
        now: int,
    ) -> None:
        row = connection.execute(
            """
            SELECT r.*, a.attempt_number AS stale_attempt_number
            FROM ai_runs AS r
            JOIN ai_run_attempts AS a ON a.run_id = r.id
            WHERE r.state = 'running'
                AND a.attempt_number = (
                    SELECT MAX(latest.attempt_number)
                    FROM ai_run_attempts AS latest WHERE latest.run_id = r.id
                )
                AND a.lease_expires_at <= ?
                AND a.submitted_at IS NOT NULL
                AND a.completed_at IS NULL
            ORDER BY a.lease_expires_at ASC, r.id ASC LIMIT 1
            """,
            (now,),
        ).fetchone()
        if row is None:
            return
        run = self._run(row)
        updated_at = self._clock_ns()
        self._settle_reservation(
            connection,
            run=run,
            operation_type="release",
            available_delta=run.credit_price,
            reserved_delta=-run.credit_price,
            reason="AI run ended as provider_unknown",
            created_at=updated_at,
        )
        connection.execute(
            """
            UPDATE ai_runs
            SET state = 'provider_unknown',
                public_error_code = 'ai_provider_outcome_unknown', updated_at = ?
            WHERE id = ? AND state = 'running'
            """,
            (updated_at, run.id),
        )
        connection.execute(
            """
            UPDATE ai_run_attempts SET completed_at = ?
            WHERE run_id = ? AND attempt_number = ? AND completed_at IS NULL
            """,
            (now, run.id, int(row["stale_attempt_number"])),
        )
        connection.execute(
            """
            UPDATE ai_uploads SET deletion_state = 'pending'
            WHERE bound_run_id = ? AND deletion_state = 'available'
            """,
            (run.id,),
        )
        connection.execute(
            """
            UPDATE ai_artifact_reservations SET deletion_state = 'pending'
            WHERE run_id = ? AND deletion_state = 'reserved'
            """,
            (run.id,),
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
        provider_cost_nano_usd: int = 0,
        artifact: StoredAIArtifact | None = None,
        now: int | None = None,
    ) -> StoredAIRun:
        self._validate_provider_usage(
            provider_request_id=provider_request_id,
            input_units=input_units,
            output_units=output_units,
            provider_cost_nano_usd=provider_cost_nano_usd,
        )
        current = int(time.time()) if now is None else now
        token_hash = hashlib.sha256(lease_token.encode()).hexdigest()
        if hashlib.sha256(output_json.encode()).hexdigest() != output_sha256:
            raise CreditIntegrityError("AI output digest does not match content")
        self.ensure_schema()
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            existing = connection.execute(
                "SELECT * FROM ai_runs WHERE id = ?",
                (run_id,),
            ).fetchone()
            if existing is not None and existing["state"] == "succeeded":
                attempt = connection.execute(
                    """
                    SELECT * FROM ai_run_attempts WHERE run_id = ?
                    ORDER BY attempt_number DESC LIMIT 1
                    """,
                    (run_id,),
                ).fetchone()
                if (
                    attempt is not None
                    and attempt["completed_at"] is not None
                    and hmac.compare_digest(str(attempt["lease_token_hash"]), token_hash)
                    and hmac.compare_digest(str(existing["output_sha256"]), output_sha256)
                    and attempt["provider_request_id"] == provider_request_id
                    and int(attempt["input_units"]) == input_units
                    and int(attempt["output_units"]) == output_units
                    and attempt["provider_cost_nano_usd"] is not None
                    and int(attempt["provider_cost_nano_usd"]) == provider_cost_nano_usd
                ):
                    persisted_artifact = connection.execute(
                        "SELECT * FROM ai_artifacts WHERE run_id = ?",
                        (run_id,),
                    ).fetchone()
                    artifact_matches = (
                        artifact is None and persisted_artifact is None
                    ) or (
                        artifact is not None
                        and persisted_artifact is not None
                        and artifact.id == persisted_artifact["id"]
                        and artifact.object_key == persisted_artifact["object_key"]
                        and artifact.media_type == persisted_artifact["media_type"]
                        and artifact.byte_size == persisted_artifact["byte_size"]
                        and artifact.sha256 == persisted_artifact["sha256"]
                    )
                    if artifact_matches:
                        connection.execute("COMMIT")
                        return self._run(existing)
                connection.execute("ROLLBACK")
                raise AILeaseLostError
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
                created_at=self._clock_ns(),
            )
            updated_at = self._clock_ns()
            if artifact is not None:
                if artifact.run_id != run_id or artifact.user_id != run.user_id:
                    connection.execute("ROLLBACK")
                    raise CreditIntegrityError("AI artifact ownership does not match run")
                reservation = connection.execute(
                    """
                    SELECT * FROM ai_artifact_reservations
                    WHERE run_id = ? AND user_id = ? AND deletion_state = 'reserved'
                    """,
                    (run_id, run.user_id),
                ).fetchone()
                if (
                    reservation is None
                    or artifact.id != reservation["artifact_id"]
                    or artifact.object_key != reservation["object_key"]
                ):
                    connection.execute("ROLLBACK")
                    raise CreditIntegrityError("AI artifact does not match its reservation")
                connection.execute(
                    """
                    INSERT INTO ai_artifacts(
                        id, run_id, user_id, object_key, media_type,
                        byte_size, sha256, created_at, deletion_state
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available')
                    """,
                    (
                        artifact.id,
                        run_id,
                        run.user_id,
                        artifact.object_key,
                        artifact.media_type,
                        artifact.byte_size,
                        artifact.sha256,
                        artifact.created_at,
                    ),
                )
                connection.execute(
                    """
                    UPDATE ai_artifact_reservations SET deletion_state = 'committed'
                    WHERE artifact_id = ? AND deletion_state = 'reserved'
                    """,
                    (artifact.id,),
                )
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
                    input_units = ?, output_units = ?, provider_cost_nano_usd = ?
                WHERE run_id = ? AND attempt_number = ?
                """,
                (
                    current,
                    provider_request_id,
                    input_units,
                    output_units,
                    provider_cost_nano_usd,
                    run_id,
                    attempt["attempt_number"],
                ),
            )
            connection.execute(
                """
                UPDATE ai_uploads SET deletion_state = 'pending'
                WHERE bound_run_id = ? AND deletion_state = 'available'
                """,
                (run_id,),
            )
            row = connection.execute("SELECT * FROM ai_runs WHERE id = ?", (run_id,)).fetchone()
            connection.execute("COMMIT")
        return self._run(row)

    def get_artifact_for_user(
        self,
        *,
        user_id: str,
        run_id: str,
        artifact_id: str,
    ) -> StoredAIArtifact | None:
        self.ensure_schema()
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT artifact.* FROM ai_artifacts AS artifact
                JOIN ai_runs AS run ON run.id = artifact.run_id
                WHERE artifact.id = ? AND artifact.run_id = ? AND run.user_id = ?
                    AND run.state = 'succeeded' AND artifact.deletion_state = 'available'
                """,
                (artifact_id, run_id, user_id),
            ).fetchone()
        return self._artifact(row) if row is not None else None

    def list_artifacts_pending_deletion(self, *, limit: int) -> tuple[StoredAIArtifact, ...]:
        if isinstance(limit, bool) or not isinstance(limit, int) or not 1 <= limit <= 100:
            raise ValueError("artifact cleanup limit must be between 1 and 100")
        self.ensure_schema()
        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT * FROM ai_artifacts WHERE deletion_state = 'pending'
                ORDER BY created_at, id LIMIT ?
                """,
                (limit,),
            ).fetchall()
        return tuple(self._artifact(row) for row in rows)

    def mark_artifact_deleted(self, *, artifact_id: str) -> bool:
        self.ensure_schema()
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            updated = connection.execute(
                """
                UPDATE ai_artifacts SET deletion_state = 'deleted'
                WHERE id = ? AND deletion_state = 'pending'
                """,
                (artifact_id,),
            )
            if updated.rowcount == 1:
                connection.execute("COMMIT")
                return True
            existing = connection.execute(
                "SELECT id FROM ai_artifacts WHERE id = ? AND deletion_state = 'deleted'",
                (artifact_id,),
            ).fetchone()
            connection.execute("COMMIT")
        return existing is not None

    def get_artifact_reservation(
        self,
        *,
        run_id: str,
    ) -> StoredAIArtifactReservation | None:
        self.ensure_schema()
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM ai_artifact_reservations WHERE run_id = ?",
                (run_id,),
            ).fetchone()
        return self._artifact_reservation(row) if row is not None else None

    def list_artifact_reservations_pending_deletion(
        self,
        *,
        limit: int,
    ) -> tuple[StoredAIArtifactReservation, ...]:
        if isinstance(limit, bool) or not isinstance(limit, int) or not 1 <= limit <= 100:
            raise ValueError("artifact cleanup limit must be between 1 and 100")
        self.ensure_schema()
        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT * FROM ai_artifact_reservations WHERE deletion_state = 'pending'
                ORDER BY created_at, artifact_id LIMIT ?
                """,
                (limit,),
            ).fetchall()
        return tuple(self._artifact_reservation(row) for row in rows)

    def mark_artifact_reservation_deleted(self, *, artifact_id: str) -> bool:
        self.ensure_schema()
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            updated = connection.execute(
                """
                UPDATE ai_artifact_reservations SET deletion_state = 'deleted'
                WHERE artifact_id = ? AND deletion_state = 'pending'
                """,
                (artifact_id,),
            )
            if updated.rowcount == 1:
                connection.execute("COMMIT")
                return True
            existing = connection.execute(
                """
                SELECT artifact_id FROM ai_artifact_reservations
                WHERE artifact_id = ? AND deletion_state = 'deleted'
                """,
                (artifact_id,),
            ).fetchone()
            connection.execute("COMMIT")
        return existing is not None

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
                created_at=self._clock_ns(),
            )
            connection.execute(
                """
                UPDATE ai_runs SET state = ?, public_error_code = ?, updated_at = ?
                WHERE id = ?
                """,
                (state, error_code, self._clock_ns(), run_id),
            )
            connection.execute(
                """
                UPDATE ai_run_attempts SET completed_at = ?
                WHERE run_id = ? AND attempt_number = ?
                """,
                (current, run_id, attempt["attempt_number"]),
            )
            connection.execute(
                """
                UPDATE ai_uploads SET deletion_state = 'pending'
                WHERE bound_run_id = ? AND deletion_state = 'available'
                """,
                (run_id,),
            )
            connection.execute(
                """
                UPDATE ai_artifact_reservations SET deletion_state = 'pending'
                WHERE run_id = ? AND deletion_state = 'reserved'
                """,
                (run_id,),
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
            or not hmac.compare_digest(str(attempt["lease_token_hash"]), token_hash)
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
    def _validate_upload(
        *,
        upload_id: str,
        object_key: str,
        media_type: str,
        byte_size: int,
        width: int,
        height: int,
        sha256: str,
    ) -> None:
        try:
            canonical_id = str(uuid.UUID(upload_id))
        except (ValueError, AttributeError) as error:
            raise ValueError("upload ID is invalid") from error
        if canonical_id != upload_id:
            raise ValueError("upload ID is invalid")
        if (
            object_key != object_key.strip()
            or not object_key
            or len(object_key) > 512
            or any(ord(character) < 0x21 or ord(character) > 0x7E for character in object_key)
        ):
            raise ValueError("upload object key is invalid")
        if media_type not in {"image/jpeg", "image/png", "image/webp"}:
            raise ValueError("upload media type is invalid")
        if (
            isinstance(byte_size, bool)
            or not isinstance(byte_size, int)
            or not 1 <= byte_size <= 4 * 1024 * 1024
        ):
            raise ValueError("upload byte size is invalid")
        if any(
            isinstance(value, bool) or not isinstance(value, int) or not 1 <= value <= 8192
            for value in (width, height)
        ) or width * height > 8_000_000:
            raise ValueError("upload dimensions are invalid")
        if len(sha256) != 64 or any(character not in "0123456789abcdef" for character in sha256):
            raise ValueError("upload SHA-256 is invalid")

    @staticmethod
    def _validate_provider_usage(
        *,
        provider_request_id: str | None,
        input_units: int,
        output_units: int,
        provider_cost_nano_usd: int,
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
        if (
            isinstance(provider_cost_nano_usd, bool)
            or not isinstance(provider_cost_nano_usd, int)
            or not 0 <= provider_cost_nano_usd <= 1_000_000_000_000
        ):
            raise ValueError("provider cost must use bounded nano-USD")

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
    def _upload(row: sqlite3.Row) -> StoredAIUpload:
        return StoredAIUpload(
            id=str(row["id"]),
            user_id=str(row["user_id"]),
            object_key=str(row["object_key"]),
            media_type=str(row["media_type"]),
            byte_size=int(row["byte_size"]),
            width=int(row["width"]),
            height=int(row["height"]),
            sha256=str(row["sha256"]),
            created_at=int(row["created_at"]),
            expires_at=int(row["expires_at"]),
            bound_run_id=(
                str(row["bound_run_id"]) if row["bound_run_id"] is not None else None
            ),
            deletion_state=str(row["deletion_state"]),
            deleted_at=int(row["deleted_at"]) if row["deleted_at"] is not None else None,
        )

    @staticmethod
    def _artifact(row: sqlite3.Row) -> StoredAIArtifact:
        return StoredAIArtifact(
            id=str(row["id"]),
            run_id=str(row["run_id"]),
            user_id=str(row["user_id"]),
            object_key=str(row["object_key"]),
            media_type=str(row["media_type"]),
            byte_size=int(row["byte_size"]),
            sha256=str(row["sha256"]),
            created_at=int(row["created_at"]),
            deletion_state=str(row["deletion_state"]),
        )

    @staticmethod
    def _artifact_reservation(row: sqlite3.Row) -> StoredAIArtifactReservation:
        return StoredAIArtifactReservation(
            artifact_id=str(row["artifact_id"]),
            run_id=str(row["run_id"]),
            user_id=str(row["user_id"]),
            object_key=str(row["object_key"]),
            created_at=int(row["created_at"]),
            deletion_state=str(row["deletion_state"]),
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
