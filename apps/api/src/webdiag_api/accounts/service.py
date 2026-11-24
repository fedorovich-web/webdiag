from __future__ import annotations

import secrets
import time
from dataclasses import dataclass
from typing import Protocol

from webdiag_api.accounts.models import (
    AccountSessionResponse,
    AccountSessionsRevokedResponse,
    AccountSessionSummaryResponse,
    LoginRequest,
    PasswordChangeRequest,
    RegisterRequest,
)
from webdiag_api.accounts.security import (
    AccountValidationError,
    ScryptParameters,
    create_session_secret,
    hash_login_identity,
    hash_password,
    hash_session_token,
    normalize_display_name,
    normalize_email,
    password_needs_rehash,
    validate_password,
    verify_password,
)
from webdiag_api.accounts.storage import AccountAccessBlocked, StoredUser


class AccountStore(Protocol):
    @property
    def database_path(self) -> str: ...

    def create_user(self, *, email: str, display_name: str, password_hash: str) -> StoredUser: ...

    def get_user_by_email(self, email: str) -> StoredUser | None: ...

    def resolve_yandex_user(
        self,
        *,
        subject: str,
        email: str,
        display_name: str,
        password_hash: str,
    ) -> tuple[StoredUser, bool]: ...

    def create_oauth_link(self, *, token_hash: str, subject: str, user_id: str) -> None: ...

    def prepare_oauth_recovery(self, *, token_hash: str, code_hash: str) -> str: ...

    def consume_oauth_recovery(
        self, *, token_hash: str, code_hash: str, password_hash: str
    ) -> StoredUser | None: ...

    def create_session(
        self,
        *,
        token_hash: str,
        user_id: str,
        expires_at: int,
        active_session_limit: int,
    ) -> None: ...

    def create_session_if_password_hash(
        self,
        *,
        token_hash: str,
        user_id: str,
        expected_password_hash: str,
        replacement_password_hash: str | None,
        expires_at: int,
        active_session_limit: int,
    ) -> bool: ...

    def get_user_for_session(
        self, *, token_hash: str, now: int | None = None
    ) -> StoredUser | None: ...

    def delete_session(self, *, token_hash: str) -> None: ...

    def active_session_count_for_token(
        self, *, current_token_hash: str, now: int | None = None
    ) -> int | None: ...

    def delete_other_sessions_for_token(
        self,
        *,
        current_token_hash: str,
        now: int | None = None,
    ) -> int | None: ...

    def rotate_password_and_session(
        self,
        *,
        user_id: str,
        expected_password_hash: str,
        password_hash: str,
        token_hash: str,
        expires_at: int,
        current_token_hash: str | None = None,
    ) -> bool: ...

    def get_login_retry_after(self, *, identity_hash: str, now: int) -> int | None: ...

    def record_login_failure(
        self,
        *,
        identity_hash: str,
        now: int,
        attempt_limit: int,
        window_seconds: int,
        block_seconds: int,
    ) -> int | None: ...

    def clear_login_failures(self, *, identity_hash: str) -> None: ...

    def update_password_hash(
        self, *, user_id: str, expected_hash: str, password_hash: str
    ) -> None: ...


class AccountServiceError(RuntimeError):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        *,
        retry_after: int | None = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.retry_after = retry_after


class OAuthAccountLinkRequired(AccountServiceError):
    def __init__(self, token: str) -> None:
        super().__init__(409, "account_link_required", "Sign in with your password to link Yandex.")
        self.token = token


@dataclass(frozen=True, slots=True)
class AuthenticatedSession:
    token: str
    response: AccountSessionResponse


