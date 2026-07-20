from __future__ import annotations

from dataclasses import dataclass

from webdiag_api.audit.models import IssueCategory, Priority, Severity

TAXONOMY_VERSION = "webdiag.audit.taxonomy.v1"


@dataclass(frozen=True, slots=True)
class CheckDefinition:
    check_id: str
    name: str
    category: IssueCategory
    description: str


@dataclass(frozen=True, slots=True)
class IssueDefinition:
    issue_id: str
    check_id: str
    category: IssueCategory
    severity: Severity
    priority: Priority
    title: str
    summary: str


CHECK_DEFINITIONS: tuple[CheckDefinition, ...] = (
    CheckDefinition(
        check_id="http.status",
        name="HTTP status",
        category=IssueCategory.HTTP,
        description="Checks whether the audited URL returns a successful HTTP response.",
    ),
    CheckDefinition(
        check_id="redirects.chain",
        name="Redirect chain",
        category=IssueCategory.REDIRECTS,
        description="Checks redirect hops before the final response.",
    ),
    CheckDefinition(
        check_id="content_type.html",
        name="HTML content type",
        category=IssueCategory.HTTP,
        description="Checks whether the audited URL returns an HTML document.",
    ),
    CheckDefinition(
        check_id="metadata.title",
        name="Title tag",
        category=IssueCategory.METADATA,
        description="Checks presence and baseline usefulness of the title tag.",
    ),
    CheckDefinition(
        check_id="metadata.description",
        name="Meta description",
        category=IssueCategory.METADATA,
        description="Checks presence of the meta description signal.",
    ),
    CheckDefinition(
        check_id="metadata.h1",
        name="H1 structure",
        category=IssueCategory.CONTENT,
        description="Checks whether the document exposes one primary H1 heading.",
    ),
    CheckDefinition(
        check_id="metadata.canonical",
        name="Canonical link",
        category=IssueCategory.INDEXABILITY,
        description="Checks canonical declaration and final URL consistency.",
    ),
    CheckDefinition(
        check_id="indexability.robots_meta",
        name="Robots meta",
        category=IssueCategory.INDEXABILITY,
        description="Checks robots meta directives that affect indexation.",
    ),
    CheckDefinition(
        check_id="metadata.open_graph",
        name="Open Graph metadata",
        category=IssueCategory.METADATA,
        description="Checks baseline Open Graph sharing metadata.",
    ),
    CheckDefinition(
        check_id="structured_data.json_ld",
        name="JSON-LD structured data",
        category=IssueCategory.STRUCTURED_DATA,
        description="Checks whether JSON-LD blocks are parseable and expose schema types.",
    ),
    CheckDefinition(
        check_id="security.headers",
        name="Security headers",
        category=IssueCategory.SECURITY,
        description="Checks baseline browser-facing response security headers.",
    ),
    CheckDefinition(
        check_id="crawlability.robots_txt",
        name="Robots.txt",
        category=IssueCategory.CRAWLABILITY,
        description="Checks origin robots.txt availability and target allow/disallow state.",
    ),
    CheckDefinition(
        check_id="crawlability.sitemap_xml",
        name="Sitemap.xml discovery",
        category=IssueCategory.CRAWLABILITY,
        description="Checks default sitemap.xml availability, XML validity and target coverage.",
    ),
)


