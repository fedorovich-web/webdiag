from dataclasses import dataclass

import pytest

from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.accounts.workspace_storage import SqliteWorkspaceStore
from webdiag_api.ai.catalog import AIToolCatalog, AIToolDefinition, AIToolState
from webdiag_api.ai.input_resolver import AIInputResolutionError, AIInputResolver
from webdiag_api.ai.models import AIRunCreateRequest
from webdiag_api.ai.service import AIService
from webdiag_api.ai.storage import SqliteAIStore
from webdiag_api.ai.tool_contracts import validate_public_input
from webdiag_api.audit.fetcher import SafeFetchResult


@dataclass
class _FakeFetcher:
    pages: dict[str, str]

    def __post_init__(self) -> None:
        self.calls: list[tuple[str, str | None]] = []

    def fetch(self, url: str, *, allowed_origin: str | None = None) -> SafeFetchResult:
        self.calls.append((url, allowed_origin))
        body = self.pages[url]
        return SafeFetchResult(
            requested_url=url,
            final_url=url,
            status_code=200,
            headers={"content-type": "text/html; charset=utf-8"},
            body_text=body,
            content_type="text/html; charset=utf-8",
            redirect_chain=(),
        )


def _workspace(tmp_path):
    database_path = tmp_path / "context-resolver.sqlite3"
    owner = SqliteAccountStore(str(database_path)).create_user(
        email="context-owner@example.com",
        display_name="Context Owner",
        password_hash="test-only-password-hash",
    )
    workspace = SqliteWorkspaceStore(str(database_path))
    project = workspace.create_project(
        user_id=owner.id,
        name="Example",
        origin="https://example.com",
    )
    return workspace, owner.id, project


def _page(url: str, content: str = "client content that must be ignored") -> dict[str, object]:
    return {"page_url": url, "title": "Client title", "h1": "Client heading", "content": content}


def test_competitor_resolver_replaces_all_client_page_evidence_with_fetched_html(tmp_path) -> None:
    workspace, owner_id, _project = _workspace(tmp_path)
    fetcher = _FakeFetcher(
        {
            "https://example.com/landing": (
                "<html><head><title>Owned title</title></head><body>"
                "<h1>Owned heading</h1>Owned page evidence from the server.</body></html>"
            ),
            "https://competitor.example/landing": (
                "<html><head><title>Competitor title</title></head><body>"
                "<h1>Competitor heading</h1>Competitor evidence from the server.</body></html>"
            ),
        }
    )
    resolver = AIInputResolver(workspace, fetcher=fetcher)
    validated = validate_public_input(
        "ai_competitor_gap_report",
        {
            "locale": "en",
            "objective": "Compare the supplied pages.",
            "own_page": _page("https://example.com/landing?secret=client"),
            "competitor_pages": [_page("https://competitor.example/landing")],
        },
    )

    resolved = resolver.resolve(
        user_id=owner_id,
        tool_id="ai_competitor_gap_report",
        validated_input=validated,
    )

    own_page = resolved["own_page"]
    competitor_page = resolved["competitor_pages"][0]
    assert own_page == {
        "page_url": "https://example.com/landing",
        "title": "Owned title",
        "h1": "Owned heading",
        "content": "Owned heading Owned page evidence from the server.",
    }
    assert competitor_page["title"] == "Competitor title"
    assert competitor_page["content"] == "Competitor heading Competitor evidence from the server."
    assert "client content" not in str(resolved)
    assert fetcher.calls == [
        ("https://example.com/landing", "https://example.com"),
        ("https://competitor.example/landing", None),
    ]


def test_internal_linking_resolver_requires_owned_origin_and_fetches_pages(tmp_path) -> None:
    workspace, owner_id, _project = _workspace(tmp_path)
    fetcher = _FakeFetcher(
        {
            "https://example.com/one": "<h1>One</h1>First page has enough server evidence.",
            "https://example.com/two": "<h1>Two</h1>Second page has enough server evidence.",
        }
    )
    resolver = AIInputResolver(workspace, fetcher=fetcher)
    validated = validate_public_input(
        "ai_internal_linking_planner",
        {
            "locale": "ru",
            "pages": [_page("https://example.com/one"), _page("https://example.com/two")],
            "existing_links": [{"source_page_index": 0, "target_page_index": 1}],
        },
    )

    resolved = resolver.resolve(
        user_id=owner_id,
        tool_id="ai_internal_linking_planner",
        validated_input=validated,
    )

    assert resolved["pages"][0]["content"] == "One First page has enough server evidence."
    assert resolved["existing_links"] == [{"source_page_index": 0, "target_page_index": 1}]
    assert all(origin == "https://example.com" for _url, origin in fetcher.calls)

    foreign = validate_public_input(
        "ai_internal_linking_planner",
        {
            "locale": "en",
            "pages": [_page("https://foreign.example/one"), _page("https://foreign.example/two")],
            "existing_links": [],
        },
    )
    with pytest.raises(AIInputResolutionError) as error:
        resolver.resolve(
            user_id=owner_id,
            tool_id="ai_internal_linking_planner",
            validated_input=foreign,
        )
    assert (error.value.status_code, error.value.code) == (404, "ai_source_not_found")


