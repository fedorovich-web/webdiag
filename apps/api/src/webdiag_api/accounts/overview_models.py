from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from webdiag_api.accounts.monitoring_models import AccountMonitor
from webdiag_api.accounts.workspace_models import AccountProject, SavedAuditSummary


class AccountOverviewProject(BaseModel):
    model_config = ConfigDict(extra="forbid")

    project: AccountProject
    latest_audit: SavedAuditSummary | None = None
    monitor: AccountMonitor | None = None
    report_count: int = Field(ge=0)
    shared_report_count: int = Field(ge=0)
    latest_report_created_at: datetime | None = None


class AccountOverviewResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.account.overview.v1"] = (
        "webdiag.account.overview.v1"
    )
    projects: tuple[AccountOverviewProject, ...]
