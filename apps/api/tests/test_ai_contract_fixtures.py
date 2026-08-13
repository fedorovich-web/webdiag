import json
from pathlib import Path

from webdiag_api.ai.tool_contracts import validate_output, validate_public_input

FIXTURE_PATH = Path(__file__).parent / "fixtures" / "ai" / "a12_1a_contract_cases.json"
CONTENT_FIXTURE_PATH = (
    Path(__file__).parent / "fixtures" / "ai" / "a12_1c_content_contract_cases.json"
)
PLANNING_FIXTURE_PATH = (
    Path(__file__).parent / "fixtures" / "ai" / "a12_1d_planning_contract_cases.json"
)


def test_a12_1a_ru_en_contract_fixtures_are_valid_and_grounded() -> None:
    cases = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))

    assert {case["tool_id"] for case in cases} == {
        "ai_audit_action_plan",
        "ai_meta_serp_studio",
        "ai_schema_studio",
        "ai_faq_studio",
        "ai_alt_text_studio",
    }
    assert {case["provider_input"]["locale"] for case in cases} == {"ru", "en"}
    for case in cases:
        public_input = case.get("public_input")
        provider_input = case["provider_input"]
        if public_input is not None:
            provider_input = validate_public_input(case["tool_id"], public_input)
        result = validate_output(case["tool_id"], provider_input, case["output"])
        assert result


def test_a12_1c_content_workbench_ru_en_fixtures_are_valid_and_grounded() -> None:
    cases = json.loads(CONTENT_FIXTURE_PATH.read_text(encoding="utf-8"))

    assert {case["tool_id"] for case in cases} == {
        "ai_content_brief",
        "ai_content_optimizer",
        "ai_search_intent_page_fit",
    }
    assert {case["public_input"]["locale"] for case in cases} == {"ru", "en"}
    for case in cases:
        provider_input = validate_public_input(case["tool_id"], case["public_input"])
        result = validate_output(case["tool_id"], provider_input, case["output"])
        assert result == case["output"]


def test_a12_1d_planning_tool_ru_en_fixtures_are_valid_and_grounded() -> None:
    cases = json.loads(PLANNING_FIXTURE_PATH.read_text(encoding="utf-8"))

    assert {case["tool_id"] for case in cases} == {
        "ai_competitor_gap_report",
        "ai_internal_linking_planner",
    }
    assert {case["public_input"]["locale"] for case in cases} == {"ru", "en"}
    for case in cases:
        provider_input = validate_public_input(case["tool_id"], case["public_input"])
        assert validate_output(case["tool_id"], provider_input, case["output"]) == case[
            "output"
        ]
