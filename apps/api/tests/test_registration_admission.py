from __future__ import annotations

import asyncio
from pathlib import Path

import httpx
import pytest
from pydantic import ValidationError

import webdiag_api.accounts.service as account_service_module
from webdiag_api.accounts.api import get_account_service, get_registration_admission
from webdiag_api.accounts.models import RegisterRequest
from webdiag_api.accounts.registration_admission import (
    RegistrationAdmissionController,
    RegistrationAdmissionError,
)
from webdiag_api.accounts.security import ScryptParameters
from webdiag_api.accounts.service import AccountService, AccountServiceError
from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.config import Settings
from webdiag_api.main import app


def _service(tmp_path: Path) -> AccountService:
    return AccountService(
        SqliteAccountStore(str(tmp_path / "accounts.sqlite3")),
        session_ttl_seconds=3600,
        active_session_limit=10,
        scrypt_parameters=ScryptParameters(n=2**12),
        login_attempt_limit=5,
        login_attempt_window_seconds=900,
        login_block_seconds=900,
    )


def test_registration_admission_bounds_rate_and_concurrency(tmp_path: Path) -> None:
    now = [1_000]
    controller = RegistrationAdmissionController(
        str(tmp_path / "accounts.sqlite3"),
        request_limit=2,
        window_seconds=60,
        concurrency_limit=1,
        lease_seconds=10,
        clock=lambda: now[0],
    )

    first = controller.acquire()
    with pytest.raises(RegistrationAdmissionError) as busy:
        controller.acquire()
    assert busy.value.status_code == 503
    assert busy.value.code == "account_registration_busy"
    assert busy.value.retry_after == 10

    controller.release(first)
    second = controller.acquire()
    controller.release(second)

    replacement = RegistrationAdmissionController(
        str(tmp_path / "accounts.sqlite3"),
        request_limit=2,
        window_seconds=60,
        concurrency_limit=1,
        lease_seconds=10,
        clock=lambda: now[0],
    )
    with pytest.raises(RegistrationAdmissionError) as limited:
        replacement.acquire()
    assert limited.value.status_code == 429
    assert limited.value.code == "account_registration_rate_limited"
    assert limited.value.retry_after == 60

    now[0] += 61
    replacement.release(replacement.acquire())


def test_registration_admission_maps_storage_failure_to_503(tmp_path: Path) -> None:
    blocked_parent = tmp_path / "not-a-directory"
    blocked_parent.write_text("blocked", encoding="utf-8")
    controller = RegistrationAdmissionController(
        str(blocked_parent / "accounts.sqlite3"),
        request_limit=30,
        window_seconds=60,
        concurrency_limit=2,
        lease_seconds=30,
    )

    with pytest.raises(RegistrationAdmissionError) as unavailable:
        controller.acquire()
    assert unavailable.value.status_code == 503
    assert unavailable.value.code == "account_registration_unavailable"
    assert unavailable.value.retry_after == 5


def test_expired_registration_lease_does_not_block_capacity(tmp_path: Path) -> None:
    now = [2_000]
    controller = RegistrationAdmissionController(
        str(tmp_path / "accounts.sqlite3"),
        request_limit=3,
        window_seconds=60,
        concurrency_limit=1,
        lease_seconds=5,
        clock=lambda: now[0],
    )
    controller.acquire()
    now[0] += 6
    replacement = controller.acquire()
    controller.release(replacement)


def test_duplicate_registration_is_rejected_before_scrypt(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = _service(tmp_path)
    payload = RegisterRequest(
        email="user@example.com",
        display_name="Roman User",
        password="correct horse battery staple",
    )
    service.register(payload)

    def unexpected_hash(*_args: object, **_kwargs: object) -> str:
        raise AssertionError("duplicate registration must not run scrypt")

    monkeypatch.setattr(account_service_module, "hash_password", unexpected_hash)
    with pytest.raises(AccountServiceError) as duplicate:
        service.register(payload)
    assert duplicate.value.status_code == 409
    assert duplicate.value.code == "account_email_exists"


async def _register(payload: dict[str, str]) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.post("/v1/account/register", json=payload)


def test_registration_api_rate_limit_runs_before_expensive_service_work(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = _service(tmp_path)
    admission = RegistrationAdmissionController(
        str(tmp_path / "accounts.sqlite3"),
        request_limit=1,
        window_seconds=60,
        concurrency_limit=1,
        lease_seconds=10,
        clock=lambda: 5_000,
    )
    app.dependency_overrides[get_account_service] = lambda: service
    app.dependency_overrides[get_registration_admission] = lambda: admission
    try:
        first = asyncio.run(
            _register(
                {
                    "email": "first@example.com",
                    "display_name": "First User",
                    "password": "correct horse battery staple",
                }
            )
        )
        assert first.status_code == 201

        def must_not_register(_request: RegisterRequest) -> object:
            raise AssertionError("rate-limited request reached AccountService.register")

        monkeypatch.setattr(service, "register", must_not_register)
        limited = asyncio.run(
            _register(
                {
                    "email": "second@example.com",
                    "display_name": "Second User",
                    "password": "another correct horse password",
                }
            )
        )
        assert limited.status_code == 429
        assert limited.headers["cache-control"] == "no-store"
        assert limited.headers["retry-after"] == "60"
        assert limited.json() == {
            "detail": {
                "code": "account_registration_rate_limited",
                "message": "Too many registration attempts. Try again later.",
            }
        }
    finally:
        app.dependency_overrides.clear()


def test_registration_settings_are_bounded() -> None:
    defaults = Settings()
    assert defaults.account_registration_request_limit == 30
    assert defaults.account_registration_window_seconds == 60
    assert defaults.account_registration_concurrency_limit == 2
    assert defaults.account_registration_lease_seconds == 30

    for payload in (
        {"account_registration_request_limit": 0},
        {"account_registration_request_limit": 1_001},
        {"account_registration_window_seconds": 9},
        {"account_registration_window_seconds": 3_601},
        {"account_registration_concurrency_limit": 0},
        {"account_registration_concurrency_limit": 17},
        {"account_registration_lease_seconds": 4},
        {"account_registration_lease_seconds": 121},
        {
            "account_registration_request_limit": 1,
            "account_registration_concurrency_limit": 2,
        },
    ):
        with pytest.raises(ValidationError):
            Settings(**payload)
