import asyncio
import hashlib
import sqlite3
from datetime import UTC, datetime
from pathlib import Path

import httpx

from webdiag_api.accounts.api import get_account_service
from webdiag_api.accounts.models import RegisterRequest
from webdiag_api.accounts.report_api import get_report_service
from webdiag_api.accounts.report_artifact import artifact_sha256, build_report_snapshot
from webdiag_api.accounts.report_models import ReportCreateRequest, ReportShareRequest
from webdiag_api.accounts.report_service import ReportService, ReportServiceError
from webdiag_api.accounts.report_storage import SqliteReportStore
from webdiag_api.accounts.security import ScryptParameters
from webdiag_api.accounts.service import AccountService
from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.accounts.workspace_api import get_workspace_service
from webdiag_api.accounts.workspace_models import ProjectCreateRequest
from webdiag_api.accounts.workspace_service import WorkspaceService
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
    IssueCategory,
    Priority,
    Recommendation,
    Severity,
)
from webdiag_api.audit.service import AuditSnapshot
from webdiag_api.main import app


class StubAuditService:
    def start_single_url_audit(self, origin: str) -> AuditSnapshot:
        target = AuditTarget(original_url=origin, normalized_url=origin, hostname="example.com")
        job = AuditJob(target=target, status=AuditJobStatus.SUCCEEDED)
        issue_id = "metadata.title.missing"
        run = AuditRun(
            job_id=job.job_id,
            target=target,
            status=AuditJobStatus.SUCCEEDED,
            score=84,
            completed_at=datetime(2026, 7, 31, 10, 30, tzinfo=UTC),
            checks=(
                AuditCheck(
                    check_id="metadata.title",
                    name="Title tag",
                    category=IssueCategory.METADATA,
                    status=CheckStatus.FAILED,
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
                    title="Title <tag> is missing",
                    description="The page does not expose a title tag.",
                    affected_urls=(
                        AffectedUrl(
                            url="https://example.com/page?token=secret#fragment",
                            normalized_url="https://example.com/page?token=secret#fragment",
                            final_url="https://example.com/page?token=secret#fragment",
                        ),
                    ),
                    recommendation=Recommendation(
                        summary="Add a descriptive title.",
                        steps=("Add one title element.",),
                        expected_impact="Clearer search snippets.",
                    ),
                ),
            ),
        )
        return AuditSnapshot(job=job, run=run)


def build_services(database_path: Path):
    account = AccountService(
        SqliteAccountStore(str(database_path)),
        session_ttl_seconds=3600,
        active_session_limit=10,
        scrypt_parameters=ScryptParameters(n=2**12),
    )
    workspace = WorkspaceService(
        SqliteWorkspaceStore(str(database_path)),
        audit_service=StubAuditService(),
    )
    reports = ReportService(
        SqliteReportStore(str(database_path)),
        workspace=workspace,
    )
    return account, workspace, reports


def register(account: AccountService, email: str) -> tuple[str, str]:
    session = account.register(
        RegisterRequest(
            email=email,
            display_name="Report Owner",
            password="correct horse battery staple",
        )
    )
    return session.response.user.id, session.token


def seed_report(database_path: Path):
    account, workspace, reports = build_services(database_path)
    user_id, token = register(account, "owner@example.com")
    project = workspace.create_project(
        user_id=user_id,
        request=ProjectCreateRequest(name="Main website", origin="https://example.com"),
    )
    audit = workspace.run_and_save_audit(user_id=user_id, project_id=project.id)
    report = reports.create_report(
        user_id=user_id,
        project_id=project.id,
        audit_id=audit.audit.id,
        request=ReportCreateRequest(title="Quarterly <Report>", locale="en"),
    )
    return account, workspace, reports, user_id, token, project, audit, report


async def request(method: str, path: str, *, cookie: str | None = None, json=None):
    headers = {"cookie": f"webdiag_session={cookie}"} if cookie else None
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.request(method, path, headers=headers, json=json)


def test_report_snapshot_is_safe_versioned_and_artifact_is_exact(tmp_path: Path) -> None:
    database = tmp_path / "accounts.sqlite3"
    _, workspace, _, user_id, _, project, audit, report = seed_report(database)

    assert report.snapshot.contract_version == "webdiag.account.report_snapshot.v1"
    assert report.snapshot.target_origin == "https://example.com"
    assert report.snapshot.issues[0].affected_urls == ("https://example.com/page",)
    serialized = report.model_dump_json()
    for forbidden in ("token=secret", "job_id", "run_id", "evidence", "user_id"):
        assert forbidden not in serialized

    fixed = build_report_snapshot(
        workspace.get_saved_audit(
            user_id=user_id,
            project_id=project.id,
            audit_id=audit.audit.id,
        ),
        title="Quarterly <Report>",
        locale="en",
        generated_at=datetime(2026, 8, 1, 8, 0, tzinfo=UTC),
    )
    digest = artifact_sha256(fixed)
    assert digest == "b03a96b49dfbe6546a7a2159b1267de236ff4e5c65931c961fb18784059021ef"

    with sqlite3.connect(database) as connection:
        token_hash, snapshot_json = connection.execute(
            "SELECT share_token_hash, snapshot_json FROM account_workspace_reports"
        ).fetchone()
    assert token_hash is None
    assert "<Report>" in snapshot_json


