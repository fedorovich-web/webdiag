from __future__ import annotations

import logging
from datetime import timedelta
from typing import Annotated, NoReturn
from urllib.parse import urlencode

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from webdiag_api.auth.cookies import SESSION_COOKIE_NAME, clear_session_cookie, set_session_cookie
from webdiag_api.auth.rate_limit import (
    AuthRateLimiter,
    RateLimitExceeded,
    RateLimitUnavailable,
)
from webdiag_api.auth.schemas import (
    AuthLocale,
    EmailActionRequest,
    LoginRequest,
    MessageResponse,
    PasswordChangeRequest,
    PasswordResetRequest,
    RegisterRequest,
    TokenActionRequest,
    UserResponse,
)
from webdiag_api.auth.security import digest_token
from webdiag_api.auth.service import AuthError, AuthService
from webdiag_api.config import settings
from webdiag_api.db import get_db_session
from webdiag_api.email.resend import ResendTransport
from webdiag_api.email.transactional import (
    TransactionalEmail,
    build_password_changed_email,
    build_password_reset_email,
    build_verification_email,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])
logger = logging.getLogger(__name__)

SessionDep = Annotated[AsyncSession, Depends(get_db_session)]
SessionCookie = Annotated[str | None, Cookie(alias=SESSION_COOKIE_NAME)]

rate_limit_redis = Redis.from_url(
    settings.redis_url.get_secret_value(),
    decode_responses=False,
)
auth_rate_limiter = AuthRateLimiter(rate_limit_redis)

_MESSAGES: dict[str, dict[AuthLocale, str]] = {
    "registered": {
        "ru": "Если адрес доступен для регистрации, письмо подтверждения отправлено.",
        "en": "If the address can be registered, a verification email has been sent.",
    },
    "resend": {
        "ru": "Если аккаунту требуется подтверждение, новое письмо будет отправлено.",
        "en": "If the account needs verification, a new email will be sent.",
    },
    "reset_requested": {
        "ru": "Если аккаунт существует, инструкции по восстановлению будут отправлены.",
        "en": "If the account exists, password recovery instructions will be sent.",
    },
}


def _message(kind: str, locale: AuthLocale) -> str:
    return _MESSAGES[kind][locale]


def _action_url(path: str, token: str, locale: AuthLocale) -> str:
    query = urlencode({"token": token})
    locale_prefix = "" if locale == "ru" else "/en"
    return f"{settings.public_app_url.rstrip('/')}{locale_prefix}{path}?{query}"


def _auth_service(session: AsyncSession) -> AuthService:
    return AuthService(
        session,
        session_ttl=timedelta(days=settings.auth_session_ttl_days),
        verification_ttl=timedelta(minutes=settings.verification_ttl_minutes),
        password_reset_ttl=timedelta(minutes=settings.password_reset_ttl_minutes),
    )


def _email_transport() -> ResendTransport:
    api_key = settings.resend_api_key.get_secret_value().strip()
    if not api_key:
        raise RuntimeError("Transactional email transport is not configured")
    return ResendTransport(api_key=api_key)


async def _enforce_rate_limit(
    *,
    scope: str,
    identifier: str,
    limit: int,
    window_seconds: int,
) -> None:
    if not settings.rate_limit_enabled:
        return

    try:
        await auth_rate_limiter.enforce(
            scope=scope,
            identifier=identifier,
            limit=limit,
            window_seconds=window_seconds,
        )
    except RateLimitExceeded as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many authentication requests",
            headers={"Retry-After": str(window_seconds)},
        ) from exc
    except RateLimitUnavailable as exc:
        logger.error("auth_rate_limit_backend_unavailable")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication protection is temporarily unavailable",
        ) from exc


async def _deliver_required(
    message: TransactionalEmail,
    *,
    idempotency_key: str,
) -> None:
    try:
        await _email_transport().send(message, idempotency_key=idempotency_key)
    except RuntimeError as exc:
        logger.error(
            "transactional_email_delivery_failed",
            extra={"error_type": type(exc).__name__},
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Transactional email is temporarily unavailable",
        ) from exc


