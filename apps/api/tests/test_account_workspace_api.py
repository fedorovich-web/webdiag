import asyncio
import hashlib
import sqlite3
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime
from pathlib import Path

import httpx
import pytest

import webdiag_api.accounts.workspace_storage as workspace_storage_module
from webdiag_api.accounts.api import get_account_service
from webdiag_api.accounts.models import RegisterRequest
from webdiag_api.accounts.monitoring_storage import SqliteMonitoringStore
from webdiag_api.accounts.security import ScryptParameters
from webdiag_api.accounts.service import AccountService
from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.accounts.workspace_api import get_workspace_service
from webdiag_api.accounts.workspace_models import ProjectCreateRequest
from webdiag_api.accounts.workspace_service import (
    WorkspaceService,
    WorkspaceServiceError,
    normalize_project_origin,
)
from webdiag_api.accounts.workspace_storage import SqliteWorkspaceStore
from webdiag_api.audit.models import (
    AffectedUrl,
    AuditCheck,
    AuditIssue,
    AuditJob,
    AuditJobStatus,
    AuditRun,
    AuditTarget,
    CheckStatus,
    Evidence,
    EvidenceKind,
    IssueCategory,
    Priority,
    Recommendation,
    Severity,
    ToolMapping,
)
from webdiag_api.audit.service import AuditSnapshot
from webdiag_api.main import app


class StubAuditService:
    def __init__(self) -> None:
        self.origins: list[str] = []

    def start_single_url_audit(self, origin: str) -> AuditSnapshot:
        self.origins.append(origin)
        target = AuditTarget(original_url=origin, normalized_url=origin, hostname="example.com")
        job = AuditJob(target=target, status=AuditJobStatus.SUCCEEDED)
        issue_id = "metadata.title.missing"
        run = AuditRun(
            job_id=job.job_id,
            target=target,
            status=AuditJobStatus.SUCCEEDED,
            score=82,
            completed_at=datetime.now(UTC),
            checks=(
                AuditCheck(
                    check_id="metadata.title",
                    name="Title tag",
                    category=IssueCategory.METADATA,
                    status=CheckStatus.FAILED,
                    evidence=(
                        Evidence(
                            kind=EvidenceKind.HTML_ELEMENT,
                            source="head",
                            value="raw secret-like evidence",
                        ),
                    ),
                    issue_ids=(issue_id,),
                ),
            ),
            issues=(
                AuditIssue(
                    issue_id=issue_id,
                    check_id="metadata.title",
                    category=IssueCategory.METADATA,
                    severity=Severity.MEDIUM,
                    priority=Priority.P1,
                    title="Title tag is missing",
                    description="The page does not expose a title tag.",
                    affected_urls=(
                        AffectedUrl(
                            url="https://example.com/page?token=secret#fragment",
                            normalized_url="https://example.com/page?token=secret#fragment",
                            final_url="https://example.com/page?token=secret#fragment",
                        ),
                        AffectedUrl(
                            url="https://other.example/path?secret=1",
                            normalized_url="https://other.example/path?secret=1",
                        ),
                    ),
                    evidence=(
                        Evidence(
                            kind=EvidenceKind.TEXT_SAMPLE,
                            source="html",
                            value="do not persist me",
                        ),
                    ),
                    recommendation=Recommendation(
                        summary="Add a descriptive title.",
                        steps=("Add one title element.",),
                        expected_impact="Clearer search snippets.",
                    ),
                    tool_mappings=(
                        ToolMapping(
                            issue_category=IssueCategory.METADATA,
                            tool_category="seo-audit",
                            ready=False,
                            rationale="Internal mapping must not leave the account API.",
                        ),
                    ),
                ),
            ),
        )
        return AuditSnapshot(job=job, run=run)


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


def build_workspace(database_path: Path, audit_service: StubAuditService | None = None):
    return WorkspaceService(
        SqliteWorkspaceStore(str(database_path)),
        audit_service=audit_service or StubAuditService(),
    )


