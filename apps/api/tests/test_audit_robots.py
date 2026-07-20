from webdiag_api.audit.robots import analyze_robots_txt


def test_analyze_robots_txt_detects_matching_disallow_and_sitemaps() -> None:
    summary = analyze_robots_txt(
        """
        User-agent: *
        Disallow: /private
        Sitemap: https://example.com/sitemap.xml
        """,
        robots_url="https://example.com/robots.txt",
        target_url="https://example.com/private/page",
        status_code=200,
    )

    assert summary.available is True
    assert summary.allows_target is False
    assert summary.matched_disallow_rule == "/private"
    assert summary.sitemap_urls == ("https://example.com/sitemap.xml",)


def test_analyze_robots_txt_treats_missing_file_as_unknown_not_blocking() -> None:
    summary = analyze_robots_txt(
        "",
        robots_url="https://example.com/robots.txt",
        target_url="https://example.com/",
        status_code=404,
    )

    assert summary.available is False
    assert summary.allows_target is None
    assert summary.disallow_rules == ()
