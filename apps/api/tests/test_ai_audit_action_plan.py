import sqlite3
from datetime import UTC, datetime

import pytest

from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.accounts.workspace_models import (
    SavedAuditCheck,
    SavedAuditIssue,
    SavedAuditPayload,
    SavedAuditRecommendation,
)
from webdiag_api.accounts.workspace_storage import SqliteWorkspaceStore
from webdiag_api.ai.catalog import AIToolCatalog, AIToolDefinition, AIToolState
from webdiag_api.ai.input_resolver import AIInputResolutionError, AIInputResolver
from webdiag_api.ai.models import AIRunCreateRequest
from webdiag_api.ai.service import AIService, AIServiceError
from webdiag_api.ai.storage import SqliteAIStore


def _payload() -> SavedAuditPayload:
    return SavedAuditPayload(
        target_origin="https://example.com",
        status="succeeded",
        score=78,
        checks=(
            SavedAuditCheck(
                check_id="title",
                name="Page title",
                category="seo",
                status="warning",
            ),
        ),
        issues=(
            SavedAuditIssue(
                issue_id="issue-title",
                check_id="title",
                category="seo",
                severity="warning",
                priority="high",
                title="Missing page title",
                description="The saved audit found no descriptive title.",
                affected_urls=("https://example.com/page",),
                recommendation=SavedAuditRecommendation(
                    summary="Add a descriptive title.",
                    steps=("Write a title from the persisted page evidence.",),
                    expected_impact="Clearer deterministic title check.",
                ),
            ),
        ),
        completed_at=datetime(2026, 8, 12, 12, 0, tzinfo=UTC),
    )


def _workspace(tmp_path):
    database_path = tmp_path / "action-plan.sqlite3"
    accounts = SqliteAccountStore(str(database_path))
    owner = accounts.create_user(
        email="owner-action@example.com",
        display_name="Owner Action",
        password_hash="test-only-password-hash",
    )
    foreign = accounts.create_user(
        email="foreign-action@example.com",
        display_name="Foreign Action",
        password_hash="test-only-password-hash",
    )
    workspace = SqliteWorkspaceStore(str(database_path))
    project = workspace.create_project(
        user_id=owner.id,
        name="Example",
        origin="https://example.com",
    )
    audit = workspace.save_audit(user_id=owner.id, project_id=project.id, payload=_payload())
    return database_path, workspace, owner.id, foreign.id, project.id, audit.id


def test_resolver_snapshots_only_owned_digest_checked_saved_audit(tmp_path) -> None:
    _database_path, workspace, owner_id, _foreign_id, project_id, audit_id = _workspace(
        tmp_path
    )
    resolver = AIInputResolver(workspace)

    snapshot = resolver.resolve(
        user_id=owner_id,
        tool_id="ai_audit_action_plan",
        validated_input={"locale": "ru", "project_id": project_id, "audit_id": audit_id},
    )

    assert snapshot == {
        "locale": "ru",
        "target_origin": "https://example.com",
        "score": 78,
        "checks": [
            {
                "check_id": "title",
                "name": "Page title",
                "category": "seo",
                "status": "warning",
            }
        ],
        "issues": [
            {
                "issue_id": "issue-title",
                "check_id": "title",
                "category": "seo",
                "severity": "warning",
                "priority": "high",
                "title": "Missing page title",
                "description": "The saved audit found no descriptive title.",
                "affected_urls": ["https://example.com/page"],
                "recommendation": {
                    "summary": "Add a descriptive title.",
                    "steps": ["Write a title from the persisted page evidence."],
                    "expected_impact": "Clearer deterministic title check.",
                },
            }
        ],
    }
    assert "project_id" not in snapshot and "audit_id" not in snapshot


def test_resolver_returns_same_not_found_for_missing_and_foreign_audit(tmp_path) -> None:
    _database_path, workspace, _owner_id, foreign_id, project_id, audit_id = _workspace(
        tmp_path
    )
    resolver = AIInputResolver(workspace)

    for requested_audit in (audit_id, "00000000-0000-4000-8000-000000000000"):
        with pytest.raises(AIInputResolutionError) as error:
            resolver.resolve(
                user_id=foreign_id,
                tool_id="ai_audit_action_plan",
                validated_input={
                    "locale": "en",
                    "project_id": project_id,
                    "audit_id": requested_audit,
                },
            )
        assert (error.value.status_code, error.value.code) == (404, "ai_source_not_found")


def test_resolver_rejects_corrupted_saved_audit_without_leaking_payload(tmp_path) -> None:
    database_path, workspace, owner_id, _foreign_id, project_id, audit_id = _workspace(tmp_path)
    with sqlite3.connect(database_path) as connection:
        connection.execute(
            "UPDATE account_workspace_saved_audits SET payload_json = '{}' WHERE id = ?",
            (audit_id,),
        )

    with pytest.raises(AIInputResolutionError) as error:
        AIInputResolver(workspace).resolve(
            user_id=owner_id,
            tool_id="ai_audit_action_plan",
            validated_input={"locale": "en", "project_id": project_id, "audit_id": audit_id},
        )
    assert (error.value.status_code, error.value.code) == (500, "ai_source_unavailable")
    assert "payload" not in str(error.value).casefold()


def test_service_persists_resolved_snapshot_instead_of_client_references(tmp_path) -> None:
    database_path, workspace, owner_id, _foreign_id, project_id, audit_id = _workspace(tmp_path)
    tool = AIToolDefinition(
        id="ai_audit_action_plan",
        contract_version="v1",
        state=AIToolState.READY,
        credit_price=5,
        model_policy="openai/gpt-5.6-luna",
    )
    service = AIService(
        SqliteAIStore(str(database_path), lease_seconds=60),
        catalog=AIToolCatalog((tool,)),
        input_max_bytes=100_000,
        input_resolver=AIInputResolver(workspace),
    )
    service.grant_beta_credits(
        user_id=owner_id,
        quantity=10,
        reason="action-plan test",
        correlation_id="action-plan-grant",
    )

    service.create_run(
        user_id=owner_id,
        request=AIRunCreateRequest(
            tool_id="ai_audit_action_plan",
            input={"locale": "en", "project_id": project_id, "audit_id": audit_id},
        ),
        idempotency_key="action-plan-run",
    )
    claim = service.claim_pending()

    assert claim is not None
    assert claim.input["target_origin"] == "https://example.com"
    assert "project_id" not in claim.input and "audit_id" not in claim.input

    with pytest.raises(AIServiceError) as error:
        service.create_run(
            user_id=owner_id,
            request=AIRunCreateRequest(
                tool_id="ai_audit_action_plan",
                input={
                    "locale": "en",
                    "project_id": project_id,
                    "audit_id": "00000000-0000-4000-8000-000000000000",
                },
            ),
            idempotency_key="action-plan-missing",
        )
    assert (error.value.status_code, error.value.code) == (404, "ai_source_not_found")