async def request(
    method: str,
    path: str,
    *,
    json: dict[str, object] | None = None,
    cookie: str | None = None,
) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    headers = {"cookie": f"webdiag_session={cookie}"} if cookie else None
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.request(method, path, json=json, headers=headers)


def test_project_origin_normalization_and_duplicate_limit(tmp_path: Path) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    account = build_account_service(database_path)
    user_id, _ = register(account, "owner@example.com")
    workspace = build_workspace(database_path)

    assert normalize_project_origin(" Example.COM. ") == "https://example.com"
    assert normalize_project_origin("http://example.com/") == "http://example.com"
    for unsafe in (
        "https://example.com/path",
        "https://example.com/?query=1",
        "https://user:pass@example.com",
        "http://127.0.0.1",
    ):
        with pytest.raises(WorkspaceServiceError):
            normalize_project_origin(unsafe)

    project = workspace.create_project(
        user_id=user_id,
        request=ProjectCreateRequest(name="  Main   website ", origin="https://Example.COM:443"),
    )
    assert project.name == "Main website"

    with pytest.raises(WorkspaceServiceError) as duplicate:
        workspace.create_project(
            user_id=user_id,
            request=ProjectCreateRequest(name="Duplicate", origin="https://example.com/"),
        )
    assert duplicate.value.code == "account_project_origin_exists"
    assert project.origin == "https://example.com"
    assert workspace.list_projects(user_id=user_id).projects == (project,)


