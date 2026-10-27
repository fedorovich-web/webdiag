from __future__ import annotations

import httpx
import pytest
from test_audit_fetcher import streaming_response
from test_crawl_executor import FixtureFetcher, fetched

from webdiag_api.audit.fetcher import SafeFetchError, SafeHttpFetcher
from webdiag_api.crawl.executor import CrawlConfig, CrawlExecutionError, crawl_origin

ORIGIN = "https://example.com"


def responses():
    return {
        f"{ORIGIN}/robots.txt": fetched(
            f"{ORIGIN}/robots.txt", "", status=404, content_type="text/plain"
        ),
        f"{ORIGIN}/sitemap.xml": fetched(
            f"{ORIGIN}/sitemap.xml", "<urlset/>", content_type="application/xml"
        ),
        f"{ORIGIN}/": fetched(f"{ORIGIN}/", "<html><title>Home</title></html>"),
    }


@pytest.mark.parametrize("status", [500, 503, 599, None])
def test_unreachable_robots_stops_before_sitemap_or_page_requests(status) -> None:
    fixtures = responses()
    fixtures[f"{ORIGIN}/robots.txt"] = (
        SafeFetchError("private network diagnostic")
        if status is None
        else fetched(f"{ORIGIN}/robots.txt", "error", status=status)
    )
    fetcher = FixtureFetcher(fixtures)
    with pytest.raises(CrawlExecutionError, match="^crawl_robots_unavailable$"):
        crawl_origin(ORIGIN, fetcher=fetcher, config=CrawlConfig())
    assert fetcher.requests == [(f"{ORIGIN}/robots.txt", ORIGIN)]


@pytest.mark.parametrize("status", [200, 403, 404])
def test_empty_or_missing_robots_does_not_prevent_the_page_audit(status) -> None:
    fixtures = responses()
    fixtures[f"{ORIGIN}/robots.txt"] = fetched(
        f"{ORIGIN}/robots.txt", "", status=status, content_type="text/plain"
    )
    result = crawl_origin(ORIGIN, fetcher=FixtureFetcher(fixtures), config=CrawlConfig())
    assert len(result.pages) == 1


def test_sitemap_requests_respect_robots_rules() -> None:
    fixtures = responses()
    fixtures[f"{ORIGIN}/robots.txt"] = fetched(
        f"{ORIGIN}/robots.txt",
        f"User-agent: *\nDisallow: /sitemap.xml\nSitemap: {ORIGIN}/sitemap.xml",
    )
    fetcher = FixtureFetcher(fixtures)
    result = crawl_origin(ORIGIN, fetcher=fetcher, config=CrawlConfig())
    assert f"{ORIGIN}/sitemap.xml" not in [url for url, _ in fetcher.requests]
    assert result.sitemap_complete is False
    assert len(result.pages) == 1


@pytest.mark.parametrize("redirect", [False, True], ids=["child-sitemap", "redirect-target"])
def test_sitemap_child_and_redirect_do_not_request_a_disallowed_url(redirect) -> None:
    requested = []

    def handle(request):
        path = request.url.path
        requested.append(path)
        if path == "/robots.txt":
            return streaming_response(
                200, request=request, content=b"User-agent: *\nDisallow: /private.xml"
            )
        if path == "/sitemap.xml":
            if redirect:
                return streaming_response(
                    302, request=request, headers={"location": "/private.xml"}
                )
            return streaming_response(200, request=request, content=(
                f"<sitemapindex><sitemap><loc>{ORIGIN}/private.xml</loc>"
                "</sitemap></sitemapindex>"
            ).encode())
        if path == "/":
            return streaming_response(
                200, request=request, content=b"<title>Home</title>",
                headers={"content-type": "text/html"},
            )
        raise AssertionError(f"Unexpected request: {path}")

    fetcher = SafeHttpFetcher(
        resolver=lambda hostname, port: ["93.184.216.34"],
        peer_address_provider=lambda response: ["93.184.216.34"],
        transport=httpx.MockTransport(handle),
    )
    result = crawl_origin(ORIGIN, fetcher=fetcher, config=CrawlConfig())
    assert "/private.xml" not in requested
    assert result.sitemap_complete is False
    assert len(result.pages) == 1


