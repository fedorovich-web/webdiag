"""Run a loopback-only API with disposable fixtures for the owner browser tests."""

import os
import sys
import tempfile
from contextlib import closing
from pathlib import Path
from time import time
from uuid import uuid4

import uvicorn

DAY = 86_400
PASSWORD = "Synthetic demo password 293"
API_SRC = Path(__file__).resolve().parents[2] / "src"


def seed(path: str) -> None:
    from webdiag_api.accounts.api import get_account_service
    from webdiag_api.accounts.models import RegisterRequest
    from webdiag_api.accounts.storage import SqliteAccountStore
    from webdiag_api.admin_storage import initialize_admin_schema
    from webdiag_api.ai.storage import SqliteAIStore
    from webdiag_api.billing.storage import Invoice, SqliteBillingStore
    from webdiag_api.config import settings

    initialize_admin_schema(path)
    account_service = get_account_service()
    owner, member = (
        account_service.register(
            RegisterRequest(email=email, display_name=name, password=PASSWORD)
        ).response.user.id
        for email, name in [
            ("owner@example.test", "Owner Demo"),
            ("client@example.test", "Client Demo"),
        ]
    )
    settings.owner_account_id = owner
    now = int(time())
    store = SqliteBillingStore(path, SqliteAIStore(path))
    for identifier, state, currency, plan, minor in (
        ("demo-pro", "paid", "RUB", "pro", 99000),
        ("demo-usd", "paid", "USD", None, 500),
        ("demo-legacy", "paid", "RUB", None, 39000),
        ("demo-pending", "pending", "RUB", None, 39000),
    ):
        product = "plan-pro" if plan else "pack-50"
        store.create(
            Invoice(
                identifier,
                member,
                product,
                minor,
                50,
                "synthetic",
                "pending",
                currency,
                plan,
                30 if plan else 0,
            )
        )
        if state == "paid":
            store.settle(identifier)
    with closing(SqliteAccountStore(path)._connect()) as db:
        db.execute("UPDATE account_users SET created_at = ?", (now - DAY,))
        db.executemany(
            "INSERT INTO account_users VALUES (?, ?, ?, ?, ?)",
            [
                (str(uuid4()), f"sample-{n:02d}@example.test", "Sample", "synthetic", now - n * DAY)
                for n in range(1, 28)
            ],
        )
        db.execute("UPDATE billing_invoices SET created_at = ?", (now - 12 * DAY,))
        db.execute("UPDATE billing_payment_confirmations SET paid_at = ?", (now - 10 * DAY,))
        db.execute("DELETE FROM billing_payment_confirmations WHERE invoice_id = 'demo-legacy'")
        db.execute(
            "UPDATE billing_plan_periods SET starts_at = ?, expires_at = ? WHERE invoice_id = ?",
            (now - 26 * DAY, now + 4 * DAY, "demo-pro"),
        )
        db.execute(
            """
            INSERT INTO ai_runs (
                id, user_id, tool_id, contract_version, model_policy, credit_price,
                idempotency_key, input_json, input_sha256, state, created_at, updated_at
            ) VALUES (?, ?, 'synthetic', 'v1', 'synthetic', 1, ?, '{}', ?, ?, ?, ?)
            """,
            (
                "demo-ai",
                member,
                "demo-ai",
                "0" * 64,
                "provider_unknown",
                (now - 2 * DAY) * 10**9,
                (now - DAY) * 10**9,
            ),
        )


if __name__ == "__main__":
    # No provider credentials or production settings may enter this fixture.
    for name in tuple(os.environ):
        if name.startswith(("WEBDIAG_", "LAVA_", "YANDEX_", "AI_", "RESEND_", "GOOGLE_")):
            del os.environ[name]
    sys.path.insert(0, str(API_SRC))
    with tempfile.TemporaryDirectory(prefix="webdiag-owner-demo-") as directory:
        path = Path(directory)
        os.environ["WEBDIAG_ACCOUNT_DATABASE_PATH"] = str(path / "accounts.sqlite3")
        os.environ["WEBDIAG_AUDIT_DATABASE_PATH"] = str(path / "audits.sqlite3")
        seed(os.environ["WEBDIAG_ACCOUNT_DATABASE_PATH"])
        uvicorn.run("webdiag_api.main:app", host="127.0.0.1", port=4184)
