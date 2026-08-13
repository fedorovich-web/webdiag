import hashlib
import json
import sqlite3
from pathlib import Path

from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.accounts.workspace_storage import SqliteWorkspaceStore
from webdiag_api.ai.storage import SqliteAIStore

SQL_PAYLOAD = "x'); DROP TABLE account_users; --"
BOOLEAN_PAYLOAD = "' OR 1=1 --"


def _create_users(database_path: Path):
    accounts = SqliteAccountStore(str(database_path))
    owner = accounts.create_user(
        email="owner@example.com",
        display_name="Owner",
        password_hash="scrypt$owner",
    )
    outsider = accounts.create_user(
        email="outsider@example.com",
        display_name="Outsider",
        password_hash="scrypt$outsider",
    )
    return accounts, owner, outsider


def test_sql_metacharacters_remain_bound_project_data(tmp_path: Path) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    accounts, owner, outsider = _create_users(database_path)
    workspace = SqliteWorkspaceStore(str(database_path))

    project = workspace.create_project(
        user_id=owner.id,
        name=SQL_PAYLOAD,
        origin="https://example.com",
    )

    stored = workspace.get_project(user_id=owner.id, project_id=project.id)
    assert stored is not None and stored.name == SQL_PAYLOAD
    assert workspace.get_project(user_id=outsider.id, project_id=project.id) is None
    assert workspace.get_project(user_id=owner.id, project_id=BOOLEAN_PAYLOAD) is None
    assert accounts.get_user_by_email(BOOLEAN_PAYLOAD) is None
    assert accounts.get_user_by_email("owner@example.com") is not None
    with sqlite3.connect(database_path) as connection:
        assert connection.execute("SELECT COUNT(*) FROM account_users").fetchone()[0] == 2
        assert connection.execute(
            "SELECT COUNT(*) FROM account_workspace_projects"
        ).fetchone()[0] == 1


def test_sql_metacharacters_remain_bound_ai_run_data(tmp_path: Path) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    accounts, owner, outsider = _create_users(database_path)
    store = SqliteAIStore(str(database_path))
    store.grant_credits(
        user_id=owner.id,
        quantity=10,
        reason=SQL_PAYLOAD,
        correlation_id=BOOLEAN_PAYLOAD,
    )
    input_json = json.dumps({"value": SQL_PAYLOAD}, separators=(",", ":"))
    run, created = store.create_run(
        user_id=owner.id,
        tool_id="ai_meta_serp_studio",
        contract_version="v1",
        model_policy="openai/gpt-5.6-luna",
        credit_price=1,
        idempotency_key=SQL_PAYLOAD,
        input_json=input_json,
        input_sha256=hashlib.sha256(input_json.encode()).hexdigest(),
    )

    assert created is True
    assert store.get_run_for_user(user_id=owner.id, run_id=run.id) == run
    assert store.get_run_for_user(user_id=outsider.id, run_id=run.id) is None
    assert store.get_run_for_user(user_id=owner.id, run_id=BOOLEAN_PAYLOAD) is None
    assert store.list_runs_for_user(user_id=BOOLEAN_PAYLOAD, limit=51) == ()
    assert store.get_credit_account(user_id=owner.id).available == 9
    assert accounts.get_user_by_email("outsider@example.com") is not None
    with sqlite3.connect(database_path) as connection:
        assert connection.execute("SELECT COUNT(*) FROM account_users").fetchone()[0] == 2
        assert connection.execute("SELECT COUNT(*) FROM ai_runs").fetchone()[0] == 1
        assert connection.execute("SELECT COUNT(*) FROM credit_ledger").fetchone()[0] == 2
