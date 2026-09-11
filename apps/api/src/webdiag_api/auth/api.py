from __future__ import annotations

import logging
from typing import Annotated, NoReturn
from urllib.parse import urlencode

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from webdiag_api.auth.cookies import SESSION_COOKIE_NAME, clear_session_cookie, set_session_cookie
from webdiag_api.auth.schemas import (
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

_REGISTERED_MESSAGE = "Если адрес доступен для регистрации, письмо подтверждения отправлено."
_RESEND_MESSAGE = "Если аккаунту требуется подтверждение, новое письмо будет отправлено."
_RESET_REQUEST_MESSAGE = "Если аккаунт существует, инструкции по восстановлению будут отправлены."


def _action_url(path: str, token: str) -> str:
    query = urlencode({"token": token})
    return f"{settings.public_app_url.rstrip('/')}{path}?{query}"


def _email_transport() -> ResendTransport:
    api_key = settings.resend_api_key.get_secret_value().strip()
    if not api_key:
        raise RuntimeError("Transactional email transport is not configured")
    return ResendTransport(api_key=api_key)


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


def _raise_auth_error(exc: AuthError) -> NoReturn:
    if exc.code in {"invalid_credentials", "invalid_session"}:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
        ) from exc
    if exc.code == "email_not_verified":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification is required",
        ) from exc
    if exc.code == "invalid_or_expired_token":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token",
        ) from exc
    if exc.code == "invalid_current_password":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        ) from exc
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid authentication request",
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
    service = AuthService(session)
    try:
        result = await service.register(email=str(payload.email), password=payload.password)
    except AuthError as exc:
        if exc.code == "email_already_registered":
            return MessageResponse(message=_REGISTERED_MESSAGE)
        _raise_auth_error(exc)

    try:
        await _deliver_required(
            build_verification_email(
                recipient=result.user.email,
                verification_url=_action_url("/auth/verify-email", result.token.raw),
            ),
            idempotency_key=f"verify-{digest_token(result.token.raw)}",
        )
    except HTTPException:
        await session.rollback()
        raise

    await session.commit()
    return MessageResponse(message=_REGISTERED_MESSAGE)


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(
    payload: TokenActionRequest,
    response: Response,
    session: SessionDep,
) -> MessageResponse:
    service = AuthService(session)
    try:
        result = await service.verify_email(payload.token)
    except AuthError as exc:
        _raise_auth_error(exc)

    set_session_cookie(response, result.session_token, settings)
    await session.commit()
    return MessageResponse(message="Email подтверждён.")


@router.post(
    "/resend-verification",
    response_model=MessageResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def resend_verification(
    payload: EmailActionRequest,
    session: SessionDep,
) -> MessageResponse:
    service = AuthService(session)
    result = await service.request_verification(email=str(payload.email))
    if result is None:
        return MessageResponse(message=_RESEND_MESSAGE)

    try:
        await _deliver_required(
            build_verification_email(
                recipient=result.user.email,
                verification_url=_action_url("/auth/verify-email", result.token.raw),
            ),
            idempotency_key=f"verify-{digest_token(result.token.raw)}",
        )
    except HTTPException:
        await session.rollback()
        raise

    await session.commit()
    return MessageResponse(message=_RESEND_MESSAGE)


@router.post("/login", response_model=UserResponse)
async def login(
    payload: LoginRequest,
    response: Response,
    session: SessionDep,
) -> UserResponse:
    service = AuthService(session)
    try:
        result = await service.login(email=str(payload.email), password=payload.password)
    except AuthError as exc:
        _raise_auth_error(exc)

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
        await AuthService(session).logout(session_token)
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
        user = await AuthService(session).authenticate_session(token)
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
    service = AuthService(session)
    result = await service.request_password_reset(email=str(payload.email))
    if result is None:
        return MessageResponse(message=_RESET_REQUEST_MESSAGE)

    try:
        await _deliver_required(
            build_password_reset_email(
                recipient=result.user.email,
                reset_url=_action_url("/auth/reset-password", result.token.raw),
                expires_at=result.token.expires_at,
            ),
            idempotency_key=f"reset-{digest_token(result.token.raw)}",
        )
    except HTTPException:
        await session.rollback()
        raise

    await session.commit()
    return MessageResponse(message=_RESET_REQUEST_MESSAGE)


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    payload: PasswordResetRequest,
    response: Response,
    session: SessionDep,
) -> MessageResponse:
    service = AuthService(session)
    try:
        user = await service.reset_password(
            token=payload.token,
            new_password=payload.new_password,
        )
    except AuthError as exc:
        _raise_auth_error(exc)

    await session.commit()
    clear_session_cookie(response, settings)
    await _deliver_best_effort(
        build_password_changed_email(recipient=user.email),
        idempotency_key=f"password-changed-{digest_token(payload.token)}",
    )
    return MessageResponse(message="Пароль изменён. Войдите с новым паролем.")


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    payload: PasswordChangeRequest,
    response: Response,
    session: SessionDep,
    session_token: SessionCookie = None,
) -> MessageResponse:
    token = _require_session_token(session_token)
    service = AuthService(session)
    try:
        user = await service.change_password(
            session_token=token,
            current_password=payload.current_password,
            new_password=payload.new_password,
        )
    except AuthError as exc:
        _raise_auth_error(exc)

    await session.commit()
    clear_session_cookie(response, settings)
    await _deliver_best_effort(
        build_password_changed_email(recipient=user.email),
        idempotency_key=f"password-changed-{digest_token(token)}",
    )
    return MessageResponse(message="Пароль изменён. Войдите снова.")
