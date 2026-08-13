from __future__ import annotations

import hmac
from functools import lru_cache
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, Response
from fastapi.responses import JSONResponse

from webdiag_api.accounts.api import AccountServiceDependency, SessionCookie
from webdiag_api.accounts.service import AccountServiceError
from webdiag_api.accounts.workspace_storage import SqliteWorkspaceStore
from webdiag_api.ai.artifact_storage import (
    ArtifactConfigurationError,
    artifact_storage_from_env,
)
from webdiag_api.ai.artifacts import ArtifactStorage
from webdiag_api.ai.catalog import DEFAULT_AI_CATALOG
from webdiag_api.ai.input_resolver import AIInputResolver
from webdiag_api.ai.models import (
    AIArtifactCleanupResponse,
    AICatalogResponse,
    AIImageUploadResponse,
    AIRunCreateRequest,
    AIRunDetailResponse,
    AIRunListResponse,
    AIWorkerClaimResponse,
    AIWorkerCompleteRequest,
    AIWorkerFailRequest,
    AIWorkerLeaseRequest,
    AIWorkerLeaseResponse,
    AIWorkerRunResponse,
    CreditBalanceResponse,
    CreditLedgerResponse,
)
from webdiag_api.ai.service import AIService, AIServiceError
from webdiag_api.ai.storage import AILeaseLostError, SqliteAIStore
from webdiag_api.config import settings

router = APIRouter(prefix="/v1/account", tags=["account-ai"])
internal_router = APIRouter(prefix="/v1/internal/ai", tags=["internal-ai"])


@lru_cache(maxsize=1)
def get_ai_service() -> AIService:
    return AIService(
        SqliteAIStore(
            settings.account_database_path,
            lease_seconds=settings.ai_lease_seconds,
        ),
        catalog=DEFAULT_AI_CATALOG,
        input_max_bytes=settings.ai_input_max_bytes,
        output_max_bytes=settings.ai_output_max_bytes,
        input_resolver=AIInputResolver(SqliteWorkspaceStore(settings.account_database_path)),
        safety_identifier_secret=settings.ai_safety_identifier_secret,
        artifact_prefix=settings.ai_artifact_prefix,
    )


AIServiceDependency = Annotated[AIService, Depends(get_ai_service)]


@lru_cache(maxsize=1)
def get_ai_artifact_storage() -> ArtifactStorage:
    try:
        return artifact_storage_from_env()
    except ArtifactConfigurationError as error:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "ai_upload_storage_unavailable",
                "message": "Image upload storage is unavailable.",
            },
            headers={"Cache-Control": "no-store"},
        ) from error


AIArtifactStorageDependency = Annotated[ArtifactStorage, Depends(get_ai_artifact_storage)]


def get_optional_ai_artifact_storage() -> ArtifactStorage | None:
    try:
        return artifact_storage_from_env()
    except ArtifactConfigurationError:
        return None


OptionalAIArtifactStorageDependency = Annotated[
    ArtifactStorage | None,
    Depends(get_optional_ai_artifact_storage),
]


def _user_id(account_service: AccountServiceDependency, token: SessionCookie) -> str:
    try:
        return account_service.get_session(token).user.id
    except AccountServiceError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail={"code": error.code, "message": error.message},
            headers={"Cache-Control": "no-store"},
        ) from error


