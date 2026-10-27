import hashlib
import sqlite3
from concurrent.futures import ThreadPoolExecutor

import pytest

from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.ai.storage import AIIdempotencyConflictError, SqliteAIStore


@pytest.fixture
def funded_store(tmp_path):
    path = tmp_path / "accounts.sqlite3"
    user = SqliteAccountStore(str(path)).create_user(
        email="replay@example.test",
        display_name="Replay",
        password_hash="test-only-hash",
    )
    store = SqliteAIStore(str(path))
    store.grant_credits(user_id=user.id, quantity=10, reason="test", correlation_id="grant")
    return path, store, user.id


def _create(store, user_id, body, public_hash=None):
    return store.create_run(
        user_id=user_id,
        tool_id="test_text_tool",
        contract_version="v1",
        model_policy="test-only",
        credit_price=1,
        idempotency_key="same-public-request",
        input_json=body,
        input_sha256=hashlib.sha256(body.encode()).hexdigest(),
        request_sha256=public_hash,
    )


def test_public_request_race_reserves_once_with_one_immutable_snapshot(funded_store):
    path, store, user_id = funded_store
    public_hash = hashlib.sha256(b"same validated public input").hexdigest()
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(
            pool.map(
                lambda body: _create(SqliteAIStore(str(path)), user_id, body, public_hash),
                ['{"snapshot":"first"}', '{"snapshot":"second"}'],
            )
        )
    assert sum(created for _, created in results) == 1
    assert results[0][0] == results[1][0]
    assert store.get_credit_account(user_id=user_id).available == 9
    assert store.get_credit_account(user_id=user_id).reserved == 1
    assert len(store.list_ledger(user_id=user_id, limit=20)) == 2
    with pytest.raises(AIIdempotencyConflictError):
        _create(store, user_id, results[0][0].input_json, "b" * 64)
    assert (
        store.get_run_for_idempotency_key(
            user_id="another-owner",
            idempotency_key="same-public-request",
        )
        is None
    )


def test_additive_public_request_hash_migration_preserves_legacy_conflict_checks(funded_store):
    path, store, user_id = funded_store
    body = '{"snapshot":"legacy"}'
    original, _ = _create(store, user_id, body)
    with sqlite3.connect(path) as connection:
        connection.execute("ALTER TABLE ai_runs DROP COLUMN request_sha256")
    migrated = SqliteAIStore(str(path))
    replay, created = _create(migrated, user_id, body, "a" * 64)
    assert created is False
    assert replay == original
    assert replay.request_sha256 is None
    with pytest.raises(AIIdempotencyConflictError):
        _create(migrated, user_id, '{"snapshot":"changed"}', "a" * 64)
    assert migrated.get_credit_account(user_id=user_id).available == 9
    assert len(migrated.list_ledger(user_id=user_id, limit=20)) == 2
