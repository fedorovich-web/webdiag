from __future__ import annotations

import sqlite3
from collections.abc import Iterator
from contextlib import closing, contextmanager
from pathlib import Path

from webdiag_api.accounts.monitoring_storage import SqliteMonitoringStore
from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.ai.storage import SqliteAIStore
from webdiag_api.billing.storage import SqliteBillingStore

DAY = 86_400
NS = 1_000_000_000
PAGE_SIZE = 25

# Billing assigns non-overlapping periods. Keep the current period and extend it
# only through contiguous periods of the same plan, just as BillingStore.plan does.
PLAN_CTES = """
    active AS (
        SELECT user_id, plan_id, expires_at,
               ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY starts_at, invoice_id) AS priority
        FROM billing_plan_periods
        WHERE starts_at <= :now AND expires_at > :now {scope}
    ), chain(user_id, plan_id, expires_at) AS (
        SELECT user_id, plan_id, expires_at FROM active WHERE priority = 1
        UNION ALL
        SELECT next.user_id, next.plan_id, next.expires_at
        FROM chain
        JOIN billing_plan_periods AS next
          ON next.user_id = chain.user_id AND next.starts_at = chain.expires_at
         AND next.plan_id = chain.plan_id
    ), plans AS (
        SELECT user_id, plan_id, MAX(expires_at) AS expires_at
        FROM chain GROUP BY user_id, plan_id
    )
"""


def initialize_admin_schema(path: str) -> None:
    SqliteAccountStore(path).ensure_schema()
    SqliteBillingStore(path, SqliteAIStore(path)).ensure_schema()
    SqliteMonitoringStore(path).ensure_schema()


@contextmanager
def read_snapshot(path: str) -> Iterator[sqlite3.Connection]:
    uri = f"{Path(path).resolve().as_uri()}?mode=ro"
    # FastAPI runs the sync dependency and handler sequentially in its worker pool.
    with closing(
        sqlite3.connect(
            uri,
            uri=True,
            timeout=2,
            isolation_level=None,
            check_same_thread=False,
        )
    ) as db:
        db.row_factory = sqlite3.Row
        db.execute("BEGIN")
        yield db


