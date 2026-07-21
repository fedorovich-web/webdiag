from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from datetime import UTC, datetime
from html.parser import HTMLParser
from typing import Annotated, Literal
from urllib.parse import urljoin, urlsplit

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeFetchError, SafeHttpFetcher
from webdiag_api.security.url_policy import UrlPolicyError

router = APIRouter(tags=["tools"])

CheckStatus = Literal["pass", "warning", "fail"]
Severity = Literal["info", "medium", "high"]
AltStatus = Literal["missing", "empty", "decorative", "present"]
ImageSource = Literal["img-src", "img-srcset", "picture-source", "social-image"]


class ImageToolRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2_048)


class ImageFormatSummaryResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    format: str = Field(min_length=1, max_length=32)
    count: int = Field(ge=0)
    known_bytes: int = Field(ge=0)
    unknown_size_count: int = Field(ge=0)


class ImagePerformanceItemResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2_048)
    source: ImageSource
    format: str = Field(min_length=1, max_length=32)
    status_code: int | None = Field(default=None, ge=100, le=599)
    content_type: str | None = Field(default=None, max_length=240)
    content_length: int | None = Field(default=None, ge=0)
    width_attr: str | None = Field(default=None, max_length=40)
    height_attr: str | None = Field(default=None, max_length=40)
    loading: str | None = Field(default=None, max_length=40)
    uses_srcset: bool
    uses_picture: bool
    modern_raster_format: bool | None
    oversized: bool
    recommendations: tuple[str, ...]


class ImagePerformanceResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.image_performance.v1"] = (
        "webdiag.tool.image_performance.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    scan_mode: Literal["static_html_bounded"] = "static_html_bounded"
    discovered_image_count: int = Field(ge=0)
    checked_image_count: int = Field(ge=0)
    total_known_image_bytes: int = Field(ge=0)
    unknown_size_count: int = Field(ge=0)
    modern_raster_count: int = Field(ge=0)
    legacy_raster_count: int = Field(ge=0)
    svg_count: int = Field(ge=0)
    oversized_count: int = Field(ge=0)
    missing_dimensions_count: int = Field(ge=0)
    lazy_loading_candidate_count: int = Field(ge=0)
    responsive_markup_count: int = Field(ge=0)
    format_summaries: tuple[ImageFormatSummaryResponse, ...]
    largest_images: tuple[ImagePerformanceItemResponse, ...]
    recommendation: str = Field(min_length=1, max_length=1_200)


class ImageSeoCheckResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=180)
    status: CheckStatus
    severity: Severity
    value: str | None = Field(default=None, max_length=240)
    recommendation: str = Field(min_length=1, max_length=600)


class ImageSeoItemResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2_048)
    alt_status: AltStatus
    alt_text: str | None = Field(default=None, max_length=240)
    in_link: bool
    has_dimensions: bool
    loading: str | None = Field(default=None, max_length=40)
    uses_srcset: bool
    uses_picture: bool


class ImageSeoResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.image_seo.v1"] = "webdiag.tool.image_seo.v1"
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    total_images: int = Field(ge=0)
    missing_alt_count: int = Field(ge=0)
    empty_alt_count: int = Field(ge=0)
    decorative_count: int = Field(ge=0)
    linked_images_without_alt_count: int = Field(ge=0)
    missing_dimensions_count: int = Field(ge=0)
    responsive_image_count: int = Field(ge=0)
    lazy_loading_count: int = Field(ge=0)
    og_image_url: str | None = Field(default=None, max_length=2_048)
    twitter_image_url: str | None = Field(default=None, max_length=2_048)
    checks: tuple[ImageSeoCheckResponse, ...]
    sample_images: tuple[ImageSeoItemResponse, ...]
    recommendation: str = Field(min_length=1, max_length=1_200)


class FaviconIconResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    rel: str = Field(min_length=1, max_length=120)
    url: str = Field(min_length=1, max_length=2_048)
    sizes: str | None = Field(default=None, max_length=160)
    declared_type: str | None = Field(default=None, max_length=160)
    status_code: int | None = Field(default=None, ge=100, le=599)
    content_type: str | None = Field(default=None, max_length=240)
    content_length: int | None = Field(default=None, ge=0)
    format: str = Field(min_length=1, max_length=32)
    recommendation: str | None = Field(default=None, max_length=500)


class FaviconResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.favicon.v1"] = "webdiag.tool.favicon.v1"
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    discovered_icon_count: int = Field(ge=0)
    checked_icon_count: int = Field(ge=0)
    has_favicon: bool
    has_svg_icon: bool
    has_apple_touch_icon: bool
    has_manifest: bool
    manifest_url: str | None = Field(default=None, max_length=2_048)
    fallback_ico_checked: bool
    icons: tuple[FaviconIconResponse, ...]
    recommendation: str = Field(min_length=1, max_length=1_000)


@dataclass(frozen=True, slots=True)
class ParsedImage:
    url: str
    source: ImageSource
    alt_present: bool
    alt_text: str | None
    in_link: bool
    width: str | None
    height: str | None
    loading: str | None
    decoding: str | None
    fetchpriority: str | None
    uses_srcset: bool
    uses_picture: bool


@dataclass(frozen=True, slots=True)
class ParsedIcon:
    rel: str
    url: str
    sizes: str | None
    declared_type: str | None


class ImageHTMLParser(HTMLParser):
    def __init__(self, *, base_url: str) -> None:
        super().__init__(convert_charrefs=True)
        self.base_url = base_url
        self.images: list[ParsedImage] = []
        self.image_candidates: list[ParsedImage] = []
        self.icons: list[ParsedIcon] = []
        self.manifest_url: str | None = None
        self.og_image_url: str | None = None
        self.twitter_image_url: str | None = None
        self._picture_depth = 0
        self._link_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {name.lower(): (value if value is not None else "") for name, value in attrs}
        if tag == "picture":
            self._picture_depth += 1
        if tag == "a":
            self._link_depth += 1
        if tag == "source" and self._picture_depth:
            for url in _srcset_urls(values.get("srcset")):
                self.image_candidates.append(
                    ParsedImage(
                        url=urljoin(self.base_url, url),
                        source="picture-source",
                        alt_present=False,
                        alt_text=None,
                        in_link=self._link_depth > 0,
                        width=None,
                        height=None,
                        loading=None,
                        decoding=None,
                        fetchpriority=None,
                        uses_srcset=True,
                        uses_picture=True,
                    )
                )
        if tag == "img":
            srcset = values.get("srcset")
            src = values.get("src")
            urls = [src] if src else []
            srcset_urls = _srcset_urls(srcset)
            urls.extend(srcset_urls)
            if not urls:
                return
            primary = _absolute_image_url(urls[0], self.base_url)
            image = ParsedImage(
                url=primary,
                source="img-src",
                alt_present="alt" in values,
                alt_text=values.get("alt"),
                in_link=self._link_depth > 0,
                width=_blank_to_none(values.get("width")),
                height=_blank_to_none(values.get("height")),
                loading=_blank_to_none(values.get("loading")),
                decoding=_blank_to_none(values.get("decoding")),
                fetchpriority=_blank_to_none(values.get("fetchpriority")),
                uses_srcset=bool(srcset_urls),
                uses_picture=self._picture_depth > 0,
            )
            self.images.append(image)
            self.image_candidates.append(image)
            for extra in srcset_urls:
                absolute = _absolute_image_url(extra, self.base_url)
                if absolute != primary:
                    self.image_candidates.append(
                        ParsedImage(
                            url=absolute,
                            source="img-srcset",
                            alt_present=image.alt_present,
                            alt_text=image.alt_text,
                            in_link=image.in_link,
                            width=image.width,
                            height=image.height,
                            loading=image.loading,
                            decoding=image.decoding,
                            fetchpriority=image.fetchpriority,
                            uses_srcset=True,
                            uses_picture=image.uses_picture,
                        )
                    )
        if tag == "link":
            rel = values.get("rel", "").lower()
            href = values.get("href")
            if href and "manifest" in rel:
                self.manifest_url = _absolute_image_url(href, self.base_url)
            if href and _is_icon_rel(rel):
                self.icons.append(
                    ParsedIcon(
                        rel=rel,
                        url=_absolute_image_url(href, self.base_url),
                        sizes=_blank_to_none(values.get("sizes")),
                        declared_type=_blank_to_none(values.get("type")),
                    )
                )
        if tag == "meta":
            key = (values.get("property") or values.get("name") or "").lower()
            content = values.get("content")
            if content and key == "og:image":
                self.og_image_url = _absolute_image_url(content, self.base_url)
            if content and key in {"twitter:image", "twitter:image:src"}:
                self.twitter_image_url = _absolute_image_url(content, self.base_url)

    def handle_endtag(self, tag: str) -> None:
        if tag == "picture" and self._picture_depth:
            self._picture_depth -= 1
        if tag == "a" and self._link_depth:
            self._link_depth -= 1


