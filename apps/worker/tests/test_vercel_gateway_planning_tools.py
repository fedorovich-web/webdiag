import json

import httpx
import pytest

from webdiag_worker.ai import ProviderRequest
from webdiag_worker.vercel_gateway_provider import VercelAIGatewayProvider


def _response(output: dict[str, object]) -> dict[str, object]:
    return {
        "id": "gen_planning_123",
        "model": "openai/gpt-5.6-sol",
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
        "usage": {"prompt_tokens": 30, "completion_tokens": 12, "cost": 0.00003},
    }


@pytest.mark.parametrize(
    ("tool_id", "input_value", "output", "required_instruction"),
    [
        (
            "ai_competitor_gap_report",
            {
                "locale": "en",
                "objective": None,
                "own_page": {
                    "page_url": "https://example.com/guide",
                    "title": "Audit guide",
                    "h1": "Audit guide",
                    "content": "The guide covers crawl directives.",
                },
                "competitor_pages": [
                    {
                        "page_url": "https://comparison.example/guide",
                        "title": "Complete audit guide",
                        "h1": "Complete audit guide",
                        "content": "The guide covers crawl directives and sitemap checks.",
                    }
                ],
            },
            {
                "summary": "One supplied-page gap was identified.",
                "gaps": [
                    {
                        "topic": "Sitemap checks",
                        "own_evidence": [],
                        "competitor_evidence": [
                            {"page_index": 0, "excerpt": "sitemap checks"}
                        ],
                        "recommendation": "Review whether sitemap checks belong in the guide.",
                    }
                ],
                "warnings": [],
            },
            "exact supplied-page substring",
        ),
        (
            "ai_internal_linking_planner",
            {
                "locale": "ru",
                "pages": [
                    {
                        "page_url": "https://example.ru/robots",
                        "title": "Проверка robots.txt",
                        "h1": "Проверка robots.txt",
                        "content": "Материал объясняет правила обхода сайта.",
                    },
                    {
                        "page_url": "https://example.ru/audit",
                        "title": "Технический аудит",
                        "h1": "Технический аудит",
                        "content": "Аудит включает проверку правил обхода сайта.",
                    },
                ],
                "existing_links": [],
            },
            {
                "summary": "Предложена одна ссылка для проверки.",
                "proposals": [
                    {
                        "source_page_index": 0,
                        "target_page_index": 1,
                        "suggested_anchor": "технический аудит",
                        "source_evidence": "правила обхода сайта",
                        "target_evidence": "Аудит включает проверку правил обхода сайта.",
                        "rationale": "Связывает близкие темы переданных страниц.",
                    }
                ],
                "warnings": [],
            },
            "existing directed links",
        ),
    ],
)
def test_planning_tools_use_strict_snapshot_aware_gateway_policies(
    tool_id: str,
    input_value: dict[str, object],
    output: dict[str, object],
    required_instruction: str,
) -> None:
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(200, json=_response(output))

    provider = VercelAIGatewayProvider(
        httpx.Client(
            transport=httpx.MockTransport(handler),
            headers={"Authorization": "Bearer test-key"},
        )
    )
    result = provider.execute(
        ProviderRequest(
            run_id="11111111-1111-4111-8111-111111111111",
            tool_id=tool_id,
            contract_version="v1",
            model_policy="openai/gpt-5.6-sol",
            input=input_value,
            safety_identifier="opaque-safety-identifier-value-1234567890",
        )
    )

    assert result.output == output
    sent = json.loads(requests[0].content)
    assert sent["model"] == "openai/gpt-5.6-sol"
    assert sent["response_format"]["json_schema"]["strict"] is True
    assert sent["response_format"]["json_schema"]["schema"]["additionalProperties"] is False
    assert sent["providerOptions"] == {"gateway": {"zeroDataRetention": True}}
    instructions = sent["messages"][0]["content"]
    assert required_instruction in instructions
    assert "untrusted data" in instructions
    assert "Do not crawl" in instructions
    assert "search volume" in instructions
    assert "rankings" in instructions
    assert json.loads(sent["messages"][1]["content"]) == input_value
