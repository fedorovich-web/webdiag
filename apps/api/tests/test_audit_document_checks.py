from uuid import UUID

import pytest

from webdiag_api.audit.fetcher import SafeFetchResult
from webdiag_api.audit.intake import build_audit_target
from webdiag_api.audit.report import assemble_single_page_report
from webdiag_api.audit.robots import analyze_robots_txt
from webdiag_api.audit.site_resources import SiteResourceReport
from webdiag_api.audit.sitemap import parse_sitemap_xml


def _report(html: str, *, headers=None, content_type="text/html", url="https://example.com/"):
    return assemble_single_page_report(
        job_id=UUID(int=1),
        target=build_audit_target(url, resolved_addresses=["93.184.216.34"]),
        fetched=SafeFetchResult(
            requested_url=url,
            final_url=url,
            status_code=200,
            headers=headers or {},
            body_text=html,
            content_type=content_type,
            redirect_chain=(),
        ),
    )


def test_document_signals_cover_real_mobile_accessibility_image_and_indexing_defects():
    report = _report(
        "<html><head><title>First title</title><title>Duplicate</title></head>"
        '<body><h1>Main</h1><h3>Skipped level</h3><img src="/product.png"></body></html>',
        headers={"x-robots-tag": "noindex"},
        url="http://example.com/",
    )
    issues = {item.issue_id for item in report.issues}
    assert issues >= {
        "indexability.x_robots_tag.noindex",
        "security.https.missing",
        "metadata.viewport.missing",
        "accessibility.language.missing",
        "media.image_alt.missing",
        "media.image_dimensions.missing",
        "content.heading_order.skipped_level",
        "metadata.unique_tags.duplicate",
    }
    checks = {item.check_id: item for item in report.checks}
    assert checks["indexability.x_robots_tag"].evidence[0].value == "noindex"
    assert checks["media.image_alt"].evidence[0].metadata["missing"] == 1
    assert all(item.check_id in checks for item in report.issues)


def test_document_checks_accept_explicit_decorative_alt_and_valid_static_signals():
    report = _report(
        '<html lang="ru"><head><title>Useful page title</title>'
        '<meta name="viewport" content="width=device-width, initial-scale=1"></head>'
        '<body><h1>Main</h1><h2>Details</h2><img alt="" src="/decor.png" '
        'width="100" height="50"></body></html>'
    )
    checks = {item.check_id: item for item in report.checks}
    for check_id in (
        "indexability.x_robots_tag",
        "security.https",
        "metadata.viewport",
        "accessibility.language",
        "media.image_alt",
        "media.image_dimensions",
        "content.heading_order",
        "metadata.unique_tags",
    ):
        assert checks[check_id].status.value == "passed"


def test_non_html_documents_do_not_produce_missing_html_metadata_issues():
    report = _report('{"message":"API response"}', content_type="application/json")
    assert "content_type.html.not_html" in {item.issue_id for item in report.issues}
    assert not any(
        item.category.value in {"metadata", "content", "media"} for item in report.issues
    )
    assert (
        next(item for item in report.checks if item.check_id == "metadata.title").status.value
        == "skipped"
    )


@pytest.mark.parametrize("canonical", ["https://example.com:bad/path", "https://[broken"])
def test_invalid_canonical_does_not_abort_the_entire_report(canonical):
    report = _report(f'<link rel="canonical" href="{canonical}">')
    assert "metadata.canonical.final_url_mismatch" in {item.issue_id for item in report.issues}


def test_long_untrusted_metadata_is_bounded_in_evidence_without_losing_the_report():
    report = _report(f"<title>{'Long title ' * 500}</title><h1>{'heading ' * 500}</h1>")
    title_check = next(item for item in report.checks if item.check_id == "metadata.title")
    assert len(title_check.evidence[0].value) <= 2000
    assert title_check.evidence[0].metadata["truncated_fields"] == ["value"]


def test_unavailable_robots_and_sitemap_are_not_reported_as_completed_success_or_missing():
    url = "https://example.com/"
    resources = SiteResourceReport(
        robots=analyze_robots_txt(
            "",
            robots_url=url + "robots.txt",
            target_url=url,
            status_code=None,
            fetch_error="timeout",
        ),
        sitemap=parse_sitemap_xml(
            "",
            sitemap_url=url + "sitemap.xml",
            target_url=url,
            status_code=503,
            fetch_error="unavailable",
        ),
    )
    report = assemble_single_page_report(
        job_id=UUID(int=1),
        target=build_audit_target(url, resolved_addresses=["93.184.216.34"]),
        fetched=SafeFetchResult(
            requested_url=url,
            final_url=url,
            status_code=200,
            headers={},
            body_text="<h1>Main</h1>",
            content_type="text/html",
            redirect_chain=(),
        ),
        site_resources=resources,
    )
    checks = {item.check_id: item for item in report.checks}
    assert checks["crawlability.robots_txt"].status.value == "skipped"
    assert checks["crawlability.sitemap_xml"].status.value == "skipped"
    assert "crawlability.sitemap_xml.missing" not in {item.issue_id for item in report.issues}
