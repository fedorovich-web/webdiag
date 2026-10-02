from __future__ import annotations

from html.parser import HTMLParser
from typing import Protocol
from urllib.parse import urlsplit, urlunsplit

from webdiag_api.accounts.workspace_storage import (
    SqliteWorkspaceStore,
    WorkspaceStoreIntegrityError,
)
from webdiag_api.ai.tool_contracts import AIToolContractError, validate_provider_input
from webdiag_api.audit.fetcher import SafeFetchError, SafeFetchResult
from webdiag_api.audit.html_metadata import parse_html_metadata
from webdiag_api.security.url_policy import UrlPolicyError, validate_url

CONTEXT_SNAPSHOT_TOOL_IDS = frozenset(
    {
        "ai_competitor_gap_report",
        "ai_content_optimizer",
        "ai_internal_linking_planner",
        "ai_search_intent_page_fit",
    }
)
MAX_SNAPSHOT_CONTENT_CHARS = 20_000


class PageFetcher(Protocol):
    def fetch(self, url: str, *, allowed_origin: str | None = None) -> SafeFetchResult: ...


class AIInputResolutionError(RuntimeError):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


class AIInputResolver:
    def __init__(
        self,
        workspace: SqliteWorkspaceStore,
        *,
        fetcher: PageFetcher | None = None,
    ) -> None:
        self._workspace = workspace
        self._fetcher = fetcher

    def resolve(
        self,
        *,
        user_id: str,
        tool_id: str,
        validated_input: dict[str, object],
    ) -> dict[str, object]:
        if tool_id not in CONTEXT_SNAPSHOT_TOOL_IDS and tool_id != "ai_audit_action_plan":
            return dict(validated_input)
        if tool_id in CONTEXT_SNAPSHOT_TOOL_IDS:
            return self._resolve_context_snapshots(
                user_id=user_id,
                tool_id=tool_id,
                validated_input=validated_input,
            )
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

    def _resolve_context_snapshots(
        self,
        *,
        user_id: str,
        tool_id: str,
        validated_input: dict[str, object],
    ) -> dict[str, object]:
        if self._fetcher is None:
            raise AIInputResolutionError(
                503,
                "ai_source_unavailable",
                "AI source data is temporarily unavailable.",
            )
        if tool_id == "ai_competitor_gap_report":
            return self._resolve_competitor_snapshots(
                user_id=user_id,
                tool_id=tool_id,
                validated_input=validated_input,
            )
        if tool_id == "ai_content_optimizer":
            return self._resolve_content_optimizer_snapshot(
                user_id=user_id,
                tool_id=tool_id,
                validated_input=validated_input,
            )
        if tool_id == "ai_search_intent_page_fit":
            return self._resolve_search_intent_snapshot(
                user_id=user_id,
                tool_id=tool_id,
                validated_input=validated_input,
            )
        return self._resolve_internal_linking_snapshots(
            user_id=user_id,
            tool_id=tool_id,
            validated_input=validated_input,
        )

    def _resolve_competitor_snapshots(
        self,
        *,
        user_id: str,
        tool_id: str,
        validated_input: dict[str, object],
    ) -> dict[str, object]:
        own_page = validated_input.get("own_page")
        competitor_pages = validated_input.get("competitor_pages")
        if not isinstance(own_page, dict) or not isinstance(competitor_pages, list):
            raise AIInputResolutionError(422, "ai_invalid_tool_input", "Invalid AI tool input.")
        own_url = own_page.get("page_url")
        if not isinstance(own_url, str):
            raise AIInputResolutionError(422, "ai_invalid_tool_input", "Invalid AI tool input.")
        competitor_urls = [
            page.get("page_url")
            for page in competitor_pages
            if isinstance(page, dict) and isinstance(page.get("page_url"), str)
        ]
        if len(competitor_urls) != len(competitor_pages):
            raise AIInputResolutionError(422, "ai_invalid_tool_input", "Invalid AI tool input.")
        own_origin = self._owned_origin(user_id=user_id, page_url=own_url)
        resolved = dict(validated_input)
        resolved["own_page"] = self._fetch_snapshot(own_url, allowed_origin=own_origin)
        resolved["competitor_pages"] = [
            self._fetch_snapshot(url, allowed_origin=None) for url in competitor_urls
        ]
        return self._validate_resolved_input(tool_id, resolved)

    def _resolve_content_optimizer_snapshot(
        self,
        *,
        user_id: str,
        tool_id: str,
        validated_input: dict[str, object],
    ) -> dict[str, object]:
        snapshot = self._owned_page_snapshot(
            user_id=user_id,
            page_url=validated_input.get("page_url"),
        )
        resolved = dict(validated_input)
        resolved["page_url"] = snapshot["page_url"]
        resolved["content"] = snapshot["content"]
        content = snapshot.get("content")
        constraints = resolved.get("factual_constraints")
        if (
            not isinstance(content, str)
            or not isinstance(constraints, list)
            or any(
                not isinstance(constraint, str) or constraint not in content
                for constraint in constraints
            )
        ):
            raise AIInputResolutionError(
                422,
                "ai_invalid_tool_input",
                "Invalid AI tool input.",
            )
        return self._validate_resolved_input(tool_id, resolved)

    def _resolve_search_intent_snapshot(
        self,
        *,
        user_id: str,
        tool_id: str,
        validated_input: dict[str, object],
    ) -> dict[str, object]:
        snapshot = self._owned_page_snapshot(
            user_id=user_id,
            page_url=validated_input.get("page_url"),
        )
        resolved = dict(validated_input)
        resolved.update(
            {
                "page_url": snapshot["page_url"],
                "page_title": snapshot["title"],
                "h1": snapshot["h1"],
                "content": snapshot["content"],
            }
        )
        return self._validate_resolved_input(tool_id, resolved)

    def _resolve_internal_linking_snapshots(
        self,
        *,
        user_id: str,
        tool_id: str,
        validated_input: dict[str, object],
    ) -> dict[str, object]:
        pages = validated_input.get("pages")
        if not isinstance(pages, list) or not pages:
            raise AIInputResolutionError(422, "ai_invalid_tool_input", "Invalid AI tool input.")
        page_urls = [
            page.get("page_url")
            for page in pages
            if isinstance(page, dict) and isinstance(page.get("page_url"), str)
        ]
        if len(page_urls) != len(pages):
            raise AIInputResolutionError(422, "ai_invalid_tool_input", "Invalid AI tool input.")
        first_url = page_urls[0]
        if not isinstance(first_url, str):
            raise AIInputResolutionError(422, "ai_invalid_tool_input", "Invalid AI tool input.")
        owned_origin = self._owned_origin(user_id=user_id, page_url=first_url)
        if any(_origin_for_url(url) != owned_origin for url in page_urls if isinstance(url, str)):
            raise AIInputResolutionError(404, "ai_source_not_found", "AI source was not found.")
        resolved = dict(validated_input)
        resolved["pages"] = [
            self._fetch_snapshot(url, allowed_origin=owned_origin) for url in page_urls
        ]
        return self._validate_resolved_input(tool_id, resolved)

    def _owned_origin(self, *, user_id: str, page_url: str) -> str:
        try:
            validated = validate_url(page_url)
        except UrlPolicyError as error:
            raise AIInputResolutionError(
                422,
                "ai_invalid_tool_input",
                "Invalid AI tool input.",
            ) from error
        parsed = urlsplit(validated.normalized)
        origin = urlunsplit((parsed.scheme, parsed.netloc, "", "", ""))
        if any(
            project.origin == origin
            for project in self._workspace.list_projects(user_id=user_id)
        ):
            return origin
        raise AIInputResolutionError(404, "ai_source_not_found", "AI source was not found.")

    def _owned_page_snapshot(
        self,
        *,
        user_id: str,
        page_url: object,
    ) -> dict[str, object]:
        if not isinstance(page_url, str):
            raise AIInputResolutionError(422, "ai_invalid_tool_input", "Invalid AI tool input.")
        owned_origin = self._owned_origin(user_id=user_id, page_url=page_url)
        return self._fetch_snapshot(page_url, allowed_origin=owned_origin)

    def _fetch_snapshot(
        self,
        page_url: str | None,
        *,
        allowed_origin: str | None,
    ) -> dict[str, object]:
        if not isinstance(page_url, str):
            raise AIInputResolutionError(422, "ai_invalid_tool_input", "Invalid AI tool input.")
        fetcher = self._fetcher
        if fetcher is None:
            raise AIInputResolutionError(
                503,
                "ai_source_unavailable",
                "AI source data is temporarily unavailable.",
            )
        try:
            fetched = fetcher.fetch(page_url, allowed_origin=allowed_origin)
        except (KeyError, SafeFetchError, UrlPolicyError, RuntimeError) as error:
            raise AIInputResolutionError(
                502,
                "ai_source_unavailable",
                "AI source data is temporarily unavailable.",
            ) from error
        if not 200 <= fetched.status_code < 300 or not _is_html(fetched.content_type):
            raise AIInputResolutionError(
                502,
                "ai_source_unavailable",
                "AI source data is temporarily unavailable.",
            )
        metadata = parse_html_metadata(fetched.body_text)
        content = _body_text(fetched.body_text)
        if len(content) < 20:
            raise AIInputResolutionError(
                422,
                "ai_source_unavailable",
                "AI source data is temporarily unavailable.",
            )
        try:
            normalized_url = validate_url(fetched.final_url).normalized
        except UrlPolicyError as error:
            raise AIInputResolutionError(
                502,
                "ai_source_unavailable",
                "AI source data is temporarily unavailable.",
            ) from error
        parsed = urlsplit(normalized_url)
        if allowed_origin is not None and _origin_for_url(normalized_url) != allowed_origin:
            raise AIInputResolutionError(
                502,
                "ai_source_unavailable",
                "AI source data is temporarily unavailable.",
            )
        return {
            "page_url": urlunsplit((parsed.scheme, parsed.netloc, parsed.path or "/", "", "")),
            "title": metadata.title,
            "h1": metadata.h1[0] if metadata.h1 else None,
            "content": content,
        }

    @staticmethod
    def _validate_resolved_input(tool_id: str, value: dict[str, object]) -> dict[str, object]:
        try:
            return validate_provider_input(tool_id, value)
        except AIToolContractError as error:
            raise AIInputResolutionError(
                422,
                "ai_source_unavailable",
                "AI source data is temporarily unavailable.",
            ) from error


class _BodyTextParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._ignored_depth = 0
        self._parts: list[str] = []

    def handle_starttag(self, tag: str, _attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() in {"head", "script", "style", "noscript", "template", "svg"}:
            self._ignored_depth += 1

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() in {"head", "script", "style", "noscript", "template", "svg"}:
            self._ignored_depth = max(0, self._ignored_depth - 1)

    def handle_data(self, data: str) -> None:
        if self._ignored_depth == 0 and data.strip():
            self._parts.append(data)

    def text(self) -> str:
        return " ".join(" ".join(self._parts).split())[:MAX_SNAPSHOT_CONTENT_CHARS]


def _body_text(html: str) -> str:
    parser = _BodyTextParser()
    parser.feed(html)
    parser.close()
    return parser.text()


def _is_html(content_type: str | None) -> bool:
    return (content_type or "").split(";", maxsplit=1)[0].strip().casefold() in {
        "text/html",
        "application/xhtml+xml",
    }


def _origin_for_url(raw_url: str) -> str:
    parsed = urlsplit(raw_url)
    return urlunsplit((parsed.scheme, parsed.netloc, "", "", ""))
