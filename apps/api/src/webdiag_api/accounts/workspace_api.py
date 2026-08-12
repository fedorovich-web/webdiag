from __future__ import annotations

from functools import lru_cache
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Path as ApiPath, Query, Response

from webdiag_api.accounts.api import (
    AccountServiceDependency,
    SessionCookie,
)
from webdiag_api.accounts.workspace_issues import (
    AccountIssueDetailResponse,
    AccountIssueListResponse,
    IssueListOptions,
    NormalizedIssueCategory,
    IssueOrder,
    IssuePriority,
    IssueSort,
    project_saved_audit_issue,
    project_saved_audit_issues,
)
from webdiag_api.accounts.workspace_models import (
    AccountProject,
    AccountProjectDetailResponse,
    AccountProjectListResponse,
    ProjectCreateRequest,
    SavedAuditDetailResponse,
)
from webdiag_api.accounts.service import AccountServiceError
from webdiag_api.accounts.workspace_service import WorkspaceService, WorkspaceServiceError
from webdiag_api.accounts.workspace_storage import SqliteWorkspaceStore
from webdiag_api.audit.api import get_audit_service
from webdiag_api.config import settings

router = APIRouter(prefix="/v1/account", tags=["account-workspace"])


@lru_cache(maxsize=1)
def get_workspace_service() -> WorkspaceService:
    return WorkspaceService(
        SqliteWorkspaceStore(settings.account_database_path),
        audit_service=get_audit_service(),
    )


WorkspaceServiceDependency = Annotated[WorkspaceService, Depends(get_workspace_service)]


def _workspace_error(error: WorkspaceServiceError) -> HTTPException:
    return HTTPException(
        status_code=error.status_code,
        detail={"code": error.code, "message": error.message},
        headers={"Cache-Control": "no-store"},
    )


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


@router.post("/projects", response_model=AccountProject, status_code=201)
def create_project(
    request: ProjectCreateRequest,
    response: Response,
    workspace: WorkspaceServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> AccountProject:
    response.headers["cache-control"] = "no-store"
    user_id = _current_user_id(account_service, webdiag_session)
    try:
        return workspace.create_project(user_id=user_id, request=request)
    except WorkspaceServiceError as error:
        raise _workspace_error(error) from error


@router.get("/projects", response_model=AccountProjectListResponse)
def list_projects(
    response: Response,
    workspace: WorkspaceServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> AccountProjectListResponse:
    response.headers["cache-control"] = "no-store"
    user_id = _current_user_id(account_service, webdiag_session)
    return workspace.list_projects(user_id=user_id)


@router.get("/projects/{project_id}", response_model=AccountProjectDetailResponse)
def get_project(
    project_id: UUID,
    response: Response,
    workspace: WorkspaceServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> AccountProjectDetailResponse:
    response.headers["cache-control"] = "no-store"
    user_id = _current_user_id(account_service, webdiag_session)
    try:
        return workspace.get_project(user_id=user_id, project_id=str(project_id))
    except WorkspaceServiceError as error:
        raise _workspace_error(error) from error


@router.post(
    "/projects/{project_id}/audits",
    response_model=SavedAuditDetailResponse,
    status_code=201,
)
def run_project_audit(
    project_id: UUID,
    response: Response,
    workspace: WorkspaceServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> SavedAuditDetailResponse:
    response.headers["cache-control"] = "no-store"
    user_id = _current_user_id(account_service, webdiag_session)
    try:
        return workspace.run_and_save_audit(user_id=user_id, project_id=str(project_id))
    except WorkspaceServiceError as error:
        raise _workspace_error(error) from error


@router.get(
    "/projects/{project_id}/audits/{audit_id}",
    response_model=SavedAuditDetailResponse,
)
def get_saved_audit(
    project_id: UUID,
    audit_id: UUID,
    response: Response,
    workspace: WorkspaceServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> SavedAuditDetailResponse:
    response.headers["cache-control"] = "no-store"
    user_id = _current_user_id(account_service, webdiag_session)
    try:
        return workspace.get_saved_audit(
            user_id=user_id,
            project_id=str(project_id),
            audit_id=str(audit_id),
        )
    except WorkspaceServiceError as error:
        raise _workspace_error(error) from error


@router.get(
    "/projects/{project_id}/audits/{audit_id}/issues",
    response_model=AccountIssueListResponse,
)
def list_saved_audit_issues(
    project_id: UUID,
    audit_id: UUID,
    response: Response,
    workspace: WorkspaceServiceDependency,
    account_service: AccountServiceDependency,
    category: NormalizedIssueCategory | None = Query(default=None),
    priority: IssuePriority | None = Query(default=None),
    sort: IssueSort = Query(default="priority"),
    order: IssueOrder = Query(default="asc"),
    webdiag_session: SessionCookie = None,
) -> AccountIssueListResponse:
    response.headers["cache-control"] = "no-store"
    user_id = _current_user_id(account_service, webdiag_session)
    try:
        detail = workspace.get_saved_audit(
            user_id=user_id,
            project_id=str(project_id),
            audit_id=str(audit_id),
        )
    except WorkspaceServiceError as error:
        raise _workspace_error(error) from error
    return project_saved_audit_issues(
        detail,
        IssueListOptions(
            category=category,
            priority=priority,
            sort=sort,
            order=order,
        ),
    )


@router.get(
    "/projects/{project_id}/audits/{audit_id}/issues/{issue_id}",
    response_model=AccountIssueDetailResponse,
)
def get_saved_audit_issue(
    project_id: UUID,
    audit_id: UUID,
    issue_id: Annotated[str, ApiPath(pattern=r"^[A-Za-z0-9._:-]{1,120}$")],
    response: Response,
    workspace: WorkspaceServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> AccountIssueDetailResponse:
    response.headers["cache-control"] = "no-store"
    user_id = _current_user_id(account_service, webdiag_session)
    try:
        detail = workspace.get_saved_audit(
            user_id=user_id,
            project_id=str(project_id),
            audit_id=str(audit_id),
        )
    except WorkspaceServiceError as error:
        raise _workspace_error(error) from error
    projected = project_saved_audit_issue(detail, issue_id)
    if projected is None:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "account_issue_not_found",
                "message": "Issue was not found.",
            },
            headers={"Cache-Control": "no-store"},
        )
    return projected
