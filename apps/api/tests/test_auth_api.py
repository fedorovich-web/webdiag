from __future__ import annotations

import re
from collections.abc import AsyncIterator

import httpx
import pytest
from pydantic import SecretStr
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import webdiag_api.auth.api as auth_api
from webdiag_api.auth.models import Base
from webdiag_api.auth.rate_limit import RateLimitExceeded, RateLimitUnavailable
from webdiag_api.config import settings
from webdiag_api.db import get_db_session
from webdiag_api.email.resend import ResendTransport
from webdiag_api.email.transactional import TransactionalEmail
from webdiag_api.main import app

PASSWORD = "correct horse battery staple"
NEW_PASSWORD = "new correct horse battery"


class StubRateLimiter:
    def __init__(self, error: Exception) -> None:
        self.error = error
        self.calls: list[tuple[str, str, int, int]] = []

    async def enforce(
        self,
        *,
        scope: str,
        identifier: str,
        limit: int,
        window_seconds: int,
    ) -> None:
        self.calls.append((scope, identifier, limit, window_seconds))
        raise self.error


@pytest.fixture
async def auth_client(
    monkeypatch: pytest.MonkeyPatch,
) -> AsyncIterator[tuple[httpx.AsyncClient, list[TransactionalEmail]]]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async def override_db_session() -> AsyncIterator[AsyncSession]:
        async with session_factory() as session:
            yield session

    delivered: list[TransactionalEmail] = []

    async def fake_send(
        self: ResendTransport,
        message: TransactionalEmail,
        *,
        idempotency_key: str,
    ) -> str:
        assert idempotency_key
        delivered.append(message)
        return "email-test-id"

    monkeypatch.setattr(settings, "resend_api_key", SecretStr("re_test_auth_api_key"))
    monkeypatch.setattr(ResendTransport, "send", fake_send)
    app.dependency_overrides[get_db_session] = override_db_session

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client, delivered

    app.dependency_overrides.clear()
    await engine.dispose()


def _token_from(message: TransactionalEmail) -> str:
    match = re.search(r"[?&]token=([A-Za-z0-9_-]+)", message.text)
    assert match is not None
    return match.group(1)


async def _register_and_verify(
    client: httpx.AsyncClient,
    delivered: list[TransactionalEmail],
) -> str:
    await client.post(
        "/api/auth/register",
        json={"email": "roman@example.com", "password": PASSWORD},
    )
    token = _token_from(delivered[-1])
    verified = await client.post("/api/auth/verify-email", json={"token": token})
    assert verified.status_code == 200
    return token


@pytest.mark.asyncio
async def test_register_is_enumeration_safe_and_sends_verification(auth_client) -> None:
    client, delivered = auth_client
    payload = {"email": "Roman@Example.com", "password": PASSWORD}

    created = await client.post("/api/auth/register", json=payload)
    duplicate = await client.post("/api/auth/register", json=payload)

    assert created.status_code == 202
    assert duplicate.status_code == 202
    assert duplicate.json() == created.json()
    assert len(delivered) >= 1
    assert delivered[0].sender == "WebDiag <no-reply@webdiag.ru>"
    assert delivered[0].reply_to == "support@webdiag.ru"
    assert delivered[0].to == "roman@example.com"
    assert _token_from(delivered[0])


@pytest.mark.asyncio
async def test_verify_sets_http_only_session_cookie_and_logout_revokes_it(auth_client) -> None:
    client, delivered = auth_client
    await _register_and_verify(client, delivered)

    set_cookie = client.cookies.get("webdiag_session")
    assert set_cookie is not None

    current = await client.get("/api/auth/me")
    assert current.status_code == 200
    assert current.json()["email"] == "roman@example.com"
    assert current.json()["email_verified_at"] is not None

    logged_out = await client.post("/api/auth/logout")
    assert logged_out.status_code == 200
    assert "webdiag_session=" in logged_out.headers.get("set-cookie", "")

    after_logout = await client.get("/api/auth/me")
    assert after_logout.status_code == 401


