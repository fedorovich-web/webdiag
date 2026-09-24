from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

SAVED_AUDIT_PAYLOAD_VERSION = "webdiag.account.saved_audit_payload.v1"


class ProjectCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=2, max_length=80)
    origin: str = Field(min_length=1, max_length=2_048)


class ProjectRenameRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=2, max_length=80)


class AccountProject(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    name: str
    origin: str
    created_at: datetime
    updated_at: datetime


class AccountProjectListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.account.project_list.v1"] = (
        "webdiag.account.project_list.v1"
    )
    projects: tuple[AccountProject, ...]


class ArchivedAccountProject(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.account.archived_project.v1"] = (
        "webdiag.account.archived_project.v1"
    )
    id: str
    name: str
    origin: str
    created_at: datetime
    updated_at: datetime
    archived_at: datetime


class ArchivedAccountProjectListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.account.archived_project_list.v1"] = (
        "webdiag.account.archived_project_list.v1"
    )
    projects: tuple[ArchivedAccountProject, ...]


class SavedAuditSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    project_id: str
    status: Literal["succeeded"]
    score: int | None = Field(default=None, ge=0, le=100)
    check_count: int = Field(ge=0)
    issue_count: int = Field(ge=0)
    completed_at: datetime
    created_at: datetime


class AccountProjectDetailResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.account.project_detail.v1"] = (
        "webdiag.account.project_detail.v1"
    )
    project: AccountProject
    saved_audits: tuple[SavedAuditSummary, ...]


class SavedAuditCheck(BaseModel):
    model_config = ConfigDict(extra="forbid")

    check_id: str
    name: str
    category: str
    status: str


class SavedAuditRecommendation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    summary: str
    steps: tuple[str, ...]
    expected_impact: str | None = None


class SavedAuditIssue(BaseModel):
    model_config = ConfigDict(extra="forbid")

    issue_id: str
    check_id: str | None = None
    category: str
    severity: str
    priority: str
    title: str
    description: str
    affected_urls: tuple[str, ...]
    recommendation: SavedAuditRecommendation


class SavedAuditPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal[SAVED_AUDIT_PAYLOAD_VERSION] = SAVED_AUDIT_PAYLOAD_VERSION
    target_origin: str
    status: Literal["succeeded"]
    score: int | None = Field(default=None, ge=0, le=100)
    checks: tuple[SavedAuditCheck, ...]
    issues: tuple[SavedAuditIssue, ...]
    completed_at: datetime


class SavedAuditDetailResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.account.saved_audit_detail.v1"] = (
        "webdiag.account.saved_audit_detail.v1"
    )
    project: AccountProject
    audit: SavedAuditSummary
    payload: SavedAuditPayload
