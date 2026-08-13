import asyncio
import sqlite3
import time
from pathlib import Path

import httpx
import pytest
from pydantic import ValidationError

from webdiag_api.accounts.api import _http_error, get_account_service
from webdiag_api.accounts.models import LoginRequest, RegisterRequest
from webdiag_api.accounts.security import (
    ScryptParameters,
    hash_password,
    password_needs_rehash,
    verify_password,
)
from webdiag_api.accounts.service import AccountService, AccountServiceError
from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.config import Settings
from webdiag_api.main import app


async def request(
    method: str,
    path: str,
    *,
    json: dict[str, object] | None = None,
    content: bytes | None = None,
    cookies: httpx.Cookies | None = None,
) -> tuple[httpx.Response, httpx.Cookies]:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(
        transport=transport,
        base_url="http://test",
        cookies=cookies,
    ) as client:
        response = await client.request(method, path, json=json, content=content)
        return response, client.cookies


def build_service(
    tmp_path: Path,
    *,
    session_ttl_seconds: int = 3600,
    active_session_limit: int = 10,
    scrypt_parameters: ScryptParameters | None = None,
) -> AccountService:
    return AccountService(
        SqliteAccountStore(str(tmp_path / "accounts.sqlite3")),
        session_ttl_seconds=session_ttl_seconds,
        active_session_limit=active_session_limit,
        scrypt_parameters=scrypt_parameters or ScryptParameters(n=2**12),
        login_attempt_limit=5,
        login_attempt_window_seconds=900,
        login_block_seconds=900,
    )


def register_user(service: AccountService) -> tuple[str, str]:
    password = "correct horse battery staple"
    session = service.register(
        RegisterRequest(
            email=" User@Example.com ",
            display_name="  Roman  User ",
            password=password,
        )
    )
    return session.token, password


def test_settings_reject_insecure_production_and_unsafe_storage_paths() -> None:
    with pytest.raises(ValidationError):
        Settings(environment="production", account_cookie_secure=False)

    production = Settings(
        environment="production",
        account_cookie_secure=True,
        monitoring_internal_token="x" * 32,
        ai_internal_token="y" * 32,
        ai_safety_identifier_secret="z" * 32,
    )
    assert production.account_cookie_secure is True

    for unsafe_path in (
        "../outside.sqlite3",
        r"..\outside.sqlite3",
        ":memory:",
        "file:accounts.sqlite3?mode=memory",
        "accounts/",
        "accounts\\",
        "bad\x00path.sqlite3",
    ):
        with pytest.raises(ValidationError):
            Settings(account_database_path=unsafe_path)

    assert Settings(account_database_path=".webdiag/accounts.sqlite3").account_database_path
    assert Settings(account_database_path="/data/accounts.sqlite3").account_database_path


def test_settings_bound_session_and_scrypt_parameters() -> None:
    defaults = Settings()
    assert defaults.account_scrypt_n == 2**15
    assert defaults.account_scrypt_r == 8
    assert defaults.account_scrypt_p == 3

    for payload in (
        {"account_session_ttl_seconds": 0},
        {"account_session_ttl_seconds": 60 * 60 * 24 * 91},
        {"account_active_session_limit": 0},
        {"account_active_session_limit": 21},
        {"account_scrypt_n": 12_345},
        {"account_scrypt_r": 0},
        {"account_scrypt_p": 0},
        {"account_scrypt_dklen": 15},
        {"account_login_attempt_limit": 2},
        {"account_login_attempt_window_seconds": 59},
        {"account_login_block_seconds": 29},
    ):
        with pytest.raises(ValidationError):
            Settings(**payload)

    settings = Settings(
        account_scrypt_n=2**15,
        account_scrypt_r=8,
        account_scrypt_p=1,
        account_scrypt_dklen=32,
    )
    assert settings.account_scrypt_n == 2**15


