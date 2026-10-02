from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from webdiag_api.accounts.workspace_models import (
    AccountProject,
    SavedAuditDetailResponse,
    SavedAuditRecommendation,
    SavedAuditSummary,
)

NormalizedIssueCategory = Literal[
    "seo",
    "performance",
    "accessibility",
    "security",
    "content",
    "technical",
]
IssuePriority = Literal["p0", "p1", "p2", "p3"]
IssueSort = Literal["priority", "category", "title"]
IssueOrder = Literal["asc", "desc"]

_PRIORITY_RANK: dict[str, int] = {"p0": 0, "p1": 1, "p2": 2, "p3": 3}
_SEVERITY_RANK: dict[str, int] = {
    "critical": 0,
    "high": 1,
    "medium": 2,
    "low": 3,
    "info": 4,
}
_CATEGORY_MAP: dict[str, NormalizedIssueCategory] = {
    "metadata": "seo",
    "indexability": "seo",
    "crawlability": "seo",
    "structured_data": "seo",
    "url": "seo",
    "performance": "performance",
    "accessibility": "accessibility",
    "security": "security",
    "content": "content",
    "http": "technical",
    "redirects": "technical",
    "media": "technical",
}


class IssueListOptions(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    category: NormalizedIssueCategory | None = None
    priority: IssuePriority | None = None
    sort: IssueSort = "priority"
    order: IssueOrder = "asc"


class AccountIssue(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    issue_id: str = Field(min_length=1, max_length=120)
    check_id: str | None = Field(default=None, min_length=1, max_length=120)
    category: NormalizedIssueCategory
    source_category: str = Field(min_length=1, max_length=80)
    severity: str = Field(min_length=1, max_length=32)
    priority: IssuePriority
    fix_order: int = Field(ge=1)
    title: str = Field(min_length=1, max_length=180)
    description: str = Field(min_length=1, max_length=1_000)
    affected_urls: tuple[str, ...]
    recommendation: SavedAuditRecommendation


class AccountIssueListResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    contract_version: Literal["webdiag.account.issue_list.v1"] = (
        "webdiag.account.issue_list.v1"
    )
    project: AccountProject
    audit: SavedAuditSummary
    total: int = Field(ge=0)
    items: tuple[AccountIssue, ...]


class AccountIssueDetailResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    contract_version: Literal["webdiag.account.issue_detail.v1"] = (
        "webdiag.account.issue_detail.v1"
    )
    project: AccountProject
    audit: SavedAuditSummary
    issue: AccountIssue


def normalize_issue_category(source_category: str) -> NormalizedIssueCategory:
    return _CATEGORY_MAP.get(source_category, "technical")


def _base_order(issue: AccountIssue) -> tuple[int, int, str]:
    return (
        _PRIORITY_RANK.get(issue.priority, 99),
        _SEVERITY_RANK.get(issue.severity, 99),
        issue.issue_id,
    )


def _projected_issues(detail: SavedAuditDetailResponse) -> tuple[AccountIssue, ...]:
    candidates = [
        AccountIssue(
            issue_id=issue.issue_id,
            check_id=issue.check_id,
            category=normalize_issue_category(issue.category),
            source_category=issue.category,
            severity=issue.severity,
            priority=issue.priority,
            fix_order=1,
            title=issue.title,
            description=issue.description,
            affected_urls=issue.affected_urls,
            recommendation=issue.recommendation,
        )
        for issue in detail.payload.issues
    ]
    ordered = sorted(candidates, key=_base_order)
    return tuple(
        issue.model_copy(update={"fix_order": index})
        for index, issue in enumerate(ordered, start=1)
    )


def project_saved_audit_issues(
    detail: SavedAuditDetailResponse,
    options: IssueListOptions,
) -> AccountIssueListResponse:
    items = [
        issue
        for issue in _projected_issues(detail)
        if (options.category is None or issue.category == options.category)
        and (options.priority is None or issue.priority == options.priority)
    ]
    def category_key(issue: AccountIssue) -> tuple[str, int]:
        return issue.category, issue.fix_order

    def title_key(issue: AccountIssue) -> tuple[str, int]:
        return issue.title.casefold(), issue.fix_order

    def priority_key(issue: AccountIssue) -> tuple[int]:
        return (issue.fix_order,)

    if options.sort == "category":
        key = category_key
    elif options.sort == "title":
        key = title_key
    else:
        key = priority_key
    items.sort(key=key, reverse=options.order == "desc")
    return AccountIssueListResponse(
        project=detail.project,
        audit=detail.audit,
        total=len(items),
        items=tuple(items),
    )


def project_saved_audit_issue(
    detail: SavedAuditDetailResponse,
    issue_id: str,
) -> AccountIssueDetailResponse | None:
    issue = next(
        (candidate for candidate in _projected_issues(detail) if candidate.issue_id == issue_id),
        None,
    )
    if issue is None:
        return None
    return AccountIssueDetailResponse(
        project=detail.project,
        audit=detail.audit,
        issue=issue,
    )
