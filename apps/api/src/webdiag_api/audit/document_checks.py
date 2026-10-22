from __future__ import annotations

from urllib.parse import urlsplit

from webdiag_api.audit.fetcher import SafeFetchResult
from webdiag_api.audit.html_metadata import HtmlMetadata, x_robots_has_directive
from webdiag_api.audit.models import (
    AffectedUrl,
    AuditCheck,
    AuditIssue,
    CheckStatus,
    Evidence,
    EvidenceKind,
    Recommendation,
)
from webdiag_api.audit.registry_mapping import bindings_for_category
from webdiag_api.audit.taxonomy import get_check_definition, get_issue_definition


def evaluate_document_checks(
    fetched: SafeFetchResult,
    metadata: HtmlMetadata,
) -> tuple[list[AuditCheck], list[AuditIssue]]:
    """Evaluate static signals from the already fetched document, without extra requests."""
    checks: list[AuditCheck] = []
    issues: list[AuditIssue] = []
    html = (fetched.content_type or "").split(";", maxsplit=1)[0].strip().lower() in {
        "text/html",
        "application/xhtml+xml",
    }
    affected = (
        AffectedUrl(
            url=fetched.final_url,
            normalized_url=fetched.final_url,
            status_code=fetched.status_code,
            final_url=fetched.final_url,
        ),
    )

    def add(
        check_id: str,
        issue_suffix: str,
        problem: bool,
        *,
        source: str,
        value: str,
        recommendation: str,
        details: dict[str, object] | None = None,
        skip: bool = False,
        kind: EvidenceKind = EvidenceKind.HTML_ELEMENT,
    ) -> None:
        definition = get_check_definition(check_id)
        evidence = Evidence(
            kind=kind,
            source=source,
            value=value[:2000],
            metadata=details or {},
        )
        issue_id = f"{check_id}.{issue_suffix}"
        checks.append(
            AuditCheck(
                check_id=check_id,
                name=definition.name,
                category=definition.category,
                status=CheckStatus.SKIPPED
                if skip
                else (CheckStatus.WARNING if problem else CheckStatus.PASSED),
                evidence=(evidence,),
                issue_ids=(issue_id,) if problem and not skip else (),
            )
        )
        if not problem or skip:
            return
        issue = get_issue_definition(issue_id)
        issues.append(
            AuditIssue(
                issue_id=issue_id,
                check_id=check_id,
                category=issue.category,
                severity=issue.severity,
                priority=issue.priority,
                title=issue.title,
                description=issue.summary,
                affected_urls=affected,
                evidence=(evidence,),
                recommendation=Recommendation(summary=recommendation, steps=(recommendation,)),
                tool_mappings=bindings_for_category(issue.category),
            )
        )

    x_robots = next((v for k, v in fetched.headers.items() if k.lower() == "x-robots-tag"), "")
    add(
        "indexability.x_robots_tag",
        "noindex",
        x_robots_has_directive(x_robots, "noindex"),
        source="x-robots-tag",
        value=x_robots or "not set",
        kind=EvidenceKind.HTTP_HEADER,
        recommendation=(
            "Review X-Robots-Tag and remove indexing restrictions only for public indexable pages."
        ),
    )
    add(
        "security.https",
        "missing",
        urlsplit(fetched.final_url).scheme.lower() != "https",
        source="http.final_url",
        kind=EvidenceKind.SYSTEM,
        value=fetched.final_url,
        recommendation=(
            "Serve the page over HTTPS and redirect the HTTP URL to its HTTPS destination."
        ),
    )
    viewport = metadata.viewport or ""
    add(
        "metadata.viewport",
        "missing",
        "width=device-width" not in viewport.lower().replace(" ", ""),
        source='meta[name="viewport"]',
        value=viewport or "missing",
        skip=not html,
        recommendation=(
            "Declare a viewport with width=device-width and verify the responsive layout on mobile."
        ),
    )
    add(
        "accessibility.language",
        "missing",
        not metadata.html_lang,
        source="html[lang]",
        value=metadata.html_lang or "missing",
        skip=not html,
        recommendation="Set the HTML lang attribute to the language actually used on the page.",
    )
    missing_alt = sum(not item.has_alt for item in metadata.images)
    add(
        "media.image_alt",
        "missing",
        missing_alt > 0,
        source="img[alt]",
        value=f"{missing_alt} missing / {len(metadata.images)} images",
        details={"missing": missing_alt, "total": len(metadata.images)},
        skip=not html,
        recommendation=(
            'Add descriptive alt text to meaningful images and alt="" to decorative images.'
        ),
    )
    missing_dimensions = sum(not item.has_dimensions for item in metadata.images)
    add(
        "media.image_dimensions",
        "missing",
        missing_dimensions > 0,
        source="img[width][height]",
        value=f"{missing_dimensions} missing / {len(metadata.images)} images",
        details={"missing": missing_dimensions, "total": len(metadata.images)},
        skip=not html,
        recommendation=(
            "Reserve image space with matching width and height or CSS "
            "aspect-ratio; verify layout shifts in a browser."
        ),
    )
    jumps = sum(
        right > left + 1
        for left, right in zip(
            metadata.heading_levels,
            metadata.heading_levels[1:],
            strict=False,
        )
    )
    add(
        "content.heading_order",
        "skipped_level",
        jumps > 0,
        source="h1,h2,h3,h4,h5,h6",
        value=f"{jumps} skipped levels",
        skip=not html,
        details={"levels": list(metadata.heading_levels[:100])},
        recommendation="Use consecutive heading levels to reflect the actual document structure.",
    )
    counts = {
        "title": metadata.title_count,
        "description": metadata.description_count,
        "canonical": metadata.canonical_count,
    }
    add(
        "metadata.unique_tags",
        "duplicate",
        any(count > 1 for count in counts.values()),
        source="head metadata",
        value=", ".join(f"{key}: {count}" for key, count in counts.items()),
        details=dict(counts),
        skip=not html,
        recommendation=(
            "Keep one title, one meta description and one canonical declaration for this page."
        ),
    )
    return checks, issues
