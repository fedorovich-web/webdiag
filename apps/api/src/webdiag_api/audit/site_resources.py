from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urljoin, urlsplit, urlunsplit

from webdiag_api.audit.fetcher import SafeFetchError, SafeHttpFetcher
from webdiag_api.audit.robots import RobotsTxtSummary, analyze_robots_txt
from webdiag_api.audit.sitemap import SitemapXmlSummary, parse_sitemap_xml


@dataclass(frozen=True, slots=True)
class SiteResourceFetch:
    url: str
    status_code: int | None
    body_text: str
    content_type: str | None
    fetch_error: str | None = None

    @property
    def was_fetched(self) -> bool:
        return self.status_code is not None

    @property
    def is_success(self) -> bool:
        return self.status_code is not None and 200 <= self.status_code < 300


@dataclass(frozen=True, slots=True)
class SiteResourceReport:
    robots: RobotsTxtSummary
    sitemap: SitemapXmlSummary


def collect_site_resources(
    *,
    fetcher: SafeHttpFetcher,
    target_url: str,
    final_url: str,
) -> SiteResourceReport:
    """Fetch same-origin robots.txt and sitemap.xml for single-page audit context.

    This is not a crawler. It only collects the two stable origin-level resources needed
    to enrich a single URL report without expanding audit scope to multiple pages.
    """
    origin = _origin_from_url(final_url)
    robots_url = urljoin(origin, "/robots.txt")
    default_sitemap_url = urljoin(origin, "/sitemap.xml")

    robots_fetch = _try_fetch(fetcher=fetcher, url=robots_url)
    robots = analyze_robots_txt(
        robots_fetch.body_text,
        robots_url=robots_url,
        target_url=target_url,
        status_code=robots_fetch.status_code,
        fetch_error=robots_fetch.fetch_error,
    )

    sitemap_url = _select_sitemap_url(
        declared_sitemap_urls=robots.sitemap_urls,
        default_sitemap_url=default_sitemap_url,
    )
    sitemap_fetch = _try_fetch(fetcher=fetcher, url=sitemap_url)
    sitemap = parse_sitemap_xml(
        sitemap_fetch.body_text,
        sitemap_url=sitemap_url,
        target_url=target_url,
        status_code=sitemap_fetch.status_code,
        fetch_error=sitemap_fetch.fetch_error,
    )
    return SiteResourceReport(robots=robots, sitemap=sitemap)


def _try_fetch(*, fetcher: SafeHttpFetcher, url: str) -> SiteResourceFetch:
    try:
        fetched = fetcher.fetch(url)
    except SafeFetchError as exc:
        return SiteResourceFetch(
            url=url,
            status_code=None,
            body_text="",
            content_type=None,
            fetch_error=str(exc),
        )
    return SiteResourceFetch(
        url=url,
        status_code=fetched.status_code,
        body_text=fetched.body_text,
        content_type=fetched.content_type,
    )


def _origin_from_url(raw_url: str) -> str:
    parsed = urlsplit(raw_url)
    return urlunsplit((parsed.scheme, parsed.netloc, "/", "", ""))


def _select_sitemap_url(
    *,
    declared_sitemap_urls: tuple[str, ...],
    default_sitemap_url: str,
) -> str:
    for sitemap_url in declared_sitemap_urls:
        parsed = urlsplit(sitemap_url)
        if parsed.scheme in {"http", "https"} and parsed.netloc:
            return sitemap_url
    return default_sitemap_url