async def _deliver_best_effort(
    message: TransactionalEmail,
    *,
    idempotency_key: str,
) -> None:
    try:
        await _email_transport().send(message, idempotency_key=idempotency_key)
    except RuntimeError as exc:
        logger.warning(
            "transactional_email_notification_failed",
            extra={"error_type": type(exc).__name__},
        )


def _raise_auth_error(exc: AuthError, locale: AuthLocale = "en") -> NoReturn:
    if exc.code in {"invalid_credentials", "invalid_session"}:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ошибка аутентификации" if locale == "ru" else "Authentication failed",
        ) from exc
    if exc.code == "email_not_verified":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Требуется подтверждение email"
                if locale == "ru"
                else "Email verification is required"
            ),
        ) from exc
    if exc.code == "invalid_or_expired_token":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Токен недействителен или истёк"
                if locale == "ru"
                else "Invalid or expired token"
            ),
        ) from exc
    if exc.code == "invalid_current_password":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Текущий пароль указан неверно"
                if locale == "ru"
                else "Current password is incorrect"
            ),
        ) from exc
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=(
            "Некорректный запрос аутентификации"
            if locale == "ru"
            else "Invalid authentication request"
        ),
    ) from exc


def _require_session_token(token: str | None) -> str:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return token


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_202_ACCEPTED)
async def register(payload: RegisterRequest, session: SessionDep) -> MessageResponse:
    normalized_email = str(payload.email).strip().lower()
    await _enforce_rate_limit(
        scope="register",
        identifier=normalized_email,
        limit=5,
        window_seconds=3600,
    )

    service = _auth_service(session)
    try:
        result = await service.register(email=normalized_email, password=payload.password)
    except AuthError as exc:
        if exc.code == "email_already_registered":
            return MessageResponse(message=_message("registered", payload.locale))
        _raise_auth_error(exc, payload.locale)

    try:
        await _deliver_required(
            build_verification_email(
                recipient=result.user.email,
                verification_url=_action_url(
                    "/auth/verify-email", result.token.raw, payload.locale
                ),
                locale=payload.locale,
            ),
            idempotency_key=f"verify-{digest_token(result.token.raw)}",
        )
    except HTTPException:
        await session.rollback()
        raise

    await session.commit()
    return MessageResponse(message=_message("registered", payload.locale))


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(
    payload: TokenActionRequest,
    response: Response,
    session: SessionDep,
) -> MessageResponse:
    await _enforce_rate_limit(
        scope="verify-email",
        identifier=payload.token,
        limit=10,
        window_seconds=900,
    )

    service = _auth_service(session)
    try:
        result = await service.verify_email(payload.token)
    except AuthError as exc:
        _raise_auth_error(exc, payload.locale)

    set_session_cookie(response, result.session_token, settings)
    await session.commit()
    return MessageResponse(
        message="Email подтверждён." if payload.locale == "ru" else "Email verified."
    )


@router.post(
    "/resend-verification",
    response_model=MessageResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def resend_verification(
    payload: EmailActionRequest,
    session: SessionDep,
) -> MessageResponse:
    normalized_email = str(payload.email).strip().lower()
    await _enforce_rate_limit(
        scope="resend-verification",
        identifier=normalized_email,
        limit=5,
        window_seconds=3600,
    )

    service = _auth_service(session)
    result = await service.request_verification(email=normalized_email)
    if result is None:
        return MessageResponse(message=_message("resend", payload.locale))

    try:
        await _deliver_required(
            build_verification_email(
                recipient=result.user.email,
                verification_url=_action_url(
                    "/auth/verify-email", result.token.raw, payload.locale
                ),
                locale=payload.locale,
            ),
            idempotency_key=f"verify-{digest_token(result.token.raw)}",
        )
    except HTTPException:
        await session.rollback()
        raise

    await session.commit()
    return MessageResponse(message=_message("resend", payload.locale))


@router.post("/login", response_model=UserResponse)
async def login(
    payload: LoginRequest,
    response: Response,
    session: SessionDep,
) -> UserResponse:
    normalized_email = str(payload.email).strip().lower()
    await _enforce_rate_limit(
        scope="login",
        identifier=normalized_email,
        limit=10,
        window_seconds=300,
    )

    service = _auth_service(session)
    try:
        result = await service.login(email=normalized_email, password=payload.password)
    except AuthError as exc:
        _raise_auth_error(exc, payload.locale)

    set_session_cookie(response, result.session_token, settings)
    await session.commit()
    return UserResponse.model_validate(result.user)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    response: Response,
    session: SessionDep,
    session_token: SessionCookie = None,
) -> MessageResponse:
    if session_token:
        await _auth_service(session).logout(session_token)
        await session.commit()
    clear_session_cookie(response, settings)
    return MessageResponse(message="Logged out")


