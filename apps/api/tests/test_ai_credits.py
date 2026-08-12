import sqlite3
import threading
from pathlib import Path

import pytest

from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.ai.cli import main as cli_main
from webdiag_api.ai.storage import CreditConflictError, CreditIntegrityError, SqliteAIStore


def create_user(database_path: Path) -> str:
    user = SqliteAccountStore(str(database_path)).create_user(
        email="credits@example.com",
        display_name="Credits User",
        password_hash="test-only-password-hash",
    )
    return user.id


def test_duplicate_grant_is_idempotent_and_conflicting_reuse_is_rejected(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    user_id = create_user(database_path)
    store = SqliteAIStore(str(database_path))

    first = store.grant_credits(
        user_id=user_id,
        quantity=100,
        reason="closed beta",
        correlation_id="beta-001",
    )
    second = store.grant_credits(
        user_id=user_id,
        quantity=100,
        reason="closed beta",
        correlation_id="beta-001",
    )

    assert second == first
    assert store.get_credit_account(user_id=user_id).available == 100
    assert len(store.list_ledger(user_id=user_id, limit=20)) == 1
    with pytest.raises(CreditConflictError):
        store.grant_credits(
            user_id=user_id,
            quantity=101,
            reason="closed beta",
            correlation_id="beta-001",
        )


def test_concurrent_unique_grants_are_not_lost(tmp_path: Path) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    user_id = create_user(database_path)
    store = SqliteAIStore(str(database_path))
    barrier = threading.Barrier(2)
    errors: list[BaseException] = []

    def grant(correlation_id: str) -> None:
        try:
            barrier.wait(timeout=5)
            store.grant_credits(
                user_id=user_id,
                quantity=7,
                reason="parallel test",
                correlation_id=correlation_id,
            )
        except BaseException as error:
            errors.append(error)

    threads = [threading.Thread(target=grant, args=(value,)) for value in ("g-a", "g-b")]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join(timeout=10)

    assert errors == []
    assert all(not thread.is_alive() for thread in threads)
    account = store.get_credit_account(user_id=user_id)
    assert (account.available, account.reserved) == (14, 0)
    assert store.reconcile_credits(user_id=user_id) == account


def test_ledger_rows_are_append_only_and_reconciliation_detects_tampering(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    user_id = create_user(database_path)
    store = SqliteAIStore(str(database_path))
    entry = store.grant_credits(
        user_id=user_id,
        quantity=25,
        reason="integrity test",
        correlation_id="g-integrity",
    )

    with sqlite3.connect(database_path) as connection:
        with pytest.raises(sqlite3.IntegrityError, match="append-only"):
            connection.execute("DELETE FROM credit_ledger WHERE id = ?", (entry.id,))
        connection.execute(
            "UPDATE credit_accounts SET available = 26 WHERE user_id = ?",
            (user_id,),
        )

    with pytest.raises(CreditIntegrityError):
        store.reconcile_credits(user_id=user_id)


def test_grant_rejects_unknown_account_and_non_positive_or_boolean_quantity(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    create_user(database_path)
    store = SqliteAIStore(str(database_path))

    for quantity in (0, -1, True):
        with pytest.raises(ValueError, match="positive integer"):
            store.grant_credits(
                user_id="00000000-0000-0000-0000-000000000000",
                quantity=quantity,
                reason="invalid",
                correlation_id=f"invalid-{quantity}",
            )
    with pytest.raises(ValueError, match="account not found"):
        store.grant_credits(
            user_id="00000000-0000-0000-0000-000000000000",
            quantity=1,
            reason="unknown",
            correlation_id="unknown-account",
        )


def test_operator_cli_requires_matching_confirmation(tmp_path: Path, capsys) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    user_id = create_user(database_path)

    assert cli_main(
        [
            "grant-credits",
            "--database-path",
            str(database_path),
            "--user-id",
            user_id,
            "--confirm-user-id",
            "different-user",
            "--quantity",
            "20",
            "--reason",
            "closed beta",
            "--correlation-id",
            "beta-cli-1",
        ]
    ) == 2
    assert "confirmation does not match" in capsys.readouterr().err

    assert cli_main(
        [
            "grant-credits",
            "--database-path",
            str(database_path),
            "--user-id",
            user_id,
            "--confirm-user-id",
            user_id,
            "--quantity",
            "20",
            "--reason",
            "closed beta",
            "--correlation-id",
            "beta-cli-1",
        ]
    ) == 0
    output = capsys.readouterr().out
    assert user_id in output
    assert "available=20" in output