def get_ai_user_id(
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> str:
    return _user_id(account_service, webdiag_session)


AIUserIdDependency = Annotated[str, Depends(get_ai_user_id)]


def get_authenticated_ai_artifact_context(
    user_id: AIUserIdDependency,
    artifact_storage: AIArtifactStorageDependency,
) -> tuple[str, ArtifactStorage]:
    return user_id, artifact_storage


AIArtifactContextDependency = Annotated[
    tuple[str, ArtifactStorage],
    Depends(get_authenticated_ai_artifact_context),
]


def _error(error: AIServiceError) -> HTTPException:
    return HTTPException(
        status_code=error.status_code,
        detail={"code": error.code, "message": error.message},
        headers={"Cache-Control": "no-store"},
    )


def _no_store(response: Response) -> None:
    response.headers["cache-control"] = "no-store"


def _authorize_internal(authorization: str | None) -> None:
    expected = settings.ai_internal_token
    supplied = authorization.removeprefix("Bearer ") if authorization else ""
    if not expected or not hmac.compare_digest(supplied, expected):
        raise HTTPException(
            status_code=401,
            detail={"code": "ai_internal_unauthorized", "message": "Unauthorized."},
            headers={"Cache-Control": "no-store"},
        )


@router.get("/ai/catalog", response_model=AICatalogResponse)
def catalog(
    response: Response,
    ai: AIServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> AICatalogResponse:
    _no_store(response)
    _user_id(account_service, webdiag_session)
    return ai.catalog()


@router.post("/ai/uploads/image", response_model=AIImageUploadResponse, status_code=201)
async def upload_image(
    request: Request,
    ai: AIServiceDependency,
    artifact_context: AIArtifactContextDependency,
):
    user_id, artifact_storage = artifact_context
    try:
        upload = ai.create_image_upload(
            user_id=user_id,
            data=await request.body(),
            content_type_hint=request.headers.get("content-type"),
            artifact_storage=artifact_storage,
        )
    except AIServiceError as error:
        raise _error(error) from error
    body = AIImageUploadResponse(upload=upload).model_dump(mode="json")
    return JSONResponse(
        status_code=201,
        content=body,
        headers={"Cache-Control": "no-store"},
    )


@router.post("/ai/runs", response_model=AIRunDetailResponse)
def create_run(
    request: AIRunCreateRequest,
    ai: AIServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
):
    try:
        run, created = ai.create_run(
            user_id=_user_id(account_service, webdiag_session),
            request=request,
            idempotency_key=idempotency_key or "",
        )
    except AIServiceError as error:
        raise _error(error) from error
    body = AIRunDetailResponse(run=run).model_dump(mode="json")
    return JSONResponse(
        status_code=201 if created else 200,
        content=body,
        headers={"Cache-Control": "no-store"},
    )


@router.get("/ai/runs", response_model=AIRunListResponse)
def list_runs(
    response: Response,
    ai: AIServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
    cursor: Annotated[str | None, Query(max_length=256)] = None,
) -> AIRunListResponse:
    _no_store(response)
    try:
        runs, next_cursor = ai.list_runs(
            user_id=_user_id(account_service, webdiag_session),
            limit=limit,
            cursor=cursor,
        )
    except AIServiceError as error:
        raise _error(error) from error
    return AIRunListResponse(runs=runs, next_cursor=next_cursor)


@router.get("/ai/runs/{run_id}", response_model=AIRunDetailResponse)
def get_run(
    run_id: UUID,
    response: Response,
    ai: AIServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> AIRunDetailResponse:
    _no_store(response)
    try:
        return AIRunDetailResponse(
            run=ai.get_run(
                user_id=_user_id(account_service, webdiag_session),
                run_id=str(run_id),
            )
        )
    except AIServiceError as error:
        raise _error(error) from error


@router.get("/ai/runs/{run_id}/artifacts/{artifact_id}")
def download_artifact(
    run_id: UUID,
    artifact_id: UUID,
    ai: AIServiceDependency,
    artifact_context: AIArtifactContextDependency,
) -> Response:
    user_id, artifact_storage = artifact_context
    try:
        data, media_type = ai.read_artifact(
            user_id=user_id,
            run_id=str(run_id),
            artifact_id=str(artifact_id),
            artifact_storage=artifact_storage,
        )
    except AIServiceError as error:
        raise _error(error) from error
    return Response(
        content=data,
        media_type=media_type,
        headers={
            "Cache-Control": "no-store",
            "Content-Disposition": (
                f'attachment; filename="webdiag-{artifact_id}.{_image_extension(media_type)}"'
            ),
            "X-Content-Type-Options": "nosniff",
        },
    )


def _image_extension(media_type: str) -> str:
    return {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}[media_type]


@router.delete("/ai/runs/{run_id}", status_code=204)
def delete_run(
    run_id: UUID,
    ai: AIServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> Response:
    try:
        ai.delete_run(
            user_id=_user_id(account_service, webdiag_session),
            run_id=str(run_id),
        )
    except AIServiceError as error:
        raise _error(error) from error
    return Response(status_code=204, headers={"Cache-Control": "no-store"})


@router.get("/credits", response_model=CreditBalanceResponse)
def credits(
    response: Response,
    ai: AIServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> CreditBalanceResponse:
    _no_store(response)
    account = ai.get_credits(user_id=_user_id(account_service, webdiag_session))
    return CreditBalanceResponse(account=ai.public_credit(account))


@router.get("/credits/ledger", response_model=CreditLedgerResponse)
def ledger(
    response: Response,
    ai: AIServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    cursor: Annotated[str | None, Query(max_length=256)] = None,
) -> CreditLedgerResponse:
    _no_store(response)
    try:
        entries, next_cursor = ai.list_ledger(
            user_id=_user_id(account_service, webdiag_session),
            limit=limit,
            cursor=cursor,
        )
    except AIServiceError as error:
        raise _error(error) from error
    return CreditLedgerResponse(
        entries=tuple(ai.public_ledger(entry) for entry in entries),
        next_cursor=next_cursor,
    )


@internal_router.post("/runs/claim", response_model=AIWorkerClaimResponse)
def claim_run(
    response: Response,
    ai: AIServiceDependency,
    authorization: Annotated[str | None, Header()] = None,
) -> AIWorkerClaimResponse:
    _no_store(response)
    _authorize_internal(authorization)
    return AIWorkerClaimResponse(claim=ai.claim_pending())


@internal_router.post("/runs/{run_id}/renew", response_model=AIWorkerLeaseResponse)
def renew_run(
    run_id: UUID,
    request: AIWorkerLeaseRequest,
    response: Response,
    ai: AIServiceDependency,
    authorization: Annotated[str | None, Header()] = None,
) -> AIWorkerLeaseResponse:
    _no_store(response)
    _authorize_internal(authorization)
    try:
        expires_at = ai.renew_lease(run_id=str(run_id), lease_token=request.lease_token)
    except AILeaseLostError as error:
        raise _internal_lease_error() from error
    return AIWorkerLeaseResponse(lease_expires_at=expires_at)


@internal_router.post("/runs/{run_id}/mark-submitted", response_model=AIWorkerRunResponse)
def mark_run_submitted(
    run_id: UUID,
    request: AIWorkerLeaseRequest,
    response: Response,
    ai: AIServiceDependency,
    authorization: Annotated[str | None, Header()] = None,
) -> AIWorkerRunResponse:
    _no_store(response)
    _authorize_internal(authorization)
    try:
        ai.mark_submitted(run_id=str(run_id), lease_token=request.lease_token)
    except AILeaseLostError as error:
        raise _internal_lease_error() from error
    return AIWorkerRunResponse(state="running")


@internal_router.post("/runs/{run_id}/complete", response_model=AIWorkerRunResponse)
def complete_run_internal(
    run_id: UUID,
    request: AIWorkerCompleteRequest,
    response: Response,
    ai: AIServiceDependency,
    artifact_storage: OptionalAIArtifactStorageDependency,
    authorization: Annotated[str | None, Header()] = None,
) -> AIWorkerRunResponse:
    _no_store(response)
    _authorize_internal(authorization)
    if request.artifact is not None and artifact_storage is None:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "ai_artifact_storage_unavailable",
                "message": "AI artifact storage is unavailable.",
            },
            headers={"Cache-Control": "no-store"},
        )
    try:
        run = ai.complete_run(
            run_id=str(run_id),
            lease_token=request.lease_token,
            output=request.output,
            provider_request_id=request.provider_request_id,
            input_units=request.input_units,
            output_units=request.output_units,
            artifact=request.artifact,
            artifact_storage=artifact_storage,
        )
    except AIServiceError as error:
        raise _error(error) from error
    except AILeaseLostError as error:
        raise _internal_lease_error() from error
    return AIWorkerRunResponse(state=run.state)


@internal_router.post("/runs/{run_id}/fail", response_model=AIWorkerRunResponse)
def fail_run_internal(
    run_id: UUID,
    request: AIWorkerFailRequest,
    response: Response,
    ai: AIServiceDependency,
    authorization: Annotated[str | None, Header()] = None,
) -> AIWorkerRunResponse:
    _no_store(response)
    _authorize_internal(authorization)
    try:
        run = ai.fail_run(
            run_id=str(run_id),
            lease_token=request.lease_token,
            error_code=request.error_code,
            provider_unknown=request.outcome == "provider_unknown",
        )
    except AILeaseLostError as error:
        raise _internal_lease_error() from error
    return AIWorkerRunResponse(state=run.state)


@internal_router.post("/artifacts/cleanup", response_model=AIArtifactCleanupResponse)
def cleanup_artifacts_internal(
    response: Response,
    ai: AIServiceDependency,
    artifact_storage: OptionalAIArtifactStorageDependency,
    authorization: Annotated[str | None, Header()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
) -> AIArtifactCleanupResponse:
    _no_store(response)
    _authorize_internal(authorization)
    if artifact_storage is None:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "ai_artifact_storage_unavailable",
                "message": "AI artifact storage is unavailable.",
            },
            headers={"Cache-Control": "no-store"},
        )
    deleted, failed = ai.cleanup_artifacts(
        artifact_storage=artifact_storage,
        limit=limit,
    )
    return AIArtifactCleanupResponse(deleted=deleted, failed=failed)


def _internal_lease_error() -> HTTPException:
    return HTTPException(
        status_code=409,
        detail={"code": "ai_run_lease_lost", "message": "AI run lease is no longer valid."},
        headers={"Cache-Control": "no-store"},
    )
