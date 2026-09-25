from __future__ import annotations

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
from webdiag_api.accounts.storage import StoredUser


class AccountStore(Protocol):
    def create_user(
        self, *, email: str, display_name: str, password_hash: str
    ) -> StoredUser: ...

    def get_user_by_email(self, email: str) -> StoredUser | None: ...

    def get_user_by_id(self, user_id: str) -> StoredUser | None: ...

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

    def get_user_id_for_session(
        self, *, token_hash: str, now: int | None = None
    ) -> str | None: ...

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

    def register(self, request: RegisterRequest) -> AuthenticatedSession:
        try:
            email = normalize_email(request.email)
            display_name = normalize_display_name(request.display_name)
            password = validate_password(request.password.get_secret_value(), email=email)
        except AccountValidationError as error:
            raise AccountServiceError(400, error.code, error.message) from error

        try:
            user = self._store.create_user(
                email=email,
                display_name=display_name,
                password_hash=hash_password(password, self._scrypt_parameters),
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
        count = self._store.active_session_count_for_token(
            current_token_hash=token_hash
        )
        if count is None:
            raise self._unauthenticated_error()
        return AccountSessionSummaryResponse(active_session_count=count)

    def revoke_other_sessions(
        self, token: str | None
    ) -> AccountSessionsRevokedResponse:
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
        user, _ = self._resolve_session(token)
        identity_hash = hash_login_identity(user.email)
        now = int(time.time())
        retry_after = self._store.get_login_retry_after(
            identity_hash=identity_hash,
            now=now,
        )
        if retry_after is not None:
            raise self._credential_rate_limit_error(retry_after)

        current_password = request.current_password.get_secret_value()
        current_matches = (
            1 <= len(current_password) <= 128
            and verify_password(current_password, user.password_hash)
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
        user_id = self._store.get_user_id_for_session(token_hash=token_hash)
        if user_id is None:
            raise self._unauthenticated_error()
        user = self._store.get_user_by_id(user_id)
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

    def _create_session(
        self,
        user: StoredUser,
        *,
        replacement_password_hash: str | None = None,
    ) -> AuthenticatedSession:
        secret = create_session_secret()
        created = self._store.create_session_if_password_hash(
            token_hash=secret.token_hash,
            user_id=user.id,
            expected_password_hash=user.password_hash,
            replacement_password_hash=replacement_password_hash,
            expires_at=int(time.time()) + self._session_ttl_seconds,
            active_session_limit=self._active_session_limit,
        )
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
