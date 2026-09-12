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


class SqliteAccountStore:
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
                    """
                )
            self._schema_ready = True

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
