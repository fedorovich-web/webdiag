from __future__ import annotations

import time

from webdiag_api.accounts.monitoring_change import compare_payloads
from webdiag_api.accounts.monitoring_models import (
    AccountMonitor,
    MonitorCreateRequest,
    MonitorHistoryResponse,
    MonitorListResponse,
    MonitorRunResponse,
    MonitorUpdateRequest,
)
from webdiag_api.accounts.monitoring_storage import (
    MonitorLeaseLostError,
    SqliteMonitoringStore,
    StoredMonitor,
)
from webdiag_api.accounts.workspace_service import build_saved_audit_payload
from webdiag_api.accounts.workspace_storage import SqliteWorkspaceStore
from webdiag_api.audit.service import AuditExecutionError, AuditExecutionService


class MonitoringServiceError(RuntimeError):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


class MonitoringService:
    def __init__(
        self,
        store: SqliteMonitoringStore,
        *,
        workspace_store: SqliteWorkspaceStore,
        audit_service: AuditExecutionService,
    ) -> None:
        self._store = store
        self._workspace_store = workspace_store
        self._audit_service = audit_service

    def create_monitor(
        self,
        *,
        user_id: str,
        project_id: str,
        request: MonitorCreateRequest,
    ) -> AccountMonitor:
        self._owned_project(user_id=user_id, project_id=project_id)
        try:
            return self._store.create_monitor(
                user_id=user_id,
                project_id=project_id,
                cadence=request.cadence,
                timezone=request.timezone,
            ).public()
        except ValueError as error:
            if str(error) == "account_monitor_exists":
                raise MonitoringServiceError(
                    409, "account_monitor_exists", "Monitoring is already configured."
                ) from error
            raise

    def list_monitors(self, *, user_id: str) -> MonitorListResponse:
        return MonitorListResponse(
            monitors=tuple(item.public() for item in self._store.list_monitors(user_id=user_id))
        )

    def get_monitor(self, *, user_id: str, project_id: str) -> AccountMonitor:
        return self._owned_monitor(user_id=user_id, project_id=project_id).public()

    def update_monitor(
        self,
        *,
        user_id: str,
        project_id: str,
        request: MonitorUpdateRequest,
    ) -> AccountMonitor:
        self._owned_monitor(user_id=user_id, project_id=project_id)
        updated = self._store.update_monitor(
            user_id=user_id,
            project_id=project_id,
            cadence=request.cadence,
            timezone=request.timezone,
            enabled=request.enabled,
        )
        if updated is None:
            raise MonitoringServiceError(404, "account_monitor_not_found", "Monitor not found.")
        return updated.public()

    def run_monitor(self, *, user_id: str, project_id: str) -> MonitorRunResponse:
        self._owned_monitor(user_id=user_id, project_id=project_id)
        project = self._owned_project(user_id=user_id, project_id=project_id)
        monitor = self._store.claim_manual(user_id=user_id, project_id=project_id)
        if monitor is None:
            raise MonitoringServiceError(
                409,
                "account_monitor_already_running",
                "A monitoring run is already in progress.",
            )
        try:
            return self._execute(monitor, origin=project.origin)
        except MonitorLeaseLostError as error:
            raise MonitoringServiceError(
                409,
                "account_monitor_run_lease_lost",
                "The monitoring run no longer owns its execution lease.",
            ) from error

    def get_history(self, *, user_id: str, project_id: str) -> MonitorHistoryResponse:
        monitor = self._owned_monitor(user_id=user_id, project_id=project_id)
        runs = self._store.list_runs(user_id=user_id, monitor_id=monitor.id)
        return MonitorHistoryResponse(
            monitor=monitor.public(),
            runs=tuple(run.public() for run in runs),
        )

    def run_due(self, *, limit: int = 20) -> int:
        completed = 0
        for _ in range(max(1, min(limit, 20))):
            monitor = self._store.claim_due()
            if monitor is None:
                break
            project = self._workspace_store.get_project(
                user_id=monitor.user_id,
                project_id=monitor.project_id,
            )
            try:
                if project is None:
                    self._record_failure(monitor, "account_project_not_found")
                else:
                    self._execute(monitor, origin=project.origin)
            except MonitorLeaseLostError:
                pass
            completed += 1
        return completed

    def _execute(self, monitor: StoredMonitor, *, origin: str) -> MonitorRunResponse:
        started_at = int(time.time())
        previous = self._store.latest_successful_payload(
            user_id=monitor.user_id,
            monitor_id=monitor.id,
        )
        try:
            snapshot = self._audit_service.start_single_url_audit(origin)
            if snapshot.run is None:
                raise AuditExecutionError(
                    "Audit did not produce a run.",
                    job_id=snapshot.job.job_id,
                )
            payload = build_saved_audit_payload(snapshot.run, target_origin=origin)
        except Exception as error:
            run = self._record_failure(monitor, type(error).__name__)
            return MonitorRunResponse(run=run.public())
        completed_at = int(time.time())
        change = compare_payloads(previous, payload)
        status = "changed" if change.kind == "changed" else "passed"
        run = self._store.save_run(
            monitor=monitor,
            status=status,
            score=payload.score,
            issue_count=len(payload.issues),
            started_at=started_at,
            completed_at=completed_at,
            change=change,
            payload=payload,
        )
        return MonitorRunResponse(run=run.public())

    def _record_failure(self, monitor: StoredMonitor, error_code: str):
        now = int(time.time())
        return self._store.save_run(
            monitor=monitor,
            status="failed",
            score=None,
            issue_count=0,
            started_at=now,
            completed_at=now,
            change=compare_payloads(None, None, failed=True),
            payload=None,
            error_code=error_code[:120],
        )

    def _owned_project(self, *, user_id: str, project_id: str):
        project = self._workspace_store.get_project(user_id=user_id, project_id=project_id)
        if project is None:
            raise MonitoringServiceError(404, "account_project_not_found", "Project not found.")
        return project

    def _owned_monitor(self, *, user_id: str, project_id: str) -> StoredMonitor:
        monitor = self._store.get_monitor(user_id=user_id, project_id=project_id)
        if monitor is None:
            raise MonitoringServiceError(404, "account_monitor_not_found", "Monitor not found.")
        return monitor
