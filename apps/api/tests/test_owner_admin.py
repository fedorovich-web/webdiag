from contextlib import closing
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from webdiag_api.accounts.security import hash_session_token
from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.ai.storage import SqliteAIStore
from webdiag_api.audit.storage import SqliteAuditStore
from webdiag_api.billing.storage import Invoice, SqliteBillingStore
from webdiag_api.main import app

NOW = 1_800_000_000
DAY = 86_400
OWNER, CLIENT = str(uuid4()), str(uuid4())
PREFIX = "/v1/admin"


@pytest.fixture
def admin(tmp_path, monkeypatch):
    from webdiag_api import admin_api

    path = str(tmp_path / "accounts.sqlite3")
    monkeypatch.setattr(admin_api.settings, "account_database_path", path)
    monkeypatch.setattr(admin_api.settings, "owner_account_id", OWNER)
    monkeypatch.setattr(admin_api, "unix_time", lambda: NOW)
    accounts = SqliteAccountStore(path)
    accounts.ensure_schema()
    with TestClient(app) as http, closing(accounts._connect()) as db:
        db.executemany(
            "INSERT INTO account_users VALUES (?, ?, ?, ?, ?)",
            [
                (OWNER, "owner@example.test", "Owner", "synthetic", NOW - 90 * DAY),
                (CLIENT, "client%tag@example.test", "Client", "synthetic", NOW - 7 * DAY),
            ],
        )
        db.executemany(
            "INSERT INTO account_sessions VALUES (?, ?, ?, ?)",
            [
                (hash_session_token(token), user, NOW - DAY, expires)
                for token, user, expires in (
                    ("owner", OWNER, NOW + 1),
                    ("client", CLIENT, NOW + 1),
                    ("expired", OWNER, NOW),
                )
            ],
        )
        yield http, db, path


def request(http, section, token="owner", **kwargs):
    headers = {"cookie": f"webdiag_session={token}"} if token else {}
    headers.update(kwargs.pop("headers", {}))
    response = http.get(f"{PREFIX}/{section}", headers=headers, **kwargs)
    assert response.headers["cache-control"] == "private, no-store"
    return response


def test_owner_access_and_revocation(admin, monkeypatch):
    from webdiag_api import admin_api

    http, db, _ = admin
    for section in ("access", "overview", "clients", "payments", "usage"):
        for token, status in ((None, 401), ("expired", 401), ("unknown", 401), ("client", 403)):
            assert request(http, section, token).status_code == status
        assert request(http, section).status_code == 200
    for owner_id in ("", "owner@example.test", f"{OWNER},{CLIENT}"):
        monkeypatch.setattr(admin_api.settings, "owner_account_id", owner_id)
        assert request(http, "overview").status_code == 403
    monkeypatch.setattr(admin_api.settings, "owner_account_id", OWNER)
    db.execute("UPDATE account_users SET email = 'renamed@example.test' WHERE id = ?", (OWNER,))
    assert request(http, "access").json() == {"allowed": True}
    assert request(http, "clients", params={"page": 999999}).status_code == 422
    db.execute("DELETE FROM account_sessions WHERE token_hash = ?", (hash_session_token("owner"),))
    assert request(http, "overview").status_code == 401
    assert (
        db.execute(
            "SELECT COUNT(*) FROM account_sessions WHERE token_hash = ?",
            (hash_session_token("expired"),),
        ).fetchone()[0]
        == 1
    )
    assert request(http, "not-a-route").status_code == 404


def test_admin_get_uses_wal_snapshot_while_writer_holds_lock(admin):
    http, db, path = admin
    before = list(db.iterdump())
    db.execute("BEGIN IMMEDIATE")
    try:
        db.execute("UPDATE account_users SET display_name = 'Uncommitted'")
        assert request(http, "overview").status_code == 200
        assert request(http, "clients").status_code == 200
        assert request(http, "overview", "expired").status_code == 401
    finally:
        db.execute("ROLLBACK")
    assert list(db.iterdump()) == before
    assert Path(path).exists()


def invoice(db, identifier, user, currency, *, paid_at=None, plan=None, state="paid"):
    db.execute(
        "INSERT INTO billing_invoices VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        (
            identifier,
            user,
            "product",
            123,
            50,
            "private",
            state,
            currency,
            plan,
            30 if plan else 0,
            NOW - 100 * DAY,
        ),
    )
    if paid_at is not None:
        db.execute("INSERT INTO billing_payment_confirmations VALUES (?, ?)", (identifier, paid_at))


