import hashlib
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
from webdiag_api.ai.service import AIService, AIServiceError
from webdiag_api.ai.storage import (
    AIQueueCapacityError,
    AIRunLimitReachedError,
    CreditConflictError,
    CreditIntegrityError,
    SqliteAIStore,
)
from webdiag_api.recovery import create_backup


def create_user(database_path: Path) -> str:
    user = SqliteAccountStore(str(database_path)).create_user(
        email="credits@example.com",
        display_name="Credits User",
        password_hash="test-only-password-hash",
    )
    return user.id


def create_cost_report_snapshot(tmp_path: Path, account_database: Path) -> Path:
    audit_database = tmp_path / "cost-report-audits.sqlite3"
    with sqlite3.connect(audit_database) as connection:
        connection.execute("CREATE TABLE audit_marker(id INTEGER PRIMARY KEY)")
    backup_dir = tmp_path / "cost-report-backup"
    create_backup(
        account_database=account_database,
        audit_database=audit_database,
        output_dir=backup_dir,
    )
    return backup_dir


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


def test_ai_run_queue_limits_fail_closed_after_idempotency_replay(tmp_path: Path) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    user_id = create_user(database_path)
    store = SqliteAIStore(
        str(database_path),
        active_run_limit_per_user=1,
        active_run_limit_global=2,
    )
    store.grant_credits(
        user_id=user_id,
        quantity=10,
        reason="queue limit test",
        correlation_id="queue-limit-grant",
    )
    input_json = '{"content":"first"}'
    first, created = store.create_run(
        user_id=user_id,
        tool_id="test_text_tool",
        contract_version="v1",
        model_policy="test-only",
        credit_price=1,
        idempotency_key="queue-limit-first",
        input_json=input_json,
        input_sha256=hashlib.sha256(input_json.encode()).hexdigest(),
    )

    replay, replay_created = store.create_run(
        user_id=user_id,
        tool_id="test_text_tool",
        contract_version="v1",
        model_policy="test-only",
        credit_price=1,
        idempotency_key="queue-limit-first",
        input_json=input_json,
        input_sha256=hashlib.sha256(input_json.encode()).hexdigest(),
    )
    assert replay == first
    assert replay_created is False

    second_json = '{"content":"second"}'
    with pytest.raises(AIRunLimitReachedError):
        store.create_run(
            user_id=user_id,
            tool_id="test_text_tool",
            contract_version="v1",
            model_policy="test-only",
            credit_price=1,
            idempotency_key="queue-limit-second",
            input_json=second_json,
            input_sha256=hashlib.sha256(second_json.encode()).hexdigest(),
        )
    assert store.get_credit_account(user_id=user_id).available == 9
    assert store.get_credit_account(user_id=user_id).reserved == 1


def test_ai_global_queue_capacity_is_enforced_across_accounts(tmp_path: Path) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    first_user = create_user(database_path)
    second_user = SqliteAccountStore(str(database_path)).create_user(
        email="second@example.com",
        display_name="Second",
        password_hash="test-only-password-hash",
    )
    store = SqliteAIStore(
        str(database_path),
        active_run_limit_per_user=1,
        active_run_limit_global=1,
    )
    for user_id in (first_user, second_user.id):
        store.grant_credits(
            user_id=user_id,
            quantity=10,
            reason="global queue test",
            correlation_id=f"global-queue-{user_id}",
        )
    input_json = '{"content":"bounded"}'
    digest = hashlib.sha256(input_json.encode()).hexdigest()
    store.create_run(
        user_id=first_user,
        tool_id="test_text_tool",
        contract_version="v1",
        model_policy="test-only",
        credit_price=1,
        idempotency_key="global-queue-first",
        input_json=input_json,
        input_sha256=digest,
    )

    with pytest.raises(AIQueueCapacityError):
        store.create_run(
            user_id=second_user.id,
            tool_id="test_text_tool",
            contract_version="v1",
            model_policy="test-only",
            credit_price=1,
            idempotency_key="global-queue-second",
            input_json=input_json,
            input_sha256=digest,
        )
    assert store.get_credit_account(user_id=second_user.id).available == 10


