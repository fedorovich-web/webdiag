from uuid import UUID

from webdiag_api.audit.fetcher import SafeFetchResult
from webdiag_api.audit.intake import build_audit_target
from webdiag_api.audit.report import assemble_single_page_report
from webdiag_api.audit.taxonomy import (
    CHECK_DEFINITIONS,
    ISSUE_DEFINITIONS,
    get_check_definition,
    get_issue_definition,
    validate_taxonomy,
)


def test_audit_taxonomy_is_internally_consistent() -> None:
    validate_taxonomy()

    check_ids = [definition.check_id for definition in CHECK_DEFINITIONS]
    issue_ids = [definition.issue_id for definition in ISSUE_DEFINITIONS]

    assert len(check_ids) == len(set(check_ids))
    assert len(issue_ids) == len(set(issue_ids))
    assert get_check_definition("metadata.title").category.value == "metadata"
    assert get_issue_definition("metadata.title.missing").check_id == "metadata.title"


def test_report_issues_are_registered_in_taxonomy() -> None:
    target = build_audit_target("https://example.com", resolved_addresses=["93.184.216.34"])
    fetched = SafeFetchResult(
        requested_url="https://example.com/",
        final_url="https://example.com/",
        status_code=200,
        headers={"content-type": "text/html"},
        body_text="""
        <html><head><meta name="robots" content="noindex"></head>
        <body><p>No headings</p></body></html>
        """,
        content_type="text/html",
        redirect_chain=(),
    )

    report = assemble_single_page_report(job_id=UUID(int=1), target=target, fetched=fetched)

    for issue in report.issues:
        definition = get_issue_definition(issue.issue_id)
        assert issue.check_id == definition.check_id
        assert issue.category is definition.category
        assert issue.severity is definition.severity
        assert issue.priority is definition.priority
