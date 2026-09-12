from __future__ import annotations

from dataclasses import dataclass

import pytest

from webdiag_api.audit.fetcher import SafeFetchError, SafeFetchResult
from webdiag_api.crawl.executor import CrawlConfig, CrawlExecutionError, crawl_origin


@dataclass
class FixtureFetcher:
    responses: dict[str, SafeFetchResult | Exception]

    def __post_init__(self) -> None:
        self.requests: list[tuple[str, str | None]] = []

    def fetch(
        self,
        raw_url: str,
        *,
        read_body: bool = True,
        extra_headers=None,
        allowed_origin: str | None = None,
        redirect_validator=None,
    ) -> SafeFetchResult:
        assert read_body is True
        assert extra_headers is None
        self.requests.append((raw_url, allowed_origin))
        response = self.responses.get(raw_url)
        if isinstance(response, Exception):
            raise response
        if response is None:
            raise AssertionError(f"unexpected fetch: {raw_url}")
        return response


def fetched(
    url: str,
    body: str,
    *,
    status: int = 200,
    content_type: str = "text/html; charset=utf-8",
) -> SafeFetchResult:
    return SafeFetchResult(
        requested_url=url,
        final_url=url,
        status_code=status,
        headers={"content-type": content_type},
        body_text=body,
        content_type=content_type,
        redirect_chain=(),
    )


def test_crawl_is_same_origin_query_free_robots_aware_and_projects_site_findings() -> None:
    origin = "https://example.com"
    root = """
      <html><head><title>Home</title><meta name="description" content="Welcome"></head>
      <body>
        <a href="/about?session=secret#team">About</a>
        <a href="/duplicate">Duplicate</a>
        <a href="/blocked">Blocked</a>
        <a href="https://outside.example/path">Outside</a>
      </body></html>
    """
    duplicate = (
        '<html><head><title>Same title</title>'
        '<meta name="description" content="Same description"></head></html>'
    )
    fetcher = FixtureFetcher(
        {
            f"{origin}/robots.txt": fetched(
                f"{origin}/robots.txt",
                "User-agent: webdiagbot\nDisallow: /blocked\nSitemap: https://example.com/sitemap.xml",
                content_type="text/plain",
            ),
            f"{origin}/sitemap.xml": fetched(
                f"{origin}/sitemap.xml",
                """<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
                <url><loc>https://example.com/</loc></url>
                <url><loc>https://example.com/about?tracking=secret</loc></url>
                <url><loc>https://example.com/duplicate</loc></url>
                <url><loc>https://example.com/orphan?token=secret</loc></url>
                <url><loc>https://outside.example/not-ours</loc></url>
                </urlset>""",
                content_type="application/xml",
            ),
            f"{origin}/": fetched(f"{origin}/", root),
            f"{origin}/about": fetched(f"{origin}/about", duplicate),
            f"{origin}/duplicate": fetched(f"{origin}/duplicate", duplicate),
        }
    )

    result = crawl_origin(
        origin,
        fetcher=fetcher,
        config=CrawlConfig(page_limit=25, deadline_seconds=60),
    )

    assert [page.url for page in result.pages] == [
        f"{origin}/",
        f"{origin}/about",
        f"{origin}/duplicate",
    ]
    assert result.pages[0].internal_links == (
        f"{origin}/about",
        f"{origin}/duplicate",
        f"{origin}/blocked",
    )
    assert result.sitemap_url == f"{origin}/sitemap.xml"
    assert result.sitemap_url_count == 4
    assert result.orphan_urls == (f"{origin}/orphan",)
    assert result.duplicate_titles[0].urls == (
        f"{origin}/about",
        f"{origin}/duplicate",
    )
    assert result.duplicate_descriptions[0].value == "Same description"
    assert result.page_budget_exhausted is False
    assert result.contract_version == "webdiag.site_audit.result.v1"
    assert result.audit_summary.pages_audited == 3
    assert result.audit_summary.pages_with_issues == 3
    assert result.audit_summary.unique_issue_count == len(result.issues)
    assert result.audit_summary.issue_occurrence_count == sum(
        issue.affected_url_count for issue in result.issues
    )
    assert all(page.audit_score is not None for page in result.pages)
    duplicate_title = next(
        issue for issue in result.issues if issue.issue_id == "site.metadata.duplicate_title"
    )
    assert duplicate_title.affected_urls == (
        f"{origin}/about",
        f"{origin}/duplicate",
    )
    assert duplicate_title.affected_url_count == 2
    assert all(allowed == origin for _url, allowed in fetcher.requests)
    assert not any("secret" in url for url, _allowed in fetcher.requests)
    assert not any(url.endswith("/blocked") for url, _allowed in fetcher.requests)
    assert not any("outside.example" in url for url, _allowed in fetcher.requests)


def test_crawl_robots_policy_is_applied_to_redirect_targets_before_request() -> None:
    origin = "https://example.com"

    @dataclass
    class RedirectAwareFetcher(FixtureFetcher):
        def fetch(self, raw_url: str, **kwargs) -> SafeFetchResult:
            if raw_url == f"{origin}/go-private":
                validator = kwargs.get("redirect_validator")
                assert callable(validator)
                validator(f"{origin}/private")
                raise AssertionError("redirect target should be rejected")
            return super().fetch(raw_url, **kwargs)

    fetcher = RedirectAwareFetcher(
        {
            f"{origin}/robots.txt": fetched(
                f"{origin}/robots.txt",
                "User-agent: *\nDisallow: /private",
                content_type="text/plain",
            ),
            f"{origin}/sitemap.xml": SafeFetchError("missing"),
            f"{origin}/": fetched(
                f"{origin}/",
                '<html><head><title>Home</title></head><a href="/go-private">Go</a></html>',
            ),
        }
    )

    result = crawl_origin(origin, fetcher=fetcher, config=CrawlConfig())

    assert [failure.model_dump() for failure in result.page_failures] == [
        {"url": f"{origin}/go-private", "code": "fetch_failed"},
    ]


