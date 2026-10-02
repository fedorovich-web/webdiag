from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict

from webdiag_api.accounts.monitoring_models import MonitorRun


class MonitorNotificationEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.monitor.notification_event.v1"] = (
        "webdiag.monitor.notification_event.v1"
    )
    project_id: str
    monitor_id: str
    run_id: str
    kind: Literal["changed", "failed"]


def notification_event(run: MonitorRun) -> MonitorNotificationEvent | None:
    if run.status not in {"changed", "failed"}:
        return None
    return MonitorNotificationEvent(
        project_id=run.project_id,
        monitor_id=run.monitor_id,
        run_id=run.id,
        kind=run.status,
    )