ISSUE_DEFINITIONS: tuple[IssueDefinition, ...] = (
    IssueDefinition(
        issue_id="http.status.server_error",
        check_id="http.status",
        category=IssueCategory.HTTP,
        severity=Severity.CRITICAL,
        priority=Priority.P0,
        title="Server error response",
        summary="The audited URL returns a 5xx status code.",
    ),
    IssueDefinition(
        issue_id="http.status.client_error",
        check_id="http.status",
        category=IssueCategory.HTTP,
        severity=Severity.HIGH,
        priority=Priority.P0,
        title="Client error response",
        summary="The audited URL returns a 4xx status code.",
    ),
    IssueDefinition(
        issue_id="redirects.chain.too_long",
        check_id="redirects.chain",
        category=IssueCategory.REDIRECTS,
        severity=Severity.MEDIUM,
        priority=Priority.P2,
        title="Redirect chain is too long",
        summary="The URL needs more than two redirects before the final response.",
    ),
    IssueDefinition(
        issue_id="content_type.html.not_html",
        check_id="content_type.html",
        category=IssueCategory.HTTP,
        severity=Severity.MEDIUM,
        priority=Priority.P1,
        title="Response is not HTML",
        summary="The audited URL does not return an HTML content type.",
    ),
    IssueDefinition(
        issue_id="metadata.title.missing",
        check_id="metadata.title",
        category=IssueCategory.METADATA,
        severity=Severity.MEDIUM,
        priority=Priority.P1,
        title="Title tag is missing",
        summary="The page does not expose a title tag in the HTML head.",
    ),
    IssueDefinition(
        issue_id="metadata.title.too_short",
        check_id="metadata.title",
        category=IssueCategory.METADATA,
        severity=Severity.MEDIUM,
        priority=Priority.P2,
        title="Title tag is too short",
        summary="The page title is too short to describe the page clearly.",
    ),
    IssueDefinition(
        issue_id="metadata.description.missing",
        check_id="metadata.description",
        category=IssueCategory.METADATA,
        severity=Severity.MEDIUM,
        priority=Priority.P2,
        title="Meta description is missing",
        summary="The page does not expose a meta description in the HTML head.",
    ),
    IssueDefinition(
        issue_id="metadata.h1.missing",
        check_id="metadata.h1",
        category=IssueCategory.CONTENT,
        severity=Severity.MEDIUM,
        priority=Priority.P1,
        title="H1 is missing",
        summary="The page does not contain a primary H1 heading.",
    ),
    IssueDefinition(
        issue_id="metadata.h1.multiple",
        check_id="metadata.h1",
        category=IssueCategory.CONTENT,
        severity=Severity.LOW,
        priority=Priority.P3,
        title="Multiple H1 headings",
        summary="The page contains more than one H1 heading.",
    ),
    IssueDefinition(
        issue_id="metadata.canonical.missing",
        check_id="metadata.canonical",
        category=IssueCategory.INDEXABILITY,
        severity=Severity.LOW,
        priority=Priority.P3,
        title="Canonical link is missing",
        summary="The page does not declare a canonical URL.",
    ),
    IssueDefinition(
        issue_id="metadata.canonical.final_url_mismatch",
        check_id="metadata.canonical",
        category=IssueCategory.INDEXABILITY,
        severity=Severity.MEDIUM,
        priority=Priority.P1,
        title="Canonical does not match final URL",
        summary="The canonical URL differs from the final URL reached after redirects.",
    ),
    IssueDefinition(
        issue_id="indexability.robots_meta.noindex",
        check_id="indexability.robots_meta",
        category=IssueCategory.INDEXABILITY,
        severity=Severity.HIGH,
        priority=Priority.P0,
        title="Page is marked noindex",
        summary="The robots meta directives include noindex.",
    ),
    IssueDefinition(
        issue_id="metadata.open_graph.incomplete",
        check_id="metadata.open_graph",
        category=IssueCategory.METADATA,
        severity=Severity.LOW,
        priority=Priority.P3,
        title="Open Graph metadata is incomplete",
        summary="Open Graph metadata is present but lacks baseline sharing signals.",
    ),
    IssueDefinition(
        issue_id="structured_data.json_ld.invalid",
        check_id="structured_data.json_ld",
        category=IssueCategory.STRUCTURED_DATA,
        severity=Severity.MEDIUM,
        priority=Priority.P2,
        title="JSON-LD structured data is invalid",
        summary="One or more application/ld+json blocks cannot be parsed as JSON.",
    ),
    IssueDefinition(
        issue_id="security.headers.missing",
        check_id="security.headers",
        category=IssueCategory.SECURITY,
        severity=Severity.LOW,
        priority=Priority.P3,
        title="Security headers need attention",
        summary="One or more baseline security headers are missing or weak.",
    ),
    IssueDefinition(
        issue_id="crawlability.robots_txt.disallows_target",
        check_id="crawlability.robots_txt",
        category=IssueCategory.CRAWLABILITY,
        severity=Severity.HIGH,
        priority=Priority.P0,
        title="Robots.txt blocks the audited URL",
        summary="Robots.txt contains a Disallow rule matching the audited URL path.",
    ),
    IssueDefinition(
        issue_id="crawlability.sitemap_xml.missing",
        check_id="crawlability.sitemap_xml",
        category=IssueCategory.CRAWLABILITY,
        severity=Severity.LOW,
        priority=Priority.P3,
        title="Sitemap.xml was not discovered",
        summary="The default /sitemap.xml endpoint is not available for this origin.",
    ),
    IssueDefinition(
        issue_id="crawlability.sitemap_xml.invalid",
        check_id="crawlability.sitemap_xml",
        category=IssueCategory.CRAWLABILITY,
        severity=Severity.MEDIUM,
        priority=Priority.P2,
        title="Sitemap.xml is invalid",
        summary="The discovered sitemap.xml cannot be parsed as valid XML.",
    ),
    IssueDefinition(
        issue_id="crawlability.sitemap_xml.empty",
        check_id="crawlability.sitemap_xml",
        category=IssueCategory.CRAWLABILITY,
        severity=Severity.LOW,
        priority=Priority.P3,
        title="Sitemap.xml contains no URLs",
        summary="The discovered sitemap.xml does not expose loc entries.",
    ),
)

CHECKS_BY_ID = {definition.check_id: definition for definition in CHECK_DEFINITIONS}
ISSUES_BY_ID = {definition.issue_id: definition for definition in ISSUE_DEFINITIONS}


def get_check_definition(check_id: str) -> CheckDefinition:
    try:
        return CHECKS_BY_ID[check_id]
    except KeyError as exc:
        raise LookupError(f"Unknown audit check_id: {check_id}") from exc


def get_issue_definition(issue_id: str) -> IssueDefinition:
    try:
        return ISSUES_BY_ID[issue_id]
    except KeyError as exc:
        raise LookupError(f"Unknown audit issue_id: {issue_id}") from exc


def validate_taxonomy() -> None:
    check_ids = [definition.check_id for definition in CHECK_DEFINITIONS]
    if len(check_ids) != len(set(check_ids)):
        raise ValueError("Audit check definitions contain duplicate check_id values.")

    issue_ids = [definition.issue_id for definition in ISSUE_DEFINITIONS]
    if len(issue_ids) != len(set(issue_ids)):
        raise ValueError("Audit issue definitions contain duplicate issue_id values.")

    for issue in ISSUE_DEFINITIONS:
        check = get_check_definition(issue.check_id)
        if check.category is not issue.category:
            raise ValueError(
                f"Issue {issue.issue_id} category does not match check {check.check_id}."
            )
