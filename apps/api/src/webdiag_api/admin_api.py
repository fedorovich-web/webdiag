from __future__ import annotations

import logging
import re
import sqlite3
from collections.abc import Iterator
from time import time
from typing import Annotated, Literal
from urllib.parse import unquote
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import UUID4, BaseModel

from webdiag_api.accounts.api import SessionCookie
from webdiag_api.accounts.security import hash_session_token
from webdiag_api.accounts.storage import (
    AccountAccessStatus,
    AccountModerationAction,
    AccountModerationError,
    AccountModerationResult,
    SqliteAccountStore,
)
from webdiag_api.admin_storage import AdminReader, initialize_admin_schema, read_snapshot
from webdiag_api.config import settings
from webdiag_api.security.request_limits import ASGIApp, Receive, Send

logger = logging.getLogger(__name__)
ADMIN_PREFIX = "/v1/admin"
CACHE_CONTROL = "private, no-store"
router = APIRouter(prefix=ADMIN_PREFIX, include_in_schema=False)

Days = Literal["7", "30", "90"]
Page = Annotated[int, Query(ge=1, le=10_000)]
Plan = Literal["pro", "team"]
Currency = Literal["RUB", "USD"]
PaymentState = Literal["pending", "paid"]


class AdminResponseMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: dict, receive: Receive, send: Send) -> None:
        path = scope.get("path", "")
        if scope["type"] != "http" or not (
            path == ADMIN_PREFIX or path.startswith(ADMIN_PREFIX + "/")
        ):
            await self.app(scope, receive, send)
            return

        started = False

        async def private_send(message: dict) -> None:
            nonlocal started
            if message["type"] == "http.response.start":
                started = True
                headers = [
                    (name, value)
                    for name, value in message.get("headers", [])
                    if name.lower() not in (b"cache-control", b"x-robots-tag")
                ]
                headers.extend(
                    (
                        (b"cache-control", CACHE_CONTROL.encode()),
                        (b"x-robots-tag", b"noindex, nofollow"),
                    )
                )
                message = {**message, "headers": headers}
            await send(message)

        try:
            await self.app(scope, receive, private_send)
        except Exception as error:
            if started:
                raise
            logger.error("Owner dashboard request failed (%s)", type(error).__name__)
            response = JSONResponse({"detail": {"code": "admin_unavailable"}}, status_code=500)
            await response(scope, receive, private_send)


class Access(BaseModel):
    allowed: Literal[True] = True


class Client(BaseModel):
    id: str
    email: str
    created_at: int
    status: AccountAccessStatus
    manageable: bool
    plan: Literal["starter", "pro", "team"]
    expires_at: int | None
    available_credits: int


class Payment(BaseModel):
    id: str
    pack_id: str
    state: PaymentState
    currency: Currency
    amount_minor: int
    plan_id: Plan | None
    duration_days: int
    credits: int
    created_at: int
    paid_at: int | None


class PageInfo(BaseModel):
    page: int
    has_next: bool


class Clients(PageInfo):
    items: list[Client]


class ModeratedClient(BaseModel):
    id: str
    status: AccountAccessStatus
    revoked_session_count: int


class Payments(PageInfo):
    items: list[Payment]


class AIUsage(BaseModel):
    pending: int = 0
    running: int = 0
    succeeded: int = 0
    failed: int = 0
    provider_unknown: int = 0
    deleted: int = 0


class MonitoringUsage(BaseModel):
    passed: int = 0
    changed: int = 0
    failed: int = 0


class Usage(BaseModel):
    as_of: int
    days: int
    ai: AIUsage
    saved_audits: int
    monitoring: MonitoringUsage


class CurrencyTotal(BaseModel):
    currency: Currency
    count: int
    amount_minor: int


class Overview(BaseModel):
    as_of: int
    days: int
    users_total: int
    registrations: dict[Days, int]
    paid_access: dict[Plan, int]
    expiring_soon: int
    payments: list[CurrencyTotal]
    payments_without_date: int
    available_credits: int
    usage: Usage


def configured_owner() -> str | None:
    value = settings.owner_account_id.strip()
    try:
        identifier = UUID(value)
        return value if value == str(identifier) and identifier.version == 4 else None
    except ValueError:
        return None


def prepare_admin() -> None:
    if configured_owner():
        try:
            initialize_admin_schema(settings.account_database_path)
        except (OSError, sqlite3.Error) as error:
            logger.error("Owner dashboard schema unavailable (%s)", type(error).__name__)