def test_settings_bound_request_body_limits() -> None:
    defaults = Settings()
    assert defaults.http_request_body_max_bytes == 2_000_000
    assert defaults.account_request_body_max_bytes == 16_384
    assert defaults.ai_text_request_body_max_bytes == 300_000
    assert defaults.ai_image_upload_body_max_bytes == 4 * 1024 * 1024

    for payload in (
        {"http_request_body_max_bytes": 16_383},
        {"http_request_body_max_bytes": 10_000_001},
        {"account_request_body_max_bytes": 1_023},
        {"account_request_body_max_bytes": 10_000_001},
        {"ai_text_request_body_max_bytes": 1_023},
        {"ai_text_request_body_max_bytes": 2_000_001},
        {"ai_image_upload_body_max_bytes": 1_023},
        {"ai_image_upload_body_max_bytes": 4 * 1024 * 1024 + 1},
        {
            "http_request_body_max_bytes": 16_384,
            "account_request_body_max_bytes": 16_385,
        },
        {
            "http_request_body_max_bytes": 299_999,
            "ai_text_request_body_max_bytes": 300_000,
        },
        {
            "ai_input_max_bytes": 299_000,
            "ai_text_request_body_max_bytes": 300_000,
        },
    ):
        with pytest.raises(ValidationError):
            Settings(**payload)


def test_settings_require_bounded_distinct_ai_worker_credentials() -> None:
    with pytest.raises(ValidationError, match="production AI internal token is required"):
        Settings(
            environment="production",
            account_cookie_secure=True,
            monitoring_internal_token="m" * 32,
        )

    with pytest.raises(ValidationError, match="must be distinct"):
        Settings(
            environment="production",
            account_cookie_secure=True,
            monitoring_internal_token="x" * 32,
            ai_internal_token="x" * 32,
            ai_safety_identifier_secret="z" * 32,
        )

    with pytest.raises(ValidationError, match="safety identifier secret is required"):
        Settings(
            environment="production",
            account_cookie_secure=True,
            monitoring_internal_token="m" * 32,
            ai_internal_token="a" * 32,
        )

    with pytest.raises(ValidationError, match="must be distinct"):
        Settings(
            environment="production",
            account_cookie_secure=True,
            monitoring_internal_token="m" * 32,
            ai_internal_token="a" * 32,
            ai_safety_identifier_secret="a" * 32,
        )

    for payload in (
        {"ai_internal_token": "short"},
        {"ai_internal_token": "x" * 16 + "\n" + "y" * 16},
        {"ai_safety_identifier_secret": "short"},
        {"ai_lease_seconds": 59},
        {"ai_lease_seconds": 3_601},
        {"ai_lease_renew_interval_seconds": 9},
        {"ai_input_max_bytes": 1_023},
        {"ai_output_max_bytes": 2_000_001},
        {"ai_lease_seconds": 60, "ai_lease_renew_interval_seconds": 60},
    ):
        with pytest.raises(ValidationError):
            Settings(**payload)


def test_account_api_rejects_oversized_direct_request_with_proxy_envelope() -> None:
    response, _ = asyncio.run(
        request("POST", "/v1/account/login", content=b"x" * 16_385)
    )

    assert response.status_code == 413
    assert response.headers["cache-control"] == "no-store"
    assert response.json() == {
        "detail": {
            "code": "account_request_too_large",
            "message": "Request body is too large.",
        }
    }


def test_configured_scrypt_hash_and_bounded_verification() -> None:
    parameters = ScryptParameters(n=2**12, r=8, p=1, length=32)
    encoded = hash_password("a sufficiently long password", parameters)
    assert encoded.startswith("scrypt$4096$8$1$")
    assert verify_password("a sufficiently long password", encoded)
    assert not verify_password("wrong password", encoded)

    stronger = hash_password(
        "a sufficiently long password",
        ScryptParameters(n=2**13, r=8, p=1, length=32),
    )
    assert verify_password("a sufficiently long password", stronger)

    malicious = stronger.replace("scrypt$8192$", f"scrypt${2**20}$", 1)
    assert not verify_password("a sufficiently long password", malicious)

    desired = ScryptParameters(n=2**13, r=8, p=1, length=32)
    assert password_needs_rehash(encoded, desired)
    assert not password_needs_rehash(stronger, desired)


def test_successful_login_rehashes_legacy_password_parameters(tmp_path: Path) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    legacy = ScryptParameters(n=2**12, r=8, p=1, length=32)
    current = ScryptParameters(n=2**13, r=8, p=1, length=32)
    legacy_service = build_service(tmp_path, scrypt_parameters=legacy)
    register_user(legacy_service)

    current_service = build_service(tmp_path, scrypt_parameters=current)
    current_service.login(
        LoginRequest(email="user@example.com", password="correct horse battery staple")
    )

    with sqlite3.connect(database_path) as connection:
        password_hash = connection.execute(
            "SELECT password_hash FROM account_users WHERE email = ?",
            ("user@example.com",),
        ).fetchone()[0]
    assert password_hash.startswith("scrypt$8192$8$1$")


