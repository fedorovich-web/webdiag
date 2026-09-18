from __future__ import annotations

from datetime import UTC
from urllib.parse import urlsplit, urlunsplit

from webdiag_api.accounts.workspace_models import (
    AccountProjectDetailResponse,
    AccountProjectListResponse,
    ArchivedAccountProject,
    ArchivedAccountProjectListResponse,
    ProjectCreateRequest,
    ProjectRenameRequest,
    SavedAuditCheck,
    SavedAuditDetailResponse,
    SavedAuditIssue,
    SavedAuditPayload,
    SavedAuditRecommendation,
)
from webdiag_api.accounts.workspace_storage import (
    SqliteWorkspaceStore,
    WorkspaceStoreIntegrityError,
)
from webdiag_api.audit.models import AuditJobStatus, AuditRun
from webdiag_api.audit.service import AuditExecutionError, AuditExecutionService
from webdiag_api.security.url_policy import UrlPolicyError, validate_url


class WorkspaceServiceError(RuntimeError):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


def normalize_project_origin(raw_origin: str) -> str:
    value = raw_origin.strip()
    if not value:
        raise WorkspaceServiceError(400, "account_project_origin_invalid", "Origin is required.")
    if "://" not in value:
        value = f"https://{value}"
    try:
        validated = validate_url(value)
    except UrlPolicyError as error:
        raise WorkspaceServiceError(
            400,
            "account_project_origin_invalid",
            "Project origin must be a public HTTP or HTTPS origin.",
        ) from error
    parsed = urlsplit(validated.normalized)
    if parsed.path not in {"", "/"} or parsed.query or parsed.fragment:
        raise WorkspaceServiceError(
            400,
            "account_project_origin_invalid",
            "Project origin cannot contain a path, query, or fragment.",
        )
    return urlunsplit((parsed.scheme, parsed.netloc, "", "", ""))


def normalize_project_name(raw_name: str) -> str:
    value = " ".join(raw_name.split())
    if not 2 <= len(value) <= 80:
        raise WorkspaceServiceError(
            400,
            "account_project_name_invalid",
            "Project name must contain between 2 and 80 characters.",
        )
    return value


def _safe_url(raw_url: str, target_origin: str) -> str | None:
    try:
        parsed = urlsplit(raw_url)
        target = urlsplit(target_origin)
    except ValueError:
        return None
    same_scheme = parsed.scheme.lower() == target.scheme.lower()
    same_authority = parsed.netloc.lower() == target.netloc.lower()
    if not (same_scheme and same_authority):
        return None
    return urlunsplit(
        (parsed.scheme.lower(), parsed.netloc.lower(), parsed.path or "/", "", "")
    )


def build_saved_audit_payload(run: AuditRun, *, target_origin: str) -> SavedAuditPayload:
    if run.status != AuditJobStatus.SUCCEEDED or run.completed_at is None:
        raise WorkspaceServiceError(
            502,
            "account_audit_failed",
            "The audit did not complete successfully.",
        )
    checks = tuple(
        SavedAuditCheck(
            check_id=check.check_id,
            name=check.name,
            category=check.category.value,
            status=check.status.value,
        )
        for check in run.checks
    )
    issues: list[SavedAuditIssue] = []
    for issue in run.issues:
        affected_urls = tuple(
            safe
            for affected in issue.affected_urls
            if (safe := _safe_url(str(affected.final_url or affected.url), target_origin))
            is not None
        )
        issues.append(
            SavedAuditIssue(
                issue_id=issue.issue_id,
                check_id=issue.check_id,
                category=issue.category.value,
                severity=issue.severity.value,
                priority=issue.priority.value,
                title=issue.title,
                description=issue.description,
                affected_urls=affected_urls,
                recommendation=SavedAuditRecommendation(
                    summary=issue.recommendation.summary,
                    steps=issue.recommendation.steps,
                    expected_impact=issue.recommendation.expected_impact,
                ),
            )
        )
    return SavedAuditPayload(
        target_origin=target_origin,
        status="succeeded",
        score=run.score,
        checks=checks,
        issues=tuple(issues),
        completed_at=run.completed_at.astimezone(UTC),
    )


