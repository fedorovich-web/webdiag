from __future__ import annotations

import time
from collections import defaultdict, deque
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit, urlunsplit
from uuid import UUID
from xml.etree import ElementTree

from webdiag_api.audit.fetcher import SafeFetchError, SafeFetchResult, SafeHttpFetcher
from webdiag_api.audit.html_metadata import parse_html_metadata
from webdiag_api.audit.models import (
    AuditIssue,
    AuditTarget,
    IssueCategory,
    Priority,
    Recommendation,
    Severity,
)
from webdiag_api.audit.report import assemble_single_page_report
from webdiag_api.audit.robots import analyze_robots_txt
from webdiag_api.audit.sitemap import parse_sitemap_xml
from webdiag_api.crawl.models import (
    AuditedCrawlPage,
    CrawlDuplicateGroup,
    CrawlPageFailure,
    CrawlSeverityCounts,
    SiteAuditIssue,
    SiteAuditResult,
    SiteAuditSummary,
)
from webdiag_api.security.url_policy import UrlPolicyError, validate_url


class CrawlExecutionError(RuntimeError):
    pass


@dataclass(frozen=True, slots=True)
class CrawlConfig:
    page_limit: int = 25
    deadline_seconds: int = 60

    def __post_init__(self) -> None:
        if not 1 <= self.page_limit <= 25:
            raise ValueError("crawl page limit must be between 1 and 25")
        if not 10 <= self.deadline_seconds <= 120:
            raise ValueError("crawl deadline must be between 10 and 120 seconds")


class _LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.hrefs: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "a":
            return
        for key, value in attrs:
            if key.lower() == "href" and value:
                self.hrefs.append(value)
                return


def crawl_origin(
    origin: str,
    *,
    fetcher: SafeHttpFetcher,
    config: CrawlConfig,
    monotonic: Callable[[], float] = time.monotonic,
) -> SiteAuditResult:
    normalized_origin = _origin(origin)
    started = monotonic()
    robots_url = f"{normalized_origin}/robots.txt"
    robots_body = ""
    robots_status: int | None = None
    sitemap_candidates: list[str] = []
    try:
        robots = fetcher.fetch(
            robots_url,
            allowed_origin=normalized_origin,
            redirect_validator=lambda url: _require_robots_allowed(
                url,
                robots_body="",
                robots_url=robots_url,
                robots_status=None,
            ),
        )
        robots_body = robots.body_text
        robots_status = robots.status_code
        root_policy = analyze_robots_txt(
            robots_body,
            robots_url=robots_url,
            target_url=f"{normalized_origin}/",
            status_code=robots_status,
        )
        sitemap_candidates.extend(root_policy.sitemap_urls)
        if root_policy.allows_target is False:
            raise CrawlExecutionError("crawl_root_disallowed")
    except (SafeFetchError, UrlPolicyError):
        pass

    sitemap_candidates.append(f"{normalized_origin}/sitemap.xml")
    sitemap_url, sitemap_urls, sitemap_count = _load_sitemap(
        sitemap_candidates,
        origin=normalized_origin,
        fetcher=fetcher,
    )

    queue: deque[str] = deque((f"{normalized_origin}/",))
    queued = set(queue)
    discovered = set(queue)
    visited: set[str] = set()
    pages: list[AuditedCrawlPage] = []
    failures: list[CrawlPageFailure] = []
    issue_urls: dict[str, tuple[AuditIssue, list[str]]] = {}

    while queue and len(pages) + len(failures) < config.page_limit:
        if monotonic() - started >= config.deadline_seconds:
            break
        url = queue.popleft()
        queued.discard(url)
        visited.add(url)
        if not _robots_allows(
            url,
            robots_body=robots_body,
            robots_url=robots_url,
            robots_status=robots_status,
        ):
            if url == f"{normalized_origin}/":
                raise CrawlExecutionError("crawl_root_disallowed")
            failures.append(CrawlPageFailure(url=url, code="robots_disallowed"))
            continue
        try:
            response = fetcher.fetch(
                url,
                allowed_origin=normalized_origin,
                redirect_validator=lambda target: _require_robots_allowed(
                    target,
                    robots_body=robots_body,
                    robots_url=robots_url,
                    robots_status=robots_status,
                ),
            )
        except (SafeFetchError, UrlPolicyError):
            if url == f"{normalized_origin}/":
                raise CrawlExecutionError("crawl_root_fetch_failed") from None
            failures.append(CrawlPageFailure(url=url, code="fetch_failed"))
            continue
        if not _is_html(response.content_type):
            if url == f"{normalized_origin}/":
                raise CrawlExecutionError("crawl_root_not_html")
            failures.append(CrawlPageFailure(url=url, code="not_html"))
            continue
        if url == f"{normalized_origin}/" and not 200 <= response.status_code < 400:
            raise CrawlExecutionError("crawl_root_fetch_failed")

        final_url = _same_origin_url(response.final_url, normalized_origin)
        if final_url is None:
            raise CrawlExecutionError("crawl_origin_changed")
        metadata = parse_html_metadata(response.body_text)
        internal_links = _internal_links(
            response.body_text,
            base_url=final_url,
            origin=normalized_origin,
        )
        discovered.update(internal_links)
        for link in internal_links:
            if link not in visited and link not in queued:
                queue.append(link)
                queued.add(link)
        page_score, page_issues, severity_counts = _audit_page(response)
        for issue in page_issues:
            existing = issue_urls.get(issue.issue_id)
            if existing is None:
                issue_urls[issue.issue_id] = (issue, [final_url])
            elif final_url not in existing[1]:
                existing[1].append(final_url)
        pages.append(
            AuditedCrawlPage(
                url=final_url,
                status_code=response.status_code,
                title=metadata.title,
                meta_description=metadata.meta_description,
                internal_links=internal_links[:100],
                audit_score=page_score,
                issue_count=len(page_issues),
                issues_by_severity=severity_counts,
            )
        )

    root_url = f"{normalized_origin}/"
    page_budget_exhausted = bool(queue)
    orphan_urls = (
        ()
        if page_budget_exhausted
        else tuple(sorted((set(sitemap_urls) - discovered) - {root_url}))[:100]
    )
    duplicate_titles = _duplicate_groups(pages, "title")
    duplicate_descriptions = _duplicate_groups(pages, "meta_description")
    issues = _site_issues(
        issue_urls,
        failures=failures,
        duplicate_titles=duplicate_titles,
        duplicate_descriptions=duplicate_descriptions,
        orphan_urls=orphan_urls,
    )
    return SiteAuditResult(
        origin=normalized_origin,
        pages=tuple(pages),
        page_failures=tuple(failures),
        page_limit=config.page_limit,
        page_budget_exhausted=page_budget_exhausted,
        sitemap_url=sitemap_url,
        sitemap_url_count=sitemap_count,
        duplicate_titles=duplicate_titles,
        duplicate_descriptions=duplicate_descriptions,
        orphan_urls=orphan_urls,
        audit_summary=_audit_summary(pages, issues),
        issues=issues,
    )


