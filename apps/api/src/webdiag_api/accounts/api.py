from __future__ import annotations

import logging
from functools import lru_cache
from typing import Annotated

import httpx
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response

from webdiag_api.accounts.models import (
    AccountLogoutResponse,
    AccountSessionResponse,
    AccountSessionsRevokedResponse,
    AccountSessionSummaryResponse,
    LoginRequest,
    OAuthConfigResponse,
    OAuthLoginRequest,
    OAuthYandexExchangeRequest,
    PasswordChangeRequest,
    RegisterRequest,
)
from webdiag_api.accounts.registration_admission import (
    RegistrationAdmissionController,
    RegistrationAdmissionError,
)
from webdiag_api.accounts.security import ScryptParameters
from webdiag_api.accounts.service import AccountService, AccountServiceError
from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.ai.storage import SqliteAIStore
from webdiag_api.config import settings

router = APIRouter(prefix="/v1/account", tags=["account"])
SESSION_COOKIE_NAME = "webdiag_session"
logger = logging.getLogger(__name__)


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


@lru_cache(maxsize=1)
def get_registration_admission() -> RegistrationAdmissionController:
    return RegistrationAdmissionController(
        settings.account_database_path,
        request_limit=settings.account_registration_request_limit,
        window_seconds=settings.account_registration_window_seconds,
        concurrency_limit=settings.account_registration_concurrency_limit,
        lease_seconds=settings.account_registration_lease_seconds,
    )


AccountServiceDependency = Annotated[AccountService, Depends(get_account_service)]
RegistrationAdmissionDependency = Annotated[
    RegistrationAdmissionController,
    Depends(get_registration_admission),
]
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


def _registration_http_error(error: RegistrationAdmissionError) -> HTTPException:
    return HTTPException(
        status_code=error.status_code,
        detail={"code": error.code, "message": error.message},
        headers={"Cache-Control": "no-store", "Retry-After": str(error.retry_after)},
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
    admission: RegistrationAdmissionDependency,
) -> AccountSessionResponse:
    try:
        lease_id = admission.acquire()
    except RegistrationAdmissionError as error:
        raise _registration_http_error(error) from error
    try:
        try:
            session = service.register(request)
        except AccountServiceError as error:
            raise _http_error(error) from error
    finally:
        try:
            admission.release(lease_id)
        except Exception:
            logger.error("Registration admission lease release failed.")
    _set_session_cookie(response, session.token)
    if settings.account_welcome_credits > 0:
        try:
            database_path = str(getattr(service._store, "_path", settings.account_database_path))
            ai_store = SqliteAIStore(database_path)
            ai_store.grant_credits(
                user_id=session.response.user.id,
                quantity=settings.account_welcome_credits,
                reason="Welcome registration bonus",
                correlation_id=f"welcome-{session.response.user.id}",
            )
        except Exception:
            logger.exception("Failed to grant welcome credits on registration.")
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


@router.post("/oauth", response_model=AccountSessionResponse)
def oauth_login(
    request: OAuthLoginRequest,
    response: Response,
    service: AccountServiceDependency,
) -> AccountSessionResponse:
    try:
        session, is_new = service.authenticate_oauth_user(
            email=request.email,
            display_name=request.display_name,
        )
    except AccountServiceError as error:
        raise _http_error(error) from error
    _set_session_cookie(response, session.token)
    if is_new and settings.account_welcome_credits > 0:
        try:
            database_path = str(getattr(service._store, "_path", settings.account_database_path))
            ai_store = SqliteAIStore(database_path)
            ai_store.grant_credits(
                user_id=session.response.user.id,
                quantity=settings.account_welcome_credits,
                reason="Welcome registration bonus",
                correlation_id=f"welcome-{session.response.user.id}",
            )
        except Exception:
            logger.exception("Failed to grant welcome credits on OAuth registration.")
    return session.response


@router.get("/oauth/config", response_model=OAuthConfigResponse)
def oauth_config() -> OAuthConfigResponse:
    return OAuthConfigResponse(
        yandex_client_id=settings.yandex_client_id,
        configured=bool(settings.yandex_client_id and settings.yandex_client_secret),
    )


