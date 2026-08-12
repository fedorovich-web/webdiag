from __future__ import annotations

from functools import lru_cache
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Response
from fastapi.responses import JSONResponse

from webdiag_api.accounts.api import AccountServiceDependency, SessionCookie
from webdiag_api.accounts.service import AccountServiceError
from webdiag_api.ai.catalog import DEFAULT_AI_CATALOG
from webdiag_api.ai.models import (
    AICatalogResponse,
    AIRunCreateRequest,
    AIRunDetailResponse,
    AIRunListResponse,
    CreditBalanceResponse,
    CreditLedgerResponse,
)
from webdiag_api.ai.service import AIService, AIServiceError
from webdiag_api.ai.storage import SqliteAIStore
from webdiag_api.config import settings

router = APIRouter(prefix="/v1/account", tags=["account-ai"])


@lru_cache(maxsize=1)
def get_ai_service() -> AIService:
    return AIService(
        SqliteAIStore(settings.account_database_path),
        catalog=DEFAULT_AI_CATALOG,
        input_max_bytes=settings.ai_input_max_bytes,
    )


AIServiceDependency = Annotated[AIService, Depends(get_ai_service)]


def _user_id(account_service: AccountServiceDependency, token: SessionCookie) -> str:
    try:
        return account_service.get_session(token).user.id
    except AccountServiceError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail={"code": error.code, "message": error.message},
            headers={"Cache-Control": "no-store"},
        ) from error


def _error(error: AIServiceError) -> HTTPException:
    return HTTPException(
        status_code=error.status_code,
        detail={"code": error.code, "message": error.message},
        headers={"Cache-Control": "no-store"},
    )


def _no_store(response: Response) -> None:
    response.headers["cache-control"] = "no-store"


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
) -> AIRunListResponse:
    _no_store(response)
    return AIRunListResponse(
        runs=ai.list_runs(user_id=_user_id(account_service, webdiag_session), limit=limit)
    )


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
) -> CreditLedgerResponse:
    _no_store(response)
    entries = ai.list_ledger(user_id=_user_id(account_service, webdiag_session), limit=limit)
    return CreditLedgerResponse(entries=tuple(ai.public_ledger(entry) for entry in entries))
