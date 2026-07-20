import httpx

from webdiag_api.audit.fetcher import SafeHttpFetcher
from webdiag_api.audit.site_resources import collect_site_resources

SAFE_IP = "93.184.216.34"


def test_collect_site_resources_fetches_same_origin_robots_and_sitemap() -> None:
    seen_paths: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen_paths.append(request.url.path)
        if request.url.path == "/robots.txt":
            return httpx.Response(200, content=b"User-agent: *\nAllow: /", request=request)
        if request.url.path == "/sitemap.xml":
            return httpx.Response(
                200,
                content=b"<urlset><url><loc>https://example.com/final</loc></url></urlset>",
                request=request,
            )
        raise AssertionError(f"unexpected path: {request.url.path}")

    fetcher = SafeHttpFetcher(
        resolver=lambda _hostname, _port: [SAFE_IP],
        transport=httpx.MockTransport(handler),
    )

    report = collect_site_resources(
        fetcher=fetcher,
        target_url="https://example.com/final",
        final_url="https://example.com/final",
    )

    assert seen_paths == ["/robots.txt", "/sitemap.xml"]
    assert report.robots.available is True
    assert report.sitemap.contains_target is True