@router.get("/me", response_model=UserResponse)
async def me(
    session: SessionDep,
    session_token: SessionCookie = None,
) -> UserResponse:
    token = _require_session_token(session_token)
    try:
        user = await _auth_service(session).authenticate_session(token)
    except AuthError as exc:
        _raise_auth_error(exc)
    return UserResponse.model_validate(user)


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def forgot_password(
    payload: EmailActionRequest,
    session: SessionDep,
) -> MessageResponse:
    normalized_email = str(payload.email).strip().lower()
    await _enforce_rate_limit(
        scope="forgot-password",
        identifier=normalized_email,
        limit=5,
        window_seconds=3600,
    )

    service = _auth_service(session)
    result = await service.request_password_reset(email=normalized_email)
    if result is None:
        return MessageResponse(message=_message("reset_requested", payload.locale))

    try:
        await _deliver_required(
            build_password_reset_email(
                recipient=result.user.email,
                reset_url=_action_url(
                    "/auth/reset-password", result.token.raw, payload.locale
                ),
                expires_at=result.token.expires_at,
                locale=payload.locale,
            ),
            idempotency_key=f"reset-{digest_token(result.token.raw)}",
        )
    except HTTPException:
        await session.rollback()
        raise

    await session.commit()
    return MessageResponse(message=_message("reset_requested", payload.locale))


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    payload: PasswordResetRequest,
    response: Response,
    session: SessionDep,
) -> MessageResponse:
    await _enforce_rate_limit(
        scope="reset-password",
        identifier=payload.token,
        limit=10,
        window_seconds=900,
    )

    service = _auth_service(session)
    try:
        user = await service.reset_password(
            token=payload.token,
            new_password=payload.new_password,
        )
    except AuthError as exc:
        _raise_auth_error(exc, payload.locale)

    await session.commit()
    clear_session_cookie(response, settings)
    await _deliver_best_effort(
        build_password_changed_email(recipient=user.email, locale=payload.locale),
        idempotency_key=f"password-changed-{digest_token(payload.token)}",
    )
    return MessageResponse(
        message=(
            "Пароль изменён. Войдите с новым паролем."
            if payload.locale == "ru"
            else "Password changed. Sign in with your new password."
        )
    )


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    payload: PasswordChangeRequest,
    response: Response,
    session: SessionDep,
    session_token: SessionCookie = None,
) -> MessageResponse:
    token = _require_session_token(session_token)
    await _enforce_rate_limit(
        scope="change-password",
        identifier=token,
        limit=5,
        window_seconds=3600,
    )

    service = _auth_service(session)
    try:
        user = await service.change_password(
            session_token=token,
            current_password=payload.current_password,
            new_password=payload.new_password,
        )
    except AuthError as exc:
        _raise_auth_error(exc, payload.locale)

    await session.commit()
    clear_session_cookie(response, settings)
    await _deliver_best_effort(
        build_password_changed_email(recipient=user.email, locale=payload.locale),
        idempotency_key=f"password-changed-{digest_token(token)}",
    )
    return MessageResponse(
        message=(
            "Пароль изменён. Войдите снова."
            if payload.locale == "ru"
            else "Password changed. Sign in again."
        )
    )
