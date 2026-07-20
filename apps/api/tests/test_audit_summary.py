from uuid import UUID

from webdiag_api.audit.models import (
    AffectedUrl,
    AuditCheck,
    AuditIssue,
    AuditRun,
    AuditTarget,
    CheckStatus,
    Evidence,
    EvidenceKind,
    IssueCategory,
    Priority,
    Recommendation,
    Severity,
)
from webdiag_api.audit.summary import summarize_audit_run


def test_summarize_audit_run_counts_checks_and_issues() -> None:
    target = AuditTarget(
        original_url="https://example.com",
        normalized_url="https://example.com/",
        hostname="example.com",
    )
    evidence = Evidence(kind=EvidenceKind.SYSTEM, source="http.status_code", value="500")
    affected_url = AffectedUrl(
        url="https://example.com/",
        normalized_url="https://example.com/",
        status_code=500,
    )
    issue = AuditIssue(
        issue_id="http.status.server_error",
        check_id="http.status",
        category=IssueCategory.HTTP,
        severity=Severity.CRITICAL,
        priority=Priority.P0,
        title="Server error response",
        description="The audited URL returned a 5xx HTTP status code.",
        affected_urls=(affected_url,),
        evidence=(evidence,),
        recommendation=Recommendation(summary="Fix the server error."),
    )
    run = AuditRun(
        job_id=UUID(int=1),
        target=target,
        checks=(
            AuditCheck(
                check_id="http.status",
                name="HTTP status",
                category=IssueCategory.HTTP,
                status=CheckStatus.WARNING,
                issue_ids=(issue.issue_id,),
            ),
            AuditCheck(
                check_id="metadata.title",
                name="Title tag",
                category=IssueCategory.METADATA,
                status=CheckStatus.PASSED,
            ),
        ),
        issues=(issue,),
        score=72,
    )

    summary = summarize_audit_run(run)

    assert summary.score == 72
    assert summary.check_count == 2
    assert summary.issue_count == 1
    assert summary.checks_by_status == {"passed": 1, "warning": 1}
    assert summary.issues_by_severity == {"critical": 1}
    assert summary.issues_by_priority == {"p0": 1}
    assert summary.highest_severity is Severity.CRITICAL
    assert summary.top_priority is Priority.P0
