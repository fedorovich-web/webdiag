from __future__ import annotations

import hmac
import re
import sqlite3
import threading
import time
import uuid
from dataclasses import dataclass
from pathlib import Path

from pydantic import ValidationError

from webdiag_api.accounts.models import utc_datetime
from webdiag_api.accounts.report_artifact import artifact_sha256
from webdiag_api.accounts.report_models import (
    AccountReportDetailResponse,
    AccountReportListItem,
    AccountReportSummary,
    PublicReportResponse,
    PublicReportSummary,
    ReportSnapshot,
)

MAX_REPORTS_PER_ACCOUNT = 100
MAX_REPORT_SNAPSHOT_BYTES = 2_000_000
_ARTIFACT_SHA256_RE = re.compile(r"^[0-9a-f]{64}$")


class ReportIntegrityError(RuntimeError):
    pass


def _validated_snapshot(snapshot_json: str) -> ReportSnapshot:
    try:
        return ReportSnapshot.model_validate_json(snapshot_json)
    except ValidationError as error:
        raise ReportIntegrityError("stored_report_snapshot_invalid") from error


@dataclass(frozen=True, slots=True)
class StoredReport:
    id: str
    user_id: str
    project_id: str
    audit_id: str
    title: str
    locale: str
    snapshot_json: str
    artifact_sha256: str | None
    created_at: int
    updated_at: int
    share_token_hash: str | None
    share_expires_at: int | None

    def summary(self, *, now: int | None = None) -> AccountReportSummary:
        current = int(time.time()) if now is None else now
        shared = self.share_token_hash is not None and (
            self.share_expires_at is not None and self.share_expires_at > current
        )
        return AccountReportSummary(
            id=self.id,
            project_id=self.project_id,
            audit_id=self.audit_id,
            title=self.title,
            locale=self.locale,
            created_at=utc_datetime(self.created_at),
            updated_at=utc_datetime(self.updated_at),
            shared=shared,
            share_expires_at=(
                utc_datetime(self.share_expires_at) if shared and self.share_expires_at else None
            ),
        )

    def snapshot(self) -> ReportSnapshot:
        snapshot = _validated_snapshot(self.snapshot_json)
        expected_hash = artifact_sha256(snapshot)
        if (
            self.artifact_sha256 is None
            or not _ARTIFACT_SHA256_RE.fullmatch(self.artifact_sha256)
            or not hmac.compare_digest(self.artifact_sha256, expected_hash)
        ):
            raise ReportIntegrityError("stored_report_artifact_hash_mismatch")
        return snapshot

    def list_item(self, *, now: int | None = None) -> AccountReportListItem:
        snapshot = self.snapshot()
        return AccountReportListItem(
            **self.summary(now=now).model_dump(),
            project_name=snapshot.project_name,
            target_origin=snapshot.target_origin,
            audit_completed_at=snapshot.audit_completed_at,
        )

    def detail(self, *, now: int | None = None) -> AccountReportDetailResponse:
        return AccountReportDetailResponse(report=self.summary(now=now), snapshot=self.snapshot())

    def public(self, *, now: int) -> PublicReportResponse:
        if self.share_expires_at is None:
            raise ValueError("account_report_share_expired")
        return PublicReportResponse(
            report=PublicReportSummary(
                title=self.title,
                locale=self.locale,
                created_at=utc_datetime(self.created_at),
                expires_at=utc_datetime(self.share_expires_at),
            ),
            snapshot=self.snapshot(),
        )


