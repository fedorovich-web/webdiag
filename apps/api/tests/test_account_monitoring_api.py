import asyncio
import threading
import time
from dataclasses import replace
from datetime import UTC, datetime
from pathlib import Path

import httpx
import pytest
from pydantic import ValidationError

from webdiag_api.accounts.api import get_account_service
from webdiag_api.accounts.models import RegisterRequest
from webdiag_api.accounts.monitoring_api import get_monitoring_service
from webdiag_api.accounts.monitoring_models import (
    MonitorChange,
    MonitorCreateRequest,
    MonitorUpdateRequest,
)
from webdiag_api.accounts.monitoring_service import MonitoringService, MonitoringServiceError
from webdiag_api.accounts.monitoring_storage import SqliteMonitoringStore, StoredMonitor
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


class OverlapAuditService(StubAuditService):
    def __init__(self) -> None:
        super().__init__()
        self.calls = 0
        self.first_started = threading.Event()
        self.release_first = threading.Event()
        self._calls_lock = threading.Lock()

    def start_single_url_audit(self, origin: str) -> AuditSnapshot:
        with self._calls_lock:
            self.calls += 1
            call_number = self.calls
        if call_number == 1:
            self.first_started.set()
            if not self.release_first.wait(timeout=10):
                raise TimeoutError("The first monitoring audit was not released by the test.")
        return super().start_single_url_audit(origin)


class BlockingFailedAuditService(StubAuditService):
    def __init__(self) -> None:
        super().__init__()
        self.started = threading.Event()
        self.release = threading.Event()

    def start_single_url_audit(self, origin: str) -> AuditSnapshot:
        self.started.set()
        if not self.release.wait(timeout=10):
            raise TimeoutError("The failed monitoring audit was not released by the test.")
        raise RuntimeError("audit failed")


class FailedAuditService(StubAuditService):
    def start_single_url_audit(self, origin: str) -> AuditSnapshot:
        raise RuntimeError("audit failed")


def build_services(database_path: Path, *, audit_service: StubAuditService | None = None):
    account = AccountService(
        SqliteAccountStore(str(database_path)),
        session_ttl_seconds=3600,
        active_session_limit=10,
        scrypt_parameters=ScryptParameters(n=2**12),
    )
    audit = audit_service or StubAuditService()
    workspace_store = SqliteWorkspaceStore(str(database_path))
    workspace = WorkspaceService(workspace_store, audit_service=audit)
    monitoring = MonitoringService(
        SqliteMonitoringStore(str(database_path)),
        workspace_store=workspace_store,
        audit_service=audit,
    )
    return account, workspace, monitoring, audit


def create_stored_monitor(
    database: Path,
) -> tuple[str, str, MonitoringService, SqliteMonitoringStore, StubAuditService]:
    account, workspace, monitoring, audit = build_services(database)
    user_id, _ = register(account)
    project = workspace.create_project(
        user_id=user_id,
        request=ProjectCreateRequest(name="Main", origin="https://example.com"),
    )
    monitoring.create_monitor(
        user_id=user_id,
        project_id=project.id,
        request=MonitorCreateRequest(cadence="daily", timezone="UTC"),
    )
    store = SqliteMonitoringStore(str(database))
    monitor = store.get_monitor(user_id=user_id, project_id=project.id)
    assert monitor is not None
    return user_id, project.id, monitoring, store, audit


def save_passed_run(store: SqliteMonitoringStore, monitor: StoredMonitor):
    now = int(time.time())
    return store.save_run(
        monitor=monitor,
        status="passed",
        score=90,
        issue_count=0,
        started_at=now,
        completed_at=now,
        change=MonitorChange(kind="baseline", current_score=90, current_issue_count=0),
        payload=None,
    )


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


def test_claimed_run_requires_the_current_lease_token(tmp_path: Path) -> None:
    database = tmp_path / "accounts.sqlite3"
    user_id, project_id, _, store, _ = create_stored_monitor(database)
    pending = store.get_monitor(user_id=user_id, project_id=project_id)
    assert pending is not None
    assert pending.next_run_at is not None
    claimed = store.claim_due(now=pending.next_run_at)
    assert claimed is not None
    assert claimed.lease_token is not None

    stale = replace(claimed, lease_token="not-the-current-token")
    with pytest.raises(RuntimeError, match="account_monitor_lease_lost"):
        save_passed_run(store, stale)

    assert store.list_runs(user_id=user_id, monitor_id=claimed.id) == ()
    current = store.get_monitor(user_id=user_id, project_id=project_id)
    assert current is not None
    assert current.status == "running"
    assert current.lease_token == claimed.lease_token

    completed = save_passed_run(store, claimed)
    assert completed.status == "passed"
    assert len(store.list_runs(user_id=user_id, monitor_id=claimed.id)) == 1