def _origin(raw_origin: str) -> str:
    validated = validate_url(raw_origin)
    parsed = urlsplit(validated.normalized)
    if parsed.path not in {"", "/"} or parsed.query or parsed.fragment:
        raise CrawlExecutionError("crawl_origin_invalid")
    return urlunsplit((parsed.scheme, parsed.netloc, "", "", ""))


def _same_origin_url(raw_url: str, origin: str) -> str | None:
    if len(raw_url) > 2_048 or any(ord(character) < 0x20 for character in raw_url):
        return None
    try:
        parsed = urlsplit(raw_url)
        sanitized = urlunsplit((parsed.scheme, parsed.netloc, parsed.path or "/", "", ""))
        validated = validate_url(sanitized)
        target = urlsplit(origin)
        value = urlsplit(validated.normalized)
    except (UrlPolicyError, ValueError):
        return None
    if (value.scheme, value.netloc) != (target.scheme, target.netloc):
        return None
    return urlunsplit((value.scheme, value.netloc, value.path or "/", "", ""))


def _internal_links(body: str, *, base_url: str, origin: str) -> tuple[str, ...]:
    parser = _LinkParser()
    parser.feed(body)
    parser.close()
    output: list[str] = []
    seen: set[str] = set()
    for href in parser.hrefs:
        url = _same_origin_url(urljoin(base_url, href), origin)
        if url is not None and url not in seen:
            seen.add(url)
            output.append(url)
    return tuple(output)


def _robots_allows(
    url: str,
    *,
    robots_body: str,
    robots_url: str,
    robots_status: int | None,
) -> bool:
    if robots_status is None:
        return True
    return (
        analyze_robots_txt(
            robots_body,
            robots_url=robots_url,
            target_url=url,
            status_code=robots_status,
        ).allows_target
        is not False
    )


def _require_robots_allowed(
    url: str,
    *,
    robots_body: str,
    robots_url: str,
    robots_status: int | None,
) -> None:
    if not _robots_allows(
        url,
        robots_body=robots_body,
        robots_url=robots_url,
        robots_status=robots_status,
    ):
        raise UrlPolicyError("URL is disallowed by robots.txt.")


