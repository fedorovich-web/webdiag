import asyncio
from datetime import UTC, datetime
from pathlib import Path

import httpx

from webdiag_api.accounts.api import get_account_service
from webdiag_api.accounts.models import RegisterRequest
from webdiag_api.accounts.security import ScryptParameters
from webdiag_api.accounts.service import AccountService
from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.accounts.workspace_api import get_workspace_service
from webdiag_api.accounts.workspace_issues import (
    IssueListOptions,
    project_saved_audit_issues,
)
from webdiag_api.accounts.workspace_models import (
    AccountProject,
    SavedAuditDetailResponse,
    SavedAuditIssue,
    SavedAuditPayload,
    SavedAuditRecommendation,
    SavedAuditSummary,
)
from webdiag_api.accounts.workspace_service import WorkspaceService
from webdiag_api.accounts.workspace_storage import SqliteWorkspaceStore
from webdiag_api.main import app


class UnusedAuditService:
    def start_single_url_audit(self, origin: str):  # pragma: no cover - defensive
        raise AssertionError(f"Unexpected audit execution for {origin}")


def build_account_service(database_path: Path) -> AccountService:
    return AccountService(
        SqliteAccountStore(str(database_path)),
        session_ttl_seconds=3600,
        active_session_limit=10,
        scrypt_parameters=ScryptParameters(n=2**12),
    )


def register(service: AccountService, email: str) -> tuple[str, str]:
    session = service.register(
        RegisterRequest(
            email=email,
            display_name="Roman User",
            password="correct horse battery staple",
        )
    )
    return session.response.user.id, session.token


def build_workspace(database_path: Path) -> WorkspaceService:
    return WorkspaceService(
        SqliteWorkspaceStore(str(database_path)),
        audit_service=UnusedAuditService(),
    )


def saved_detail() -> SavedAuditDetailResponse:
    now = datetime.now(UTC)
    project = AccountProject(
        id="11111111-1111-4111-8111-111111111111",
        name="Main",
        origin="https://example.com",
        created_at=now,
        updated_at=now,
    )
    categories = (
        ("metadata.title.missing", "metadata", "p1", "medium", "Missing title"),
        ("performance.lcp.slow", "performance", "p0", "high", "Slow LCP"),
        ("accessibility.alt.missing", "accessibility", "p2", "medium", "Missing alt"),
        ("security.headers.missing", "security", "p0", "critical", "Missing headers"),
        ("content.thin", "content", "p3", "low", "Thin content"),
        ("http.status.error", "http", "p0", "high", "HTTP error"),
    )
    issues = tuple(
        SavedAuditIssue(
            issue_id=issue_id,
            check_id=issue_id.rsplit(".", 1)[0],
            category=category,
            severity=severity,
            priority=priority,
            title=title,
            description=f"Description for {title}",
            affected_urls=("https://example.com/page",),
            recommendation=SavedAuditRecommendation(
                summary=f"Fix {title}",
                steps=("Apply the documented correction.",),
                expected_impact="Improved audit result.",
            ),
        )
        for issue_id, category, priority, severity, title in categories
    )
    payload = SavedAuditPayload(
        target_origin=project.origin,
        status="succeeded",
        score=55,
        checks=(),
        issues=issues,
        completed_at=now,
    )
    audit = SavedAuditSummary(
        id="22222222-2222-4222-8222-222222222222",
        project_id=project.id,
        status="succeeded",
        score=payload.score,
        check_count=0,
        issue_count=len(issues),
        completed_at=now,
        created_at=now,
    )
    return SavedAuditDetailResponse(project=project, audit=audit, payload=payload)


async def request(path: str, *, cookie: str | None = None) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    headers = {"cookie": f"webdiag_session={cookie}"} if cookie else None
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.get(path, headers=headers)


