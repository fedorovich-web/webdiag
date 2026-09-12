from __future__ import annotations

from functools import lru_cache
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response

from webdiag_api.accounts.api import AccountServiceDependency, SessionCookie
from webdiag_api.accounts.report_models import (
    AccountReportDetailResponse,
    AccountReportListResponse,
    AccountReportShareResponse,
    PublicReportResponse,
    ReportCreateRequest,
    ReportShareRequest,
)
from webdiag_api.accounts.report_service import ReportService, ReportServiceError
from webdiag_api.accounts.report_storage import SqliteReportStore
from webdiag_api.accounts.service import AccountServiceError
from webdiag_api.accounts.workspace_api import get_workspace_service
from webdiag_api.config import settings

account_router = APIRouter(prefix="/v1/account", tags=["account-reports"])
public_router = APIRouter(prefix="/v1/public/reports", tags=["public-reports"])


@lru_cache(maxsize=1)
def get_report_service() -> ReportService:
    return ReportService(
        SqliteReportStore(settings.account_database_path),
        workspace=get_workspace_service(),
    )


ReportServiceDependency = Annotated[ReportService, Depends(get_report_service)]
ShareToken = str


def _current_user_id(
    account_service: AccountServiceDependency,
    session_token: SessionCookie,
) -> str:
    try:
        return account_service.get_session(session_token).user.id
    except AccountServiceError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail={"code": error.code, "message": error.message},
            headers={"Cache-Control": "no-store"},
        ) from error


def _report_error(error: ReportServiceError) -> HTTPException:
    return HTTPException(
        status_code=error.status_code,
        detail={"code": error.code, "message": error.message},
        headers={"Cache-Control": "no-store"},
    )


def _html_response(content: bytes, *, filename: str, download: bool) -> Response:
    disposition = "attachment" if download else "inline"
    return Response(
        content=content,
        media_type="text/html",
        headers={
            "Cache-Control": "no-store",
            "Content-Disposition": f'{disposition}; filename="{filename}"',
            "Content-Security-Policy": (
                "default-src 'none'; style-src 'unsafe-inline'; img-src data:; "
                "base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
            ),
            "Referrer-Policy": "no-referrer",
            "X-Content-Type-Options": "nosniff",
            "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
        },
    )


@account_router.post(
    "/projects/{project_id}/audits/{audit_id}/reports",
    response_model=AccountReportDetailResponse,
    status_code=201,
)
def create_report(
    project_id: UUID,
    audit_id: UUID,
    request: ReportCreateRequest,
    response: Response,
    reports: ReportServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> AccountReportDetailResponse:
    response.headers["cache-control"] = "no-store"
    user_id = _current_user_id(account_service, webdiag_session)
    try:
        return reports.create_report(
            user_id=user_id,
            project_id=str(project_id),
            audit_id=str(audit_id),
            request=request,
        )
    except ReportServiceError as error:
        raise _report_error(error) from error


@account_router.get("/reports", response_model=AccountReportListResponse)
def list_reports(
    response: Response,
    reports: ReportServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> AccountReportListResponse:
    response.headers["cache-control"] = "no-store"
    user_id = _current_user_id(account_service, webdiag_session)
    return reports.list_reports(user_id=user_id)


@account_router.get("/reports/{report_id}", response_model=AccountReportDetailResponse)
def get_report(
    report_id: UUID,
    response: Response,
    reports: ReportServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> AccountReportDetailResponse:
    response.headers["cache-control"] = "no-store"
    user_id = _current_user_id(account_service, webdiag_session)
    try:
        return reports.get_report(user_id=user_id, report_id=str(report_id))
    except ReportServiceError as error:
        raise _report_error(error) from error


@account_router.post(
    "/reports/{report_id}/share",
    response_model=AccountReportShareResponse,
)
def enable_report_share(
    report_id: UUID,
    request: ReportShareRequest,
    response: Response,
    reports: ReportServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> AccountReportShareResponse:
    response.headers["cache-control"] = "no-store"
    user_id = _current_user_id(account_service, webdiag_session)
    try:
        return reports.enable_share(
            user_id=user_id,
            report_id=str(report_id),
            request=request,
        )
    except ReportServiceError as error:
        raise _report_error(error) from error


@account_router.delete(
    "/reports/{report_id}/share",
    response_model=AccountReportDetailResponse,
)
def revoke_report_share(
    report_id: UUID,
    response: Response,
    reports: ReportServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> AccountReportDetailResponse:
    response.headers["cache-control"] = "no-store"
    user_id = _current_user_id(account_service, webdiag_session)
    try:
        return reports.revoke_share(user_id=user_id, report_id=str(report_id))
    except ReportServiceError as error:
        raise _report_error(error) from error


@account_router.get("/reports/{report_id}/export.html")
def download_report_html(
    report_id: UUID,
    reports: ReportServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> Response:
    user_id = _current_user_id(account_service, webdiag_session)
    try:
        content, filename = reports.private_html(user_id=user_id, report_id=str(report_id))
    except ReportServiceError as error:
        raise _report_error(error) from error
    return _html_response(content, filename=filename, download=True)


@account_router.get("/reports/{report_id}/print")
def print_report_html(
    report_id: UUID,
    reports: ReportServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> Response:
    user_id = _current_user_id(account_service, webdiag_session)
    try:
        content, filename = reports.private_html(user_id=user_id, report_id=str(report_id))
    except ReportServiceError as error:
        raise _report_error(error) from error
    return _html_response(content, filename=filename, download=False)


@public_router.get("/{share_token}", response_model=PublicReportResponse)
def get_public_report(
    share_token: ShareToken,
    response: Response,
    reports: ReportServiceDependency,
) -> PublicReportResponse:
    response.headers.update(
        {
            "cache-control": "no-store",
            "x-robots-tag": "noindex, nofollow, noarchive, nosnippet",
            "referrer-policy": "no-referrer",
        }
    )
    try:
        return reports.get_public_report(share_token=share_token)
    except ReportServiceError as error:
        raise _report_error(error) from error


@public_router.get("/{share_token}/export.html")
def download_public_report_html(
    share_token: ShareToken,
    reports: ReportServiceDependency,
) -> Response:
    try:
        content, filename = reports.public_html(share_token=share_token)
    except ReportServiceError as error:
        raise _report_error(error) from error
    return _html_response(content, filename=filename, download=True)


@public_router.get("/{share_token}/print")
def print_public_report_html(
    share_token: ShareToken,
    reports: ReportServiceDependency,
) -> Response:
    try:
        content, filename = reports.public_html(share_token=share_token)
    except ReportServiceError as error:
        raise _report_error(error) from error
    return _html_response(content, filename=filename, download=False)
