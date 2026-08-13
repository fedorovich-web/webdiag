from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from webdiag_api.accounts.workspace_models import SavedAuditCheck, SavedAuditIssue

REPORT_SNAPSHOT_VERSION = "webdiag.account.report_snapshot.v1"
REPORT_LIST_VERSION = "webdiag.account.report_list.v2"
REPORT_DETAIL_VERSION = "webdiag.account.report_detail.v1"
REPORT_SHARE_VERSION = "webdiag.account.report_share.v1"
PUBLIC_REPORT_VERSION = "webdiag.public.report.v1"

ReportLocale = Literal["ru", "en"]


class ReportCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=2, max_length=120)
    locale: ReportLocale = "ru"


class ReportShareRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expires_in_days: int = Field(default=7, ge=1, le=30)


class ReportSnapshot(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal[REPORT_SNAPSHOT_VERSION] = REPORT_SNAPSHOT_VERSION
    title: str
    locale: ReportLocale
    project_name: str
    target_origin: str
    audit_completed_at: datetime
    score: int | None = Field(default=None, ge=0, le=100)
    checks: tuple[SavedAuditCheck, ...]
    issues: tuple[SavedAuditIssue, ...]
    generated_at: datetime


class AccountReportSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    project_id: str
    audit_id: str
    title: str
    locale: ReportLocale
    status: Literal["ready"] = "ready"
    created_at: datetime
    updated_at: datetime
    shared: bool
    share_expires_at: datetime | None = None


class AccountReportListItem(AccountReportSummary):
    project_name: str
    target_origin: str
    audit_completed_at: datetime


class AccountReportListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal[REPORT_LIST_VERSION] = REPORT_LIST_VERSION
    reports: tuple[AccountReportListItem, ...]


class AccountReportDetailResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal[REPORT_DETAIL_VERSION] = REPORT_DETAIL_VERSION
    report: AccountReportSummary
    snapshot: ReportSnapshot


class AccountReportShareResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal[REPORT_SHARE_VERSION] = REPORT_SHARE_VERSION
    report_id: str
    share_token: str
    share_path: str
    expires_at: datetime


class PublicReportSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str
    locale: ReportLocale
    created_at: datetime
    expires_at: datetime


class PublicReportResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal[PUBLIC_REPORT_VERSION] = PUBLIC_REPORT_VERSION
    report: PublicReportSummary
    snapshot: ReportSnapshot