@pytest.mark.asyncio
async def test_password_recovery_is_enumeration_safe_and_revokes_existing_session(
    auth_client,
) -> None:
    client, delivered = auth_client
    await _register_and_verify(client, delivered)

    known = await client.post("/api/auth/forgot-password", json={"email": "roman@example.com"})
    unknown = await client.post("/api/auth/forgot-password", json={"email": "missing@example.com"})

    assert known.status_code == 202
    assert unknown.status_code == 202
    assert known.json() == unknown.json()

    reset_message = next(
        message
        for message in reversed(delivered)
        if "парол" in message.subject.lower()
    )
    reset_token = _token_from(reset_message)
    reset = await client.post(
        "/api/auth/reset-password",
        json={"token": reset_token, "new_password": NEW_PASSWORD},
    )
    assert reset.status_code == 200

    stale_session = await client.get("/api/auth/me")
    assert stale_session.status_code == 401

    old_password = await client.post(
        "/api/auth/login",
        json={"email": "roman@example.com", "password": PASSWORD},
    )
    assert old_password.status_code == 401

    new_password = await client.post(
        "/api/auth/login",
        json={"email": "roman@example.com", "password": NEW_PASSWORD},
    )
    assert new_password.status_code == 200
    assert "webdiag_session=" in new_password.headers.get("set-cookie", "")


@pytest.mark.asyncio
async def test_register_returns_429_before_persistence_when_rate_limit_is_exceeded(
    auth_client,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client, delivered = auth_client
    limiter = StubRateLimiter(RateLimitExceeded())
    monkeypatch.setattr(settings, "rate_limit_enabled", True)
    monkeypatch.setattr(auth_api, "auth_rate_limiter", limiter)

    response = await client.post(
        "/api/auth/register",
        json={"email": "Roman@Example.com", "password": PASSWORD},
    )

    assert response.status_code == 429
    assert delivered == []
    assert limiter.calls == [("register", "roman@example.com", 5, 3600)]


@pytest.mark.asyncio
async def test_auth_fails_closed_when_rate_limit_backend_is_unavailable(
    auth_client,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client, delivered = auth_client
    limiter = StubRateLimiter(RateLimitUnavailable())
    monkeypatch.setattr(settings, "rate_limit_enabled", True)
    monkeypatch.setattr(auth_api, "auth_rate_limiter", limiter)

    response = await client.post(
        "/api/auth/forgot-password",
        json={"email": "Roman@Example.com"},
    )

    assert response.status_code == 503
    assert delivered == []
    assert limiter.calls == [("forgot-password", "roman@example.com", 5, 3600)]


@pytest.mark.asyncio
async def test_sql_injection_payloads_cannot_bypass_login(auth_client) -> None:
    client, delivered = auth_client
    await _register_and_verify(client, delivered)
    await client.post("/api/auth/logout")

    password_attack = await client.post(
        "/api/auth/login",
        json={"email": "roman@example.com", "password": "' OR '1'='1' --"},
    )
    email_attack = await client.post(
        "/api/auth/login",
        json={"email": "' OR 1=1 --", "password": PASSWORD},
    )
    valid_login = await client.post(
        "/api/auth/login",
        json={"email": "roman@example.com", "password": PASSWORD},
    )

    assert password_attack.status_code == 401
    assert email_attack.status_code == 422
    assert valid_login.status_code == 200


@pytest.mark.asyncio
async def test_login_replaces_attacker_supplied_session_cookie(auth_client) -> None:
    client, delivered = auth_client
    await _register_and_verify(client, delivered)
    client.cookies.clear()

    attacker_token = "attacker-fixed-session-token"
    client.cookies.set("webdiag_session", attacker_token)
    login = await client.post(
        "/api/auth/login",
        json={"email": "roman@example.com", "password": PASSWORD},
    )

    assert login.status_code == 200
    issued_token = client.cookies.get("webdiag_session")
    assert issued_token is not None
    assert issued_token != attacker_token

    attacker_transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(
        transport=attacker_transport,
        base_url="http://testserver",
        cookies={"webdiag_session": attacker_token},
    ) as attacker_client:
        attacker_session = await attacker_client.get("/api/auth/me")

    assert attacker_session.status_code == 401
    assert (await client.get("/api/auth/me")).status_code == 200


@pytest.mark.asyncio
async def test_email_verification_token_replay_is_rejected(auth_client) -> None:
    client, delivered = auth_client
    token = await _register_and_verify(client, delivered)

    replay = await client.post("/api/auth/verify-email", json={"token": token})

    assert replay.status_code == 400
