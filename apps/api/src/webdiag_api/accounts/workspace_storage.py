from __future__ import annotations

import hashlib
import hmac
import sqlite3
import threading
import time
import uuid
from dataclasses import dataclass
from pathlib import Path

from pydantic import ValidationError

from webdiag_api.accounts.models import utc_datetime
from webdiag_api.accounts.workspace_models import (
    AccountProject,
    ArchivedAccountProject,
    SavedAuditPayload,
    SavedAuditSummary,
)

MAX_PROJECTS_PER_ACCOUNT = 100
MAX_AUDITS_PER_PROJECT = 100


class WorkspaceStoreIntegrityError(RuntimeError):
    """Persisted saved-audit data failed its schema or digest check."""


def _payload_digest(payload_json: str) -> str:
    return hashlib.sha256(payload_json.encode("utf-8")).hexdigest()


@dataclass(frozen=True, slots=True)
class StoredProject:
    id: str
    user_id: str
    name: str
    origin: str
    created_at: int
    updated_at: int
    archived_at: int | None

    def public(self) -> AccountProject:
        return AccountProject(
            id=self.id,
            name=self.name,
            origin=self.origin,
            created_at=utc_datetime(self.created_at),
            updated_at=utc_datetime(self.updated_at),
        )

    def archived_public(self) -> ArchivedAccountProject:
        if self.archived_at is None:
            raise ValueError("account_project_not_archived")
        return ArchivedAccountProject(
            id=self.id,
            name=self.name,
            origin=self.origin,
            created_at=utc_datetime(self.created_at),
            updated_at=utc_datetime(self.updated_at),
            archived_at=utc_datetime(self.archived_at),
        )


@dataclass(frozen=True, slots=True)
class StoredAudit:
    id: str
    project_id: str
    user_id: str
    status: str
    score: int | None
    check_count: int
    issue_count: int
    completed_at: int
    created_at: int
    payload_json: str
    payload_sha256: str

    def summary(self) -> SavedAuditSummary:
        return SavedAuditSummary(
            id=self.id,
            project_id=self.project_id,
            status="succeeded",
            score=self.score,
            check_count=self.check_count,
            issue_count=self.issue_count,
            completed_at=utc_datetime(self.completed_at),
            created_at=utc_datetime(self.created_at),
        )

    def payload(self) -> SavedAuditPayload:
        actual = _payload_digest(self.payload_json)
        if not self.payload_sha256 or not hmac.compare_digest(actual, self.payload_sha256):
            raise WorkspaceStoreIntegrityError("persisted saved-audit digest does not match")
        try:
            payload = SavedAuditPayload.model_validate_json(self.payload_json, strict=True)
        except (ValidationError, ValueError) as error:
            raise WorkspaceStoreIntegrityError(
                "persisted saved-audit payload is invalid"
            ) from error
        if (
            self.status != payload.status
            or self.score != payload.score
            or self.check_count != len(payload.checks)
            or self.issue_count != len(payload.issues)
            or self.completed_at != int(payload.completed_at.timestamp())
        ):
            raise WorkspaceStoreIntegrityError(
                "persisted saved-audit summary does not match its payload"
            )
        return payload


