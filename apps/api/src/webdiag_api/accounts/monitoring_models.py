from __future__ import annotations

from datetime import datetime
from typing import Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, ConfigDict, Field, field_validator

MonitorCadence = Literal["hourly", "six_hours", "twelve_hours", "daily", "weekly"]
MonitorStatus = Literal["pending", "running", "passed", "changed", "failed"]
MonitorChangeKind = Literal["baseline", "unchanged", "changed", "failed"]

CADENCE_SECONDS: dict[str, int] = {
    "hourly": 3_600,
    "six_hours": 21_600,
    "twelve_hours": 43_200,
    "daily": 86_400,
    "weekly": 604_800,
}


class MonitorCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cadence: MonitorCadence = "daily"
    timezone: str = Field(default="UTC", min_length=1, max_length=64)

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized or any(char.isspace() for char in normalized):
            raise ValueError("timezone must be a canonical IANA name")
        try:
            ZoneInfo(normalized)
        except (ValueError, ZoneInfoNotFoundError) as error:
            raise ValueError("timezone must name an available IANA zone") from error
        return normalized


class MonitorUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cadence: MonitorCadence | None = None
    timezone: str | None = Field(default=None, min_length=1, max_length=64)
    enabled: bool | None = None

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return MonitorCreateRequest(cadence="daily", timezone=value).timezone


class MonitorChange(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.account.monitor_change.v1"] = (
        "webdiag.account.monitor_change.v1"
    )
    kind: MonitorChangeKind
    previous_score: int | None = Field(default=None, ge=0, le=100)
    current_score: int | None = Field(default=None, ge=0, le=100)
    score_delta: int | None = Field(default=None, ge=-100, le=100)
    previous_issue_count: int | None = Field(default=None, ge=0)
    current_issue_count: int | None = Field(default=None, ge=0)
    added_issue_ids: tuple[str, ...] = ()
    resolved_issue_ids: tuple[str, ...] = ()


class AccountMonitor(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.account.monitor.v1"] = "webdiag.account.monitor.v1"
    id: str
    project_id: str
    cadence: MonitorCadence
    timezone: str
    enabled: bool
    status: MonitorStatus
    next_run_at: datetime | None
    last_run_at: datetime | None
    consecutive_failures: int = Field(ge=0)
    created_at: datetime
    updated_at: datetime


class MonitorListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.account.monitor_list.v1"] = (
        "webdiag.account.monitor_list.v1"
    )
    monitors: tuple[AccountMonitor, ...]


class MonitorRun(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    monitor_id: str
    project_id: str
    status: MonitorStatus
    score: int | None = Field(default=None, ge=0, le=100)
    issue_count: int = Field(ge=0)
    started_at: datetime
    completed_at: datetime
    change: MonitorChange
    error_code: str | None = None


class MonitorRunResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.account.monitor_run.v1"] = (
        "webdiag.account.monitor_run.v1"
    )
    run: MonitorRun


class MonitorHistoryResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.account.monitor_history.v1"] = (
        "webdiag.account.monitor_history.v1"
    )
    monitor: AccountMonitor
    runs: tuple[MonitorRun, ...]
