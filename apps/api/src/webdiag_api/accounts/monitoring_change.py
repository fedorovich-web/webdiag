from __future__ import annotations

import hashlib
import json

from webdiag_api.accounts.monitoring_models import MonitorChange
from webdiag_api.accounts.workspace_models import SavedAuditPayload


def payload_fingerprint(payload: SavedAuditPayload) -> str:
    projection = {
        "score": payload.score,
        "checks": sorted(
            (check.check_id, check.status, check.category) for check in payload.checks
        ),
        "issues": sorted(
            (
                issue.issue_id,
                issue.severity,
                issue.priority,
                tuple(sorted(issue.affected_urls)),
            )
            for issue in payload.issues
        ),
    }
    encoded = json.dumps(projection, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(encoded).hexdigest()


def compare_payloads(
    previous: SavedAuditPayload | None,
    current: SavedAuditPayload | None,
    *,
    failed: bool = False,
) -> MonitorChange:
    if failed or current is None:
        return MonitorChange(kind="failed")
    current_ids = {issue.issue_id for issue in current.issues}
    if previous is None:
        return MonitorChange(
            kind="baseline",
            current_score=current.score,
            current_issue_count=len(current.issues),
            added_issue_ids=tuple(sorted(current_ids)),
        )
    previous_ids = {issue.issue_id for issue in previous.issues}
    changed = payload_fingerprint(previous) != payload_fingerprint(current)
    return MonitorChange(
        kind="changed" if changed else "unchanged",
        previous_score=previous.score,
        current_score=current.score,
        score_delta=(
            current.score - previous.score
            if current.score is not None and previous.score is not None
            else None
        ),
        previous_issue_count=len(previous.issues),
        current_issue_count=len(current.issues),
        added_issue_ids=tuple(sorted(current_ids - previous_ids)),
        resolved_issue_ids=tuple(sorted(previous_ids - current_ids)),
    )
