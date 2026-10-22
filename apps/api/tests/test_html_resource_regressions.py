import asyncio

import httpx
import pytest

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeHttpFetcher
from webdiag_api.main import app
from webdiag_api.tools.canonical import get_canonical_fetcher
from webdiag_api.tools.image_audit import get_image_audit_fetcher
from webdiag_api.tools.link_health import get_link_health_fetcher
from webdiag_api.tools.page_metadata import get_page_metadata_fetcher


def inspect_html(
    tool: str,
    html: str,
    *,
    status: int = 200,
    media_type: str = "text/html",
    asset_media_type: str = "image/png",
    asset_status: int = 200,
):
    calls: list[tuple[str, str]] = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append((request.headers["host"], request.url.raw_path.decode()))
        page = request.url.path == "/page"
        return httpx.Response(
            status if page else asset_status,
            headers={"content-type": media_type if page else asset_media_type},
            stream=httpx.ByteStream(html.encode() if page else b""),
            request=request,
        )

    fetcher = SafeHttpFetcher(
        config=SafeFetchConfig(max_body_bytes=700_000),
        resolver=lambda _host, _port: ["93.184.216.34"],
        peer_address_provider=lambda _response: ["93.184.216.34"],
        transport=httpx.MockTransport(handler),
    )
    dependencies = (
        get_link_health_fetcher,
        get_image_audit_fetcher,
        get_page_metadata_fetcher,
        get_canonical_fetcher,
    )
    for dependency in dependencies:
        app.dependency_overrides[dependency] = lambda: fetcher

    async def post():
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test"
        ) as client:
            return await client.post(f"/v1/tools/{tool}", json={"url": "https://example.com/page"})

    try:
        return asyncio.run(post()), calls
    finally:
        for dependency in dependencies:
            app.dependency_overrides.pop(dependency, None)


@pytest.mark.parametrize("tool", ["meta-tags", "broken-links", "broken-images", "image-seo"])
def test_html_self_closing_template_does_not_activate_its_resources(tool) -> None:
    response, calls = inspect_html(tool, (
        '<template/><title>Inert title</title><img src="/hidden.png">'
        '<a href="/hidden">Hidden</a></template><title>Visible title</title>'
    ))
    assert response.status_code == 200
    data = response.json()
    if tool == "meta-tags":
        assert data["title"] == "Visible title"
    elif tool == "broken-links":
        assert data["discovered_link_count"] == 0
    elif tool == "broken-images":
        assert data["discovered_image_count"] == 0
    else:
        assert data["total_images"] == 0
    assert not any(path in {"/hidden", "/hidden.png"} for _host, path in calls)


@pytest.mark.parametrize("tool", ["meta-tags", "serp-preview", "social-preview"])
def test_long_metadata_returns_bounded_evidence_and_preserves_measured_lengths(tool) -> None:
    response, _calls = inspect_html(
        tool,
        (
            f"<title>{'T' * 4000}</title>"
            f'<meta name="description" content="{"D" * 5000}">'
            f'<meta name="robots" content="{"unknown " * 500}">'
            f'<meta property="og:site_name" content="{"S" * 1000}">'
            f'<meta name="twitter:card" content="{"C" * 500}">'
            f"<h1>{'H' * 3000}</h1>"
        ),
    )
    assert response.status_code == 200
    payload = response.json()
    if tool == "meta-tags":
        assert payload["title_length"] == 4000
        assert payload["meta_description_length"] == 5000
        assert len(payload["title"]) <= 1000
        assert payload["title"].endswith("[truncated]")
    elif tool == "serp-preview":
        assert payload["title_length"] == 4000
        assert payload["description_length"] == 5000
        assert len(payload["preview_description"]) <= 2000
        assert payload["preview_description"].endswith("[truncated]")
    else:
        assert len(payload["open_graph"]["site_name"]) <= 300
        assert payload["open_graph"]["title"].endswith("[truncated]")