class AdminReader:
    def __init__(self, db: sqlite3.Connection, now: int) -> None:
        self.db = db
        self.now = now

    def session_user_id(self, token_hash: str) -> str | None:
        row = self.db.execute(
            """
            SELECT u.id
            FROM account_sessions s JOIN account_users u ON u.id = s.user_id
            WHERE s.token_hash = ? AND s.expires_at > ?
              AND NOT EXISTS (SELECT 1 FROM account_access_blocks b WHERE b.user_id = u.id)
            """,
            (token_hash, self.now),
        ).fetchone()
        return row["id"] if row else None

    def overview(self, days: int) -> dict:
        now = self.now
        registrations = self.db.execute(
            """
            SELECT COUNT(*) AS total,
                COUNT(*) FILTER (WHERE created_at >= :start7 AND created_at < :now) AS new7,
                COUNT(*) FILTER (WHERE created_at >= :start30 AND created_at < :now) AS new30,
                COUNT(*) FILTER (WHERE created_at >= :start90 AND created_at < :now) AS new90
            FROM account_users
            """,
            {
                "now": now,
                "start7": now - 7 * DAY,
                "start30": now - 30 * DAY,
                "start90": now - 90 * DAY,
            },
        ).fetchone()
        access = self.db.execute(
            "WITH RECURSIVE "
            + PLAN_CTES.format(scope="")
            + """
            SELECT COUNT(*) FILTER (WHERE plan_id = 'pro') AS pro,
                   COUNT(*) FILTER (WHERE plan_id = 'team') AS team,
                   COUNT(*) FILTER (WHERE expires_at <= :soon) AS expiring
            FROM plans
            """,
            {"now": now, "soon": now + 7 * DAY},
        ).fetchone()
        payments = self.db.execute(
            """
            SELECT i.currency, COUNT(*) AS count, SUM(i.amount_minor) AS amount_minor
            FROM billing_payment_confirmations c JOIN billing_invoices i ON i.id = c.invoice_id
            WHERE i.state = 'paid' AND c.paid_at >= ? AND c.paid_at < ?
            GROUP BY i.currency ORDER BY i.currency
            """,
            (now - days * DAY, now),
        ).fetchall()
        unknown = self.db.execute(
            """
            SELECT COUNT(*) FROM billing_invoices i
            LEFT JOIN billing_payment_confirmations c ON c.invoice_id = i.id
            WHERE i.state = 'paid' AND c.invoice_id IS NULL
            """
        ).fetchone()[0]
        return {
            "as_of": now,
            "days": days,
            "users_total": registrations["total"],
            "registrations": {str(n): registrations[f"new{n}"] for n in (7, 30, 90)},
            "paid_access": {"pro": access["pro"], "team": access["team"]},
            "expiring_soon": access["expiring"],
            "payments": [dict(row) for row in payments],
            "payments_without_date": unknown,
            "available_credits": self.db.execute(
                "SELECT COALESCE(SUM(available), 0) FROM credit_accounts"
            ).fetchone()[0],
            "usage": self.usage(days),
        }

    def clients(
        self, *, page: int, email: str, segment: str, days: int | None, owner_id: str
    ) -> dict:
        now = self.now
        criteria = ["instr(u.email, :email) > 0"] if email else []
        params = {
            "email": email.strip().casefold(),
            "now": now,
            "soon": now + 7 * DAY,
            "start": now - days * DAY if days else None,
            "offset": (page - 1) * PAGE_SIZE,
            "limit": PAGE_SIZE + 1,
            "owner_id": owner_id,
        }
        if days:
            criteria.append("u.created_at >= :start AND u.created_at < :now")
        plan_filter = ""
        if segment in ("pro", "team"):
            plan_filter = "WHERE p.plan_id = :plan"
            params["plan"] = segment
        elif segment == "expiring":
            plan_filter = "WHERE p.expires_at <= :soon"

        where = f"WHERE {' AND '.join(criteria)}" if criteria else ""
        pagination = "ORDER BY u.created_at DESC, u.id DESC LIMIT :limit OFFSET :offset"
        # For account and registration lists, compute effective plans for the page only.
        candidate_order = "" if plan_filter else pagination
        result_order = pagination if plan_filter else "ORDER BY u.created_at DESC, u.id DESC"
        plan_ctes = PLAN_CTES.format(scope="AND user_id IN (SELECT id FROM candidates)")
        rows = self.db.execute(
            f"""
            WITH RECURSIVE candidates AS MATERIALIZED (
                SELECT u.id, u.email, u.created_at FROM account_users u
                {where} {candidate_order}
            ), {plan_ctes}
            SELECT u.id, u.email, u.created_at,
                   CASE WHEN b.user_id IS NULL THEN 'active' ELSE 'blocked' END AS status,
                   (u.id <> :owner_id) AS manageable,
                   COALESCE(p.plan_id, 'starter') AS plan, p.expires_at,
                   COALESCE(c.available, 0) AS available_credits
            FROM candidates u
            LEFT JOIN plans p ON p.user_id = u.id
            LEFT JOIN credit_accounts c ON c.user_id = u.id
            LEFT JOIN account_access_blocks b ON b.user_id = u.id
            {plan_filter}
            {result_order}
            """,
            params,
        ).fetchall()
        return self._page(rows, page)

    def payments(
        self,
        *,
        page: int,
        days: int | None,
        date_basis: str,
        state: str | None,
        currency: str | None,
        kind: str | None,
    ) -> dict:
        criteria = []
        params = {
            "now": self.now,
            "start": self.now - days * DAY if days else None,
            "offset": (page - 1) * PAGE_SIZE,
            "limit": PAGE_SIZE + 1,
        }
        order = "i.created_at"
        if date_basis == "paid":
            criteria.append("i.state = 'paid' AND c.invoice_id IS NOT NULL")
            order = "c.paid_at"
        elif date_basis == "unknown":
            criteria.append("i.state = 'paid' AND c.invoice_id IS NULL")
        if days and date_basis != "unknown":
            criteria.append(f"{order} >= :start AND {order} < :now")
        if state:
            criteria.append("i.state = :state")
            params["state"] = state
        if currency:
            criteria.append("i.currency = :currency")
            params["currency"] = currency
        if kind == "credits":
            criteria.append("i.plan_id IS NULL")
        elif kind in ("pro", "team"):
            criteria.append("i.plan_id = :plan")
            params["plan"] = kind

        where = f"WHERE {' AND '.join(criteria)}" if criteria else ""
        rows = self.db.execute(
            f"""
            SELECT i.id, i.pack_id, i.state, i.currency, i.amount_minor, i.plan_id,
                   i.duration_days, i.credits, i.created_at, c.paid_at
            FROM billing_invoices i LEFT JOIN billing_payment_confirmations c ON c.invoice_id = i.id
            {where}
            ORDER BY {order} DESC, i.id DESC
            LIMIT :limit OFFSET :offset
            """,
            params,
        ).fetchall()
        return self._page(rows, page)

    def usage(self, days: int) -> dict:
        now = self.now
        start = now - days * DAY
        ai = self.db.execute(
            """
            SELECT state, COUNT(*) AS count FROM ai_runs
            WHERE state IN ('pending', 'running', 'succeeded', 'failed',
                            'provider_unknown', 'deleted')
              AND created_at >= ? AND created_at < ? GROUP BY state
            """,
            (start * NS, now * NS),
        ).fetchall()
        saved = self.db.execute(
            """
            SELECT COUNT(*) FROM account_workspace_saved_audits
            WHERE created_at >= ? AND created_at < ?
            """,
            (start, now),
        ).fetchone()[0]
        monitoring = self.db.execute(
            """
            SELECT status, COUNT(*) AS count FROM account_workspace_monitor_runs
            WHERE completed_at >= ? AND completed_at < ? GROUP BY status
            """,
            (start, now),
        ).fetchall()
        return {
            "as_of": now,
            "days": days,
            "ai": {row["state"]: row["count"] for row in ai},
            "saved_audits": saved,
            "monitoring": {row["status"]: row["count"] for row in monitoring},
        }

    @staticmethod
    def _page(rows: list[sqlite3.Row], page: int) -> dict:
        return {
            "items": [dict(row) for row in rows[:PAGE_SIZE]],
            "page": page,
            "has_next": len(rows) > PAGE_SIZE,
        }
