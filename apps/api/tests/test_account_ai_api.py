import asyncio
from dataclasses import replace
from pathlib import Path

import httpx
import pytest

from webdiag_api.accounts.api import SESSION_COOKIE_NAME, get_account_service
from webdiag_api.accounts.models import RegisterRequest
from webdiag_api.accounts.security import ScryptParameters
from webdiag_api.accounts.service import AccountService
from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.ai.api import get_ai_service
from webdiag_api.ai.catalog import DEFAULT_AI_CATALOG, AIToolCatalog, AIToolState
from webdiag_api.ai.service import AIService
from webdiag_api.ai.storage import SqliteAIStore
from webdiag_api.main import app


def services(tmp_path: Path) -> tuple[AccountService, AIService, str, str, str]:
    database_path = tmp_path / "accounts.sqlite3"
    account = AccountService(
        SqliteAccountStore(str(database_path)),
        session_ttl_seconds=3600,
        active_session_limit=10,
        scrypt_parameters=ScryptParameters(n=2**12),
    )
    session = account.register(
        RegisterRequest(
            email="ai-owner@example.com",
            display_name="AI Owner",
            password="correct horse battery staple",
        )
    )
    ready = replace(
        DEFAULT_AI_CATALOG.all()[0],
        state=AIToolState.READY,
        credit_price=7,
    )
    ai = AIService(
        SqliteAIStore(str(database_path)),
        catalog=AIToolCatalog((ready,)),
        input_max_bytes=1024,
    )
    return account, ai, session.token, ready.id, session.response.user.id


async def call(
    method: str,
    path: str,
    *,
    token: str | None = None,
    headers: dict[str, str] | None = None,
    json: dict[str, object] | None = None,
) -> httpx.Response:
    app_headers = dict(headers or {})
    cookies = {SESSION_COOKIE_NAME: token} if token else None
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app),
        base_url="http://test",
        cookies=cookies,
    ) as client:
        return await client.request(method, path, headers=app_headers, json=json)


@pytest.fixture
def ai_context(tmp_path: Path):
    account, ai, token, tool_id, user_id = services(tmp_path)
    app.dependency_overrides[get_account_service] = lambda: account
    app.dependency_overrides[get_ai_service] = lambda: ai
    try:
        yield account, ai, token, tool_id, user_id
    finally:
        app.dependency_overrides.clear()


def test_ai_account_routes_require_session_and_hide_internal_catalog(ai_context) -> None:
    _account, _ai, token, tool_id, _user_id = ai_context

    unauthenticated = asyncio.run(call("GET", "/v1/account/ai/catalog"))
    catalog = asyncio.run(call("GET", "/v1/account/ai/catalog", token=token))

    assert unauthenticated.status_code == 401
    assert unauthenticated.headers["cache-control"] == "no-store"
    assert catalog.status_code == 200
    assert catalog.headers["cache-control"] == "no-store"
    assert catalog.json()["tools"] == [
        {
            "id": tool_id,
            "contract_version": "v1",
            "credit_price": 7,
        }
    ]


def test_run_creation_reserves_once_for_identical_idempotent_replay(ai_context) -> None:
    _account, ai, token, tool_id, user_id = ai_context
    ai.grant_beta_credits(
        user_id=user_id,
        quantity=10,
        reason="test",
        correlation_id="grant-1",
    )
    request = {"tool_id": tool_id, "input": {"content": "grounded source"}}
    headers = {"Idempotency-Key": "run-key-0001"}

    first = asyncio.run(
        call("POST", "/v1/account/ai/runs", token=token, headers=headers, json=request)
    )
    second = asyncio.run(
        call("POST", "/v1/account/ai/runs", token=token, headers=headers, json=request)
    )

    assert first.status_code == 201
    assert second.status_code == 200
    assert second.json() == first.json()
    assert first.json()["run"]["state"] == "pending"
    assert asyncio.run(call("GET", "/v1/account/credits", token=token)).json()["account"] == {
        "available": 3,
        "reserved": 7,
    }


def test_run_creation_rejects_insufficient_credit_and_conflicting_replay(ai_context) -> None:
    _account, ai, token, tool_id, user_id = ai_context
    request = {"tool_id": tool_id, "input": {"content": "first"}}
    headers = {"Idempotency-Key": "run-key-0002"}

    insufficient = asyncio.run(
        call("POST", "/v1/account/ai/runs", token=token, headers=headers, json=request)
    )
    assert insufficient.status_code == 402
    assert insufficient.json()["detail"]["code"] == "ai_insufficient_credits"

    ai.grant_beta_credits(
        user_id=user_id,
        quantity=20,
        reason="test",
        correlation_id="grant-2",
    )
    created = asyncio.run(
        call("POST", "/v1/account/ai/runs", token=token, headers=headers, json=request)
    )
    conflict = asyncio.run(
        call(
            "POST",
            "/v1/account/ai/runs",
            token=token,
            headers=headers,
            json={"tool_id": tool_id, "input": {"content": "different"}},
        )
    )
    assert created.status_code == 201
    assert conflict.status_code == 409
    assert conflict.json()["detail"]["code"] == "ai_idempotency_conflict"


def test_foreign_run_is_404_and_owner_deletion_preserves_ledger(ai_context) -> None:
    account, ai, token, tool_id, user_id = ai_context
    ai.grant_beta_credits(
        user_id=user_id,
        quantity=10,
        reason="test",
        correlation_id="grant-3",
    )
    created = asyncio.run(
        call(
            "POST",
            "/v1/account/ai/runs",
            token=token,
            headers={"Idempotency-Key": "run-key-0003"},
            json={"tool_id": tool_id, "input": {"content": "delete me"}},
        )
    ).json()["run"]

    foreign_session = account.register(
        RegisterRequest(
            email="foreign@example.com",
            display_name="Foreign User",
            password="another correct horse battery staple",
        )
    )
    foreign = asyncio.run(
        call(
            "GET",
            f"/v1/account/ai/runs/{created['id']}",
            token=foreign_session.token,
        )
    )
    assert foreign.status_code == 404

    deleted = asyncio.run(call("DELETE", f"/v1/account/ai/runs/{created['id']}", token=token))
    assert deleted.status_code == 204
    assert ai.get_run(user_id=user_id, run_id=created["id"]).state == "deleted"
    assert len(ai.list_ledger(user_id=user_id, limit=20)) == 3
    account_balance = ai.get_credits(user_id=user_id)
    assert (account_balance.available, account_balance.reserved) == (10, 0)
