from __future__ import annotations

import pytest
from webdiag_worker.ai import ProviderRequest
from webdiag_worker.autonomous_provider import AutonomousAIProvider, HeuristicAIProvider


def test_heuristic_provider_produces_valid_result_for_all_tools() -> None:
    provider = HeuristicAIProvider()

    test_cases = [
        (
            "ai_audit_action_plan",
            {
                "locale": "ru",
                "target_origin": "https://example.ru",
                "issues": [
                    {
                        "issue_id": "test_issue",
                        "title": "Missing title",
                        "description": "Page has no title",
                        "affected_urls": ["https://example.ru/"],
                    }
                ],
            },
        ),
        (
            "ai_meta_serp_studio",
            {
                "locale": "ru",
                "primary_query": "аудит сайта",
                "brand": "WebDiag",
                "h1": "Анализ сайта онлайн",
                "content": "WebDiag проверяет сайты по 140 параметрам.",
            },
        ),
        (
            "ai_schema_studio",
            {
                "locale": "ru",
                "facts": ["Название: WebDiag", "Тип: Инструмент SEO"],
            },
        ),
        (
            "ai_faq_studio",
            {
                "locale": "ru",
                "source_content": "WebDiag предоставляет 140 инструментов для проверки сайта. Сервис анализирует SEO, DNS и безопасность.",
                "question_count": 3,
            },
        ),
        (
            "ai_alt_text_studio",
            {
                "locale": "ru",
                "context": "График скорости ответа сервера",
            },
        ),
        (
            "ai_content_brief",
            {
                "locale": "ru",
                "audience": "SEO-специалисты",
                "objective": "Оптимизация скорости",
                "facts": ["LCP должен быть меньше 2.5 секунд."],
            },
        ),
        (
            "ai_content_optimizer",
            {
                "locale": "ru",
                "content": "Начальный текст для проверки и оптимизации страницы.",
                "factual_constraints": ["Важное требование контента."],
            },
        ),
        (
            "ai_search_intent_page_fit",
            {
                "locale": "ru",
                "primary_query": "проверка сайта",
                "intended_page_type": "informational",
                "content": "проверка сайта онлайн на ошибки и скорость",
            },
        ),
        (
            "ai_competitor_gap_report",
            {
                "locale": "ru",
                "own_page": {"content": "Текст нашей страницы аудита сайта."},
                "competitor_pages": [{"content": "Конкурентный текст с дополнительными подробностями."}],
            },
        ),
        (
            "ai_internal_linking_planner",
            {
                "locale": "ru",
                "pages": [
                    {"content": "Страница услуг по продвижению сайта."},
                    {"content": "Страница цен и тарифов на аудит."},
                ],
            },
        ),
        (
            "ai_redirect_migration_mapper",
            {
                "locale": "ru",
                "old_pages": [{"url": "https://example.ru/old-page", "content": "Старая страница"}],
                "new_pages": [{"url": "https://example.ru/new-page", "content": "Новая страница"}],
            },
        ),
        (
            "ai_localization_workbench",
            {
                "source_content": "Исходный текст страницы для перевода.",
                "target_locale": "en",
                "glossary": [{"source_term": "страницы", "target_term": "pages"}],
                "constraints": ["Обязательное условие"],
            },
        ),
        (
            "ai_regex_workbench",
            {
                "dialect": "python",
                "description": "Проверка slug",
                "cases": [{"text": "slug-123", "expected_match": True}],
            },
        ),
    ]

    for tool_id, inp in test_cases:
        req = ProviderRequest(
            run_id="run-1",
            tool_id=tool_id,
            contract_version="v1",
            model_policy="openai/gpt-6-luna",
            input=inp,
        )
        res = provider.execute(req)
        assert res.output is not None
        assert isinstance(res.output, dict)


def test_autonomous_provider_from_env_without_api_key_uses_heuristic(monkeypatch) -> None:
    monkeypatch.delenv("AI_GATEWAY_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    provider = AutonomousAIProvider.from_env()
    assert provider._delegate is None

    req = ProviderRequest(
        run_id="run-2",
        tool_id="ai_alt_text_studio",
        contract_version="v1",
        model_policy="openai/gpt-6-luna",
        input={"context": "Логотип WebDiag"},
    )
    res = provider.execute(req)
    assert res.output["decorative"] is False
    assert "WebDiag" in res.output["alt_text"]
