from dataclasses import replace

import pytest

from webdiag_api.ai.catalog import DEFAULT_AI_CATALOG, AIToolCatalog, AIToolState

EXPECTED_TOOL_IDS = {
    "ai_alt_text_studio",
    "ai_audit_action_plan",
    "ai_competitor_gap_report",
    "ai_content_brief",
    "ai_content_optimizer",
    "ai_faq_studio",
    "ai_image_edit_studio",
    "ai_image_studio",
    "ai_internal_linking_planner",
    "ai_localization_workbench",
    "ai_meta_serp_studio",
    "ai_redirect_migration_mapper",
    "ai_regex_workbench",
    "ai_schema_studio",
    "ai_search_intent_page_fit",
}


def test_initial_catalog_exposes_no_unevaluated_tools() -> None:
    definitions = DEFAULT_AI_CATALOG.all()

    assert {definition.id for definition in definitions} == EXPECTED_TOOL_IDS
    assert len(definitions) == 15
    assert DEFAULT_AI_CATALOG.available() == ()
    assert {
        definition.id
        for definition in definitions
        if definition.state is AIToolState.DISABLED
    } == {"ai_image_studio", "ai_image_edit_studio"}
    assert all(
        definition.state is AIToolState.INTERNAL
        for definition in definitions
        if definition.id not in {"ai_image_studio", "ai_image_edit_studio"}
    )
    assert all(definition.credit_price is None for definition in definitions)
    assert {
        definition.model_policy
        for definition in definitions
        if definition.state is AIToolState.INTERNAL
    } == {
        "openai/gpt-5.6-luna"
    }
    assert {
        definition.model_policy
        for definition in definitions
        if definition.state is AIToolState.DISABLED
    } == {"none"}


def test_ready_tool_requires_positive_integer_price() -> None:
    internal = DEFAULT_AI_CATALOG.all()[0]

    with pytest.raises(ValueError, match="positive integer credit price"):
        replace(internal, state=AIToolState.READY, credit_price=None)
    with pytest.raises(ValueError, match="positive integer credit price"):
        replace(internal, state=AIToolState.READY, credit_price=0)

    ready = replace(internal, state=AIToolState.READY, credit_price=1)
    assert AIToolCatalog((ready,)).available() == (ready,)


def test_catalog_rejects_duplicate_tool_ids() -> None:
    definition = DEFAULT_AI_CATALOG.all()[0]

    with pytest.raises(ValueError, match="duplicate AI tool ID"):
        AIToolCatalog((definition, definition))
