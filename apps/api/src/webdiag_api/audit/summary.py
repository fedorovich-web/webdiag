from __future__ import annotations

from collections import Counter

from webdiag_api.audit.models import AuditRun, AuditRunSummary, Priority, Severity

SEVERITY_ORDER: dict[Severity, int] = {
    Severity.INFO: 0,
    Severity.LOW: 1,
    Severity.MEDIUM: 2,
    Severity.HIGH: 3,
    Severity.CRITICAL: 4,
}

PRIORITY_ORDER: dict[Priority, int] = {
    Priority.P0: 0,
    Priority.P1: 1,
    Priority.P2: 2,
    Priority.P3: 3,
}


def summarize_audit_run(run: AuditRun) -> AuditRunSummary:
    checks_by_status = Counter(check.status.value for check in run.checks)
    issues_by_severity = Counter(issue.severity.value for issue in run.issues)
    issues_by_priority = Counter(issue.priority.value for issue in run.issues)

    highest_severity = (
        max((issue.severity for issue in run.issues), key=lambda item: SEVERITY_ORDER[item])
        if run.issues
        else None
    )
    top_priority = (
        min((issue.priority for issue in run.issues), key=lambda item: PRIORITY_ORDER[item])
        if run.issues
        else None
    )

    return AuditRunSummary(
        status=run.status,
        score=run.score,
        check_count=len(run.checks),
        issue_count=len(run.issues),
        checks_by_status=dict(sorted(checks_by_status.items())),
        issues_by_severity=dict(sorted(issues_by_severity.items())),
        issues_by_priority=dict(sorted(issues_by_priority.items())),
        highest_severity=highest_severity,
        top_priority=top_priority,
    )
