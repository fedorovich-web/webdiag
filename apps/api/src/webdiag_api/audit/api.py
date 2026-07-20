from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from webdiag_api.audit.models import AuditJob, AuditJobStatus, AuditRun, Priority, Severity
from webdiag_api.audit.service import (
    AuditExecutionError,
    AuditExecutionService,
    AuditRequestError,
    AuditSnapshot,
)

router = APIRouter(prefix="/v1/audits", tags=["audits"])
_default_audit_service = AuditExecutionService()


class StartAuditRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2_048)


class AuditSnapshotSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    job_id: UUID
    status: AuditJobStatus
    score: int | None = Field(default=None, ge=0, le=100)
    check_count: int = Field(ge=0)
    issue_count: int = Field(ge=0)
    highest_severity: Severity | None = None
    top_priority: Priority | None = None


class AuditSnapshotResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.audit.snapshot.v1"] = "webdiag.audit.snapshot.v1"
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    summary: AuditSnapshotSummary
    job: AuditJob
    run: AuditRun | None


def get_audit_service() -> AuditExecutionService:
    return _default_audit_service


AuditServiceDependency = Annotated[AuditExecutionService, Depends(get_audit_service)]


@router.post("", response_model=AuditSnapshotResponse, status_code=status.HTTP_201_CREATED)
def start_single_url_audit(
    payload: StartAuditRequest,
    service: AuditServiceDependency,
) -> AuditSnapshotResponse:
    try:
        return _to_response(service.start_single_url_audit(payload.url))
    except AuditRequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "audit_url_rejected", "message": str(exc)},
        ) from exc
    except AuditExecutionError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "code": "audit_fetch_failed",
                "message": str(exc),
                "job_id": str(exc.job_id),
                "run_id": str(exc.run_id) if exc.run_id else None,
            },
        ) from exc


@router.get("/{job_id}", response_model=AuditSnapshotResponse)
def get_audit_snapshot(
    job_id: UUID,
    service: AuditServiceDependency,
) -> AuditSnapshotResponse:
    snapshot = service.get_snapshot(job_id)
    if snapshot is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "audit_not_found", "message": "Audit job was not found."},
        )
    return _to_response(snapshot)


def _to_response(snapshot: AuditSnapshot) -> AuditSnapshotResponse:
    run = snapshot.run
    return AuditSnapshotResponse(
        summary=AuditSnapshotSummary(
            job_id=snapshot.job.job_id,
            status=snapshot.job.status,
            score=run.score if run else None,
            check_count=len(run.checks) if run else 0,
            issue_count=len(run.issues) if run else 0,
            highest_severity=_highest_severity(run) if run else None,
            top_priority=_top_priority(run) if run else None,
        ),
        job=snapshot.job,
        run=run,
    )


def _highest_severity(run: AuditRun) -> Severity | None:
    if not run.issues:
        return None
    order = {
        Severity.INFO: 0,
        Severity.LOW: 1,
        Severity.MEDIUM: 2,
        Severity.HIGH: 3,
        Severity.CRITICAL: 4,
    }
    return max((issue.severity for issue in run.issues), key=lambda item: order[item])


def _top_priority(run: AuditRun) -> Priority | None:
    if not run.issues:
        return None
    order = {Priority.P0: 0, Priority.P1: 1, Priority.P2: 2, Priority.P3: 3}
    return min((issue.priority for issue in run.issues), key=lambda item: order[item])
