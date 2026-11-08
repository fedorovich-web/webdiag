from __future__ import annotations

import sqlite3
import threading
import time
from dataclasses import dataclass
from pathlib import Path

from webdiag_api.ai.storage import SqliteAIStore


@dataclass(frozen=True)
class Invoice:
    id: str
    user_id: str
    pack_id: str
    amount_minor: int
    credits: int
    offer_id: str
    state: str
    currency: str = "RUB"
    plan_id: str | None = None
    duration_days: int = 0


class _ClosableConnection(sqlite3.Connection):
    def __exit__(self, exc_type: object, exc_val: object, exc_tb: object) -> bool | None:
        try:
            return super().__exit__(exc_type, exc_val, exc_tb)
        finally:
            self.close()


class SqliteBillingStore:
    def __init__(self, database_path: str, credits: SqliteAIStore) -> None:
        self._path = Path(database_path)
        self._credits = credits
        self._schema_lock = threading.Lock()
        self._schema_ready = False

    def _connect(self) -> sqlite3.Connection:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(
            self._path, timeout=10, isolation_level=None, factory=_ClosableConnection
        )
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA journal_mode = WAL")
        connection.execute("PRAGMA busy_timeout = 10000")
        return connection

    def ensure_schema(self) -> None:
        if self._schema_ready:
            return
        with self._schema_lock:
            if self._schema_ready:
                return
            self._credits.ensure_schema()
            with self._connect() as connection:
                connection.executescript("""
                    CREATE TABLE IF NOT EXISTS billing_invoices (
                        id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL REFERENCES account_users(id),
                        pack_id TEXT NOT NULL,
                        amount_minor INTEGER NOT NULL CHECK(amount_minor > 0),
                        credits INTEGER NOT NULL CHECK(credits > 0),
                        offer_id TEXT NOT NULL,
                        state TEXT NOT NULL CHECK(state IN ('pending', 'paid')),
                        currency TEXT NOT NULL CHECK(currency IN ('RUB', 'USD')),
                        plan_id TEXT CHECK(plan_id IN ('pro', 'team')),
                        duration_days INTEGER NOT NULL,
                        created_at INTEGER NOT NULL
                    );
                    CREATE INDEX IF NOT EXISTS billing_invoices_owner
                        ON billing_invoices(user_id, created_at);
                    CREATE TABLE IF NOT EXISTS billing_plan_periods (
                        invoice_id TEXT PRIMARY KEY REFERENCES billing_invoices(id),
                        user_id TEXT NOT NULL REFERENCES account_users(id),
                        plan_id TEXT NOT NULL CHECK(plan_id IN ('pro', 'team')),
                        starts_at INTEGER NOT NULL,
                        expires_at INTEGER NOT NULL,
                        CHECK(expires_at > starts_at)
                    );
                    CREATE INDEX IF NOT EXISTS billing_plan_periods_owner
                        ON billing_plan_periods(user_id, starts_at);
                """)
            self._schema_ready = True

    def create(self, invoice: Invoice) -> None:
        self.ensure_schema()
        with self._connect() as connection:
            connection.execute(
                "INSERT INTO billing_invoices VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    invoice.id,
                    invoice.user_id,
                    invoice.pack_id,
                    invoice.amount_minor,
                    invoice.credits,
                    invoice.offer_id,
                    invoice.state,
                    invoice.currency,
                    invoice.plan_id,
                    invoice.duration_days,
                    int(time.time()),
                ),
            )

    def plan(self, user_id: str) -> tuple[str, int | None]:
        self.ensure_schema()
        now = int(time.time())
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT * FROM billing_plan_periods WHERE user_id = ? AND expires_at > ? "
                "ORDER BY starts_at",
                (user_id, now),
            ).fetchall()
        if rows and rows[0]["starts_at"] <= now:
            active = rows[0]
            expires = active["expires_at"]
            for following in rows[1:]:
                if following["plan_id"] != active["plan_id"] or following["starts_at"] != expires:
                    break
                expires = following["expires_at"]
            return active["plan_id"], expires
        return "starter", None

    def period(self, invoice_id: str) -> tuple[int, int] | None:
        self.ensure_schema()
        with self._connect() as connection:
            row = connection.execute(
                "SELECT starts_at, expires_at FROM billing_plan_periods WHERE invoice_id = ?",
                (invoice_id,),
            ).fetchone()
        return (row["starts_at"], row["expires_at"]) if row else None

    def get(self, invoice_id: str) -> Invoice | None:
        self.ensure_schema()
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM billing_invoices WHERE id = ?", (invoice_id,)
            ).fetchone()
        return (
            Invoice(**{field: row[field] for field in Invoice.__dataclass_fields__})
            if row
            else None
        )

    def settle(self, invoice_id: str) -> Invoice:
        self.ensure_schema()
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                "SELECT * FROM billing_invoices WHERE id = ?", (invoice_id,)
            ).fetchone()
            if row is None:
                raise ValueError("billing_invoice_not_found")
            invoice = Invoice(**{field: row[field] for field in Invoice.__dataclass_fields__})
            if invoice.state == "paid":
                connection.execute("COMMIT")
                return invoice
            self._credits.grant_credits_in_transaction(
                connection,
                user_id=invoice.user_id,
                quantity=invoice.credits,
                reason=f"Lava payment ({invoice.pack_id})",
                correlation_id=f"lava-{invoice.id}",
            )
            if invoice.plan_id is not None:
                plan_id = invoice.plan_id
                now = int(time.time())
                existing = connection.execute(
                    "SELECT MAX(expires_at) AS expires_at FROM billing_plan_periods "
                    "WHERE user_id = ?",
                    (invoice.user_id,),
                ).fetchone()
                starts = max(now, existing["expires_at"] or now)
                connection.execute(
                    "INSERT INTO billing_plan_periods VALUES (?, ?, ?, ?, ?)",
                    (
                        invoice.id,
                        invoice.user_id,
                        plan_id,
                        starts,
                        starts + invoice.duration_days * 86400,
                    ),
                )
            connection.execute(
                "UPDATE billing_invoices SET state = 'paid' WHERE id = ?", (invoice.id,)
            )
            connection.execute("COMMIT")
        return Invoice(
            invoice.id,
            invoice.user_id,
            invoice.pack_id,
            invoice.amount_minor,
            invoice.credits,
            invoice.offer_id,
            "paid",
            invoice.currency,
            invoice.plan_id,
            invoice.duration_days,
        )
