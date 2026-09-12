import asyncio
import sqlite3
import time
from pathlib import Path

import httpx
import pytest
from pydantic import ValidationError

from webdiag_api.accounts.api import get_account_service
from webdiag_api.accounts.models import LoginRequest, RegisterRequest
from webdiag_api.accounts.security import ScryptParameters, hash_password, verify_password
from webdiag_api.accounts.service import AccountService, AccountServiceError
from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.config import Settings
from webdiag_api.main import app


async def request(
    method: str,
    path: str,
    *,
    json: dict[str, object] | None = None,
    cookies: httpx.Cookies | None = None,
) -> tuple[httpx.Response, httpx.Cookies]:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(
        transport=transport,
        base_url="http://test",
        cookies=cookies,
    ) as client:
        response = await client.request(method, path, json=json)
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
        scrypt_parameters=scrypt_parameters or ScryptParameters(),
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

    production = Settings(environment="production", account_cookie_secure=True)
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
    for payload in (
        {"account_session_ttl_seconds": 0},
        {"account_session_ttl_seconds": 60 * 60 * 24 * 91},
        {"account_active_session_limit": 0},
        {"account_active_session_limit": 21},
        {"account_scrypt_n": 12_345},
        {"account_scrypt_r": 0},
        {"account_scrypt_p": 0},
        {"account_scrypt_dklen": 15},
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

    assert tables == {"account_users", "account_sessions"}
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
