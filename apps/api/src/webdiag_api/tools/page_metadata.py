from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated, Literal
from urllib.parse import urljoin, urlsplit

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from webdiag_api.audit.fetcher import (
    SafeFetchConfig,
    SafeFetchError,
    SafeFetchResult,
    SafeHttpFetcher,
)
from webdiag_api.audit.html_metadata import HtmlMetadata, MetaSignal, parse_html_metadata
from webdiag_api.security.url_policy import UrlPolicyError

router = APIRouter(tags=["tools"])


class PageMetadataRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2_048)


class MetadataSignalResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    content: str = Field(min_length=1, max_length=2_048)


class MetadataCheckResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=180)
    status: Literal["pass", "warning", "fail"]
    severity: Literal["info", "medium", "high"]
    value: str | None = Field(default=None, max_length=2_048)
    recommendation: str = Field(min_length=1, max_length=600)


class MetaTagsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.meta_tags.v1"] = "webdiag.tool.meta_tags.v1"
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    content_type: str | None = None
    title: str | None = Field(default=None, max_length=1_000)
    title_length: int = Field(ge=0)
    meta_description: str | None = Field(default=None, max_length=2_000)
    meta_description_length: int = Field(ge=0)
    canonical_url: str | None = Field(default=None, max_length=2_048)
    resolved_canonical_url: str | None = Field(default=None, max_length=2_048)
    robots_directives: tuple[MetadataSignalResponse, ...]
    h1_count: int = Field(ge=0)
    open_graph_count: int = Field(ge=0)
    twitter_card_count: int = Field(ge=0)
    json_ld_count: int = Field(ge=0)
    checks: tuple[MetadataCheckResponse, ...]
    recommendation: str = Field(min_length=1, max_length=800)


class SerpPreviewCheckResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=80)
    status: Literal["pass", "warning", "fail"]
    message: str = Field(min_length=1, max_length=300)


class SerpPreviewResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.serp_preview.v1"] = (
        "webdiag.tool.serp_preview.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    display_url: str = Field(min_length=1, max_length=2_048)
    preview_title: str = Field(min_length=1, max_length=1_000)
    preview_description: str = Field(min_length=1, max_length=2_000)
    title_source: Literal["title", "fallback"]
    description_source: Literal["meta_description", "fallback"]
    title_length: int = Field(ge=0)
    description_length: int = Field(ge=0)
    checks: tuple[SerpPreviewCheckResponse, ...]
    recommendation: str = Field(min_length=1, max_length=800)


class SocialCardPreviewResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, max_length=1_000)
    description: str | None = Field(default=None, max_length=2_000)
    image: str | None = Field(default=None, max_length=2_048)
    url: str | None = Field(default=None, max_length=2_048)
    card_type: str | None = Field(default=None, max_length=160)
    site_name: str | None = Field(default=None, max_length=300)
    missing_fields: tuple[str, ...]
    complete: bool


class SocialPreviewResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.social_preview.v1"] = (
        "webdiag.tool.social_preview.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    open_graph: SocialCardPreviewResponse
    twitter: SocialCardPreviewResponse
    fallback_title: str | None = Field(default=None, max_length=1_000)
    fallback_description: str | None = Field(default=None, max_length=2_000)
    recommendation: str = Field(min_length=1, max_length=800)


def get_page_metadata_fetcher() -> SafeHttpFetcher:
    return SafeHttpFetcher(config=SafeFetchConfig(max_body_bytes=1_000_000))


PageMetadataFetcherDependency = Annotated[SafeHttpFetcher, Depends(get_page_metadata_fetcher)]


@router.post("/v1/tools/meta-tags", response_model=MetaTagsResponse)
def inspect_meta_tags(
    payload: PageMetadataRequest,
    fetcher: PageMetadataFetcherDependency,
) -> MetaTagsResponse:
    fetched, metadata = _fetch_metadata(payload.url, fetcher)
    checks = _meta_tags_checks(
        metadata,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
    )
    return MetaTagsResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        content_type=fetched.content_type,
        title=metadata.title,
        title_length=len(metadata.title or ""),
        meta_description=metadata.meta_description,
        meta_description_length=len(metadata.meta_description or ""),
        canonical_url=metadata.canonical_url,
        resolved_canonical_url=(
            urljoin(fetched.final_url, metadata.canonical_url) if metadata.canonical_url else None
        ),
        robots_directives=tuple(
            MetadataSignalResponse(name=item.user_agent, content=item.content)
            for item in metadata.robots
        ),
        h1_count=len(metadata.h1),
        open_graph_count=len(metadata.open_graph),
        twitter_card_count=len(metadata.twitter_cards),
        json_ld_count=len(metadata.json_ld_scripts),
        checks=tuple(checks),
        recommendation=_meta_tags_recommendation(checks),
    )


