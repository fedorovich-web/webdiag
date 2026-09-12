import asyncio
from datetime import UTC, datetime
from pathlib import Path

import httpx

from webdiag_api.accounts.api import get_account_service
from webdiag_api.accounts.models import RegisterRequest
from webdiag_api.accounts.monitoring_api import get_monitoring_service
from webdiag_api.accounts.monitoring_models import MonitorCreateRequest
from webdiag_api.accounts.monitoring_service import MonitoringService
from webdiag_api.accounts.monitoring_storage import SqliteMonitoringStore
from webdiag_api.accounts.security import ScryptParameters
from webdiag_api.accounts.service import AccountService
from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.accounts.workspace_api import get_workspace_service
from webdiag_api.accounts.workspace_models import ProjectCreateRequest
from webdiag_api.accounts.workspace_service import WorkspaceService
from webdiag_api.accounts.workspace_storage import SqliteWorkspaceStore
from webdiag_api.audit.models import AuditJob, AuditJobStatus, AuditRun, AuditTarget
from webdiag_api.audit.service import AuditSnapshot
from webdiag_api.main import app


class StubAuditService:
    def __init__(self) -> None:
        self.score = 90

    def start_single_url_audit(self, origin: str) -> AuditSnapshot:
        target = AuditTarget(original_url=origin, normalized_url=origin, hostname="example.com")
        job = AuditJob(target=target, status=AuditJobStatus.SUCCEEDED)
        run = AuditRun(
            job_id=job.job_id,
            target=target,
            status=AuditJobStatus.SUCCEEDED,
            score=self.score,
            completed_at=datetime.now(UTC),
        )
        return AuditSnapshot(job=job, run=run)


def build_services(database_path: Path):
    account = AccountService(
        SqliteAccountStore(str(database_path)),
        session_ttl_seconds=3600,
        active_session_limit=10,
        scrypt_parameters=ScryptParameters(n=2**12),
    )
    audit = StubAuditService()
    workspace_store = SqliteWorkspaceStore(str(database_path))
    workspace = WorkspaceService(workspace_store, audit_service=audit)
    monitoring = MonitoringService(
        SqliteMonitoringStore(str(database_path)),
        workspace_store=workspace_store,
        audit_service=audit,
    )
    return account, workspace, monitoring, audit


def register(account: AccountService) -> tuple[str, str]:
    session = account.register(
        RegisterRequest(
            email="owner@example.com",
            display_name="Owner",
            password="correct horse battery staple",
        )
    )
    return session.response.user.id, session.token


async def request(method: str, path: str, *, cookie: str | None = None, json=None):
    headers = {"cookie": f"webdiag_session={cookie}"} if cookie else None
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.request(method, path, headers=headers, json=json)


def test_monitoring_service_baseline_same_changed_and_bounded_history(tmp_path: Path) -> None:
    database = tmp_path / "accounts.sqlite3"
    account, workspace, monitoring, audit = build_services(database)
    user_id, _ = register(account)
    project = workspace.create_project(
        user_id=user_id,
        request=ProjectCreateRequest(name="Main", origin="https://example.com"),
    )
    monitor = monitoring.create_monitor(
        user_id=user_id,
        project_id=project.id,
        request=MonitorCreateRequest(cadence="daily", timezone="Europe/Berlin"),
    )
    assert monitor.status == "pending"
    first = monitoring.run_monitor(user_id=user_id, project_id=project.id)
    assert first.run.status == "passed"
    assert first.run.change.kind == "baseline"
    second = monitoring.run_monitor(user_id=user_id, project_id=project.id)
    assert second.run.change.kind == "unchanged"
    audit.score = 75
    third = monitoring.run_monitor(user_id=user_id, project_id=project.id)
    assert third.run.status == "changed"
    assert third.run.change.kind == "changed"
    assert third.run.change.score_delta == -15
    history = monitoring.get_history(user_id=user_id, project_id=project.id)
    assert [run.status for run in history.runs[:3]] == ["changed", "passed", "passed"]
    assert len(history.runs) == 3


def test_monitoring_account_api_is_owned_and_no_store(tmp_path: Path) -> None:
    database = tmp_path / "accounts.sqlite3"
    account, workspace, monitoring, _ = build_services(database)
    _, token = register(account)
    project = workspace.create_project(
        user_id=account.get_session(token).user.id,
        request=ProjectCreateRequest(name="Main", origin="https://example.com"),
    )
    app.dependency_overrides[get_account_service] = lambda: account
    app.dependency_overrides[get_workspace_service] = lambda: workspace
    app.dependency_overrides[get_monitoring_service] = lambda: monitoring
    try:
        created = asyncio.run(request(
            "POST",
            f"/v1/account/projects/{project.id}/monitor",
            cookie=token,
            json={"cadence": "six_hours", "timezone": "Europe/Berlin"},
        ))
        assert created.status_code == 201
        assert created.headers["cache-control"] == "no-store"
        assert created.json()["contract_version"] == "webdiag.account.monitor.v1"

        run = asyncio.run(request(
            "POST",
            f"/v1/account/projects/{project.id}/monitor/run",
            cookie=token,
        ))
        assert run.status_code == 201
        assert run.json()["run"]["status"] == "passed"

        history = asyncio.run(request(
            "GET",
            f"/v1/account/projects/{project.id}/monitor/history",
            cookie=token,
        ))
        assert history.status_code == 200
        assert history.json()["contract_version"] == "webdiag.account.monitor_history.v1"
        assert len(history.json()["runs"]) == 1
    finally:
        app.dependency_overrides.clear()


def test_monitoring_configuration_and_notification_contract() -> None:
    from pydantic import ValidationError

    from webdiag_api.accounts.monitoring_models import MonitorChange, MonitorRun
    from webdiag_api.accounts.monitoring_notifications import notification_event
    from webdiag_api.config import Settings

    try:
        Settings(monitoring_internal_token="short")
    except ValidationError:
        pass
    else:
        raise AssertionError("Short internal monitoring tokens must be rejected")

    run = MonitorRun(
        id="run-1",
        monitor_id="monitor-1",
        project_id="project-1",
        status="changed",
        score=80,
        issue_count=1,
        started_at=datetime.now(UTC),
        completed_at=datetime.now(UTC),
        change=MonitorChange(kind="changed"),
    )
    event = notification_event(run)
    assert event is not None
    assert event.contract_version == "webdiag.monitor.notification_event.v1"
    serialized = event.model_dump()
    assert "provider" not in serialized
    assert "destination" not in serialized
