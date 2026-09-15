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
