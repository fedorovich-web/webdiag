from __future__ import annotations

import asyncio
from pathlib import Path

import httpx
from test_account_workspace_api import build_account_service, build_workspace, register

from webdiag_api.accounts.api import get_account_service
from webdiag_api.accounts.service import AccountService
from webdiag_api.accounts.workspace_api import get_workspace_service
from webdiag_api.accounts.workspace_models import ProjectCreateRequest
from webdiag_api.accounts.workspace_service import WorkspaceService
from webdiag_api.config import settings
from webdiag_api.crawl.api import get_crawl_service, get_crawl_store
from webdiag_api.crawl.storage import SqliteCrawlStore
from webdiag_api.main import app


class StubCrawlService:
    def __init__(self, *, processed: bool) -> None:
        self.processed = processed
        self.calls = 0

    def run_one(self) -> bool:
        self.calls += 1
        return self.processed


def test_internal_crawl_run_one_requires_dedicated_bearer(monkeypatch) -> None:
    monkeypatch.setattr(settings, "crawler_internal_token", "c" * 32)

    async def post(headers: dict[str, str] | None = None) -> httpx.Response:
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test"
        ) as client:
            return await client.post("/v1/internal/crawl/run-one", headers=headers)

    missing = asyncio.run(post())
    wrong = asyncio.run(post({"Authorization": f"Bearer {'a' * 32}"}))

    assert missing.status_code == 401
    assert wrong.status_code == 401
    assert missing.headers["cache-control"] == "no-store"
    assert missing.json()["detail"]["code"] == "crawl_internal_unauthorized"


def test_internal_crawl_run_one_returns_bounded_contract(monkeypatch) -> None:
    monkeypatch.setattr(settings, "crawler_internal_token", "c" * 32)
    service = StubCrawlService(processed=True)
    app.dependency_overrides[get_crawl_service] = lambda: service

    async def post() -> httpx.Response:
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test"
        ) as client:
            return await client.post(
                "/v1/internal/crawl/run-one",
                headers={"Authorization": f"Bearer {'c' * 32}"},
            )

    try:
        response = asyncio.run(post())
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    assert response.json() == {
        "contract_version": "webdiag.crawl.worker.v1",
        "processed": True,
    }
    assert service.calls == 1


def test_account_crawl_jobs_are_authenticated_owned_versioned_and_no_store(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    account: AccountService = build_account_service(database_path)
    user_id, owner_token = register(account, "owner@example.com")
    _, other_token = register(account, "other@example.com")
    workspace: WorkspaceService = build_workspace(database_path)
    project = workspace.create_project(
        user_id=user_id,
        request=ProjectCreateRequest(name="Crawler", origin="https://example.com"),
    )
    store = SqliteCrawlStore(str(database_path), lease_seconds=60)
    app.dependency_overrides[get_account_service] = lambda: account
    app.dependency_overrides[get_workspace_service] = lambda: workspace
    app.dependency_overrides[get_crawl_store] = lambda: store

    async def request(method: str, path: str, token: str | None) -> httpx.Response:
        headers = {"Cookie": f"webdiag_session={token}"} if token else {}
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test"
        ) as client:
            return await client.request(method, path, headers=headers)

    try:
        anonymous = asyncio.run(
            request("POST", f"/v1/account/projects/{project.id}/crawls", None)
        )
        hidden = asyncio.run(
            request("POST", f"/v1/account/projects/{project.id}/crawls", other_token)
        )
        created = asyncio.run(
            request("POST", f"/v1/account/projects/{project.id}/crawls", owner_token)
        )
        listed = asyncio.run(
            request("GET", f"/v1/account/projects/{project.id}/crawls", owner_token)
        )
        job_id = created.json()["job"]["id"]
        detail = asyncio.run(
            request(
                "GET",
                f"/v1/account/projects/{project.id}/crawls/{job_id}",
                owner_token,
            )
        )
        duplicate = asyncio.run(
            request("POST", f"/v1/account/projects/{project.id}/crawls", owner_token)
        )
    finally:
        app.dependency_overrides.clear()

    assert anonymous.status_code == 401
    assert hidden.status_code == 404
    assert created.status_code == 201
    assert created.headers["cache-control"] == "no-store"
    assert created.json()["contract_version"] == "webdiag.account.crawl_detail.v1"
    assert created.json()["job"]["state"] == "queued"
    assert set(created.json()["job"]) == {
        "id", "project_id", "origin", "state", "error_code", "created_at", "updated_at",
    }
    assert listed.status_code == 200
    assert listed.json()["contract_version"] == "webdiag.account.crawl_list.v1"
    assert len(listed.json()["jobs"]) == 1
    assert detail.json() == created.json()
    assert duplicate.status_code == 409
    assert duplicate.json()["detail"]["code"] == "crawl_job_active_exists"


def test_account_site_audit_routes_are_owned_versioned_and_share_the_crawl_queue(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    account: AccountService = build_account_service(database_path)
    user_id, owner_token = register(account, "owner@example.com")
    _, other_token = register(account, "other@example.com")
    workspace: WorkspaceService = build_workspace(database_path)
    project = workspace.create_project(
        user_id=user_id,
        request=ProjectCreateRequest(name="Site audit", origin="https://example.com"),
    )
    store = SqliteCrawlStore(str(database_path), lease_seconds=60)
    app.dependency_overrides[get_account_service] = lambda: account
    app.dependency_overrides[get_workspace_service] = lambda: workspace
    app.dependency_overrides[get_crawl_store] = lambda: store

    async def request(method: str, path: str, token: str | None) -> httpx.Response:
        headers = {"Cookie": f"webdiag_session={token}"} if token else {}
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test"
        ) as client:
            return await client.request(method, path, headers=headers)

    path = f"/v1/account/projects/{project.id}/site-audits"
    try:
        anonymous = asyncio.run(request("POST", path, None))
        hidden = asyncio.run(request("POST", path, other_token))
        created = asyncio.run(request("POST", path, owner_token))
        listed = asyncio.run(request("GET", path, owner_token))
        job_id = created.json()["job"]["id"]
        detail = asyncio.run(request("GET", f"{path}/{job_id}", owner_token))
    finally:
        app.dependency_overrides.clear()

    assert anonymous.status_code == 401
    assert hidden.status_code == 404
    assert created.status_code == 201
    assert created.headers["cache-control"] == "no-store"
    assert created.json()["contract_version"] == "webdiag.account.site_audit_detail.v1"
    assert created.json()["result"] is None
    assert listed.status_code == 200
    assert listed.json()["contract_version"] == "webdiag.account.site_audit_list.v1"
    assert [job["id"] for job in listed.json()["jobs"]] == [job_id]
    assert detail.json() == created.json()