def test_crawl_reports_page_budget_without_labelling_reachable_urls_as_orphans() -> None:
    origin = "https://example.com"
    fetcher = FixtureFetcher(
        {
            f"{origin}/robots.txt": SafeFetchError("unavailable"),
            f"{origin}/sitemap.xml": fetched(
                f"{origin}/sitemap.xml",
                "<urlset><url><loc>https://example.com/next</loc></url></urlset>",
                content_type="application/xml",
            ),
            f"{origin}/": fetched(
                f"{origin}/",
                '<html><head><title>Home</title></head><a href="/next">Next</a></html>',
            ),
        }
    )

    result = crawl_origin(
        origin,
        fetcher=fetcher,
        config=CrawlConfig(page_limit=1, deadline_seconds=60),
    )

    assert len(result.pages) == 1
    assert result.page_budget_exhausted is True
    assert result.orphan_urls == ()


def test_incomplete_crawl_does_not_claim_sitemap_only_urls_are_orphans() -> None:
    origin = "https://example.com"
    fetcher = FixtureFetcher(
        {
            f"{origin}/robots.txt": SafeFetchError("unavailable"),
            f"{origin}/sitemap.xml": fetched(
                f"{origin}/sitemap.xml",
                "<urlset><url><loc>https://example.com/not-yet-seen</loc></url></urlset>",
                content_type="application/xml",
            ),
            f"{origin}/": fetched(
                f"{origin}/",
                '<html><head><title>Home</title></head><a href="/next">Next</a></html>',
            ),
        }
    )

    result = crawl_origin(
        origin,
        fetcher=fetcher,
        config=CrawlConfig(page_limit=1, deadline_seconds=60),
    )

    assert result.page_budget_exhausted is True
    assert result.orphan_urls == ()
    assert not any(
        issue.issue_id == "site.crawlability.orphan_candidate" for issue in result.issues
    )


def test_site_audit_groups_page_findings_and_failed_urls_without_losing_severity() -> None:
    origin = "https://example.com"
    fetcher = FixtureFetcher(
        {
            f"{origin}/robots.txt": SafeFetchError("unavailable"),
            f"{origin}/sitemap.xml": SafeFetchError("missing"),
            f"{origin}/": fetched(
                f"{origin}/",
                '<html><head></head><body><a href="/missing">Missing</a></body></html>',
            ),
            f"{origin}/missing": SafeFetchError("connection failed"),
        }
    )

    result = crawl_origin(origin, fetcher=fetcher, config=CrawlConfig())

    missing_title = next(
        issue for issue in result.issues if issue.issue_id == "metadata.title.missing"
    )
    fetch_failure = next(
        issue for issue in result.issues if issue.issue_id == "site.http.fetch_failed"
    )
    assert missing_title.affected_urls == (f"{origin}/",)
    assert missing_title.severity.value == "medium"
    assert fetch_failure.affected_urls == (f"{origin}/missing",)
    assert fetch_failure.severity.value == "high"
    assert result.audit_summary.occurrences_by_severity.high == 1
    assert result.audit_summary.occurrences_by_severity.medium >= 1


def test_crawl_fails_closed_when_root_is_disallowed_or_not_html() -> None:
    origin = "https://example.com"
    disallowed = FixtureFetcher(
        {
            f"{origin}/robots.txt": fetched(
                f"{origin}/robots.txt",
                "User-agent: *\nDisallow: /",
                content_type="text/plain",
            ),
            f"{origin}/sitemap.xml": SafeFetchError("missing"),
        }
    )
    with pytest.raises(CrawlExecutionError, match="crawl_root_disallowed"):
        crawl_origin(origin, fetcher=disallowed, config=CrawlConfig())

    non_html = FixtureFetcher(
        {
            f"{origin}/robots.txt": SafeFetchError("missing"),
            f"{origin}/sitemap.xml": SafeFetchError("missing"),
            f"{origin}/": fetched(
                f"{origin}/",
                "binary",
                content_type="application/octet-stream",
            ),
        }
    )
    with pytest.raises(CrawlExecutionError, match="crawl_root_not_html"):
        crawl_origin(origin, fetcher=non_html, config=CrawlConfig())


def test_crawl_does_not_treat_sitemap_index_children_as_page_urls() -> None:
    origin = "https://example.com"
    fetcher = FixtureFetcher(
        {
            f"{origin}/robots.txt": SafeFetchError("missing"),
            f"{origin}/sitemap.xml": fetched(
                f"{origin}/sitemap.xml",
                """<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
                <sitemap><loc>https://example.com/posts-sitemap.xml</loc></sitemap>
                </sitemapindex>""",
                content_type="application/xml",
            ),
            f"{origin}/": fetched(
                f"{origin}/",
                "<html><head><title>Home</title></head></html>",
            ),
        }
    )

    result = crawl_origin(origin, fetcher=fetcher, config=CrawlConfig())

    assert result.sitemap_url is None
    assert result.sitemap_url_count == 0
    assert result.orphan_urls == ()
