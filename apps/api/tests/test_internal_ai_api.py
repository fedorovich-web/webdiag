import asyncio
import hashlib
import sqlite3
import threading
from dataclasses import replace
from pathlib import Path

import httpx
import pytest

from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.ai.catalog import DEFAULT_AI_CATALOG, AIToolCatalog, AIToolState
from webdiag_api.ai.models import AIRunCreateRequest
from webdiag_api.ai.service import AIService
from webdiag_api.ai.storage import AILeaseLostError, SqliteAIStore
from webdiag_api.config import settings
from webdiag_api.main import app


def seeded_run(database_path: Path, *, correlation: str = "grant"):
    user = SqliteAccountStore(str(database_path)).create_user(
        email=f"{correlation}@example.com",
        display_name="AI Worker Test",
        password_hash="test-only-password-hash",
    )
    store = SqliteAIStore(str(database_path), lease_seconds=60)
    ready = replace(
        DEFAULT_AI_CATALOG.all()[0],
        state=AIToolState.READY,
        credit_price=7,
    )
    service = AIService(store, catalog=AIToolCatalog((ready,)), input_max_bytes=1024)
    service.grant_beta_credits(
        user_id=user.id,
        quantity=10,
        reason="worker test",
        correlation_id=correlation,
    )
    run, _ = service.create_run(
        user_id=user.id,
        request=AIRunCreateRequest(
            tool_id=ready.id,
            input={"content": correlation},
        ),
        idempotency_key=f"run-{correlation}-key",
    )
    return store, user.id, run.id


def test_only_one_concurrent_claim_wins_and_plaintext_token_is_not_stored(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    store, _user_id, run_id = seeded_run(database_path)
    barrier = threading.Barrier(2)
    claims = []

    def claim() -> None:
        barrier.wait(timeout=5)
        claims.append(store.claim_pending(now=100))

    threads = [threading.Thread(target=claim) for _ in range(2)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join(timeout=10)

    winners = [claim for claim in claims if claim is not None]
    assert len(winners) == 1
    winner = winners[0]
    assert winner.run_id == run_id
    with sqlite3.connect(database_path) as connection:
        stored_hash = connection.execute(
            "SELECT lease_token_hash FROM ai_run_attempts WHERE run_id = ?",
            (run_id,),
        ).fetchone()[0]
    assert stored_hash == hashlib.sha256(winner.lease_token.encode()).hexdigest()
    assert winner.lease_token not in stored_hash


def test_expired_claim_is_replaced_and_stale_completion_cannot_capture(tmp_path: Path) -> None:
    store, user_id, run_id = seeded_run(tmp_path / "accounts.sqlite3")
    first = store.claim_pending(now=100)
    second = store.claim_pending(now=160)

    assert first is not None and second is not None
    assert second.attempt_number == 2
    assert second.lease_token != first.lease_token
    with pytest.raises(AILeaseLostError):
        store.complete_run(
            run_id=run_id,
            lease_token=first.lease_token,
            output_json='{"text":"stale"}',
            output_sha256=hashlib.sha256(b'{"text":"stale"}').hexdigest(),
            now=161,
        )
    account = store.get_credit_account(user_id=user_id)
    assert (account.available, account.reserved) == (3, 7)


def test_current_completion_captures_and_safe_failure_releases(tmp_path: Path) -> None:
    complete_store, complete_user, complete_run = seeded_run(
        tmp_path / "complete.sqlite3",
        correlation="complete",
    )
    complete_claim = complete_store.claim_pending(now=100)
    assert complete_claim is not None
    complete_store.mark_submitted(
        run_id=complete_run,
        lease_token=complete_claim.lease_token,
        now=101,
    )
    completed = complete_store.complete_run(
        run_id=complete_run,
        lease_token=complete_claim.lease_token,
        output_json='{"text":"saved"}',
        output_sha256=hashlib.sha256(b'{"text":"saved"}').hexdigest(),
        now=102,
    )
    assert completed.state == "succeeded"
    assert complete_store.get_credit_account(user_id=complete_user).reserved == 0

    fail_store, fail_user, fail_run = seeded_run(
        tmp_path / "fail.sqlite3",
        correlation="failure",
    )
    fail_claim = fail_store.claim_pending(now=100)
    assert fail_claim is not None
    failed = fail_store.fail_run(
        run_id=fail_run,
        lease_token=fail_claim.lease_token,
        error_code="ai_provider_unavailable",
        provider_unknown=False,
        now=101,
    )
    assert failed.state == "failed"
    account = fail_store.get_credit_account(user_id=fail_user)
    assert (account.available, account.reserved) == (10, 0)


def test_provider_unknown_releases_without_requeue(tmp_path: Path) -> None:
    store, user_id, run_id = seeded_run(tmp_path / "accounts.sqlite3")
    claim = store.claim_pending(now=100)
    assert claim is not None
    store.mark_submitted(run_id=run_id, lease_token=claim.lease_token, now=101)

    unknown = store.fail_run(
        run_id=run_id,
        lease_token=claim.lease_token,
        error_code="ai_provider_outcome_unknown",
        provider_unknown=True,
        now=102,
    )

    assert unknown.state == "provider_unknown"
    assert store.claim_pending(now=1000) is None
    account = store.get_credit_account(user_id=user_id)
    assert (account.available, account.reserved) == (10, 0)


def test_internal_claim_requires_dedicated_bearer(monkeypatch) -> None:
    monkeypatch.setattr(settings, "ai_internal_token", "a" * 32)

    async def post(headers: dict[str, str] | None = None) -> httpx.Response:
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            return await client.post("/v1/internal/ai/runs/claim", headers=headers)

    missing = asyncio.run(post())
    wrong = asyncio.run(post({"Authorization": f"Bearer {'m' * 32}"}))

    assert missing.status_code == 401
    assert wrong.status_code == 401
    assert missing.headers["cache-control"] == "no-store"
    assert missing.json()["detail"]["code"] == "ai_internal_unauthorized"