def seed_saved_audit(workspace: WorkspaceService, user_id: str) -> SavedAuditDetailResponse:
    detail = saved_detail()
    project = workspace._store.create_project(  # noqa: SLF001 - test fixture
        user_id=user_id,
        name=detail.project.name,
        origin=detail.project.origin,
    )
    payload = detail.payload.model_copy(update={"target_origin": project.origin})
    stored = workspace._store.save_audit(  # noqa: SLF001 - test fixture
        user_id=user_id,
        project_id=project.id,
        payload=payload,
    )
    return SavedAuditDetailResponse(
        project=project.public(),
        audit=stored.summary(),
        payload=payload,
    )


def test_issue_projection_normalizes_categories_and_keeps_global_fix_order() -> None:
    detail = saved_detail()
    projected = project_saved_audit_issues(detail, IssueListOptions())

    assert projected.contract_version == "webdiag.account.issue_list.v1"
    assert [item.issue_id for item in projected.items[:3]] == [
        "security.headers.missing",
        "http.status.error",
        "performance.lcp.slow",
    ]
    assert [item.fix_order for item in projected.items] == [1, 2, 3, 4, 5, 6]
    assert {item.category for item in projected.items} == {
        "seo", "performance", "accessibility", "security", "content", "technical"
    }

    filtered = project_saved_audit_issues(
        detail,
        IssueListOptions(category="security", sort="title", order="desc"),
    )
    assert len(filtered.items) == 1
    assert filtered.items[0].issue_id == "security.headers.missing"
    assert filtered.items[0].fix_order == 1


def test_issue_api_filters_detail_ownership_and_no_store(tmp_path: Path) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    account = build_account_service(database_path)
    owner_id, owner_token = register(account, "owner@example.com")
    _, other_token = register(account, "other@example.com")
    workspace = build_workspace(database_path)
    saved = seed_saved_audit(workspace, owner_id)
    project_id = saved.project.id
    audit_id = saved.audit.id

    app.dependency_overrides[get_account_service] = lambda: account
    app.dependency_overrides[get_workspace_service] = lambda: workspace
    try:
        listed = asyncio.run(request(
            f"/v1/account/projects/{project_id}/audits/{audit_id}/issues"
            "?category=security&priority=p0&sort=priority&order=asc",
            cookie=owner_token,
        ))
        assert listed.status_code == 200
        assert listed.headers["cache-control"] == "no-store"
        assert listed.json()["contract_version"] == "webdiag.account.issue_list.v1"
        assert [item["issue_id"] for item in listed.json()["items"]] == [
            "security.headers.missing"
        ]

        detail = asyncio.run(request(
            f"/v1/account/projects/{project_id}/audits/{audit_id}/issues/"
            "security.headers.missing",
            cookie=owner_token,
        ))
        assert detail.status_code == 200
        assert detail.headers["cache-control"] == "no-store"
        payload = detail.json()
        assert payload["contract_version"] == "webdiag.account.issue_detail.v1"
        assert set(payload) == {"contract_version", "project", "audit", "issue"}
        serialized = detail.text
        for forbidden in ("evidence", "tool_mappings", "job_id", "run_id", "ai_explanation"):
            assert forbidden not in serialized

        hidden = asyncio.run(request(
            f"/v1/account/projects/{project_id}/audits/{audit_id}/issues",
            cookie=other_token,
        ))
        assert hidden.status_code == 404
    finally:
        app.dependency_overrides.clear()


def test_issue_api_rejects_invalid_filters_with_account_envelope(tmp_path: Path) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    account = build_account_service(database_path)
    owner_id, owner_token = register(account, "owner@example.com")
    workspace = build_workspace(database_path)
    saved = seed_saved_audit(workspace, owner_id)

    app.dependency_overrides[get_account_service] = lambda: account
    app.dependency_overrides[get_workspace_service] = lambda: workspace
    try:
        response = asyncio.run(request(
            f"/v1/account/projects/{saved.project.id}/audits/{saved.audit.id}/issues"
            "?category=unknown",
            cookie=owner_token,
        ))
        assert response.status_code == 422
        assert response.headers["cache-control"] == "no-store"
        assert response.json()["detail"]["code"] == "account_invalid_request"
    finally:
        app.dependency_overrides.clear()
