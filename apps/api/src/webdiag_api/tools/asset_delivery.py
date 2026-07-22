from __future__ import annotations

import re
from collections import Counter, defaultdict
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

ToolStatus = Literal["pass", "warning", "fail"]
FindingSeverity = Literal["info", "medium", "high"]
FetchState = Literal["ok", "rejected", "failed"]
ScriptKind = Literal["classic", "module"]

_MAX_PAGE_BYTES = 1_000_000
_MAX_JS_ASSETS = 24
_MAX_CSS_ASSETS = 16
_MAX_FONT_STYLESHEETS = 12
_MAX_FONT_ASSETS = 24
_MAX_ITEMS = 100
_MAX_FINDINGS = 100
_MAX_CSS_BYTES = 1_000_000
_MANY_JS_ASSETS = 20
_MANY_CSS_ASSETS = 10
_MANY_FONT_ASSETS = 12
_LARGE_JS_DECLARED_BYTES = 1_000_000
_LARGE_CSS_DECODED_BYTES = 300_000
_LARGE_FONT_DECLARED_BYTES = 750_000
_LONG_CACHE_SECONDS = 604_800

_JS_CONTENT_TYPES = (
    "application/javascript",
    "application/ecmascript",
    "text/javascript",
    "text/ecmascript",
)
_CSS_CONTENT_TYPES = ("text/css",)
_FONT_CONTENT_TYPES = (
    "font/woff2",
    "font/woff",
    "application/font-woff",
    "application/vnd.ms-fontobject",
    "font/ttf",
    "font/otf",
    "application/octet-stream",
)
_FONT_EXTENSIONS = (".woff2", ".woff", ".ttf", ".otf", ".eot")


class AssetDeliveryRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2_048)


class AssetFindingResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=240)
    severity: FindingSeverity
    value: str | None = Field(default=None, max_length=500)
    recommendation: str = Field(min_length=1, max_length=700)


class JavaScriptAssetResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    position: int = Field(ge=1)
    raw_src: str = Field(min_length=1, max_length=2_048)
    resolved_url: str = Field(min_length=1, max_length=2_048)
    final_url: str | None = Field(default=None, max_length=2_048)
    hostname: str | None = Field(default=None, max_length=253)
    same_host: bool | None = None
    script_kind: ScriptKind
    async_attribute: bool
    defer_attribute: bool
    parser_blocking_candidate: bool
    fetch_state: FetchState
    status_code: int | None = Field(default=None, ge=100, le=599)
    content_type: str | None = Field(default=None, max_length=300)
    declared_bytes: int | None = Field(default=None, ge=0)
    content_encoding: str | None = Field(default=None, max_length=120)
    cache_control: str | None = Field(default=None, max_length=500)
    max_age_seconds: int | None = Field(default=None, ge=0)
    immutable_cache: bool
    redirect_count: int = Field(ge=0)
    issues: tuple[str, ...]


class JavaScriptBundleSurfaceResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.javascript_bundle_surface.v1"] = (
        "webdiag.tool.javascript_bundle_surface.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    content_type: str | None = Field(default=None, max_length=300)
    scan_mode: Literal["static_html_bounded_headers"] = "static_html_bounded_headers"
    discovered_script_count: int = Field(ge=0)
    unique_script_count: int = Field(ge=0)
    checked_script_count: int = Field(ge=0)
    same_host_script_count: int = Field(ge=0)
    cross_host_script_count: int = Field(ge=0)
    module_script_count: int = Field(ge=0)
    classic_script_count: int = Field(ge=0)
    parser_blocking_candidate_count: int = Field(ge=0)
    duplicate_src_count: int = Field(ge=0)
    known_declared_bytes: int = Field(ge=0)
    unknown_size_count: int = Field(ge=0)
    compressed_response_count: int = Field(ge=0)
    long_cache_count: int = Field(ge=0)
    failed_asset_count: int = Field(ge=0)
    issue_count: int = Field(ge=0)
    assets: tuple[JavaScriptAssetResponse, ...]
    findings: tuple[AssetFindingResponse, ...]
    redirect_count: int = Field(ge=0)
    truncated: bool
    status: ToolStatus
    recommendation: str = Field(min_length=1, max_length=1_000)


class StylesheetAssetResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    position: int = Field(ge=1)
    raw_href: str = Field(min_length=1, max_length=2_048)
    resolved_url: str = Field(min_length=1, max_length=2_048)
    final_url: str | None = Field(default=None, max_length=2_048)
    hostname: str | None = Field(default=None, max_length=253)
    same_host: bool | None = None
    media: str | None = Field(default=None, max_length=500)
    default_media_candidate: bool
    alternate: bool
    disabled: bool
    fetch_state: FetchState
    status_code: int | None = Field(default=None, ge=100, le=599)
    content_type: str | None = Field(default=None, max_length=300)
    declared_bytes: int | None = Field(default=None, ge=0)
    sampled_decoded_bytes: int | None = Field(default=None, ge=0)
    content_encoding: str | None = Field(default=None, max_length=120)
    cache_control: str | None = Field(default=None, max_length=500)
    max_age_seconds: int | None = Field(default=None, ge=0)
    immutable_cache: bool
    import_rule_count: int = Field(ge=0)
    font_face_rule_count: int = Field(ge=0)
    source_map_comment: bool
    redirect_count: int = Field(ge=0)
    issues: tuple[str, ...]


class CssDeliveryAnalyzerResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.css_delivery_analyzer.v1"] = (
        "webdiag.tool.css_delivery_analyzer.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    content_type: str | None = Field(default=None, max_length=300)
    scan_mode: Literal["static_html_bounded_css"] = "static_html_bounded_css"
    stylesheet_link_count: int = Field(ge=0)
    unique_stylesheet_count: int = Field(ge=0)
    checked_stylesheet_count: int = Field(ge=0)
    inline_style_block_count: int = Field(ge=0)
    inline_style_bytes: int = Field(ge=0)
    same_host_stylesheet_count: int = Field(ge=0)
    cross_host_stylesheet_count: int = Field(ge=0)
    default_media_candidate_count: int = Field(ge=0)
    conditional_media_count: int = Field(ge=0)
    alternate_or_disabled_count: int = Field(ge=0)
    duplicate_href_count: int = Field(ge=0)
    known_declared_bytes: int = Field(ge=0)
    sampled_decoded_bytes: int = Field(ge=0)
    compressed_response_count: int = Field(ge=0)
    import_rule_count: int = Field(ge=0)
    font_face_rule_count: int = Field(ge=0)
    failed_stylesheet_count: int = Field(ge=0)
    issue_count: int = Field(ge=0)
    stylesheets: tuple[StylesheetAssetResponse, ...]
    findings: tuple[AssetFindingResponse, ...]
    redirect_count: int = Field(ge=0)
    truncated: bool
    status: ToolStatus
    recommendation: str = Field(min_length=1, max_length=1_000)


class FontFaceResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    position: int = Field(ge=1)
    family: str | None = Field(default=None, max_length=300)
    style: str = Field(min_length=1, max_length=120)
    weight: str = Field(min_length=1, max_length=120)
    display: str | None = Field(default=None, max_length=120)
    source_stylesheet_url: str = Field(min_length=1, max_length=2_048)
    fetchable_source_count: int = Field(ge=0)
    local_source_count: int = Field(ge=0)
    issues: tuple[str, ...]


class FontAssetResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    position: int = Field(ge=1)
    resolved_url: str = Field(min_length=1, max_length=2_048)
    final_url: str | None = Field(default=None, max_length=2_048)
    hostname: str | None = Field(default=None, max_length=253)
    same_host: bool | None = None
    families: tuple[str, ...]
    format_hints: tuple[str, ...]
    preloaded: bool
    fetch_state: FetchState
    status_code: int | None = Field(default=None, ge=100, le=599)
    content_type: str | None = Field(default=None, max_length=300)
    declared_bytes: int | None = Field(default=None, ge=0)
    content_encoding: str | None = Field(default=None, max_length=120)
    cache_control: str | None = Field(default=None, max_length=500)
    max_age_seconds: int | None = Field(default=None, ge=0)
    immutable_cache: bool
    redirect_count: int = Field(ge=0)
    issues: tuple[str, ...]


class FontPreloadResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    position: int = Field(ge=1)
    raw_href: str = Field(min_length=1, max_length=2_048)
    resolved_url: str | None = Field(default=None, max_length=2_048)
    type_value: str | None = Field(default=None, max_length=240)
    crossorigin_present: bool
    matches_discovered_font: bool
    issues: tuple[str, ...]


class FontLoadingAnalyzerResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.font_loading_analyzer.v1"] = (
        "webdiag.tool.font_loading_analyzer.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    content_type: str | None = Field(default=None, max_length=300)
    scan_mode: Literal["static_html_bounded_css"] = "static_html_bounded_css"
    stylesheet_count: int = Field(ge=0)
    checked_stylesheet_count: int = Field(ge=0)
    font_face_count: int = Field(ge=0)
    family_count: int = Field(ge=0)
    font_source_count: int = Field(ge=0)
    unique_font_source_count: int = Field(ge=0)
    checked_font_source_count: int = Field(ge=0)
    local_source_count: int = Field(ge=0)
    preload_count: int = Field(ge=0)
    matched_preload_count: int = Field(ge=0)
    missing_font_display_count: int = Field(ge=0)
    blocking_font_display_count: int = Field(ge=0)
    swap_or_optional_count: int = Field(ge=0)
    cross_host_font_count: int = Field(ge=0)
    woff2_source_count: int = Field(ge=0)
    duplicate_source_count: int = Field(ge=0)
    known_declared_bytes: int = Field(ge=0)
    unknown_size_count: int = Field(ge=0)
    failed_font_count: int = Field(ge=0)
    issue_count: int = Field(ge=0)
    faces: tuple[FontFaceResponse, ...]
    assets: tuple[FontAssetResponse, ...]
    preloads: tuple[FontPreloadResponse, ...]
    findings: tuple[AssetFindingResponse, ...]
    redirect_count: int = Field(ge=0)
    truncated: bool
    status: ToolStatus
    recommendation: str = Field(min_length=1, max_length=1_000)


@dataclass(frozen=True, slots=True)
class _ScriptRef:
    position: int
    raw_src: str
    kind: ScriptKind
    async_attribute: bool
    defer_attribute: bool


@dataclass(frozen=True, slots=True)
class _StylesheetRef:
    position: int
    raw_href: str
    media: str | None
    alternate: bool
    disabled: bool


@dataclass(frozen=True, slots=True)
class _FontPreloadRef:
    position: int
    raw_href: str
    type_value: str | None
    crossorigin_present: bool


@dataclass(frozen=True, slots=True)
class _FontSource:
    url: str
    family: str | None
    format_hint: str | None


class _AssetSurfaceParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.scripts: list[_ScriptRef] = []
        self.stylesheets: list[_StylesheetRef] = []
        self.font_preloads: list[_FontPreloadRef] = []
        self.inline_styles: list[str] = []
        self.base_href: str | None = None
        self._style_chunks: list[str] | None = None

    def handle_starttag(
        self,
        tag: str,
        attrs: list[tuple[str, str | None]],
    ) -> None:
        values = {name.lower(): value for name, value in attrs}
        tag_name = tag.lower()
        if tag_name == "base" and self.base_href is None:
            self.base_href = (values.get("href") or "").strip() or None
            return
        if tag_name == "script":
            raw_src = (values.get("src") or "").strip()
            if raw_src:
                script_type = (values.get("type") or "").strip().lower()
                kind: ScriptKind = "module" if script_type == "module" else "classic"
                self.scripts.append(
                    _ScriptRef(
                        position=len(self.scripts) + 1,
                        raw_src=raw_src,
                        kind=kind,
                        async_attribute="async" in values,
                        defer_attribute="defer" in values,
                    )
                )
            return
        if tag_name == "style":
            self._style_chunks = []
            return
        if tag_name != "link":
            return

        rel_tokens = {
            token.lower()
            for token in (values.get("rel") or "").split()
            if token.strip()
        }
        raw_href = (values.get("href") or "").strip()
        if "stylesheet" in rel_tokens and raw_href:
            media = (values.get("media") or "").strip() or None
            self.stylesheets.append(
                _StylesheetRef(
                    position=len(self.stylesheets) + 1,
                    raw_href=raw_href,
                    media=media,
                    alternate="alternate" in rel_tokens,
                    disabled="disabled" in values,
                )
            )
        as_value = (values.get("as") or "").strip().lower()
        if "preload" in rel_tokens and as_value == "font" and raw_href:
            self.font_preloads.append(
                _FontPreloadRef(
                    position=len(self.font_preloads) + 1,
                    raw_href=raw_href,
                    type_value=(values.get("type") or "").strip() or None,
                    crossorigin_present="crossorigin" in values,
                )
            )

    def handle_data(self, data: str) -> None:
        if self._style_chunks is not None:
            self._style_chunks.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "style" and self._style_chunks is not None:
            self.inline_styles.append("".join(self._style_chunks))
            self._style_chunks = None


def get_asset_delivery_fetcher() -> SafeHttpFetcher:
    return SafeHttpFetcher(
        config=SafeFetchConfig(
            max_body_bytes=max(_MAX_PAGE_BYTES, _MAX_CSS_BYTES),
            max_redirects=5,
        )
    )


AssetDeliveryFetcherDependency = Annotated[
    SafeHttpFetcher,
    Depends(get_asset_delivery_fetcher),
]


def _fetch_page(payload: AssetDeliveryRequest, fetcher: SafeHttpFetcher):
    try:
        return fetcher.fetch(payload.url, read_body=True)
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


def _is_html(content_type: str | None) -> bool:
    if content_type is None:
        return True
    normalized = content_type.lower()
    return "text/html" in normalized or "application/xhtml+xml" in normalized


def _parse_document(html: str) -> _AssetSurfaceParser:
    parser = _AssetSurfaceParser()
    parser.feed(html)
    parser.close()
    return parser


def _document_base_url(document: _AssetSurfaceParser, *, page_url: str) -> str:
    if not document.base_href:
        return page_url
    return _resolve_public_asset(document.base_href, base_url=page_url) or page_url


def _resolve_public_asset(raw_url: str, *, base_url: str) -> str | None:
    resolved = urljoin(base_url, raw_url.strip())
    parts = urlsplit(resolved)
    if parts.scheme.lower() not in {"http", "https"} or not parts.hostname:
        return None
    return parts._replace(fragment="").geturl()


def _hostname(url: str) -> str | None:
    return (urlsplit(url).hostname or "").lower() or None


def _same_host(url: str, page_url: str) -> bool | None:
    asset_host = _hostname(url)
    page_host = _hostname(page_url)
    if not asset_host or not page_host:
        return None
    return asset_host == page_host


