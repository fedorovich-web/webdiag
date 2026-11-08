from __future__ import annotations

import sqlite3
import threading
import time
import uuid
from dataclasses import dataclass
from pathlib import Path

from webdiag_api.accounts.models import AccountUser, utc_datetime


@dataclass(frozen=True, slots=True)
class StoredUser:
    id: str
    email: str
    display_name: str
    password_hash: str
    created_at: int

    def public(self) -> AccountUser:
        return AccountUser(
            id=self.id,
            email=self.email,
            display_name=self.display_name,
            created_at=utc_datetime(self.created_at),
        )


class _ClosableConnection(sqlite3.Connection):
    def __exit__(self, exc_type: object, exc_val: object, exc_tb: object) -> bool | None:
        try:
            return super().__exit__(exc_type, exc_val, exc_tb)
        finally:
            self.close()


class SqliteAccountStore:
    def __init__(self, database_path: str) -> None:
        self._path = Path(database_path)
        self._schema_lock = threading.Lock()
        self._schema_ready = False

    @property
    def database_path(self) -> str:
        return str(self._path)

    def _connect(self) -> sqlite3.Connection:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(
            self._path, timeout=10, isolation_level=None, factory=_ClosableConnection
        )
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
                    CREATE TABLE IF NOT EXISTS account_users (
                        id TEXT PRIMARY KEY,
                        email TEXT NOT NULL UNIQUE,
                        display_name TEXT NOT NULL,
                        password_hash TEXT NOT NULL,
                        created_at INTEGER NOT NULL
                    );
                    CREATE TABLE IF NOT EXISTS account_sessions (
                        token_hash TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        created_at INTEGER NOT NULL,
                        expires_at INTEGER NOT NULL,
                        FOREIGN KEY(user_id) REFERENCES account_users(id) ON DELETE CASCADE
                    );
                    CREATE INDEX IF NOT EXISTS account_sessions_user_id_idx
                        ON account_sessions(user_id);
                    CREATE INDEX IF NOT EXISTS account_sessions_expires_at_idx
                        ON account_sessions(expires_at);
                    CREATE TABLE IF NOT EXISTS account_login_attempts (
                        identity_hash TEXT PRIMARY KEY,
                        failed_attempts INTEGER NOT NULL CHECK(failed_attempts >= 1),
                        window_started_at INTEGER NOT NULL,
                        blocked_until INTEGER NOT NULL,
                        updated_at INTEGER NOT NULL
                    );
                    CREATE INDEX IF NOT EXISTS account_login_attempts_updated_at_idx
                        ON account_login_attempts(updated_at);
                    CREATE TABLE IF NOT EXISTS account_oauth_identities (
                        provider TEXT NOT NULL, subject TEXT NOT NULL,
                        user_id TEXT NOT NULL REFERENCES account_users(id),
                        PRIMARY KEY(provider, subject), UNIQUE(provider, user_id)
                    );
                    CREATE TABLE IF NOT EXISTS account_oauth_links (
                        token_hash TEXT PRIMARY KEY, subject TEXT NOT NULL,
                        user_id TEXT NOT NULL REFERENCES account_users(id),
                        expires_at INTEGER NOT NULL,
                        recovery_hash TEXT, recovery_expires_at INTEGER,
                        recovery_attempts INTEGER NOT NULL DEFAULT 0,
                        recovery_sent_at INTEGER NOT NULL DEFAULT 0
                    );
                    CREATE INDEX IF NOT EXISTS account_oauth_links_expiry
                        ON account_oauth_links(expires_at);
                    CREATE TABLE IF NOT EXISTS account_oauth_mail_limits (
                        user_id TEXT PRIMARY KEY REFERENCES account_users(id),
                        sent_at INTEGER NOT NULL
                    );
                    """
                )
            self._schema_ready = True

    def resolve_yandex_user(
        self,
        *,
        subject: str,
        email: str,
        display_name: str,
        password_hash: str,
    ) -> tuple[StoredUser, bool]:
        self.ensure_schema()
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                "SELECT u.* FROM account_users u "
                "JOIN account_oauth_identities i ON i.user_id = u.id "
                "WHERE i.provider = 'yandex' AND i.subject = ?",
                (subject,),
            ).fetchone()
            if row is not None:
                connection.execute("COMMIT")
                return self._stored_user(row), False
            row = connection.execute(
                "SELECT * FROM account_users WHERE email = ?", (email,)
            ).fetchone()
            if row is not None:
                raise ValueError("account_link_required")
            is_new = row is None
            if is_new:
                user_id = str(uuid.uuid4())
                connection.execute(
                    "INSERT INTO account_users VALUES (?, ?, ?, ?, ?)",
                    (user_id, email, display_name, password_hash, int(time.time())),
                )
                row = connection.execute(
                    "SELECT * FROM account_users WHERE id = ?", (user_id,)
                ).fetchone()
            self._bind_yandex_identity(connection, subject, row["id"])
            connection.execute("COMMIT")
        return self._stored_user(row), is_new

    @staticmethod
    def _bind_yandex_identity(connection: sqlite3.Connection, subject: str, user_id: str) -> None:
        rows = connection.execute(
            "SELECT subject, user_id FROM account_oauth_identities "
            "WHERE provider = 'yandex' AND (subject = ? OR user_id = ?)",
            (subject, user_id),
        ).fetchall()
        if rows:
            if all(row["subject"] == subject and row["user_id"] == user_id for row in rows):
                return
            raise ValueError("account_oauth_conflict")
        connection.execute(
            "INSERT INTO account_oauth_identities VALUES ('yandex', ?, ?)", (subject, user_id)
        )

    def create_oauth_link(self, *, token_hash: str, subject: str, user_id: str) -> None:
        self.ensure_schema()
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            connection.execute(
                "DELETE FROM account_oauth_links WHERE expires_at <= ? OR user_id = ?",
                (int(time.time()), user_id),
            )
            connection.execute(
                "INSERT INTO account_oauth_links(token_hash, subject, user_id, expires_at) "
                "VALUES (?, ?, ?, ?)",
                (token_hash, subject, user_id, int(time.time()) + 600),
            )
            connection.execute("COMMIT")

    def prepare_oauth_recovery(self, *, token_hash: str, code_hash: str) -> str:
        self.ensure_schema()
        now = int(time.time())
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                "SELECT l.*, u.email FROM account_oauth_links l "
                "JOIN account_users u ON u.id = l.user_id "
                "WHERE token_hash = ? AND expires_at > ?",
                (token_hash, now),
            ).fetchone()
            if row is None:
                raise ValueError("account_oauth_link_expired")
            limit = connection.execute(
                "SELECT sent_at FROM account_oauth_mail_limits WHERE user_id = ?",
                (row["user_id"],),
            ).fetchone()
            if limit and limit["sent_at"] > now - 60:
                raise ValueError("account_oauth_recovery_rate_limited")
            connection.execute(
                "INSERT INTO account_oauth_mail_limits VALUES (?, ?) ON CONFLICT(user_id) "
                "DO UPDATE SET sent_at = excluded.sent_at",
                (row["user_id"], now),
            )
            connection.execute(
                "UPDATE account_oauth_links SET recovery_hash = ?, recovery_expires_at = ?, "
                "recovery_attempts = 0, recovery_sent_at = ? WHERE token_hash = ?",
                (code_hash, min(now + 600, row["expires_at"]), now, token_hash),
            )
            connection.execute("COMMIT")
        return row["email"]

    def consume_oauth_recovery(
        self, *, token_hash: str, code_hash: str, password_hash: str
    ) -> StoredUser | None:
        import hmac

        self.ensure_schema()
        now = int(time.time())
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                "SELECT * FROM account_oauth_links WHERE token_hash = ? AND expires_at > ? "
                "AND recovery_expires_at > ? AND recovery_attempts < 5",
                (token_hash, now, now),
            ).fetchone()
            if row is None:
                return None
            if not row["recovery_hash"] or not hmac.compare_digest(row["recovery_hash"], code_hash):
                connection.execute(
                    "UPDATE account_oauth_links SET recovery_attempts = recovery_attempts + 1 "
                    "WHERE token_hash = ?",
                    (token_hash,),
                )
                connection.execute("COMMIT")
                return None
            self._bind_yandex_identity(connection, row["subject"], row["user_id"])
            connection.execute(
                "UPDATE account_users SET password_hash = ? WHERE id = ?",
                (password_hash, row["user_id"]),
            )
            connection.execute("DELETE FROM account_sessions WHERE user_id = ?", (row["user_id"],))
            user = connection.execute(
                "SELECT * FROM account_users WHERE id = ?", (row["user_id"],)
            ).fetchone()
            connection.execute(
                "DELETE FROM account_oauth_links WHERE token_hash = ?", (token_hash,)
            )
            connection.execute("COMMIT")
        return self._stored_user(user)

    def create_user(self, *, email: str, display_name: str, password_hash: str) -> StoredUser:
        self.ensure_schema()
        user = StoredUser(
            id=str(uuid.uuid4()),
            email=email,
            display_name=display_name,
            password_hash=password_hash,
            created_at=int(time.time()),
        )
        try:
            with self._connect() as connection:
                connection.execute("BEGIN IMMEDIATE")
                connection.execute(
                    """
                    INSERT INTO account_users(id, email, display_name, password_hash, created_at)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (user.id, user.email, user.display_name, user.password_hash, user.created_at),
                )
                connection.execute("COMMIT")
        except sqlite3.IntegrityError as error:
            raise ValueError("account_email_exists") from error
        return user

    def get_user_by_email(self, email: str) -> StoredUser | None:
        self.ensure_schema()
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT id, email, display_name, password_hash, created_at
                FROM account_users
                WHERE email = ?
                """,
                (email,),
            ).fetchone()
        return self._stored_user(row)

    def get_user_by_id(self, user_id: str) -> StoredUser | None:
        self.ensure_schema()
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT id, email, display_name, password_hash, created_at
                FROM account_users
                WHERE id = ?
                """,
                (user_id,),
            ).fetchone()
        return self._stored_user(row)

    def create_session(
        self,
        *,
        token_hash: str,
        user_id: str,
        expires_at: int,
        active_session_limit: int,
    ) -> None:
        self.ensure_schema()
        now = int(time.time())
        created_at = time.time_ns()
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            connection.execute("DELETE FROM account_sessions WHERE expires_at <= ?", (now,))
            connection.execute(
                """
                INSERT INTO account_sessions(token_hash, user_id, created_at, expires_at)
                VALUES (?, ?, ?, ?)
                """,
                (token_hash, user_id, created_at, expires_at),
            )
            connection.execute(
                """
                DELETE FROM account_sessions
                WHERE token_hash IN (
                    SELECT token_hash
                    FROM account_sessions
                    WHERE user_id = ?
                    ORDER BY created_at DESC, token_hash DESC
                    LIMIT -1 OFFSET ?
                )
                """,
                (user_id, active_session_limit),
            )
            connection.execute("COMMIT")

    def get_user_id_for_session(self, *, token_hash: str, now: int | None = None) -> str | None:
        self.ensure_schema()
        current_time = int(time.time()) if now is None else now
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                """
                SELECT user_id, expires_at
                FROM account_sessions
                WHERE token_hash = ?
                """,
                (token_hash,),
            ).fetchone()
            if row is not None and int(row["expires_at"]) <= current_time:
                connection.execute(
                    "DELETE FROM account_sessions WHERE token_hash = ?",
                    (token_hash,),
                )
                row = None
            connection.execute("COMMIT")
        return str(row["user_id"]) if row else None

    def delete_session(self, *, token_hash: str) -> None:
        self.ensure_schema()
        with self._connect() as connection:
            connection.execute("DELETE FROM account_sessions WHERE token_hash = ?", (token_hash,))

    def create_session_if_password_hash(
        self,
        *,
        token_hash: str,
        user_id: str,
        expected_password_hash: str,
        replacement_password_hash: str | None,
        expires_at: int,
        active_session_limit: int,
    ) -> bool:
        self.ensure_schema()
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            if replacement_password_hash is None:
                current = connection.execute(
                    """
                    SELECT 1 FROM account_users
                    WHERE id = ? AND password_hash = ?
                    """,
                    (user_id, expected_password_hash),
                ).fetchone()
                matched = current is not None
            else:
                cursor = connection.execute(
                    """
                    UPDATE account_users SET password_hash = ?
                    WHERE id = ? AND password_hash = ?
                    """,
                    (replacement_password_hash, user_id, expected_password_hash),
                )
                matched = cursor.rowcount == 1
            if not matched:
                connection.execute("ROLLBACK")
                return False
            connection.execute(
                """
                INSERT INTO account_sessions(token_hash, user_id, created_at, expires_at)
                VALUES (?, ?, ?, ?)
                """,
                (token_hash, user_id, time.time_ns(), expires_at),
            )
            connection.execute(
                """
                DELETE FROM account_sessions
                WHERE token_hash IN (
                    SELECT token_hash
                    FROM account_sessions
                    WHERE user_id = ?
                    ORDER BY created_at DESC, token_hash DESC
                    LIMIT -1 OFFSET ?
                )
                """,
                (user_id, active_session_limit),
            )
            connection.execute("COMMIT")
        return True

    def active_session_count_for_token(
        self,
        *,
        current_token_hash: str,
        now: int | None = None,
    ) -> int | None:
        self.ensure_schema()
        current_time = int(time.time()) if now is None else now
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            connection.execute(
                "DELETE FROM account_sessions WHERE expires_at <= ?",
                (current_time,),
            )
            session = connection.execute(
                "SELECT user_id FROM account_sessions WHERE token_hash = ?",
                (current_token_hash,),
            ).fetchone()
            if session is None:
                connection.execute("COMMIT")
                return None
            row = connection.execute(
                "SELECT COUNT(*) FROM account_sessions WHERE user_id = ?",
                (str(session["user_id"]),),
            ).fetchone()
            connection.execute("COMMIT")
        return int(row[0]) if row is not None else 0

    def delete_other_sessions_for_token(
        self,
        *,
        current_token_hash: str,
        now: int | None = None,
    ) -> int | None:
        self.ensure_schema()
        current_time = int(time.time()) if now is None else now
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            connection.execute(
                "DELETE FROM account_sessions WHERE expires_at <= ?",
                (current_time,),
            )
            session = connection.execute(
                "SELECT user_id FROM account_sessions WHERE token_hash = ?",
                (current_token_hash,),
            ).fetchone()
            if session is None:
                connection.execute("COMMIT")
                return None
            cursor = connection.execute(
                """
                DELETE FROM account_sessions
                WHERE user_id = ? AND token_hash <> ?
                """,
                (str(session["user_id"]), current_token_hash),
            )
            connection.execute("COMMIT")
        return max(0, cursor.rowcount)

    def rotate_password_and_session(
        self,
        *,
        user_id: str,
        expected_password_hash: str,
        password_hash: str,
        token_hash: str,
        expires_at: int,
    ) -> bool:
        self.ensure_schema()
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            cursor = connection.execute(
                """
                UPDATE account_users SET password_hash = ?
                WHERE id = ? AND password_hash = ?
                """,
                (password_hash, user_id, expected_password_hash),
            )
            if cursor.rowcount != 1:
                connection.execute("ROLLBACK")
                return False
            connection.execute(
                "DELETE FROM account_sessions WHERE user_id = ?",
                (user_id,),
            )
            connection.execute(
                """
                INSERT INTO account_sessions(token_hash, user_id, created_at, expires_at)
                VALUES (?, ?, ?, ?)
                """,
                (token_hash, user_id, time.time_ns(), expires_at),
            )
            connection.execute("COMMIT")
        return True

    def get_login_retry_after(self, *, identity_hash: str, now: int) -> int | None:
        self.ensure_schema()
        with self._connect() as connection:
            row = connection.execute(
                "SELECT blocked_until FROM account_login_attempts WHERE identity_hash = ?",
                (identity_hash,),
            ).fetchone()
        if row is None or int(row["blocked_until"]) <= now:
            return None
        return int(row["blocked_until"]) - now

    def record_login_failure(
        self,
        *,
        identity_hash: str,
        now: int,
        attempt_limit: int,
        window_seconds: int,
        block_seconds: int,
    ) -> int | None:
        self.ensure_schema()
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                """
                SELECT failed_attempts, window_started_at, blocked_until
                FROM account_login_attempts
                WHERE identity_hash = ?
                """,
                (identity_hash,),
            ).fetchone()
            if row is not None and int(row["blocked_until"]) > now:
                connection.execute("COMMIT")
                return int(row["blocked_until"]) - now
            if row is None or int(row["window_started_at"]) + window_seconds <= now:
                failed_attempts = 1
                window_started_at = now
            else:
                failed_attempts = int(row["failed_attempts"]) + 1
                window_started_at = int(row["window_started_at"])
            blocked_until = now + block_seconds if failed_attempts >= attempt_limit else 0
            connection.execute(
                """
                INSERT INTO account_login_attempts(
                    identity_hash, failed_attempts, window_started_at, blocked_until, updated_at
                ) VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(identity_hash) DO UPDATE SET
                    failed_attempts = excluded.failed_attempts,
                    window_started_at = excluded.window_started_at,
                    blocked_until = excluded.blocked_until,
                    updated_at = excluded.updated_at
                """,
                (identity_hash, failed_attempts, window_started_at, blocked_until, now),
            )
            connection.execute(
                "DELETE FROM account_login_attempts WHERE updated_at <= ?",
                (now - max(window_seconds, block_seconds) * 2,),
            )
            connection.execute(
                """
                DELETE FROM account_login_attempts
                WHERE identity_hash IN (
                    SELECT identity_hash FROM account_login_attempts
                    ORDER BY updated_at DESC, identity_hash DESC
                    LIMIT -1 OFFSET 10000
                )
                """
            )
            connection.execute("COMMIT")
        return block_seconds if blocked_until else None

    def clear_login_failures(self, *, identity_hash: str) -> None:
        self.ensure_schema()
        with self._connect() as connection:
            connection.execute(
                "DELETE FROM account_login_attempts WHERE identity_hash = ?",
                (identity_hash,),
            )

    def update_password_hash(self, *, user_id: str, expected_hash: str, password_hash: str) -> None:
        self.ensure_schema()
        with self._connect() as connection:
            connection.execute(
                """
                UPDATE account_users SET password_hash = ?
                WHERE id = ? AND password_hash = ?
                """,
                (password_hash, user_id, expected_hash),
            )

    @staticmethod
    def _stored_user(row: sqlite3.Row | None) -> StoredUser | None:
        if row is None:
            return None
        return StoredUser(
            id=str(row["id"]),
            email=str(row["email"]),
            display_name=str(row["display_name"]),
            password_hash=str(row["password_hash"]),
            created_at=int(row["created_at"]),
        )