@pytest.mark.parametrize("inert_links", [
    '<template><a href="/target">Inert</a></template>',
    '<template><template><a href="/target">Nested</a></template>'
    '<a href="/target">Still inert</a></template>',
    '<template>' + '<a href="/target">Inert</a>' * 501 + '</template>',
    '<template/>' + '<a href="/target">Inert</a>' * 501 + '</template>',
], ids=["template", "nested-template", "inert-link-budget", "html-self-closing-template"])
def test_template_links_do_not_change_discovery_or_exhaust_link_budget(inert_links) -> None:
    fixtures = responses()
    fixtures[f"{ORIGIN}/"] = fetched(
        f"{ORIGIN}/", inert_links + '<a href="/visible">Visible</a>'
    )
    fixtures[f"{ORIGIN}/sitemap.xml"] = fetched(
        f"{ORIGIN}/sitemap.xml",
        f"<urlset><url><loc>{ORIGIN}/target</loc></url></urlset>",
        content_type="application/xml",
    )
    fixtures[f"{ORIGIN}/target"] = fetched(f"{ORIGIN}/target", "<title>Target</title>")
    fixtures[f"{ORIGIN}/visible"] = fetched(f"{ORIGIN}/visible", "<title>Visible</title>")
    result = crawl_origin(ORIGIN, fetcher=FixtureFetcher(fixtures), config=CrawlConfig())
    assert result.pages[0].internal_links == (f"{ORIGIN}/visible",)
    assert result.page_budget_exhausted is False
    assert result.orphan_urls == (f"{ORIGIN}/target",)
    assert len(result.pages) == 3


@pytest.mark.parametrize("first_href", ['href=""', 'href'])
def test_first_empty_href_uses_document_base_and_ignores_duplicate_attributes(first_href) -> None:
    fixtures = responses()
    fixtures[f"{ORIGIN}/"] = fetched(
        f"{ORIGIN}/",
        f'<base href="/section"><a {first_href} href="/invented">Link</a>',
    )
    fixtures[f"{ORIGIN}/section"] = fetched(f"{ORIGIN}/section", "<title>Section</title>")
    fixtures[f"{ORIGIN}/invented"] = fetched(f"{ORIGIN}/invented", "<title>Invented</title>")
    fetcher = FixtureFetcher(fixtures)
    result = crawl_origin(ORIGIN, fetcher=fetcher, config=CrawlConfig())
    assert result.pages[0].internal_links == (f"{ORIGIN}/section",)
    assert [page.url for page in result.pages] == [f"{ORIGIN}/", f"{ORIGIN}/section"]
    assert f"{ORIGIN}/invented" not in [url for url, _ in fetcher.requests]


@pytest.mark.parametrize("field,limit", [("title", 300), ("meta_description", 500)])
def test_long_metadata_is_bounded_without_merging_different_values(field, limit) -> None:
    fixtures = responses()
    common = "Длинное значение " * 100

    def document(suffix):
        value = common + suffix
        tag = f"<title>{value}</title>" if field == "title" else (
            f'<meta name="description" content="{value}">'
        )
        return tag + '<a href="/a">A</a><a href="/b">B</a>'

    fixtures[f"{ORIGIN}/"] = fetched(f"{ORIGIN}/", document("одинаковое"))
    fixtures[f"{ORIGIN}/a"] = fetched(f"{ORIGIN}/a", document("одинаковое"))
    fixtures[f"{ORIGIN}/b"] = fetched(f"{ORIGIN}/b", document("другое"))
    result = crawl_origin(ORIGIN, fetcher=FixtureFetcher(fixtures), config=CrawlConfig())
    for page in result.pages:
        sample = getattr(page, field)
        assert len(sample) == limit
        assert sample.endswith("… [truncated]")
    groups = result.duplicate_titles if field == "title" else result.duplicate_descriptions
    assert len(groups) == 1
    assert groups[0].urls == (f"{ORIGIN}/", f"{ORIGIN}/a")
    assert groups[0].value.endswith("… [truncated]")