def _header_int(headers: dict[str, str], name: str) -> int | None:
    raw = headers.get(name)
    if raw is None:
        return None
    try:
        value = int(raw.strip())
    except ValueError:
        return None
    return value if value >= 0 else None


def _content_encoding(headers: dict[str, str]) -> str | None:
    value = (headers.get("content-encoding") or "").strip().lower()
    return value or None


def _is_compressed(headers: dict[str, str]) -> bool:
    return _content_encoding(headers) not in {None, "identity"}


def _cache_max_age(headers: dict[str, str]) -> int | None:
    cache_control = headers.get("cache-control") or ""
    values: list[int] = []
    for directive in ("s-maxage", "max-age"):
        match = re.search(rf"(?:^|,)\s*{directive}\s*=\s*\"?(\d+)", cache_control, re.I)
        if match:
            values.append(int(match.group(1)))
    return max(values) if values else None


def _immutable_cache(headers: dict[str, str]) -> bool:
    return "immutable" in (headers.get("cache-control") or "").lower()


def _long_cache(headers: dict[str, str]) -> bool:
    max_age = _cache_max_age(headers)
    return bool(
        _immutable_cache(headers)
        or (max_age is not None and max_age >= _LONG_CACHE_SECONDS)
    )


def _content_type_matches(content_type: str | None, expected: tuple[str, ...]) -> bool:
    if content_type is None:
        return False
    normalized = content_type.split(";", 1)[0].strip().lower()
    return normalized in expected


def _add_finding(
    findings: list[AssetFindingResponse],
    *,
    finding_id: str,
    title: str,
    severity: FindingSeverity,
    value: str | None,
    recommendation: str,
) -> None:
    if len(findings) >= _MAX_FINDINGS:
        return
    findings.append(
        AssetFindingResponse(
            id=finding_id,
            title=title,
            severity=severity,
            value=value,
            recommendation=recommendation,
        )
    )


def _non_html_finding() -> AssetFindingResponse:
    return AssetFindingResponse(
        id="non-html-document",
        title="The response is not an HTML document",
        severity="high",
        value=None,
        recommendation=(
            "Run this analyzer against an HTML page. Static asset URLs are not parsed as documents."
        ),
    )


def _fetch_header_asset(
    fetcher: SafeHttpFetcher,
    url: str,
    *,
    accept: str,
):
    try:
        return "ok", fetcher.fetch(url, read_body=False, extra_headers={"accept": accept})
    except UrlPolicyError:
        return "rejected", None
    except SafeFetchError:
        return "failed", None


def _fetch_text_asset(
    fetcher: SafeHttpFetcher,
    url: str,
    *,
    accept: str,
):
    try:
        return "ok", fetcher.fetch(url, read_body=True, extra_headers={"accept": accept})
    except UrlPolicyError:
        return "rejected", None
    except SafeFetchError:
        return "failed", None


