from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, ConfigDict, Field

from webdiag_api.audit.admission import AuditAdmissionController, AuditAdmissionError
from webdiag_api.audit.models import AuditJob, AuditJobStatus, AuditRun, AuditRunSummary
from webdiag_api.audit.service import (
    AuditExecutionError,
    AuditExecutionService,
    AuditRequestError,
    AuditSnapshot,
)
from webdiag_api.audit.storage import AuditStoreIntegrityError, SqliteAuditStore
from webdiag_api.audit.summary import summarize_audit_run
from webdiag_api.config import settings

router = APIRouter(prefix="/v1/audits", tags=["audits"])
logger = logging.getLogger(__name__)
_default_audit_service = AuditExecutionService(
    store=SqliteAuditStore(
        settings.audit_database_path,
        history_limit=settings.audit_history_limit,
    )
)
_default_audit_admission = AuditAdmissionController(
    settings.audit_database_path,
    request_limit=settings.audit_public_request_limit,
    window_seconds=settings.audit_public_window_seconds,
    concurrency_limit=settings.audit_public_concurrency_limit,
    lease_seconds=settings.audit_public_lease_seconds,
)


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


def get_audit_admission() -> AuditAdmissionController:
    return _default_audit_admission


AuditServiceDependency = Annotated[AuditExecutionService, Depends(get_audit_service)]
AuditAdmissionDependency = Annotated[AuditAdmissionController, Depends(get_audit_admission)]


@router.post("", response_model=AuditSnapshotResponse, status_code=status.HTTP_201_CREATED)
def start_single_url_audit(
    payload: StartAuditRequest,
    response: Response,
    service: AuditServiceDependency,
    admission: AuditAdmissionDependency,
) -> AuditSnapshotResponse:
    response.headers["cache-control"] = "no-store"
    try:
        lease_id = admission.acquire()
    except AuditAdmissionError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail={"code": exc.code, "message": exc.message},
            headers={"Cache-Control": "no-store", "Retry-After": str(exc.retry_after)},
        ) from exc
    try:
        return _to_response(service.start_single_url_audit(payload.url))
    except AuditRequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "audit_url_rejected", "message": str(exc)},
            headers={"Cache-Control": "no-store"},
        ) from exc
    except AuditExecutionError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail={
                "code": exc.code,
                "message": str(exc),
                "job_id": str(exc.job_id),
                "run_id": str(exc.run_id) if exc.run_id else None,
            },
            headers={"Cache-Control": "no-store"},
        ) from exc
    finally:
        try:
            admission.release(lease_id)
        except Exception:
            logger.error("Public audit admission lease release failed.")


@router.get("/{job_id}", response_model=AuditSnapshotResponse)
def get_audit_snapshot(
    job_id: UUID,
    response: Response,
    service: AuditServiceDependency,
) -> AuditSnapshotResponse:
    response.headers["cache-control"] = "no-store"
    try:
        snapshot = service.get_snapshot(job_id)
    except AuditStoreIntegrityError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "audit_unavailable",
                "message": "The stored audit is temporarily unavailable.",
            },
            headers={"Cache-Control": "no-store"},
        ) from error
    if snapshot is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "audit_not_found", "message": "Audit job was not found."},
            headers={"Cache-Control": "no-store"},
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
