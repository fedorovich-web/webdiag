import json
import sqlite3
import threading
from pathlib import Path

import pytest

import webdiag_api.ai.storage as ai_storage
from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.ai.catalog import AIToolCatalog, AIToolDefinition, AIToolState
from webdiag_api.ai.cli import main as cli_main
from webdiag_api.ai.models import AIRunCreateRequest
from webdiag_api.ai.service import AIService
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


def test_operator_cost_report_is_bounded_aggregate_without_private_run_data(
    tmp_path: Path,
    capsys,
) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    user_id = create_user(database_path)
    store = SqliteAIStore(str(database_path), lease_seconds=60)
    definition = AIToolDefinition(
        id="test_cost_tool",
        contract_version="v1",
        state=AIToolState.READY,
        credit_price=1,
        model_policy="test-only",
    )
    service = AIService(store, catalog=AIToolCatalog((definition,)), input_max_bytes=1024)
    service.grant_beta_credits(
        user_id=user_id,
        quantity=20,
        reason="cost report test",
        correlation_id="cost-report-grant",
    )
    run_ids: list[str] = []
    for index in range(1, 21):
        run, _created = service.create_run(
            user_id=user_id,
            request=AIRunCreateRequest(tool_id=definition.id, input={"private": f"value-{index}"}),
            idempotency_key=f"cost-report-run-{index}",
        )
        claim = service.claim_pending()
        assert claim is not None
        service.mark_submitted(run_id=run.id, lease_token=claim.lease_token)
        service.complete_run(
            run_id=run.id,
            lease_token=claim.lease_token,
            output={"text": f"private-output-{index}"},
            provider_request_id=f"gen_cost_{index}",
            input_units=index,
            output_units=index * 2,
            provider_cost_nano_usd=index * 100,
        )
        run_ids.append(run.id)
    with sqlite3.connect(database_path) as connection:
        connection.execute(
            "UPDATE ai_run_attempts SET provider_cost_nano_usd = NULL WHERE run_id = ?",
            (run_ids[-1],),
        )

    assert cli_main(
        [
            "provider-cost-report",
            "--database-path",
            str(database_path),
            "--tool-id",
            definition.id,
            "--sample-limit",
            "20",
        ]
    ) == 0

    output = capsys.readouterr().out
    report = json.loads(output)
    assert report == {
        "contract_version": "webdiag.ai.provider_cost_report.v1",
        "tool_id": "test_cost_tool",
        "sample_limit": 20,
        "sampled_attempts": 20,
        "measured_attempts": 19,
        "unmeasured_attempts": 1,
        "input_units_total": 190,
        "output_units_total": 380,
        "provider_cost_nano_usd": {
            "minimum": 100,
            "maximum": 1_900,
            "p95": 1_900,
            "total": 19_000,
        },
    }
    assert user_id not in output
    assert "value-" not in output
    assert "private-output" not in output
    assert "gen_cost" not in output


def test_operator_cost_report_does_not_create_a_missing_database(tmp_path: Path, capsys) -> None:
    database_path = tmp_path / "missing.sqlite3"

    assert cli_main(
        [
            "provider-cost-report",
            "--database-path",
            str(database_path),
            "--tool-id",
            "test_cost_tool",
        ]
    ) == 2

    assert capsys.readouterr().err == "provider cost database was not found\n"
    assert not database_path.exists()


def test_operator_cost_report_uses_read_only_sqlite_uri(
    tmp_path: Path, capsys, monkeypatch
) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    SqliteAIStore(str(database_path)).ensure_schema()
    connect_calls: list[tuple[object, dict[str, object]]] = []
    real_connect = ai_storage.sqlite3.connect

    def connect(database, *args, **kwargs):
        connect_calls.append((database, kwargs))
        return real_connect(database, *args, **kwargs)

    monkeypatch.setattr(ai_storage.sqlite3, "connect", connect)

    assert cli_main(
        [
            "provider-cost-report",
            "--database-path",
            str(database_path),
            "--tool-id",
            "test_cost_tool",
        ]
    ) == 0
    capsys.readouterr()

    assert len(connect_calls) == 1
    database, options = connect_calls[0]
    assert str(database).endswith("?mode=ro")
    assert options["uri"] is True


def test_operator_cost_report_does_not_migrate_an_old_schema(tmp_path: Path, capsys) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    SqliteAIStore(str(database_path)).ensure_schema()
    with sqlite3.connect(database_path) as connection:
        connection.execute("ALTER TABLE ai_run_attempts DROP COLUMN provider_cost_nano_usd")

    assert cli_main(
        [
            "provider-cost-report",
            "--database-path",
            str(database_path),
            "--tool-id",
            "test_cost_tool",
        ]
    ) == 2

    assert capsys.readouterr().err == "provider cost evidence is unavailable\n"
    with sqlite3.connect(database_path) as connection:
        columns = {
            str(row[1]) for row in connection.execute("PRAGMA table_info(ai_run_attempts)")
        }
    assert "provider_cost_nano_usd" not in columns
