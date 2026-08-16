import json

import httpx
import pytest

from webdiag_worker.ai import ProviderRequest
from webdiag_worker.openrouter_provider import OpenRouterProvider


def _response(output: dict[str, object]) -> dict[str, object]:
    return {
        "id": "gen_content_123",
        "choices": [
            {
                "finish_reason": "stop",
                "message": {
                    "content": json.dumps(output),
                    "refusal": None,
                    "role": "assistant",
                },
            }
        ],
        "usage": {"prompt_tokens": 20, "completion_tokens": 10, "cost": 0.00002},
    }


@pytest.mark.parametrize(
    ("tool_id", "input_value", "output", "required_instruction"),
    [
        (
            "ai_content_brief",
            {
                "locale": "ru",
                "audience": "Владельцы сайтов",
                "objective": "Подготовить проверяемый план материала.",
                "working_title": None,
                "facts": ["robots.txt управляет доступностью разделов для обхода."],
            },
            {
                "suggested_title": "План проверки robots.txt",
                "sections": [
                    {
                        "heading": "Доступность разделов",
                        "purpose": "Объяснить область проверки.",
                        "coverage": [
                            {
                                "source_fact_index": 0,
                                "excerpt": "robots.txt управляет доступностью разделов",
                            }
                        ],
                    }
                ],
                "warnings": [],
            },
            "exact source-fact substring",
        ),
        (
            "ai_content_optimizer",
            {
                "locale": "en",
                "page_url": "https://example.com/guide",
                "content": "WebDiag checks crawl directives. Reports keep evidence.",
                "target_query": "technical audit",
                "objective": "Improve clarity.",
                "factual_constraints": ["Reports keep evidence."],
            },
            {
                "revised_content": (
                    "WebDiag checks crawl directives and explains them. Reports keep evidence."
                ),
                "changes": [
                    {
                        "kind": "clarity",
                        "before_excerpt": "WebDiag checks crawl directives.",
                        "after_excerpt": (
                            "WebDiag checks crawl directives and explains them."
                        ),
                        "rationale": "Clarifies the result.",
                    }
                ],
                "preserved_fact_indexes": [0],
                "warnings": [],
            },
            "preserve every factual constraint verbatim",
        ),
        (
            "ai_search_intent_page_fit",
            {
                "locale": "en",
                "page_url": "https://example.com/guide",
                "primary_query": "how to audit technical SEO",
                "intended_page_type": "informational",
                "page_title": "How to audit technical SEO",
                "h1": "Technical SEO audit steps",
                "content": "The guide explains crawl directives and sitemap checks.",
            },
            {
                "inferred_intent": "informational",
                "confidence": "high",
                "fit": "aligned",
                "evidence": ["How to audit technical SEO"],
                "gaps": [],
                "recommendations": [],
                "warnings": [],
            },
            "not a live SERP classification",
        ),
    ],
)
def test_content_workbench_uses_strict_grounded_openrouter_policy(
    tool_id: str,
    input_value: dict[str, object],
    output: dict[str, object],
    required_instruction: str,
) -> None:
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(200, json=_response(output))

    provider = OpenRouterProvider(
        httpx.Client(
            transport=httpx.MockTransport(handler),
            headers={"Authorization": "Bearer test-key"},
        )
    )
    request = ProviderRequest(
        run_id="11111111-1111-4111-8111-111111111111",
        tool_id=tool_id,
        contract_version="v1",
        model_policy="openai/gpt-5.6-luna",
        input=input_value,
        safety_identifier="opaque-safety-identifier-value-1234567890",
    )

    result = provider.execute(request)

    assert result.output == output
    sent = json.loads(requests[0].content)
    assert sent["model"] == "openai/gpt-5.6-luna"
    assert sent["reasoning_effort"] == "low"
    assert sent["provider"] == {
        "allow_fallbacks": False,
        "data_collection": "deny",
        "require_parameters": True,
        "zdr": True,
    }
    schema = sent["response_format"]["json_schema"]["schema"]
    assert schema["additionalProperties"] is False
    system_message = sent["messages"][0]["content"]
    assert required_instruction in system_message
    assert "untrusted data" in system_message
    assert "search volume" in system_message
    assert "rankings" in system_message
    assert json.loads(sent["messages"][1]["content"]) == input_value