def test_owned_content_resolver_replaces_optimizer_and_intent_browser_hints(tmp_path) -> None:
    workspace, owner_id, _project = _workspace(tmp_path)
    fetcher = _FakeFetcher(
        {
            "https://example.com/guide": (
                "<html><head><title>Server title</title></head><body>"
                "<h1>Server heading</h1>Server-owned guide content for both tools.</body></html>"
            ),
        }
    )
    resolver = AIInputResolver(workspace, fetcher=fetcher)

    optimizer = resolver.resolve(
        user_id=owner_id,
        tool_id="ai_content_optimizer",
        validated_input=validate_public_input(
            "ai_content_optimizer",
            {
                "locale": "en",
                "page_url": "https://example.com/guide",
                "content": "Browser-supplied content must never reach the provider.",
                "target_query": "technical audit guide",
                "objective": None,
                "factual_constraints": [],
            },
        ),
    )
    intent = resolver.resolve(
        user_id=owner_id,
        tool_id="ai_search_intent_page_fit",
        validated_input=validate_public_input(
            "ai_search_intent_page_fit",
            {
                "locale": "ru",
                "page_url": "https://example.com/guide",
                "primary_query": "технический аудит",
                "intended_page_type": "informational",
                "page_title": "Browser title",
                "h1": "Browser heading",
                "content": "Browser-supplied content must never reach the provider.",
            },
        ),
    )

    assert optimizer["content"] == "Server heading Server-owned guide content for both tools."
    assert intent["page_title"] == "Server title"
    assert intent["h1"] == "Server heading"
    assert intent["content"] == "Server heading Server-owned guide content for both tools."
    assert "Browser" not in str(optimizer)
    assert "Browser" not in str(intent)
    assert fetcher.calls == [
        ("https://example.com/guide", "https://example.com"),
        ("https://example.com/guide", "https://example.com"),
    ]


def test_content_optimizer_rejects_client_fact_absent_from_owned_snapshot(tmp_path) -> None:
    workspace, owner_id, _project = _workspace(tmp_path)
    resolver = AIInputResolver(
        workspace,
        fetcher=_FakeFetcher(
            {
                "https://example.com/guide": (
                    "<h1>Verified guide</h1>The owned page contains confirmed evidence only."
                ),
            }
        ),
    )
    validated = validate_public_input(
        "ai_content_optimizer",
        {
            "locale": "en",
            "page_url": "https://example.com/guide",
            "target_query": None,
            "objective": None,
            "factual_constraints": ["An invented client claim."],
        },
    )

    with pytest.raises(AIInputResolutionError) as error:
        resolver.resolve(
            user_id=owner_id,
            tool_id="ai_content_optimizer",
            validated_input=validated,
        )

    assert (error.value.status_code, error.value.code) == (422, "ai_invalid_tool_input")


def test_context_resolver_fails_closed_for_non_html_or_fetch_errors(tmp_path) -> None:
    workspace, owner_id, _project = _workspace(tmp_path)

    class FailingFetcher:
        def fetch(self, _url: str, *, allowed_origin: str | None = None) -> SafeFetchResult:
            raise RuntimeError("transport detail must not escape")

    resolver = AIInputResolver(workspace, fetcher=FailingFetcher())
    validated = validate_public_input(
        "ai_competitor_gap_report",
        {
            "locale": "en",
            "objective": None,
            "own_page": _page("https://example.com/landing"),
            "competitor_pages": [_page("https://competitor.example/landing")],
        },
    )
    with pytest.raises(AIInputResolutionError) as error:
        resolver.resolve(
            user_id=owner_id,
            tool_id="ai_competitor_gap_report",
            validated_input=validated,
        )
    assert (error.value.status_code, error.value.code) == (502, "ai_source_unavailable")
    assert "transport" not in str(error.value).casefold()


def test_service_persists_server_resolved_context_snapshot(tmp_path) -> None:
    workspace, owner_id, _project = _workspace(tmp_path)
    fetcher = _FakeFetcher(
        {
            "https://example.com/landing": "<h1>Owned</h1>Owned server evidence for the run.",
            "https://competitor.example/landing": (
                "<h1>Competitor</h1>Competitor server evidence for the run."
            ),
        }
    )
    service = AIService(
        SqliteAIStore(str(tmp_path / "context-resolver.sqlite3"), lease_seconds=60),
        catalog=AIToolCatalog(
            (
                AIToolDefinition(
                    id="ai_competitor_gap_report",
                    contract_version="v1",
                    state=AIToolState.READY,
                    credit_price=3,
                    model_policy="openai/gpt-5.6-sol",
                ),
            )
        ),
        input_resolver=AIInputResolver(workspace, fetcher=fetcher),
        input_max_bytes=100_000,
    )
    service.grant_beta_credits(
        user_id=owner_id,
        quantity=3,
        reason="context resolver test",
        correlation_id="context-resolver-grant",
    )

    run, created = service.create_run(
        user_id=owner_id,
        request=AIRunCreateRequest(
            tool_id="ai_competitor_gap_report",
            input={
                "locale": "en",
                "objective": None,
                "own_page": {"page_url": "https://example.com/landing"},
                "competitor_pages": [{"page_url": "https://competitor.example/landing"}],
            },
        ),
        idempotency_key="context-resolver-run",
    )
    claim = service.claim_pending()

    assert created is True
    assert claim is not None
    assert claim.run_id == run.id
    assert claim.input["own_page"]["content"] == "Owned Owned server evidence for the run."
    assert "Competitor server evidence" in claim.input["competitor_pages"][0]["content"]