def test_reclaimed_lease_rejects_the_old_claimant_without_mutation(tmp_path: Path) -> None:
    database = tmp_path / "accounts.sqlite3"
    user_id, project_id, _, store, _ = create_stored_monitor(database)
    pending = store.get_monitor(user_id=user_id, project_id=project_id)
    assert pending is not None
    assert pending.next_run_at is not None
    first_claim = store.claim_due(now=pending.next_run_at)
    assert first_claim is not None
    assert first_claim.lease_expires_at is not None
    second_claim = store.claim_due(now=first_claim.lease_expires_at)
    assert second_claim is not None
    assert second_claim.lease_token != first_claim.lease_token

    before = store.get_monitor(user_id=user_id, project_id=project_id)
    assert before is not None
    with pytest.raises(RuntimeError, match="account_monitor_lease_lost"):
        save_passed_run(store, first_claim)

    after = store.get_monitor(user_id=user_id, project_id=project_id)
    assert after == before
    assert store.list_runs(user_id=user_id, monitor_id=first_claim.id) == ()


def test_current_token_cannot_complete_after_its_lease_expires(tmp_path: Path) -> None:
    database = tmp_path / "accounts.sqlite3"
    user_id, project_id, _, store, _ = create_stored_monitor(database)
    claimed = store.claim_manual(
        user_id=user_id,
        project_id=project_id,
        now=int(time.time()) - 901,
    )
    assert claimed is not None
    assert claimed.lease_token is not None

    before = store.get_monitor(user_id=user_id, project_id=project_id)
    assert before is not None
    with pytest.raises(RuntimeError, match="account_monitor_lease_lost"):
        save_passed_run(store, claimed)

    assert store.get_monitor(user_id=user_id, project_id=project_id) == before
    assert store.list_runs(user_id=user_id, monitor_id=claimed.id) == ()


def test_pause_invalidates_claim_and_stale_completion_cannot_reschedule(
    tmp_path: Path,
) -> None:
    database = tmp_path / "accounts.sqlite3"
    user_id, project_id, _, store, _ = create_stored_monitor(database)
    pending = store.get_monitor(user_id=user_id, project_id=project_id)
    assert pending is not None
    assert pending.next_run_at is not None
    claimed = store.claim_due(now=pending.next_run_at)
    assert claimed is not None

    paused = store.update_monitor(
        user_id=user_id,
        project_id=project_id,
        cadence=None,
        timezone=None,
        enabled=False,
    )
    assert paused is not None
    assert paused.enabled is False
    assert paused.next_run_at is None
    assert paused.lease_token is None

    with pytest.raises(RuntimeError, match="account_monitor_lease_lost"):
        save_passed_run(store, claimed)

    after = store.get_monitor(user_id=user_id, project_id=project_id)
    assert after == paused
    assert store.list_runs(user_id=user_id, monitor_id=claimed.id) == ()


def test_overlapping_manual_run_is_rejected_before_a_second_audit(tmp_path: Path) -> None:
    database = tmp_path / "accounts.sqlite3"
    audit = OverlapAuditService()
    account, workspace, monitoring, _ = build_services(database, audit_service=audit)
    user_id, _ = register(account)
    project = workspace.create_project(
        user_id=user_id,
        request=ProjectCreateRequest(name="Main", origin="https://example.com"),
    )
    monitoring.create_monitor(
        user_id=user_id,
        project_id=project.id,
        request=MonitorCreateRequest(cadence="daily", timezone="UTC"),
    )
    first_results: list[object] = []
    first_errors: list[BaseException] = []

    def run_first() -> None:
        try:
            first_results.append(
                monitoring.run_monitor(user_id=user_id, project_id=project.id)
            )
        except BaseException as error:
            first_errors.append(error)

    first = threading.Thread(target=run_first)
    first.start()
    try:
        assert audit.first_started.wait(timeout=5)
        with pytest.raises(MonitoringServiceError) as caught:
            monitoring.run_monitor(user_id=user_id, project_id=project.id)
        error = caught.value
        assert error.status_code == 409
        assert error.code == "account_monitor_already_running"
        assert audit.calls == 1
    finally:
        audit.release_first.set()
        first.join(timeout=10)

    assert not first.is_alive()
    assert first_errors == []
    assert len(first_results) == 1
    history = monitoring.get_history(user_id=user_id, project_id=project.id)
    assert len(history.runs) == 1


def test_failed_audit_cannot_create_a_fake_run_after_pause(tmp_path: Path) -> None:
    database = tmp_path / "accounts.sqlite3"
    audit = BlockingFailedAuditService()
    account, workspace, monitoring, _ = build_services(database, audit_service=audit)
    user_id, _ = register(account)
    project = workspace.create_project(
        user_id=user_id,
        request=ProjectCreateRequest(name="Main", origin="https://example.com"),
    )
    monitoring.create_monitor(
        user_id=user_id,
        project_id=project.id,
        request=MonitorCreateRequest(cadence="daily", timezone="UTC"),
    )
    execution_errors: list[BaseException] = []

    def run_failed_audit() -> None:
        try:
            monitoring.run_monitor(user_id=user_id, project_id=project.id)
        except BaseException as error:
            execution_errors.append(error)

    execution = threading.Thread(target=run_failed_audit)
    execution.start()
    try:
        assert audit.started.wait(timeout=5)
        paused = monitoring.update_monitor(
            user_id=user_id,
            project_id=project.id,
            request=MonitorUpdateRequest(enabled=False),
        )
        assert paused.enabled is False
    finally:
        audit.release.set()
        execution.join(timeout=10)

    assert not execution.is_alive()
    assert len(execution_errors) == 1
    error = execution_errors[0]
    assert isinstance(error, MonitoringServiceError)
    assert error.code == "account_monitor_run_lease_lost"
    history = monitoring.get_history(user_id=user_id, project_id=project.id)
    assert history.monitor.enabled is False
    assert history.monitor.next_run_at is None
    assert history.runs == ()