class SqliteReportStore:
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
                connection.execute("BEGIN IMMEDIATE")
                try:
                    connection.execute(
                        """
                        CREATE TABLE IF NOT EXISTS account_workspace_reports (
                            id TEXT PRIMARY KEY,
                            user_id TEXT NOT NULL,
                            project_id TEXT NOT NULL,
                            audit_id TEXT NOT NULL,
                            title TEXT NOT NULL,
                            locale TEXT NOT NULL CHECK(locale IN ('ru', 'en')),
                            snapshot_version TEXT NOT NULL,
                            snapshot_json TEXT NOT NULL,
                            artifact_sha256 TEXT,
                            created_at INTEGER NOT NULL,
                            updated_at INTEGER NOT NULL,
                            share_token_hash TEXT UNIQUE,
                            share_expires_at INTEGER,
                            FOREIGN KEY(user_id) REFERENCES account_users(id) ON DELETE CASCADE,
                            FOREIGN KEY(project_id) REFERENCES account_workspace_projects(id)
                                ON DELETE CASCADE,
                            FOREIGN KEY(audit_id) REFERENCES account_workspace_saved_audits(id)
                                ON DELETE CASCADE
                        )
                        """
                    )
                    columns = {
                        str(row["name"])
                        for row in connection.execute(
                            "PRAGMA table_info(account_workspace_reports)"
                        ).fetchall()
                    }
                    if "artifact_sha256" not in columns:
                        connection.execute(
                            "ALTER TABLE account_workspace_reports "
                            "ADD COLUMN artifact_sha256 TEXT"
                        )
                        legacy_rows = connection.execute(
                            """
                            SELECT id, snapshot_json
                            FROM account_workspace_reports
                            WHERE artifact_sha256 IS NULL
                            """
                        ).fetchall()
                        backfill: list[tuple[str, str]] = []
                        for row in legacy_rows:
                            snapshot = _validated_snapshot(str(row["snapshot_json"]))
                            backfill.append((artifact_sha256(snapshot), str(row["id"])))
                        connection.executemany(
                            """
                            UPDATE account_workspace_reports
                            SET artifact_sha256 = ?
                            WHERE id = ? AND artifact_sha256 IS NULL
                            """,
                            backfill,
                        )
                    connection.execute(
                        """
                        CREATE INDEX IF NOT EXISTS account_workspace_reports_user_idx
                            ON account_workspace_reports(user_id, created_at DESC, id DESC)
                        """
                    )
                    connection.execute(
                        """
                        CREATE INDEX IF NOT EXISTS account_workspace_reports_audit_idx
                            ON account_workspace_reports(
                                user_id, project_id, audit_id, created_at DESC, id DESC
                            )
                        """
                    )
                except Exception:
                    connection.execute("ROLLBACK")
                    raise
                connection.execute("COMMIT")
            self._schema_ready = True

    def create_report(
        self,
        *,
        user_id: str,
        project_id: str,
        audit_id: str,
        snapshot: ReportSnapshot,
    ) -> StoredReport:
        self.ensure_schema()
        snapshot_json = snapshot.model_dump_json()
        if len(snapshot_json.encode("utf-8")) > MAX_REPORT_SNAPSHOT_BYTES:
            raise ValueError("account_report_too_large")
        now = int(time.time())
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            owned = connection.execute(
                """
                SELECT 1
                FROM account_workspace_saved_audits AS audit
                JOIN account_workspace_projects AS project
                  ON project.id = audit.project_id
                WHERE audit.id = ? AND audit.project_id = ?
                  AND audit.user_id = ? AND project.user_id = ?
                  AND project.archived_at IS NULL
                """,
                (audit_id, project_id, user_id, user_id),
            ).fetchone()
            if owned is None:
                connection.execute("ROLLBACK")
                raise ValueError("account_saved_audit_not_found")
            count = int(
                connection.execute(
                    "SELECT COUNT(*) FROM account_workspace_reports WHERE user_id = ?",
                    (user_id,),
                ).fetchone()[0]
            )
            if count >= MAX_REPORTS_PER_ACCOUNT:
                connection.execute("ROLLBACK")
                raise ValueError("account_report_limit_reached")
            report = StoredReport(
                id=str(uuid.uuid4()),
                user_id=user_id,
                project_id=project_id,
                audit_id=audit_id,
                title=snapshot.title,
                locale=snapshot.locale,
                snapshot_json=snapshot_json,
                artifact_sha256=artifact_sha256(snapshot),
                created_at=now,
                updated_at=now,
                share_token_hash=None,
                share_expires_at=None,
            )
            connection.execute(
                """
                INSERT INTO account_workspace_reports(
                    id, user_id, project_id, audit_id, title, locale,
                    snapshot_version, snapshot_json, artifact_sha256, created_at, updated_at,
                    share_token_hash, share_expires_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)
                """,
                (
                    report.id,
                    report.user_id,
                    report.project_id,
                    report.audit_id,
                    report.title,
                    report.locale,
                    snapshot.contract_version,
                    report.snapshot_json,
                    report.artifact_sha256,
                    report.created_at,
                    report.updated_at,
                ),
            )
            connection.execute("COMMIT")
        return report

    def list_reports(
        self,
        *,
        user_id: str,
        project_id: str | None = None,
    ) -> tuple[StoredReport, ...]:
        self.ensure_schema()
        with self._connect() as connection:
            if project_id is None:
                rows = connection.execute(
                    """
                    SELECT id, user_id, project_id, audit_id, title, locale,
                           snapshot_json, artifact_sha256, created_at, updated_at,
                           share_token_hash, share_expires_at
                    FROM account_workspace_reports
                    WHERE user_id = ?
                    ORDER BY created_at DESC, id DESC
                    LIMIT ?
                    """,
                    (user_id, MAX_REPORTS_PER_ACCOUNT),
                ).fetchall()
            else:
                rows = connection.execute(
                    """
                    SELECT id, user_id, project_id, audit_id, title, locale,
                           snapshot_json, artifact_sha256, created_at, updated_at,
                           share_token_hash, share_expires_at
                    FROM account_workspace_reports
                    WHERE user_id = ? AND project_id = ?
                    ORDER BY created_at DESC, id DESC
                    LIMIT ?
                    """,
                    (user_id, project_id, MAX_REPORTS_PER_ACCOUNT),
                ).fetchall()
        return tuple(self._report(row) for row in rows)

    def get_report(self, *, user_id: str, report_id: str) -> StoredReport | None:
        self.ensure_schema()
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT id, user_id, project_id, audit_id, title, locale,
                       snapshot_json, artifact_sha256, created_at, updated_at,
                       share_token_hash, share_expires_at
                FROM account_workspace_reports
                WHERE user_id = ? AND id = ?
                """,
                (user_id, report_id),
            ).fetchone()
        return self._report(row) if row else None

    def set_share(
        self,
        *,
        user_id: str,
        report_id: str,
        token_hash: str,
        expires_at: int,
    ) -> StoredReport | None:
        self.ensure_schema()
        now = int(time.time())
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            cursor = connection.execute(
                """
                UPDATE account_workspace_reports
                SET share_token_hash = ?, share_expires_at = ?, updated_at = ?
                WHERE user_id = ? AND id = ?
                """,
                (token_hash, expires_at, now, user_id, report_id),
            )
            if cursor.rowcount != 1:
                connection.execute("ROLLBACK")
                return None
            connection.execute("COMMIT")
        return self.get_report(user_id=user_id, report_id=report_id)

    def revoke_share(self, *, user_id: str, report_id: str) -> StoredReport | None:
        self.ensure_schema()
        now = int(time.time())
        with self._connect() as connection:
            cursor = connection.execute(
                """
                UPDATE account_workspace_reports
                SET share_token_hash = NULL, share_expires_at = NULL, updated_at = ?
                WHERE user_id = ? AND id = ?
                """,
                (now, user_id, report_id),
            )
            if cursor.rowcount != 1:
                return None
        return self.get_report(user_id=user_id, report_id=report_id)

    def get_shared_report(self, *, token_hash: str, now: int) -> StoredReport | None:
        self.ensure_schema()
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT id, user_id, project_id, audit_id, title, locale,
                       snapshot_json, artifact_sha256, created_at, updated_at,
                       share_token_hash, share_expires_at
                FROM account_workspace_reports
                WHERE share_token_hash = ? AND share_expires_at > ?
                """,
                (token_hash, now),
            ).fetchone()
        return self._report(row) if row else None

    @staticmethod
    def _report(row: sqlite3.Row) -> StoredReport:
        return StoredReport(
            id=str(row["id"]),
            user_id=str(row["user_id"]),
            project_id=str(row["project_id"]),
            audit_id=str(row["audit_id"]),
            title=str(row["title"]),
            locale=str(row["locale"]),
            snapshot_json=str(row["snapshot_json"]),
            artifact_sha256=(
                str(row["artifact_sha256"]) if row["artifact_sha256"] is not None else None
            ),
            created_at=int(row["created_at"]),
            updated_at=int(row["updated_at"]),
            share_token_hash=(
                str(row["share_token_hash"]) if row["share_token_hash"] is not None else None
            ),
            share_expires_at=(
                int(row["share_expires_at"]) if row["share_expires_at"] is not None else None
            ),
        )
