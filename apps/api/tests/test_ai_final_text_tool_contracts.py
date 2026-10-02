from copy import deepcopy

import pytest

from webdiag_api.ai.tool_contracts import (
    AIToolContractError,
    has_tool_contract,
    validate_output,
    validate_public_input,
)


def _page(url: str, title: str, content: str) -> dict[str, object]:
    return {"page_url": url, "title": title, "h1": title, "content": content}


def _redirect_input(locale: str = "en") -> dict[str, object]:
    return {
        "locale": locale,
        "old_pages": [
            _page(
                "https://old.example/robots?token=secret#private",
                "Robots guide",
                "The old guide explains crawl access rules.",
            ),
            _page(
                "https://old.example/legacy",
                "Legacy page",
                "The legacy page describes a retired feature.",
            ),
        ],
        "new_pages": [
            _page(
                "https://new.example/crawl",
                "Crawl access guide",
                "The new guide explains crawl access rules.",
            ),
            _page(
                "https://new.example/audit",
                "Technical audit",
                "The audit guide covers status and sitemap checks.",
            ),
        ],
    }


def _localization_input(locale: str = "ru") -> dict[str, object]:
    return {
        "locale": locale,
        "source_locale": "en",
        "target_locale": "ru",
        "source_content": (
            "WebDiag stores a saved audit. The report keeps deterministic evidence."
        ),
        "glossary": [
            {"source_term": "saved audit", "target_term": "сохранённый аудит"}
        ],
        "verbatim_constraints": ["WebDiag"],
    }


def _regex_input(locale: str = "en") -> dict[str, object]:
    return {
        "locale": locale,
        "dialect": "javascript",
        "task": "Draft a pattern for lowercase ASCII slugs.",
        "cases": [
            {"text": "audit-guide", "expected_match": True},
            {"text": "Audit Guide", "expected_match": False},
        ],
        "constraints": ["Match the whole input."],
    }


def test_final_text_tools_accept_strict_inputs_and_redact_redirect_url_secrets() -> None:
    for tool_id in (
        "ai_redirect_migration_mapper",
        "ai_localization_workbench",
        "ai_regex_workbench",
    ):
        assert has_tool_contract(tool_id) is True

    redirect = validate_public_input("ai_redirect_migration_mapper", _redirect_input())
    localization = validate_public_input("ai_localization_workbench", _localization_input())
    regex = validate_public_input("ai_regex_workbench", _regex_input())

    assert redirect["old_pages"][0]["page_url"] == "https://old.example/robots"
    assert localization["target_locale"] == "ru"
    assert regex["dialect"] == "javascript"


@pytest.mark.parametrize(
    ("tool_id", "value"),
    [
        (
            "ai_redirect_migration_mapper",
            {
                **_redirect_input(),
                "new_pages": [
                    _page(
                        "https://old.example/robots#duplicate",
                        "Duplicate",
                        "Duplicate migration page content.",
                    )
                ],
            },
        ),
        (
            "ai_redirect_migration_mapper",
            {
                **_redirect_input(),
                "new_pages": [
                    _page("http://127.0.0.1/private", "Private", "Private page content.")
                ],
            },
        ),
        (
            "ai_localization_workbench",
            {**_localization_input(), "target_locale": "en"},
        ),
        (
            "ai_localization_workbench",
            {
                **_localization_input(),
                "glossary": [
                    {"source_term": "saved audit", "target_term": "аудит"},
                    {"source_term": "saved audit", "target_term": "проверка"},
                ],
            },
        ),
        ("ai_regex_workbench", {**_regex_input(), "dialect": "pcre"}),
        ("ai_regex_workbench", {**_regex_input(), "cases": []}),
    ],
)
def test_final_text_tools_reject_invalid_inputs(
    tool_id: str,
    value: dict[str, object],
) -> None:
    with pytest.raises(AIToolContractError, match="contract validation failed"):
        validate_public_input(tool_id, value)


