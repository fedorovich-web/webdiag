import re
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
_MIN_AI_IMAGE_UPLOAD_BODY_MAX_BYTES = 1_024
_MAX_AI_IMAGE_UPLOAD_BODY_MAX_BYTES = 4 * 1024 * 1024
_MIN_AI_PAYLOAD_MAX_BYTES = 1_024
_MAX_AI_PAYLOAD_MAX_BYTES = 2_000_000
_MONITORING_TOKEN_PLACEHOLDERS = frozenset(
    {
        "change-this-monitoring-token-32chars",
        "replace-with-at-least-32-random-characters",
    }
)
_AI_TOKEN_PLACEHOLDERS = frozenset(
    {
        "change-this-ai-token-32-characters",
        "replace-with-at-least-32-random-characters",
    }
)
_CRAWLER_TOKEN_PLACEHOLDERS = frozenset(
    {
        "change-this-crawler-token-32chars",
        "replace-with-at-least-32-random-characters",
        "replace-with-a-distinct-32-character-random-token",
    }
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="WEBDIAG_", case_sensitive=False)

    environment: str = "development"
    public_release: bool = False
    account_database_path: str = ".webdiag/accounts.sqlite3"
    audit_database_path: str = ".webdiag/audits.sqlite3"
    audit_history_limit: int = Field(default=1_000, ge=1, le=100_000)
    audit_public_request_limit: int = Field(default=60, ge=1, le=10_000)
    audit_public_window_seconds: int = Field(default=60, ge=10, le=3_600)
    audit_public_concurrency_limit: int = Field(default=4, ge=1, le=64)
    audit_public_lease_seconds: int = Field(default=45, ge=10, le=300)
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
    ai_text_request_body_max_bytes: int = Field(
        default=300_000,
        ge=_MIN_AI_PAYLOAD_MAX_BYTES,
        le=_MAX_AI_PAYLOAD_MAX_BYTES,
    )
    ai_image_upload_body_max_bytes: int = Field(
        default=4 * 1024 * 1024,
        ge=_MIN_AI_IMAGE_UPLOAD_BODY_MAX_BYTES,
        le=_MAX_AI_IMAGE_UPLOAD_BODY_MAX_BYTES,
    )
    account_scrypt_n: int = Field(default=2**15, ge=_MIN_SCRYPT_N, le=_MAX_SCRYPT_N)
    account_scrypt_r: int = Field(default=8, ge=1, le=16)
    account_scrypt_p: int = Field(default=3, ge=1, le=4)
    account_scrypt_dklen: int = Field(default=32, ge=16, le=64)
    account_login_attempt_limit: int = Field(default=5, ge=3, le=20)
    account_login_attempt_window_seconds: int = Field(default=900, ge=60, le=3600)
    account_login_block_seconds: int = Field(default=900, ge=30, le=3600)
    monitoring_internal_token: str = ""
    monitoring_scheduler_interval_seconds: int = Field(default=60, ge=30, le=300)
    ai_internal_token: str = ""
    crawler_internal_token: str = ""
    crawler_lease_seconds: int = Field(default=120, ge=30, le=300)
    crawler_page_limit: int = Field(default=25, ge=1, le=25)
    crawler_page_body_max_bytes: int = Field(default=500_000, ge=16_384, le=1_000_000)
    crawler_deadline_seconds: int = Field(default=60, ge=10, le=120)
    ai_safety_identifier_secret: str = ""
    ai_artifact_prefix: str = "ai-uploads"
    ai_lease_seconds: int = Field(default=900, ge=60, le=3600)
    ai_lease_renew_interval_seconds: int = Field(default=300, ge=10, le=1200)
    ai_input_max_bytes: int = Field(
        default=262_144,
        ge=_MIN_AI_PAYLOAD_MAX_BYTES,
        le=_MAX_AI_PAYLOAD_MAX_BYTES,
    )
    ai_output_max_bytes: int = Field(
        default=1_000_000,
        ge=_MIN_AI_PAYLOAD_MAX_BYTES,
        le=_MAX_AI_PAYLOAD_MAX_BYTES,
    )

    @field_validator("account_database_path", "audit_database_path")
    @classmethod
    def validate_account_database_path(cls, value: str) -> str:
        normalized = value.strip()
        lowered = normalized.casefold()
        if not normalized or "\x00" in normalized:
            raise ValueError("database path is invalid")
        if lowered == ":memory:" or lowered.startswith("file:"):
            raise ValueError("database must use a file path")
        if normalized.endswith(("/", "\\")):
            raise ValueError("database path must include a file name")
        for path in (PurePosixPath(normalized), PureWindowsPath(normalized)):
            if ".." in path.parts:
                raise ValueError("database path must not contain traversal")
        return normalized

    @field_validator("monitoring_internal_token")
    @classmethod
    def validate_monitoring_internal_token(cls, value: str) -> str:
        normalized = value.strip()
        if value != normalized:
            raise ValueError(
                "monitoring internal token must contain only visible ASCII characters "
                "without spaces"
            )
        if normalized and len(normalized) < 32:
            raise ValueError("monitoring internal token must contain at least 32 characters")
        if any(not 0x21 <= ord(character) <= 0x7E for character in normalized):
            raise ValueError(
                "monitoring internal token must contain only visible ASCII characters "
                "without spaces"
            )
        if normalized in _MONITORING_TOKEN_PLACEHOLDERS:
            raise ValueError("monitoring internal token must not use a documented placeholder")
        return normalized

    @field_validator("ai_internal_token")
    @classmethod
    def validate_ai_internal_token(cls, value: str) -> str:
        normalized = value.strip()
        if value != normalized:
            raise ValueError(
                "AI internal token must contain only visible ASCII characters without spaces"
            )
        if normalized and len(normalized) < 32:
            raise ValueError("AI internal token must contain at least 32 characters")
        if any(not 0x21 <= ord(character) <= 0x7E for character in normalized):
            raise ValueError(
                "AI internal token must contain only visible ASCII characters without spaces"
            )
        if normalized in _AI_TOKEN_PLACEHOLDERS:
            raise ValueError("AI internal token must not use a documented placeholder")
        return normalized

    @field_validator("crawler_internal_token")
    @classmethod
    def validate_crawler_internal_token(cls, value: str) -> str:
        normalized = value.strip()
        if value != normalized:
            raise ValueError(
                "crawler internal token must contain only visible ASCII characters "
                "without spaces"
            )
        if normalized and len(normalized) < 32:
            raise ValueError("crawler internal token must contain at least 32 characters")
        if any(not 0x21 <= ord(character) <= 0x7E for character in normalized):
            raise ValueError(
                "crawler internal token must contain only visible ASCII characters "
                "without spaces"
            )
        if normalized in _CRAWLER_TOKEN_PLACEHOLDERS:
            raise ValueError("crawler internal token must not use a documented placeholder")
        return normalized

    @field_validator("ai_safety_identifier_secret")
    @classmethod
    def validate_ai_safety_identifier_secret(cls, value: str) -> str:
        if value and (len(value) < 32 or len(value) > 256):
            raise ValueError(
                "AI safety identifier secret must contain between 32 and 256 characters"
            )
        if "\x00" in value or "\r" in value or "\n" in value:
            raise ValueError("AI safety identifier secret contains invalid characters")
        return value

    @field_validator("ai_artifact_prefix")
    @classmethod
    def validate_ai_artifact_prefix(cls, value: str) -> str:
        normalized = value.strip().strip("/")
        if not normalized or not re.fullmatch(
            r"[A-Za-z0-9_-]+(?:/[A-Za-z0-9_-]+)*",
            normalized,
        ):
            raise ValueError("AI artifact prefix is invalid")
        return normalized

    @field_validator("account_scrypt_n")
    @classmethod
    def validate_scrypt_n(cls, value: int) -> int:
        if value & (value - 1):
            raise ValueError("account scrypt N must be a power of two")
        return value

    @model_validator(mode="after")
    def require_secure_cookie_in_production(self) -> Self:
        if self.environment.strip().casefold() == "production":
            if not self.account_cookie_secure:
                raise ValueError("production account cookies must be secure")
            if not self.monitoring_internal_token:
                raise ValueError("production monitoring internal token is required")
            if not self.ai_internal_token:
                raise ValueError("production AI internal token is required")
            if not self.crawler_internal_token:
                raise ValueError("production crawler internal token is required")
            if not self.ai_safety_identifier_secret:
                raise ValueError("production AI safety identifier secret is required")
            if len(
                {
                    self.monitoring_internal_token,
                    self.ai_internal_token,
                    self.crawler_internal_token,
                    self.ai_safety_identifier_secret,
                }
            ) != 4:
                raise ValueError("production internal tokens must be distinct")
        if self.account_request_body_max_bytes > self.http_request_body_max_bytes:
            raise ValueError("account request body max must not exceed HTTP request body max")
        if self.ai_text_request_body_max_bytes > self.http_request_body_max_bytes:
            raise ValueError("AI text request body max must not exceed HTTP request body max")
        if self.ai_input_max_bytes + 1_024 > self.ai_text_request_body_max_bytes:
            raise ValueError("AI text request body max must include bounded envelope overhead")
        if self.ai_lease_renew_interval_seconds >= self.ai_lease_seconds:
            raise ValueError("AI lease renew interval must be shorter than the AI lease")
        return self


settings = Settings()