class AccountService:
    def __init__(
        self,
        store: AccountStore,
        *,
        session_ttl_seconds: int,
        active_session_limit: int,
        scrypt_parameters: ScryptParameters,
        login_attempt_limit: int = 5,
        login_attempt_window_seconds: int = 900,
        login_block_seconds: int = 900,
    ) -> None:
        self._store = store
        self._session_ttl_seconds = session_ttl_seconds
        self._active_session_limit = active_session_limit
        self._scrypt_parameters = scrypt_parameters
        self._login_attempt_limit = login_attempt_limit
        self._login_attempt_window_seconds = login_attempt_window_seconds
        self._login_block_seconds = login_block_seconds
        self._dummy_password_hash = hash_password(
            "webdiag-dummy-password-value",
            self._scrypt_parameters,
        )

    @property
    def database_path(self) -> str:
        return self._store.database_path

    def register(self, request: RegisterRequest) -> AuthenticatedSession:
        try:
            email = normalize_email(request.email)
            display_name = normalize_display_name(request.display_name)
            password = validate_password(request.password.get_secret_value(), email=email)
        except AccountValidationError as error:
            raise AccountServiceError(400, error.code, error.message) from error

        if self._store.get_user_by_email(email) is not None:
            raise AccountServiceError(
                409,
                "account_email_exists",
                "An account with this email already exists.",
            )

        password_hash = hash_password(password, self._scrypt_parameters)
        try:
            user = self._store.create_user(
                email=email,
                display_name=display_name,
                password_hash=password_hash,
            )
        except ValueError as error:
            if str(error) == "account_email_exists":
                raise AccountServiceError(
                    409,
                    "account_email_exists",
                    "An account with this email already exists.",
                ) from error
            raise
        return self._create_session(user)

    def authenticate_yandex_user(
        self,
        *,
        subject: str,
        email: str,
        display_name: str,
    ) -> tuple[AuthenticatedSession, bool]:
        try:
            normalized_email = normalize_email(email)
            normalized_display = normalize_display_name(display_name or "Yandex User")
        except AccountValidationError as error:
            raise AccountServiceError(400, error.code, error.message) from error
        try:
            user, is_new = self._store.resolve_yandex_user(
                subject=subject,
                email=normalized_email,
                display_name=normalized_display,
                password_hash=hash_password(secrets.token_urlsafe(32), self._scrypt_parameters),
            )
        except AccountAccessBlocked as error:
            raise self._access_blocked_error() from error
        except ValueError as error:
            if str(error) != "account_link_required":
                raise AccountServiceError(
                    409, "account_oauth_conflict", "Yandex identity is already linked."
                ) from error
            user = self._store.get_user_by_email(normalized_email)
            token = secrets.token_urlsafe(32)
            try:
                self._store.create_oauth_link(
                    token_hash=hash_session_token(token), subject=subject, user_id=user.id
                )
            except AccountAccessBlocked as blocked:
                raise self._access_blocked_error() from blocked
            raise OAuthAccountLinkRequired(token) from error
        return self._create_session(user), is_new

    def prepare_yandex_recovery(self, token: str) -> tuple[str, str]:
        code = f"{secrets.randbelow(1_000_000):06d}"
        try:
            email = self._store.prepare_oauth_recovery(
                token_hash=hash_session_token(token),
                code_hash=hash_session_token(f"{token}:{code}"),
            )
        except ValueError as error:
            rate_limited = str(error) == "account_oauth_recovery_rate_limited"
            raise AccountServiceError(
                429 if rate_limited else 409,
                str(error),
                "Wait before requesting another code."
                if rate_limited
                else "Restart Yandex sign-in.",
            ) from error
        return email, code

    def recover_yandex_session(self, *, token: str, code: str) -> AuthenticatedSession:
        try:
            user = self._store.consume_oauth_recovery(
                token_hash=hash_session_token(token),
                code_hash=hash_session_token(f"{token}:{code}"),
                password_hash=hash_password(secrets.token_urlsafe(32), self._scrypt_parameters),
            )
        except ValueError as error:
            raise AccountServiceError(
                409, "account_oauth_conflict", "Yandex identity is already linked."
            ) from error
        if user is None:
            raise AccountServiceError(
                409, "account_oauth_recovery_invalid", "Code is invalid or expired."
            )
        return self._create_session(user)

    def login(self, request: LoginRequest) -> AuthenticatedSession:
        try:
            email = normalize_email(request.email)
        except AccountValidationError as error:
            verify_password(request.password.get_secret_value(), self._dummy_password_hash)
            raise AccountServiceError(
                401, "account_invalid_credentials", "Invalid email or password."
            ) from error
        password = request.password.get_secret_value()
        if not 1 <= len(password) <= 128:
            raise AccountServiceError(
                401, "account_invalid_credentials", "Invalid email or password."
            )
        identity_hash = hash_login_identity(email)
        now = int(time.time())
        retry_after = self._store.get_login_retry_after(
            identity_hash=identity_hash,
            now=now,
        )
        if retry_after is not None:
            raise self._rate_limit_error(retry_after)
        user = self._store.get_user_by_email(email)
        password_hash = user.password_hash if user is not None else self._dummy_password_hash
        password_matches = verify_password(password, password_hash)
        if user is None or not password_matches:
            retry_after = self._store.record_login_failure(
                identity_hash=identity_hash,
                now=now,
                attempt_limit=self._login_attempt_limit,
                window_seconds=self._login_attempt_window_seconds,
                block_seconds=self._login_block_seconds,
            )
            if retry_after is not None:
                raise self._rate_limit_error(retry_after)
            raise AccountServiceError(
                401, "account_invalid_credentials", "Invalid email or password."
            )
        self._store.clear_login_failures(identity_hash=identity_hash)
        replacement_hash = (
            hash_password(password, self._scrypt_parameters)
            if password_needs_rehash(password_hash, self._scrypt_parameters)
            else None
        )
        return self._create_session(user, replacement_password_hash=replacement_hash)

    @staticmethod
    def _rate_limit_error(retry_after: int) -> AccountServiceError:
        return AccountServiceError(
            429,
            "account_login_rate_limited",
            "Too many sign-in attempts. Try again later.",
            retry_after=max(1, retry_after),
        )

    def get_session(self, token: str | None) -> AccountSessionResponse:
        user, _ = self._resolve_session(token)
        return AccountSessionResponse(authenticated=True, user=user.public())

    def session_summary(self, token: str | None) -> AccountSessionSummaryResponse:
        token_hash = self._session_token_hash(token)
        count = self._store.active_session_count_for_token(current_token_hash=token_hash)
        if count is None:
            raise self._unauthenticated_error()
        return AccountSessionSummaryResponse(active_session_count=count)

    def revoke_other_sessions(self, token: str | None) -> AccountSessionsRevokedResponse:
        token_hash = self._session_token_hash(token)
        revoked = self._store.delete_other_sessions_for_token(
            current_token_hash=token_hash,
        )
        if revoked is None:
            raise self._unauthenticated_error()
        return AccountSessionsRevokedResponse(revoked_session_count=revoked)

    def change_password(
        self,
        token: str | None,
        request: PasswordChangeRequest,
    ) -> AuthenticatedSession:
        user, current_token_hash = self._resolve_session(token)
        identity_hash = hash_login_identity(user.email)
        now = int(time.time())
        retry_after = self._store.get_login_retry_after(
            identity_hash=identity_hash,
            now=now,
        )
        if retry_after is not None:
            raise self._credential_rate_limit_error(retry_after)

        current_password = request.current_password.get_secret_value()
        current_matches = 1 <= len(current_password) <= 128 and verify_password(
            current_password, user.password_hash
        )
        if not current_matches:
            retry_after = self._store.record_login_failure(
                identity_hash=identity_hash,
                now=now,
                attempt_limit=self._login_attempt_limit,
                window_seconds=self._login_attempt_window_seconds,
                block_seconds=self._login_block_seconds,
            )
            if retry_after is not None:
                raise self._credential_rate_limit_error(retry_after)
            raise AccountServiceError(
                401,
                "account_invalid_current_password",
                "Current password is invalid.",
            )

        try:
            new_password = validate_password(
                request.new_password.get_secret_value(),
                email=user.email,
            )
        except AccountValidationError as error:
            raise AccountServiceError(400, error.code, error.message) from error
        if verify_password(new_password, user.password_hash):
            raise AccountServiceError(
                409,
                "account_password_unchanged",
                "New password must differ from the current password.",
            )

        secret = create_session_secret()
        replaced = self._store.rotate_password_and_session(
            user_id=user.id,
            expected_password_hash=user.password_hash,
            password_hash=hash_password(new_password, self._scrypt_parameters),
            token_hash=secret.token_hash,
            expires_at=now + self._session_ttl_seconds,
            current_token_hash=current_token_hash,
        )
        if not replaced:
            raise AccountServiceError(
                409,
                "account_credentials_changed",
                "Account credentials changed. Sign in again.",
            )
        self._store.clear_login_failures(identity_hash=identity_hash)
        return AuthenticatedSession(
            token=secret.token,
            response=AccountSessionResponse(authenticated=True, user=user.public()),
        )

    @staticmethod
    def _credential_rate_limit_error(retry_after: int) -> AccountServiceError:
        return AccountServiceError(
            429,
            "account_credential_rate_limited",
            "Too many credential attempts. Try again later.",
            retry_after=max(1, retry_after),
        )

    def _resolve_session(self, token: str | None) -> tuple[StoredUser, str]:
        token_hash = self._session_token_hash(token)
        user = self._store.get_user_for_session(token_hash=token_hash)
        if user is None:
            raise self._unauthenticated_error()
        return user, token_hash

    @staticmethod
    def _session_token_hash(token: str | None) -> str:
        if not token or len(token) > 256:
            raise AccountService._unauthenticated_error()
        return hash_session_token(token)

    @staticmethod
    def _unauthenticated_error() -> AccountServiceError:
        return AccountServiceError(
            401,
            "account_unauthenticated",
            "Session is invalid or expired.",
        )

    def logout(self, token: str | None) -> None:
        if token and len(token) <= 256:
            self._store.delete_session(token_hash=hash_session_token(token))

    @staticmethod
    def _access_blocked_error() -> AccountServiceError:
        return AccountServiceError(403, "account_access_blocked", "Account access is blocked.")

    def _create_session(
        self,
        user: StoredUser,
        *,
        replacement_password_hash: str | None = None,
    ) -> AuthenticatedSession:
        secret = create_session_secret()
        try:
            created = self._store.create_session_if_password_hash(
                token_hash=secret.token_hash,
                user_id=user.id,
                expected_password_hash=user.password_hash,
                replacement_password_hash=replacement_password_hash,
                expires_at=int(time.time()) + self._session_ttl_seconds,
                active_session_limit=self._active_session_limit,
            )
        except AccountAccessBlocked as error:
            raise self._access_blocked_error() from error
        if not created:
            raise AccountServiceError(
                409,
                "account_credentials_changed",
                "Account credentials changed. Sign in again.",
            )
        return AuthenticatedSession(
            token=secret.token,
            response=AccountSessionResponse(authenticated=True, user=user.public()),
        )
