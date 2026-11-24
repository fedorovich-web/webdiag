from contextlib import closing
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from webdiag_api.accounts.models import LoginRequest, PasswordChangeRequest
from webdiag_api.accounts.security import ScryptParameters, hash_password, hash_session_token
from webdiag_api.accounts.service import (
    AccountService,
    AccountServiceError,
    OAuthAccountLinkRequired,
)
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


def moderate(http, user=CLIENT, action="block", token="owner", *, csrf=True):
    headers = {"cookie": f"webdiag_session={token}"} if token else {}
    if csrf:
        headers["x-webdiag-admin-action"] = "1"
    response = http.post(f"{PREFIX}/clients/{user}/{action}", headers=headers)
    assert response.headers["cache-control"] == "private, no-store"
    return response


def test_owner_client_management_authorizes_each_write(admin):
    http, db, _ = admin
    assert moderate(http, token=None).status_code == 401
    assert moderate(http, token="expired").status_code == 401
    assert moderate(http, token="client").status_code == 403
    assert moderate(http, csrf=False).status_code == 403
    for action in ("block", "unblock", "revoke-sessions"):
        assert moderate(http, user=OWNER, action=action).status_code == 409
    assert moderate(http, user=str(uuid4())).status_code == 404
    assert moderate(http, action="invalid").status_code == 422
    assert moderate(http, user="invalid").status_code == 422
    clients = {row["id"]: row for row in request(http, "clients").json()["items"]}
    assert clients[OWNER]["manageable"] is False
    assert clients[CLIENT]["manageable"] is True
    assert clients[CLIENT]["status"] == "active"
    assert db.execute("SELECT COUNT(*) FROM account_moderation_events").fetchone()[0] == 0


def test_owner_client_management_revokes_and_audits_without_deleting_account(admin):
    http, db, path = admin
    store = SqliteAccountStore(path)
    assert moderate(http).json() == {
        "id": CLIENT,
        "status": "blocked",
        "revoked_session_count": 1,
    }
    assert request(http, "access", "client").status_code == 401
    assert request(http, "access").status_code == 200
    assert store.get_user_by_id(CLIENT).email == "client%tag@example.test"
    clients = {row["id"]: row for row in request(http, "clients").json()["items"]}
    assert clients[CLIENT]["status"] == "blocked"
    assert moderate(http, action="unblock").json() == {
        "id": CLIENT,
        "status": "active",
        "revoked_session_count": 0,
    }
    assert request(http, "access", "client").status_code == 401
    store.create_session(
        token_hash=hash_session_token("fresh"),
        user_id=CLIENT,
        expires_at=NOW + 100,
        active_session_limit=10,
    )
    assert moderate(http, action="revoke-sessions").json() == {
        "id": CLIENT,
        "status": "active",
        "revoked_session_count": 1,
    }
    assert request(http, "access", "fresh").status_code == 401
    assert [
        tuple(row)
        for row in db.execute(
            """
            SELECT actor_user_id, target_user_id, action, previous_status, status,
                   revoked_session_count, created_at
            FROM account_moderation_events ORDER BY id
            """
        )
    ] == [
        (OWNER, CLIENT, "block", "active", "blocked", 1, NOW),
        (OWNER, CLIENT, "unblock", "blocked", "active", 0, NOW),
        (OWNER, CLIENT, "revoke-sessions", "active", "active", 1, NOW),
    ]


def test_owner_client_management_rolls_back_if_audit_fails(admin):
    http, db, _ = admin
    db.execute("""
        CREATE TRIGGER fail_moderation_audit BEFORE INSERT ON account_moderation_events
        BEGIN SELECT RAISE(ABORT, 'test failure'); END
    """)
    assert moderate(http).status_code == 503
    assert request(http, "access", "client").status_code == 403
    clients = {row["id"]: row for row in request(http, "clients").json()["items"]}
    assert clients[CLIENT]["status"] == "active"


