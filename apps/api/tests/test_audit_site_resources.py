import httpx
import pytest

from webdiag_api.audit.fetcher import SafeHttpFetcher
from webdiag_api.audit.site_resources import collect_site_resources
from webdiag_api.security.url_policy import UrlPolicyError

SAFE_IP = "93.184.216.34"


def streaming_response(
    status_code: int,
    *,
    request: httpx.Request,
    headers: dict[str, str] | None = None,
    content: bytes = b"",
) -> httpx.Response:
    return httpx.Response(
        status_code,
        headers=headers,
        stream=httpx.ByteStream(content),
        request=request,
    )


def test_collect_site_resources_fetches_same_origin_robots_and_sitemap() -> None:
    seen_paths: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen_paths.append(request.url.path)
        if request.url.path == "/robots.txt":
            return streaming_response(
                200,
                content=b"User-agent: *\nAllow: /",
                request=request,
            )
        if request.url.path == "/sitemap.xml":
            return streaming_response(
                200,
                content=b"<urlset><url><loc>https://example.com/final</loc></url></urlset>",
                request=request,
            )
        raise AssertionError(f"unexpected path: {request.url.path}")

    fetcher = SafeHttpFetcher(
        resolver=lambda _hostname, _port: [SAFE_IP],
        peer_address_provider=lambda _response: [SAFE_IP],
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


def test_collect_site_resources_does_not_convert_policy_failure_to_missing_resource() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return streaming_response(
            302,
            headers={"location": "http://127.0.0.1/private"},
            request=request,
        )

    fetcher = SafeHttpFetcher(
        resolver=lambda _hostname, _port: [SAFE_IP],
        peer_address_provider=lambda _response: [SAFE_IP],
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(UrlPolicyError):
        collect_site_resources(
            fetcher=fetcher,
            target_url="https://example.com/final",
            final_url="https://example.com/final",
        )