@router.post("/v1/tools/serp-preview", response_model=SerpPreviewResponse)
def inspect_serp_preview(
    payload: PageMetadataRequest,
    fetcher: PageMetadataFetcherDependency,
) -> SerpPreviewResponse:
    fetched, metadata = _fetch_metadata(payload.url, fetcher)
    display_url = _display_url(fetched.final_url)
    preview_title = metadata.title or _fallback_title(fetched.final_url)
    preview_description = metadata.meta_description or _fallback_description(fetched.final_url)
    checks = _serp_checks(metadata)
    return SerpPreviewResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        display_url=display_url,
        preview_title=preview_title,
        preview_description=preview_description,
        title_source="title" if metadata.title else "fallback",
        description_source="meta_description" if metadata.meta_description else "fallback",
        title_length=len(preview_title),
        description_length=len(preview_description),
        checks=tuple(checks),
        recommendation=_serp_recommendation(checks),
    )


@router.post("/v1/tools/social-preview", response_model=SocialPreviewResponse)
def inspect_social_preview(
    payload: PageMetadataRequest,
    fetcher: PageMetadataFetcherDependency,
) -> SocialPreviewResponse:
    fetched, metadata = _fetch_metadata(payload.url, fetcher)
    og = _build_open_graph_preview(metadata, final_url=fetched.final_url)
    twitter = _build_twitter_preview(metadata, final_url=fetched.final_url, open_graph=og)
    return SocialPreviewResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        open_graph=og,
        twitter=twitter,
        fallback_title=metadata.title,
        fallback_description=metadata.meta_description,
        recommendation=_social_recommendation(og, twitter),
    )



def _fetch_metadata(raw_url: str, fetcher: SafeHttpFetcher) -> tuple[SafeFetchResult, HtmlMetadata]:
    try:
        fetched = fetcher.fetch(raw_url)
    except UrlPolicyError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "tool_url_rejected", "message": str(exc)},
        ) from exc
    except SafeFetchError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "tool_fetch_failed", "message": str(exc)},
        ) from exc
    return fetched, parse_html_metadata(fetched.body_text)


def _meta_tags_checks(
    metadata: HtmlMetadata, *, final_url: str, status_code: int
) -> list[MetadataCheckResponse]:
    checks = [
        _check_title(metadata.title),
        _check_description(metadata.meta_description),
        _check_canonical(metadata.canonical_url, final_url=final_url),
        _check_robots(metadata),
        _check_h1_summary(metadata.h1),
        _check_social_summary(metadata),
        _check_json_ld_summary(metadata),
    ]
    if status_code >= 400:
        checks.insert(
            0,
            MetadataCheckResponse(
                id="http-status",
                title="HTTP response",
                status="fail",
                severity="high",
                value=str(status_code),
                recommendation=(
                    "Fix the HTTP status before relying on metadata: search engines may not "
                    "index metadata from failing pages."
                ),
            ),
        )
    return checks


def _check_title(title: str | None) -> MetadataCheckResponse:
    length = len(title or "")
    if not title:
        return MetadataCheckResponse(
            id="title",
            title="Title tag",
            status="fail",
            severity="high",
            value=None,
            recommendation="Add one descriptive title tag for the page's search snippet.",
        )
    if length < 20 or length > 70:
        return MetadataCheckResponse(
            id="title",
            title="Title tag",
            status="warning",
            severity="medium",
            value=f"{length} characters",
            recommendation=(
                "Review title length and clarity. Keep it specific, readable, and aligned "
                "with the page intent."
            ),
        )
    return MetadataCheckResponse(
        id="title",
        title="Title tag",
        status="pass",
        severity="info",
        value=f"{length} characters",
        recommendation="Title is present and falls within a practical snippet range.",
    )


def _check_description(description: str | None) -> MetadataCheckResponse:
    length = len(description or "")
    if not description:
        return MetadataCheckResponse(
            id="meta-description",
            title="Meta description",
            status="fail",
            severity="high",
            value=None,
            recommendation="Add a concise meta description that summarizes the page value.",
        )
    if length < 50 or length > 170:
        return MetadataCheckResponse(
            id="meta-description",
            title="Meta description",
            status="warning",
            severity="medium",
            value=f"{length} characters",
            recommendation=(
                "Review description length. It should be specific enough for a snippet "
                "without becoming bloated."
            ),
        )
    return MetadataCheckResponse(
        id="meta-description",
        title="Meta description",
        status="pass",
        severity="info",
        value=f"{length} characters",
        recommendation="Meta description is present and suitable for snippet review.",
    )


