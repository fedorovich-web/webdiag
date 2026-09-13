from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from webdiag_api.audit.models import IssueCategory, Priority, Recommendation, Severity


class StrictCrawlModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


class CrawlPage(StrictCrawlModel):
    url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    title: str | None = Field(default=None, max_length=300)
    meta_description: str | None = Field(default=None, max_length=500)
    internal_links: tuple[str, ...] = Field(default=(), max_length=100)


class CrawlSeverityCounts(StrictCrawlModel):
    critical: int = Field(default=0, ge=0, le=50_000)
    high: int = Field(default=0, ge=0, le=50_000)
    medium: int = Field(default=0, ge=0, le=50_000)
    low: int = Field(default=0, ge=0, le=50_000)
    info: int = Field(default=0, ge=0, le=50_000)


class AuditedCrawlPage(CrawlPage):
    audit_score: int = Field(ge=0, le=100)
    issue_count: int = Field(ge=0, le=100)
    issues_by_severity: CrawlSeverityCounts


class CrawlPageFailure(StrictCrawlModel):
    url: str = Field(min_length=1, max_length=2_048)
    code: Literal["fetch_failed", "not_html", "robots_disallowed"]


class CrawlDuplicateGroup(StrictCrawlModel):
    value: str = Field(min_length=1, max_length=500)
    urls: tuple[str, ...] = Field(min_length=2, max_length=500)


class CrawlResult(StrictCrawlModel):
    contract_version: Literal["webdiag.crawl.result.v1"] = "webdiag.crawl.result.v1"
    origin: str = Field(min_length=1, max_length=2_048)
    pages: tuple[CrawlPage, ...] = Field(max_length=500)
    page_failures: tuple[CrawlPageFailure, ...] = Field(default=(), max_length=500)
    page_limit: int = Field(default=100, ge=1, le=500)
    page_budget_exhausted: bool = False
    sitemap_url: str | None = Field(default=None, max_length=2_048)
    sitemap_url_count: int = Field(default=0, ge=0, le=10_000)
    duplicate_titles: tuple[CrawlDuplicateGroup, ...] = Field(default=(), max_length=25)
    duplicate_descriptions: tuple[CrawlDuplicateGroup, ...] = Field(
        default=(), max_length=25
    )
    orphan_urls: tuple[str, ...] = Field(default=(), max_length=100)
    completed_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class SiteAuditIssue(StrictCrawlModel):
    issue_id: str = Field(min_length=1, max_length=120)
    check_id: str | None = Field(default=None, min_length=1, max_length=120)
    category: IssueCategory
    severity: Severity
    priority: Priority
    title: str = Field(min_length=1, max_length=180)
    description: str = Field(min_length=1, max_length=1_000)
    affected_urls: tuple[str, ...] = Field(min_length=1, max_length=25)
    affected_url_count: int = Field(ge=1, le=500)
    recommendation: Recommendation


class SiteAuditSummary(StrictCrawlModel):
    pages_audited: int = Field(default=0, ge=0, le=500)
    pages_with_issues: int = Field(default=0, ge=0, le=500)
    unique_issue_count: int = Field(default=0, ge=0, le=100)
    issue_occurrence_count: int = Field(default=0, ge=0, le=50_000)
    occurrences_by_severity: CrawlSeverityCounts = Field(
        default_factory=CrawlSeverityCounts
    )


class SiteAuditResult(StrictCrawlModel):
    contract_version: Literal["webdiag.site_audit.result.v1"] = (
        "webdiag.site_audit.result.v1"
    )
    origin: str = Field(min_length=1, max_length=2_048)
    pages: tuple[AuditedCrawlPage, ...] = Field(max_length=500)
    page_failures: tuple[CrawlPageFailure, ...] = Field(default=(), max_length=500)
    page_limit: int = Field(default=100, ge=1, le=500)
    page_budget_exhausted: bool = False
    sitemap_url: str | None = Field(default=None, max_length=2_048)
    sitemap_url_count: int = Field(default=0, ge=0, le=10_000)
    sitemap_complete: bool = False
    duplicate_titles: tuple[CrawlDuplicateGroup, ...] = Field(default=(), max_length=25)
    duplicate_descriptions: tuple[CrawlDuplicateGroup, ...] = Field(
        default=(), max_length=25
    )
    orphan_urls: tuple[str, ...] = Field(default=(), max_length=100)
    audit_summary: SiteAuditSummary = Field(default_factory=SiteAuditSummary)
    issues: tuple[SiteAuditIssue, ...] = Field(default=(), max_length=100)
    completed_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class AccountCrawlJob(StrictCrawlModel):
    id: str = Field(min_length=36, max_length=36)
    project_id: str = Field(min_length=36, max_length=36)
    origin: str = Field(min_length=1, max_length=2_048)
    state: Literal["queued", "running", "succeeded", "failed"]
    error_code: str | None = Field(default=None, max_length=120)
    created_at: datetime
    updated_at: datetime


class AccountCrawlDetail(StrictCrawlModel):
    contract_version: Literal["webdiag.account.crawl_detail.v1"] = (
        "webdiag.account.crawl_detail.v1"
    )
    job: AccountCrawlJob
    result: CrawlResult | None = None


class AccountCrawlList(StrictCrawlModel):
    contract_version: Literal["webdiag.account.crawl_list.v1"] = (
        "webdiag.account.crawl_list.v1"
    )
    jobs: tuple[AccountCrawlJob, ...] = Field(max_length=20)


class AccountSiteAuditDetail(StrictCrawlModel):
    contract_version: Literal["webdiag.account.site_audit_detail.v1"] = (
        "webdiag.account.site_audit_detail.v1"
    )
    job: AccountCrawlJob
    result: SiteAuditResult | None = None


class AccountSiteAuditList(StrictCrawlModel):
    contract_version: Literal["webdiag.account.site_audit_list.v1"] = (
        "webdiag.account.site_audit_list.v1"
    )
    jobs: tuple[AccountCrawlJob, ...] = Field(max_length=20)


StoredCrawlResult = CrawlResult | SiteAuditResult
