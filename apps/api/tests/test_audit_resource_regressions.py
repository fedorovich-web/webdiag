import os
import subprocess
import sys

import httpx
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from webdiag_api.audit.fetcher import SafeHttpFetcher
from webdiag_api.audit.robots import analyze_robots_txt
from webdiag_api.audit.site_resources import collect_site_resources
from webdiag_api.audit.sitemap import parse_sitemap_xml
from webdiag_api.tools import robots_txt, sitemap_xml


def test_robots_wildcards_do_not_backtrack_exponentially() -> None:
    code = """
from webdiag_api.audit.robots import analyze_robots_txt
summary = analyze_robots_txt(
    'User-agent: *\\nDisallow: /' + 'a*' * 30 + 'b',
    robots_url='https://example.com/robots.txt',
    target_url='https://example.com/' + 'a' * 100,
    status_code=200,
)
assert summary.allows_target is True
"""
    env = dict(os.environ, PYTHONPATH=os.pathsep.join(sys.path))
    result = subprocess.run(
        [sys.executable, "-c", code], env=env, capture_output=True, text=True, timeout=5
    )
    assert result.returncode == 0, result.stderr


@pytest.mark.parametrize(
    ("pattern", "path", "allowed"),
    [
        ("/a*b*c$", "/aabbbc", False),
        ("/a*b*c$", "/aabbbcd", True),
        ("/a*a$", "/a", True),
        ("/a*a$", "/aa", False),
        ("/a**b", "/ab/more", False),
        ("/*$", "/anything", False),
        ("/a$", "/ab", True),
    ],
)
def test_robots_wildcards_preserve_prefix_and_anchor_semantics(
    pattern: str, path: str, allowed: bool
) -> None:
    summary = analyze_robots_txt(
        f"User-agent: *\nDisallow: {pattern}",
        robots_url="https://example.com/robots.txt",
        target_url=f"https://example.com{path}",
        status_code=200,
    )
    assert summary.allows_target is allowed


@pytest.mark.parametrize("loc", ["https://example.com:bad/", "https://[broken/", "x" * 2049])
def test_malformed_sitemap_locations_are_reported_as_invalid(loc: str) -> None:
    summary = parse_sitemap_xml(
        f"<urlset><url><loc>{loc}</loc></url></urlset>",
        sitemap_url="https://example.com/sitemap.xml",
        target_url="https://example.com/",
        status_code=200,
    )
    assert summary.available is True
    assert summary.valid_xml is False
    assert summary.parse_error
    assert summary.loc_urls == ()


def test_arbitrary_xml_with_loc_is_not_a_valid_sitemap() -> None:
    summary = parse_sitemap_xml(
        "<html><loc>https://example.com/</loc></html>",
        sitemap_url="https://example.com/sitemap.xml",
        target_url="https://example.com/",
        status_code=200,
    )
    assert summary.valid_xml is False
    assert summary.parse_error


@pytest.mark.parametrize(
    "malformed_loc", ["https://[broken/", "https://example.com:bad/", "x" * 2049],
    ids=["bracket", "port", "oversized"],
)
def test_partial_sitemap_preserves_valid_locations_without_claiming_a_valid_document(malformed_loc):
    summary = parse_sitemap_xml(
        "<urlset><url><loc>https://example.com/</loc></url>"
        f"<url><loc>{malformed_loc}</loc></url>"
        "<url><loc>https://example.com/valid</loc></url></urlset>",
        sitemap_url="https://example.com/sitemap.xml",
        target_url="https://example.com/",
        status_code=200,
    )
    assert summary.available is True
    assert summary.valid_xml is False
    assert summary.parse_error
    assert summary.loc_urls == ("https://example.com/", "https://example.com/valid")
    assert summary.url_count == 2
    assert summary.contains_target is True


def test_partial_sitemap_does_not_claim_target_absence() -> None:
    summary = parse_sitemap_xml(
        "<urlset><url><loc>https://example.com/other</loc></url>"
        "<url><loc>https://[broken/</loc></url></urlset>",
        sitemap_url="https://example.com/sitemap.xml",
        target_url="https://example.com/",
        status_code=200,
    )
    assert summary.valid_xml is False
    assert summary.loc_urls == ("https://example.com/other",)
    assert summary.contains_target is None
    assert summary.parse_error


@pytest.mark.parametrize(
    "body",
    [
        "User-agent: *\nDisallow: /" + "x" * 2048,
        "User-agent: " + "x" * 121 + "\nDisallow: /",
        "User-agent: *\nSitemap: /" + "x" * 2040,
        "User-agent: x\n" * 101 + "Disallow: /x\n" * 100,
    ],
)
def test_robots_unsupported_bounds_report_unknown_without_partial_rules(body: str) -> None:
    summary = analyze_robots_txt(
        body,
        robots_url="https://example.com/robots.txt",
        target_url="https://example.com/",
        status_code=200,
    )
    assert summary.available is False
    assert summary.allows_target is None
    assert summary.fetch_error
    assert summary.disallow_rules == ()


@pytest.mark.parametrize(
    ("module", "path", "dependency", "body"),
    [
        (
            robots_txt,
            "/v1/tools/robots-txt",
            robots_txt.get_robots_txt_fetcher,
            "User-agent: *\nDisallow: /" + "x" * 2048,
        ),
        (
            sitemap_xml,
            "/v1/tools/sitemap",
            sitemap_xml.get_sitemap_xml_fetcher,
            "<urlset><url><loc>https://example.com:bad/</loc></url></urlset>",
        ),
        (
            sitemap_xml,
            "/v1/tools/sitemap",
            sitemap_xml.get_sitemap_xml_fetcher,
            "<urlset><url><loc>https://example.com/" + "x" * 2048 + "</loc></url></urlset>",
        ),
    ],
)
def test_malformed_remote_resource_returns_diagnostic_instead_of_500(
    module, path, dependency, body
) -> None:
    app = FastAPI()
    app.include_router(module.router)
    fetcher = SafeHttpFetcher(
        resolver=lambda _host, _port: ["93.184.216.34"],
        peer_address_provider=lambda _response: ["93.184.216.34"],
        transport=httpx.MockTransport(
            lambda request: httpx.Response(
                200, stream=httpx.ByteStream(body.encode()), request=request
            )
        ),
    )
    app.dependency_overrides[dependency] = lambda: fetcher
    response = TestClient(app, raise_server_exceptions=False).post(
        path, json={"url": "https://example.com/"}
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    if module is robots_txt:
        assert payload["available"] is False
        assert payload["allows_target"] is None
        assert payload["disallow_rules"] == []
    else:
        assert payload["available"] is True
        assert payload["valid_xml"] is False
        assert payload["parse_error"]
        assert payload["sample_urls"] == []


def test_policy_rejected_sitemap_preserves_other_audit_resource_results() -> None:
    requested_paths: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requested_paths.append(request.url.path)
        return httpx.Response(
            200,
            stream=httpx.ByteStream(b"User-agent: *\nAllow: /\nSitemap: http://127.0.0.1/private"),
            request=request,
        )

    fetcher = SafeHttpFetcher(
        resolver=lambda _host, _port: ["93.184.216.34"],
        peer_address_provider=lambda _response: ["93.184.216.34"],
        transport=httpx.MockTransport(handler),
    )
    report = collect_site_resources(
        fetcher=fetcher,
        target_url="https://example.com/",
        final_url="https://example.com/",
    )
    assert report.robots.available is True
    assert report.robots.allows_target is True
    assert report.sitemap.status_code is None
    assert report.sitemap.fetch_error
    assert requested_paths == ["/robots.txt"]
