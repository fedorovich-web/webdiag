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


def test_analyze_robots_txt_allow_wins_when_equally_specific() -> None:
    summary = analyze_robots_txt(
        """
        User-agent: *
        Disallow: /public
        Allow: /public
        """,
        robots_url="https://example.com/robots.txt",
        target_url="https://example.com/public",
        status_code=200,
    )

    assert summary.allows_target is True
    assert summary.matched_allow_rule == "/public"
    assert summary.matched_disallow_rule is None


def test_analyze_robots_txt_longer_allow_overrides_broader_disallow() -> None:
    summary = analyze_robots_txt(
        """
        User-agent: *
        Disallow: /
        Allow: /public/
        """,
        robots_url="https://example.com/robots.txt",
        target_url="https://example.com/public/page",
        status_code=200,
    )

    assert summary.allows_target is True
    assert summary.matched_allow_rule == "/public/"


def test_analyze_robots_txt_supports_wildcard_and_end_anchor() -> None:
    summary = analyze_robots_txt(
        """
        User-agent: *
        Disallow: /tmp/*/draft$
        """,
        robots_url="https://example.com/robots.txt",
        target_url="https://example.com/tmp/2026/draft",
        status_code=200,
    )
    not_matched = analyze_robots_txt(
        """
        User-agent: *
        Disallow: /tmp/*/draft$
        """,
        robots_url="https://example.com/robots.txt",
        target_url="https://example.com/tmp/2026/draft/live",
        status_code=200,
    )

    assert summary.allows_target is False
    assert not_matched.allows_target is True


def test_analyze_robots_txt_prefers_specific_user_agent_group() -> None:
    summary = analyze_robots_txt(
        """
        User-agent: *
        Disallow: /

        User-agent: WebDiagBot
        Allow: /
        """,
        robots_url="https://example.com/robots.txt",
        target_url="https://example.com/",
        status_code=200,
        user_agent="WebDiagBot/0.5",
    )

    assert summary.allows_target is True
    assert summary.matched_allow_rule == "/"


def test_analyze_robots_txt_supports_multiple_user_agents_in_one_group() -> None:
    summary = analyze_robots_txt(
        """
        User-agent: Googlebot
        User-agent: WebDiagBot
        Disallow: /drafts
        """,
        robots_url="https://example.com/robots.txt",
        target_url="https://example.com/drafts/page",
        status_code=200,
        user_agent="WebDiagBot/0.5",
    )

    assert summary.allows_target is False
    assert summary.matched_disallow_rule == "/drafts"
