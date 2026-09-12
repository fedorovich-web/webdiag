from __future__ import annotations

from typing import Literal, Self
from urllib.parse import urlparse

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="WEBDIAG_", case_sensitive=False)

    environment: Literal["development", "test", "production"] = "development"
    public_release: bool = False

    database_url: SecretStr = Field(
        default=SecretStr(
            "postgresql+asyncpg://webdiag:change-me@127.0.0.1:5432/webdiag"
        )
    )
    redis_url: SecretStr = Field(default=SecretStr("redis://127.0.0.1:6379/0"))
    public_app_url: str = "http://localhost:3000"
    resend_api_key: SecretStr = Field(default=SecretStr(""))

    session_cookie_secure: bool = False
    rate_limit_enabled: bool = False
    auth_session_ttl_days: int = Field(default=30, ge=1, le=90)
    verification_ttl_minutes: int = Field(default=1440, ge=5, le=10080)
    password_reset_ttl_minutes: int = Field(default=30, ge=5, le=180)

    @model_validator(mode="after")
    def validate_runtime_contract(self) -> Self:
        if self.environment != "production":
            return self

        resend_key = self.resend_api_key.get_secret_value().strip()
        if (
            not 16 <= len(resend_key) <= 512
            or any(character.isspace() or not character.isascii() for character in resend_key)
        ):
            raise ValueError("Production requires a non-empty RESEND_API_KEY")
        if not self.session_cookie_secure:
            raise ValueError("Production requires SESSION_COOKIE_SECURE=true")
        if not self.rate_limit_enabled:
            raise ValueError("Production requires RATE_LIMIT_ENABLED=true")
        public_url = urlparse(self.public_app_url)
        if (
            public_url.scheme != "https"
            or not public_url.hostname
            or public_url.username is not None
            or public_url.password is not None
            or public_url.query
            or public_url.fragment
            or public_url.path not in {"", "/"}
        ):
            raise ValueError("Production requires HTTPS PUBLIC_APP_URL")

        database_url = self.database_url.get_secret_value().strip()
        if "change-me" in database_url or not database_url.startswith("postgresql+asyncpg://"):
            raise ValueError("Production requires a secure PostgreSQL DATABASE_URL")
        redis_url = self.redis_url.get_secret_value().strip()
        parsed_redis_url = urlparse(redis_url)
        if parsed_redis_url.scheme not in {"redis", "rediss"} or not parsed_redis_url.hostname:
            raise ValueError("Production requires a valid REDIS_URL")
        return self


settings = Settings()
