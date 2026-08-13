from __future__ import annotations

import time
from collections import defaultdict

from webdiag_api.accounts.monitoring_storage import SqliteMonitoringStore
from webdiag_api.accounts.overview_models import (
    AccountOverviewProject,
    AccountOverviewResponse,
)
from webdiag_api.accounts.report_storage import SqliteReportStore, StoredReport
from webdiag_api.accounts.workspace_storage import SqliteWorkspaceStore


class AccountOverviewService:
    def __init__(
        self,
        *,
        workspace_store: SqliteWorkspaceStore,
        monitoring_store: SqliteMonitoringStore,
        report_store: SqliteReportStore,
    ) -> None:
        self._workspace = workspace_store
        self._monitoring = monitoring_store
        self._reports = report_store

    def get_overview(self, *, user_id: str) -> AccountOverviewResponse:
        projects = self._workspace.list_projects(user_id=user_id)
        audits = {
            audit.project_id: audit
            for audit in self._workspace.list_latest_audits(user_id=user_id)
        }
        monitors = {
            monitor.project_id: monitor
            for monitor in self._monitoring.list_monitors(user_id=user_id)
        }
        reports: dict[str, list[StoredReport]] = defaultdict(list)
        for report in self._reports.list_reports(user_id=user_id):
            reports[report.project_id].append(report)

        now = int(time.time())
        items: list[AccountOverviewProject] = []
        for project in projects:
            project_reports = reports.get(project.id, [])
            report_summaries = tuple(report.summary(now=now) for report in project_reports)
            latest_report = max(
                (summary.created_at for summary in report_summaries),
                default=None,
            )
            latest_audit = audits.get(project.id)
            monitor = monitors.get(project.id)
            items.append(
                AccountOverviewProject(
                    project=project.public(),
                    latest_audit=latest_audit.summary() if latest_audit else None,
                    monitor=monitor.public() if monitor else None,
                    report_count=len(report_summaries),
                    shared_report_count=sum(
                        1 for summary in report_summaries if summary.shared
                    ),
                    latest_report_created_at=latest_report,
                )
            )
        return AccountOverviewResponse(projects=tuple(items))
