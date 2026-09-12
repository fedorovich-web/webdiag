from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from webdiag_api.auth.models import AuthSession, OneTimeToken, User
from webdiag_api.auth.security import digest_token, hash_password, new_token, verify_password

VERIFY_EMAIL_TTL = timedelta(hours=24)
PASSWORD_RESET_TTL = timedelta(minutes=30)
SESSION_TTL = timedelta(days=30)
MIN_PASSWORD_LENGTH = 10
MAX_PASSWORD_LENGTH = 128


class AuthError(ValueError):
    def __init__(self, code: str) -> None:
        self.code = code
        super().__init__(code)


@dataclass(frozen=True, slots=True)
class IssuedToken:
    raw: str
    expires_at: datetime


@dataclass(frozen=True, slots=True)
class RegistrationResult:
    user: User
    token: IssuedToken


@dataclass(frozen=True, slots=True)
class SessionResult:
    user: User
    session_token: str


@dataclass(frozen=True, slots=True)
class PasswordResetRequest:
    user: User
    token: IssuedToken


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


class AuthService:
    def __init__(
        self,
        session: AsyncSession,
        *,
        now: Callable[[], datetime] | None = None,
        session_ttl: timedelta = SESSION_TTL,
        verification_ttl: timedelta = VERIFY_EMAIL_TTL,
        password_reset_ttl: timedelta = PASSWORD_RESET_TTL,
    ) -> None:
        if min(session_ttl, verification_ttl, password_reset_ttl) <= timedelta(0):
            raise ValueError("Authentication lifetimes must be positive")
        self.session = session
        self._now = now or (lambda: datetime.now(UTC))
        self._session_ttl = session_ttl
        self._verification_ttl = verification_ttl
        self._password_reset_ttl = password_reset_ttl

    async def register(self, *, email: str, password: str) -> RegistrationResult:
        normalized_email = self._normalize_email(email)
        self._validate_password(password)

        existing = await self._find_user_by_email(normalized_email)
        if existing is not None:
            raise AuthError("email_already_registered")

        user = User(
            email=normalized_email,
            password_hash=hash_password(password),
            status="active",
        )
        self.session.add(user)
        try:
            await self.session.flush()
        except IntegrityError as exc:
            await self.session.rollback()
            raise AuthError("email_already_registered") from exc

        token = await self._issue_one_time_token(
            user_id=user.id,
            purpose="verify_email",
            ttl=self._verification_ttl,
        )
        return RegistrationResult(user=user, token=token)

    async def verify_email(self, raw_token: str) -> SessionResult:
        token = await self._consume_one_time_token(raw_token, purpose="verify_email")
        user = await self._get_active_user(token.user_id)
        if user.email_verified_at is None:
            user.email_verified_at = self._now()
        session_token = await self._issue_session(user.id)
        return SessionResult(user=user, session_token=session_token)

    async def login(self, *, email: str, password: str) -> SessionResult:
        user = await self._find_user_by_email(self._normalize_email(email))
        if user is None or user.status != "active":
            raise AuthError("invalid_credentials")
        if not verify_password(password, user.password_hash):
            raise AuthError("invalid_credentials")
        if user.email_verified_at is None:
            raise AuthError("email_not_verified")

        session_token = await self._issue_session(user.id)
        return SessionResult(user=user, session_token=session_token)

    async def authenticate_session(self, raw_token: str) -> User:
        digest = digest_token(raw_token)
        result = await self.session.execute(
            select(AuthSession).where(
                AuthSession.token_digest == digest,
                AuthSession.revoked_at.is_(None),
            )
        )
        auth_session = result.scalar_one_or_none()
        if auth_session is None or _as_utc(auth_session.expires_at) <= self._now():
            raise AuthError("invalid_session")

        user = await self._get_active_user(auth_session.user_id)
        if user.email_verified_at is None:
            raise AuthError("invalid_session")
        return user

    async def logout(self, raw_token: str) -> None:
        digest = digest_token(raw_token)
        result = await self.session.execute(
            select(AuthSession).where(
                AuthSession.token_digest == digest,
                AuthSession.revoked_at.is_(None),
            )
        )
        auth_session = result.scalar_one_or_none()
        if auth_session is not None:
            auth_session.revoked_at = self._now()

    async def request_verification(self, *, email: str) -> RegistrationResult | None:
        user = await self._find_user_by_email(self._normalize_email(email))
        if user is None or user.status != "active" or user.email_verified_at is not None:
            return None
        token = await self._issue_one_time_token(
            user_id=user.id,
            purpose="verify_email",
            ttl=self._verification_ttl,
        )
        return RegistrationResult(user=user, token=token)

    async def request_password_reset(self, *, email: str) -> PasswordResetRequest | None:
        user = await self._find_user_by_email(self._normalize_email(email))
        if user is None or user.status != "active" or user.email_verified_at is None:
            return None
        token = await self._issue_one_time_token(
            user_id=user.id,
            purpose="reset_password",
            ttl=self._password_reset_ttl,
        )
        return PasswordResetRequest(user=user, token=token)

    async def reset_password(self, *, token: str, new_password: str) -> User:
        self._validate_password(new_password)
        persisted_token = await self._consume_one_time_token(token, purpose="reset_password")
        user = await self._get_active_user(persisted_token.user_id)
        user.password_hash = hash_password(new_password)
        await self._revoke_sessions(user.id)
        return user

    async def change_password(
        self,
        *,
        session_token: str,
        current_password: str,
        new_password: str,
    ) -> User:
        self._validate_password(new_password)
        user = await self.authenticate_session(session_token)
        if not verify_password(current_password, user.password_hash):
            raise AuthError("invalid_current_password")
        user.password_hash = hash_password(new_password)
        await self._revoke_sessions(user.id)
        return user

    async def _find_user_by_email(self, email: str) -> User | None:
        result = await self.session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def _get_active_user(self, user_id: UUID) -> User:
        result = await self.session.execute(
            select(User).where(User.id == user_id, User.status == "active")
        )
        user = result.scalar_one_or_none()
        if user is None:
            raise AuthError("invalid_session")
        return user

    async def _issue_one_time_token(
        self,
        *,
        user_id: UUID,
        purpose: str,
        ttl: timedelta,
    ) -> IssuedToken:
        now = self._now()
        await self.session.execute(
            update(OneTimeToken)
            .where(
                OneTimeToken.user_id == user_id,
                OneTimeToken.purpose == purpose,
                OneTimeToken.consumed_at.is_(None),
            )
            .values(consumed_at=now)
        )
        raw = new_token()
        expires_at = now + ttl
        self.session.add(
            OneTimeToken(
                user_id=user_id,
                purpose=purpose,
                token_digest=digest_token(raw),
                expires_at=expires_at,
            )
        )
        await self.session.flush()
        return IssuedToken(raw=raw, expires_at=expires_at)

    async def _consume_one_time_token(self, raw_token: str, *, purpose: str) -> OneTimeToken:
        digest = digest_token(raw_token)
        now = self._now()
        result = await self.session.execute(
            update(OneTimeToken)
            .where(
                OneTimeToken.token_digest == digest,
                OneTimeToken.purpose == purpose,
                OneTimeToken.consumed_at.is_(None),
                OneTimeToken.expires_at > now,
            )
            .values(consumed_at=now)
            .returning(OneTimeToken)
        )
        token = result.scalar_one_or_none()
        if token is None:
            raise AuthError("invalid_or_expired_token")
        return token

    async def _issue_session(self, user_id: UUID) -> str:
        raw = new_token()
        self.session.add(
            AuthSession(
                user_id=user_id,
                token_digest=digest_token(raw),
                expires_at=self._now() + self._session_ttl,
            )
        )
        await self.session.flush()
        return raw

    async def _revoke_sessions(self, user_id: UUID) -> None:
        await self.session.execute(
            update(AuthSession)
            .where(AuthSession.user_id == user_id, AuthSession.revoked_at.is_(None))
            .values(revoked_at=self._now())
        )

    @staticmethod
    def _normalize_email(email: str) -> str:
        normalized = email.strip().lower()
        if not normalized or len(normalized) > 320 or "@" not in normalized:
            raise AuthError("invalid_email")
        return normalized

    @staticmethod
    def _validate_password(password: str) -> None:
        if not MIN_PASSWORD_LENGTH <= len(password) <= MAX_PASSWORD_LENGTH:
            raise AuthError("invalid_password")
