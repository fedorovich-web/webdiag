from uuid import UUID

from webdiag_api.audit.fetcher import RedirectHop, SafeFetchResult
from webdiag_api.audit.intake import build_audit_target
from webdiag_api.audit.models import AuditJobStatus, IssueCategory, Priority, Severity
from webdiag_api.audit.report import assemble_single_page_report
from webdiag_api.tools.performance import PageSpeedMetricResponse, PageSpeedStrategyResponse


def test_assemble_single_page_report_passes_core_metadata_checks() -> None:
    target = build_audit_target("https://example.com", resolved_addresses=["93.184.216.34"])
    fetched = SafeFetchResult(
        requested_url="https://example.com/",
        final_url="https://example.com/",
        status_code=200,
        headers={
            "content-type": "text/html; charset=utf-8",
            "strict-transport-security": "max-age=31536000",
            "content-security-policy": "default-src 'self'",
            "x-content-type-options": "nosniff",
            "referrer-policy": "strict-origin-when-cross-origin",
            "permissions-policy": "geolocation=()",
            "x-frame-options": "DENY",
        },
        body_text="""
        <html><head>
          <title>WebDiag technical audit</title>
          <meta name="description" content="Technical audit report for a website.">
          <link rel="canonical" href="https://example.com/">
        </head><body><h1>Website audit</h1></body></html>
        """,
        content_type="text/html; charset=utf-8",
        redirect_chain=(),
    )

    report = assemble_single_page_report(job_id=UUID(int=1), target=target, fetched=fetched)

    assert report.status is AuditJobStatus.SUCCEEDED
    assert all(check.taxonomy_version == "webdiag.audit.taxonomy.v1" for check in report.checks)
    assert report.score == 100
    assert report.issues == ()
    assert {check.check_id for check in report.checks} >= {
        "http.status",
        "metadata.title",
        "metadata.description",
        "metadata.h1",
        "metadata.canonical",
        "security.headers",
    }


def test_assemble_single_page_report_creates_prioritized_issues() -> None:
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
        redirect_chain=(
            RedirectHop("https://example.com/a", "https://example.com/b", 301),
            RedirectHop("https://example.com/b", "https://example.com/c", 301),
            RedirectHop("https://example.com/c", "https://example.com/", 301),
        ),
    )

    report = assemble_single_page_report(job_id=UUID(int=2), target=target, fetched=fetched)
    issue_ids = {issue.issue_id for issue in report.issues}

    assert "metadata.title.missing" in issue_ids
    assert "metadata.description.missing" in issue_ids
    assert "metadata.h1.missing" in issue_ids
    assert "metadata.canonical.missing" in issue_ids
    assert "indexability.robots_meta.noindex" in issue_ids
    assert "redirects.chain.too_long" in issue_ids
    assert "security.headers.missing" in issue_ids
    noindex = next(
        issue for issue in report.issues if issue.issue_id == "indexability.robots_meta.noindex"
    )
    assert noindex.check_id == "indexability.robots_meta"
    assert noindex.taxonomy_version == "webdiag.audit.taxonomy.v1"
    assert noindex.severity is Severity.HIGH
    assert noindex.priority is Priority.P0
    assert noindex.tool_mappings[0].issue_category is IssueCategory.INDEXABILITY
    assert report.score < 100


def test_assemble_single_page_report_handles_http_errors() -> None:
    target = build_audit_target("https://example.com/missing", resolved_addresses=["93.184.216.34"])
    fetched = SafeFetchResult(
        requested_url="https://example.com/missing",
        final_url="https://example.com/missing",
        status_code=404,
        headers={"content-type": "text/html"},
        body_text="<html><head><title>Missing</title></head><body><h1>Missing</h1></body></html>",
        content_type="text/html",
        redirect_chain=(),
    )

    report = assemble_single_page_report(job_id=UUID(int=3), target=target, fetched=fetched)
    issue = next(issue for issue in report.issues if issue.issue_id == "http.status.client_error")

    assert issue.category is IssueCategory.HTTP
    assert issue.priority is Priority.P0
    assert issue.affected_urls[0].status_code == 404


