from __future__ import annotations

import sqlite3

import pytest

from webdiag_api.audit.admission import AuditAdmissionController, AuditAdmissionError
from webdiag_api.audit.storage import SqliteAuditStore


def controller(database: str, *, now: int, request_limit: int = 2, concurrency_limit: int = 1):
    return AuditAdmissionController(
        database,
        request_limit=request_limit,
        window_seconds=60,
        concurrency_limit=concurrency_limit,
        lease_seconds=45,
        clock=lambda: now,
    )


def test_persistent_window_budget_is_shared_across_controller_instances(tmp_path) -> None:
    database = str(tmp_path / "audits.sqlite3")
    first = controller(database, now=1_000)
    first_lease = first.acquire()
    first.release(first_lease)
    second = controller(database, now=1_010)
    second_lease = second.acquire()
    second.release(second_lease)

    try:
        controller(database, now=1_020).acquire()
    except AuditAdmissionError as error:
        assert error.status_code == 429
        assert error.code == "audit_rate_limited"
        assert error.retry_after == 40
    else:
        raise AssertionError("exhausted request budget was accepted")

    lease = controller(database, now=1_060).acquire()
    controller(database, now=1_060).release(lease)


def test_concurrency_lease_is_atomic_and_release_restores_capacity(tmp_path) -> None:
    database = str(tmp_path / "audits.sqlite3")
    first = controller(database, now=2_000)
    lease = first.acquire()

    try:
        controller(database, now=2_001).acquire()
    except AuditAdmissionError as error:
        assert error.status_code == 503
        assert error.code == "audit_capacity_unavailable"
        assert error.retry_after == 44
    else:
        raise AssertionError("concurrent audit capacity was exceeded")

    first.release(lease)
    replacement = controller(database, now=2_002).acquire()
    first.release(replacement)


def test_stale_lease_expires_after_worker_termination(tmp_path) -> None:
    database = str(tmp_path / "audits.sqlite3")
    lease = controller(database, now=3_000).acquire()
    assert lease

    replacement = controller(database, now=3_045).acquire()
    controller(database, now=3_045).release(replacement)


def test_admission_schema_coexists_with_audit_snapshot_schema(tmp_path) -> None:
    database = str(tmp_path / "audits.sqlite3")
    SqliteAuditStore(database).ensure_schema()
    lease = controller(database, now=4_000).acquire()
    controller(database, now=4_000).release(lease)
    SqliteAuditStore(database).ensure_schema()


def test_storage_failure_is_normalized_without_internal_details(tmp_path, monkeypatch) -> None:
    admission = controller(str(tmp_path / "audits.sqlite3"), now=5_000)

    def unavailable_connection():
        raise sqlite3.OperationalError("private database detail")

    monkeypatch.setattr(admission, "_connect", unavailable_connection)

    with pytest.raises(AuditAdmissionError) as caught:
        admission.acquire()

    assert caught.value.status_code == 503
    assert caught.value.code == "audit_capacity_unavailable"
    assert caught.value.message == "Public audit capacity is temporarily unavailable."
    assert caught.value.retry_after == 5
    assert "private database detail" not in str(caught.value)


def test_audit_lease_can_be_renewed_during_long_execution(tmp_path) -> None:
    database = str(tmp_path / "audits.sqlite3")
    first = controller(database, now=1_000)
    lease = first.acquire()

    # Advance time past half of lease; renew lease to extend expiration
    controller(database, now=1_030).renew(lease)

    # At t=1_050, the original 45s lease would have expired at 1_045,
    # but the renewed lease remains valid until 1_075
    second = controller(database, now=1_050)
    with pytest.raises(AuditAdmissionError) as caught:
        second.acquire()
    assert caught.value.status_code == 503
    assert caught.value.code == "audit_capacity_unavailable"
    assert caught.value.retry_after == 25  # 1_075 - 1_050

    # Once the first audit completes and releases its lease, capacity is restored
    controller(database, now=1_060).release(lease)
    replacement = second.acquire()
    second.release(replacement)


def test_hold_heartbeat_renews_active_lease_periodically(tmp_path) -> None:
    import time

    database = str(tmp_path / "audits.sqlite3")
    clock_time = 1_000

    def tick_clock() -> int:
        nonlocal clock_time
        clock_time += 10
        return clock_time

    adm = AuditAdmissionController(
        database,
        request_limit=10,
        window_seconds=60,
        concurrency_limit=1,
        lease_seconds=10,
        clock=tick_clock,
    )
    lease = adm.acquire()

    with adm._connect() as conn:
        row = conn.execute(
            "SELECT expires_at FROM audit_public_leases WHERE lease_id = ?", (lease,)
        ).fetchone()
        initial_expires_at = int(row["expires_at"])

    with adm.hold(lease, interval_seconds=0.02):
        time.sleep(0.06)

    with adm._connect() as conn:
        row = conn.execute(
            "SELECT expires_at FROM audit_public_leases WHERE lease_id = ?", (lease,)
        ).fetchone()
        updated_expires_at = int(row["expires_at"])

    assert updated_expires_at > initial_expires_at
    adm.release(lease)


def test_renew_lost_or_expired_lease_raises_admission_error(tmp_path) -> None:
    database = str(tmp_path / "audits.sqlite3")
    adm = controller(database, now=1_000)

    with pytest.raises(AuditAdmissionError) as caught:
        adm.renew("nonexistent-lease-id")
    assert caught.value.status_code == 503
    assert caught.value.code == "audit_capacity_unavailable"


def test_renew_storage_failure_is_normalized(tmp_path, monkeypatch) -> None:
    adm = controller(str(tmp_path / "audits.sqlite3"), now=5_000)

    def unavailable_connection():
        raise sqlite3.OperationalError("private database detail")

    monkeypatch.setattr(adm, "_connect", unavailable_connection)

    with pytest.raises(AuditAdmissionError) as caught:
        adm.renew("any-lease")

    assert caught.value.status_code == 503
    assert caught.value.code == "audit_capacity_unavailable"
    assert "private database detail" not in str(caught.value)
