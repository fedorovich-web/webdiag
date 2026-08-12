from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Protocol

from webdiag_api.accounts.models import AccountSessionResponse, LoginRequest, RegisterRequest
from webdiag_api.accounts.security import (
    AccountValidationError,
    ScryptParameters,
    create_session_secret,
    hash_password,
    hash_session_token,
    normalize_display_name,
    normalize_email,
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

    def get_user_id_for_session(
        self, *, token_hash: str, now: int | None = None
    ) -> str | None: ...

    def delete_session(self, *, token_hash: str) -> None: ...


class AccountServiceError(RuntimeError):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


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
    ) -> None:
        self._store = store
        self._session_ttl_seconds = session_ttl_seconds
        self._active_session_limit = active_session_limit
        self._scrypt_parameters = scrypt_parameters
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
            raise AccountServiceError(
                401, "account_invalid_credentials", "Invalid email or password."
            ) from error
        password = request.password.get_secret_value()
        if not 1 <= len(password) <= 128:
            raise AccountServiceError(
                401, "account_invalid_credentials", "Invalid email or password."
            )
        user = self._store.get_user_by_email(email)
        password_hash = user.password_hash if user is not None else self._dummy_password_hash
        password_matches = verify_password(password, password_hash)
        if user is None or not password_matches:
            raise AccountServiceError(
                401, "account_invalid_credentials", "Invalid email or password."
            )
        return self._create_session(user)

    def get_session(self, token: str | None) -> AccountSessionResponse:
        if not token or len(token) > 256:
            raise AccountServiceError(
                401, "account_unauthenticated", "Sign in to access the account."
            )
        user_id = self._store.get_user_id_for_session(token_hash=hash_session_token(token))
        if user_id is None:
            raise AccountServiceError(
                401, "account_unauthenticated", "Session is invalid or expired."
            )
        user = self._store.get_user_by_id(user_id)
        if user is None:
            raise AccountServiceError(
                401, "account_unauthenticated", "Session is invalid or expired."
            )
        return AccountSessionResponse(authenticated=True, user=user.public())

    def logout(self, token: str | None) -> None:
        if token and len(token) <= 256:
            self._store.delete_session(token_hash=hash_session_token(token))

    def _create_session(self, user: StoredUser) -> AuthenticatedSession:
        secret = create_session_secret()
        self._store.create_session(
            token_hash=secret.token_hash,
            user_id=user.id,
            expires_at=int(time.time()) + self._session_ttl_seconds,
            active_session_limit=self._active_session_limit,
        )
        return AuthenticatedSession(
            token=secret.token,
            response=AccountSessionResponse(authenticated=True, user=user.public()),
        )