@router.post(
    "/v1/tools/javascript-bundle-surface",
    response_model=JavaScriptBundleSurfaceResponse,
)
def inspect_javascript_bundle_surface(
    payload: AssetDeliveryRequest,
    fetcher: AssetDeliveryFetcherDependency,
) -> JavaScriptBundleSurfaceResponse:
    page = _fetch_page(payload, fetcher)
    if not _is_html(page.content_type):
        finding = _non_html_finding()
        return JavaScriptBundleSurfaceResponse(
            requested_url=page.requested_url,
            final_url=page.final_url,
            status_code=page.status_code,
            content_type=page.content_type,
            discovered_script_count=0,
            unique_script_count=0,
            checked_script_count=0,
            same_host_script_count=0,
            cross_host_script_count=0,
            module_script_count=0,
            classic_script_count=0,
            parser_blocking_candidate_count=0,
            duplicate_src_count=0,
            known_declared_bytes=0,
            unknown_size_count=0,
            compressed_response_count=0,
            long_cache_count=0,
            failed_asset_count=0,
            issue_count=1,
            assets=(),
            findings=(finding,),
            redirect_count=len(page.redirect_chain),
            truncated=False,
            status="fail",
            recommendation=finding.recommendation,
        )

    document = _parse_document(page.body_text)
    document_base_url = _document_base_url(document, page_url=page.final_url)
    resolved_refs: list[tuple[_ScriptRef, str]] = []
    invalid_count = 0
    for item in document.scripts:
        resolved = _resolve_public_asset(item.raw_src, base_url=document_base_url)
        if resolved is None:
            invalid_count += 1
            continue
        resolved_refs.append((item, resolved))

    counts = Counter(url for _, url in resolved_refs)
    duplicate_src_count = sum(count - 1 for count in counts.values() if count > 1)
    unique_refs: list[tuple[_ScriptRef, str]] = []
    seen: set[str] = set()
    for item, resolved in resolved_refs:
        if resolved in seen:
            continue
        seen.add(resolved)
        unique_refs.append((item, resolved))

    assets: list[JavaScriptAssetResponse] = []
    for item, resolved in unique_refs[:_MAX_JS_ASSETS]:
        fetch_state, fetched = _fetch_header_asset(
            fetcher,
            resolved,
            accept="application/javascript,text/javascript,*/*;q=0.8",
        )
        issues: list[str] = []
        if fetch_state == "rejected":
            issues.append("asset URL rejected by the public-target policy")
        elif fetch_state == "failed":
            issues.append("asset headers could not be fetched")
        elif fetched is not None:
            if fetched.status_code >= 400:
                issues.append("asset returned an HTTP error status")
            if not _content_type_matches(fetched.content_type, _JS_CONTENT_TYPES):
                issues.append("response content type is not a recognized JavaScript MIME type")
            if not _is_compressed(fetched.headers):
                issues.append("response has no gzip, deflate, or other content-encoding signal")

        parser_blocking = (
            item.kind == "classic" and not item.async_attribute and not item.defer_attribute
        )
        assets.append(
            JavaScriptAssetResponse(
                position=item.position,
                raw_src=item.raw_src,
                resolved_url=resolved,
                final_url=fetched.final_url if fetched else None,
                hostname=_hostname(resolved),
                same_host=_same_host(resolved, page.final_url),
                script_kind=item.kind,
                async_attribute=item.async_attribute,
                defer_attribute=item.defer_attribute,
                parser_blocking_candidate=parser_blocking,
                fetch_state=fetch_state,
                status_code=fetched.status_code if fetched else None,
                content_type=fetched.content_type if fetched else None,
                declared_bytes=(
                    _header_int(fetched.headers, "content-length") if fetched else None
                ),
                content_encoding=_content_encoding(fetched.headers) if fetched else None,
                cache_control=fetched.headers.get("cache-control") if fetched else None,
                max_age_seconds=_cache_max_age(fetched.headers) if fetched else None,
                immutable_cache=_immutable_cache(fetched.headers) if fetched else False,
                redirect_count=len(fetched.redirect_chain) if fetched else 0,
                issues=tuple(issues),
            )
        )

    declared_sizes = [asset.declared_bytes for asset in assets if asset.declared_bytes is not None]
    failed_asset_count = sum(1 for asset in assets if asset.fetch_state != "ok")
    wrong_mime_count = sum(
        1
        for asset in assets
        if asset.fetch_state == "ok"
        and not _content_type_matches(asset.content_type, _JS_CONTENT_TYPES)
    )
    http_error_count = sum(
        1
        for asset in assets
        if asset.fetch_state == "ok"
        and asset.status_code is not None
        and asset.status_code >= 400
    )
    uncompressed_count = sum(
        1
        for asset in assets
        if asset.fetch_state == "ok"
        and asset.content_encoding in {None, "identity"}
    )
    short_cache_count = sum(
        1
        for asset in assets
        if asset.fetch_state == "ok"
        and not (
            asset.immutable_cache
            or (
                asset.max_age_seconds is not None
                and asset.max_age_seconds >= _LONG_CACHE_SECONDS
            )
        )
    )
    findings: list[AssetFindingResponse] = []
    if invalid_count:
        _add_finding(
            findings,
            finding_id="invalid-script-urls",
            title="Script references with unsupported or incomplete URLs were found",
            severity="medium",
            value=str(invalid_count),
            recommendation="Use resolvable public http/https URLs for external script resources.",
        )
    if duplicate_src_count:
        _add_finding(
            findings,
            finding_id="duplicate-script-sources",
            title="Duplicate external script references were found",
            severity="medium",
            value=str(duplicate_src_count),
            recommendation="Verify that the same bundle is not requested more than once.",
        )
    if len(unique_refs) > _MANY_JS_ASSETS:
        _add_finding(
            findings,
            finding_id="many-javascript-assets",
            title="The static document references many JavaScript assets",
            severity="medium",
            value=str(len(unique_refs)),
            recommendation=(
                "Review bundle boundaries and request overhead. The threshold is a heuristic, "
                "not a runtime performance score."
            ),
        )
    parser_blocking_count = sum(
        1
        for item, _ in resolved_refs
        if item.kind == "classic" and not item.async_attribute and not item.defer_attribute
    )
    if parser_blocking_count > 3:
        _add_finding(
            findings,
            finding_id="parser-blocking-script-candidates",
            title="Several classic external scripts are parser-blocking candidates",
            severity="medium",
            value=str(parser_blocking_count),
            recommendation=(
                "Review whether non-critical classic scripts can use defer or a module-based "
                "loading strategy. Runtime behavior is not executed by this scan."
            ),
        )
    known_declared_bytes = sum(declared_sizes)
    if known_declared_bytes > _LARGE_JS_DECLARED_BYTES:
        _add_finding(
            findings,
            finding_id="large-declared-javascript-surface",
            title="Known JavaScript Content-Length values form a large delivery surface",
            severity="medium",
            value=str(known_declared_bytes),
            recommendation=(
                "Review the largest declared responses. Content-Length can represent encoded "
                "transfer size and is not equivalent to parsed or executed JavaScript cost."
            ),
        )
    if failed_asset_count:
        _add_finding(
            findings,
            finding_id="javascript-asset-fetch-failures",
            title="Some JavaScript asset headers could not be inspected",
            severity="medium",
            value=str(failed_asset_count),
            recommendation="Review rejected, unreachable, redirected, or oversized asset URLs.",
        )
    if wrong_mime_count:
        _add_finding(
            findings,
            finding_id="javascript-mime-mismatch",
            title="Some JavaScript responses use an unexpected content type",
            severity="medium",
            value=str(wrong_mime_count),
            recommendation="Serve JavaScript with an appropriate JavaScript MIME type.",
        )
    if http_error_count:
        _add_finding(
            findings,
            finding_id="javascript-http-errors",
            title="Some JavaScript responses returned HTTP error status codes",
            severity="high",
            value=str(http_error_count),
            recommendation="Correct or remove script references that return HTTP errors.",
        )
    if uncompressed_count:
        _add_finding(
            findings,
            finding_id="javascript-without-content-encoding",
            title="Some JavaScript responses have no content-encoding signal",
            severity="info",
            value=str(uncompressed_count),
            recommendation=(
                "Review transfer compression for text JavaScript responses. Small files or "
                "intermediary behavior can make compression unnecessary in some deployments."
            ),
        )
    if short_cache_count:
        _add_finding(
            findings,
            finding_id="javascript-without-long-cache",
            title="Some JavaScript responses have no long-lived cache signal",
            severity="info",
            value=str(short_cache_count),
            recommendation=(
                "Review cache policy for versioned immutable bundles. Do not apply long caching "
                "to unversioned assets without a cache-busting strategy."
            ),
        )

    truncated = len(unique_refs) > _MAX_JS_ASSETS or len(findings) >= _MAX_FINDINGS
    recommendation = (
        "Review the bounded JavaScript delivery inventory, especially failed responses, "
        "duplicate references, parser-blocking candidates, compression, and cache headers. "
        "This static scan does not execute bundles or measure main-thread cost."
        if findings
        else "No material issue was found in the bounded static JavaScript delivery surface."
    )
    return JavaScriptBundleSurfaceResponse(
        requested_url=page.requested_url,
        final_url=page.final_url,
        status_code=page.status_code,
        content_type=page.content_type,
        discovered_script_count=len(resolved_refs) + invalid_count,
        unique_script_count=len(unique_refs),
        checked_script_count=len(assets),
        same_host_script_count=sum(
            1 for _, url in unique_refs if _same_host(url, page.final_url) is True
        ),
        cross_host_script_count=sum(
            1 for _, url in unique_refs if _same_host(url, page.final_url) is False
        ),
        module_script_count=sum(1 for item, _ in resolved_refs if item.kind == "module"),
        classic_script_count=sum(1 for item, _ in resolved_refs if item.kind == "classic"),
        parser_blocking_candidate_count=parser_blocking_count,
        duplicate_src_count=duplicate_src_count,
        known_declared_bytes=known_declared_bytes,
        unknown_size_count=sum(1 for asset in assets if asset.declared_bytes is None),
        compressed_response_count=sum(
            1
            for asset in assets
            if asset.content_encoding not in {None, "identity"}
        ),
        long_cache_count=sum(
            1
            for asset in assets
            if asset.fetch_state == "ok"
            and (
                asset.immutable_cache
                or (
                    asset.max_age_seconds is not None
                    and asset.max_age_seconds >= _LONG_CACHE_SECONDS
                )
            )
        ),
        failed_asset_count=failed_asset_count,
        issue_count=sum(len(asset.issues) for asset in assets) + len(findings),
        assets=tuple(assets),
        findings=tuple(findings),
        redirect_count=len(page.redirect_chain),
        truncated=truncated,
        status="warning" if findings else "pass",
        recommendation=recommendation,
    )


def _css_import_count(css_text: str) -> int:
    return len(re.findall(r"@import\b", _strip_css_comments(css_text), flags=re.I))


def _css_font_face_count(css_text: str) -> int:
    return len(re.findall(r"@font-face\b", _strip_css_comments(css_text), flags=re.I))


def _has_source_map_comment(css_text: str) -> bool:
    return bool(re.search(r"sourceMappingURL\s*=", css_text, flags=re.I))