def _check_canonical(canonical: str | None, *, final_url: str) -> MetadataCheckResponse:
    if not canonical:
        return MetadataCheckResponse(
            id="canonical",
            title="Canonical summary",
            status="warning",
            severity="medium",
            value=None,
            recommendation="Add canonical if this page can be reached through duplicate URLs.",
        )
    resolved = urljoin(final_url, canonical)
    return MetadataCheckResponse(
        id="canonical",
        title="Canonical summary",
        status="pass",
        severity="info",
        value=resolved,
        recommendation=(
            "Canonical is present. Use the dedicated canonical checker for deeper checks."
        ),
    )


def _check_robots(metadata: HtmlMetadata) -> MetadataCheckResponse:
    if metadata.has_noindex:
        return MetadataCheckResponse(
            id="robots",
            title="Robots meta directives",
            status="fail",
            severity="high",
            value="noindex",
            recommendation=(
                "The page declares noindex. Confirm this is intentional before treating "
                "metadata as indexable SEO content."
            ),
        )
    if metadata.robots:
        return MetadataCheckResponse(
            id="robots",
            title="Robots meta directives",
            status="pass",
            severity="info",
            value=", ".join(item.content for item in metadata.robots),
            recommendation="Robots meta directives are present and do not include noindex.",
        )
    return MetadataCheckResponse(
        id="robots",
        title="Robots meta directives",
        status="pass",
        severity="info",
        value=None,
        recommendation="No robots meta restrictions were found in the HTML metadata.",
    )


def _check_h1_summary(headings: tuple[str, ...]) -> MetadataCheckResponse:
    if len(headings) == 1:
        return MetadataCheckResponse(
            id="h1-summary",
            title="Primary heading summary",
            status="pass",
            severity="info",
            value=headings[0],
            recommendation=(
                "One H1 was found. Use the heading structure checker later for full heading order."
            ),
        )
    if not headings:
        return MetadataCheckResponse(
            id="h1-summary",
            title="Primary heading summary",
            status="warning",
            severity="medium",
            value=None,
            recommendation="No H1 was found. This is a subcheck, not a separate H1 tool.",
        )
    return MetadataCheckResponse(
        id="h1-summary",
        title="Primary heading summary",
        status="warning",
        severity="medium",
        value=str(len(headings)),
        recommendation=(
            "Multiple H1 elements were found. Review the complete heading hierarchy "
            "in the heading structure checker."
        ),
    )


def _check_social_summary(metadata: HtmlMetadata) -> MetadataCheckResponse:
    if metadata.open_graph and metadata.twitter_cards:
        return MetadataCheckResponse(
            id="social-metadata",
            title="Social metadata summary",
            status="pass",
            severity="info",
            value=f"OG: {len(metadata.open_graph)}, Twitter: {len(metadata.twitter_cards)}",
            recommendation="Open Graph and Twitter/X metadata were found.",
        )
    if metadata.open_graph or metadata.twitter_cards:
        return MetadataCheckResponse(
            id="social-metadata",
            title="Social metadata summary",
            status="warning",
            severity="medium",
            value=f"OG: {len(metadata.open_graph)}, Twitter: {len(metadata.twitter_cards)}",
            recommendation=(
                "Social metadata is partial. Use the social preview tool for field details."
            ),
        )
    return MetadataCheckResponse(
        id="social-metadata",
        title="Social metadata summary",
        status="warning",
        severity="medium",
        value=None,
        recommendation="Add Open Graph and Twitter/X metadata for rich sharing previews.",
    )


def _check_json_ld_summary(metadata: HtmlMetadata) -> MetadataCheckResponse:
    if metadata.json_ld_scripts:
        return MetadataCheckResponse(
            id="json-ld-summary",
            title="Structured data summary",
            status="pass",
            severity="info",
            value=str(len(metadata.json_ld_scripts)),
            recommendation="JSON-LD blocks were found. Validate schema details separately.",
        )
    return MetadataCheckResponse(
        id="json-ld-summary",
        title="Structured data summary",
        status="warning",
        severity="medium",
        value=None,
        recommendation="No JSON-LD blocks were found in the HTML metadata.",
    )


def _meta_tags_recommendation(checks: list[MetadataCheckResponse]) -> str:
    fail_count = sum(1 for check in checks if check.status == "fail")
    warning_count = sum(1 for check in checks if check.status == "warning")
    if fail_count:
        return (
            "Fix failed metadata checks first: title/description/indexability issues can directly "
            "affect search snippets and indexation."
        )
    if warning_count:
        return (
            "Core metadata is present, but warnings remain. Review snippet quality, canonical "
            "signals, social metadata, and structured data coverage."
        )
    return "Core metadata signals look consistent for a single-page metadata review."


