from fastapi import Response

from webdiag_api.auth.cookies import clear_session_cookie, set_session_cookie
from webdiag_api.config import Settings


def production_settings() -> Settings:
    return Settings.model_validate(
        {
            "environment": "production",
            "database_url": "postgresql+asyncpg://webdiag:strong-secret@postgres:5432/webdiag",
            "redis_url": "redis://valkey:6379/0",
            "public_app_url": "https://webdiag.ru",
            "resend_api_key": "re_production_key_123456789",
            "session_cookie_secure": True,
            "rate_limit_enabled": True,
            "auth_session_ttl_days": 30,
        }
    )


def test_session_cookie_is_persistent_and_hardened() -> None:
    response = Response()

    set_session_cookie(response, "opaque-session-token", production_settings())

    cookie = response.headers["set-cookie"]
    assert cookie.startswith("webdiag_session=opaque-session-token;")
    assert "HttpOnly" in cookie
    assert "Secure" in cookie
    assert "SameSite=lax" in cookie
    assert "Path=/" in cookie
    assert "Max-Age=2592000" in cookie
    assert "Domain=" not in cookie


def test_logout_cookie_removal_uses_same_security_scope() -> None:
    response = Response()

    clear_session_cookie(response, production_settings())

    cookie = response.headers["set-cookie"]
    assert cookie.startswith('webdiag_session="";')
    assert "HttpOnly" in cookie
    assert "Secure" in cookie
    assert "SameSite=lax" in cookie
    assert "Path=/" in cookie
    assert "Max-Age=0" in cookie
