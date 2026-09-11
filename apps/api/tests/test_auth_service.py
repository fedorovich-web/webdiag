from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from webdiag_api.auth.models import AuthSession, Base, OneTimeToken
from webdiag_api.auth.security import digest_token
from webdiag_api.auth.service import AuthError, AuthService


@pytest.fixture
async def service():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        fixed_now = datetime(2026, 9, 11, 12, 0, tzinfo=UTC)
        yield AuthService(session, now=lambda: fixed_now), session

    await engine.dispose()


@pytest.mark.asyncio
async def test_registration_creates_unverified_user_and_persists_only_token_digest(service) -> None:
    auth, session = service

    result = await auth.register(email=" Roman@Example.COM ", password="correct horse battery staple")
    await session.commit()

    assert result.user.email == "roman@example.com"
    assert result.user.email_verified_at is None
    assert result.token.raw
    persisted = (await session.execute(select(OneTimeToken))).scalar_one()
    assert persisted.purpose == "verify_email"
    assert persisted.token_digest == digest_token(result.token.raw)
    assert persisted.token_digest != result.token.raw


@pytest.mark.asyncio
async def test_verification_is_single_use_and_issues_opaque_session(service) -> None:
    auth, session = service
    registered = await auth.register(email="roman@example.com", password="correct horse battery staple")
    await session.commit()

    verified = await auth.verify_email(registered.token.raw)
    await session.commit()

    assert verified.user.email_verified_at is not None
    assert verified.session_token
    stored_session = (await session.execute(select(AuthSession))).scalar_one()
    assert stored_session.token_digest == digest_token(verified.session_token)
    assert stored_session.token_digest != verified.session_token

    with pytest.raises(AuthError, match="invalid_or_expired_token"):
        await auth.verify_email(registered.token.raw)


@pytest.mark.asyncio
async def test_login_requires_verified_email_and_rejects_bad_password(service) -> None:
    auth, session = service
    registered = await auth.register(email="roman@example.com", password="correct horse battery staple")
    await session.commit()

    with pytest.raises(AuthError, match="email_not_verified"):
        await auth.login(email="roman@example.com", password="correct horse battery staple")
    with pytest.raises(AuthError, match="invalid_credentials"):
        await auth.login(email="roman@example.com", password="wrong password")

    await auth.verify_email(registered.token.raw)
    await session.commit()
    logged_in = await auth.login(email="roman@example.com", password="correct horse battery staple")

    assert logged_in.user.email == "roman@example.com"
    assert logged_in.session_token


@pytest.mark.asyncio
async def test_forgot_password_does_not_reveal_unknown_accounts(service) -> None:
    auth, _ = service

    assert await auth.request_password_reset(email="missing@example.com") is None


@pytest.mark.asyncio
async def test_password_reset_consumes_token_and_revokes_existing_sessions(service) -> None:
    auth, session = service
    registered = await auth.register(email="roman@example.com", password="correct horse battery staple")
    await auth.verify_email(registered.token.raw)
    await session.commit()
    logged_in = await auth.login(email="roman@example.com", password="correct horse battery staple")
    reset = await auth.request_password_reset(email="roman@example.com")
    assert reset is not None
    await session.commit()

    await auth.reset_password(token=reset.token.raw, new_password="new correct horse battery")
    await session.commit()

    with pytest.raises(AuthError, match="invalid_session"):
        await auth.authenticate_session(logged_in.session_token)
    with pytest.raises(AuthError, match="invalid_credentials"):
        await auth.login(email="roman@example.com", password="correct horse battery staple")
    relogin = await auth.login(email="roman@example.com", password="new correct horse battery")
    assert relogin.session_token
    with pytest.raises(AuthError, match="invalid_or_expired_token"):
        await auth.reset_password(token=reset.token.raw, new_password="another secure password")


@pytest.mark.asyncio
async def test_expired_one_time_token_is_rejected(service) -> None:
    auth, session = service
    registered = await auth.register(email="roman@example.com", password="correct horse battery staple")
    persisted = (await session.execute(select(OneTimeToken))).scalar_one()
    persisted.expires_at = datetime.now(UTC) - timedelta(seconds=1)
    await session.commit()

    with pytest.raises(AuthError, match="invalid_or_expired_token"):
        await auth.verify_email(registered.token.raw)
