import json

import httpx
import pytest

from webdiag_worker.ai import ProviderRequest
from webdiag_worker.vercel_gateway_provider import VercelAIGatewayProvider


def _response(output: dict[str, object]) -> dict[str, object]:
    return {
        "id": "gen_final_text_123",
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
    ("tool_id", "input_value", "output", "required_instructions"),
    [
        (
            "ai_redirect_migration_mapper",
            {
                "locale": "en",
                "old_pages": [
                    {
                        "page_url": "https://old.example/robots",
                        "title": "Robots guide",
                        "h1": "Robots guide",
                        "content": "The old guide explains crawl access rules.",
                    }
                ],
                "new_pages": [
                    {
                        "page_url": "https://new.example/crawl",
                        "title": "Crawl guide",
                        "h1": "Crawl guide",
                        "content": "The new guide explains crawl access rules.",
                    }
                ],
            },
            {
                "summary": "One redirect is proposed.",
                "mappings": [
                    {
                        "old_page_index": 0,
                        "action": "redirect",
                        "target_page_index": 0,
                        "confidence": "high",
                        "old_evidence": "crawl access rules",
                        "target_evidence": "crawl access rules",
                        "rationale": "The supplied snapshots cover the same topic.",
                    }
                ],
                "warnings": [],
            },
            ("Do not crawl", "reviewable redirect proposal", "Do not claim deployment"),
        ),
        (
            "ai_localization_workbench",
            {
                "locale": "ru",
                "source_locale": "en",
                "target_locale": "ru",
                "source_content": "WebDiag stores a saved audit.",
                "glossary": [
                    {"source_term": "saved audit", "target_term": "сохранённый аудит"}
                ],
                "verbatim_constraints": ["WebDiag"],
            },
            {
                "localized_content": "WebDiag хранит сохранённый аудит.",
                "glossary_usages": [
                    {
                        "glossary_index": 0,
                        "source_excerpt": "saved audit",
                        "target_excerpt": "сохранённый аудит",
                    }
                ],
                "preserved_constraint_indexes": [0],
                "warnings": [],
            },
            ("verbatim constraint", "not certified", "exact source and target excerpts"),
        ),
        (
            "ai_regex_workbench",
            {
                "locale": "en",
                "dialect": "javascript",
                "task": "Draft a lowercase slug pattern.",
                "cases": [
                    {"text": "audit-guide", "expected_match": True},
                    {"text": "Audit Guide", "expected_match": False},
                ],
                "constraints": ["Match the whole input."],
            },
            {
                "dialect": "javascript",
                "pattern": "^[a-z]+(?:-[a-z]+)*$",
                "validation_status": "unverified",
                "case_plan": [
                    {"case_index": 0, "expected_match": True},
                    {"case_index": 1, "expected_match": False},
                ],
                "explanation": "Drafts a whole-string lowercase slug pattern.",
                "warnings": ["The pattern has not been executed by WebDiag."],
            },
            ("Do not execute", "unverified", "Do not claim compilation"),
        ),
    ],
)
def test_final_text_tools_use_strict_honest_gateway_policies(
    tool_id: str,
    input_value: dict[str, object],
    output: dict[str, object],
    required_instructions: tuple[str, ...],
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
    if tool_id == "ai_redirect_migration_mapper":
        mapping_schema = sent["response_format"]["json_schema"]["schema"]["$defs"][
            "RedirectMapping"
        ]
        assert "target_page_index" in mapping_schema["required"]
        assert "target_evidence" in mapping_schema["required"]
    assert sent["providerOptions"] == {"gateway": {"zeroDataRetention": True}}
    instructions = sent["messages"][0]["content"]
    assert "untrusted data" in instructions
    for required in required_instructions:
        assert required in instructions
    assert json.loads(sent["messages"][1]["content"]) == input_value