def test_modern_schema_preserves_legacy_accounts_sessions_and_oauth(admin):
    http, db, path = admin
    db.execute("DROP TABLE account_access_blocks")
    db.execute("DROP TABLE account_moderation_events")
    db.execute("INSERT INTO account_oauth_identities VALUES ('yandex', 'legacy', ?)", (CLIENT,))
    SqliteAccountStore(path).ensure_schema()
    clients = {row["id"]: row for row in request(http, "clients").json()["items"]}
    assert clients[CLIENT]["status"] == "active"
    assert request(http, "access", "client").status_code == 403
    assert db.execute("SELECT user_id FROM account_oauth_identities").fetchone()[0] == CLIENT


def moderation_auth(path, db):
    store = SqliteAccountStore(path)
    scrypt = ScryptParameters(n=2**12, p=1)
    password = "correct horse battery"
    db.execute(
        "UPDATE account_users SET password_hash = ? WHERE id = ?",
        (hash_password(password, scrypt), CLIENT),
    )
    return (
        store,
        AccountService(
            store,
            session_ttl_seconds=1800,
            active_session_limit=10,
            scrypt_parameters=scrypt,
        ),
        LoginRequest(email="client%tag@example.test", password=password),
    )


def test_blocked_password_and_linked_yandex_cannot_issue_or_reuse_sessions(admin):
    http, db, path = admin
    store, accounts, credentials = moderation_auth(path, db)
    password_session = accounts.login(credentials)
    with pytest.raises(OAuthAccountLinkRequired) as required:
        accounts.authenticate_yandex_user(
            subject="unlinked-client",
            email=credentials.email,
            display_name="Client",
        )
    token = required.value.token
    _, code = accounts.prepare_yandex_recovery(token)
    yandex_profile = {
        "subject": "linked-client",
        "email": "yandex-client@example.test",
        "display_name": "Yandex",
    }
    yandex_session, created = accounts.authenticate_yandex_user(**yandex_profile)
    assert created
    yandex_id = yandex_session.response.user.id

    assert moderate(http).status_code == 200
    assert moderate(http, user=yandex_id).status_code == 200
    for token_to_check in (password_session.token, yandex_session.token):
        with pytest.raises(AccountServiceError) as revoked:
            accounts.get_session(token_to_check)
        assert revoked.value.code == "account_unauthenticated"
    with pytest.raises(AccountServiceError) as password_blocked:
        accounts.login(credentials)
    assert password_blocked.value.code == "account_access_blocked"
    with pytest.raises(AccountServiceError) as yandex_blocked:
        accounts.authenticate_yandex_user(**yandex_profile)
    assert yandex_blocked.value.code == "account_access_blocked"
    with pytest.raises(AccountServiceError) as recovery:
        accounts.recover_yandex_session(token=token, code=code)
    assert recovery.value.code == "account_oauth_recovery_invalid"
    assert store.get_user_by_id(CLIENT).email == credentials.email

    assert moderate(http, action="unblock").status_code == 200
    assert moderate(http, user=yandex_id, action="unblock").status_code == 200
    assert accounts.login(credentials).response.user.id == CLIENT
    assert accounts.authenticate_yandex_user(**yandex_profile)[0].response.user.id == yandex_id
    assert db.execute("SELECT COUNT(*) FROM account_oauth_links").fetchone()[0] == 0


def test_revoking_sessions_during_password_rotation_cannot_restore_access(admin, monkeypatch):
    http, db, path = admin
    store, accounts, credentials = moderation_auth(path, db)
    session = accounts.login(credentials)
    rotate = store.rotate_password_and_session

    def revoke_then_rotate(**kwargs):
        assert moderate(http, action="revoke-sessions").status_code == 200
        return rotate(**kwargs)

    monkeypatch.setattr(store, "rotate_password_and_session", revoke_then_rotate)
    with pytest.raises(AccountServiceError) as interrupted:
        accounts.change_password(
            session.token,
            PasswordChangeRequest(
                current_password=credentials.password,
                new_password="another very strong password",
            ),
        )
    assert interrupted.value.code == "account_credentials_changed"
    assert accounts.login(credentials).response.user.id == CLIENT


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