def unix_time() -> int:
    return int(time())


def owner_error(status: int, code: str, message: str) -> HTTPException:
    return HTTPException(status, detail={"code": code, "message": message})


def require_owner(webdiag_session: SessionCookie = None) -> Iterator[AdminReader]:
    if not webdiag_session or len(webdiag_session) > 256:
        raise owner_error(401, "account_unauthenticated", "Sign in to continue.")
    try:
        with read_snapshot(settings.account_database_path) as db:
            reader = AdminReader(db, unix_time())
            user_id = reader.session_user_id(hash_session_token(webdiag_session))
            if user_id is None:
                raise owner_error(401, "account_unauthenticated", "Sign in to continue.")
            if user_id != configured_owner():
                raise owner_error(403, "admin_forbidden", "Owner access is required.")
            yield reader
    except (OSError, sqlite3.Error) as error:
        logger.warning("Owner dashboard storage unavailable (%s)", type(error).__name__)
        raise owner_error(503, "admin_unavailable", "Dashboard data is unavailable.") from None


Owner = Annotated[AdminReader, Depends(require_owner, scope="function")]


@router.get("/access", response_model=Access)
def access(owner: Owner) -> Access:
    return Access()


@router.get("/overview", response_model=Overview)
def overview(owner: Owner, days: Days = "30") -> dict:
    return owner.overview(int(days))


@router.get("/clients", response_model=Clients)
def clients(
    owner: Owner,
    page: Page = 1,
    days: Days | None = None,
    segment: Literal["all", "pro", "team", "expiring"] = "all",
    x_admin_email_query: Annotated[str, Header(max_length=3048)] = "",
) -> dict:
    try:
        email = unquote(x_admin_email_query, errors="strict").strip()
    except UnicodeDecodeError:
        email = "\x00"
    if len(email) > 254 or re.search(r"[\x00-\x1f\x7f]", email):
        raise owner_error(422, "admin_invalid_query", "Invalid email search.")
    return owner.clients(
        page=page,
        email=email,
        segment=segment,
        days=int(days) if days else None,
        owner_id=configured_owner() or "",
    )


@router.post("/clients/{user_id}/{action}", response_model=ModeratedClient)
def moderate_client(
    user_id: UUID4,
    action: AccountModerationAction,
    webdiag_session: SessionCookie = None,
    x_webdiag_admin_action: Annotated[str | None, Header()] = None,
    sec_fetch_site: Annotated[str | None, Header()] = None,
) -> AccountModerationResult:
    if x_webdiag_admin_action != "1" or sec_fetch_site == "cross-site":
        raise owner_error(403, "admin_cross_origin", "Cross-origin request rejected.")
    if not webdiag_session or len(webdiag_session) > 256:
        raise owner_error(401, "account_unauthenticated", "Sign in to continue.")
    try:
        return SqliteAccountStore(settings.account_database_path).moderate_account(
            owner_id=configured_owner(),
            token_hash=hash_session_token(webdiag_session),
            user_id=str(user_id),
            action=action,
            clock=unix_time,
        )
    except AccountModerationError as error:
        code = str(error)
        status, message = {
            "account_unauthenticated": (401, "Sign in to continue."),
            "admin_forbidden": (403, "Owner access is required."),
            "admin_owner_protected": (409, "The owner account is protected."),
            "admin_client_not_found": (404, "Client account not found."),
        }[code]
        raise owner_error(status, code, message) from None
    except (OSError, sqlite3.Error) as error:
        logger.warning("Owner account management unavailable (%s)", type(error).__name__)
        raise owner_error(503, "admin_unavailable", "Account management is unavailable.") from None


@router.get("/payments", response_model=Payments)
def payments(
    owner: Owner,
    page: Page = 1,
    days: Days | None = None,
    date_basis: Literal["created", "paid", "unknown"] = "created",
    state: PaymentState | None = None,
    currency: Currency | None = None,
    kind: Literal["credits", "pro", "team"] | None = None,
) -> dict:
    return owner.payments(
        page=page,
        days=int(days) if days else None,
        date_basis=date_basis,
        state=state,
        currency=currency,
        kind=kind,
    )


@router.get("/usage", response_model=Usage)
def usage(owner: Owner, days: Days = "30") -> dict:
    return owner.usage(int(days))