class WorkspaceService:
    def __init__(
        self,
        store: SqliteWorkspaceStore,
        *,
        audit_service: AuditExecutionService,
    ) -> None:
        self._store = store
        self._audit_service = audit_service

    def create_project(self, *, user_id: str, request: ProjectCreateRequest):
        name = normalize_project_name(request.name)
        origin = normalize_project_origin(request.origin)
        try:
            return self._store.create_project(user_id=user_id, name=name, origin=origin).public()
        except ValueError as error:
            code = str(error)
            if code == "account_project_origin_exists":
                raise WorkspaceServiceError(
                    409,
                    code,
                    "A project with this origin already exists.",
                ) from error
            if code == "account_project_limit_reached":
                raise WorkspaceServiceError(409, code, "Project limit reached.") from error
            raise

    def list_projects(self, *, user_id: str) -> AccountProjectListResponse:
        projects = self._store.list_projects(user_id=user_id)
        return AccountProjectListResponse(
            projects=tuple(project.public() for project in projects)
        )

    def rename_project(
        self,
        *,
        user_id: str,
        project_id: str,
        request: ProjectRenameRequest,
    ):
        project = self._store.rename_project(
            user_id=user_id,
            project_id=project_id,
            name=normalize_project_name(request.name),
        )
        if project is None:
            raise WorkspaceServiceError(
                404, "account_project_not_found", "Project was not found."
            )
        return project.public()

    def list_archived_projects(
        self,
        *,
        user_id: str,
    ) -> ArchivedAccountProjectListResponse:
        projects = self._store.list_archived_projects(user_id=user_id)
        return ArchivedAccountProjectListResponse(
            projects=tuple(project.archived_public() for project in projects)
        )

    def archive_project(
        self,
        *,
        user_id: str,
        project_id: str,
    ) -> ArchivedAccountProject:
        project = self._store.archive_project(user_id=user_id, project_id=project_id)
        if project is None:
            raise WorkspaceServiceError(
                404, "account_project_not_found", "Project was not found."
            )
        return project.archived_public()

    def restore_project(self, *, user_id: str, project_id: str):
        project = self._store.restore_project(user_id=user_id, project_id=project_id)
        if project is None:
            raise WorkspaceServiceError(
                404, "account_project_not_found", "Project was not found."
            )
        return project.public()

    def get_project(self, *, user_id: str, project_id: str) -> AccountProjectDetailResponse:
        project = self._owned_project(user_id=user_id, project_id=project_id)
        audits = self._store.list_audits(user_id=user_id, project_id=project_id)
        return AccountProjectDetailResponse(
            project=project.public(),
            saved_audits=tuple(audit.summary() for audit in audits),
        )

    def run_and_save_audit(
        self,
        *,
        user_id: str,
        project_id: str,
    ) -> SavedAuditDetailResponse:
        project = self._owned_project(user_id=user_id, project_id=project_id)
        try:
            snapshot = self._audit_service.start_single_url_audit(project.origin)
        except AuditExecutionError as error:
            raise WorkspaceServiceError(
                error.status_code,
                "account_audit_failed",
                "The website audit could not be completed.",
            ) from error
        if snapshot.run is None:
            raise WorkspaceServiceError(
                502,
                "account_audit_failed",
                "The website audit did not produce a result.",
            )
        payload = build_saved_audit_payload(snapshot.run, target_origin=project.origin)
        try:
            audit = self._store.save_audit(
                user_id=user_id,
                project_id=project_id,
                payload=payload,
            )
        except ValueError as error:
            code = str(error)
            if code == "account_saved_audit_limit_reached":
                raise WorkspaceServiceError(409, code, "Saved audit limit reached.") from error
            if code == "account_saved_audit_too_large":
                raise WorkspaceServiceError(
                    413, code, "Saved audit payload is too large."
                ) from error
            if code == "account_project_not_found":
                raise WorkspaceServiceError(404, code, "Project was not found.") from error
            raise
        return SavedAuditDetailResponse(
            project=project.public(),
            audit=audit.summary(),
            payload=payload,
        )

    def get_saved_audit(
        self,
        *,
        user_id: str,
        project_id: str,
        audit_id: str,
    ) -> SavedAuditDetailResponse:
        project = self._owned_project(user_id=user_id, project_id=project_id)
        audit = self._store.get_audit(
            user_id=user_id,
            project_id=project_id,
            audit_id=audit_id,
        )
        if audit is None:
            raise WorkspaceServiceError(
                404, "account_saved_audit_not_found", "Audit was not found."
            )
        try:
            payload = audit.payload()
        except WorkspaceStoreIntegrityError as error:
            raise WorkspaceServiceError(
                500,
                "account_saved_audit_unavailable",
                "The stored audit is temporarily unavailable.",
            ) from error
        return SavedAuditDetailResponse(
            project=project.public(),
            audit=audit.summary(),
            payload=payload,
        )

    def _owned_project(self, *, user_id: str, project_id: str):
        project = self._store.get_project(user_id=user_id, project_id=project_id)
        if project is None:
            raise WorkspaceServiceError(404, "account_project_not_found", "Project was not found.")
        return project