def get_image_audit_fetcher() -> SafeHttpFetcher:
    return SafeHttpFetcher(config=SafeFetchConfig(max_body_bytes=600_000, max_redirects=5))


ImageAuditFetcherDependency = Annotated[SafeHttpFetcher, Depends(get_image_audit_fetcher)]


@router.post("/v1/tools/image-performance", response_model=ImagePerformanceResponse)
def inspect_image_performance(
    payload: ImageToolRequest,
    fetcher: ImageAuditFetcherDependency,
) -> ImagePerformanceResponse:
    fetched = _fetch_html_or_raise(fetcher, payload.url)
    parsed = _parse_image_html(fetched.body_text, base_url=fetched.final_url)
    candidates = _dedupe_candidates(parsed.image_candidates + _social_image_candidates(parsed))
    inspected = [_inspect_image_candidate(fetcher, candidate) for candidate in candidates[:50]]
    known_bytes = sum(item.content_length or 0 for item in inspected)
    unknown_size_count = sum(1 for item in inspected if item.content_length is None)
    modern_count = sum(1 for item in inspected if item.modern_raster_format is True)
    legacy_count = sum(1 for item in inspected if item.modern_raster_format is False)
    svg_count = sum(1 for item in inspected if item.format == "svg")
    oversized_count = sum(1 for item in inspected if item.oversized)
    missing_dimensions_count = sum(1 for image in parsed.images if not _has_dimensions(image))
    lazy_candidates = _lazy_loading_candidates(parsed.images)
    responsive_count = sum(1 for image in parsed.images if image.uses_srcset or image.uses_picture)
    largest = tuple(
        sorted(
            [item for item in inspected if item.content_length is not None],
            key=lambda item: item.content_length or 0,
            reverse=True,
        )[:10]
    )
    return ImagePerformanceResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        discovered_image_count=len(candidates),
        checked_image_count=len(inspected),
        total_known_image_bytes=known_bytes,
        unknown_size_count=unknown_size_count,
        modern_raster_count=modern_count,
        legacy_raster_count=legacy_count,
        svg_count=svg_count,
        oversized_count=oversized_count,
        missing_dimensions_count=missing_dimensions_count,
        lazy_loading_candidate_count=lazy_candidates,
        responsive_markup_count=responsive_count,
        format_summaries=_image_format_summaries(inspected),
        largest_images=largest,
        recommendation=_image_performance_recommendation(
            discovered=len(candidates),
            checked=len(inspected),
            legacy=legacy_count,
            oversized=oversized_count,
            missing_dimensions=missing_dimensions_count,
            lazy_candidates=lazy_candidates,
            responsive_count=responsive_count,
            total_images=len(parsed.images),
        ),
    )


