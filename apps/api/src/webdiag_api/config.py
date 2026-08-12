from pathlib import PurePosixPath, PureWindowsPath
from typing import Self

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_MIN_SESSION_TTL_SECONDS = 300
_MAX_SESSION_TTL_SECONDS = 60 * 60 * 24 * 90
_MIN_SCRYPT_N = 2**12
_MAX_SCRYPT_N = 2**16
_MIN_HTTP_REQUEST_BODY_MAX_BYTES = 16_384
_MAX_HTTP_REQUEST_BODY_MAX_BYTES = 10_000_000
_MIN_ACCOUNT_REQUEST_BODY_MAX_BYTES = 1_024
_MAX_ACCOUNT_REQUEST_BODY_MAX_BYTES = 10_000_000


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="WEBDIAG_", case_sensitive=False)

    environment: str = "development"
    public_release: bool = False
    account_database_path: str = ".webdiag/accounts.sqlite3"
    account_session_ttl_seconds: int = Field(
        default=60 * 60 * 24 * 30,
        ge=_MIN_SESSION_TTL_SECONDS,
        le=_MAX_SESSION_TTL_SECONDS,
    )
    account_active_session_limit: int = Field(default=10, ge=1, le=20)
    account_cookie_secure: bool = False
    http_request_body_max_bytes: int = Field(
        default=2_000_000,
        ge=_MIN_HTTP_REQUEST_BODY_MAX_BYTES,
        le=_MAX_HTTP_REQUEST_BODY_MAX_BYTES,
    )
    account_request_body_max_bytes: int = Field(
        default=16_384,
        ge=_MIN_ACCOUNT_REQUEST_BODY_MAX_BYTES,
        le=_MAX_ACCOUNT_REQUEST_BODY_MAX_BYTES,
    )
    account_scrypt_n: int = Field(default=2**14, ge=_MIN_SCRYPT_N, le=_MAX_SCRYPT_N)
    account_scrypt_r: int = Field(default=8, ge=1, le=16)
    account_scrypt_p: int = Field(default=1, ge=1, le=4)
    account_scrypt_dklen: int = Field(default=32, ge=16, le=64)
    monitoring_internal_token: str = ""
    monitoring_scheduler_interval_seconds: int = Field(default=60, ge=30, le=300)

    @field_validator("account_database_path")
    @classmethod
    def validate_account_database_path(cls, value: str) -> str:
        normalized = value.strip()
        lowered = normalized.casefold()
        if not normalized or "\x00" in normalized:
            raise ValueError("account database path is invalid")
        if lowered == ":memory:" or lowered.startswith("file:"):
            raise ValueError("account database must use a file path")
        if normalized.endswith(("/", "\\")):
            raise ValueError("account database path must include a file name")
        for path in (PurePosixPath(normalized), PureWindowsPath(normalized)):
            if ".." in path.parts:
                raise ValueError("account database path must not contain traversal")
        return normalized

    @field_validator("monitoring_internal_token")
    @classmethod
    def validate_monitoring_internal_token(cls, value: str) -> str:
        normalized = value.strip()
        if normalized and len(normalized) < 32:
            raise ValueError("monitoring internal token must contain at least 32 characters")
        return normalized

    @field_validator("account_scrypt_n")
    @classmethod
    def validate_scrypt_n(cls, value: int) -> int:
        if value & (value - 1):
            raise ValueError("account scrypt N must be a power of two")
        return value

    @model_validator(mode="after")
    def require_secure_cookie_in_production(self) -> Self:
        if self.environment.strip().casefold() == "production" and not self.account_cookie_secure:
            raise ValueError("production account cookies must be secure")
        if self.account_request_body_max_bytes > self.http_request_body_max_bytes:
            raise ValueError("account request body max must not exceed HTTP request body max")
        return self


settings = Settings()