@router.post("/v1/tools/css-delivery", response_model=CssDeliveryAnalyzerResponse)
def inspect_css_delivery(
    payload: AssetDeliveryRequest,
    fetcher: AssetDeliveryFetcherDependency,
) -> CssDeliveryAnalyzerResponse:
    page = _fetch_page(payload, fetcher)
    if not _is_html(page.content_type):
        finding = _non_html_finding()
        return CssDeliveryAnalyzerResponse(
            requested_url=page.requested_url,
            final_url=page.final_url,
            status_code=page.status_code,
            content_type=page.content_type,
            stylesheet_link_count=0,
            unique_stylesheet_count=0,
            checked_stylesheet_count=0,
            inline_style_block_count=0,
            inline_style_bytes=0,
            same_host_stylesheet_count=0,
            cross_host_stylesheet_count=0,
            default_media_candidate_count=0,
            conditional_media_count=0,
            alternate_or_disabled_count=0,
            duplicate_href_count=0,
            known_declared_bytes=0,
            sampled_decoded_bytes=0,
            compressed_response_count=0,
            import_rule_count=0,
            font_face_rule_count=0,
            failed_stylesheet_count=0,
            issue_count=1,
            stylesheets=(),
            findings=(finding,),
            redirect_count=len(page.redirect_chain),
            truncated=False,
            status="fail",
            recommendation=finding.recommendation,
        )

    document = _parse_document(page.body_text)
    document_base_url = _document_base_url(document, page_url=page.final_url)
    resolved_refs: list[tuple[_StylesheetRef, str]] = []
    invalid_count = 0
    for item in document.stylesheets:
        resolved = _resolve_public_asset(item.raw_href, base_url=document_base_url)
        if resolved is None:
            invalid_count += 1
            continue
        resolved_refs.append((item, resolved))

    counts = Counter(url for _, url in resolved_refs)
    duplicate_href_count = sum(count - 1 for count in counts.values() if count > 1)
    unique_refs: list[tuple[_StylesheetRef, str]] = []
    seen: set[str] = set()
    for item, resolved in resolved_refs:
        if resolved in seen:
            continue
        seen.add(resolved)
        unique_refs.append((item, resolved))

    stylesheets: list[StylesheetAssetResponse] = []
    for item, resolved in unique_refs[:_MAX_CSS_ASSETS]:
        fetch_state, fetched = _fetch_text_asset(fetcher, resolved, accept="text/css,*/*;q=0.5")
        issues: list[str] = []
        css_text = fetched.body_text if fetched else ""
        if fetch_state == "rejected":
            issues.append("stylesheet URL rejected by the public-target policy")
        elif fetch_state == "failed":
            issues.append("stylesheet body could not be fetched within the bounded limit")
        elif fetched is not None:
            if fetched.status_code >= 400:
                issues.append("stylesheet returned an HTTP error status")
            if not _content_type_matches(fetched.content_type, _CSS_CONTENT_TYPES):
                issues.append("response content type is not text/css")
            if not _is_compressed(fetched.headers):
                issues.append("response has no gzip, deflate, or other content-encoding signal")
            if _css_import_count(css_text):
                issues.append("stylesheet contains @import rules")

        media_normalized = (item.media or "").strip().lower()
        default_media = media_normalized in {"", "all"} and not item.alternate and not item.disabled
        stylesheets.append(
            StylesheetAssetResponse(
                position=item.position,
                raw_href=item.raw_href,
                resolved_url=resolved,
                final_url=fetched.final_url if fetched else None,
                hostname=_hostname(resolved),
                same_host=_same_host(resolved, page.final_url),
                media=item.media,
                default_media_candidate=default_media,
                alternate=item.alternate,
                disabled=item.disabled,
                fetch_state=fetch_state,
                status_code=fetched.status_code if fetched else None,
                content_type=fetched.content_type if fetched else None,
                declared_bytes=(
                    _header_int(fetched.headers, "content-length") if fetched else None
                ),
                sampled_decoded_bytes=(
                    len(css_text.encode("utf-8")) if fetched is not None else None
                ),
                content_encoding=_content_encoding(fetched.headers) if fetched else None,
                cache_control=fetched.headers.get("cache-control") if fetched else None,
                max_age_seconds=_cache_max_age(fetched.headers) if fetched else None,
                immutable_cache=_immutable_cache(fetched.headers) if fetched else False,
                import_rule_count=_css_import_count(css_text),
                font_face_rule_count=_css_font_face_count(css_text),
                source_map_comment=_has_source_map_comment(css_text),
                redirect_count=len(fetched.redirect_chain) if fetched else 0,
                issues=tuple(issues),
            )
        )

    inline_style_bytes = sum(len(value.encode("utf-8")) for value in document.inline_styles)
    inline_import_count = sum(_css_import_count(value) for value in document.inline_styles)
    inline_font_face_count = sum(_css_font_face_count(value) for value in document.inline_styles)
    known_declared_bytes = sum(
        asset.declared_bytes or 0 for asset in stylesheets if asset.declared_bytes is not None
    )
    sampled_decoded_bytes = sum(asset.sampled_decoded_bytes or 0 for asset in stylesheets)
    failed_stylesheet_count = sum(1 for asset in stylesheets if asset.fetch_state != "ok")
    wrong_mime_count = sum(
        1
        for asset in stylesheets
        if asset.fetch_state == "ok"
        and not _content_type_matches(asset.content_type, _CSS_CONTENT_TYPES)
    )
    http_error_count = sum(
        1
        for asset in stylesheets
        if asset.fetch_state == "ok"
        and asset.status_code is not None
        and asset.status_code >= 400
    )
    uncompressed_count = sum(
        1
        for asset in stylesheets
        if asset.fetch_state == "ok"
        and asset.content_encoding in {None, "identity"}
    )
    short_cache_count = sum(
        1
        for asset in stylesheets
        if asset.fetch_state == "ok"
        and not (
            asset.immutable_cache
            or (
                asset.max_age_seconds is not None
                and asset.max_age_seconds >= _LONG_CACHE_SECONDS
            )
        )
    )
    import_rule_count = inline_import_count + sum(
        asset.import_rule_count for asset in stylesheets
    )
    font_face_rule_count = inline_font_face_count + sum(
        asset.font_face_rule_count for asset in stylesheets
    )

    findings: list[AssetFindingResponse] = []
    if invalid_count:
        _add_finding(
            findings,
            finding_id="invalid-stylesheet-urls",
            title="Stylesheet references with unsupported or incomplete URLs were found",
            severity="medium",
            value=str(invalid_count),
            recommendation="Use resolvable public http/https URLs for external stylesheets.",
        )
    if duplicate_href_count:
        _add_finding(
            findings,
            finding_id="duplicate-stylesheets",
            title="Duplicate stylesheet references were found",
            severity="medium",
            value=str(duplicate_href_count),
            recommendation="Verify that the same stylesheet is not requested more than once.",
        )
    if len(unique_refs) > _MANY_CSS_ASSETS:
        _add_finding(
            findings,
            finding_id="many-stylesheets",
            title="The static document references many external stylesheets",
            severity="medium",
            value=str(len(unique_refs)),
            recommendation=(
                "Review stylesheet boundaries and request overhead. The threshold is a heuristic, "
                "not a browser waterfall conclusion."
            ),
        )
    if import_rule_count:
        _add_finding(
            findings,
            finding_id="css-import-rules",
            title="CSS @import rules were found",
            severity="medium",
            value=str(import_rule_count),
            recommendation=(
                "Review whether imported stylesheets can be linked or bundled explicitly to avoid "
                "additional discovery chains."
            ),
        )
    if sampled_decoded_bytes + inline_style_bytes > _LARGE_CSS_DECODED_BYTES:
        _add_finding(
            findings,
            finding_id="large-sampled-css-surface",
            title="The sampled decoded CSS surface is large",
            severity="medium",
            value=str(sampled_decoded_bytes + inline_style_bytes),
            recommendation=(
                "Review stylesheet composition and route-level delivery. This scan does not prove "
                "unused CSS or browser render cost."
            ),
        )
    if failed_stylesheet_count:
        _add_finding(
            findings,
            finding_id="stylesheet-fetch-failures",
            title="Some stylesheet bodies could not be inspected",
            severity="medium",
            value=str(failed_stylesheet_count),
            recommendation="Review rejected, unreachable, redirected, or oversized stylesheets.",
        )
    if wrong_mime_count:
        _add_finding(
            findings,
            finding_id="stylesheet-mime-mismatch",
            title="Some stylesheet responses do not use text/css",
            severity="medium",
            value=str(wrong_mime_count),
            recommendation="Serve stylesheets with the text/css content type.",
        )
    if http_error_count:
        _add_finding(
            findings,
            finding_id="stylesheet-http-errors",
            title="Some stylesheet responses returned HTTP error status codes",
            severity="high",
            value=str(http_error_count),
            recommendation="Correct or remove stylesheet references that return HTTP errors.",
        )
    if uncompressed_count:
        _add_finding(
            findings,
            finding_id="stylesheets-without-content-encoding",
            title="Some stylesheet responses have no content-encoding signal",
            severity="info",
            value=str(uncompressed_count),
            recommendation=(
                "Review transfer compression for text CSS responses. Small files or intermediary "
                "behavior can make compression unnecessary in some deployments."
            ),
        )
    if short_cache_count:
        _add_finding(
            findings,
            finding_id="stylesheets-without-long-cache",
            title="Some stylesheet responses have no long-lived cache signal",
            severity="info",
            value=str(short_cache_count),
            recommendation=(
                "Review cache policy for versioned immutable stylesheets. Preserve a safe "
                "revalidation strategy for unversioned files."
            ),
        )

    truncated = len(unique_refs) > _MAX_CSS_ASSETS or len(findings) >= _MAX_FINDINGS
    recommendation = (
        "Review the bounded CSS delivery inventory, especially fetch failures, duplicate links, "
        "@import chains, decoded sample size, compression, and cache headers. Runtime style "
        "coverage and rendering are outside this static scan."
        if findings
        else "No material issue was found in the bounded static CSS delivery surface."
    )
    return CssDeliveryAnalyzerResponse(
        requested_url=page.requested_url,
        final_url=page.final_url,
        status_code=page.status_code,
        content_type=page.content_type,
        stylesheet_link_count=len(resolved_refs) + invalid_count,
        unique_stylesheet_count=len(unique_refs),
        checked_stylesheet_count=len(stylesheets),
        inline_style_block_count=len(document.inline_styles),
        inline_style_bytes=inline_style_bytes,
        same_host_stylesheet_count=sum(
            1 for _, url in unique_refs if _same_host(url, page.final_url) is True
        ),
        cross_host_stylesheet_count=sum(
            1 for _, url in unique_refs if _same_host(url, page.final_url) is False
        ),
        default_media_candidate_count=sum(
            1
            for item, _ in unique_refs
            if (item.media or "").strip().lower() in {"", "all"}
            and not item.alternate
            and not item.disabled
        ),
        conditional_media_count=sum(
            1
            for item, _ in unique_refs
            if (item.media or "").strip().lower() not in {"", "all"}
        ),
        alternate_or_disabled_count=sum(
            1 for item, _ in unique_refs if item.alternate or item.disabled
        ),
        duplicate_href_count=duplicate_href_count,
        known_declared_bytes=known_declared_bytes,
        sampled_decoded_bytes=sampled_decoded_bytes,
        compressed_response_count=sum(
            1
            for asset in stylesheets
            if asset.content_encoding not in {None, "identity"}
        ),
        import_rule_count=import_rule_count,
        font_face_rule_count=font_face_rule_count,
        failed_stylesheet_count=failed_stylesheet_count,
        issue_count=sum(len(asset.issues) for asset in stylesheets) + len(findings),
        stylesheets=tuple(stylesheets),
        findings=tuple(findings),
        redirect_count=len(page.redirect_chain),
        truncated=truncated,
        status="warning" if findings else "pass",
        recommendation=recommendation,
    )


