from webdiag_api.audit.html_metadata import parse_html_metadata


def test_parse_html_metadata_extracts_core_signals() -> None:
    html = """
    <!doctype html>
    <html>
      <head>
        <title> Example   title </title>
        <meta name="description" content="  Useful page description. ">
        <meta name="robots" content="noindex, nofollow">
        <link rel="preload canonical" href="https://example.com/page">
      </head>
      <body><h1> Main   heading </h1><h1>Secondary</h1></body>
    </html>
    """

    result = parse_html_metadata(html)

    assert result.title == "Example title"
    assert result.meta_description == "Useful page description."
    assert result.canonical_url == "https://example.com/page"
    assert result.h1 == ("Main heading", "Secondary")
    assert result.robots[0].user_agent == "robots"
    assert result.has_noindex is True
    assert result.has_nofollow is True


def test_parse_html_metadata_handles_missing_signals() -> None:
    result = parse_html_metadata("<html><body><p>No metadata</p></body></html>")

    assert result.title is None
    assert result.meta_description is None
    assert result.canonical_url is None
    assert result.h1 == ()
    assert result.robots == ()


def test_parse_html_metadata_extracts_social_and_json_ld_signals() -> None:
    html = """
    <html><head>
      <meta property="og:title" content=" Shared   title ">
      <meta property="og:image" content="https://example.com/og.png">
      <meta name="twitter:card" content="summary_large_image">
      <script type="application/ld+json">
        {"@context":"https://schema.org","@type":"WebPage","name":"Example"}
      </script>
    </head><body></body></html>
    """

    result = parse_html_metadata(html)

    assert result.open_graph[0].name == "og:title"
    assert result.open_graph[0].content == "Shared title"
    assert {signal.name for signal in result.open_graph} == {"og:title", "og:image"}
    assert result.twitter_cards[0].name == "twitter:card"
    assert len(result.json_ld_scripts) == 1
    assert "WebPage" in result.json_ld_scripts[0].content
