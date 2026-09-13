import hashlib
import threading
import uuid
from pathlib import Path

import pytest

from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.ai.storage import (
    AIInsufficientCreditsError,
    AIUploadQuotaError,
    AIUploadUnavailableError,
    SqliteAIStore,
)


class FakeClock:
    def __init__(self, value: int = 1_000_000_000) -> None:
        self.value = value

    def __call__(self) -> int:
        return self.value


def _create_user(database_path: Path, email: str) -> str:
    return SqliteAccountStore(str(database_path)).create_user(
        email=email,
        display_name="Upload Owner",
        password_hash="test-only-password-hash",
    ).id


def _create_upload(store: SqliteAIStore, *, user_id: str, upload_id: str):
    canonical_id = str(uuid.uuid5(uuid.NAMESPACE_URL, upload_id))
    data = canonical_id.encode("ascii")
    return store.create_upload(
        user_id=user_id,
        upload_id=canonical_id,
        object_key=f"ai-uploads/{canonical_id[:2]}/{canonical_id.replace('-', ''):0<62}"[:76],
        media_type="image/png",
        byte_size=len(data),
        width=3,
        height=2,
        sha256=hashlib.sha256(data).hexdigest(),
    )


def _create_run(
    store: SqliteAIStore,
    *,
    user_id: str,
    upload_id: str,
    idempotency_key: str,
):
    return store.create_run(
        user_id=user_id,
        tool_id="ai_alt_text_studio",
        contract_version="webdiag.ai.alt_text.v1",
        model_policy="openai/gpt-5.6-sol",
        credit_price=1,
        idempotency_key=idempotency_key,
        input_json='{"locale":"ru"}',
        input_sha256=hashlib.sha256(b'{"locale":"ru"}').hexdigest(),
        source_upload_id=upload_id,
    )


