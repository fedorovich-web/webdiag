from uuid import UUID

import pytest
from pydantic import ValidationError

from webdiag_api.audit.models import (
    AffectedUrl,
    AuditCheck,
    AuditIssue,
    AuditJob,
    AuditRun,
    AuditTarget,
    CheckStatus,
    Evidence,
    EvidenceKind,
    IssueCategory,
    Priority,
    Recommendation,
    Severity,
    ToolMapping,
)


def test_audit_domain_models_describe_a_minimal_report() -> None:
    target = AuditTarget(
        original_url="https://example.com",
        normalized_url="https://example.com/",
        hostname="example.com",
    )
    evidence = Evidence(
        kind=EvidenceKind.HTML_ELEMENT,
        source="head > title",
        value="Example Domain",
    )
    recommendation = Recommendation(
        summary="Rewrite the title so the page topic is specific.",
        steps=("Keep the title unique.", "Put the primary page topic first."),
        expected_impact="Clearer snippets and fewer duplicate metadata signals.",
    )
    affected_url = AffectedUrl(
        url="https://example.com/",
        normalized_url="https://example.com/",
        status_code=200,
    )
    mapping = ToolMapping(
        issue_category=IssueCategory.STRUCTURED_DATA,
        tool_category="development-data",
        tool_slug="json-formatter-validator",
        route_ru="/tools/json-formatter-validator",
        route_en="/en/tools/json-formatter-validator",
        ready=True,
        rationale="Validate collected JSON-LD evidence.",
    )
    issue = AuditIssue(
        issue_id="metadata.title.generic",
        category=IssueCategory.METADATA,
        severity=Severity.MEDIUM,
        priority=Priority.P1,
        title="Title is too generic",
        description="The page title does not describe the audited page clearly enough.",
        affected_urls=(affected_url,),
        evidence=(evidence,),
        recommendation=recommendation,
        tool_mappings=(mapping,),
    )
    check = AuditCheck(
        check_id="metadata.title",
        name="Title tag",
        category=IssueCategory.METADATA,
        status=CheckStatus.WARNING,
        evidence=(evidence,),
        issue_ids=(issue.issue_id,),
    )
    job = AuditJob(target=target)
    run = AuditRun(job_id=job.job_id, target=target, checks=(check,), issues=(issue,), score=84)

    assert isinstance(job.job_id, UUID)
    assert run.status.value == "running"
    assert run.checks[0].issue_ids == ("metadata.title.generic",)
    assert run.issues[0].recommendation.steps[0] == "Keep the title unique."


def test_score_is_bounded() -> None:
    target = AuditTarget(
        original_url="https://example.com",
        normalized_url="https://example.com/",
        hostname="example.com",
    )
    with pytest.raises(ValidationError):
        AuditRun(job_id=UUID(int=1), target=target, score=101)


def test_ready_tool_mapping_requires_routes() -> None:
    with pytest.raises(ValidationError):
        ToolMapping(
            issue_category=IssueCategory.URL,
            tool_category="development-data",
            tool_slug="url-encoder-decoder",
            ready=True,
            rationale="Inspect encoded URL evidence.",
        )