class SqliteWorkspaceStore:
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
                    CREATE TABLE IF NOT EXISTS account_workspace_projects (
                        id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        name TEXT NOT NULL,
                        origin TEXT NOT NULL,
                        created_at INTEGER NOT NULL,
                        updated_at INTEGER NOT NULL,
                        archived_at INTEGER,
                        UNIQUE(user_id, origin),
                        FOREIGN KEY(user_id) REFERENCES account_users(id) ON DELETE CASCADE
                    );
                    CREATE INDEX IF NOT EXISTS account_workspace_projects_user_idx
                        ON account_workspace_projects(user_id, updated_at DESC, id DESC);

                    CREATE TABLE IF NOT EXISTS account_workspace_saved_audits (
                        id TEXT PRIMARY KEY,
                        project_id TEXT NOT NULL,
                        user_id TEXT NOT NULL,
                        status TEXT NOT NULL CHECK(status = 'succeeded'),
                        score INTEGER,
                        check_count INTEGER NOT NULL,
                        issue_count INTEGER NOT NULL,
                        completed_at INTEGER NOT NULL,
                        created_at INTEGER NOT NULL,
                        payload_version TEXT NOT NULL,
                        payload_json TEXT NOT NULL,
                        payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256) = 64),
                        FOREIGN KEY(project_id) REFERENCES account_workspace_projects(id)
                            ON DELETE CASCADE,
                        FOREIGN KEY(user_id) REFERENCES account_users(id) ON DELETE CASCADE
                    );
                    CREATE INDEX IF NOT EXISTS account_workspace_saved_audits_project_idx
                        ON account_workspace_saved_audits(
                            user_id, project_id, completed_at DESC, id DESC
                        );
                    """
                )
                connection.execute("BEGIN IMMEDIATE")
                try:
                    project_columns = {
                        str(row[1])
                        for row in connection.execute(
                            "PRAGMA table_info(account_workspace_projects)"
                        ).fetchall()
                    }
                    if "archived_at" not in project_columns:
                        connection.execute(
                            """
                            ALTER TABLE account_workspace_projects
                            ADD COLUMN archived_at INTEGER
                            """
                        )
                    connection.execute(
                        """
                        CREATE INDEX IF NOT EXISTS account_workspace_projects_archive_idx
                        ON account_workspace_projects(
                            user_id, archived_at, updated_at DESC, id DESC
                        )
                        """
                    )
                    columns = {
                        str(row[1])
                        for row in connection.execute(
                            "PRAGMA table_info(account_workspace_saved_audits)"
                        ).fetchall()
                    }
                    if "payload_sha256" not in columns:
                        connection.execute(
                            """
                            ALTER TABLE account_workspace_saved_audits
                            ADD COLUMN payload_sha256 TEXT CHECK(length(payload_sha256) = 64)
                            """
                        )
                        rows = connection.execute(
                            "SELECT id, payload_json FROM account_workspace_saved_audits"
                        ).fetchall()
                        for row in rows:
                            payload_json = str(row["payload_json"])
                            SavedAuditPayload.model_validate_json(payload_json, strict=True)
                            connection.execute(
                                """
                                UPDATE account_workspace_saved_audits
                                SET payload_sha256 = ? WHERE id = ?
                                """,
                                (_payload_digest(payload_json), str(row["id"])),
                            )
                    connection.execute("COMMIT")
                except Exception:
                    connection.execute("ROLLBACK")
                    raise
            self._schema_ready = True

    def create_project(self, *, user_id: str, name: str, origin: str) -> StoredProject:
        self.ensure_schema()
        now = int(time.time())
        project = StoredProject(
            id=str(uuid.uuid4()),
            user_id=user_id,
            name=name,
            origin=origin,
            created_at=now,
            updated_at=now,
            archived_at=None,
        )
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            count = int(
                connection.execute(
                    "SELECT COUNT(*) FROM account_workspace_projects WHERE user_id = ?",
                    (user_id,),
                ).fetchone()[0]
            )
            if count >= MAX_PROJECTS_PER_ACCOUNT:
                connection.execute("ROLLBACK")
                raise ValueError("account_project_limit_reached")
            try:
                connection.execute(
                    """
                    INSERT INTO account_workspace_projects(
                        id, user_id, name, origin, created_at, updated_at, archived_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        project.id,
                        project.user_id,
                        project.name,
                        project.origin,
                        project.created_at,
                        project.updated_at,
                        project.archived_at,
                    ),
                )
            except sqlite3.IntegrityError as error:
                connection.execute("ROLLBACK")
                raise ValueError("account_project_origin_exists") from error
            connection.execute("COMMIT")
        return project

    def list_projects(self, *, user_id: str) -> tuple[StoredProject, ...]:
        self.ensure_schema()
        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT id, user_id, name, origin, created_at, updated_at, archived_at
                FROM account_workspace_projects
                WHERE user_id = ? AND archived_at IS NULL
                ORDER BY updated_at DESC, id DESC
                LIMIT ?
                """,
                (user_id, MAX_PROJECTS_PER_ACCOUNT),
            ).fetchall()
        return tuple(self._project(row) for row in rows)

    def list_archived_projects(self, *, user_id: str) -> tuple[StoredProject, ...]:
        self.ensure_schema()
        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT id, user_id, name, origin, created_at, updated_at, archived_at
                FROM account_workspace_projects
                WHERE user_id = ? AND archived_at IS NOT NULL
                ORDER BY archived_at DESC, id DESC
                LIMIT ?
                """,
                (user_id, MAX_PROJECTS_PER_ACCOUNT),
            ).fetchall()
        return tuple(self._project(row) for row in rows)

    def get_project(self, *, user_id: str, project_id: str) -> StoredProject | None:
        self.ensure_schema()
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT id, user_id, name, origin, created_at, updated_at, archived_at
                FROM account_workspace_projects
                WHERE user_id = ? AND id = ? AND archived_at IS NULL
                """,
                (user_id, project_id),
            ).fetchone()
        return self._project(row) if row else None

    def get_archived_project(
        self,
        *,
        user_id: str,
        project_id: str,
    ) -> StoredProject | None:
        self.ensure_schema()
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT id, user_id, name, origin, created_at, updated_at, archived_at
                FROM account_workspace_projects
                WHERE user_id = ? AND id = ? AND archived_at IS NOT NULL
                """,
                (user_id, project_id),
            ).fetchone()
        return self._project(row) if row else None

    def rename_project(
        self,
        *,
        user_id: str,
        project_id: str,
        name: str,
    ) -> StoredProject | None:
        self.ensure_schema()
        now = int(time.time())
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            cursor = connection.execute(
                """
                UPDATE account_workspace_projects
                SET name = ?, updated_at = ?
                WHERE user_id = ? AND id = ? AND archived_at IS NULL
                """,
                (name, now, user_id, project_id),
            )
            if cursor.rowcount != 1:
                connection.execute("ROLLBACK")
                return None
            row = connection.execute(
                """
                SELECT id, user_id, name, origin, created_at, updated_at, archived_at
                FROM account_workspace_projects
                WHERE user_id = ? AND id = ?
                """,
                (user_id, project_id),
            ).fetchone()
            connection.execute("COMMIT")
        return self._project(row)

    def archive_project(
        self,
        *,
        user_id: str,
        project_id: str,
    ) -> StoredProject | None:
        self.ensure_schema()
        now = int(time.time())
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                """
                SELECT id, user_id, name, origin, created_at, updated_at, archived_at
                FROM account_workspace_projects
                WHERE user_id = ? AND id = ?
                """,
                (user_id, project_id),
            ).fetchone()
            if row is None:
                connection.execute("ROLLBACK")
                return None
            if row["archived_at"] is None:
                connection.execute(
                    """
                    UPDATE account_workspace_projects
                    SET archived_at = ?, updated_at = ?
                    WHERE user_id = ? AND id = ? AND archived_at IS NULL
                    """,
                    (now, now, user_id, project_id),
                )
            monitor_table = connection.execute(
                """
                SELECT 1 FROM sqlite_master
                WHERE type = 'table' AND name = 'account_workspace_monitors'
                """
            ).fetchone()
            if monitor_table is not None:
                connection.execute(
                    """
                    UPDATE account_workspace_monitors
                    SET enabled = 0, status = 'pending', next_run_at = NULL,
                        lease_token = NULL, lease_expires_at = NULL, updated_at = ?
                    WHERE user_id = ? AND project_id = ?
                    """,
                    (now, user_id, project_id),
                )
            crawl_table = connection.execute(
                """
                SELECT 1 FROM sqlite_master
                WHERE type = 'table' AND name = 'crawl_jobs'
                """
            ).fetchone()
            if crawl_table is not None:
                connection.execute(
                    """
                    UPDATE crawl_jobs
                    SET state = 'failed', public_error_code = 'crawl_project_archived',
                        updated_at = ?
                    WHERE user_id = ? AND project_id = ?
                        AND state IN ('queued', 'running')
                    """,
                    (now, user_id, project_id),
                )
                connection.execute(
                    """
                    UPDATE crawl_job_attempts
                    SET completed_at = ?
                    WHERE job_id IN (
                        SELECT id FROM crawl_jobs
                        WHERE user_id = ? AND project_id = ?
                            AND public_error_code = 'crawl_project_archived'
                    ) AND completed_at IS NULL
                    """,
                    (now, user_id, project_id),
                )
            archived = connection.execute(
                """
                SELECT id, user_id, name, origin, created_at, updated_at, archived_at
                FROM account_workspace_projects
                WHERE user_id = ? AND id = ?
                """,
                (user_id, project_id),
            ).fetchone()
            connection.execute("COMMIT")
        return self._project(archived)

    def restore_project(
        self,
        *,
        user_id: str,
        project_id: str,
    ) -> StoredProject | None:
        self.ensure_schema()
        now = int(time.time())
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                """
                SELECT id, user_id, name, origin, created_at, updated_at, archived_at
                FROM account_workspace_projects
                WHERE user_id = ? AND id = ?
                """,
                (user_id, project_id),
            ).fetchone()
            if row is None:
                connection.execute("ROLLBACK")
                return None
            if row["archived_at"] is not None:
                connection.execute(
                    """
                    UPDATE account_workspace_projects
                    SET archived_at = NULL, updated_at = ?
                    WHERE user_id = ? AND id = ? AND archived_at IS NOT NULL
                    """,
                    (now, user_id, project_id),
                )
            restored = connection.execute(
                """
                SELECT id, user_id, name, origin, created_at, updated_at, archived_at
                FROM account_workspace_projects
                WHERE user_id = ? AND id = ?
                """,
                (user_id, project_id),
            ).fetchone()
            connection.execute("COMMIT")
        return self._project(restored)

    def save_audit(
        self,
        *,
        user_id: str,
        project_id: str,
        payload: SavedAuditPayload,
    ) -> StoredAudit:
        self.ensure_schema()
        payload_json = payload.model_dump_json()
        if len(payload_json.encode("utf-8")) > 2_000_000:
            raise ValueError("account_saved_audit_too_large")
        completed_at = int(payload.completed_at.timestamp())
        created_at = int(time.time())
        audit = StoredAudit(
            id=str(uuid.uuid4()),
            project_id=project_id,
            user_id=user_id,
            status="succeeded",
            score=payload.score,
            check_count=len(payload.checks),
            issue_count=len(payload.issues),
            completed_at=completed_at,
            created_at=created_at,
            payload_json=payload_json,
            payload_sha256=_payload_digest(payload_json),
        )
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            owned = connection.execute(
                """
                SELECT 1 FROM account_workspace_projects
                WHERE id = ? AND user_id = ? AND archived_at IS NULL
                """,
                (project_id, user_id),
            ).fetchone()
            if owned is None:
                connection.execute("ROLLBACK")
                raise ValueError("account_project_not_found")
            count = int(
                connection.execute(
                    """
                    SELECT COUNT(*) FROM account_workspace_saved_audits
                    WHERE project_id = ? AND user_id = ?
                    """,
                    (project_id, user_id),
                ).fetchone()[0]
            )
            if count >= MAX_AUDITS_PER_PROJECT:
                connection.execute("ROLLBACK")
                raise ValueError("account_saved_audit_limit_reached")
            connection.execute(
                """
                INSERT INTO account_workspace_saved_audits(
                    id, project_id, user_id, status, score, check_count,
                    issue_count, completed_at, created_at, payload_version,
                    payload_json, payload_sha256
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    audit.id,
                    audit.project_id,
                    audit.user_id,
                    audit.status,
                    audit.score,
                    audit.check_count,
                    audit.issue_count,
                    audit.completed_at,
                    audit.created_at,
                    payload.contract_version,
                    audit.payload_json,
                    audit.payload_sha256,
                ),
            )
            connection.execute(
                "UPDATE account_workspace_projects SET updated_at = ? WHERE id = ?",
                (created_at, project_id),
            )
            connection.execute("COMMIT")
        return audit

    def list_audits(self, *, user_id: str, project_id: str) -> tuple[StoredAudit, ...]:
        self.ensure_schema()
        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT id, project_id, user_id, status, score, check_count,
                       issue_count, completed_at, created_at, payload_json, payload_sha256
                FROM account_workspace_saved_audits
                WHERE user_id = ? AND project_id = ?
                ORDER BY completed_at DESC, id DESC
                LIMIT ?
                """,
                (user_id, project_id, MAX_AUDITS_PER_PROJECT),
            ).fetchall()
        return tuple(self._audit(row) for row in rows)

    def list_latest_audits(self, *, user_id: str) -> tuple[StoredAudit, ...]:
        self.ensure_schema()
        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT audit.id, audit.project_id, audit.user_id, audit.status,
                       audit.score, audit.check_count, audit.issue_count,
                       audit.completed_at, audit.created_at, audit.payload_json,
                       audit.payload_sha256
                FROM account_workspace_saved_audits AS audit
                WHERE audit.user_id = ?
                  AND NOT EXISTS (
                    SELECT 1
                    FROM account_workspace_saved_audits AS newer
                    WHERE newer.user_id = audit.user_id
                      AND newer.project_id = audit.project_id
                      AND (
                        newer.completed_at > audit.completed_at
                        OR (
                          newer.completed_at = audit.completed_at
                          AND newer.id > audit.id
                        )
                      )
                  )
                ORDER BY audit.completed_at DESC, audit.id DESC
                LIMIT ?
                """,
                (user_id, MAX_PROJECTS_PER_ACCOUNT),
            ).fetchall()
        return tuple(self._audit(row) for row in rows)

    def get_audit(
        self,
        *,
        user_id: str,
        project_id: str,
        audit_id: str,
    ) -> StoredAudit | None:
        self.ensure_schema()
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT id, project_id, user_id, status, score, check_count,
                       issue_count, completed_at, created_at, payload_json, payload_sha256
                FROM account_workspace_saved_audits
                WHERE user_id = ? AND project_id = ? AND id = ?
                """,
                (user_id, project_id, audit_id),
            ).fetchone()
        return self._audit(row) if row else None

    @staticmethod
    def _project(row: sqlite3.Row) -> StoredProject:
        return StoredProject(
            id=str(row["id"]),
            user_id=str(row["user_id"]),
            name=str(row["name"]),
            origin=str(row["origin"]),
            created_at=int(row["created_at"]),
            updated_at=int(row["updated_at"]),
            archived_at=(
                int(row["archived_at"]) if row["archived_at"] is not None else None
            ),
        )

    @staticmethod
    def _audit(row: sqlite3.Row) -> StoredAudit:
        return StoredAudit(
            id=str(row["id"]),
            project_id=str(row["project_id"]),
            user_id=str(row["user_id"]),
            status=str(row["status"]),
            score=int(row["score"]) if row["score"] is not None else None,
            check_count=int(row["check_count"]),
            issue_count=int(row["issue_count"]),
            completed_at=int(row["completed_at"]),
            created_at=int(row["created_at"]),
            payload_json=str(row["payload_json"]),
            payload_sha256=str(row["payload_sha256"] or ""),
        )
