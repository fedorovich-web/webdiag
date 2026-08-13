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


def _gap_input(locale: str = "ru") -> dict[str, object]:
    return {
        "locale": locale,
        "objective": "Сравнить полноту переданных материалов.",
        "own_page": _page(
            "HTTPS://Example.COM:443/guide?token=secret#private",
            "Технический аудит",
            "Материал описывает проверку robots.txt.",
        ),
        "competitor_pages": [
            _page(
                "https://competitor.example/guide-a",
                "Полный технический аудит",
                "Материал описывает проверку robots.txt и XML-карты сайта.",
            ),
            _page(
                "https://competitor.example/guide-b",
                "Проверка сайта",
                "Инструкция включает проверку кодов HTTP-ответа.",
            ),
        ],
    }


def _linking_input(locale: str = "en") -> dict[str, object]:
    return {
        "locale": locale,
        "pages": [
            _page(
                "https://example.com/audit",
                "Technical audit",
                "The audit guide explains crawl directives and status codes.",
            ),
            _page(
                "https://example.com/robots",
                "Robots.txt guide",
                "The robots guide explains crawl access rules.",
            ),
            _page(
                "https://example.com/status",
                "HTTP status guide",
                "The status guide explains HTTP response classes.",
            ),
        ],
        "existing_links": [{"source_page_index": 0, "target_page_index": 1}],
    }


def test_planning_tools_accept_strict_inputs_and_redact_url_secrets() -> None:
    assert has_tool_contract("ai_competitor_gap_report") is True
    assert has_tool_contract("ai_internal_linking_planner") is True

    gap = validate_public_input("ai_competitor_gap_report", _gap_input())
    linking = validate_public_input("ai_internal_linking_planner", _linking_input())

    assert gap["own_page"]["page_url"] == "https://example.com/guide"
    assert linking["locale"] == "en"


@pytest.mark.parametrize(
    ("tool_id", "value"),
    [
        (
            "ai_competitor_gap_report",
            {
                **_gap_input(),
                "competitor_pages": [
                    _page("http://127.0.0.1/private", "Private", "Private page content."),
                ],
            },
        ),
        (
            "ai_competitor_gap_report",
            {
                **_gap_input(),
                "competitor_pages": [
                    _page(
                        "https://example.com/guide#copy",
                        "Duplicate",
                        "Duplicate page content.",
                    )
                ],
            },
        ),
        ("ai_internal_linking_planner", {**_linking_input(), "locale": "de"}),
        (
            "ai_internal_linking_planner",
            {**_linking_input(), "existing_links": [{"source_page_index": 0}]},
        ),
        (
            "ai_internal_linking_planner",
            {**_linking_input(), "unexpected": True},
        ),
    ],
)
def test_planning_tools_reject_invalid_or_ambiguous_inputs(
    tool_id: str,
    value: dict[str, object],
) -> None:
    with pytest.raises(AIToolContractError, match="contract validation failed"):
        validate_public_input(tool_id, value)


def test_competitor_gap_output_requires_exact_indexed_evidence() -> None:
    provider_input = validate_public_input("ai_competitor_gap_report", _gap_input())
    output = {
        "summary": "В переданных материалах найдены две темы для расширения.",
        "gaps": [
            {
                "topic": "XML-карта сайта",
                "own_evidence": ["Материал описывает проверку robots.txt."],
                "competitor_evidence": [
                    {
                        "page_index": 0,
                        "excerpt": "XML-карты сайта",
                    }
                ],
                "recommendation": "Добавить проверяемый раздел об XML-карте сайта.",
            },
            {
                "topic": "Коды HTTP-ответа",
                "own_evidence": [],
                "competitor_evidence": [
                    {
                        "page_index": 1,
                        "excerpt": "проверку кодов HTTP-ответа",
                    }
                ],
                "recommendation": "Рассмотреть отдельный раздел о кодах HTTP-ответа.",
            },
        ],
        "warnings": ["Сравнение основано только на переданных снимках страниц."],
    }

    assert validate_output("ai_competitor_gap_report", provider_input, output) == output

    unknown_index = deepcopy(output)
    unknown_index["gaps"][0]["competitor_evidence"][0]["page_index"] = 2
    with pytest.raises(AIToolContractError, match="unknown comparison page"):
        validate_output("ai_competitor_gap_report", provider_input, unknown_index)

    fabricated = deepcopy(output)
    fabricated["gaps"][0]["competitor_evidence"][0]["excerpt"] = "Высокий трафик"
    with pytest.raises(AIToolContractError, match="comparison page"):
        validate_output("ai_competitor_gap_report", provider_input, fabricated)


def test_internal_linking_output_rejects_self_existing_duplicate_and_ungrounded_links() -> None:
    provider_input = validate_public_input("ai_internal_linking_planner", _linking_input())
    proposal = {
        "source_page_index": 1,
        "target_page_index": 2,
        "suggested_anchor": "HTTP response classes",
        "source_evidence": "crawl access rules",
        "target_evidence": "HTTP response classes",
        "rationale": "Connects a related diagnostic concept.",
    }
    output = {
        "summary": "One reviewable link is proposed.",
        "proposals": [proposal],
        "warnings": [],
    }

    assert validate_output("ai_internal_linking_planner", provider_input, output) == output

    invalid_cases = []
    self_link = deepcopy(output)
    self_link["proposals"][0]["target_page_index"] = 1
    invalid_cases.append(self_link)
    existing = deepcopy(output)
    existing["proposals"][0]["source_page_index"] = 0
    existing["proposals"][0]["target_page_index"] = 1
    invalid_cases.append(existing)
    duplicate = deepcopy(output)
    duplicate["proposals"].append(deepcopy(duplicate["proposals"][0]))
    invalid_cases.append(duplicate)
    ungrounded = deepcopy(output)
    ungrounded["proposals"][0]["target_evidence"] = "Measured ranking gain"
    invalid_cases.append(ungrounded)

    for invalid in invalid_cases:
        with pytest.raises(AIToolContractError):
            validate_output("ai_internal_linking_planner", provider_input, invalid)