@pytest.mark.parametrize("tool", ["meta-tags", "social-preview"])
def test_malformed_metadata_urls_are_diagnostic_instead_of_server_errors(tool) -> None:
    response, _calls = inspect_html(
        tool,
        (
            '<link rel="canonical" href="https://[broken">'
            '<meta property="og:image" content="https://[broken">'
        ),
    )
    assert response.status_code == 200
    payload = response.json()
    if tool == "meta-tags":
        assert payload["resolved_canonical_url"] is None
        assert any(
            row["id"] == "canonical" and row["status"] == "fail" for row in payload["checks"]
        )
    else:
        assert payload["open_graph"]["image"] is None
        assert payload["open_graph"]["complete"] is False


@pytest.mark.parametrize("tool", ["meta-tags", "social-preview", "canonical"])
def test_metadata_urls_use_first_active_document_base(tool) -> None:
    response, _calls = inspect_html(
        tool,
        (
            '<template><base href="https://ignored.example/"></template>'
            '<base href="https://cdn.example.net/catalog/">'
            '<base href="https://also-ignored.example/">'
            '<link rel="canonical" href="product">'
            '<meta property="og:image" content="preview.jpg">'
        ),
    )
    assert response.status_code == 200
    payload = response.json()
    if tool == "social-preview":
        assert payload["open_graph"]["image"] == "https://cdn.example.net/catalog/preview.jpg"
    else:
        assert payload["resolved_canonical_url"] == "https://cdn.example.net/catalog/product"


@pytest.mark.parametrize("tool", ["serp-preview", "social-preview"])
@pytest.mark.parametrize("status", [404, 503])
def test_error_page_metadata_is_not_reported_as_ready(tool, status) -> None:
    response, _calls = inspect_html(
        tool,
        (
            "<title>A useful page title for a search preview</title>"
            '<meta name="description" content="A clear description with enough detail '
            'for a useful search preview of this page.">'
            '<meta property="og:image" content="/cover.png">'
            '<meta name="twitter:card" content="summary_large_image">'
        ),
        status=status,
    )
    assert response.status_code == 200
    payload = response.json()
    assert "HTTP" in payload["recommendation"]
    if tool == "serp-preview":
        assert any(
            row["id"] == "http-status" and row["status"] == "fail" for row in payload["checks"]
        )
    else:
        assert payload["open_graph"]["complete"] is False
        assert payload["twitter"]["complete"] is False


@pytest.mark.parametrize("tool", ["meta-tags", "serp-preview", "social-preview", "canonical"])
def test_non_html_metadata_source_is_rejected(tool) -> None:
    response, _calls = inspect_html(tool, "{}", media_type="application/json")
    assert response.status_code == 415
    assert response.json()["detail"]["code"] == "tool_non_html_response"


@pytest.mark.parametrize(
    "tool", ["broken-links", "broken-images", "image-performance", "image-seo"]
)
def test_inert_template_resources_are_not_counted_or_fetched(tool) -> None:
    response, calls = inspect_html(
        tool,
        (
            '<template><template><img src="/hidden.png"><a href="/hidden">Hidden</a>'
            '</template></template><a href="/visible">Web<strong>Diag</strong></a>'
            '<img src="/visible.png" alt="Visible" width="100" height="100">'
        ),
    )
    assert response.status_code == 200
    assert not any("hidden" in path for _host, path in calls)
    payload = response.json()
    count = (
        "checked_link_count"
        if tool == "broken-links"
        else ("total_images" if tool == "image-seo" else "checked_image_count")
    )
    assert payload[count] == 1


@pytest.mark.parametrize("tool", ["broken-links", "broken-images", "image-performance"])
def test_resource_requests_use_document_base_and_still_apply_url_policy(tool) -> None:
    response, calls = inspect_html(
        tool,
        (
            '<base href="https://cdn.example.net/assets/">'
            '<a href="target">Target</a><img src="photo.png" alt="Photo">'
        ),
    )
    assert response.status_code == 200
    resource = "target" if tool == "broken-links" else "photo.png"
    assert ("cdn.example.net", f"/assets/{resource}") in calls


@pytest.mark.parametrize("tool", ["broken-images", "image-performance"])
def test_srcset_keeps_commas_inside_urls_and_does_not_fetch_data_url_fragments(tool) -> None:
    response, calls = inspect_html(
        tool,
        (
            '<img alt="Cover" srcset="data:image/png;base64,AAAA 1x, '
            '/image,wide.png 2x, /large.png 3x">'
        ),
    )
    assert response.status_code == 200
    assert {path for _host, path in calls} == {"/page", "/image,wide.png", "/large.png"}
    assert response.json()["checked_image_count"] == 2


