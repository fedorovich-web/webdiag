from webdiag_api.registry import load_tools, public_tools


def test_registry_counts() -> None:
    tools = load_tools()
    assert len(tools) == 115
    assert len(public_tools()) == 64
    assert len({tool["id"] for tool in tools}) == 115
    assert len({tool["slug"] for tool in tools}) == 115