def test_report_ownership_share_hash_expiry_and_revoke(tmp_path: Path) -> None:
    database = tmp_path / "accounts.sqlite3"
    account, _, reports, user_id, _, _, _, report = seed_report(database)
    other_id, _ = register(account, "other@example.com")

    assert reports.list_reports(user_id=user_id).reports[0].id == report.report.id
    try:
        reports.get_report(user_id=other_id, report_id=report.report.id)
    except ReportServiceError as error:
        assert error.status_code == 404
    else:
        raise AssertionError("Other accounts must not read reports")

    shared = reports.enable_share(
        user_id=user_id,
        report_id=report.report.id,
        request=ReportShareRequest(expires_in_days=2),
    )
    assert shared.share_path.endswith(shared.share_token)
    public = reports.get_public_report(share_token=shared.share_token)
    assert public.contract_version == "webdiag.public.report.v1"
    public_json = public.model_dump_json()
    assert report.report.project_id not in public_json
    assert report.report.audit_id not in public_json

    with sqlite3.connect(database) as connection:
        stored_hash, raw_count = connection.execute(
            """
            SELECT share_token_hash,
                   instr(snapshot_json, ?) + instr(COALESCE(share_token_hash, ''), ?)
            FROM account_workspace_reports WHERE id = ?
            """,
            (shared.share_token, shared.share_token, report.report.id),
        ).fetchone()
    assert stored_hash == hashlib.sha256(shared.share_token.encode()).hexdigest()
    assert raw_count == 0

    with sqlite3.connect(database) as connection:
        connection.execute(
            "UPDATE account_workspace_reports SET share_expires_at = 0 WHERE id = ?",
            (report.report.id,),
        )
    try:
        reports.get_public_report(share_token=shared.share_token)
    except ReportServiceError as error:
        assert error.status_code == 404
    else:
        raise AssertionError("Expired share tokens must stop working")

    replacement = reports.enable_share(
        user_id=user_id,
        report_id=report.report.id,
        request=ReportShareRequest(expires_in_days=1),
    )
    revoked = reports.revoke_share(user_id=user_id, report_id=report.report.id)
    assert revoked.report.shared is False
    try:
        reports.get_public_report(share_token=replacement.share_token)
    except ReportServiceError as error:
        assert error.status_code == 404
    else:
        raise AssertionError("Revoked share tokens must stop working")


def test_report_api_create_export_share_and_public_privacy(tmp_path: Path) -> None:
    database = tmp_path / "accounts.sqlite3"
    account, workspace, reports = build_services(database)
    user_id, token = register(account, "owner@example.com")
    _, other_token = register(account, "other@example.com")
    project = workspace.create_project(
        user_id=user_id,
        request=ProjectCreateRequest(name="Main", origin="https://example.com"),
    )
    audit = workspace.run_and_save_audit(user_id=user_id, project_id=project.id)

    app.dependency_overrides[get_account_service] = lambda: account
    app.dependency_overrides[get_workspace_service] = lambda: workspace
    app.dependency_overrides[get_report_service] = lambda: reports
    try:
        created = asyncio.run(
            request(
                "POST",
                f"/v1/account/projects/{project.id}/audits/{audit.audit.id}/reports",
                cookie=token,
                json={"title": "Client report", "locale": "ru"},
            )
        )
        assert created.status_code == 201
        assert created.headers["cache-control"] == "no-store"
        report_id = created.json()["report"]["id"]

        hidden = asyncio.run(request("GET", f"/v1/account/reports/{report_id}", cookie=other_token))
        assert hidden.status_code == 404

        html_response = asyncio.run(
            request("GET", f"/v1/account/reports/{report_id}/export.html", cookie=token)
        )
        assert html_response.status_code == 200
        assert html_response.headers["content-type"].startswith("text/html")
        assert html_response.headers["content-disposition"].startswith("attachment")
        assert "default-src 'none'" in html_response.headers["content-security-policy"]
        assert "&lt;tag&gt;" in html_response.text
        assert "<script" not in html_response.text.lower()

        share = asyncio.run(
            request(
                "POST",
                f"/v1/account/reports/{report_id}/share",
                cookie=token,
                json={"expires_in_days": 7},
            )
        )
        assert share.status_code == 200
        share_token = share.json()["share_token"]

        public = asyncio.run(request("GET", f"/v1/public/reports/{share_token}"))
        assert public.status_code == 200
        assert public.headers["cache-control"] == "no-store"
        assert "noindex" in public.headers["x-robots-tag"]
        assert set(public.json()) == {"contract_version", "report", "snapshot"}
        assert "project_id" not in public.text
        assert "audit_id" not in public.text

        revoked = asyncio.run(
            request("DELETE", f"/v1/account/reports/{report_id}/share", cookie=token)
        )
        assert revoked.status_code == 200
        expired = asyncio.run(request("GET", f"/v1/public/reports/{share_token}"))
        assert expired.status_code == 404
    finally:
        app.dependency_overrides.clear()
