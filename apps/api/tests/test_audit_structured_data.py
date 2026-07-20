from webdiag_api.audit.html_metadata import ScriptBlock
from webdiag_api.audit.structured_data import analyze_json_ld_scripts


def test_analyze_json_ld_scripts_collects_types_from_graphs() -> None:
    report = analyze_json_ld_scripts(
        (
            ScriptBlock(
                script_type="application/ld+json",
                content='''{
                  "@context":"https://schema.org",
                  "@graph":[
                    {"@type":"WebSite","name":"Example"},
                    {"@type":["Organization","LocalBusiness"],"name":"Company"}
                  ]
                }''',
            ),
        )
    )

    assert report.block_count == 1
    assert report.valid_count == 1
    assert report.invalid_count == 0
    assert report.types == ("LocalBusiness", "Organization", "WebSite")
    assert report.blocks[0].node_count == 3


def test_analyze_json_ld_scripts_reports_invalid_blocks_without_raising() -> None:
    report = analyze_json_ld_scripts(
        (ScriptBlock(script_type="application/ld+json", content='{"@type": "WebPage"'),)
    )

    assert report.block_count == 1
    assert report.valid_count == 0
    assert report.invalid_count == 1
    assert report.has_invalid_blocks is True
    assert "line" in (report.blocks[0].error or "")
