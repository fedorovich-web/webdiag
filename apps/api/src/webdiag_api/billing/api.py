from __future__ import annotations

import json
import logging
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, status

from webdiag_api.accounts.api import SESSION_COOKIE_NAME, AccountServiceDependency
from webdiag_api.accounts.service import AccountServiceError
from webdiag_api.ai.storage import SqliteAIStore
from webdiag_api.billing.models import (
    BillingStatusResponse,
    ConfirmPaymentRequest,
    ConfirmPaymentResponse,
    CreateInvoiceRequest,
    CreateInvoiceResponse,
    WebhookResponse,
)
from webdiag_api.billing.service import BillingService, BillingServiceError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/billing", tags=["billing"])

SessionCookie = Annotated[str | None, Cookie(alias=SESSION_COOKIE_NAME)]


def get_billing_service(
    account_service: AccountServiceDependency,
) -> BillingService:
    database_path = account_service.database_path
    ai_store = SqliteAIStore(database_path)
    return BillingService(account_service, ai_store)


BillingServiceDependency = Annotated[BillingService, Depends(get_billing_service)]


@router.get("/status", response_model=BillingStatusResponse)
def get_billing_status(
    service: BillingServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> BillingStatusResponse:
    if not webdiag_session:
        return service.get_status()
    try:
        return service.get_status(account_service.get_session(webdiag_session).user.id)
    except AccountServiceError as error:
        raise HTTPException(
            status_code=error.status_code, detail={"code": error.code, "message": error.message}
        ) from error


@router.post("/invoice", response_model=CreateInvoiceResponse)
def create_invoice(
    request: CreateInvoiceRequest,
    raw_request: Request,
    service: BillingServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> CreateInvoiceResponse:
    try:
        session = account_service.get_session(webdiag_session)
    except AccountServiceError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail={"code": error.code, "message": error.message},
        ) from error

    origin = raw_request.headers.get("origin") or raw_request.headers.get("referer")
    try:
        return service.create_invoice(
            user_id=session.user.id,
            email=session.user.email,
            request=request,
            origin=origin,
        )
    except BillingServiceError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail={"code": error.code, "message": error.message},
        ) from error


@router.post("/confirm", response_model=ConfirmPaymentResponse)
def confirm_invoice(
    request: ConfirmPaymentRequest,
    service: BillingServiceDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> ConfirmPaymentResponse:
    try:
        session = account_service.get_session(webdiag_session)
    except AccountServiceError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail={"code": error.code, "message": error.message},
        ) from error

    try:
        return service.confirm_invoice(
            user_id=session.user.id,
            pack_id=request.pack_id,
            invoice_id=request.invoice_id,
            payment_method=request.payment_method,
        )
    except BillingServiceError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail={"code": error.code, "message": error.message},
        ) from error


@router.post("/webhook", response_model=WebhookResponse)
async def lava_webhook(
    request: Request,
    service: BillingServiceDependency,
) -> WebhookResponse:
    raw_body = await request.body()
    headers_dict = {k.lower(): v for k, v in request.headers.items()}

    if not service.verify_webhook_authentication(raw_body=raw_body, headers=headers_dict):
        logger.warning("Lava webhook signature/token verification failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "unauthorized", "message": "Invalid webhook authentication signature"},
        )

    try:
        body_dict = json.loads(raw_body.decode("utf-8")) if raw_body else {}
    except Exception as error:
        logger.error("Failed to parse Lava webhook JSON body: %s", error)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "invalid_json", "message": "Invalid JSON body"},
        ) from error

    if not isinstance(body_dict, dict):
        raise HTTPException(
            status_code=400, detail={"code": "invalid_json", "message": "Expected an object."}
        )
    try:
        return service.handle_webhook_event(body_dict)
    except BillingServiceError as error:
        raise HTTPException(
            status_code=error.status_code, detail={"code": error.code, "message": error.message}
        ) from error
