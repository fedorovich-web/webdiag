from webdiag_api.registry import load_tools, public_tools


def test_registry_counts() -> None:
    tools = load_tools()
    assert len(tools) == 125
    ready = public_tools()
    assert len(ready) == 115
    assert {
        "orphan-page-finder",
        "render-blocking-resources-checker",
        "resource-waterfall-analyzer",
    } <= {tool["slug"] for tool in ready}
    assert len({tool["id"] for tool in tools}) == 125
    assert len({tool["slug"] for tool in tools}) == 125
