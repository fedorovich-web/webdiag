from webdiag_api.audit.sitemap import parse_sitemap_xml


def test_parse_sitemap_xml_counts_urls_and_matches_target() -> None:
    summary = parse_sitemap_xml(
        """
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>https://example.com/</loc></url>
          <url><loc>https://example.com/about</loc></url>
        </urlset>
        """,
        sitemap_url="https://example.com/sitemap.xml",
        target_url="https://example.com/",
        status_code=200,
    )

    assert summary.available is True
    assert summary.valid_xml is True
    assert summary.url_count == 2
    assert summary.contains_target is True


def test_parse_sitemap_xml_reports_invalid_xml() -> None:
    summary = parse_sitemap_xml(
        "<urlset><url>",
        sitemap_url="https://example.com/sitemap.xml",
        target_url="https://example.com/",
        status_code=200,
    )

    assert summary.available is True
    assert summary.valid_xml is False
    assert summary.parse_error is not None
