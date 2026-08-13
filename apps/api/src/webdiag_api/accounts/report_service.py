from __future__ import annotations

import hashlib
import re
import secrets
import time
from datetime import UTC, datetime, timedelta

from webdiag_api.accounts.report_artifact import (
    build_report_snapshot,
    render_report_html,
    report_filename,
)
from webdiag_api.accounts.report_models import (
    AccountReportDetailResponse,
    AccountReportListResponse,
    AccountReportShareResponse,
    PublicReportResponse,
    ReportCreateRequest,
    ReportShareRequest,
)
from webdiag_api.accounts.report_storage import ReportIntegrityError, SqliteReportStore
from webdiag_api.accounts.workspace_service import WorkspaceService, WorkspaceServiceError

_SHARE_TOKEN_RE = re.compile(r"^[A-Za-z0-9_-]{40,80}$")


class ReportServiceError(RuntimeError):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


class ReportService:
    def __init__(self, store: SqliteReportStore, *, workspace: WorkspaceService) -> None:
        self._store = store
        self._workspace = workspace

    def create_report(
        self,
        *,
        user_id: str,
        project_id: str,
        audit_id: str,
        request: ReportCreateRequest,
    ) -> AccountReportDetailResponse:
        try:
            audit = self._workspace.get_saved_audit(
                user_id=user_id,
                project_id=project_id,
                audit_id=audit_id,
            )
        except WorkspaceServiceError as error:
            raise ReportServiceError(error.status_code, error.code, error.message) from error
        try:
            snapshot = build_report_snapshot(
                audit,
                title=request.title,
                locale=request.locale,
            )
            report = self._store.create_report(
                user_id=user_id,
                project_id=project_id,
                audit_id=audit_id,
                snapshot=snapshot,
            )
            detail = report.detail()
        except ReportIntegrityError as error:
            raise self._private_unavailable() from error
        except ValueError as error:
            code = str(error)
            mapping = {
                "account_report_title_invalid": (400, "Report title is invalid."),
                "account_report_locale_invalid": (400, "Report locale is invalid."),
                "account_report_too_large": (413, "Report snapshot is too large."),
                "account_report_limit_reached": (409, "Saved report limit reached."),
                "account_saved_audit_not_found": (404, "Audit was not found."),
            }
            status, message = mapping.get(code, (400, "Report could not be created."))
            raise ReportServiceError(status, code, message) from error
        return detail

    def list_reports(
        self,
        *,
        user_id: str,
        project_id: str | None = None,
    ) -> AccountReportListResponse:
        try:
            return AccountReportListResponse(
                reports=tuple(
                    report.list_item()
                    for report in self._store.list_reports(
                        user_id=user_id,
                        project_id=project_id,
                    )
                )
            )
        except ReportIntegrityError as error:
            raise self._private_unavailable() from error

    def get_report(self, *, user_id: str, report_id: str) -> AccountReportDetailResponse:
        try:
            report = self._store.get_report(user_id=user_id, report_id=report_id)
            if report is None:
                raise ReportServiceError(
                    404, "account_report_not_found", "Report was not found."
                )
            return report.detail()
        except ReportIntegrityError as error:
            raise self._private_unavailable() from error

    def enable_share(
        self,
        *,
        user_id: str,
        report_id: str,
        request: ReportShareRequest,
    ) -> AccountReportShareResponse:
        try:
            if self._store.get_report(user_id=user_id, report_id=report_id) is None:
                raise ReportServiceError(
                    404, "account_report_not_found", "Report was not found."
                )
            token = secrets.token_urlsafe(32)
            token_hash = self._hash_token(token)
            expires = datetime.now(UTC) + timedelta(days=request.expires_in_days)
            stored = self._store.set_share(
                user_id=user_id,
                report_id=report_id,
                token_hash=token_hash,
                expires_at=int(expires.timestamp()),
            )
            if stored is None:
                raise ReportServiceError(
                    404, "account_report_not_found", "Report was not found."
                )
        except ReportIntegrityError as error:
            raise self._private_unavailable() from error
        return AccountReportShareResponse(
            report_id=report_id,
            share_token=token,
            share_path=f"/reports/share/{token}",
            expires_at=expires,
        )

    def revoke_share(self, *, user_id: str, report_id: str) -> AccountReportDetailResponse:
        try:
            report = self._store.revoke_share(user_id=user_id, report_id=report_id)
            if report is None:
                raise ReportServiceError(
                    404, "account_report_not_found", "Report was not found."
                )
            return report.detail()
        except ReportIntegrityError as error:
            raise self._private_unavailable() from error

    def get_public_report(self, *, share_token: str) -> PublicReportResponse:
        report = self._shared_report(share_token)
        try:
            return report.public(now=int(time.time()))
        except ReportIntegrityError as error:
            raise self._public_not_found() from error

    def private_html(self, *, user_id: str, report_id: str) -> tuple[bytes, str]:
        detail = self.get_report(user_id=user_id, report_id=report_id)
        return render_report_html(detail.snapshot), report_filename(detail.report.title, report_id)

    def public_html(self, *, share_token: str) -> tuple[bytes, str]:
        report = self._shared_report(share_token)
        try:
            return render_report_html(report.snapshot()), report_filename(report.title, report.id)
        except ReportIntegrityError as error:
            raise self._public_not_found() from error

    def _shared_report(self, token: str):
        if not _SHARE_TOKEN_RE.fullmatch(token):
            raise ReportServiceError(404, "public_report_not_found", "Report was not found.")
        try:
            report = self._store.get_shared_report(
                token_hash=self._hash_token(token),
                now=int(time.time()),
            )
        except ReportIntegrityError as error:
            raise self._public_not_found() from error
        if report is None:
            raise ReportServiceError(404, "public_report_not_found", "Report was not found.")
        return report

    @staticmethod
    def _private_unavailable() -> ReportServiceError:
        return ReportServiceError(
            500,
            "account_report_unavailable",
            "Report is unavailable.",
        )

    @staticmethod
    def _public_not_found() -> ReportServiceError:
        return ReportServiceError(
            404,
            "public_report_not_found",
            "Report was not found.",
        )

    @staticmethod
    def _hash_token(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()