def test_ai_service_maps_queue_limits_to_stable_public_errors(tmp_path: Path) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    user_id = create_user(database_path)
    definition = AIToolDefinition(
        id="test_text_tool",
        contract_version="v1",
        state=AIToolState.READY,
        credit_price=1,
        model_policy="test-only",
    )
    service = AIService(
        SqliteAIStore(
            str(database_path),
            active_run_limit_per_user=1,
            active_run_limit_global=2,
        ),
        catalog=AIToolCatalog((definition,)),
        input_max_bytes=1024,
    )
    service.grant_beta_credits(
        user_id=user_id,
        quantity=10,
        reason="service queue limit test",
        correlation_id="service-queue-grant",
    )
    service.create_run(
        user_id=user_id,
        request=AIRunCreateRequest(tool_id=definition.id, input={"content": "first"}),
        idempotency_key="service-queue-first",
    )

    with pytest.raises(AIServiceError) as error:
        service.create_run(
            user_id=user_id,
            request=AIRunCreateRequest(tool_id=definition.id, input={"content": "second"}),
            idempotency_key="service-queue-second",
        )
    assert (error.value.status_code, error.value.code) == (429, "ai_run_limit_reached")


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
    backup_dir = create_cost_report_snapshot(tmp_path, database_path)

    assert cli_main(
        [
            "provider-cost-report",
            "--backup-dir",
            str(backup_dir),
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


def test_operator_cost_report_rejects_a_missing_snapshot(tmp_path: Path, capsys) -> None:
    backup_dir = tmp_path / "missing-backup"

    assert cli_main(
        [
            "provider-cost-report",
            "--backup-dir",
            str(backup_dir),
            "--tool-id",
            "test_cost_tool",
        ]
    ) == 2

    assert capsys.readouterr().err == "provider cost snapshot is unavailable\n"
    assert not backup_dir.exists()


def test_operator_cost_report_uses_read_only_sqlite_uri(
    tmp_path: Path, capsys, monkeypatch
) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    SqliteAIStore(str(database_path)).ensure_schema()
    backup_dir = create_cost_report_snapshot(tmp_path, database_path)
    connect_calls: list[tuple[object, dict[str, object]]] = []
    real_connect = ai_storage.sqlite3.connect

    def connect(database, *args, **kwargs):
        connect_calls.append((database, kwargs))
        return real_connect(database, *args, **kwargs)

    monkeypatch.setattr(ai_storage.sqlite3, "connect", connect)

    report = SqliteAIStore(
        str(backup_dir / "accounts.sqlite3")
    ).provider_cost_report(tool_id="test_cost_tool")

    assert report.sampled_attempts == 0
    assert len(connect_calls) == 1
    database, options = connect_calls[0]
    assert str(database).endswith("?mode=ro&immutable=1")
    assert options["uri"] is True


def test_operator_cost_report_does_not_change_snapshot_files(
    tmp_path: Path, capsys
) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    SqliteAIStore(str(database_path)).ensure_schema()
    backup_dir = create_cost_report_snapshot(tmp_path, database_path)
    before = {path.name: path.read_bytes() for path in backup_dir.iterdir()}

    assert cli_main(
        [
            "provider-cost-report",
            "--backup-dir",
            str(backup_dir),
            "--tool-id",
            "test_cost_tool",
        ]
    ) == 0
    capsys.readouterr()

    after = {path.name: path.read_bytes() for path in backup_dir.iterdir()}
    assert after == before


def test_operator_cost_report_does_not_migrate_an_old_schema(tmp_path: Path, capsys) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    SqliteAIStore(str(database_path)).ensure_schema()
    with sqlite3.connect(database_path) as connection:
        connection.execute("ALTER TABLE ai_run_attempts DROP COLUMN provider_cost_nano_usd")
    backup_dir = create_cost_report_snapshot(tmp_path, database_path)

    assert cli_main(
        [
            "provider-cost-report",
            "--backup-dir",
            str(backup_dir),
            "--tool-id",
            "test_cost_tool",
        ]
    ) == 2

    assert capsys.readouterr().err == "provider cost evidence is unavailable\n"
    with sqlite3.connect(backup_dir / "accounts.sqlite3") as connection:
        columns = {
            str(row[1]) for row in connection.execute("PRAGMA table_info(ai_run_attempts)")
        }
    assert "provider_cost_nano_usd" not in columns
