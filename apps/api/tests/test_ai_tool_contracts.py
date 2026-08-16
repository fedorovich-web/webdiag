import pytest

from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.ai.catalog import AIToolCatalog, AIToolDefinition, AIToolState
from webdiag_api.ai.models import AIRunCreateRequest
from webdiag_api.ai.service import AIService, AIServiceError
from webdiag_api.ai.storage import SqliteAIStore
from webdiag_api.ai.tool_contracts import (
    AIToolContractError,
    validate_output,
    validate_provider_input,
    validate_public_input,
)


def test_public_inputs_are_strict_bounded_and_canonical() -> None:
    meta = validate_public_input(
        "ai_meta_serp_studio",
        {
            "locale": "ru",
            "page_url": "HTTPS://EXAMPLE.COM./path?x=1",
            "current_title": "Текущий заголовок",
            "current_description": "Текущее описание",
            "h1": "Диагностика сайта",
            "content": "Проверяем техническое состояние сайта и объясняем найденные проблемы.",
            "primary_query": "диагностика сайта",
            "brand": "WebDiag",
        },
    )
    assert meta["page_url"] == "https://example.com/path?x=1"
    assert meta["locale"] == "ru"

    with pytest.raises(AIToolContractError):
        validate_public_input(
            "ai_faq_studio",
            {
                "locale": "ru",
                "source_content": "Достаточно длинный проверяемый исходный текст для FAQ.",
                "question_count": True,
            },
        )
    with pytest.raises(AIToolContractError):
        validate_public_input(
            "ai_meta_serp_studio",
            {
                "locale": "ru",
                "page_url": "http://127.0.0.1/private",
                "content": "Достаточно длинный исходный текст страницы.",
                "unexpected": "not allowed",
            },
        )
    with pytest.raises(AIToolContractError):
        validate_public_input(
            "ai_audit_action_plan",
            {
                "locale": "ru",
                "project_id": "------------------------------------",
                "audit_id": "00000000-0000-4000-8000-000000000000",
            },
        )


def test_transformed_provider_inputs_have_strict_current_contracts() -> None:
    audit_input = {
        "locale": "ru",
        "target_origin": "https://example.com",
        "score": 72,
        "checks": [
            {
                "check_id": "title",
                "name": "Page title",
                "category": "seo",
                "status": "warning",
            }
        ],
        "issues": [],
    }
    assert validate_provider_input("ai_audit_action_plan", audit_input) == audit_input

    image = {
        "object_key": f"ai-uploads/aa/{'b' * 62}",
        "media_type": "image/png",
        "byte_size": 1_024,
        "width": 320,
        "height": 240,
        "sha256": "c" * 64,
    }
    alt_input = {
        "locale": "en",
        "page_context": "Technical audit dashboard",
        "surrounding_text": None,
        "purpose": "informative",
        "image": image,
    }
    assert validate_provider_input("ai_alt_text_studio", alt_input) == alt_input
    edit_input = {
        "locale": "ru",
        "prompt": "Удалить фон и сохранить форму предмета.",
        "aspect_ratio": "auto",
        "quality": "medium",
        "background": "opaque",
        "image": image,
    }
    assert validate_provider_input("ai_image_edit_studio", edit_input) == edit_input

    with pytest.raises(AIToolContractError):
        validate_provider_input(
            "ai_audit_action_plan",
            {**audit_input, "unexpected": "not allowed"},
        )
    with pytest.raises(AIToolContractError):
        validate_provider_input(
            "ai_alt_text_studio",
            {**alt_input, "image": {**image, "width": 8_192, "height": 8_192}},
        )


