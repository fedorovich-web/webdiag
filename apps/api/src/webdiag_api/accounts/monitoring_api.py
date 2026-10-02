from __future__ import annotations

import hmac
from functools import lru_cache
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Response
from pydantic import BaseModel, ConfigDict, Field

from webdiag_api.accounts.api import AccountServiceDependency, SessionCookie
from webdiag_api.accounts.monitoring_models import (
    AccountMonitor,
    MonitorCreateRequest,
    MonitorHistoryResponse,
    MonitorListResponse,
    MonitorRunResponse,
    MonitorUpdateRequest,
)
from webdiag_api.accounts.monitoring_service import MonitoringService, MonitoringServiceError
from webdiag_api.accounts.monitoring_storage import SqliteMonitoringStore
from webdiag_api.accounts.service import AccountServiceError
from webdiag_api.accounts.workspace_storage import SqliteWorkspaceStore
from webdiag_api.audit.api import get_audit_service
from webdiag_api.config import settings

router = APIRouter(tags=["account-monitoring"])


class InternalRunDueResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: str = "webdiag.monitoring.run_due.v1"
    processed: int = Field(ge=0, le=20)


@lru_cache(maxsize=1)
def get_monitoring_service() -> MonitoringService:
    return MonitoringService(
        SqliteMonitoringStore(settings.account_database_path),
        workspace_store=SqliteWorkspaceStore(settings.account_database_path),
        audit_service=get_audit_service(),
    )


MonitoringServiceDependency = Annotated[MonitoringService, Depends(get_monitoring_service)]


def _user_id(account_service: AccountServiceDependency, token: SessionCookie) -> str:
    try:
        return account_service.get_session(token).user.id
    except AccountServiceError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail={"code": error.code, "message": error.message},
            headers={"Cache-Control": "no-store"},
        ) from error


def _error(error: MonitoringServiceError) -> HTTPException:
    return HTTPException(
        status_code=error.status_code,
        detail={"code": error.code, "message": error.message},
        headers={"Cache-Control": "no-store"},
    )


def _no_store(response: Response) -> None:
    response.headers["cache-control"] = "no-store"


@router.post(
    "/v1/account/projects/{project_id}/monitor",
    response_model=AccountMonitor,
    status_code=201,
)
def create_monitor(
    project_id: UUID,
    request: MonitorCreateRequest,
    response: Response,
    monitoring: MonitoringServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> AccountMonitor:
    _no_store(response)
    try:
        return monitoring.create_monitor(
            user_id=_user_id(account_service, webdiag_session),
            project_id=str(project_id),
            request=request,
        )
    except MonitoringServiceError as error:
        raise _error(error) from error


@router.get("/v1/account/monitors", response_model=MonitorListResponse)
def list_monitors(
    response: Response,
    monitoring: MonitoringServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> MonitorListResponse:
    _no_store(response)
    return monitoring.list_monitors(user_id=_user_id(account_service, webdiag_session))


@router.get(
    "/v1/account/projects/{project_id}/monitor",
    response_model=AccountMonitor,
)
def get_monitor(
    project_id: UUID,
    response: Response,
    monitoring: MonitoringServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> AccountMonitor:
    _no_store(response)
    try:
        return monitoring.get_monitor(
            user_id=_user_id(account_service, webdiag_session),
            project_id=str(project_id),
        )
    except MonitoringServiceError as error:
        raise _error(error) from error


@router.patch(
    "/v1/account/projects/{project_id}/monitor",
    response_model=AccountMonitor,
)
def update_monitor(
    project_id: UUID,
    request: MonitorUpdateRequest,
    response: Response,
    monitoring: MonitoringServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> AccountMonitor:
    _no_store(response)
    try:
        return monitoring.update_monitor(
            user_id=_user_id(account_service, webdiag_session),
            project_id=str(project_id),
            request=request,
        )
    except MonitoringServiceError as error:
        raise _error(error) from error


@router.get(
    "/v1/account/projects/{project_id}/monitor/history",
    response_model=MonitorHistoryResponse,
)
def monitor_history(
    project_id: UUID,
    response: Response,
    monitoring: MonitoringServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> MonitorHistoryResponse:
    _no_store(response)
    try:
        return monitoring.get_history(
            user_id=_user_id(account_service, webdiag_session),
            project_id=str(project_id),
        )
    except MonitoringServiceError as error:
        raise _error(error) from error


@router.post(
    "/v1/account/projects/{project_id}/monitor/run",
    response_model=MonitorRunResponse,
    status_code=201,
)
def run_monitor(
    project_id: UUID,
    response: Response,
    monitoring: MonitoringServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> MonitorRunResponse:
    _no_store(response)
    try:
        return monitoring.run_monitor(
            user_id=_user_id(account_service, webdiag_session),
            project_id=str(project_id),
        )
    except MonitoringServiceError as error:
        raise _error(error) from error


@router.post(
    "/v1/internal/monitoring/run-due",
    response_model=InternalRunDueResponse,
    include_in_schema=False,
)
def run_due_monitors(
    response: Response,
    monitoring: MonitoringServiceDependency,
    authorization: Annotated[str | None, Header()] = None,
) -> InternalRunDueResponse:
    _no_store(response)
    expected = settings.monitoring_internal_token
    supplied = authorization.removeprefix("Bearer ") if authorization else ""
    if not expected or not hmac.compare_digest(supplied, expected):
        raise HTTPException(
            status_code=401,
            detail={"code": "monitoring_internal_unauthorized", "message": "Unauthorized."},
            headers={"Cache-Control": "no-store"},
        )
    return InternalRunDueResponse(processed=monitoring.run_due())