def test_upload_records_are_owner_scoped_and_expire_into_deletion_pending(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    owner_id = _create_user(database_path, "owner@example.com")
    other_id = _create_user(database_path, "other@example.com")
    clock = FakeClock()
    store = SqliteAIStore(str(database_path), upload_ttl_seconds=10, clock_ns=clock)

    upload = _create_upload(store, user_id=owner_id, upload_id="upload-one")

    assert upload.expires_at == clock.value + 10_000_000_000
    assert store.get_upload_for_user(user_id=owner_id, upload_id=upload.id) == upload
    assert store.get_upload_for_user(user_id=other_id, upload_id=upload.id) is None
    assert store.get_active_upload_for_user(user_id=owner_id, upload_id=upload.id) == upload

    clock.value = upload.expires_at
    assert store.get_active_upload_for_user(user_id=owner_id, upload_id=upload.id) is None
    pending = store.list_uploads_pending_deletion(limit=10)
    assert [item.id for item in pending] == [upload.id]
    assert pending[0].deletion_state == "pending"


def test_upload_quota_counts_only_active_unbound_uploads(tmp_path: Path) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    user_id = _create_user(database_path, "quota@example.com")
    clock = FakeClock()
    store = SqliteAIStore(
        str(database_path),
        upload_ttl_seconds=10,
        upload_limit=10,
        clock_ns=clock,
    )

    for index in range(10):
        _create_upload(store, user_id=user_id, upload_id=f"quota-{index}")
    with pytest.raises(AIUploadQuotaError):
        _create_upload(store, user_id=user_id, upload_id="quota-over")

    clock.value += 10_000_000_000
    replacement = _create_upload(store, user_id=user_id, upload_id="quota-replacement")
    assert replacement.deletion_state == "available"
    assert len(store.list_uploads_pending_deletion(limit=20)) == 10


def test_run_creation_binds_upload_once_and_idempotent_replay_succeeds(tmp_path: Path) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    user_id = _create_user(database_path, "bind@example.com")
    store = SqliteAIStore(str(database_path))
    store.grant_credits(
        user_id=user_id,
        quantity=3,
        reason="test",
        correlation_id="grant-bind",
    )
    upload = _create_upload(store, user_id=user_id, upload_id="bind-upload")

    first, created = _create_run(
        store,
        user_id=user_id,
        upload_id=upload.id,
        idempotency_key="bind-key-1",
    )
    replay, replay_created = _create_run(
        store,
        user_id=user_id,
        upload_id=upload.id,
        idempotency_key="bind-key-1",
    )

    assert created
    assert not replay_created
    assert replay.id == first.id
    assert store.get_upload(upload_id=upload.id).bound_run_id == first.id
    with pytest.raises(AIUploadUnavailableError):
        _create_run(
            store,
            user_id=user_id,
            upload_id=upload.id,
            idempotency_key="bind-key-2",
        )
    account = store.get_credit_account(user_id=user_id)
    assert (account.available, account.reserved) == (2, 1)


def test_missing_foreign_and_expired_uploads_share_one_failure(tmp_path: Path) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    owner_id = _create_user(database_path, "source-owner@example.com")
    other_id = _create_user(database_path, "source-other@example.com")
    clock = FakeClock()
    store = SqliteAIStore(str(database_path), upload_ttl_seconds=1, clock_ns=clock)
    for user_id, correlation in ((owner_id, "grant-owner"), (other_id, "grant-other")):
        store.grant_credits(
            user_id=user_id,
            quantity=2,
            reason="test",
            correlation_id=correlation,
        )
    upload = _create_upload(store, user_id=owner_id, upload_id="private-upload")

    errors: list[AIUploadUnavailableError] = []
    for source_upload_id, user_id, key in (
        ("missing-upload", other_id, "missing-key"),
        (upload.id, other_id, "foreign-key"),
    ):
        with pytest.raises(AIUploadUnavailableError) as raised:
            _create_run(
                store,
                user_id=user_id,
                upload_id=source_upload_id,
                idempotency_key=key,
            )
        errors.append(raised.value)

    clock.value = upload.expires_at
    with pytest.raises(AIUploadUnavailableError) as expired:
        _create_run(
            store,
            user_id=owner_id,
            upload_id=upload.id,
            idempotency_key="expired-key",
        )
    errors.append(expired.value)
    assert {str(error) for error in errors} == {"AI upload is unavailable"}


def test_failed_credit_reservation_rolls_back_upload_binding(tmp_path: Path) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    user_id = _create_user(database_path, "rollback@example.com")
    store = SqliteAIStore(str(database_path))
    upload = _create_upload(store, user_id=user_id, upload_id="rollback-upload")

    with pytest.raises(AIInsufficientCreditsError):
        _create_run(
            store,
            user_id=user_id,
            upload_id=upload.id,
            idempotency_key="rollback-key",
        )

    assert store.get_upload(upload_id=upload.id).bound_run_id is None


def test_concurrent_run_creation_has_one_upload_binding_winner(tmp_path: Path) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    user_id = _create_user(database_path, "concurrent@example.com")
    store = SqliteAIStore(str(database_path))
    store.grant_credits(
        user_id=user_id,
        quantity=2,
        reason="test",
        correlation_id="grant-concurrent",
    )
    upload = _create_upload(store, user_id=user_id, upload_id="concurrent-upload")
    barrier = threading.Barrier(2)
    results: list[str] = []

    def create(key: str) -> None:
        barrier.wait(timeout=5)
        try:
            run, _created = _create_run(
                store,
                user_id=user_id,
                upload_id=upload.id,
                idempotency_key=key,
            )
            results.append(run.id)
        except AIUploadUnavailableError:
            results.append("unavailable")

    threads = [threading.Thread(target=create, args=(f"concurrent-{index}",)) for index in range(2)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join(timeout=10)

    assert all(not thread.is_alive() for thread in threads)
    assert results.count("unavailable") == 1
    winner = next(value for value in results if value != "unavailable")
    assert store.get_upload(upload_id=upload.id).bound_run_id == winner
    account = store.get_credit_account(user_id=user_id)
    assert (account.available, account.reserved) == (1, 1)


def test_upload_deletion_state_transitions_are_owned_and_idempotent(tmp_path: Path) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    owner_id = _create_user(database_path, "delete-owner@example.com")
    other_id = _create_user(database_path, "delete-other@example.com")
    store = SqliteAIStore(str(database_path))
    upload = _create_upload(store, user_id=owner_id, upload_id="delete-upload")

    assert not store.mark_upload_deletion_pending(user_id=other_id, upload_id=upload.id)
    assert store.mark_upload_deletion_pending(user_id=owner_id, upload_id=upload.id)
    assert store.mark_upload_deletion_pending(user_id=owner_id, upload_id=upload.id)
    assert store.get_upload(upload_id=upload.id).deletion_state == "pending"
    assert store.mark_upload_deleted(upload_id=upload.id)
    assert store.mark_upload_deleted(upload_id=upload.id)
    deleted = store.get_upload(upload_id=upload.id)
    assert deleted.deletion_state == "deleted"
    assert deleted.deleted_at is not None