def test_audit_action_plan_rejects_unknown_issue_and_url_references() -> None:
    provider_input = {
        "locale": "en",
        "target_origin": "https://example.com",
        "score": 72,
        "issues": [
            {
                "issue_id": "issue-title",
                "category": "seo",
                "severity": "warning",
                "priority": "high",
                "title": "Missing title",
                "description": "The page title is missing.",
                "affected_urls": ["https://example.com/page"],
                "recommendation": {
                    "summary": "Add a descriptive title.",
                    "steps": ["Write a title from the page content."],
                    "expected_impact": "Clearer search snippet.",
                },
            }
        ],
    }
    valid = {
        "summary": "Fix the persisted issue first.",
        "actions": [
            {
                "issue_ids": ["issue-title"],
                "title": "Add the page title",
                "rationale": "The saved audit reports a missing title.",
                "steps": ["Write and publish a descriptive title."],
                "verification": "Run the deterministic title check again.",
                "affected_urls": ["https://example.com/page"],
            }
        ],
    }
    assert validate_output("ai_audit_action_plan", provider_input, valid)["actions"] == valid[
        "actions"
    ]

    invalid_issue = {**valid, "actions": [{**valid["actions"][0], "issue_ids": ["invented"]}]}
    invalid_url = {
        **valid,
        "actions": [
            {**valid["actions"][0], "affected_urls": ["https://other.example/private"]}
        ],
    }
    with pytest.raises(AIToolContractError):
        validate_output("ai_audit_action_plan", provider_input, invalid_issue)
    with pytest.raises(AIToolContractError):
        validate_output("ai_audit_action_plan", provider_input, invalid_url)


def test_meta_output_has_exactly_three_variants_and_server_counts() -> None:
    provider_input = validate_public_input(
        "ai_meta_serp_studio",
        {
            "locale": "en",
            "page_url": "https://example.com/check",
            "content": (
                "WebDiag checks a supplied page and reports deterministic technical findings."
            ),
        },
    )
    output = {
        "variants": [
            {
                "title": f"Technical page check {index}",
                "description": f"Inspect deterministic page findings with WebDiag variant {index}.",
                "rationale": "Uses only the supplied page description.",
            }
            for index in range(1, 4)
        ]
    }
    normalized = validate_output("ai_meta_serp_studio", provider_input, output)
    assert [item["title_characters"] for item in normalized["variants"]] == [
        len(item["title"]) for item in output["variants"]
    ]
    assert [item["description_characters"] for item in normalized["variants"]] == [
        len(item["description"]) for item in output["variants"]
    ]
    with pytest.raises(AIToolContractError):
        validate_output(
            "ai_meta_serp_studio",
            provider_input,
            {"variants": output["variants"][:2]},
        )


@pytest.mark.parametrize(
    "schema_type",
    ("WebPage", "Article", "Organization", "LocalBusiness", "Product"),
)
def test_schema_input_accepts_only_supported_types(schema_type: str) -> None:
    validated = validate_public_input(
        "ai_schema_studio",
        {
            "locale": "en",
            "schema_type": schema_type,
            "page_url": "https://example.com/about",
            "facts": ["WebDiag", "WebDiag explains deterministic website findings."],
        },
    )
    assert validated["schema_type"] == schema_type


def test_schema_output_requires_allowlisted_grounded_properties() -> None:
    provider_input = validate_public_input(
        "ai_schema_studio",
        {
            "locale": "en",
            "schema_type": "Organization",
            "page_url": "https://example.com/about",
            "facts": ["WebDiag", "Contact phone: +7 999 111-22-33"],
        },
    )
    valid = {
        "json_ld": {
            "@context": "https://schema.org",
            "@type": "Organization",
            "url": "https://example.com/about",
            "name": "WebDiag",
            "telephone": "+7 999 111-22-33",
        },
        "property_sources": {"/name": [0], "/telephone": [1]},
        "warnings": [],
    }
    assert validate_output("ai_schema_studio", provider_input, valid)["json_ld"] == valid[
        "json_ld"
    ]

    invented = {
        **valid,
        "json_ld": {**valid["json_ld"], "aggregateRating": {"ratingValue": "5"}},
        "property_sources": {**valid["property_sources"], "/aggregateRating/ratingValue": [0]},
    }
    unsupported_value = {
        **valid,
        "json_ld": {**valid["json_ld"], "telephone": "+7 000 000-00-00"},
    }
    with pytest.raises(AIToolContractError):
        validate_output("ai_schema_studio", provider_input, invented)
    with pytest.raises(AIToolContractError):
        validate_output("ai_schema_studio", provider_input, unsupported_value)