def test_assemble_single_page_report_sets_check_timestamps() -> None:
    target = build_audit_target("https://example.com", resolved_addresses=["93.184.216.34"])
    fetched = SafeFetchResult(
        requested_url="https://example.com/",
        final_url="https://example.com/",
        status_code=200,
        headers={
            "content-type": "text/html",
            "strict-transport-security": "max-age=31536000",
            "content-security-policy": "default-src 'self'",
            "x-content-type-options": "nosniff",
            "referrer-policy": "strict-origin-when-cross-origin",
            "permissions-policy": "geolocation=()",
            "x-frame-options": "DENY",
        },
        body_text="""
        <html><head>
          <title>Technical SEO audit page</title>
          <meta name="description" content="Technical audit report for a website.">
          <link rel="canonical" href="https://example.com/">
        </head><body><h1>Website audit</h1></body></html>
        """,
        content_type="text/html",
        redirect_chain=(),
    )

    report = assemble_single_page_report(job_id=UUID(int=4), target=target, fetched=fetched)

    assert all(check.started_at is not None for check in report.checks)
    assert all(check.completed_at is not None for check in report.checks)
    assert all(
        check.completed_at >= check.started_at
        for check in report.checks
        if check.completed_at and check.started_at
    )
    assert all(check.duration_ms is not None for check in report.checks)
    assert all(check.duration_ms >= 1 for check in report.checks if check.duration_ms is not None)


def test_assemble_single_page_report_flags_incomplete_open_graph_and_invalid_json_ld() -> None:
    target = build_audit_target("https://example.com", resolved_addresses=["93.184.216.34"])
    fetched = SafeFetchResult(
        requested_url="https://example.com/",
        final_url="https://example.com/",
        status_code=200,
        headers={
            "content-type": "text/html",
            "strict-transport-security": "max-age=31536000",
            "content-security-policy": "default-src 'self'",
            "x-content-type-options": "nosniff",
            "referrer-policy": "strict-origin-when-cross-origin",
            "permissions-policy": "geolocation=()",
            "x-frame-options": "DENY",
        },
        body_text="""
        <html><head>
          <title>Technical SEO audit page</title>
          <meta name="description" content="Technical audit report for a website.">
          <link rel="canonical" href="https://example.com/">
          <meta property="og:title" content="Technical SEO audit page">
          <script type="application/ld+json">{"@type":"WebPage"</script>
        </head><body><h1>Website audit</h1></body></html>
        """,
        content_type="text/html",
        redirect_chain=(),
    )

    report = assemble_single_page_report(job_id=UUID(int=5), target=target, fetched=fetched)
    issue_ids = {issue.issue_id for issue in report.issues}

    assert "metadata.open_graph.incomplete" in issue_ids
    assert "structured_data.json_ld.invalid" in issue_ids
    assert {check.check_id for check in report.checks} >= {
        "metadata.open_graph",
        "structured_data.json_ld",
    }


def test_assemble_single_page_report_resolves_relative_canonical_against_final_url() -> None:
    target = build_audit_target("https://example.com/page", resolved_addresses=["93.184.216.34"])
    fetched = SafeFetchResult(
        requested_url="https://example.com/page",
        final_url="https://example.com/page",
        status_code=200,
        headers={
            "content-type": "text/html",
            "strict-transport-security": "max-age=31536000",
            "content-security-policy": "default-src 'self'",
            "x-content-type-options": "nosniff",
            "referrer-policy": "strict-origin-when-cross-origin",
            "permissions-policy": "geolocation=()",
            "x-frame-options": "DENY",
        },
        body_text="""
        <html><head>
          <title>Technical SEO audit page</title>
          <meta name="description" content="Technical audit report for a website.">
          <link rel="canonical" href="/page">
        </head><body><h1>Website audit</h1></body></html>
        """,
        content_type="text/html",
        redirect_chain=(),
    )

    report = assemble_single_page_report(job_id=UUID(int=6), target=target, fetched=fetched)
    issue_ids = {issue.issue_id for issue in report.issues}

    assert "metadata.canonical.final_url_mismatch" not in issue_ids


