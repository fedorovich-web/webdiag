from webdiag_api.audit import IssueCategory, bindings_for_category, validate_tool_mappings
from webdiag_api.registry import load_tools


def test_every_issue_category_has_an_explicit_tool_binding_state() -> None:
    categories = {mapping.issue_category for mapping in validate_tool_mappings()}

    assert categories == set(IssueCategory)


def test_ready_tool_mappings_point_to_existing_ready_routes() -> None:
    ready_slugs = {tool["slug"] for tool in load_tools() if tool["state"] == "ready"}

    for mapping in validate_tool_mappings():
        if not mapping.ready:
            assert mapping.tool_slug is None
            assert mapping.route_ru is None
            assert mapping.route_en is None
            continue
        assert mapping.tool_slug in ready_slugs
        assert mapping.route_ru == f"/tools/{mapping.tool_slug}"
        assert mapping.route_en == f"/en/tools/{mapping.tool_slug}"


def test_structured_data_category_maps_to_json_validator() -> None:
    mappings = bindings_for_category(IssueCategory.STRUCTURED_DATA)

    assert len(mappings) == 1
    assert mappings[0].ready is True
    assert mappings[0].tool_slug == "json-formatter-validator"


def test_seo_engine_categories_do_not_overpromise_public_tools() -> None:
    unavailable = bindings_for_category(IssueCategory.METADATA)

    assert unavailable[0].ready is False
    assert unavailable[0].tool_slug is None
    assert "not public tools yet" in unavailable[0].rationale