@router.post("/v1/tools/image-seo", response_model=ImageSeoResponse)
def inspect_image_seo(
    payload: ImageToolRequest,
    fetcher: ImageAuditFetcherDependency,
) -> ImageSeoResponse:
    fetched = _fetch_html_or_raise(fetcher, payload.url)
    parsed = _parse_image_html(fetched.body_text, base_url=fetched.final_url)
    images = parsed.images
    missing_alt = sum(1 for image in images if not image.alt_present)
    empty_alt = sum(
        1 for image in images if image.alt_present and not (image.alt_text or "").strip()
    )
    decorative = sum(1 for image in images if _alt_status(image) == "decorative")
    linked_without_alt = sum(
        1 for image in images if image.in_link and not (image.alt_text or "").strip()
    )
    missing_dimensions = sum(1 for image in images if not _has_dimensions(image))
    responsive = sum(1 for image in images if image.uses_srcset or image.uses_picture)
    lazy = sum(1 for image in images if (image.loading or "").lower() == "lazy")
    checks = tuple(
        _image_seo_checks(
            total=len(images),
            missing_alt=missing_alt,
            empty_alt=empty_alt,
            linked_without_alt=linked_without_alt,
            missing_dimensions=missing_dimensions,
            responsive=responsive,
            lazy=lazy,
            has_social=bool(parsed.og_image_url or parsed.twitter_image_url),
        )
    )
    return ImageSeoResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        total_images=len(images),
        missing_alt_count=missing_alt,
        empty_alt_count=empty_alt,
        decorative_count=decorative,
        linked_images_without_alt_count=linked_without_alt,
        missing_dimensions_count=missing_dimensions,
        responsive_image_count=responsive,
        lazy_loading_count=lazy,
        og_image_url=parsed.og_image_url,
        twitter_image_url=parsed.twitter_image_url,
        checks=checks,
        sample_images=tuple(_seo_image_response(image) for image in images[:12]),
        recommendation=_image_seo_recommendation(checks),
    )


@router.post("/v1/tools/favicon", response_model=FaviconResponse)
def inspect_favicon(
    payload: ImageToolRequest,
    fetcher: ImageAuditFetcherDependency,
) -> FaviconResponse:
    fetched = _fetch_html_or_raise(fetcher, payload.url)
    parsed = _parse_image_html(fetched.body_text, base_url=fetched.final_url)
    fallback_url = urljoin(fetched.final_url, "/favicon.ico")
    icons = list(parsed.icons)
    fallback_checked = False
    if not any(icon.url == fallback_url for icon in icons):
        icons.append(
            ParsedIcon(rel="fallback-icon", url=fallback_url, sizes=None, declared_type=None)
        )
        fallback_checked = True
    unique_icons = _dedupe_icons(icons)[:24]
    inspected = tuple(_inspect_icon(fetcher, icon) for icon in unique_icons)
    successful = [icon for icon in inspected if icon.status_code and icon.status_code < 400]
    has_svg = any(icon.format == "svg" for icon in successful)
    has_apple = any(
        "apple-touch-icon" in icon.rel and icon.status_code and icon.status_code < 400
        for icon in inspected
    )
    has_favicon = any(icon.status_code and icon.status_code < 400 for icon in inspected)
    return FaviconResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        discovered_icon_count=len(parsed.icons),
        checked_icon_count=len(inspected),
        has_favicon=has_favicon,
        has_svg_icon=has_svg,
        has_apple_touch_icon=has_apple,
        has_manifest=bool(parsed.manifest_url),
        manifest_url=parsed.manifest_url,
        fallback_ico_checked=fallback_checked,
        icons=inspected,
        recommendation=_favicon_recommendation(
            has_favicon=has_favicon,
            has_svg=has_svg,
            has_apple=has_apple,
            has_manifest=bool(parsed.manifest_url),
        ),
    )