def test_non_disabling_update_invalidates_running_lease_without_phantom_state(
    tmp_path: Path,
) -> None:
    database = tmp_path / "accounts.sqlite3"
    audit = OverlapAuditService()
    account, workspace, monitoring, _ = build_services(database, audit_service=audit)
    user_id, _ = register(account)
    project = workspace.create_project(
        user_id=user_id,
        request=ProjectCreateRequest(name="Main", origin="https://example.com"),
    )
    monitoring.create_monitor(
        user_id=user_id,
        project_id=project.id,
        request=MonitorCreateRequest(cadence="daily", timezone="UTC"),
    )
    execution_errors: list[BaseException] = []

    def run_audit() -> None:
        try:
            monitoring.run_monitor(user_id=user_id, project_id=project.id)
        except BaseException as error:
            execution_errors.append(error)

    execution = threading.Thread(target=run_audit)
    execution.start()
    try:
        assert audit.first_started.wait(timeout=5)
        updated = monitoring.update_monitor(
            user_id=user_id,
            project_id=project.id,
            request=MonitorUpdateRequest(cadence="hourly", timezone="Europe/Berlin"),
        )
        assert updated.enabled is True
        assert updated.status == "pending"
        assert updated.cadence == "hourly"
        assert updated.timezone == "Europe/Berlin"
    finally:
        audit.release_first.set()
        execution.join(timeout=10)

    assert not execution.is_alive()
    assert len(execution_errors) == 1
    error = execution_errors[0]
    assert isinstance(error, MonitoringServiceError)
    assert error.code == "account_monitor_run_lease_lost"
    history = monitoring.get_history(user_id=user_id, project_id=project.id)
    assert history.monitor.status == "pending"
    assert history.monitor.cadence == "hourly"
    assert history.monitor.timezone == "Europe/Berlin"
    assert history.runs == ()


def test_failed_manual_audit_completes_through_its_claimed_lease(tmp_path: Path) -> None:
    database = tmp_path / "accounts.sqlite3"
    audit = FailedAuditService()
    account, workspace, monitoring, _ = build_services(database, audit_service=audit)
    user_id, _ = register(account)
    project = workspace.create_project(
        user_id=user_id,
        request=ProjectCreateRequest(name="Main", origin="https://example.com"),
    )
    monitoring.create_monitor(
        user_id=user_id,
        project_id=project.id,
        request=MonitorCreateRequest(cadence="daily", timezone="UTC"),
    )

    result = monitoring.run_monitor(user_id=user_id, project_id=project.id)

    assert result.run.status == "failed"
    assert result.run.error_code == "RuntimeError"
    history = monitoring.get_history(user_id=user_id, project_id=project.id)
    assert len(history.runs) == 1
    assert history.runs[0].status == "failed"
    assert history.monitor.status == "failed"
    assert history.monitor.consecutive_failures == 1
    assert history.monitor.next_run_at is not None


def test_manual_run_preserves_an_already_disabled_monitor(tmp_path: Path) -> None:
    database = tmp_path / "accounts.sqlite3"
    user_id, project_id, monitoring, _, _ = create_stored_monitor(database)
    paused = monitoring.update_monitor(
        user_id=user_id,
        project_id=project_id,
        request=MonitorUpdateRequest(enabled=False),
    )
    assert paused.enabled is False

    result = monitoring.run_monitor(user_id=user_id, project_id=project_id)

    assert result.run.status == "passed"
    history = monitoring.get_history(user_id=user_id, project_id=project_id)
    assert history.monitor.enabled is False
    assert history.monitor.next_run_at is None
    assert len(history.runs) == 1


def test_monitor_timezone_requires_an_available_iana_zone() -> None:
    assert MonitorCreateRequest(timezone="UTC").timezone == "UTC"
    assert MonitorCreateRequest(timezone="Europe/Berlin").timezone == "Europe/Berlin"
    assert MonitorUpdateRequest(timezone="Europe/Berlin").timezone == "Europe/Berlin"

    with pytest.raises(ValidationError):
        MonitorCreateRequest(timezone="Europe/Not_A_Zone")
    with pytest.raises(ValidationError):
        MonitorUpdateRequest(timezone="Europe/Not_A_Zone")