def test_overview_payment_windows_currencies_and_effective_access(admin):
    http, db, _ = admin
    invoice(db, "rub", OWNER, "RUB", paid_at=NOW - 7 * DAY, plan="pro")
    invoice(db, "usd", CLIENT, "USD", paid_at=NOW - 1)
    invoice(db, "upper", OWNER, "RUB", paid_at=NOW, plan="pro")
    invoice(db, "older", OWNER, "RUB", paid_at=NOW - 7 * DAY - 1, plan="team")
    invoice(db, "legacy", CLIENT, "RUB")
    invoice(db, "pending", CLIENT, "USD", state="pending")
    db.executemany(
        "INSERT INTO billing_plan_periods VALUES (?, ?, ?, ?, ?)",
        [
            ("rub", OWNER, "pro", NOW, NOW + DAY),
            ("upper", OWNER, "pro", NOW + DAY, NOW + 7 * DAY),
            ("older", OWNER, "team", NOW + 7 * DAY, NOW + 37 * DAY),
        ],
    )
    data = request(http, "overview", params={"days": 7}).json()
    assert data["users_total"] == 2
    assert data["registrations"] == {"7": 1, "30": 1, "90": 2}
    assert data["paid_access"] == {"pro": 1, "team": 0}
    assert data["expiring_soon"] == 1
    assert data["payments"] == [
        {"currency": "RUB", "count": 1, "amount_minor": 123},
        {"currency": "USD", "count": 1, "amount_minor": 123},
    ]
    assert data["payments_without_date"] == 1
    assert data["available_credits"] == 0
    clients = request(http, "clients", params={"segment": "expiring"}).json()["items"]
    assert [row["email"] for row in clients] == ["owner@example.test"]
    assert clients[0]["plan"] == "pro"
    assert clients[0]["expires_at"] == NOW + 7 * DAY
    found = request(http, "clients", headers={"x-admin-email-query": "CLIENT%25"}).json()
    assert [row["email"] for row in found["items"]] == ["client%tag@example.test"]
    rows = request(
        http,
        "payments",
        params={
            "days": 7,
            "date_basis": "paid",
            "currency": "USD",
            "kind": "credits",
        },
    ).json()["items"]
    assert [row["id"] for row in rows] == ["usd"]
    assert "offer_id" not in rows[0]
    legacy = request(http, "payments", params={"date_basis": "unknown"}).json()["items"]
    assert [(row["id"], row["state"], row["paid_at"]) for row in legacy] == [
        ("legacy", "paid", None),
    ]


def test_payment_confirmation_records_date_atomically_once(admin, monkeypatch):
    _, db, path = admin
    store = SqliteBillingStore(path, SqliteAIStore(path))
    store.create(Invoice("settled", OWNER, "pack-50", 39000, 50, "synthetic", "pending"))
    monkeypatch.setattr("webdiag_api.billing.storage.time.time", lambda: NOW - 20)
    assert store.settle("settled").state == "paid"
    monkeypatch.setattr("webdiag_api.billing.storage.time.time", lambda: NOW)
    assert store.settle("settled").state == "paid"
    row = db.execute(
        "SELECT paid_at FROM billing_payment_confirmations WHERE invoice_id = ?", ("settled",)
    ).fetchone()
    assert row["paid_at"] == NOW - 20
    assert request(admin[0], "overview").json()["available_credits"] == 50
    assert (
        db.execute(
            "SELECT COUNT(*) FROM credit_ledger WHERE correlation_id = 'lava-settled'"
        ).fetchone()[0]
        == 1
    )


