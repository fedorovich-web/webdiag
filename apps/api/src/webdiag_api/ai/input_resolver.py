from __future__ import annotations

from webdiag_api.accounts.workspace_storage import (
    SqliteWorkspaceStore,
    WorkspaceStoreIntegrityError,
)


class AIInputResolutionError(RuntimeError):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


class AIInputResolver:
    def __init__(self, workspace: SqliteWorkspaceStore) -> None:
        self._workspace = workspace

    def resolve(
        self,
        *,
        user_id: str,
        tool_id: str,
        validated_input: dict[str, object],
    ) -> dict[str, object]:
        if tool_id != "ai_audit_action_plan":
            return dict(validated_input)
        locale = validated_input.get("locale")
        project_id = validated_input.get("project_id")
        audit_id = validated_input.get("audit_id")
        if (
            locale not in {"ru", "en"}
            or not isinstance(project_id, str)
            or not isinstance(audit_id, str)
        ):
            raise AIInputResolutionError(422, "ai_invalid_tool_input", "Invalid AI tool input.")
        audit = self._workspace.get_audit(
            user_id=user_id,
            project_id=project_id,
            audit_id=audit_id,
        )
        if audit is None:
            raise AIInputResolutionError(404, "ai_source_not_found", "AI source was not found.")
        try:
            payload = audit.payload()
        except WorkspaceStoreIntegrityError as error:
            raise AIInputResolutionError(
                500,
                "ai_source_unavailable",
                "AI source is temporarily unavailable.",
            ) from error
        return {
            "locale": locale,
            "target_origin": payload.target_origin,
            "score": payload.score,
            "checks": [check.model_dump(mode="json") for check in payload.checks],
            "issues": [issue.model_dump(mode="json") for issue in payload.issues],
        }