def _load_sitemap(
    candidates: list[str],
    *,
    origin: str,
    fetcher: SafeHttpFetcher,
) -> tuple[str | None, tuple[str, ...], int]:
    for raw_url in dict.fromkeys(candidates):
        sitemap_url = _same_origin_url(raw_url, origin)
        if sitemap_url is None:
            continue
        try:
            response = fetcher.fetch(sitemap_url, allowed_origin=origin)
        except (SafeFetchError, UrlPolicyError):
            continue
        summary = parse_sitemap_xml(
            response.body_text,
            sitemap_url=sitemap_url,
            target_url=f"{origin}/",
            status_code=response.status_code,
        )
        if not summary.available or not summary.valid_xml:
            continue
        try:
            root = ElementTree.fromstring(response.body_text.encode("utf-8"))
        except ElementTree.ParseError:
            continue
        if root.tag.rsplit("}", maxsplit=1)[-1] != "urlset":
            continue
        clean = tuple(
            dict.fromkeys(
                url
                for value in summary.loc_urls[:10_000]
                if (url := _same_origin_url(value, origin)) is not None
            )
        )
        return sitemap_url, clean, len(clean)
    return None, (), 0


def _is_html(content_type: str | None) -> bool:
    value = (content_type or "").split(";", maxsplit=1)[0].strip().lower()
    return value in {"text/html", "application/xhtml+xml"}


def _duplicate_groups(
    pages: Sequence[AuditedCrawlPage], field: str
) -> tuple[CrawlDuplicateGroup, ...]:
    grouped: dict[str, list[tuple[str, str]]] = defaultdict(list)
    for page in pages:
        value = getattr(page, field)
        if value:
            grouped[value.casefold()].append((value, page.url))
    return tuple(
        CrawlDuplicateGroup(value=rows[0][0], urls=tuple(url for _value, url in rows))
        for _key, rows in sorted(grouped.items())
        if len(rows) > 1
    )[:25]


def _audit_page(
    response: SafeFetchResult,
) -> tuple[int, tuple[AuditIssue, ...], CrawlSeverityCounts]:
    parsed = urlsplit(response.final_url)
    if not parsed.hostname:
        raise CrawlExecutionError("crawl_page_audit_failed")
    report = assemble_single_page_report(
        job_id=UUID(int=0),
        target=AuditTarget(
            original_url=response.requested_url,
            normalized_url=response.final_url,
            hostname=parsed.hostname,
        ),
        fetched=response,
    )
    if report.score is None:
        raise CrawlExecutionError("crawl_page_audit_failed")
    return report.score, report.issues, _severity_counts(report.issues)


def _severity_counts(issues: Sequence[AuditIssue | SiteAuditIssue]) -> CrawlSeverityCounts:
    counts = {severity: 0 for severity in Severity}
    for issue in issues:
        counts[issue.severity] += (
            issue.affected_url_count if isinstance(issue, SiteAuditIssue) else 1
        )
    return CrawlSeverityCounts(
        critical=counts[Severity.CRITICAL],
        high=counts[Severity.HIGH],
        medium=counts[Severity.MEDIUM],
        low=counts[Severity.LOW],
        info=counts[Severity.INFO],
    )


def _site_issues(
    issue_urls: dict[str, tuple[AuditIssue, list[str]]],
    *,
    failures: Sequence[CrawlPageFailure],
    duplicate_titles: Sequence[CrawlDuplicateGroup],
    duplicate_descriptions: Sequence[CrawlDuplicateGroup],
    orphan_urls: Sequence[str],
) -> tuple[SiteAuditIssue, ...]:
    issues = [
        SiteAuditIssue(
            issue_id=issue.issue_id,
            check_id=issue.check_id,
            category=issue.category,
            severity=issue.severity,
            priority=issue.priority,
            title=issue.title,
            description=issue.description,
            affected_urls=tuple(urls),
            affected_url_count=len(urls),
            recommendation=issue.recommendation,
        )
        for issue, urls in issue_urls.values()
    ]
    issues.extend(_crawl_failure_issues(failures))
    issues.extend(
        _duplicate_issues(
            duplicate_titles,
            issue_id="site.metadata.duplicate_title",
            title="Duplicate page titles",
            description="Multiple audited pages use the same title element.",
            severity=Severity.MEDIUM,
            summary="Give every indexable page a distinct, descriptive title.",
        )
    )
    issues.extend(
        _duplicate_issues(
            duplicate_descriptions,
            issue_id="site.metadata.duplicate_description",
            title="Duplicate meta descriptions",
            description="Multiple audited pages use the same meta description.",
            severity=Severity.LOW,
            summary="Write a distinct meta description for each important page.",
        )
    )
    if orphan_urls:
        issues.append(
            SiteAuditIssue(
                issue_id="site.crawlability.orphan_candidate",
                check_id="site.crawlability.internal_links",
                category=IssueCategory.CRAWLABILITY,
                severity=Severity.MEDIUM,
                priority=Priority.P2,
                title="Sitemap URLs without discovered internal links",
                description=(
                    "These sitemap URLs were not found in links from the fully audited "
                    "page set. They are candidates for an internal-linking review."
                ),
                affected_urls=tuple(orphan_urls[:25]),
                affected_url_count=min(len(orphan_urls), 25),
                recommendation=Recommendation(
                    summary="Review navigation and contextual links to these sitemap URLs.",
                    steps=(
                        "Confirm that each URL should remain indexable.",
                        "Add a relevant internal link from an audited, discoverable page.",
                        "Run the site audit again and verify that the URL is discovered.",
                    ),
                    expected_impact="Improves discoverability without claiming indexation.",
                ),
            )
        )
    priority_rank = {priority: index for index, priority in enumerate(Priority)}
    severity_rank = {
        Severity.CRITICAL: 0,
        Severity.HIGH: 1,
        Severity.MEDIUM: 2,
        Severity.LOW: 3,
        Severity.INFO: 4,
    }
    return tuple(
        sorted(
            issues,
            key=lambda issue: (
                priority_rank[issue.priority],
                severity_rank[issue.severity],
                issue.issue_id,
                issue.affected_urls,
            ),
        )[:100]
    )