@pytest.mark.parametrize("tool", ["link-analyzer", "image-seo", "image-performance"])
def test_malformed_resource_urls_do_not_abort_the_entire_page_analysis(tool) -> None:
    response, _calls = inspect_html(
        tool,
        (
            '<a href="https://[broken">Bad</a><a href="/good">Good</a>'
            '<img src="https://[broken" alt="Bad"><img src="/good.png" alt="Good">'
        ),
    )
    assert response.status_code == 200


def test_link_text_preserves_inline_words_and_document_fragments_are_not_refetched() -> None:
    response, _calls = inspect_html(
        "link-analyzer", ('<a href="https://example.com/page#section">Web<strong>Diag</strong></a>')
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["same_page_count"] == 1
    assert payload["sample_links"][0]["text"] == "WebDiag"


@pytest.mark.parametrize(
    "tool",
    ["broken-links", "broken-images", "image-performance", "image-seo", "favicon", "link-analyzer"],
)
def test_failed_source_page_cannot_produce_a_successful_resource_scan(tool) -> None:
    response, calls = inspect_html(
        tool, '<a href="/healthy">Healthy</a><img src="/healthy.png">', status=503
    )
    assert response.status_code == 502
    assert response.json()["detail"]["code"] == "tool_fetch_failed"
    assert calls == [("example.com", "/page")]


def test_image_format_uses_actual_media_type_before_filename_extension() -> None:
    response, _calls = inspect_html("image-performance", '<img src="/cover.jpg">')
    assert response.status_code == 200
    assert response.json()["format_summaries"][0]["format"] == "png"


def test_favicon_does_not_accept_a_successful_html_fallback_as_an_icon() -> None:
    response, _calls = inspect_html(
        "favicon", "<p>No declared icons</p>", asset_media_type="text/html"
    )
    assert response.status_code == 200
    assert response.json()["has_favicon"] is False


def test_broken_image_media_type_must_be_an_image_not_a_header_parameter() -> None:
    response, _calls = inspect_html(
        "broken-images", '<img src="/cover.png">', asset_media_type="text/html; note=image/png"
    )
    assert response.status_code == 200
    assert response.json()["broken_image_count"] == 1


def test_failed_image_response_does_not_count_as_successful_modern_image() -> None:
    response, _calls = inspect_html(
        "image-performance",
        '<img src="/missing.avif" width="100" height="100">',
        asset_media_type="image/avif",
        asset_status=404,
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["modern_raster_count"] == 0
    assert "HTTP" in payload["recommendation"]
    assert "look controlled" not in payload["recommendation"]


@pytest.mark.parametrize("tool", ["image-performance", "image-seo", "favicon"])
def test_overlong_image_attributes_are_bounded_without_aborting_the_scan(tool) -> None:
    response, _calls = inspect_html(
        tool,
        (
            f'<img src="/image.png" width="{"1" * 41}" height="100" loading="{"e" * 50}">'
            f'<meta property="og:image" content="/{"x" * 2050}">'
            f'<link rel="icon {"a" * 150}" href="/icon.png" sizes="{"x" * 161}" '
            f'type="{"t" * 161}"><link rel="manifest" href="/{"x" * 2050}">'
        ),
    )
    assert response.status_code == 200
    payload = response.json()
    if tool == "image-performance":
        assert payload["largest_images"] == []
    elif tool == "image-seo":
        assert payload["og_image_url"] is None
        assert payload["sample_images"][0]["loading"].endswith("[truncated]")
    else:
        assert payload["manifest_url"] is None
        assert len(payload["icons"][0]["sizes"]) <= 160


@pytest.mark.parametrize("tool", ["image-seo", "image-performance"])
def test_non_numeric_image_dimensions_are_not_reported_as_reserved_space(tool) -> None:
    response, _calls = inspect_html(tool, '<img src="/image.png" width="auto" height="100%">')
    assert response.status_code == 200
    assert response.json()["missing_dimensions_count"] == 1
