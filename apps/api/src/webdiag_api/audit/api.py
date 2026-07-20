from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from webdiag_api.audit.models import AuditJob, AuditJobStatus, AuditRun, AuditRunSummary
from webdiag_api.audit.service import (
    AuditExecutionError,
    AuditExecutionService,
    AuditRequestError,
    AuditSnapshot,
)
from webdiag_api.audit.summary import summarize_audit_run

router = APIRouter(prefix="/v1/audits", tags=["audits"])
_default_audit_service = AuditExecutionService()


class StartAuditRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2_048)


class AuditSnapshotSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    job_id: UUID
    status: AuditJobStatus
    run: AuditRunSummary | None = None


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
            run=summarize_audit_run(run) if run else None,
        ),
        job=snapshot.job,
        run=run,
    )