def _crawl_failure_issues(
    failures: Sequence[CrawlPageFailure],
) -> tuple[SiteAuditIssue, ...]:
    policies = {
        "fetch_failed": (
            "site.http.fetch_failed",
            IssueCategory.HTTP,
            Severity.HIGH,
            Priority.P1,
            "Pages could not be fetched",
            "The crawler could not obtain a verifiable response for these discovered URLs.",
            "Restore a stable public HTTP response for each affected URL.",
        ),
        "robots_disallowed": (
            "site.crawlability.robots_disallowed",
            IssueCategory.CRAWLABILITY,
            Severity.INFO,
            Priority.P3,
            "Pages excluded by robots.txt",
            "The crawler did not request these discovered URLs because robots.txt disallows them.",
            "Confirm that each robots.txt exclusion is intentional.",
        ),
        "not_html": (
            "site.http.non_html",
            IssueCategory.HTTP,
            Severity.INFO,
            Priority.P3,
            "Discovered URLs are not HTML pages",
            "These discovered URLs returned a non-HTML content type and were not page-audited.",
            "Confirm that the non-HTML response is intended for each URL.",
        ),
    }
    grouped: dict[str, list[str]] = defaultdict(list)
    for failure in failures:
        grouped[failure.code].append(failure.url)
    output: list[SiteAuditIssue] = []
    for code, urls in grouped.items():
        issue_id, category, severity, priority, title, description, summary = policies[code]
        output.append(
            SiteAuditIssue(
                issue_id=issue_id,
                check_id=issue_id.rsplit(".", maxsplit=1)[0],
                category=category,
                severity=severity,
                priority=priority,
                title=title,
                description=description,
                affected_urls=tuple(urls[:25]),
                affected_url_count=min(len(urls), 25),
                recommendation=Recommendation(
                    summary=summary,
                    steps=(
                        "Inspect the server or robots.txt configuration for the affected URL.",
                        "Run the site audit again and verify the measured response.",
                    ),
                ),
            )
        )
    return tuple(output)


def _duplicate_issues(
    groups: Sequence[CrawlDuplicateGroup],
    *,
    issue_id: str,
    title: str,
    description: str,
    severity: Severity,
    summary: str,
) -> tuple[SiteAuditIssue, ...]:
    urls = tuple(dict.fromkeys(url for group in groups for url in group.urls))[:25]
    if not urls:
        return ()
    return (
        SiteAuditIssue(
            issue_id=issue_id,
            check_id="site.metadata.uniqueness",
            category=IssueCategory.METADATA,
            severity=severity,
            priority=Priority.P2 if severity is Severity.MEDIUM else Priority.P3,
            title=title,
            description=description,
            affected_urls=urls,
            affected_url_count=len(urls),
            recommendation=Recommendation(
                summary=summary,
                steps=(
                    "Review the search intent and purpose of every affected page.",
                    "Replace repeated metadata with page-specific text.",
                    "Run the site audit again and verify that the duplicate group is gone.",
                ),
            ),
        ),
    )


def _audit_summary(
    pages: Sequence[AuditedCrawlPage],
    issues: Sequence[SiteAuditIssue],
) -> SiteAuditSummary:
    return SiteAuditSummary(
        pages_audited=len(pages),
        pages_with_issues=sum(page.issue_count > 0 for page in pages),
        unique_issue_count=len(issues),
        issue_occurrence_count=sum(issue.affected_url_count for issue in issues),
        occurrences_by_severity=_severity_counts(issues),
    )