def test_project_lifecycle_storage_is_owned_idempotent_and_cancels_monitor_lease(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    account = build_account_service(database_path)
    owner_id, _ = register(account, "owner@example.com")
    other_id, _ = register(account, "other@example.com")
    store = SqliteWorkspaceStore(str(database_path))
    project = store.create_project(
        user_id=owner_id,
        name="Main",
        origin="https://example.com",
    )
    monitoring = SqliteMonitoringStore(str(database_path))
    monitoring.create_monitor(
        user_id=owner_id,
        project_id=project.id,
        cadence="daily",
        timezone="Europe/Berlin",
    )
    claimed = monitoring.claim_manual(
        user_id=owner_id,
        project_id=project.id,
        now=2_000_000_000,
    )
    assert claimed is not None and claimed.lease_token is not None

    assert (
        store.rename_project(
            user_id=other_id,
            project_id=project.id,
            name="Cross account",
        )
        is None
    )
    renamed = store.rename_project(
        user_id=owner_id,
        project_id=project.id,
        name="Client's \"); DROP TABLE account_users; --",
    )
    assert renamed is not None
    assert renamed.name == "Client's \"); DROP TABLE account_users; --"

    archived = store.archive_project(user_id=owner_id, project_id=project.id)
    assert archived is not None and archived.archived_at is not None
    repeated = store.archive_project(user_id=owner_id, project_id=project.id)
    assert repeated is not None and repeated.archived_at == archived.archived_at
    assert store.get_project(user_id=owner_id, project_id=project.id) is None
    assert store.list_projects(user_id=owner_id) == ()
    assert store.list_archived_projects(user_id=owner_id) == (archived,)
    assert store.archive_project(user_id=other_id, project_id=project.id) is None

    paused = monitoring.get_monitor(user_id=owner_id, project_id=project.id)
    assert paused is not None
    assert paused.enabled is False
    assert paused.status == "pending"
    assert paused.next_run_at is None
    assert paused.lease_token is None
    assert paused.lease_expires_at is None

    restored = store.restore_project(user_id=owner_id, project_id=project.id)
    assert restored is not None and restored.archived_at is None
    repeated_restore = store.restore_project(user_id=owner_id, project_id=project.id)
    assert repeated_restore == restored
    assert store.list_archived_projects(user_id=owner_id) == ()
    assert store.get_project(user_id=owner_id, project_id=project.id) == restored
    still_paused = monitoring.get_monitor(user_id=owner_id, project_id=project.id)
    assert still_paused is not None and still_paused.enabled is False


def test_archived_projects_remain_within_total_project_limit(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    account = build_account_service(database_path)
    user_id, _ = register(account, "owner@example.com")
    monkeypatch.setattr(workspace_storage_module, "MAX_PROJECTS_PER_ACCOUNT", 2)
    store = SqliteWorkspaceStore(str(database_path))
    first = store.create_project(
        user_id=user_id,
        name="First",
        origin="https://first.example.com",
    )
    store.create_project(
        user_id=user_id,
        name="Second",
        origin="https://second.example.com",
    )
    assert store.archive_project(user_id=user_id, project_id=first.id) is not None

    with pytest.raises(ValueError, match="account_project_limit_reached"):
        store.create_project(
            user_id=user_id,
            name="Third",
            origin="https://third.example.com",
        )


def test_project_schema_adds_archived_timestamp_to_existing_database(tmp_path: Path) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    account = build_account_service(database_path)
    user_id, _ = register(account, "owner@example.com")
    with sqlite3.connect(database_path) as connection:
        connection.execute(
            """
            CREATE TABLE account_workspace_projects (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                origin TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                UNIQUE(user_id, origin),
                FOREIGN KEY(user_id) REFERENCES account_users(id) ON DELETE CASCADE
            )
            """
        )
        connection.execute(
            """
            INSERT INTO account_workspace_projects(
                id, user_id, name, origin, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            ("project-1", user_id, "Legacy", "https://example.com", 1, 1),
        )
        connection.commit()

    store = SqliteWorkspaceStore(str(database_path))
    store.ensure_schema()

    with sqlite3.connect(database_path) as connection:
        columns = {
            row[1]
            for row in connection.execute(
                "PRAGMA table_info(account_workspace_projects)"
            ).fetchall()
        }
    assert "archived_at" in columns
    assert store.get_project(user_id=user_id, project_id="project-1") is not None


def test_project_and_audit_ownership_are_hidden(tmp_path: Path) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    account = build_account_service(database_path)
    owner_id, _ = register(account, "owner@example.com")
    other_id, _ = register(account, "other@example.com")
    workspace = build_workspace(database_path)
    project = workspace.create_project(
        user_id=owner_id,
        request=ProjectCreateRequest(name="Owned", origin="https://example.com"),
    )
    saved = workspace.run_and_save_audit(user_id=owner_id, project_id=project.id)

    with pytest.raises(WorkspaceServiceError) as project_error:
        workspace.get_project(user_id=other_id, project_id=project.id)
    assert project_error.value.status_code == 404

    with pytest.raises(WorkspaceServiceError) as audit_error:
        workspace.get_saved_audit(
            user_id=other_id,
            project_id=project.id,
            audit_id=saved.audit.id,
        )
    assert audit_error.value.status_code == 404


def test_saved_audit_is_versioned_bounded_and_excludes_internal_fields(tmp_path: Path) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    account = build_account_service(database_path)
    user_id, _ = register(account, "owner@example.com")
    audit_service = StubAuditService()
    workspace = build_workspace(database_path, audit_service)
    project = workspace.create_project(
        user_id=user_id,
        request=ProjectCreateRequest(name="Main", origin="https://example.com"),
    )

    saved = workspace.run_and_save_audit(user_id=user_id, project_id=project.id)
    assert audit_service.origins == ["https://example.com"]
    assert saved.payload.contract_version == "webdiag.account.saved_audit_payload.v1"
    assert saved.audit.check_count == 1
    assert saved.audit.issue_count == 1
    assert saved.payload.issues[0].affected_urls == ("https://example.com/page",)

    serialized = saved.model_dump_json()
    for forbidden in (
        "raw secret-like evidence",
        "do not persist me",
        "tool_mappings",
        "job_id",
        "run_id",
        "token=secret",
        "secret=1",
    ):
        assert forbidden not in serialized

    with sqlite3.connect(database_path) as connection:
        tables = {
            row[0]
            for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table'"
            ).fetchall()
        }
        payload_version, payload_json = connection.execute(
            "SELECT payload_version, payload_json FROM account_workspace_saved_audits"
        ).fetchone()
    assert tables == {
        "account_users",
        "account_sessions",
        "account_login_attempts",
        "account_workspace_projects",
        "account_workspace_saved_audits",
    }
    assert payload_version == "webdiag.account.saved_audit_payload.v1"
    assert "evidence" not in payload_json


def test_saved_audit_hash_migration_detects_tampering_without_reblessing(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    account = build_account_service(database_path)
    user_id, _ = register(account, "owner@example.com")
    workspace = build_workspace(database_path)
    project = workspace.create_project(
        user_id=user_id,
        request=ProjectCreateRequest(name="Main", origin="https://example.com"),
    )
    saved = workspace.run_and_save_audit(user_id=user_id, project_id=project.id)

    with sqlite3.connect(database_path) as connection:
        columns = {
            row[1]
            for row in connection.execute(
                "PRAGMA table_info(account_workspace_saved_audits)"
            ).fetchall()
        }
        if "payload_sha256" in columns:
            connection.execute(
                "ALTER TABLE account_workspace_saved_audits DROP COLUMN payload_sha256"
            )
        connection.commit()

    migrated_store = SqliteWorkspaceStore(str(database_path))
    migrated_store.ensure_schema()
    with sqlite3.connect(database_path) as connection:
        payload_json, payload_sha256 = connection.execute(
            """
            SELECT payload_json, payload_sha256
            FROM account_workspace_saved_audits
            WHERE id = ?
            """,
            (saved.audit.id,),
        ).fetchone()
        assert payload_sha256 == hashlib.sha256(payload_json.encode("utf-8")).hexdigest()
        connection.execute(
            """
            UPDATE account_workspace_saved_audits
            SET payload_json = replace(payload_json, 'Title tag is missing', 'Tampered title')
            WHERE id = ?
            """,
            (saved.audit.id,),
        )
        connection.commit()

    restarted = WorkspaceService(
        SqliteWorkspaceStore(str(database_path)),
        audit_service=StubAuditService(),
    )
    with pytest.raises(WorkspaceServiceError) as unavailable:
        restarted.get_saved_audit(
            user_id=user_id,
            project_id=project.id,
            audit_id=saved.audit.id,
        )
    assert unavailable.value.status_code == 500
    assert unavailable.value.code == "account_saved_audit_unavailable"


def test_saved_audit_hash_migration_is_safe_across_store_instances(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    SqliteWorkspaceStore(str(database_path)).ensure_schema()
    with sqlite3.connect(database_path) as connection:
        connection.execute("ALTER TABLE account_workspace_saved_audits DROP COLUMN payload_sha256")
        connection.commit()

    migration_barrier = threading.Barrier(2)

    class BarrierConnection(sqlite3.Connection):
        def execute(self, sql: str, parameters=(), /):  # type: ignore[no-untyped-def]
            if sql.strip() == "BEGIN IMMEDIATE":
                migration_barrier.wait(timeout=5)
            return super().execute(sql, parameters)

    def connect_with_barrier(store: SqliteWorkspaceStore) -> sqlite3.Connection:
        connection = sqlite3.connect(
            store._path,  # noqa: SLF001 - test-only connection factory
            timeout=10,
            isolation_level=None,
            factory=BarrierConnection,
        )
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA journal_mode = WAL")
        connection.execute("PRAGMA busy_timeout = 10000")
        return connection

    monkeypatch.setattr(SqliteWorkspaceStore, "_connect", connect_with_barrier)
    stores = (
        SqliteWorkspaceStore(str(database_path)),
        SqliteWorkspaceStore(str(database_path)),
    )
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = [executor.submit(store.ensure_schema) for store in stores]
        for future in futures:
            future.result(timeout=15)

    with sqlite3.connect(database_path) as connection:
        columns = {
            row[1]
            for row in connection.execute(
                "PRAGMA table_info(account_workspace_saved_audits)"
            ).fetchall()
        }
    assert "payload_sha256" in columns


def test_saved_audit_rejects_summary_payload_mismatch(tmp_path: Path) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    account = build_account_service(database_path)
    user_id, _ = register(account, "owner@example.com")
    workspace = build_workspace(database_path)
    project = workspace.create_project(
        user_id=user_id,
        request=ProjectCreateRequest(name="Main", origin="https://example.com"),
    )
    saved = workspace.run_and_save_audit(user_id=user_id, project_id=project.id)

    with sqlite3.connect(database_path) as connection:
        connection.execute(
            "UPDATE account_workspace_saved_audits SET score = 1 WHERE id = ?",
            (saved.audit.id,),
        )
        connection.commit()

    with pytest.raises(WorkspaceServiceError) as unavailable:
        workspace.get_saved_audit(
            user_id=user_id,
            project_id=project.id,
            audit_id=saved.audit.id,
        )
    assert unavailable.value.status_code == 500
    assert unavailable.value.code == "account_saved_audit_unavailable"


def test_workspace_api_create_run_history_and_detail(tmp_path: Path) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    account = build_account_service(database_path)
    user_id, token = register(account, "owner@example.com")
    workspace = build_workspace(database_path)
    app.dependency_overrides[get_account_service] = lambda: account
    app.dependency_overrides[get_workspace_service] = lambda: workspace
    try:
        created = asyncio.run(
            request(
                "POST",
                "/v1/account/projects",
                json={"name": "Main", "origin": "example.com"},
                cookie=token,
            )
        )
        assert created.status_code == 201
        assert created.headers["cache-control"] == "no-store"
        project_id = created.json()["id"]

        listed = asyncio.run(request("GET", "/v1/account/projects", cookie=token))
        assert listed.status_code == 200
        assert listed.json()["contract_version"] == "webdiag.account.project_list.v1"
        assert len(listed.json()["projects"]) == 1

        saved = asyncio.run(
            request("POST", f"/v1/account/projects/{project_id}/audits", cookie=token)
        )
        assert saved.status_code == 201
        assert saved.headers["cache-control"] == "no-store"
        audit_id = saved.json()["audit"]["id"]
        assert saved.json()["payload"]["contract_version"] == (
            "webdiag.account.saved_audit_payload.v1"
        )
        assert saved.json()["payload"]["checks"][0]["name"] == "Тег title"
        assert saved.json()["payload"]["issues"][0]["title"] == "Отсутствует тег title"

        detail = asyncio.run(request("GET", f"/v1/account/projects/{project_id}", cookie=token))
        assert detail.status_code == 200
        assert len(detail.json()["saved_audits"]) == 1

        audit = asyncio.run(
            request(
                "GET",
                f"/v1/account/projects/{project_id}/audits/{audit_id}?locale=en",
                cookie=token,
            )
        )
        assert audit.status_code == 200
        assert set(audit.json()) == {"contract_version", "project", "audit", "payload"}
        assert audit.json()["payload"]["checks"][0]["name"] == "Title tag"
        assert audit.json()["payload"]["issues"][0]["title"] == "Title tag is missing"
        stored = workspace.get_saved_audit(
            user_id=user_id,
            project_id=project_id,
            audit_id=audit_id,
        )
        assert stored.payload.checks[0].name == "Title tag"
        assert stored.payload.issues[0].title == "Title tag is missing"

        invalid = asyncio.run(request("GET", "/v1/account/projects/not-a-uuid", cookie=token))
        assert invalid.status_code == 422
        assert invalid.json()["detail"]["code"] == "account_invalid_request"
    finally:
        app.dependency_overrides.clear()


def test_project_lifecycle_api_is_versioned_owned_idempotent_and_no_store(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    account = build_account_service(database_path)
    _, owner_token = register(account, "owner@example.com")
    _, other_token = register(account, "other@example.com")
    workspace = build_workspace(database_path)
    app.dependency_overrides[get_account_service] = lambda: account
    app.dependency_overrides[get_workspace_service] = lambda: workspace
    try:
        created = asyncio.run(
            request(
                "POST",
                "/v1/account/projects",
                json={"name": "Main", "origin": "https://example.com"},
                cookie=owner_token,
            )
        )
        project_id = created.json()["id"]

        invalid = asyncio.run(
            request(
                "PATCH",
                f"/v1/account/projects/{project_id}",
                json={"name": "Renamed", "origin": "https://attacker.example"},
                cookie=owner_token,
            )
        )
        assert invalid.status_code == 422
        assert invalid.headers["cache-control"] == "no-store"

        renamed = asyncio.run(
            request(
                "PATCH",
                f"/v1/account/projects/{project_id}",
                json={"name": "  Client's   project  "},
                cookie=owner_token,
            )
        )
        assert renamed.status_code == 200
        assert renamed.headers["cache-control"] == "no-store"
        assert renamed.json()["name"] == "Client's project"
        assert set(renamed.json()) == {
            "id",
            "name",
            "origin",
            "created_at",
            "updated_at",
        }

        hidden = asyncio.run(
            request(
                "POST",
                f"/v1/account/projects/{project_id}/archive",
                cookie=other_token,
            )
        )
        assert hidden.status_code == 404
        assert hidden.json()["detail"]["code"] == "account_project_not_found"

        archived = asyncio.run(
            request(
                "POST",
                f"/v1/account/projects/{project_id}/archive",
                cookie=owner_token,
            )
        )
        assert archived.status_code == 200
        assert archived.headers["cache-control"] == "no-store"
        assert archived.json()["contract_version"] == "webdiag.account.archived_project.v1"
        assert archived.json()["archived_at"] is not None
        assert set(archived.json()) == {
            "contract_version",
            "id",
            "name",
            "origin",
            "created_at",
            "updated_at",
            "archived_at",
        }

        repeated_archive = asyncio.run(
            request(
                "POST",
                f"/v1/account/projects/{project_id}/archive",
                cookie=owner_token,
            )
        )
        assert repeated_archive.status_code == 200
        assert repeated_archive.json()["archived_at"] == archived.json()["archived_at"]

        active_list = asyncio.run(request("GET", "/v1/account/projects", cookie=owner_token))
        assert active_list.json()["projects"] == []
        detail = asyncio.run(
            request("GET", f"/v1/account/projects/{project_id}", cookie=owner_token)
        )
        assert detail.status_code == 404

        archived_list = asyncio.run(
            request("GET", "/v1/account/projects/archived", cookie=owner_token)
        )
        assert archived_list.status_code == 200
        assert archived_list.headers["cache-control"] == "no-store"
        assert archived_list.json() == {
            "contract_version": "webdiag.account.archived_project_list.v1",
            "projects": [archived.json()],
        }

        restored = asyncio.run(
            request(
                "POST",
                f"/v1/account/projects/{project_id}/restore",
                cookie=owner_token,
            )
        )
        assert restored.status_code == 200
        assert restored.headers["cache-control"] == "no-store"
        assert set(restored.json()) == {
            "id",
            "name",
            "origin",
            "created_at",
            "updated_at",
        }
        repeated_restore = asyncio.run(
            request(
                "POST",
                f"/v1/account/projects/{project_id}/restore",
                cookie=owner_token,
            )
        )
        assert repeated_restore.status_code == 200
        assert repeated_restore.json() == restored.json()
    finally:
        app.dependency_overrides.clear()