def _strip_css_comments(css_text: str) -> str:
    return re.sub(r"/\*.*?\*/", "", css_text, flags=re.S)


def _css_properties(block: str) -> dict[str, str]:
    properties: dict[str, str] = {}
    for match in re.finditer(r"([a-zA-Z-]+)\s*:\s*([^;{}]+)", block):
        properties[match.group(1).lower()] = match.group(2).strip()
    return properties


def _split_css_source_list(value: str) -> list[str]:
    items: list[str] = []
    current: list[str] = []
    depth = 0
    quote: str | None = None
    for character in value:
        if quote:
            current.append(character)
            if character == quote:
                quote = None
            continue
        if character in {"'", '"'}:
            quote = character
            current.append(character)
            continue
        if character == "(":
            depth += 1
        elif character == ")" and depth:
            depth -= 1
        if character == "," and depth == 0:
            items.append("".join(current).strip())
            current = []
            continue
        current.append(character)
    if current:
        items.append("".join(current).strip())
    return [item for item in items if item]


def _parse_font_faces(
    css_text: str,
    *,
    base_url: str,
    source_stylesheet_url: str,
    start_position: int,
) -> tuple[list[FontFaceResponse], list[_FontSource], int]:
    cleaned = _strip_css_comments(css_text)
    faces: list[FontFaceResponse] = []
    sources: list[_FontSource] = []
    local_source_count = 0
    for offset, match in enumerate(
        re.finditer(r"@font-face\s*\{(.*?)\}", cleaned, flags=re.I | re.S),
        start=0,
    ):
        properties = _css_properties(match.group(1))
        family_value = properties.get("font-family")
        family = family_value.strip(" '\"") if family_value else None
        display = properties.get("font-display")
        source_value = properties.get("src", "")
        face_sources: list[_FontSource] = []
        for source_part in _split_css_source_list(source_value):
            local_source_count += len(re.findall(r"\blocal\s*\(", source_part, flags=re.I))
            url_match = re.search(
                r"url\(\s*(['\"]?)(.*?)\1\s*\)",
                source_part,
                flags=re.I | re.S,
            )
            if not url_match:
                continue
            raw_url = url_match.group(2).strip()
            resolved = _resolve_public_asset(raw_url, base_url=base_url)
            if resolved is None:
                continue
            format_match = re.search(
                r"format\(\s*(['\"]?)(.*?)\1\s*\)",
                source_part,
                flags=re.I | re.S,
            )
            format_hint = format_match.group(2).strip().lower() if format_match else None
            source = _FontSource(url=resolved, family=family, format_hint=format_hint)
            face_sources.append(source)
            sources.append(source)

        issues: list[str] = []
        if not family:
            issues.append("font-family is missing")
        if not display:
            issues.append("font-display is missing")
        elif display.strip().lower() == "block":
            issues.append("font-display:block can extend invisible-text behavior")
        if not face_sources:
            issues.append("no fetchable public font URL was found in src")
        faces.append(
            FontFaceResponse(
                position=start_position + offset,
                family=family,
                style=properties.get("font-style", "normal"),
                weight=properties.get("font-weight", "normal"),
                display=display,
                source_stylesheet_url=source_stylesheet_url,
                fetchable_source_count=len(face_sources),
                local_source_count=len(re.findall(r"\blocal\s*\(", source_value, flags=re.I)),
                issues=tuple(issues),
            )
        )
    return faces, sources, local_source_count


def _font_format_from_url(url: str) -> str | None:
    path = urlsplit(url).path.lower()
    for extension in _FONT_EXTENSIONS:
        if path.endswith(extension):
            return extension.removeprefix(".")
    return None


