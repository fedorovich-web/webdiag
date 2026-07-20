from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from webdiag_api.audit.fetcher import SafeFetchResult
from webdiag_api.audit.html_metadata import HtmlMetadata, parse_html_metadata
from webdiag_api.audit.models import (
    AffectedUrl,
    AuditCheck,
    AuditIssue,
    AuditJobStatus,
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
from webdiag_api.audit.registry_mapping import bindings_for_category
from webdiag_api.audit.security_headers import BASELINE_SECURITY_HEADERS, evaluate_security_headers
from webdiag_api.audit.site_resources import SiteResourceReport
from webdiag_api.audit.structured_data import (
    StructuredDataReport,
    analyze_json_ld_scripts,
)

SEVERITY_WEIGHTS: dict[Severity, int] = {
    Severity.INFO: 0,
    Severity.LOW: 4,
    Severity.MEDIUM: 8,
    Severity.HIGH: 16,
    Severity.CRITICAL: 28,
}

SECURITY_HEADERS = BASELINE_SECURITY_HEADERS


def assemble_single_page_report(
    *,
    job_id: UUID,
    target: AuditTarget,
    fetched: SafeFetchResult,
    site_resources: SiteResourceReport | None = None,
) -> AuditRun:
    metadata = parse_html_metadata(fetched.body_text)
    structured_data = analyze_json_ld_scripts(metadata.json_ld_scripts)
    issues = _collect_issues(
        target=target,
        fetched=fetched,
        metadata=metadata,
        structured_data=structured_data,
        site_resources=site_resources,
    )
    checks = _collect_checks(
        fetched=fetched,
        metadata=metadata,
        structured_data=structured_data,
        issues=issues,
        site_resources=site_resources,
    )
    score = _score(issues)
    return AuditRun(
        job_id=job_id,
        target=target,
        status=AuditJobStatus.SUCCEEDED,
        checks=tuple(checks),
        issues=tuple(issues),
        score=score,
    )


def _collect_checks(
    *,
    fetched: SafeFetchResult,
    metadata: HtmlMetadata,
    structured_data: StructuredDataReport,
    issues: list[AuditIssue],
    site_resources: SiteResourceReport | None,
) -> list[AuditCheck]:
    issue_ids_by_check: dict[str, list[str]] = {}
    for issue in issues:
        check_id = issue.issue_id.rsplit(".", maxsplit=1)[0]
        issue_ids_by_check.setdefault(check_id, []).append(issue.issue_id)

    checks = [
        _check(
            check_id="http.status",
            name="HTTP status",
            category=IssueCategory.HTTP,
            failed_when=bool(issue_ids_by_check.get("http.status")),
            evidence=(
                Evidence(
                    kind=EvidenceKind.SYSTEM,
                    source="http.status_code",
                    value=str(fetched.status_code),
                ),
            ),
            issue_ids=issue_ids_by_check.get("http.status", []),
        ),
        _check(
            check_id="redirects.chain",
            name="Redirect chain",
            category=IssueCategory.REDIRECTS,
            failed_when=bool(issue_ids_by_check.get("redirects.chain")),
            evidence=tuple(
                Evidence(
                    kind=EvidenceKind.REDIRECT_HOP,
                    source=hop.source_url,
                    value=f"{hop.status_code} -> {hop.target_url}",
                )
                for hop in fetched.redirect_chain
            ),
            issue_ids=issue_ids_by_check.get("redirects.chain", []),
        ),
        _check(
            check_id="content_type.html",
            name="HTML content type",
            category=IssueCategory.HTTP,
            failed_when=bool(issue_ids_by_check.get("content_type.html")),
            evidence=(
                Evidence(
                    kind=EvidenceKind.HTTP_HEADER,
                    source="content-type",
                    value=fetched.content_type or "missing",
                ),
            ),
            issue_ids=issue_ids_by_check.get("content_type.html", []),
        ),
        _check(
            check_id="metadata.title",
            name="Title tag",
            category=IssueCategory.METADATA,
            failed_when=bool(issue_ids_by_check.get("metadata.title")),
            evidence=(
                Evidence(
                    kind=EvidenceKind.HTML_ELEMENT,
                    source="head > title",
                    value=metadata.title or "missing",
                ),
            ),
            issue_ids=issue_ids_by_check.get("metadata.title", []),
        ),
        _check(
            check_id="metadata.description",
            name="Meta description",
            category=IssueCategory.METADATA,
            failed_when=bool(issue_ids_by_check.get("metadata.description")),
            evidence=(
                Evidence(
                    kind=EvidenceKind.HTML_ELEMENT,
                    source='meta[name="description"]',
                    value=metadata.meta_description or "missing",
                ),
            ),
            issue_ids=issue_ids_by_check.get("metadata.description", []),
        ),
        _check(
            check_id="metadata.h1",
            name="H1 structure",
            category=IssueCategory.CONTENT,
            failed_when=bool(issue_ids_by_check.get("metadata.h1")),
            evidence=(
                Evidence(
                    kind=EvidenceKind.HTML_ELEMENT,
                    source="h1",
                    value=str(len(metadata.h1)),
                    excerpt=" | ".join(metadata.h1[:3]) or None,
                ),
            ),
            issue_ids=issue_ids_by_check.get("metadata.h1", []),
        ),
        _check(
            check_id="metadata.canonical",
            name="Canonical link",
            category=IssueCategory.INDEXABILITY,
            failed_when=bool(issue_ids_by_check.get("metadata.canonical")),
            evidence=(
                Evidence(
                    kind=EvidenceKind.HTML_ELEMENT,
                    source='link[rel="canonical"]',
                    value=metadata.canonical_url or "missing",
                    metadata={"final_url": fetched.final_url},
                ),
            ),
            issue_ids=issue_ids_by_check.get("metadata.canonical", []),
        ),
        _check(
            check_id="indexability.robots_meta",
            name="Robots meta",
            category=IssueCategory.INDEXABILITY,
            failed_when=bool(issue_ids_by_check.get("indexability.robots_meta")),
            evidence=tuple(
                Evidence(
                    kind=EvidenceKind.ROBOTS_DIRECTIVE,
                    source=f"meta[name={directive.user_agent}]",
                    value=directive.content,
                )
                for directive in metadata.robots
            )
            or (
                Evidence(
                    kind=EvidenceKind.HTML_ELEMENT,
                    source='meta[name="robots"]',
                    value="not set",
                ),
            ),
            issue_ids=issue_ids_by_check.get("indexability.robots_meta", []),
        ),
        _check(
            check_id="metadata.open_graph",
            name="Open Graph metadata",
            category=IssueCategory.METADATA,
            failed_when=bool(issue_ids_by_check.get("metadata.open_graph")),
            evidence=_social_metadata_evidence(
                source_prefix="meta[property]",
                signals={signal.name: signal.content for signal in metadata.open_graph},
                expected=("og:title", "og:description", "og:image"),
            ),
            issue_ids=issue_ids_by_check.get("metadata.open_graph", []),
        ),
        _check(
            check_id="structured_data.json_ld",
            name="JSON-LD structured data",
            category=IssueCategory.STRUCTURED_DATA,
            failed_when=bool(issue_ids_by_check.get("structured_data.json_ld")),
            evidence=_structured_data_evidence(structured_data),
            issue_ids=issue_ids_by_check.get("structured_data.json_ld", []),
        ),
        _check(
            check_id="security.headers",
            name="Security headers",
            category=IssueCategory.SECURITY,
            failed_when=bool(issue_ids_by_check.get("security.headers")),
            evidence=tuple(
                Evidence(
                    kind=EvidenceKind.HTTP_HEADER,
                    source=finding.header,
                    value=finding.value,
                    metadata={"status": finding.status, "message": finding.message},
                )
                for finding in evaluate_security_headers(
                    fetched.headers,
                    final_url=fetched.final_url,
                )
            ),
            issue_ids=issue_ids_by_check.get("security.headers", []),
        ),
    ]

    if site_resources is not None:
        checks.extend(
            [
                _check(
                    check_id="crawlability.robots_txt",
                    name="Robots.txt",
                    category=IssueCategory.CRAWLABILITY,
                    failed_when=bool(issue_ids_by_check.get("crawlability.robots_txt")),
                    evidence=(
                        Evidence(
                            kind=EvidenceKind.ROBOTS_DIRECTIVE,
                            source=site_resources.robots.robots_url,
                            value=(
                                "available"
                                if site_resources.robots.available
                                else (
                                    "unavailable:"
                                    f"{site_resources.robots.status_code or 'fetch_error'}"
                                )
                            ),
                            metadata={
                                "allows_target": site_resources.robots.allows_target,
                                "sitemap_urls": list(site_resources.robots.sitemap_urls),
                                "matched_disallow_rule": (
                                    site_resources.robots.matched_disallow_rule
                                ),
                            },
                        ),
                    ),
                    issue_ids=issue_ids_by_check.get("crawlability.robots_txt", []),
                ),
                _check(
                    check_id="crawlability.sitemap_xml",
                    name="Sitemap.xml discovery",
                    category=IssueCategory.CRAWLABILITY,
                    failed_when=bool(issue_ids_by_check.get("crawlability.sitemap_xml")),
                    evidence=(
                        Evidence(
                            kind=EvidenceKind.SITEMAP_ENTRY,
                            source=site_resources.sitemap.sitemap_url,
                            value=(
                                f"{site_resources.sitemap.url_count} urls"
                                if site_resources.sitemap.available
                                else (
                                    "unavailable:"
                                    f"{site_resources.sitemap.status_code or 'fetch_error'}"
                                )
                            ),
                            metadata={
                                "available": site_resources.sitemap.available,
                                "valid_xml": site_resources.sitemap.valid_xml,
                                "contains_target": site_resources.sitemap.contains_target,
                            },
                        ),
                    ),
                    issue_ids=issue_ids_by_check.get("crawlability.sitemap_xml", []),
                ),
            ]
        )

    return checks


def _collect_issues(
    *,
    target: AuditTarget,
    fetched: SafeFetchResult,
    metadata: HtmlMetadata,
    structured_data: StructuredDataReport,
    site_resources: SiteResourceReport | None,
) -> list[AuditIssue]:
    affected = (
        AffectedUrl(
            url=target.normalized_url,
            normalized_url=str(target.normalized_url),
            status_code=fetched.status_code,
            final_url=fetched.final_url,
        ),
    )
    issues: list[AuditIssue] = []

    if fetched.status_code >= 500:
        issues.append(
            _issue(
                issue_id="http.status.server_error",
                category=IssueCategory.HTTP,
                severity=Severity.CRITICAL,
                priority=Priority.P0,
                title="Server error response",
                description="The audited URL returned a 5xx HTTP status code.",
                evidence=Evidence(
                    kind=EvidenceKind.SYSTEM,
                    source="http.status_code",
                    value=str(fetched.status_code),
                ),
                recommendation=Recommendation(
                    summary="Fix the server error before optimizing secondary SEO signals.",
                    steps=(
                        "Check application logs for the audited URL.",
                        "Verify upstream, proxy and deployment health.",
                    ),
                    expected_impact="Restores crawlability and user access for the affected page.",
                ),
                affected_urls=affected,
            )
        )
    elif fetched.status_code >= 400:
        issues.append(
            _issue(
                issue_id="http.status.client_error",
                category=IssueCategory.HTTP,
                severity=Severity.HIGH,
                priority=Priority.P0,
                title="Client error response",
                description="The audited URL returned a 4xx HTTP status code.",
                evidence=Evidence(
                    kind=EvidenceKind.SYSTEM,
                    source="http.status_code",
                    value=str(fetched.status_code),
                ),
                recommendation=Recommendation(
                    summary="Restore a valid page or redirect the URL to the correct destination.",
                    steps=(
                        "Check whether the URL should be indexable.",
                        "Return 200 for an active page or 301 to the canonical replacement.",
                    ),
                    expected_impact="Prevents crawl waste and broken landing pages.",
                ),
                affected_urls=affected,
            )
        )

    if len(fetched.redirect_chain) > 2:
        issues.append(
            _issue(
                issue_id="redirects.chain.too_long",
                category=IssueCategory.REDIRECTS,
                severity=Severity.MEDIUM,
                priority=Priority.P2,
                title="Redirect chain is too long",
                description=(
                    "The URL needs more than two redirects before reaching the final response."
                ),
                evidence=Evidence(
                    kind=EvidenceKind.REDIRECT_HOP,
                    source="redirect_chain",
                    value=str(len(fetched.redirect_chain)),
                ),
                recommendation=Recommendation(
                    summary="Collapse intermediate redirects into one direct canonical redirect.",
                    steps=(
                        "Update redirect rules so the initial URL points directly "
                        "to the final URL.",
                    ),
                    expected_impact="Reduces latency and preserves crawl budget.",
                ),
                affected_urls=affected,
            )
        )

    content_type = (fetched.content_type or "").lower()
    if "html" not in content_type:
        issues.append(
            _issue(
                issue_id="content_type.html.not_html",
                category=IssueCategory.HTTP,
                severity=Severity.MEDIUM,
                priority=Priority.P1,
                title="Response is not HTML",
                description="The audited URL did not return an HTML content type.",
                evidence=Evidence(
                    kind=EvidenceKind.HTTP_HEADER,
                    source="content-type",
                    value=fetched.content_type or "missing",
                ),
                recommendation=Recommendation(
                    summary=(
                        "Return an HTML document for pages that should be audited as landing pages."
                    ),
                    steps=("Check routing and response headers for the audited URL.",),
                    expected_impact=(
                        "Allows metadata, indexability and content checks to run correctly."
                    ),
                ),
                affected_urls=affected,
            )
        )

    if not metadata.title:
        issues.append(
            _metadata_issue(
                issue_id="metadata.title.missing",
                title="Title tag is missing",
                description="The page does not expose a title tag in the HTML head.",
                source="head > title",
                value="missing",
                summary="Add a unique title that describes the page topic.",
                priority=Priority.P1,
                affected_urls=affected,
            )
        )
    elif len(metadata.title) < 10:
        issues.append(
            _metadata_issue(
                issue_id="metadata.title.too_short",
                title="Title tag is too short",
                description="The page title is present but too short to describe the page clearly.",
                source="head > title",
                value=metadata.title,
                summary="Rewrite the title so it communicates the page topic and intent.",
                priority=Priority.P2,
                affected_urls=affected,
            )
        )

    if not metadata.meta_description:
        issues.append(
            _metadata_issue(
                issue_id="metadata.description.missing",
                title="Meta description is missing",
                description="The page does not expose a meta description in the HTML head.",
                source='meta[name="description"]',
                value="missing",
                summary="Add a concise description for the page snippet.",
                priority=Priority.P2,
                affected_urls=affected,
            )
        )

    if not metadata.h1:
        issues.append(
            _issue(
                issue_id="metadata.h1.missing",
                category=IssueCategory.CONTENT,
                severity=Severity.MEDIUM,
                priority=Priority.P1,
                title="H1 is missing",
                description="The page does not contain a primary H1 heading.",
                evidence=Evidence(kind=EvidenceKind.HTML_ELEMENT, source="h1", value="missing"),
                recommendation=Recommendation(
                    summary="Add one clear H1 that matches the page intent.",
                    steps=("Use a visible heading that describes the main page topic.",),
                    expected_impact="Improves content structure and page-topic clarity.",
                ),
                affected_urls=affected,
            )
        )
    elif len(metadata.h1) > 1:
        issues.append(
            _issue(
                issue_id="metadata.h1.multiple",
                category=IssueCategory.CONTENT,
                severity=Severity.LOW,
                priority=Priority.P3,
                title="Multiple H1 headings",
                description="The page contains more than one H1 heading.",
                evidence=Evidence(
                    kind=EvidenceKind.HTML_ELEMENT,
                    source="h1",
                    value=str(len(metadata.h1)),
                    excerpt=" | ".join(metadata.h1[:3]),
                ),
                recommendation=Recommendation(
                    summary="Keep one primary H1 and demote secondary headings to H2/H3.",
                    steps=("Review the document outline and keep one main heading.",),
                    expected_impact="Improves semantic consistency for users and crawlers.",
                ),
                affected_urls=affected,
            )
        )

    if not metadata.canonical_url:
        issues.append(
            _issue(
                issue_id="metadata.canonical.missing",
                category=IssueCategory.INDEXABILITY,
                severity=Severity.LOW,
                priority=Priority.P3,
                title="Canonical link is missing",
                description="The page does not declare a canonical URL.",
                evidence=Evidence(
                    kind=EvidenceKind.HTML_ELEMENT,
                    source='link[rel="canonical"]',
                    value="missing",
                ),
                recommendation=Recommendation(
                    summary="Add a canonical link for the preferred indexable URL.",
                    steps=("Set link rel=canonical to the stable final URL for this page.",),
                    expected_impact="Reduces duplicate URL ambiguity.",
                ),
                affected_urls=affected,
            )
        )
    elif _normalize_url_for_comparison(metadata.canonical_url) != _normalize_url_for_comparison(
        fetched.final_url
    ):
        issues.append(
            _issue(
                issue_id="metadata.canonical.final_url_mismatch",
                category=IssueCategory.INDEXABILITY,
                severity=Severity.MEDIUM,
                priority=Priority.P1,
                title="Canonical does not match final URL",
                description=(
                    "The page canonical URL differs from the final URL reached after redirects."
                ),
                evidence=Evidence(
                    kind=EvidenceKind.HTML_ELEMENT,
                    source='link[rel="canonical"]',
                    value=metadata.canonical_url,
                    metadata={"final_url": fetched.final_url},
                ),
                recommendation=Recommendation(
                    summary="Align canonical with the final indexable URL.",
                    steps=(
                        "Confirm the preferred URL for this page.",
                        "Set the canonical href to the same stable final URL crawlers receive.",
                    ),
                    expected_impact="Reduces duplicate and canonicalization ambiguity.",
                ),
                affected_urls=affected,
            )
        )

    if metadata.has_noindex:
        issues.append(
            _issue(
                issue_id="indexability.robots_meta.noindex",
                category=IssueCategory.INDEXABILITY,
                severity=Severity.HIGH,
                priority=Priority.P0,
                title="Page is marked noindex",
                description="The robots meta directives include noindex.",
                evidence=Evidence(
                    kind=EvidenceKind.ROBOTS_DIRECTIVE,
                    source='meta[name="robots"]',
                    value=", ".join(directive.content for directive in metadata.robots),
                ),
                recommendation=Recommendation(
                    summary="Remove noindex if this page must appear in search results.",
                    steps=("Confirm the intended indexation state before changing the directive.",),
                    expected_impact=(
                        "Allows the page to be indexed when other crawl conditions are valid."
                    ),
                ),
                affected_urls=affected,
            )
        )


    missing_open_graph = _missing_social_signals(
        {signal.name: signal.content for signal in metadata.open_graph},
        required=("og:title", "og:description", "og:image"),
    )
    if metadata.open_graph and missing_open_graph:
        issues.append(
            _issue(
                issue_id="metadata.open_graph.incomplete",
                category=IssueCategory.METADATA,
                severity=Severity.LOW,
                priority=Priority.P3,
                title="Open Graph metadata is incomplete",
                description=(
                    "The page exposes Open Graph metadata, but one or more baseline "
                    "sharing signals are missing."
                ),
                evidence=Evidence(
                    kind=EvidenceKind.HTML_ELEMENT,
                    source="meta[property^=og]",
                    value=", ".join(missing_open_graph),
                    metadata={"missing": list(missing_open_graph)},
                ),
                recommendation=Recommendation(
                    summary="Complete the Open Graph title, description and image signals.",
                    steps=(
                        "Set og:title to the same page-specific topic as the title tag.",
                        "Set og:description to a concise page summary.",
                        "Set og:image to a stable absolute preview image URL.",
                    ),
                    expected_impact="Improves link previews in social and messenger surfaces.",
                ),
                affected_urls=affected,
            )
        )

    if structured_data.has_invalid_blocks:
        issues.append(
            _issue(
                issue_id="structured_data.json_ld.invalid",
                category=IssueCategory.STRUCTURED_DATA,
                severity=Severity.MEDIUM,
                priority=Priority.P2,
                title="JSON-LD structured data is invalid",
                description="One or more application/ld+json blocks could not be parsed as JSON.",
                evidence=Evidence(
                    kind=EvidenceKind.TOOL_OUTPUT,
                    source="script[type=application/ld+json]",
                    value=f"{structured_data.invalid_count} invalid block(s)",
                    metadata={
                        f"block_{block.index}": block.error
                        for block in structured_data.blocks
                        if not block.valid
                    },
                ),
                recommendation=Recommendation(
                    summary="Fix invalid JSON-LD before relying on rich-result signals.",
                    steps=(
                        "Validate every JSON-LD block as strict JSON.",
                        "Keep schema types aligned with the visible page content.",
                    ),
                    expected_impact=(
                        "Prevents structured-data parsers from discarding schema evidence."
                    ),
                ),
                affected_urls=affected,
            )
        )

    security_findings = evaluate_security_headers(fetched.headers, final_url=fetched.final_url)
    actionable_security_findings = [
        finding
        for finding in security_findings
        if finding.status in {"missing", "recommended_missing", "invalid", "weak"}
    ]
    if actionable_security_findings:
        issues.append(
            _issue(
                issue_id="security.headers.missing",
                category=IssueCategory.SECURITY,
                severity=Severity.LOW,
                priority=Priority.P3,
                title="Security headers need attention",
                description=(
                    "The response is missing or weakening one or more baseline security headers."
                ),
                evidence=Evidence(
                    kind=EvidenceKind.HTTP_HEADER,
                    source="security.headers",
                    value=", ".join(finding.header for finding in actionable_security_findings),
                    metadata={
                        finding.header: finding.status
                        for finding in actionable_security_findings
                    },
                ),
                recommendation=Recommendation(
                    summary=(
                        "Add baseline response security headers where compatible with the site."
                    ),
                    steps=(
                        "Add X-Content-Type-Options: nosniff.",
                        (
                            "Configure Content-Security-Policy after testing required "
                            "scripts and assets."
                        ),
                        "Use Strict-Transport-Security on HTTPS production hosts.",
                        "Add Referrer-Policy and Permissions-Policy for tighter browser defaults.",
                    ),
                    expected_impact="Reduces avoidable browser-side security risk.",
                ),
                affected_urls=affected,
            )
        )

    if site_resources is not None:
        issues.extend(
            _collect_site_resource_issues(
                target=target,
                site_resources=site_resources,
                affected_urls=affected,
            )
        )

    return issues


def _collect_site_resource_issues(
    *,
    target: AuditTarget,
    site_resources: SiteResourceReport,
    affected_urls: tuple[AffectedUrl, ...],
) -> list[AuditIssue]:
    issues: list[AuditIssue] = []
    if site_resources.robots.allows_target is False:
        issues.append(
            _issue(
                issue_id="crawlability.robots_txt.disallows_target",
                category=IssueCategory.CRAWLABILITY,
                severity=Severity.HIGH,
                priority=Priority.P0,
                title="Robots.txt blocks the audited URL",
                description=(
                    "The origin robots.txt contains a Disallow rule matching the audited URL path."
                ),
                evidence=Evidence(
                    kind=EvidenceKind.ROBOTS_DIRECTIVE,
                    source=site_resources.robots.robots_url,
                    value=site_resources.robots.matched_disallow_rule or "matched disallow",
                    metadata={"target_url": str(target.normalized_url)},
                ),
                recommendation=Recommendation(
                    summary="Allow the URL in robots.txt if it should be crawled and indexed.",
                    steps=(
                        "Review the matching Disallow rule.",
                        "Narrow or remove the rule for indexable landing pages.",
                    ),
                    expected_impact="Restores crawler access when the page should be discoverable.",
                ),
                affected_urls=affected_urls,
            )
        )

    if not site_resources.sitemap.available:
        issues.append(
            _issue(
                issue_id="crawlability.sitemap_xml.missing",
                category=IssueCategory.CRAWLABILITY,
                severity=Severity.LOW,
                priority=Priority.P3,
                title="Sitemap.xml was not discovered",
                description="The default /sitemap.xml endpoint is not available for this origin.",
                evidence=Evidence(
                    kind=EvidenceKind.SITEMAP_ENTRY,
                    source=site_resources.sitemap.sitemap_url,
                    value=str(
                        site_resources.sitemap.status_code
                        or site_resources.sitemap.fetch_error
                    ),
                ),
                recommendation=Recommendation(
                    summary="Expose a sitemap.xml or declare sitemap locations in robots.txt.",
                    steps=(
                        "Publish sitemap.xml at the site root when practical.",
                        "Alternatively add Sitemap directives to robots.txt.",
                    ),
                    expected_impact="Improves URL discovery for search crawlers.",
                ),
                affected_urls=affected_urls,
            )
        )
    elif not site_resources.sitemap.valid_xml:
        issues.append(
            _issue(
                issue_id="crawlability.sitemap_xml.invalid",
                category=IssueCategory.CRAWLABILITY,
                severity=Severity.MEDIUM,
                priority=Priority.P2,
                title="Sitemap.xml is invalid",
                description="The discovered sitemap.xml could not be parsed as valid XML.",
                evidence=Evidence(
                    kind=EvidenceKind.SITEMAP_ENTRY,
                    source=site_resources.sitemap.sitemap_url,
                    value=site_resources.sitemap.parse_error or "invalid XML",
                ),
                recommendation=Recommendation(
                    summary="Fix sitemap XML syntax and regenerate the sitemap.",
                    steps=("Validate sitemap.xml before publishing it.",),
                    expected_impact="Allows crawlers to consume submitted URL lists reliably.",
                ),
                affected_urls=affected_urls,
            )
        )
    elif site_resources.sitemap.url_count == 0:
        issues.append(
            _issue(
                issue_id="crawlability.sitemap_xml.empty",
                category=IssueCategory.CRAWLABILITY,
                severity=Severity.LOW,
                priority=Priority.P3,
                title="Sitemap.xml contains no URLs",
                description="The discovered sitemap.xml did not expose any loc entries.",
                evidence=Evidence(
                    kind=EvidenceKind.SITEMAP_ENTRY,
                    source=site_resources.sitemap.sitemap_url,
                    value="0 urls",
                ),
                recommendation=Recommendation(
                    summary="Add important canonical URLs to the sitemap.",
                    steps=("Regenerate sitemap.xml from the production route inventory.",),
                    expected_impact="Improves search crawler discovery of important pages.",
                ),
                affected_urls=affected_urls,
            )
        )

    return issues


def _normalize_url_for_comparison(raw_url: str) -> str:
    return raw_url.strip().rstrip("/")


def _check(
    *,
    check_id: str,
    name: str,
    category: IssueCategory,
    failed_when: bool,
    evidence: tuple[Evidence, ...],
    issue_ids: list[str],
) -> AuditCheck:
    completed_at = datetime.now(UTC)
    return AuditCheck(
        check_id=check_id,
        name=name,
        category=category,
        status=CheckStatus.WARNING if failed_when else CheckStatus.PASSED,
        started_at=completed_at,
        completed_at=completed_at,
        evidence=evidence,
        issue_ids=tuple(issue_ids),
    )


def _social_metadata_evidence(
    *,
    source_prefix: str,
    signals: dict[str, str],
    expected: tuple[str, ...],
) -> tuple[Evidence, ...]:
    if not signals:
        return (
            Evidence(
                kind=EvidenceKind.HTML_ELEMENT,
                source=source_prefix,
                value="not set",
                metadata={"expected": list(expected)},
            ),
        )
    return tuple(
        Evidence(
            kind=EvidenceKind.HTML_ELEMENT,
            source=name,
            value=value,
        )
        for name, value in sorted(signals.items())
    )


def _structured_data_evidence(report: StructuredDataReport) -> tuple[Evidence, ...]:
    if report.block_count == 0:
        return (
            Evidence(
                kind=EvidenceKind.TOOL_OUTPUT,
                source="script[type=application/ld+json]",
                value="not set",
            ),
        )
    return tuple(
        Evidence(
            kind=EvidenceKind.TOOL_OUTPUT,
            source=f"script[type=application/ld+json]#{block.index}",
            value="valid" if block.valid else "invalid",
            metadata={
                "types": list(block.types),
                "node_count": block.node_count,
                "error": block.error,
            },
        )
        for block in report.blocks
    )


def _missing_social_signals(
    signals: dict[str, str],
    *,
    required: tuple[str, ...],
) -> tuple[str, ...]:
    return tuple(name for name in required if not signals.get(name))


def _metadata_issue(
    *,
    issue_id: str,
    title: str,
    description: str,
    source: str,
    value: str,
    summary: str,
    priority: Priority,
    affected_urls: tuple[AffectedUrl, ...],
) -> AuditIssue:
    return _issue(
        issue_id=issue_id,
        category=IssueCategory.METADATA,
        severity=Severity.MEDIUM,
        priority=priority,
        title=title,
        description=description,
        evidence=Evidence(kind=EvidenceKind.HTML_ELEMENT, source=source, value=value),
        recommendation=Recommendation(
            summary=summary,
            steps=("Keep the signal unique for every important URL.",),
            expected_impact="Improves search snippet quality and page-topic clarity.",
        ),
        affected_urls=affected_urls,
    )


def _issue(
    *,
    issue_id: str,
    category: IssueCategory,
    severity: Severity,
    priority: Priority,
    title: str,
    description: str,
    evidence: Evidence,
    recommendation: Recommendation,
    affected_urls: tuple[AffectedUrl, ...],
) -> AuditIssue:
    return AuditIssue(
        issue_id=issue_id,
        category=category,
        severity=severity,
        priority=priority,
        title=title,
        description=description,
        evidence=(evidence,),
        recommendation=recommendation,
        affected_urls=affected_urls,
        tool_mappings=bindings_for_category(category),
    )


def _score(issues: list[AuditIssue]) -> int:
    penalty = sum(SEVERITY_WEIGHTS[issue.severity] for issue in issues)
    return max(0, 100 - penalty)