def test_faq_output_matches_count_unique_questions_and_exact_evidence() -> None:
    source = (
        "WebDiag checks technical page signals.\n"
        "The saved result lists deterministic findings and recommendations.\n"
        "AI suggestions are shown separately from measured facts."
    )
    provider_input = validate_public_input(
        "ai_faq_studio",
        {
            "locale": "en",
            "source_content": source,
            "audience": "site owners",
            "question_count": 3,
        },
    )
    valid = {
        "items": [
            {
                "question": "What does WebDiag check?",
                "answer": "It checks technical page signals.",
                "evidence": "WebDiag checks technical page signals.",
            },
            {
                "question": "What is stored in a saved result?",
                "answer": "It contains deterministic findings and recommendations.",
                "evidence": "The saved result lists deterministic findings and recommendations.",
            },
            {
                "question": "How are AI suggestions presented?",
                "answer": "They are separated from measured facts.",
                "evidence": "AI suggestions are shown separately from measured facts.",
            },
        ]
    }
    assert len(validate_output("ai_faq_studio", provider_input, valid)["items"]) == 3

    invented = {
        **valid,
        "items": [*valid["items"][:2], {**valid["items"][2], "evidence": "Live rankings"}],
    }
    duplicate = {
        **valid,
        "items": [valid["items"][0], valid["items"][0], valid["items"][2]],
    }
    with pytest.raises(AIToolContractError):
        validate_output("ai_faq_studio", provider_input, invented)
    with pytest.raises(AIToolContractError):
        validate_output("ai_faq_studio", provider_input, duplicate)


def _meta_service(tmp_path):
    database_path = tmp_path / "ai-contracts.sqlite3"
    user = SqliteAccountStore(str(database_path)).create_user(
        email="ai-contracts@example.com",
        display_name="AI Contracts",
        password_hash="test-only-password-hash",
    )
    store = SqliteAIStore(str(database_path), lease_seconds=60)
    tool = AIToolDefinition(
        id="ai_meta_serp_studio",
        contract_version="v1",
        state=AIToolState.READY,
        credit_price=3,
        model_policy="openai/gpt-5.6-luna",
    )
    service = AIService(store, catalog=AIToolCatalog((tool,)), input_max_bytes=100_000)
    service.grant_beta_credits(
        user_id=user.id,
        quantity=10,
        reason="contract test",
        correlation_id="contracts-grant",
    )
    return service, store, user.id


def test_service_validates_and_normalizes_tool_input_before_persistence(tmp_path) -> None:
    service, _store, user_id = _meta_service(tmp_path)
    request = AIRunCreateRequest(
        tool_id="ai_meta_serp_studio",
        input={
            "locale": "en",
            "page_url": "HTTPS://EXAMPLE.COM./check",
            "content": "WebDiag reports deterministic technical findings for this page.",
        },
    )
    run, created = service.create_run(
        user_id=user_id,
        request=request,
        idempotency_key="meta-contract-1",
    )
    claim = service.claim_pending()

    assert created is True
    assert claim is not None and claim.run_id == run.id
    assert claim.input["page_url"] == "https://example.com/check"

    invalid = AIRunCreateRequest(
        tool_id="ai_meta_serp_studio",
        input={"locale": "en", "page_url": "http://localhost", "content": "x" * 30},
    )
    with pytest.raises(AIServiceError) as error:
        service.create_run(
            user_id=user_id,
            request=invalid,
            idempotency_key="meta-contract-2",
        )
    assert (error.value.status_code, error.value.code) == (422, "ai_invalid_tool_input")


def test_invalid_provider_output_releases_reservation_without_capture(tmp_path) -> None:
    service, _store, user_id = _meta_service(tmp_path)
    run, _created = service.create_run(
        user_id=user_id,
        request=AIRunCreateRequest(
            tool_id="ai_meta_serp_studio",
            input={
                "locale": "en",
                "page_url": "https://example.com/check",
                "content": "WebDiag reports deterministic technical findings for this page.",
            },
        ),
        idempotency_key="meta-contract-output",
    )
    claim = service.claim_pending()
    assert claim is not None
    service.mark_submitted(run_id=run.id, lease_token=claim.lease_token)

    with pytest.raises(AIServiceError) as error:
        service.complete_run(
            run_id=run.id,
            lease_token=claim.lease_token,
            output={"variants": []},
            provider_request_id="req_invalid",
            input_units=12,
            output_units=4,
            provider_cost_nano_usd=12_000,
        )

    assert (error.value.status_code, error.value.code) == (422, "ai_invalid_provider_output")
    assert service.get_run(user_id=user_id, run_id=run.id).state == "failed"
    balance = service.get_credits(user_id=user_id)
    assert (balance.available, balance.reserved) == (10, 0)