@router.post("/oauth/yandex/exchange", response_model=AccountSessionResponse)
def oauth_yandex_exchange(
    request: OAuthYandexExchangeRequest,
    response: Response,
    service: AccountServiceDependency,
) -> AccountSessionResponse:
    if not settings.yandex_client_id or not settings.yandex_client_secret:
        raise HTTPException(
            status_code=503,
            detail="Yandex OAuth is not configured on the server",
        )

    # 1. Exchange authorization code with Yandex OAuth
    token_url = "https://oauth.yandex.ru/token"
    try:
        token_res = httpx.post(
            token_url,
            data={
                "grant_type": "authorization_code",
                "code": request.code,
                "client_id": settings.yandex_client_id,
                "client_secret": settings.yandex_client_secret,
                "redirect_uri": request.redirect_uri,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=15.0,
        )
        if not token_res.is_success:
            logger.error(
                "Yandex token exchange failed: %s %s",
                token_res.status_code,
                token_res.text,
            )
            raise HTTPException(
                status_code=400,
                detail="Failed to exchange authorization code with Yandex",
            )

        token_data = token_res.json()
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="No access token received from Yandex")

        # 2. Fetch user profile from Yandex
        profile_res = httpx.get(
            "https://login.yandex.ru/info?format=json",
            headers={"Authorization": f"OAuth {access_token}"},
            timeout=10.0,
        )
        if not profile_res.is_success:
            logger.error(
                "Yandex profile fetch failed: %s %s",
                profile_res.status_code,
                profile_res.text,
            )
            raise HTTPException(
                status_code=400,
                detail="Failed to retrieve user profile from Yandex",
            )

        profile = profile_res.json()
        raw_emails = profile.get("emails")
        email = profile.get("default_email") or (raw_emails and raw_emails[0]) or ""
        if not email:
            raise HTTPException(status_code=400, detail="User email not provided by Yandex")

        display_name = (
            profile.get("real_name")
            or profile.get("display_name")
            or profile.get("login")
            or "Пользователь Яндекс"
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Error during Yandex OAuth exchange")
        raise HTTPException(status_code=502, detail=f"OAuth exchange error: {exc}") from exc

    # 3. Authenticate or create user in WebDiag
    try:
        session, is_new = service.authenticate_oauth_user(
            email=email,
            display_name=display_name,
        )
    except AccountServiceError as error:
        raise _http_error(error) from error

    _set_session_cookie(response, session.token)
    if is_new and settings.account_welcome_credits > 0:
        try:
            database_path = str(getattr(service._store, "_path", settings.account_database_path))
            ai_store = SqliteAIStore(database_path)
            ai_store.grant_credits(
                user_id=session.response.user.id,
                quantity=settings.account_welcome_credits,
                reason="Welcome registration bonus",
                correlation_id=f"welcome-{session.response.user.id}",
            )
        except Exception:
            logger.exception("Failed to grant welcome credits on OAuth registration.")
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


@router.post("/password", response_model=AccountSessionResponse)
def change_password(
    request: PasswordChangeRequest,
    response: Response,
    service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> AccountSessionResponse:
    try:
        session = service.change_password(webdiag_session, request)
    except AccountServiceError as error:
        raise _http_error(error) from error
    _set_session_cookie(response, session.token)
    return session.response


@router.get("/sessions", response_model=AccountSessionSummaryResponse)
def sessions(
    response: Response,
    service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> AccountSessionSummaryResponse:
    response.headers["cache-control"] = "no-store"
    try:
        return service.session_summary(webdiag_session)
    except AccountServiceError as error:
        raise _http_error(error) from error


@router.post(
    "/sessions/revoke-others",
    response_model=AccountSessionsRevokedResponse,
)
def revoke_other_sessions(
    response: Response,
    service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> AccountSessionsRevokedResponse:
    response.headers["cache-control"] = "no-store"
    try:
        return service.revoke_other_sessions(webdiag_session)
    except AccountServiceError as error:
        raise _http_error(error) from error