def _serp_checks(metadata: HtmlMetadata) -> list[SerpPreviewCheckResponse]:
    title_length = len(metadata.title or "")
    description_length = len(metadata.meta_description or "")
    checks = []
    if not metadata.title:
        checks.append(
            SerpPreviewCheckResponse(
                id="title",
                status="fail",
                message="Title is missing; the preview uses a fallback value.",
            )
        )
    elif title_length < 20 or title_length > 70:
        checks.append(
            SerpPreviewCheckResponse(
                id="title",
                status="warning",
                message=f"Title length is {title_length} characters; review snippet fit.",
            )
        )
    else:
        checks.append(
            SerpPreviewCheckResponse(
                id="title",
                status="pass",
                message="Title is present and suitable for snippet review.",
            )
        )

    if not metadata.meta_description:
        checks.append(
            SerpPreviewCheckResponse(
                id="description",
                status="fail",
                message="Meta description is missing; the preview uses a fallback value.",
            )
        )
    elif description_length < 50 or description_length > 170:
        checks.append(
            SerpPreviewCheckResponse(
                id="description",
                status="warning",
                message=(
                    f"Meta description length is {description_length} characters; "
                    "review snippet fit."
                ),
            )
        )
    else:
        checks.append(
            SerpPreviewCheckResponse(
                id="description",
                status="pass",
                message="Meta description is present and suitable for snippet review.",
            )
        )

    if metadata.has_noindex:
        checks.append(
            SerpPreviewCheckResponse(
                id="indexability",
                status="fail",
                message="The page declares noindex, so a search result preview may not apply.",
            )
        )
    return checks


def _serp_recommendation(checks: list[SerpPreviewCheckResponse]) -> str:
    if any(check.status == "fail" for check in checks):
        return "Fix missing title/description or noindex before relying on this search preview."
    if any(check.status == "warning" for check in checks):
        return "Preview is usable, but review title and description length before publishing."
    return "SERP preview is ready for a single-page snippet review."


def _signal_map(signals: tuple[MetaSignal, ...]) -> dict[str, str]:
    values: dict[str, str] = {}
    for signal in signals:
        values.setdefault(signal.name.lower(), signal.content)
    return values


def _build_open_graph_preview(
    metadata: HtmlMetadata,
    *,
    final_url: str,
) -> SocialCardPreviewResponse:
    og = _signal_map(metadata.open_graph)
    title = og.get("og:title") or metadata.title
    description = og.get("og:description") or metadata.meta_description
    image = _resolve_optional_url(og.get("og:image"), final_url=final_url)
    url = _resolve_optional_url(og.get("og:url"), final_url=final_url) or final_url
    card_type = og.get("og:type")
    site_name = og.get("og:site_name")
    missing = tuple(
        item
        for item, value in {
            "title": title,
            "description": description,
            "image": image,
        }.items()
        if not value
    )
    return SocialCardPreviewResponse(
        title=title,
        description=description,
        image=image,
        url=url,
        card_type=card_type,
        site_name=site_name,
        missing_fields=missing,
        complete=len(missing) == 0,
    )


def _build_twitter_preview(
    metadata: HtmlMetadata,
    *,
    final_url: str,
    open_graph: SocialCardPreviewResponse,
) -> SocialCardPreviewResponse:
    twitter = _signal_map(metadata.twitter_cards)
    title = twitter.get("twitter:title") or open_graph.title or metadata.title
    description = (
        twitter.get("twitter:description")
        or open_graph.description
        or metadata.meta_description
    )
    image = (
        _resolve_optional_url(twitter.get("twitter:image"), final_url=final_url)
        or open_graph.image
    )
    card_type = twitter.get("twitter:card")
    site_name = twitter.get("twitter:site") or open_graph.site_name
    missing = tuple(
        item
        for item, value in {
            "card": card_type,
            "title": title,
            "description": description,
        }.items()
        if not value
    )
    return SocialCardPreviewResponse(
        title=title,
        description=description,
        image=image,
        url=final_url,
        card_type=card_type,
        site_name=site_name,
        missing_fields=missing,
        complete=len(missing) == 0,
    )


def _social_recommendation(
    open_graph: SocialCardPreviewResponse,
    twitter: SocialCardPreviewResponse,
) -> str:
    if open_graph.complete and twitter.complete:
        return "Open Graph and Twitter/X card metadata are sufficient for rich preview review."
    if open_graph.complete:
        return (
            "Open Graph preview is complete. Add explicit Twitter/X card fields if the share "
            "preview should be controlled independently."
        )
    return "Add at least og:title, og:description and og:image for reliable rich previews."


def _resolve_optional_url(raw_url: str | None, *, final_url: str) -> str | None:
    if not raw_url:
        return None
    return urljoin(final_url, raw_url)


def _display_url(raw_url: str) -> str:
    parsed = urlsplit(raw_url)
    path = parsed.path or "/"
    return f"{parsed.netloc}{path}"


def _fallback_title(raw_url: str) -> str:
    parsed = urlsplit(raw_url)
    return parsed.hostname or raw_url


def _fallback_description(raw_url: str) -> str:
    return f"No meta description was found for {raw_url}. Add one to control the snippet."