def test_redirect_output_maps_every_old_page_once_with_exact_evidence() -> None:
    provider_input = validate_public_input("ai_redirect_migration_mapper", _redirect_input())
    output = {
        "summary": "One redirect and one no-match decision are proposed.",
        "mappings": [
            {
                "old_page_index": 0,
                "action": "redirect",
                "target_page_index": 0,
                "confidence": "high",
                "old_evidence": "crawl access rules",
                "target_evidence": "crawl access rules",
                "rationale": "The supplied snapshots cover the same topic.",
            },
            {
                "old_page_index": 1,
                "action": "no_match",
                "target_page_index": None,
                "confidence": "medium",
                "old_evidence": "retired feature",
                "target_evidence": None,
                "rationale": "No supplied new page contains matching evidence.",
            },
        ],
        "warnings": [],
    }

    assert validate_output("ai_redirect_migration_mapper", provider_input, output) == output

    invalid_cases = []
    duplicate_old = deepcopy(output)
    duplicate_old["mappings"][1]["old_page_index"] = 0
    invalid_cases.append(duplicate_old)
    missing_target = deepcopy(output)
    missing_target["mappings"][0]["target_page_index"] = None
    invalid_cases.append(missing_target)
    no_match_target = deepcopy(output)
    no_match_target["mappings"][1]["target_page_index"] = 1
    no_match_target["mappings"][1]["target_evidence"] = "Technical audit"
    invalid_cases.append(no_match_target)
    implicit_no_match = deepcopy(output)
    del implicit_no_match["mappings"][1]["target_page_index"]
    del implicit_no_match["mappings"][1]["target_evidence"]
    invalid_cases.append(implicit_no_match)
    fabricated = deepcopy(output)
    fabricated["mappings"][0]["target_evidence"] = "Measured ranking gain"
    invalid_cases.append(fabricated)

    for invalid in invalid_cases:
        with pytest.raises(AIToolContractError):
            validate_output("ai_redirect_migration_mapper", provider_input, invalid)


def test_localization_output_requires_complete_glossary_and_verbatim_preservation() -> None:
    provider_input = validate_public_input("ai_localization_workbench", _localization_input())
    output = {
        "localized_content": (
            "WebDiag хранит сохранённый аудит. Отчёт сохраняет детерминированные данные."
        ),
        "glossary_usages": [
            {
                "glossary_index": 0,
                "source_excerpt": "saved audit",
                "target_excerpt": "сохранённый аудит",
            }
        ],
        "preserved_constraint_indexes": [0],
        "warnings": [],
    }

    assert validate_output("ai_localization_workbench", provider_input, output) == output

    missing_glossary = deepcopy(output)
    missing_glossary["glossary_usages"] = []
    with pytest.raises(AIToolContractError, match="glossary"):
        validate_output("ai_localization_workbench", provider_input, missing_glossary)

    dropped_constraint = deepcopy(output)
    dropped_constraint["localized_content"] = dropped_constraint["localized_content"].replace(
        "WebDiag", "Сервис"
    )
    with pytest.raises(AIToolContractError, match="verbatim"):
        validate_output("ai_localization_workbench", provider_input, dropped_constraint)


def test_regex_output_is_unverified_and_covers_declared_cases_without_execution() -> None:
    provider_input = validate_public_input("ai_regex_workbench", _regex_input())
    output = {
        "dialect": "javascript",
        "pattern": "^[a-z]+(?:-[a-z]+)*$",
        "validation_status": "unverified",
        "case_plan": [
            {"case_index": 0, "expected_match": True},
            {"case_index": 1, "expected_match": False},
        ],
        "explanation": "Drafts a whole-string lowercase slug pattern.",
        "warnings": ["The pattern has not been executed by WebDiag."],
    }

    assert validate_output("ai_regex_workbench", provider_input, output) == output

    invalid_cases = []
    claimed_pass = deepcopy(output)
    claimed_pass["validation_status"] = "passed"
    invalid_cases.append(claimed_pass)
    wrong_dialect = deepcopy(output)
    wrong_dialect["dialect"] = "python"
    invalid_cases.append(wrong_dialect)
    missing_case = deepcopy(output)
    missing_case["case_plan"] = missing_case["case_plan"][:1]
    invalid_cases.append(missing_case)
    wrong_expectation = deepcopy(output)
    wrong_expectation["case_plan"][1]["expected_match"] = True
    invalid_cases.append(wrong_expectation)

    for invalid in invalid_cases:
        with pytest.raises(AIToolContractError):
            validate_output("ai_regex_workbench", provider_input, invalid)
