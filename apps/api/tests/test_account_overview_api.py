from __future__ import annotations

import time
from datetime import UTC, datetime, timedelta
from pathlib import Path

from webdiag_api.accounts.models import RegisterRequest
from webdiag_api.accounts.monitoring_storage import SqliteMonitoringStore
from webdiag_api.accounts.overview_service import AccountOverviewService
from webdiag_api.accounts.report_models import ReportSnapshot
from webdiag_api.accounts.report_storage import SqliteReportStore
from webdiag_api.accounts.security import ScryptParameters
from webdiag_api.accounts.service import AccountService
from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.accounts.workspace_models import SavedAuditPayload
from webdiag_api.accounts.workspace_storage import SqliteWorkspaceStore


def _register(database: Path, email: str) -> str:
    service = AccountService(
        SqliteAccountStore(str(database)),
        session_ttl_seconds=3_600,
        active_session_limit=10,
        scrypt_parameters=ScryptParameters(n=2**12),
    )
    result = service.register(
        RegisterRequest(
            email=email,
            display_name="Overview User",
            password="correct horse battery staple",
        )
    )
    return result.response.user.id


def _audit_payload(*, completed_at: datetime, score: int) -> SavedAuditPayload:
    return SavedAuditPayload(
        target_origin="https://example.com",
        status="succeeded",
        score=score,
        checks=(),
        issues=(),
        completed_at=completed_at,
    )


def _report_snapshot(
    *, project_name: str, origin: str, completed_at: datetime, score: int
) -> ReportSnapshot:
    return ReportSnapshot(
        title=f"Report for {project_name}",
        locale="en",
        project_name=project_name,
        target_origin=origin,
        audit_completed_at=completed_at,
        score=score,
        checks=(),
        issues=(),
        generated_at=datetime.now(UTC),
    )


def test_workspace_store_lists_only_latest_owned_audit_per_project(tmp_path: Path) -> None:
    database = tmp_path / "overview.sqlite3"
    owner_id = _register(database, "owner@example.com")
    foreign_id = _register(database, "foreign@example.com")
    workspace = SqliteWorkspaceStore(str(database))
    first = workspace.create_project(
        user_id=owner_id,
        name="First",
        origin="https://example.com",
    )
    second = workspace.create_project(
        user_id=owner_id,
        name="Second",
        origin="https://second.example.com",
    )
    foreign = workspace.create_project(
        user_id=foreign_id,
        name="Foreign",
        origin="https://foreign.example.com",
    )
    older_time = datetime(2026, 8, 12, 10, tzinfo=UTC)
    latest_time = older_time + timedelta(hours=1)
    older = workspace.save_audit(
        user_id=owner_id,
        project_id=first.id,
        payload=_audit_payload(completed_at=older_time, score=72),
    )
    latest = workspace.save_audit(
        user_id=owner_id,
        project_id=first.id,
        payload=_audit_payload(completed_at=latest_time, score=91),
    )
    second_audit = workspace.save_audit(
        user_id=owner_id,
        project_id=second.id,
        payload=_audit_payload(completed_at=older_time, score=83),
    )
    workspace.save_audit(
        user_id=foreign_id,
        project_id=foreign.id,
        payload=_audit_payload(completed_at=latest_time, score=100),
    )

    result = workspace.list_latest_audits(user_id=owner_id)

    assert {audit.id for audit in result} == {latest.id, second_audit.id}
    assert older.id not in {audit.id for audit in result}
    assert all(audit.user_id == owner_id for audit in result)


def test_overview_is_owned_and_uses_only_persisted_state(tmp_path: Path) -> None:
    database = tmp_path / "overview.sqlite3"
    owner_id = _register(database, "owner@example.com")
    foreign_id = _register(database, "foreign@example.com")
    workspace = SqliteWorkspaceStore(str(database))
    monitoring = SqliteMonitoringStore(str(database))
    reports = SqliteReportStore(str(database))
    overview = AccountOverviewService(
        workspace_store=workspace,
        monitoring_store=monitoring,
        report_store=reports,
    )
    completed_at = datetime(2026, 8, 12, 10, tzinfo=UTC)

    owner_project = workspace.create_project(
        user_id=owner_id,
        name="Owner project",
        origin="https://example.com",
    )
    older = workspace.save_audit(
        user_id=owner_id,
        project_id=owner_project.id,
        payload=_audit_payload(completed_at=completed_at, score=70),
    )
    latest = workspace.save_audit(
        user_id=owner_id,
        project_id=owner_project.id,
        payload=_audit_payload(completed_at=completed_at + timedelta(hours=1), score=88),
    )
    monitor = monitoring.create_monitor(
        user_id=owner_id,
        project_id=owner_project.id,
        cadence="daily",
        timezone="Europe/Berlin",
    )
    report = reports.create_report(
        user_id=owner_id,
        project_id=owner_project.id,
        audit_id=latest.id,
        snapshot=_report_snapshot(
            project_name=owner_project.name,
            origin=owner_project.origin,
            completed_at=completed_at + timedelta(hours=1),
            score=88,
        ),
    )
    reports.set_share(
        user_id=owner_id,
        report_id=report.id,
        token_hash="a" * 64,
        expires_at=int(time.time()) + 86_400,
    )

    foreign_project = workspace.create_project(
        user_id=foreign_id,
        name="Foreign project",
        origin="https://foreign.example.com",
    )
    foreign_audit = workspace.save_audit(
        user_id=foreign_id,
        project_id=foreign_project.id,
        payload=_audit_payload(completed_at=completed_at, score=100),
    )
    monitoring.create_monitor(
        user_id=foreign_id,
        project_id=foreign_project.id,
        cadence="hourly",
        timezone="UTC",
    )
    reports.create_report(
        user_id=foreign_id,
        project_id=foreign_project.id,
        audit_id=foreign_audit.id,
        snapshot=_report_snapshot(
            project_name=foreign_project.name,
            origin=foreign_project.origin,
            completed_at=completed_at,
            score=100,
        ),
    )

    result = overview.get_overview(user_id=owner_id)

    assert result.contract_version == "webdiag.account.overview.v1"
    assert len(result.projects) == 1
    item = result.projects[0]
    assert item.project.id == owner_project.id
    assert item.latest_audit is not None
    assert item.latest_audit.id == latest.id
    assert item.latest_audit.id != older.id
    assert item.monitor is not None
    assert item.monitor.id == monitor.id
    assert item.report_count == 1
    assert item.shared_report_count == 1
    assert item.latest_report_created_at == report.summary().created_at
