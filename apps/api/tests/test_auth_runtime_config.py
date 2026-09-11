from __future__ import annotations

import pytest
from pydantic import ValidationError

from webdiag_api.config import Settings


def production_settings(**overrides: object) -> Settings:
    values: dict[str, object] = {
        "environment": "production",
        "database_url": "postgresql+asyncpg://webdiag:secret@postgres:5432/webdiag",
        "redis_url": "redis://valkey:6379/0",
        "public_app_url": "https://webdiag.ru",
        "resend_api_key": "re_production_key_123456789",
        "session_cookie_secure": True,
        "rate_limit_enabled": True,
    }
    values.update(overrides)
    return Settings.model_validate(values)


def test_valid_production_auth_settings_pass() -> None:
    settings = production_settings()

    assert settings.session_cookie_secure is True
    assert settings.rate_limit_enabled is True
    assert settings.public_app_url == "https://webdiag.ru"


@pytest.mark.parametrize(
    ("field", "value", "message"),
    [
        ("resend_api_key", "", "RESEND_API_KEY"),
        ("session_cookie_secure", False, "SESSION_COOKIE_SECURE"),
        ("rate_limit_enabled", False, "RATE_LIMIT_ENABLED"),
        ("public_app_url", "http://webdiag.ru", "PUBLIC_APP_URL"),
    ],
)
def test_production_rejects_insecure_auth_runtime(
    field: str,
    value: object,
    message: str,
) -> None:
    with pytest.raises(ValidationError, match=message):
        production_settings(**{field: value})