def test_assemble_single_page_report_includes_mobile_pagespeed_findings() -> None:
    target = build_audit_target("https://example.com", resolved_addresses=["93.184.216.34"])
    fetched = SafeFetchResult(
        requested_url="https://example.com/",
        final_url="https://example.com/",
        status_code=200,
        headers={
            "content-type": "text/html",
            "strict-transport-security": "max-age=31536000",
            "content-security-policy": "default-src 'self'",
            "x-content-type-options": "nosniff",
            "referrer-policy": "strict-origin-when-cross-origin",
            "permissions-policy": "geolocation=()",
            "x-frame-options": "DENY",
        },
        body_text=(
            "<html><head><title>Technical SEO audit page</title>"
            '<meta name="description" content="Technical audit report for a website.">'
            '<link rel="canonical" href="https://example.com/"></head>'
            "<body><h1>Website audit</h1></body></html>"
        ),
        content_type="text/html",
        redirect_chain=(),
    )
    pagespeed = PageSpeedStrategyResponse(
        strategy="mobile",
        available=True,
        performance_score=43,
        field_data_available=True,
        field_overall_category="SLOW",
        lighthouse_version="13.0.0",
        analysis_fetch_time="2026-09-24T12:00:00Z",
        category_scores={
            "performance": 43,
            "accessibility": 96,
            "best-practices": 100,
            "seo": 100,
        },
        audit_findings=(),
        metrics=(
            PageSpeedMetricResponse(
                id="largest-contentful-paint",
                title="Largest Contentful Paint",
                value=5100,
                unit="ms",
                display_value="5.1 s",
                source="lab",
                status="fail",
            ),
            PageSpeedMetricResponse(
                id="cumulative-layout-shift",
                title="Cumulative Layout Shift",
                value=0.08,
                unit="ratio",
                display_value="0.08",
                source="lab",
                status="pass",
            ),
        ),
        opportunities=(),
        fetch_error=None,
    )

    report = assemble_single_page_report(
        job_id=UUID(int=10),
        target=target,
        fetched=fetched,
        pagespeed=pagespeed,
    )

    check = next(
        item for item in report.checks if item.check_id == "performance.pagespeed_mobile"
    )
    issue = next(
        item for item in report.issues if item.issue_id == "performance.pagespeed_mobile.poor"
    )
    assert check.status.value == "warning"
    assert issue.category is IssueCategory.PERFORMANCE
    assert issue.severity is Severity.HIGH
    assert issue.priority is Priority.P1
    assert any(
        evidence.source == "google.pagespeed.mobile.largest-contentful-paint"
        for evidence in check.evidence
    )
    assert {mapping.tool_slug for mapping in issue.tool_mappings if mapping.ready} >= {
        "core-web-vitals-checker"
    }


def test_assemble_single_page_report_skips_unavailable_pagespeed_without_penalty() -> None:
    target = build_audit_target("https://example.com", resolved_addresses=["93.184.216.34"])
    fetched = SafeFetchResult(
        requested_url="https://example.com/",
        final_url="https://example.com/",
        status_code=200,
        headers={
            "content-type": "text/html",
            "strict-transport-security": "max-age=31536000",
            "content-security-policy": "default-src 'self'",
            "x-content-type-options": "nosniff",
            "referrer-policy": "strict-origin-when-cross-origin",
            "permissions-policy": "geolocation=()",
            "x-frame-options": "DENY",
        },
        body_text=(
            "<html><head><title>Technical SEO audit page</title>"
            '<meta name="description" content="Technical audit report for a website.">'
            '<link rel="canonical" href="https://example.com/"></head>'
            "<body><h1>Website audit</h1></body></html>"
        ),
        content_type="text/html",
        redirect_chain=(),
    )
    pagespeed = PageSpeedStrategyResponse(
        strategy="mobile",
        available=False,
        performance_score=None,
        field_data_available=False,
        field_overall_category=None,
        lighthouse_version=None,
        analysis_fetch_time=None,
        category_scores={
            "performance": None,
            "accessibility": None,
            "best-practices": None,
            "seo": None,
        },
        audit_findings=(),
        metrics=(),
        opportunities=(),
        fetch_error="provider unavailable",
    )

    report = assemble_single_page_report(
        job_id=UUID(int=11),
        target=target,
        fetched=fetched,
        pagespeed=pagespeed,
    )

    check = next(
        item for item in report.checks if item.check_id == "performance.pagespeed_mobile"
    )
    assert check.status.value == "skipped"
    assert not any(issue.category is IssueCategory.PERFORMANCE for issue in report.issues)
    assert report.score == 100
