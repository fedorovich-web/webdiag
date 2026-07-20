from __future__ import annotations

from functools import lru_cache

from webdiag_api.audit.models import IssueCategory, ToolMapping
from webdiag_api.registry import load_tools

_READY_BINDINGS: dict[IssueCategory, tuple[tuple[str, str, str], ...]] = {
    IssueCategory.ACCESSIBILITY: (
        ("css-design", "color-contrast-checker", "Checks text/background contrast evidence."),
    ),
    IssueCategory.MEDIA: (
        ("media-utilities", "image-optimizer", "Optimizes heavy images referenced by reports."),
        ("media-utilities", "image-resizer", "Checks target dimensions for image fixes."),
    ),
    IssueCategory.PERFORMANCE: (
        ("media-utilities", "image-optimizer", "Reduces oversized image transfer cost."),
    ),
    IssueCategory.STRUCTURED_DATA: (
        (
            "development-data",
            "json-formatter-validator",
            "Validates JSON-LD snippets collected as structured-data evidence.",
        ),
    ),
    IssueCategory.URL: (
        ("development-data", "url-encoder-decoder", "Inspects encoded URL fragments safely."),
    ),
}

_UNAVAILABLE_BINDINGS: dict[IssueCategory, tuple[str, str]] = {
    IssueCategory.HTTP: (
        "seo-audit",
        "Dedicated HTTP status checks belong to the audit engine and are not public tools yet.",
    ),
    IssueCategory.REDIRECTS: (
        "seo-audit",
        "Redirect-chain diagnostics belong to the audit engine and are not public tools yet.",
    ),
    IssueCategory.METADATA: (
        "seo-audit",
        "Meta tag diagnostics belong to the audit engine and are not public tools yet.",
    ),
    IssueCategory.INDEXABILITY: (
        "seo-audit",
        "Indexability diagnostics belong to the audit engine and are not public tools yet.",
    ),
    IssueCategory.CRAWLABILITY: (
        "seo-audit",
        "Robots and sitemap diagnostics belong to the audit engine and are not public tools yet.",
    ),
    IssueCategory.CONTENT: (
        "seo-audit",
        "Content diagnostics belong to the audit engine and are not public tools yet.",
    ),
    IssueCategory.SECURITY: (
        "security",
        "Security-header diagnostics belong to the audit engine and are not public tools yet.",
    ),
}


@lru_cache(maxsize=1)
def _ready_tools_by_slug() -> dict[str, dict[str, object]]:
    return {tool["slug"]: tool for tool in load_tools() if tool["state"] == "ready"}


def bindings_for_category(category: IssueCategory) -> tuple[ToolMapping, ...]:
    ready_tools = _ready_tools_by_slug()
    if category in _READY_BINDINGS:
        mappings = []
        for tool_category, slug, rationale in _READY_BINDINGS[category]:
            if slug not in ready_tools:
                raise ValueError(
                    f"Ready tool mapping points to a missing or non-ready tool: {slug}"
                )
            mappings.append(
                ToolMapping(
                    issue_category=category,
                    tool_category=tool_category,
                    tool_slug=slug,
                    route_ru=f"/tools/{slug}",
                    route_en=f"/en/tools/{slug}",
                    ready=True,
                    rationale=rationale,
                )
            )
        return tuple(mappings)

    tool_category, rationale = _UNAVAILABLE_BINDINGS[category]
    return (
        ToolMapping(
            issue_category=category,
            tool_category=tool_category,
            ready=False,
            rationale=rationale,
        ),
    )


def validate_tool_mappings() -> tuple[ToolMapping, ...]:
    mappings: list[ToolMapping] = []
    for category in IssueCategory:
        mappings.extend(bindings_for_category(category))

    ready_tools = _ready_tools_by_slug()
    for mapping in mappings:
        if mapping.ready:
            if mapping.tool_slug not in ready_tools:
                raise ValueError(f"Tool mapping points to a non-ready tool: {mapping.tool_slug}")
            expected_ru = f"/tools/{mapping.tool_slug}"
            expected_en = f"/en/tools/{mapping.tool_slug}"
            if mapping.route_ru != expected_ru or mapping.route_en != expected_en:
                raise ValueError(f"Tool mapping has invalid localized routes: {mapping.tool_slug}")
        elif mapping.tool_slug is not None:
            raise ValueError(f"Non-ready mapping cannot expose a public route: {mapping.tool_slug}")
    return tuple(mappings)
