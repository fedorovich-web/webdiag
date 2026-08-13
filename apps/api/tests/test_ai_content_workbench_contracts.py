import pytest

from webdiag_api.ai.tool_contracts import (
    AIToolContractError,
    has_tool_contract,
    validate_output,
    validate_public_input,
)


def _brief_input(locale: str = "ru") -> dict[str, object]:
    return {
        "locale": locale,
        "audience": "Владельцы небольших интернет-магазинов",
        "objective": "Объяснить порядок технического SEO-аудита",
        "working_title": "Технический SEO-аудит",
        "facts": [
            "Проверка robots.txt показывает доступность разделов для обхода.",
            "XML-карта сайта содержит канонические URL проекта.",
        ],
    }


def _optimizer_input(locale: str = "en") -> dict[str, object]:
    return {
        "locale": locale,
        "page_url": "HTTPS://Example.COM:443/guides/seo?token=secret#private-note",
        "content": "WebDiag checks crawl directives. Reports keep the audit evidence.",
        "target_query": "technical SEO audit",
        "objective": "Make the explanation clearer.",
        "factual_constraints": ["Reports keep the audit evidence."],
    }


def _intent_input(locale: str = "ru") -> dict[str, object]:
    return {
        "locale": locale,
        "page_url": "https://example.com/audit",
        "primary_query": "как проверить техническое SEO",
        "intended_page_type": "informational",
        "page_title": "Как провести технический SEO-аудит",
        "h1": "Порядок технического SEO-аудита",
        "content": "Инструкция объясняет проверку robots.txt и XML-карты сайта.",
    }


@pytest.mark.parametrize(
    ("tool_id", "value", "expected"),
    [
        ("ai_content_brief", _brief_input(), {"locale": "ru"}),
        (
            "ai_content_optimizer",
            _optimizer_input(),
            {"locale": "en", "page_url": "https://example.com/guides/seo"},
        ),
        (
            "ai_search_intent_page_fit",
            _intent_input("en"),
            {"locale": "en", "page_url": "https://example.com/audit"},
        ),
    ],
)
def test_content_workbench_accepts_strict_ru_en_inputs(
    tool_id: str,
    value: dict[str, object],
    expected: dict[str, str],
) -> None:
    assert has_tool_contract(tool_id) is True
    validated = validate_public_input(tool_id, value)
    assert {key: validated[key] for key in expected} == expected


@pytest.mark.parametrize(
    ("tool_id", "value"),
    [
        ("ai_content_brief", {**_brief_input(), "locale": "de"}),
        ("ai_content_brief", {**_brief_input(), "facts": []}),
        ("ai_content_brief", {**_brief_input(), "unexpected": True}),
        ("ai_content_optimizer", {**_optimizer_input(), "content": "too short"}),
        ("ai_content_optimizer", {**_optimizer_input(), "page_url": "http://127.0.0.1/x"}),
        (
            "ai_search_intent_page_fit",
            {**_intent_input(), "intended_page_type": "service"},
        ),
        (
            "ai_search_intent_page_fit",
            {**_intent_input(), "primary_query": ["not", "a", "string"]},
        ),
    ],
)
def test_content_workbench_rejects_invalid_or_untrusted_inputs(
    tool_id: str,
    value: dict[str, object],
) -> None:
    with pytest.raises(AIToolContractError, match="contract validation failed"):
        validate_public_input(tool_id, value)


def test_content_brief_output_requires_exact_grounded_coverage() -> None:
    provider_input = validate_public_input("ai_content_brief", _brief_input())
    output = {
        "suggested_title": "План технического SEO-аудита",
        "sections": [
            {
                "heading": "Управление обходом",
                "purpose": "Показать, какие входные данные проверяются.",
                "coverage": [
                    {
                        "source_fact_index": 0,
                        "excerpt": "Проверка robots.txt показывает доступность разделов",
                    }
                ],
            },
            {
                "heading": "Карта сайта",
                "purpose": "Зафиксировать состав отправляемых URL.",
                "coverage": [
                    {
                        "source_fact_index": 1,
                        "excerpt": "XML-карта сайта содержит канонические URL проекта.",
                    }
                ],
            },
        ],
        "warnings": [],
    }

    assert validate_output("ai_content_brief", provider_input, output) == output

    output["sections"][0]["coverage"][0]["source_fact_index"] = 1
    with pytest.raises(AIToolContractError, match="absent from its source fact"):
        validate_output("ai_content_brief", provider_input, output)


def test_content_optimizer_output_requires_auditable_changes_and_all_facts() -> None:
    provider_input = validate_public_input("ai_content_optimizer", _optimizer_input())
    output = {
        "revised_content": (
            "WebDiag checks crawl directives and explains the result. "
            "Reports keep the audit evidence."
        ),
        "changes": [
            {
                "kind": "clarity",
                "before_excerpt": "WebDiag checks crawl directives.",
                "after_excerpt": "WebDiag checks crawl directives and explains the result.",
                "rationale": "Clarifies what the check returns.",
            }
        ],
        "preserved_fact_indexes": [0],
        "warnings": [],
    }

    assert validate_output("ai_content_optimizer", provider_input, output) == output

    output["changes"][0]["before_excerpt"] = "A sentence absent from the input."
    with pytest.raises(AIToolContractError, match="original content"):
        validate_output("ai_content_optimizer", provider_input, output)


def test_content_optimizer_rejects_dropped_or_duplicate_fact_references() -> None:
    provider_input = validate_public_input("ai_content_optimizer", _optimizer_input())
    output = {
        "revised_content": "WebDiag checks crawl directives and explains the result.",
        "changes": [],
        "preserved_fact_indexes": [0, 0],
        "warnings": [],
    }

    with pytest.raises(AIToolContractError, match="factual constraints"):
        validate_output("ai_content_optimizer", provider_input, output)


def test_search_intent_output_requires_source_evidence_and_consistent_fit() -> None:
    provider_input = validate_public_input("ai_search_intent_page_fit", _intent_input())
    output = {
        "inferred_intent": "informational",
        "confidence": "high",
        "fit": "aligned",
        "evidence": [
            "Как провести технический SEO-аудит",
            "Инструкция объясняет проверку robots.txt",
        ],
        "gaps": ["Не описана проверка кодов HTTP-ответа."],
        "recommendations": ["Добавить проверяемые шаги для HTTP-ответов."],
        "warnings": ["Результат основан только на переданном тексте, без live SERP."],
    }

    assert validate_output("ai_search_intent_page_fit", provider_input, output) == output

    output["evidence"] = ["Конкуренты занимают первые позиции."]
    with pytest.raises(AIToolContractError, match="absent from supplied page data"):
        validate_output("ai_search_intent_page_fit", provider_input, output)


def test_search_intent_unknown_requires_insufficient_evidence_fit() -> None:
    provider_input = validate_public_input("ai_search_intent_page_fit", _intent_input())
    output = {
        "inferred_intent": "unknown",
        "confidence": "low",
        "fit": "aligned",
        "evidence": [],
        "gaps": [],
        "recommendations": [],
        "warnings": [],
    }

    with pytest.raises(AIToolContractError, match="intent and fit are inconsistent"):
        validate_output("ai_search_intent_page_fit", provider_input, output)
