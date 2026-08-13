from __future__ import annotations

from functools import lru_cache
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response

from webdiag_api.accounts.models import (
    AccountLogoutResponse,
    AccountSessionResponse,
    LoginRequest,
    RegisterRequest,
)
from webdiag_api.accounts.security import ScryptParameters
from webdiag_api.accounts.service import AccountService, AccountServiceError
from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.config import settings

router = APIRouter(prefix="/v1/account", tags=["account"])
SESSION_COOKIE_NAME = "webdiag_session"


@lru_cache(maxsize=1)
def get_account_service() -> AccountService:
    return AccountService(
        SqliteAccountStore(settings.account_database_path),
        session_ttl_seconds=settings.account_session_ttl_seconds,
        active_session_limit=settings.account_active_session_limit,
        scrypt_parameters=ScryptParameters(
            n=settings.account_scrypt_n,
            r=settings.account_scrypt_r,
            p=settings.account_scrypt_p,
            length=settings.account_scrypt_dklen,
        ),
        login_attempt_limit=settings.account_login_attempt_limit,
        login_attempt_window_seconds=settings.account_login_attempt_window_seconds,
        login_block_seconds=settings.account_login_block_seconds,
    )


AccountServiceDependency = Annotated[AccountService, Depends(get_account_service)]
SessionCookie = Annotated[str | None, Cookie(alias=SESSION_COOKIE_NAME)]


def _detail(error: AccountServiceError) -> dict[str, str]:
    return {"code": error.code, "message": error.message}


def _http_error(error: AccountServiceError) -> HTTPException:
    headers = {"Cache-Control": "no-store"}
    if error.retry_after is not None:
        headers["Retry-After"] = str(error.retry_after)
    return HTTPException(
        status_code=error.status_code,
        detail=_detail(error),
        headers=headers,
    )


def current_account_user_id(
    service: AccountService,
    session_token: str | None,
) -> str:
    try:
        return service.get_session(session_token).user.id
    except AccountServiceError as error:
        raise _http_error(error) from error


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        max_age=settings.account_session_ttl_seconds,
        httponly=True,
        secure=settings.account_cookie_secure,
        samesite="lax",
        path="/",
    )
    response.headers["cache-control"] = "no-store"


@router.post("/register", response_model=AccountSessionResponse, status_code=201)
def register(
    request: RegisterRequest,
    response: Response,
    service: AccountServiceDependency,
) -> AccountSessionResponse:
    try:
        session = service.register(request)
    except AccountServiceError as error:
        raise _http_error(error) from error
    _set_session_cookie(response, session.token)
    return session.response


@router.post("/login", response_model=AccountSessionResponse)
def login(
    request: LoginRequest,
    response: Response,
    service: AccountServiceDependency,
) -> AccountSessionResponse:
    try:
        session = service.login(request)
    except AccountServiceError as error:
        raise _http_error(error) from error
    _set_session_cookie(response, session.token)
    return session.response


@router.get("/me", response_model=AccountSessionResponse)
def me(
    response: Response,
    service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> AccountSessionResponse:
    response.headers["cache-control"] = "no-store"
    try:
        return service.get_session(webdiag_session)
    except AccountServiceError as error:
        raise _http_error(error) from error


@router.post("/logout", response_model=AccountLogoutResponse)
def logout(
    response: Response,
    service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> AccountLogoutResponse:
    service.logout(webdiag_session)
    response.delete_cookie(
        SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=settings.account_cookie_secure,
        samesite="lax",
    )
    response.headers["cache-control"] = "no-store"
    return AccountLogoutResponse()