@pytest.mark.parametrize(
    "malformed_loc", ["https://[broken", "https://example.com:bad/", "x" * 2049],
    ids=["bracket", "port", "oversized"],
)
def test_malformed_sitemap_entry_after_matching_root_preserves_valid_pages(malformed_loc) -> None:
    fixtures = responses()
    fixtures[f"{ORIGIN}/sitemap.xml"] = fetched(
        f"{ORIGIN}/sitemap.xml",
        f"<urlset><url><loc>{ORIGIN}/</loc></url>"
        f"<url><loc>{malformed_loc}</loc></url>"
        f"<url><loc>{ORIGIN}/valid</loc></url></urlset>",
        content_type="application/xml",
    )
    fixtures[f"{ORIGIN}/valid"] = fetched(f"{ORIGIN}/valid", "<title>Valid</title>")

    result = crawl_origin(ORIGIN, fetcher=FixtureFetcher(fixtures), config=CrawlConfig())

    assert [page.url for page in result.pages] == [f"{ORIGIN}/", f"{ORIGIN}/valid"]
    assert result.sitemap_complete is False
    assert result.orphan_urls == ()


def test_partial_sitemap_index_preserves_valid_children_without_complete_claim() -> None:
    fixtures = responses()
    fixtures[f"{ORIGIN}/sitemap.xml"] = fetched(
        f"{ORIGIN}/sitemap.xml",
        "<sitemapindex><sitemap><loc>https://[broken</loc></sitemap>"
        f"<sitemap><loc>{ORIGIN}/valid.xml</loc></sitemap></sitemapindex>",
        content_type="application/xml",
    )
    fixtures[f"{ORIGIN}/valid.xml"] = fetched(
        f"{ORIGIN}/valid.xml",
        f"<urlset><url><loc>{ORIGIN}/valid</loc></url></urlset>",
        content_type="application/xml",
    )
    fixtures[f"{ORIGIN}/valid"] = fetched(f"{ORIGIN}/valid", "<title>Valid</title>")
    fetcher = FixtureFetcher(fixtures)
    result = crawl_origin(ORIGIN, fetcher=fetcher, config=CrawlConfig())
    assert [page.url for page in result.pages] == [f"{ORIGIN}/", f"{ORIGIN}/valid"]
    assert result.sitemap_complete is False
    assert result.orphan_urls == ()
    assert f"{ORIGIN}/valid.xml" in [url for url, _origin in fetcher.requests]


def test_duplicate_issue_counts_all_groups_when_result_samples_are_bounded() -> None:
    fixtures = responses()
    urls = [f"{ORIGIN}/page-{number}" for number in range(52)]
    fixtures[f"{ORIGIN}/"] = fetched(
        f"{ORIGIN}/", "<title>Home</title>" + "".join(
            f'<a href="{url}">Page</a>' for url in urls
        )
    )
    for number, url in enumerate(urls):
        fixtures[url] = fetched(url, f"<title>Duplicate group {number // 2}</title>")

    result = crawl_origin(ORIGIN, fetcher=FixtureFetcher(fixtures), config=CrawlConfig())

    assert len(result.duplicate_titles) == 25
    duplicate_issue = next(
        issue for issue in result.issues if issue.issue_id == "site.metadata.duplicate_title"
    )
    assert len(duplicate_issue.affected_urls) == 25
    assert duplicate_issue.affected_url_count == 52


def test_orphan_issue_counts_all_candidates_when_url_samples_are_bounded() -> None:
    fixtures = responses()
    urls = [f"{ORIGIN}/orphan-{number}" for number in range(101)]
    fixtures[f"{ORIGIN}/sitemap.xml"] = fetched(
        f"{ORIGIN}/sitemap.xml", "<urlset>" + "".join(
            f"<url><loc>{url}</loc></url>" for url in urls
        ) + "</urlset>", content_type="application/xml",
    )
    for number, url in enumerate(urls):
        fixtures[url] = fetched(url, f"<title>Orphan {number}</title>")

    result = crawl_origin(
        ORIGIN, fetcher=FixtureFetcher(fixtures), config=CrawlConfig(page_limit=200)
    )

    assert len(result.orphan_urls) == 100
    orphan_issue = next(
        issue for issue in result.issues if issue.issue_id == "site.crawlability.orphan_candidate"
    )
    assert len(orphan_issue.affected_urls) == 25
    assert orphan_issue.affected_url_count == 101