def _font_content_type_valid(content_type: str | None, url: str) -> bool:
    if _content_type_matches(content_type, _FONT_CONTENT_TYPES):
        return True
    return _font_format_from_url(url) is not None and content_type is None


@router.post("/v1/tools/font-loading", response_model=FontLoadingAnalyzerResponse)
def inspect_font_loading(
    payload: AssetDeliveryRequest,
    fetcher: AssetDeliveryFetcherDependency,
) -> FontLoadingAnalyzerResponse:
    page = _fetch_page(payload, fetcher)
    if not _is_html(page.content_type):
        finding = _non_html_finding()
        return FontLoadingAnalyzerResponse(
            requested_url=page.requested_url,
            final_url=page.final_url,
            status_code=page.status_code,
            content_type=page.content_type,
            stylesheet_count=0,
            checked_stylesheet_count=0,
            font_face_count=0,
            family_count=0,
            font_source_count=0,
            unique_font_source_count=0,
            checked_font_source_count=0,
            local_source_count=0,
            preload_count=0,
            matched_preload_count=0,
            missing_font_display_count=0,
            blocking_font_display_count=0,
            swap_or_optional_count=0,
            cross_host_font_count=0,
            woff2_source_count=0,
            duplicate_source_count=0,
            known_declared_bytes=0,
            unknown_size_count=0,
            failed_font_count=0,
            issue_count=1,
            faces=(),
            assets=(),
            preloads=(),
            findings=(finding,),
            redirect_count=len(page.redirect_chain),
            truncated=False,
            status="fail",
            recommendation=finding.recommendation,
        )

    document = _parse_document(page.body_text)
    document_base_url = _document_base_url(document, page_url=page.final_url)
    all_faces: list[FontFaceResponse] = []
    all_sources: list[_FontSource] = []
    local_source_count = 0
    face_position = 1
    for inline_index, css_text in enumerate(document.inline_styles, start=1):
        faces, sources, local_count = _parse_font_faces(
            css_text,
            base_url=document_base_url,
            source_stylesheet_url=f"{page.final_url}#inline-style-{inline_index}",
            start_position=face_position,
        )
        all_faces.extend(faces)
        all_sources.extend(sources)
        local_source_count += local_count
        face_position += len(faces)

    resolved_stylesheets: list[str] = []
    seen_stylesheets: set[str] = set()
    for item in document.stylesheets:
        resolved = _resolve_public_asset(item.raw_href, base_url=document_base_url)
        if resolved is None or resolved in seen_stylesheets:
            continue
        seen_stylesheets.add(resolved)
        resolved_stylesheets.append(resolved)

    stylesheet_failures = 0
    checked_stylesheets = 0
    for stylesheet_url in resolved_stylesheets[:_MAX_FONT_STYLESHEETS]:
        fetch_state, fetched = _fetch_text_asset(
            fetcher,
            stylesheet_url,
            accept="text/css,*/*;q=0.5",
        )
        if fetch_state != "ok" or fetched is None:
            stylesheet_failures += 1
            continue
        checked_stylesheets += 1
        if not _content_type_matches(fetched.content_type, _CSS_CONTENT_TYPES):
            stylesheet_failures += 1
            continue
        faces, sources, local_count = _parse_font_faces(
            fetched.body_text,
            base_url=fetched.final_url,
            source_stylesheet_url=fetched.final_url,
            start_position=face_position,
        )
        all_faces.extend(faces)
        all_sources.extend(sources)
        local_source_count += local_count
        face_position += len(faces)

    source_counts = Counter(source.url for source in all_sources)
    duplicate_source_count = sum(count - 1 for count in source_counts.values() if count > 1)
    source_metadata: dict[str, dict[str, set[str]]] = defaultdict(
        lambda: {"families": set(), "formats": set()}
    )
    unique_source_urls: list[str] = []
    seen_source_urls: set[str] = set()
    for source in all_sources:
        if source.family:
            source_metadata[source.url]["families"].add(source.family)
        format_hint = source.format_hint or _font_format_from_url(source.url)
        if format_hint:
            source_metadata[source.url]["formats"].add(format_hint)
        if source.url not in seen_source_urls:
            seen_source_urls.add(source.url)
            unique_source_urls.append(source.url)

    preload_urls: set[str] = set()
    preload_items: list[FontPreloadResponse] = []
    for item in document.font_preloads[:_MAX_ITEMS]:
        resolved = _resolve_public_asset(item.raw_href, base_url=document_base_url)
        issues: list[str] = []
        if resolved is None:
            issues.append("preload URL is not a public http/https URL")
        else:
            preload_urls.add(resolved)
            if _same_host(resolved, page.final_url) is False and not item.crossorigin_present:
                issues.append("cross-host font preload has no crossorigin attribute")
        matches = bool(resolved and resolved in seen_source_urls)
        if resolved and not matches:
            issues.append("preload does not match a discovered @font-face URL")
        preload_items.append(
            FontPreloadResponse(
                position=item.position,
                raw_href=item.raw_href,
                resolved_url=resolved,
                type_value=item.type_value,
                crossorigin_present=item.crossorigin_present,
                matches_discovered_font=matches,
                issues=tuple(issues),
            )
        )

    assets: list[FontAssetResponse] = []
    for position, source_url in enumerate(unique_source_urls[:_MAX_FONT_ASSETS], start=1):
        fetch_state, fetched = _fetch_header_asset(
            fetcher,
            source_url,
            accept="font/woff2,font/woff,*/*;q=0.5",
        )
        issues: list[str] = []
        if fetch_state == "rejected":
            issues.append("font URL rejected by the public-target policy")
        elif fetch_state == "failed":
            issues.append("font headers could not be fetched")
        elif fetched is not None:
            if fetched.status_code >= 400:
                issues.append("font returned an HTTP error status")
            if not _font_content_type_valid(fetched.content_type, source_url):
                issues.append("response content type is not recognized as a web font")
            if not _long_cache(fetched.headers):
                issues.append("font response has no long-lived cache signal")

        assets.append(
            FontAssetResponse(
                position=position,
                resolved_url=source_url,
                final_url=fetched.final_url if fetched else None,
                hostname=_hostname(source_url),
                same_host=_same_host(source_url, page.final_url),
                families=tuple(sorted(source_metadata[source_url]["families"])),
                format_hints=tuple(sorted(source_metadata[source_url]["formats"])),
                preloaded=source_url in preload_urls,
                fetch_state=fetch_state,
                status_code=fetched.status_code if fetched else None,
                content_type=fetched.content_type if fetched else None,
                declared_bytes=(
                    _header_int(fetched.headers, "content-length") if fetched else None
                ),
                content_encoding=_content_encoding(fetched.headers) if fetched else None,
                cache_control=fetched.headers.get("cache-control") if fetched else None,
                max_age_seconds=_cache_max_age(fetched.headers) if fetched else None,
                immutable_cache=_immutable_cache(fetched.headers) if fetched else False,
                redirect_count=len(fetched.redirect_chain) if fetched else 0,
                issues=tuple(issues),
            )
        )

    missing_display_count = sum(1 for face in all_faces if face.display is None)
    blocking_display_count = sum(
        1 for face in all_faces if (face.display or "").strip().lower() == "block"
    )
    swap_or_optional_count = sum(
        1
        for face in all_faces
        if (face.display or "").strip().lower() in {"swap", "optional"}
    )
    known_declared_bytes = sum(
        asset.declared_bytes or 0 for asset in assets if asset.declared_bytes is not None
    )
    failed_font_count = sum(1 for asset in assets if asset.fetch_state != "ok")
    font_http_error_count = sum(
        1
        for asset in assets
        if asset.fetch_state == "ok"
        and asset.status_code is not None
        and asset.status_code >= 400
    )
    font_mime_mismatch_count = sum(
        1
        for asset in assets
        if asset.fetch_state == "ok"
        and not _font_content_type_valid(asset.content_type, asset.resolved_url)
    )
    short_font_cache_count = sum(
        1
        for asset in assets
        if asset.fetch_state == "ok"
        and not (
            asset.immutable_cache
            or (
                asset.max_age_seconds is not None
                and asset.max_age_seconds >= _LONG_CACHE_SECONDS
            )
        )
    )
    family_names = {face.family for face in all_faces if face.family}
    woff2_source_count = sum(
        1
        for url in unique_source_urls
        if (
            "woff2" in source_metadata[url]["formats"]
            or urlsplit(url).path.lower().endswith(".woff2")
        )
    )

    findings: list[AssetFindingResponse] = []
    if stylesheet_failures:
        _add_finding(
            findings,
            finding_id="font-stylesheet-fetch-failures",
            title="Some stylesheets could not be inspected for @font-face rules",
            severity="medium",
            value=str(stylesheet_failures),
            recommendation="Review rejected, unreachable, oversized, or non-CSS stylesheet URLs.",
        )
    if missing_display_count:
        _add_finding(
            findings,
            finding_id="missing-font-display",
            title="@font-face rules without font-display were found",
            severity="medium",
            value=str(missing_display_count),
            recommendation=(
                "Choose an explicit font-display strategy based on product requirements. This scan "
                "does not prescribe one value for every font."
            ),
        )
    if blocking_display_count:
        _add_finding(
            findings,
            finding_id="blocking-font-display",
            title="font-display:block declarations were found",
            severity="medium",
            value=str(blocking_display_count),
            recommendation="Review whether invisible-text behavior is acceptable for these faces.",
        )
    if len(unique_source_urls) > _MANY_FONT_ASSETS:
        _add_finding(
            findings,
            finding_id="many-font-assets",
            title="Many distinct font asset URLs were discovered",
            severity="medium",
            value=str(len(unique_source_urls)),
            recommendation=(
                "Review families, weights, styles, subsets, and variable-font opportunities. The "
                "threshold is a heuristic rather than a runtime score."
            ),
        )
    if duplicate_source_count:
        _add_finding(
            findings,
            finding_id="duplicate-font-sources",
            title="Duplicate font source URLs were found across @font-face rules",
            severity="info",
            value=str(duplicate_source_count),
            recommendation="Review whether repeated sources are intentional fallback declarations.",
        )
    unmatched_preloads = sum(1 for item in preload_items if not item.matches_discovered_font)
    if unmatched_preloads:
        _add_finding(
            findings,
            finding_id="unmatched-font-preloads",
            title="Font preloads without a matching discovered @font-face URL were found",
            severity="medium",
            value=str(unmatched_preloads),
            recommendation="Align preload URLs with the actual font source selected by static CSS.",
        )
    preload_crossorigin_issues = sum(
        1
        for item in preload_items
        if "cross-host font preload has no crossorigin attribute" in item.issues
    )
    if preload_crossorigin_issues:
        _add_finding(
            findings,
            finding_id="font-preload-crossorigin",
            title="Cross-host font preloads without crossorigin were found",
            severity="medium",
            value=str(preload_crossorigin_issues),
            recommendation="Review CORS mode and add the appropriate crossorigin attribute.",
        )
    if known_declared_bytes > _LARGE_FONT_DECLARED_BYTES:
        _add_finding(
            findings,
            finding_id="large-declared-font-surface",
            title="Known font Content-Length values form a large delivery surface",
            severity="medium",
            value=str(known_declared_bytes),
            recommendation=(
                "Review font subsets, weights, styles, and formats. Content-Length is not "
                "a browser rendering or text-visibility metric."
            ),
        )
    if failed_font_count:
        _add_finding(
            findings,
            finding_id="font-asset-fetch-failures",
            title="Some font asset headers could not be inspected",
            severity="medium",
            value=str(failed_font_count),
            recommendation="Review rejected, unreachable, or redirected font URLs.",
        )
    if font_http_error_count:
        _add_finding(
            findings,
            finding_id="font-http-errors",
            title="Some font responses returned HTTP error status codes",
            severity="high",
            value=str(font_http_error_count),
            recommendation="Correct or remove font source URLs that return HTTP errors.",
        )
    if font_mime_mismatch_count:
        _add_finding(
            findings,
            finding_id="font-mime-mismatch",
            title="Some font responses use an unexpected content type",
            severity="medium",
            value=str(font_mime_mismatch_count),
            recommendation="Serve web fonts with an appropriate font MIME type.",
        )
    if short_font_cache_count:
        _add_finding(
            findings,
            finding_id="fonts-without-long-cache",
            title="Some font responses have no long-lived cache signal",
            severity="info",
            value=str(short_font_cache_count),
            recommendation=(
                "Review cache policy for versioned font assets. Font files are commonly stable, "
                "but long caching still requires a safe versioning strategy."
            ),
        )

    truncated = any(
        (
            len(resolved_stylesheets) > _MAX_FONT_STYLESHEETS,
            len(unique_source_urls) > _MAX_FONT_ASSETS,
            len(all_faces) > _MAX_ITEMS,
            len(document.font_preloads) > _MAX_ITEMS,
            len(findings) >= _MAX_FINDINGS,
        )
    )
    recommendation = (
        "Review the bounded static font-loading inventory, especially font-display, stylesheet "
        "fetch failures, preload correlation, response cache headers, formats, and declared bytes. "
        "Actual font selection and text rendering require a browser runtime."
        if findings
        else "No material issue was found in the bounded static font-loading surface."
    )
    return FontLoadingAnalyzerResponse(
        requested_url=page.requested_url,
        final_url=page.final_url,
        status_code=page.status_code,
        content_type=page.content_type,
        stylesheet_count=len(resolved_stylesheets),
        checked_stylesheet_count=checked_stylesheets,
        font_face_count=len(all_faces),
        family_count=len(family_names),
        font_source_count=len(all_sources),
        unique_font_source_count=len(unique_source_urls),
        checked_font_source_count=len(assets),
        local_source_count=local_source_count,
        preload_count=len(document.font_preloads),
        matched_preload_count=sum(1 for item in preload_items if item.matches_discovered_font),
        missing_font_display_count=missing_display_count,
        blocking_font_display_count=blocking_display_count,
        swap_or_optional_count=swap_or_optional_count,
        cross_host_font_count=sum(
            1 for url in unique_source_urls if _same_host(url, page.final_url) is False
        ),
        woff2_source_count=woff2_source_count,
        duplicate_source_count=duplicate_source_count,
        known_declared_bytes=known_declared_bytes,
        unknown_size_count=sum(1 for asset in assets if asset.declared_bytes is None),
        failed_font_count=failed_font_count,
        issue_count=(
            sum(len(face.issues) for face in all_faces)
            + sum(len(asset.issues) for asset in assets)
            + sum(len(item.issues) for item in preload_items)
            + len(findings)
        ),
        faces=tuple(all_faces[:_MAX_ITEMS]),
        assets=tuple(assets),
        preloads=tuple(preload_items),
        findings=tuple(findings),
        redirect_count=len(page.redirect_chain),
        truncated=truncated,
        status="warning" if findings else "pass",
        recommendation=recommendation,
    )