def test_usage_counts_logical_runs_and_owned_records_only(admin, tmp_path):
    from webdiag_api.admin_storage import NS

    http, db, _ = admin
    db.executemany(
        """
        INSERT INTO ai_runs (id, user_id, tool_id, contract_version, model_policy, credit_price,
            idempotency_key, input_json, input_sha256, state, created_at, updated_at)
        VALUES (?, ?, 'tool', 'v1', 'policy', 1, ?, '{"private":"value"}', ?, ?, ?, ?)
        """,
        [
            (name, CLIENT, name, "0" * 64, state, timestamp, NOW * NS)
            for name, state, timestamp in (
                ("first", "succeeded", (NOW - 7 * DAY) * NS),
                ("error", "failed", (NOW - 1) * NS),
                ("uncertain", "provider_unknown", (NOW - 3) * NS),
                ("outside", "succeeded", (NOW - 7 * DAY) * NS - 1),
                ("upper", "succeeded", NOW * NS),
            )
        ],
    )
    db.executemany(
        """
        INSERT INTO ai_run_attempts (
            run_id, attempt_number, lease_token_hash, lease_expires_at, created_at
        ) VALUES ('first', ?, ?, ?, ?)
        """,
        [(attempt, "0" * 64, NOW * NS, NOW * NS) for attempt in (1, 2)],
    )
    audit_path = str(tmp_path / "audits.sqlite3")
    audit_store = SqliteAuditStore(audit_path)
    audit_store.ensure_schema()
    with closing(audit_store._connect()) as public_db:
        public_db.execute(
            "INSERT INTO audit_jobs VALUES ('anon', '2027-01-14T00:00:00Z', '{}', ?)",
            ("0" * 64,),
        )
    db.execute(
        "INSERT INTO account_workspace_projects VALUES ('proj', ?, 'Project', ?, ?, ?, NULL)",
        (CLIENT, "https://private.example.test", NOW - 10, NOW - 1),
    )
    db.execute(
        """
        INSERT INTO account_workspace_saved_audits VALUES (
            'saved', 'proj', ?, 'succeeded', 70, 4, 1, ?, ?, 'v1', '{}', ?
        )""",
        (CLIENT, NOW - 7 * DAY - 1, NOW - 7 * DAY, "0" * 64),
    )
    db.execute(
        """
        INSERT INTO account_workspace_monitors (
            id, user_id, project_id, cadence, timezone, enabled, status,
            consecutive_failures, created_at, updated_at
        ) VALUES ('mon', ?, 'proj', 'daily', 'UTC', 1, 'changed', 0, ?, ?)
        """,
        (CLIENT, NOW - DAY, NOW - 5),
    )
    db.execute(
        """
        INSERT INTO account_workspace_monitor_runs (
            id, monitor_id, project_id, user_id, status, issue_count, started_at, completed_at,
            change_json
        ) VALUES ('run', 'mon', 'proj', ?, 'changed', 1, ?, ?, '{}')
        """,
        (CLIENT, NOW - 10, NOW - 1),
    )
    response = request(http, "usage", params={"days": 7})
    data = response.json()
    assert data["ai"] == {
        "succeeded": 1,
        "failed": 1,
        "provider_unknown": 1,
        "pending": 0,
        "running": 0,
        "deleted": 0,
    }
    assert data["saved_audits"] == 1
    assert data["monitoring"] == {"passed": 0, "changed": 1, "failed": 0}
    assert data == request(http, "overview", params={"days": 7}).json()["usage"]
    assert "private.example.test" not in response.text


def test_empty_activity_and_unavailable_storage_are_distinct(admin):
    http, db, _ = admin
    overview = request(http, "overview").json()
    assert overview["paid_access"] == {"pro": 0, "team": 0}
    assert overview["payments"] == []
    assert overview["usage"]["saved_audits"] == 0
    db.execute("DROP TABLE billing_payment_confirmations")
    response = request(http, "overview")
    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "admin_unavailable"


def test_existing_invoice_schema_and_legacy_settlement_remain_compatible(admin):
    http, db, path = admin
    db.execute("DROP TABLE billing_payment_confirmations")
    invoice(db, "pre-upgrade", OWNER, "RUB")
    SqliteBillingStore(path, SqliteAIStore(path)).ensure_schema()
    invoice(db, "old-code-after-upgrade", OWNER, "RUB", state="pending")
    rows = request(http, "payments").json()["items"]
    assert {row["id"]: row["paid_at"] for row in rows} == {
        "pre-upgrade": None,
        "old-code-after-upgrade": None,
    }


def test_unexpected_admin_error_keeps_private_headers(admin, monkeypatch):
    from webdiag_api.admin_storage import AdminReader

    def fail(*args):
        raise RuntimeError("private adapter detail")

    monkeypatch.setattr(AdminReader, "overview", fail)
    response = request(admin[0], "overview")
    assert response.status_code == 500
    assert "private adapter detail" not in response.text
