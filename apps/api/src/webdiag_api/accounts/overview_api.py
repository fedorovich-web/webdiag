from __future__ import annotations

from functools import lru_cache
from typing import Annotated

from fastapi import APIRouter, Depends, Response

from webdiag_api.accounts.api import (
    AccountServiceDependency,
    SessionCookie,
    current_account_user_id,
)
from webdiag_api.accounts.monitoring_storage import SqliteMonitoringStore
from webdiag_api.accounts.overview_models import AccountOverviewResponse
from webdiag_api.accounts.overview_service import AccountOverviewService
from webdiag_api.accounts.report_storage import SqliteReportStore
from webdiag_api.accounts.workspace_storage import SqliteWorkspaceStore
from webdiag_api.config import settings

router = APIRouter(prefix="/v1/account", tags=["account-overview"])


@lru_cache(maxsize=1)
def get_account_overview_service() -> AccountOverviewService:
    database_path = settings.account_database_path
    return AccountOverviewService(
        workspace_store=SqliteWorkspaceStore(database_path),
        monitoring_store=SqliteMonitoringStore(database_path),
        report_store=SqliteReportStore(database_path),
    )


OverviewServiceDependency = Annotated[
    AccountOverviewService, Depends(get_account_overview_service)
]


@router.get("/overview", response_model=AccountOverviewResponse)
def get_account_overview(
    response: Response,
    overview: OverviewServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> AccountOverviewResponse:
    response.headers["cache-control"] = "no-store"
    user_id = current_account_user_id(account_service, webdiag_session)
    return overview.get_overview(user_id=user_id)