def _fetch_html_or_raise(fetcher: SafeHttpFetcher, url: str):
    try:
        fetched = fetcher.fetch(url, read_body=True)
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
    content_type = (fetched.content_type or "").lower()
    if content_type and "html" not in content_type:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail={"code": "tool_non_html_response", "message": "Target URL did not return HTML."},
        )
    return fetched


def _parse_image_html(html: str, *, base_url: str) -> ImageHTMLParser:
    parser = ImageHTMLParser(base_url=base_url)
    parser.feed(html)
    return parser


def _srcset_urls(value: str | None) -> list[str]:
    if not value:
        return []
    urls: list[str] = []
    for candidate in value.split(","):
        first = candidate.strip().split()
        if first:
            urls.append(first[0])
    return urls


def _absolute_image_url(value: str, base_url: str) -> str:
    absolute = urljoin(base_url, value.strip())
    scheme = urlsplit(absolute).scheme
    return absolute if scheme in {"http", "https"} else value.strip()


def _blank_to_none(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def _is_icon_rel(rel: str) -> bool:
    tokens = set(rel.split())
    return bool(tokens & {"icon", "shortcut", "apple-touch-icon", "mask-icon"}) or "icon" in rel


def _dedupe_candidates(candidates: list[ParsedImage]) -> list[ParsedImage]:
    seen: set[str] = set()
    deduped: list[ParsedImage] = []
    for candidate in candidates:
        if not candidate.url.startswith(("http://", "https://")) or candidate.url in seen:
            continue
        seen.add(candidate.url)
        deduped.append(candidate)
    return deduped


def _dedupe_icons(icons: list[ParsedIcon]) -> list[ParsedIcon]:
    seen: set[tuple[str, str]] = set()
    deduped: list[ParsedIcon] = []
    for icon in icons:
        key = (icon.rel, icon.url)
        if not icon.url.startswith(("http://", "https://")) or key in seen:
            continue
        seen.add(key)
        deduped.append(icon)
    return deduped


def _social_image_candidates(parsed: ImageHTMLParser) -> list[ParsedImage]:
    rows: list[ParsedImage] = []
    for value in (parsed.og_image_url, parsed.twitter_image_url):
        if value:
            rows.append(
                ParsedImage(
                    url=value,
                    source="social-image",
                    alt_present=False,
                    alt_text=None,
                    in_link=False,
                    width=None,
                    height=None,
                    loading=None,
                    decoding=None,
                    fetchpriority=None,
                    uses_srcset=False,
                    uses_picture=False,
                )
            )
    return rows


def _inspect_image_candidate(
    fetcher: SafeHttpFetcher, candidate: ParsedImage
) -> ImagePerformanceItemResponse:
    try:
        fetched = fetcher.fetch(candidate.url, read_body=False)
    except (UrlPolicyError, SafeFetchError):
        return ImagePerformanceItemResponse(
            url=candidate.url,
            source=candidate.source,
            format=_image_format(candidate.url, None),
            status_code=None,
            content_type=None,
            content_length=None,
            width_attr=candidate.width,
            height_attr=candidate.height,
            loading=candidate.loading,
            uses_srcset=candidate.uses_srcset,
            uses_picture=candidate.uses_picture,
            modern_raster_format=None,
            oversized=False,
            recommendations=(
                "Image could not be safely inspected; verify URL accessibility and redirects.",
            ),
        )
    content_length = _content_length(fetched.headers.get("content-length"))
    image_format = _image_format(fetched.final_url, fetched.content_type)
    oversized = bool(
        content_length is not None and content_length > 250_000 and image_format != "svg"
    )
    return ImagePerformanceItemResponse(
        url=fetched.final_url,
        source=candidate.source,
        format=image_format,
        status_code=fetched.status_code,
        content_type=fetched.content_type,
        content_length=content_length,
        width_attr=candidate.width,
        height_attr=candidate.height,
        loading=candidate.loading,
        uses_srcset=candidate.uses_srcset,
        uses_picture=candidate.uses_picture,
        modern_raster_format=_modern_raster_format(image_format),
        oversized=oversized,
        recommendations=tuple(
            _image_resource_recommendations(
                image_format=image_format,
                content_length=content_length,
                has_dimensions=_has_dimensions(candidate),
                responsive=candidate.uses_srcset or candidate.uses_picture,
                loading=candidate.loading,
                source=candidate.source,
            )
        ),
    )


def _inspect_icon(fetcher: SafeHttpFetcher, icon: ParsedIcon) -> FaviconIconResponse:
    try:
        fetched = fetcher.fetch(icon.url, read_body=False)
    except (UrlPolicyError, SafeFetchError):
        return FaviconIconResponse(
            rel=icon.rel,
            url=icon.url,
            sizes=icon.sizes,
            declared_type=icon.declared_type,
            status_code=None,
            content_type=None,
            content_length=None,
            format=_image_format(icon.url, icon.declared_type),
            recommendation=(
                "Icon could not be safely inspected; verify URL, redirects, "
                "and public accessibility."
            ),
        )
    length = _content_length(fetched.headers.get("content-length"))
    icon_format = _image_format(fetched.final_url, fetched.content_type or icon.declared_type)
    return FaviconIconResponse(
        rel=icon.rel,
        url=fetched.final_url,
        sizes=icon.sizes,
        declared_type=icon.declared_type,
        status_code=fetched.status_code,
        content_type=fetched.content_type,
        content_length=length,
        format=icon_format,
        recommendation=_icon_recommendation(icon, icon_format, fetched.status_code),
    )


def _content_length(value: str | None) -> int | None:
    if value is None:
        return None
    try:
        parsed = int(value)
    except ValueError:
        return None
    return parsed if parsed >= 0 else None


def _image_format(url: str, content_type: str | None) -> str:
    normalized = (content_type or "").lower()
    path = urlsplit(url).path.lower()
    mapping = (
        ("avif", ("image/avif",), (".avif",)),
        ("webp", ("image/webp",), (".webp",)),
        ("jpeg", ("image/jpeg",), (".jpg", ".jpeg")),
        ("png", ("image/png",), (".png",)),
        ("svg", ("image/svg+xml", "text/svg"), (".svg",)),
        ("gif", ("image/gif",), (".gif",)),
        ("ico", ("image/x-icon", "image/vnd.microsoft.icon"), (".ico",)),
        ("bmp", ("image/bmp",), (".bmp",)),
    )
    for label, content_types, extensions in mapping:
        if any(value in normalized for value in content_types) or path.endswith(extensions):
            return label
    return "unknown"


def _modern_raster_format(image_format: str) -> bool | None:
    if image_format in {"avif", "webp"}:
        return True
    if image_format in {"jpeg", "png", "gif", "bmp"}:
        return False
    return None


def _has_dimensions(image: ParsedImage) -> bool:
    return bool(image.width and image.height)


def _lazy_loading_candidates(images: list[ParsedImage]) -> int:
    candidates = images[1:] if len(images) > 1 else []
    return sum(1 for image in candidates if (image.loading or "").lower() != "lazy")


def _image_resource_recommendations(
    *,
    image_format: str,
    content_length: int | None,
    has_dimensions: bool,
    responsive: bool,
    loading: str | None,
    source: ImageSource,
) -> list[str]:
    notes: list[str] = []
    if image_format in {"jpeg", "png"} and (content_length is None or content_length >= 80_000):
        notes.append(
            "Serve heavy raster images as AVIF with WebP/JPEG fallback where quality allows."
        )
    if content_length is not None and content_length > 250_000 and image_format != "svg":
        notes.append(
            "Compress this image, resize it to displayed dimensions, and check LCP impact."
        )
    if not has_dimensions and source != "picture-source":
        notes.append("Add width and height attributes to reduce layout shifts.")
    if not responsive and source not in {"picture-source", "social-image"}:
        notes.append("Use srcset/sizes or picture sources for responsive delivery.")
    if source == "img-src" and (loading or "").lower() not in {"lazy", "eager"}:
        notes.append("Set an explicit loading strategy; lazy-load below-the-fold images.")
    return notes


def _image_format_summaries(
    images: list[ImagePerformanceItemResponse],
) -> tuple[ImageFormatSummaryResponse, ...]:
    counts = Counter(item.format for item in images)
    known: Counter[str] = Counter()
    unknown: Counter[str] = Counter()
    for item in images:
        if item.content_length is None:
            unknown[item.format] += 1
        else:
            known[item.format] += item.content_length
    return tuple(
        ImageFormatSummaryResponse(
            format=image_format,
            count=counts[image_format],
            known_bytes=known[image_format],
            unknown_size_count=unknown[image_format],
        )
        for image_format in sorted(counts)
    )


def _alt_status(image: ParsedImage) -> AltStatus:
    if not image.alt_present:
        return "missing"
    text = (image.alt_text or "").strip()
    if text:
        return "present"
    return "empty" if image.in_link else "decorative"


def _seo_image_response(image: ParsedImage) -> ImageSeoItemResponse:
    alt_text = (image.alt_text or "").strip()
    return ImageSeoItemResponse(
        url=image.url,
        alt_status=_alt_status(image),
        alt_text=alt_text[:240] if alt_text else None,
        in_link=image.in_link,
        has_dimensions=_has_dimensions(image),
        loading=image.loading,
        uses_srcset=image.uses_srcset,
        uses_picture=image.uses_picture,
    )


def _image_seo_checks(
    *,
    total: int,
    missing_alt: int,
    empty_alt: int,
    linked_without_alt: int,
    missing_dimensions: int,
    responsive: int,
    lazy: int,
    has_social: bool,
) -> list[ImageSeoCheckResponse]:
    non_decorative_alt_problem = missing_alt + linked_without_alt
    checks = [
        ImageSeoCheckResponse(
            id="alt-text",
            title="Alternative text coverage",
            status="fail" if non_decorative_alt_problem else "warning" if empty_alt else "pass",
            severity="high"
            if linked_without_alt
            else "medium"
            if non_decorative_alt_problem
            else "info",
            value=(
                f"{missing_alt} missing, {empty_alt} empty, "
                f"{linked_without_alt} linked without text"
            ),
            recommendation=(
                "Add meaningful alt text for informative images and for images inside links; "
                "keep decorative images empty intentionally."
            ),
        ),
        ImageSeoCheckResponse(
            id="dimensions",
            title="Explicit image dimensions",
            status="warning" if missing_dimensions else "pass",
            severity="medium" if missing_dimensions else "info",
            value=f"{missing_dimensions} without width/height",
            recommendation=(
                "Add width and height attributes so browsers can reserve layout "
                "space and reduce CLS."
            ),
        ),
        ImageSeoCheckResponse(
            id="responsive-images",
            title="Responsive image markup",
            status="warning" if total > 1 and responsive < total else "pass",
            severity="medium" if total > 1 and responsive < total else "info",
            value=f"{responsive}/{total} use srcset or picture",
            recommendation=(
                "Use srcset, sizes, and picture sources for responsive delivery "
                "and modern formats."
            ),
        ),
        ImageSeoCheckResponse(
            id="lazy-loading",
            title="Lazy-loading strategy",
            status="warning" if total > 2 and lazy == 0 else "pass",
            severity="medium" if total > 2 and lazy == 0 else "info",
            value=f"{lazy}/{total} declare loading=lazy",
            recommendation=(
                "Lazy-load below-the-fold images while keeping the likely LCP "
                "image eager/high priority."
            ),
        ),
        ImageSeoCheckResponse(
            id="social-image",
            title="Social preview image",
            status="pass" if has_social else "warning",
            severity="info" if has_social else "medium",
            value="present" if has_social else "missing",
            recommendation=(
                "Declare og:image and/or twitter:image for stable previews in "
                "search, messengers, and social feeds."
            ),
        ),
    ]
    return checks


def _image_seo_recommendation(checks: tuple[ImageSeoCheckResponse, ...]) -> str:
    failing = [check for check in checks if check.status == "fail"]
    warnings = [check for check in checks if check.status == "warning"]
    if failing:
        return (
            "Image SEO has high-priority issues. Fix linked images without text "
            "and missing alt coverage before scaling content templates."
        )
    if warnings:
        return (
            "Image SEO is usable but incomplete. Improve dimensions, responsive "
            "markup, lazy-loading strategy, and social preview images."
        )
    return (
        "Image SEO signals look controlled for the static HTML scan. "
        "Re-check after template or CMS changes."
    )


def _image_performance_recommendation(
    *,
    discovered: int,
    checked: int,
    legacy: int,
    oversized: int,
    missing_dimensions: int,
    lazy_candidates: int,
    responsive_count: int,
    total_images: int,
) -> str:
    notes: list[str] = []
    if checked < discovered:
        notes.append(
            "Only the first 50 image candidates were inspected; use PageSpeed/browser "
            "waterfall for runtime coverage."
        )
    if legacy:
        notes.append(
            "Replace heavy JPEG/PNG raster images with AVIF plus WebP fallback "
            "where visual quality allows."
        )
    if oversized:
        notes.append(
            "Compress and resize oversized images; large hero/media assets can dominate LCP."
        )
    if missing_dimensions:
        notes.append(
            "Add width/height attributes to reduce layout shifts and improve CLS stability."
        )
    if total_images > 1 and responsive_count < total_images:
        notes.append(
            "Use srcset/sizes or picture with AVIF/WebP sources for responsive "
            "delivery."
        )
    if lazy_candidates:
        notes.append(
            "Lazy-load below-the-fold images and keep only likely LCP media eager/high priority."
        )
    if not notes:
        notes.append(
            "Image performance signals look controlled for static HTML. Confirm runtime "
            "LCP and transfer sizes with PageSpeed."
        )
    return " ".join(notes)


def _icon_recommendation(icon: ParsedIcon, image_format: str, status_code: int) -> str | None:
    if status_code >= 400:
        return "Icon URL is declared but not reachable with a successful HTTP status."
    if "apple-touch-icon" in icon.rel and not icon.sizes:
        return "Declare sizes for apple-touch-icon so clients can choose the correct asset."
    if image_format == "png" and "icon" in icon.rel:
        return "PNG icons are valid; add an SVG icon for crisp scalable browser UI where supported."
    if image_format == "ico":
        return (
            "ICO fallback is useful, but pair it with SVG and Apple touch icons for modern devices."
        )
    return None


def _favicon_recommendation(
    *,
    has_favicon: bool,
    has_svg: bool,
    has_apple: bool,
    has_manifest: bool,
) -> str:
    notes: list[str] = []
    if not has_favicon:
        notes.append(
            "Add a reachable favicon declaration and keep /favicon.ico as a "
            "compatibility fallback."
        )
    if not has_svg:
        notes.append("Add an SVG favicon for crisp scalable browser UI where supported.")
    if not has_apple:
        notes.append("Add apple-touch-icon for iOS home screen and mobile bookmark contexts.")
    if not has_manifest:
        notes.append(
            "Add a web app manifest when installability, app icons, or PWA-like behavior matter."
        )
    if not notes:
        notes.append("Favicon and app icon coverage looks complete for the static HTML scan.")
    return " ".join(notes)