def test_login_failures_are_persistently_bounded_and_hashed(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    service = build_service(tmp_path)
    register_user(service)

    for _ in range(4):
        with pytest.raises(AccountServiceError) as invalid:
            service.login(LoginRequest(email="user@example.com", password="wrong password"))
        assert invalid.value.status_code == 401

    with pytest.raises(AccountServiceError) as limited:
        service.login(LoginRequest(email="user@example.com", password="wrong password"))
    assert limited.value.status_code == 429
    assert limited.value.code == "account_login_rate_limited"
    assert limited.value.retry_after == 900
    assert _http_error(limited.value).headers == {
        "Cache-Control": "no-store",
        "Retry-After": "900",
    }

    replacement = build_service(tmp_path)
    with pytest.raises(AccountServiceError) as still_limited:
        replacement.login(
            LoginRequest(email="user@example.com", password="correct horse battery staple")
        )
    assert still_limited.value.status_code == 429

    with sqlite3.connect(database_path) as connection:
        row = connection.execute(
            "SELECT identity_hash, failed_attempts FROM account_login_attempts"
        ).fetchone()
    assert row is not None
    assert row[0] != "user@example.com"
    assert row[1] == 5

    second = build_service(tmp_path)
    second.register(
        RegisterRequest(
            email="second@example.com",
            display_name="Second User",
            password="another correct horse password",
        )
    )
    with pytest.raises(AccountServiceError):
        second.login(LoginRequest(email="second@example.com", password="wrong password"))
    second.login(
        LoginRequest(
            email="second@example.com",
            password="another correct horse password",
        )
    )
    with sqlite3.connect(database_path) as connection:
        assert connection.execute(
            "SELECT COUNT(*) FROM account_login_attempts"
        ).fetchone()[0] == 1


def test_missing_account_uses_the_bounded_password_verifier(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    service = build_service(tmp_path)
    calls: list[str] = []

    def recording_verify(password: str, encoded: str) -> bool:
        calls.append(password)
        return False

    monkeypatch.setattr("webdiag_api.accounts.service.verify_password", recording_verify)
    with pytest.raises(AccountServiceError):
        service.login(LoginRequest(email="missing@example.com", password="wrong password"))
    with pytest.raises(AccountServiceError):
        service.login(LoginRequest(email="bad", password="wrong password"))
    assert calls == ["wrong password", "wrong password"]


def test_account_service_register_login_session_and_logout(tmp_path: Path) -> None:
    service = build_service(tmp_path)
    registered = service.register(
        RegisterRequest(
            email=" User@Example.com ",
            display_name="  Roman  User ",
            password="correct horse battery staple",
        )
    )

    assert registered.response.user.email == "user@example.com"
    assert registered.response.user.display_name == "Roman User"
    assert registered.response.model_dump().keys() == {
        "contract_version",
        "authenticated",
        "user",
    }
    assert service.get_session(registered.token).user.id == registered.response.user.id

    logged_in = service.login(
        LoginRequest(email="user@example.com", password="correct horse battery staple")
    )
    assert logged_in.response.user.id == registered.response.user.id
    assert logged_in.token != registered.token

    service.logout(logged_in.token)
    with pytest.raises(AccountServiceError) as error:
        service.get_session(logged_in.token)
    assert error.value.code == "account_unauthenticated"


def test_account_service_rejects_duplicate_and_invalid_credentials_equally(
    tmp_path: Path,
) -> None:
    service = build_service(tmp_path)
    request_payload = RegisterRequest(
        email="user@example.com",
        display_name="Roman User",
        password="correct horse battery staple",
    )
    service.register(request_payload)

    with pytest.raises(AccountServiceError) as duplicate:
        service.register(request_payload)
    assert duplicate.value.status_code == 409
    assert duplicate.value.code == "account_email_exists"

    failures: list[AccountServiceError] = []
    for email, password in (
        ("user@example.com", "wrong password"),
        ("missing@example.com", "wrong password"),
        ("bad", "wrong password"),
    ):
        with pytest.raises(AccountServiceError) as invalid:
            service.login(LoginRequest(email=email, password=password))
        failures.append(invalid.value)

    assert {(failure.status_code, failure.code, failure.message) for failure in failures} == {
        (401, "account_invalid_credentials", "Invalid email or password.")
    }


def test_storage_is_foundation_only_hashes_tokens_and_caps_sessions(tmp_path: Path) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    service = build_service(tmp_path, active_session_limit=3)
    first_token, raw_password = register_user(service)

    tokens = [first_token]
    for _ in range(4):
        tokens.append(
            service.login(
                LoginRequest(email="user@example.com", password=raw_password)
            ).token
        )

    with sqlite3.connect(database_path) as connection:
        tables = {
            row[0]
            for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table'"
            ).fetchall()
        }
        password_hash = connection.execute(
            "SELECT password_hash FROM account_users WHERE email = ?",
            ("user@example.com",),
        ).fetchone()[0]
        session_hashes = {
            row[0]
            for row in connection.execute(
                "SELECT token_hash FROM account_sessions"
            ).fetchall()
        }

    assert tables == {"account_users", "account_sessions", "account_login_attempts"}
    assert password_hash != raw_password
    assert raw_password not in database_path.read_bytes().decode("latin-1", errors="ignore")
    assert len(session_hashes) == 3
    assert all(token not in session_hashes for token in tokens)

    for evicted in tokens[:-3]:
        with pytest.raises(AccountServiceError):
            service.get_session(evicted)
    assert service.get_session(tokens[-1]).user.email == "user@example.com"


def test_expired_session_is_rejected_and_deleted(tmp_path: Path) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    service = build_service(tmp_path, session_ttl_seconds=300)
    token, _ = register_user(service)

    with sqlite3.connect(database_path) as connection:
        connection.execute(
            "UPDATE account_sessions SET expires_at = ?",
            (int(time.time()) - 1,),
        )
        connection.commit()

    with pytest.raises(AccountServiceError) as expired:
        service.get_session(token)
    assert expired.value.code == "account_unauthenticated"

    with sqlite3.connect(database_path) as connection:
        assert connection.execute("SELECT COUNT(*) FROM account_sessions").fetchone()[0] == 0


def test_account_api_register_me_logout_and_validation_envelope(tmp_path: Path) -> None:
    service = build_service(tmp_path)
    app.dependency_overrides[get_account_service] = lambda: service
    try:
        invalid, _ = asyncio.run(
            request(
                "POST",
                "/v1/account/login",
                json={"email": "x", "password": "wrong"},
            )
        )
        assert invalid.status_code == 422
        assert invalid.headers["cache-control"] == "no-store"
        assert invalid.json() == {
            "detail": {
                "code": "account_invalid_request",
                "message": "Invalid account request.",
            }
        }

        registered, cookies = asyncio.run(
            request(
                "POST",
                "/v1/account/register",
                json={
                    "email": "user@example.com",
                    "display_name": "Roman User",
                    "password": "correct horse battery staple",
                },
            )
        )
        assert registered.status_code == 201
        assert registered.json()["contract_version"] == "webdiag.account.session.v1"
        assert registered.json()["authenticated"] is True
        assert set(registered.json()) == {"contract_version", "authenticated", "user"}
        assert "webdiag_session" in cookies
        set_cookie = registered.headers["set-cookie"]
        assert "HttpOnly" in set_cookie
        assert "SameSite=lax" in set_cookie
        assert registered.headers["cache-control"] == "no-store"

        session, cookies = asyncio.run(request("GET", "/v1/account/me", cookies=cookies))
        assert session.status_code == 200
        assert session.headers["cache-control"] == "no-store"
        assert session.json()["user"]["email"] == "user@example.com"

        logged_out, cookies = asyncio.run(
            request("POST", "/v1/account/logout", cookies=cookies)
        )
        assert logged_out.status_code == 200
        assert logged_out.json()["authenticated"] is False

        missing, _ = asyncio.run(request("GET", "/v1/account/me", cookies=cookies))
        assert missing.status_code == 401
        assert missing.json()["detail"]["code"] == "account_unauthenticated"
    finally:
        app.dependency_overrides.clear()
