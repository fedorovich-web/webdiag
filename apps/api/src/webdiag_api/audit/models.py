from __future__ import annotations

from datetime import UTC, datetime
from enum import StrEnum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator


class AuditTargetScope(StrEnum):
    SINGLE_URL = "single_url"
    SITEMAP = "sitemap"


class AuditJobStatus(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"


class CheckStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    PASSED = "passed"
    WARNING = "warning"
    FAILED = "failed"
    SKIPPED = "skipped"
    ERROR = "error"


class Severity(StrEnum):
    INFO = "info"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Priority(StrEnum):
    P0 = "p0"
    P1 = "p1"
    P2 = "p2"
    P3 = "p3"


class IssueCategory(StrEnum):
    HTTP = "http"
    REDIRECTS = "redirects"
    METADATA = "metadata"
    INDEXABILITY = "indexability"
    CRAWLABILITY = "crawlability"
    CONTENT = "content"
    STRUCTURED_DATA = "structured_data"
    SECURITY = "security"
    PERFORMANCE = "performance"
    ACCESSIBILITY = "accessibility"
    MEDIA = "media"
    URL = "url"


class EvidenceKind(StrEnum):
    HTTP_HEADER = "http_header"
    HTML_ELEMENT = "html_element"
    ROBOTS_DIRECTIVE = "robots_directive"
    SITEMAP_ENTRY = "sitemap_entry"
    REDIRECT_HOP = "redirect_hop"
    TEXT_SAMPLE = "text_sample"
    TOOL_OUTPUT = "tool_output"
    SYSTEM = "system"


class WebDiagModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True, use_enum_values=False)


class Evidence(WebDiagModel):
    kind: EvidenceKind
    source: str = Field(min_length=1, max_length=200)
    value: str = Field(min_length=1, max_length=2_000)
    excerpt: str | None = Field(default=None, max_length=2_000)
    metadata: dict[str, Any] = Field(default_factory=dict)


class Recommendation(WebDiagModel):
    summary: str = Field(min_length=1, max_length=240)
    steps: tuple[str, ...] = Field(default_factory=tuple)
    expected_impact: str | None = Field(default=None, max_length=500)

    @field_validator("steps")
    @classmethod
    def steps_must_be_useful(cls, value: tuple[str, ...]) -> tuple[str, ...]:
        for step in value:
            if not step.strip():
                raise ValueError("Recommendation steps cannot be blank.")
        return value


class AffectedUrl(WebDiagModel):
    url: HttpUrl
    normalized_url: str = Field(min_length=1, max_length=2_048)
    status_code: int | None = Field(default=None, ge=100, le=599)
    final_url: HttpUrl | None = None


class ToolMapping(WebDiagModel):
    issue_category: IssueCategory
    tool_category: str = Field(min_length=1, max_length=80)
    tool_slug: str | None = Field(default=None, min_length=1, max_length=120)
    route_ru: str | None = Field(default=None, pattern=r"^/tools/[a-z0-9-]+$")
    route_en: str | None = Field(default=None, pattern=r"^/en/tools/[a-z0-9-]+$")
    ready: bool = False
    rationale: str = Field(min_length=1, max_length=500)

    @field_validator("ready")
    @classmethod
    def ready_requires_routes(cls, value: bool, info: Any) -> bool:
        data = info.data
        if value and not (data.get("tool_slug") and data.get("route_ru") and data.get("route_en")):
            raise ValueError("Ready tool mappings require slug and localized routes.")
        return value


class AuditTarget(WebDiagModel):
    original_url: str = Field(min_length=1, max_length=2_048)
    normalized_url: HttpUrl
    hostname: str = Field(min_length=1, max_length=253)
    scope: AuditTargetScope = AuditTargetScope.SINGLE_URL


class AuditCheck(WebDiagModel):
    check_id: str = Field(min_length=1, max_length=120)
    taxonomy_version: str = Field(default="webdiag.audit.taxonomy.v1", min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=160)
    category: IssueCategory
    status: CheckStatus = CheckStatus.PENDING
    started_at: datetime | None = None
    completed_at: datetime | None = None
    duration_ms: int | None = Field(default=None, ge=0)
    evidence: tuple[Evidence, ...] = Field(default_factory=tuple)
    issue_ids: tuple[str, ...] = Field(default_factory=tuple)


class AuditIssue(WebDiagModel):
    issue_id: str = Field(min_length=1, max_length=120)
    check_id: str | None = Field(default=None, min_length=1, max_length=120)
    taxonomy_version: str = Field(default="webdiag.audit.taxonomy.v1", min_length=1, max_length=80)
    category: IssueCategory
    severity: Severity
    priority: Priority
    title: str = Field(min_length=1, max_length=180)
    description: str = Field(min_length=1, max_length=1_000)
    affected_urls: tuple[AffectedUrl, ...] = Field(default_factory=tuple)
    evidence: tuple[Evidence, ...] = Field(default_factory=tuple)
    recommendation: Recommendation
    tool_mappings: tuple[ToolMapping, ...] = Field(default_factory=tuple)


class AuditRunSummary(WebDiagModel):
    status: AuditJobStatus
    score: int | None = Field(default=None, ge=0, le=100)
    check_count: int = Field(ge=0)
    issue_count: int = Field(ge=0)
    checks_by_status: dict[str, int] = Field(default_factory=dict)
    issues_by_severity: dict[str, int] = Field(default_factory=dict)
    issues_by_priority: dict[str, int] = Field(default_factory=dict)
    highest_severity: Severity | None = None
    top_priority: Priority | None = None


class AuditJob(WebDiagModel):
    job_id: UUID = Field(default_factory=uuid4)
    target: AuditTarget
    status: AuditJobStatus = AuditJobStatus.QUEUED
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class AuditRun(WebDiagModel):
    run_id: UUID = Field(default_factory=uuid4)
    job_id: UUID
    target: AuditTarget
    status: AuditJobStatus = AuditJobStatus.RUNNING
    checks: tuple[AuditCheck, ...] = Field(default_factory=tuple)
    issues: tuple[AuditIssue, ...] = Field(default_factory=tuple)
    score: int | None = Field(default=None, ge=0, le=100)
    started_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    completed_at: datetime | None = None
